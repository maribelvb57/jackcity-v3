"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { SiteNavbar } from "@/components/site-navbar"
import { SearchSummaryBar } from "@/components/search-summary-bar"
import { formatClp } from "@/lib/format"
import { getQuote } from "@/lib/api/quotes"
import { confirmBooking } from "@/lib/api/bookings"
import { BookingExpiredError, createWebpayPayment } from "@/lib/api/payments"
import { redirectToWebpay } from "@/lib/webpay"
import { validateEmail, getCustomerProfile, type CustomerProfile } from "@/lib/api/customers"
import { PET_SIZE_LABEL, type PetSize } from "@/lib/api/hotels"
import { getTransportCommuneByCode } from "@/config/transport-communes"
import {
  User,
  Mail,
  Phone,
  MapPin,
  PawPrint,
  AlertCircle,
  ChevronDown,
  Minus,
  Plus,
  Check,
  Info,
  LockKeyhole,
  Building2,
  ShieldCheck,
  Home,
  CalendarDays,
  Car,
  CreditCard,
  Hotel,
} from "lucide-react"
import { slotTime } from "@/lib/transport-slots"
import { useClerk, useUser } from "@clerk/nextjs"

const COUNTRY_CODES = [
  { code: "+56", country: "CL" },
  { code: "+54", country: "AR" },
  { code: "+51", country: "PE" },
  { code: "+57", country: "CO" },
  { code: "+52", country: "MX" },
]

const PET_COLORS = ["Negro", "Blanco", "Marrón", "Dorado", "Gris", "Manchado", "Otro"]
const PAY_NOW_PERCENTAGE = 0.3

interface PetData {
  petId: string | null
  name: string
  breed: string
  size: string
  gender: string
  weight: string
  color: string
  age: number
}

type GoogleAddressComponent = {
  long_name: string
  short_name: string
  types: string[]
}

type GooglePlaceResult = {
  address_components?: GoogleAddressComponent[]
  geometry?: unknown
  name?: string
}

type GoogleMapsAutocomplete = {
  addListener: (eventName: "place_changed", handler: () => void) => { remove: () => void }
  getPlace: () => GooglePlaceResult
}

type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      places?: {
        Autocomplete: new (
          input: HTMLInputElement,
          options: {
            componentRestrictions?: { country: string }
            fields: string[]
            types: string[]
          }
        ) => GoogleMapsAutocomplete
      }
      event?: {
        clearInstanceListeners: (instance: GoogleMapsAutocomplete) => void
      }
    }
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-places-script"
let googleMapsScriptPromise: Promise<void> | null = null

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  const googleWindow = window as GoogleMapsWindow
  if (googleWindow.google?.maps?.places) return Promise.resolve()
  if (googleMapsScriptPromise) return googleMapsScriptPromise

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true })
      existingScript.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps.")), { once: true })
      return
    }
    const script = document.createElement("script")
    const params = new URLSearchParams({ key: apiKey, libraries: "places", language: "es", region: "CL" })
    script.id = GOOGLE_MAPS_SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true
    script.defer = true
    script.addEventListener("load", () => resolve(), { once: true })
    script.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps.")), { once: true })
    document.head.appendChild(script)
  })
  return googleMapsScriptPromise
}

function getAddressComponent(place: GooglePlaceResult, componentType: string, shortName = false): string {
  const component = place.address_components?.find((item) => item.types.includes(componentType))
  if (!component) return ""
  return shortName ? component.short_name : component.long_name
}

function parseGoogleAddress(place: GooglePlaceResult) {
  const streetNumber = getAddressComponent(place, "street_number", true)
  const route = getAddressComponent(place, "route")
  const commune =
    getAddressComponent(place, "administrative_area_level_3") ||
    getAddressComponent(place, "locality") ||
    getAddressComponent(place, "sublocality_level_1") ||
    getAddressComponent(place, "sublocality")
  const city =
    getAddressComponent(place, "administrative_area_level_2") ||
    getAddressComponent(place, "locality") ||
    commune
  const displayAddress = [route, streetNumber].filter(Boolean).join(" ") || place.name || ""
  return {
    displayAddress,
    street: route || place.name || "",
    streetNumber,
    commune,
    city,
    country: getAddressComponent(place, "country"),
  }
}

function normalizeCommuneName(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim()
}

function cleanRut(value: string) {
  return value.replace(/[^0-9kK]/g, "").toUpperCase()
}

function isValidChileRut(value: string) {
  const cleanedRut = cleanRut(value)
  if (cleanedRut.length < 2) return false
  const body = cleanedRut.slice(0, -1)
  const verifier = cleanedRut.slice(-1)
  if (!/^\d+$/.test(body)) return false
  let sum = 0
  let multiplier = 2
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  const remainder = 11 - (sum % 11)
  const expectedVerifier = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder)
  return verifier === expectedVerifier
}

function formatChileRut(value: string) {
  const cleanedRut = cleanRut(value)
  if (cleanedRut.length < 2) return value
  const body = cleanedRut.slice(0, -1)
  const verifier = cleanedRut.slice(-1)
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${verifier}`
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

interface PetFormProps {
  pet: PetData
  index: number
  pets: PetData[]
  updatePet: (index: number, field: keyof PetData, value: string | number) => void
  incrementAge: (index: number) => void
  decrementAge: (index: number) => void
}

function PetForm({ pet, index, pets, updatePet, incrementAge, decrementAge }: PetFormProps) {
  return (
    <div className="flex flex-col gap-3">
      {pets.filter(p => !p.petId).length > 1 && (
        <p className="text-xs font-semibold" style={{ color: "#6B7280" }}>Mascota {index + 1}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Nombre</label>
          <input type="text" value={pet.name} onChange={(e) => updatePet(index, "name", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
            style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Nombre mascota" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Raza</label>
          <input type="text" value={pet.breed} readOnly
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#0A1830" }} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Tamaño</label>
          <input type="text" value={pet.size} readOnly
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#0A1830" }} />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Género</label>
          <div className="px-4 py-2.5 rounded-xl border flex items-center gap-4" style={{ borderColor: "#E5E7EB" }}>
            {["Macho", "Hembra"].map((g) => (
              <label key={g} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={`gender-${index}`} value={g}
                  checked={pet.gender === g} onChange={(e) => updatePet(index, "gender", e.target.value)}
                  className="w-4 h-4 cursor-pointer accent-[#0A1830]" />
                <span className="text-sm" style={{ color: "#0A1830" }}>{g}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
            Peso <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
          </label>
          <div className="relative">
            <input type="text" inputMode="decimal" value={pet.weight}
              onChange={(e) => updatePet(index, "weight", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 pr-12"
              style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="0" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#9CA3AF" }}>kg</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
            Color <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
          </label>
          <div className="relative">
            <select value={pet.color} onChange={(e) => updatePet(index, "color", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 appearance-none cursor-pointer"
              style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
              <option value="">Seleccionar color</option>
              {PET_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
            Edad <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
          </label>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => decrementAge(index)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:bg-gray-50"
              style={{ borderColor: "#E5E7EB" }}>
              <Minus size={16} style={{ color: "#0A1830" }} />
            </button>
            <div className="flex-1 h-10 flex items-center justify-center rounded-xl border text-sm font-semibold"
              style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
              {pet.age === 0 ? "—" : `${pet.age} año${pet.age !== 1 ? "s" : ""}`}
            </div>
            <button type="button" onClick={() => incrementAge(index)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:bg-gray-50"
              style={{ borderColor: "#E5E7EB" }}>
              <Plus size={16} style={{ color: "#0A1830" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConfirmationContent() {
  const router = useRouter()
  const { quoteId } = useParams<{ quoteId: string }>()
  const { openSignIn } = useClerk()
  const { user: clerkUser, isSignedIn } = useUser()
  const addressInputRef = useRef<HTMLInputElement | null>(null)

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ["quote", quoteId],
    queryFn: () => getQuote(quoteId),
    enabled: !!quoteId,
  })

  // User form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [emailAccountExists, setEmailAccountExists] = useState(false)
  const [isValidatingEmail, setIsValidatingEmail] = useState(false)
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [saveData, setSaveData] = useState(false)
  const [commune, setCommune] = useState("")
  const [address, setAddress] = useState("")       // valor visible en el input (calle + número)
  const [streetName, setStreetName] = useState("") // solo la calle, para el payload
  const [streetNumber, setStreetNumber] = useState("")
  const [apartment, setApartment] = useState("")
  const [addressReference, setAddressReference] = useState("")
  const [addressSelectedFromGoogle, setAddressSelectedFromGoogle] = useState(false)
  const [addressAutocompleteError, setAddressAutocompleteError] = useState("")
  const [savedAddresses, setSavedAddresses] = useState<CustomerProfile["addresses"]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [savedPets, setSavedPets] = useState<CustomerProfile["pets"]>([])
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([])
  const [hasInteractedWithPets, setHasInteractedWithPets] = useState(false)
  const [rut, setRut] = useState("")
  const [countryCode, setCountryCode] = useState("+56")
  const [phone, setPhone] = useState("")

  // Pets state — initialized when quote loads
  const [pets, setPets] = useState<PetData[]>([])
  const [petsInitialized, setPetsInitialized] = useState(false)
  useEffect(() => {
    if (quote && !petsInitialized) {
      setPets(quote.pets.map((p) => ({
        petId: p.id ?? null,
        name: "",
        breed: p.breed,
        size: PET_SIZE_LABEL[p.size as PetSize] ?? p.size,
        gender: "",
        weight: "",
        color: "",
        age: 0,
      })))
      setPetsInitialized(true)
    }
  }, [quote, petsInitialized])

  // Pre-fill personal data and load saved addresses when user logs in
  useEffect(() => {
    if (!isSignedIn || !clerkUser?.id) return
    getCustomerProfile(clerkUser.id).then((profile) => {
      const { firstName: fn, lastName: ln, email: em, phone: ph, rut: rt } = profile.user
      if (fn) setFirstName(fn)
      if (ln) setLastName(ln)
      if (em) setEmail(em)
      if (rt) setRut(rt)
      if (ph) {
        const match = COUNTRY_CODES.find((cc) => ph.startsWith(cc.code))
        if (match) {
          setCountryCode(match.code)
          setPhone(ph.slice(match.code.length))
        } else {
          setPhone(ph)
        }
      }
      if (profile.addresses.length > 0) {
        setSavedAddresses(profile.addresses)
      }
      const activePets = profile.pets.filter(p => p.active)
      if (activePets.length > 0) {
        setSavedPets(activePets)
      }
    }).catch(() => {
      // si falla no bloqueamos el flujo, el usuario puede llenar manualmente
    })
  }, [isSignedIn, clerkUser?.id])

  // Auto-select saved pets based on quote pet ids
  useEffect(() => {
    if (!isSignedIn || savedPets.length === 0 || !quote) return
    const idsFromQuote = quote.pets.map(p => p.id).filter((id): id is string => !!id)
    if (idsFromQuote.length === 0) return
    const validIds = idsFromQuote.filter(id => savedPets.some(p => String(p.id) === String(id)))
    if (validIds.length === 0) return
    setSelectedPetIds(prev => {
      const toAdd = validIds.map(String).filter(id => !prev.includes(id))
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev
    })
  }, [savedPets, quote, isSignedIn])

  // Sync selected saved pets → pets state for payload
  useEffect(() => {
    if (!quote || !isSignedIn || savedPets.length === 0) return
    if (selectedPetIds.length === 0) {
      setPets(quote.pets.map((p) => ({
        petId: null, name: "", breed: p.breed,
        size: PET_SIZE_LABEL[p.size as PetSize] ?? p.size,
        gender: "", weight: "", color: "", age: 0,
      })))
      return
    }
    const selected = savedPets.filter(p => selectedPetIds.includes(p.id))
    const remaining = [...selected]
    setPets(quote.pets.map((quotePet) => {
      const idx = remaining.findIndex(p => p.size === quotePet.size)
      if (idx >= 0) {
        const sp = remaining.splice(idx, 1)[0]
        return {
          petId: sp.id,
          name: sp.name,
          breed: sp.breed,
          size: PET_SIZE_LABEL[sp.size as PetSize] ?? sp.size,
          gender: sp.gender === "MALE" ? "Macho" : sp.gender === "FEMALE" ? "Hembra" : sp.gender,
          weight: sp.weight?.toString() ?? "",
          color: sp.color ?? "",
          age: sp.age ?? 0,
        }
      }
      return { petId: null, name: "", breed: quotePet.breed, size: PET_SIZE_LABEL[quotePet.size as PetSize] ?? quotePet.size, gender: "", weight: "", color: "", age: 0 }
    }))
  }, [selectedPetIds, savedPets, quote, isSignedIn])

  // Transport
  const [selectedDeparture, setSelectedDeparture] = useState<string | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<string | null>(null)

  // Conditions
  const [vaccinesUpToDate, setVaccinesUpToDate] = useState(false)
  const [isCastrated, setIsCastrated] = useState(false)
  const [notInHeat, setNotInHeat] = useState(false)

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)

  // Derived values from quote
  const includeTransport = quote?.needsTransport ?? false
  const quotedTransportCommune = getTransportCommuneByCode(quote?.transportCommune ?? "")?.commune ?? quote?.transportCommune ?? ""
  const transportFrom = quotedTransportCommune ? `Comuna ${quotedTransportCommune}` : ""

  const checkinDate = quote ? new Date(`${quote.checkinDate}T12:00:00`) : null
  const checkoutDate = quote ? new Date(`${quote.checkoutDate}T12:00:00`) : null
  const nights = checkinDate && checkoutDate
    ? Math.round((checkoutDate.getTime() - checkinDate.getTime()) / 86400000)
    : 1

  const accommodationPrice = quote?.pricing.bookingPrice ?? 0
  const transportPrice = includeTransport ? (quote?.pricing.transportPrice ?? 0) : 0
  const totalPrice = includeTransport
    ? (quote?.pricing.totalPrice ?? accommodationPrice + transportPrice)
    : accommodationPrice
  const payNowAccommodationPrice = Math.round(accommodationPrice * PAY_NOW_PERCENTAGE)
  const payNowPrice = payNowAccommodationPrice + transportPrice
  const payAtHotelPrice = accommodationPrice - payNowAccommodationPrice

  const petCountLabel = `${pets.length} ${pets.length === 1 ? "mascota" : "mascotas"}`
  const quotedPetSizesLabel = pets.map((p) => p.size).filter(Boolean).join(", ")

  const selectedAddressCommuneMatchesQuote =
    !includeTransport ||
    !addressSelectedFromGoogle ||
    normalizeCommuneName(commune) === normalizeCommuneName(quotedTransportCommune)

  const rutHasValue = cleanRut(rut).length > 0
  const rutIsValid = rutHasValue && isValidChileRut(rut)
  const emailHasValue = email.trim().length > 0
  const emailIsValid = emailHasValue && isValidEmail(email)
  const transportSlotsSelected = !includeTransport || (!!selectedDeparture && !!selectedReturn)
  const hasCompleteAddress = address.trim().length > 0 && commune.trim().length > 0 && city.trim().length > 0 && country.trim().length > 0

  const matchingAddresses = isSignedIn && savedAddresses.length > 0
    ? (includeTransport
        ? savedAddresses.filter(a => normalizeCommuneName(a.commune) === normalizeCommuneName(quotedTransportCommune))
        : savedAddresses)
    : []
  const nonMatchingAddresses = isSignedIn && savedAddresses.length > 0 && includeTransport
    ? savedAddresses.filter(a => normalizeCommuneName(a.commune) !== normalizeCommuneName(quotedTransportCommune))
    : []
  const hasNoMatchingAddresses = isSignedIn && savedAddresses.length > 0 && includeTransport && matchingAddresses.length === 0

  const requiredSizes = quote?.pets.map(p => p.size) ?? []
  const savedPetsActive = isSignedIn && savedPets.length > 0
  const isSinglePet = (quote?.pets.length ?? 1) === 1
  const isMultiPetBooking = !isSinglePet
  const anyPetHasId = (quote?.pets ?? []).some(p => !!p.id)

  const petSelectionErrorMsg = (() => {
    if (!savedPetsActive || anyPetHasId || !isMultiPetBooking || !hasInteractedWithPets) return null
    const needed = quote?.pets.length ?? 0
    if (selectedPetIds.length < needed) {
      const missing = needed - selectedPetIds.length
      return `Selecciona ${missing} mascota${missing > 1 ? "s" : ""} más para completar la reserva`
    }
    const reqCount = (quote?.pets ?? []).reduce<Record<string, number>>(
      (a, p) => ({ ...a, [p.size]: (a[p.size] ?? 0) + 1 }), {}
    )
    const selPets = savedPets.filter(p => selectedPetIds.includes(p.id))
    const selCount = selPets.reduce<Record<string, number>>(
      (a, p) => ({ ...a, [p.size]: (a[p.size] ?? 0) + 1 }), {}
    )
    const matches = JSON.stringify(Object.entries(selCount).sort()) === JSON.stringify(Object.entries(reqCount).sort())
    if (!matches) {
      const needed = Object.entries(reqCount)
        .map(([size, count]) => `${count} ${PET_SIZE_LABEL[size as PetSize] ?? size}`)
        .join(", ")
      return `Las mascotas seleccionadas no coinciden con los tamaños de la reserva (necesitas: ${needed})`
    }
    return null
  })()

  const petsMatchQuote = !savedPetsActive || anyPetHasId || isSinglePet || (() => {
    const reqCount = (quote?.pets ?? []).reduce<Record<string, number>>(
      (a, p) => ({ ...a, [p.size]: (a[p.size] ?? 0) + 1 }), {}
    )
    const selPets = savedPets.filter(p => selectedPetIds.includes(p.id))
    const selCount = selPets.reduce<Record<string, number>>(
      (a, p) => ({ ...a, [p.size]: (a[p.size] ?? 0) + 1 }), {}
    )
    return JSON.stringify(Object.entries(selCount).sort()) === JSON.stringify(Object.entries(reqCount).sort())
  })()

  const canPay = allConditionsAccepted() && hasCompleteAddress && selectedAddressCommuneMatchesQuote && rutIsValid && emailIsValid && !emailAccountExists && transportSlotsSelected && petsMatchQuote

  function allConditionsAccepted() {
    return vaccinesUpToDate && isCastrated && notInHeat
  }

  const updatePet = (index: number, field: keyof PetData, value: string | number) => {
    if (field === "breed" || field === "size") return
    const newPets = [...pets]
    newPets[index] = { ...newPets[index], [field]: value }
    setPets(newPets)
  }

  const incrementAge = (index: number) => {
    const newPets = [...pets]
    newPets[index].age = Math.min(newPets[index].age + 1, 25)
    setPets(newPets)
  }

  const decrementAge = (index: number) => {
    const newPets = [...pets]
    newPets[index].age = Math.max(newPets[index].age - 1, 0)
    setPets(newPets)
  }

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    const input = addressInputRef.current
    if (!apiKey || !input) return

    let autocomplete: GoogleMapsAutocomplete | null = null
    let listener: { remove: () => void } | null = null
    let isMounted = true

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!isMounted) return
        const googleWindow = window as GoogleMapsWindow
        const Autocomplete = googleWindow.google?.maps?.places?.Autocomplete
        if (!Autocomplete) {
          setAddressAutocompleteError("No se pudo iniciar el autocompletado de direcciones.")
          return
        }
        autocomplete = new Autocomplete(input, {
          componentRestrictions: { country: "cl" },
          fields: ["address_components", "geometry", "name"],
          types: ["address"],
        })
        listener = autocomplete.addListener("place_changed", () => {
          if (!autocomplete) return
          const place = autocomplete.getPlace()
          if (!place.geometry) { setAddressSelectedFromGoogle(false); return }
          const parsed = parseGoogleAddress(place)
          setAddress(parsed.displayAddress)
          setStreetName(parsed.street)
          setStreetNumber(parsed.streetNumber)
          setCommune(parsed.commune)
          setCity(parsed.city)
          setCountry(parsed.country)
          setAddressSelectedFromGoogle(true)
          setAddressAutocompleteError("")
        })
      })
      .catch(() => {
        if (isMounted) setAddressAutocompleteError("No se pudo cargar el autocompletado de direcciones.")
      })

    return () => {
      isMounted = false
      listener?.remove()
      if (autocomplete) {
        const googleWindow = window as GoogleMapsWindow
        googleWindow.google?.maps?.event?.clearInstanceListeners(autocomplete)
      }
    }
  }, [quote])

  const handleEmailBlur = async () => {
    if (!emailIsValid) return
    setIsValidatingEmail(true)
    try {
      const status = await validateEmail(email.trim())
      setEmailAccountExists(status === "ACCOUNT_EXISTS")
    } catch {
      // si falla la validación dejamos pasar, el backend lo rechazará si corresponde
    } finally {
      setIsValidatingEmail(false)
    }
  }

  const handleConfirm = async () => {
    if (!quote) return
    setIsSubmitting(true)
    setSubmitError(false)
    try {
      const weightParsed = (weight: string) => {
        const n = parseFloat(weight)
        return isNaN(n) ? undefined : n
      }
      const GENDER_MAP: Record<string, string> = { Macho: "MALE", Hembra: "FEMALE" }

      const payload = {
        quoteId: quote.quoteId,
        user: {
          userId: null,
          firstName,
          lastName,
          email,
          phone: `${countryCode}${phone}`,
          rut,
          saveUserData: saveData,
          address: {
            street: streetName || address,
            ...(streetNumber.trim() && { number: streetNumber.trim() }),
            ...(apartment.trim() && { apartment: apartment.trim() }),
            commune,
            city,
            country,
            ...(addressReference.trim() && { reference: addressReference.trim() }),
          },
        },
        pets: pets.map((pet, i) => ({
          id: pet.petId ?? null,
          breed: quote.pets[i]?.breed ?? pet.breed,
          size: quote.pets[i]?.size ?? pet.size,
          name: pet.name,
          gender: GENDER_MAP[pet.gender] ?? pet.gender,
          ...(weightParsed(pet.weight) !== undefined && { weight: weightParsed(pet.weight) }),
          ...(pet.color && { color: pet.color }),
          ...(pet.age > 0 && { age: pet.age }),
        })),
        ...(includeTransport && selectedDeparture && selectedReturn && {
          transport: {
            departureSlot: selectedDeparture,
            returnSlot: selectedReturn,
          },
        }),
      }
      console.log("confirmBooking payload:", JSON.stringify(payload, null, 2))

      const { bookingId, voucherToken } = await confirmBooking({
        quoteId: quote.quoteId,
        user: {
          userId: null,
          firstName,
          lastName,
          email,
          phone: `${countryCode}${phone}`,
          rut,
          saveUserData: saveData,
          address: {
            street: streetName || address,
            ...(streetNumber.trim() && { number: streetNumber.trim() }),
            ...(apartment.trim() && { apartment: apartment.trim() }),
            commune,
            city,
            country,
            ...(addressReference.trim() && { reference: addressReference.trim() }),
          },
        },
        pets: pets.map((pet, i) => ({
          id: pet.petId ?? null,
          breed: quote.pets[i]?.breed ?? pet.breed,
          size: quote.pets[i]?.size ?? pet.size,
          name: pet.name,
          gender: GENDER_MAP[pet.gender] ?? pet.gender,
          ...(weightParsed(pet.weight) !== undefined && { weight: weightParsed(pet.weight) }),
          ...(pet.color && { color: pet.color }),
          ...(pet.age > 0 && { age: pet.age }),
        })),
        ...(includeTransport && selectedDeparture && selectedReturn && {
          transport: {
            departureSlot: selectedDeparture,
            returnSlot: selectedReturn,
          },
        }),
      })

      sessionStorage.setItem("jc_voucher_token", voucherToken)
      const { token, url } = await createWebpayPayment(bookingId)
      redirectToWebpay(url, token)
    } catch (error) {
      if (error instanceof BookingExpiredError) {
        router.push("/booking/confirmation/error?retryable=false&reason=expired")
        return
      }
      setSubmitError(true)
      setIsSubmitting(false)
    }
  }

  const togglePetSelection = (petId: string) => {
    setHasInteractedWithPets(true)
    const isSinglePet = (quote?.pets.length ?? 1) === 1
    if (isSinglePet) {
      setSelectedPetIds(prev => prev[0] === petId ? [] : [petId])
    } else {
      const maxPets = quote?.pets.length ?? 0
      setSelectedPetIds(prev => {
        if (prev.includes(petId)) return prev.filter(id => id !== petId)
        if (prev.length >= maxPets) return prev
        return [...prev, petId]
      })
    }
  }

  const selectSavedAddress = (addr: CustomerProfile["addresses"][number]) => {
    setSelectedAddressId(addr.id)
    setAddress([addr.street, addr.number].filter(Boolean).join(" "))
    setStreetName(addr.street)
    setStreetNumber(addr.number ?? "")
    setApartment(addr.apartment ?? "")
    setAddressReference(addr.reference ?? "")
    setCommune(addr.commune)
    setCity(addr.city)
    setCountry(addr.country)
    setAddressSelectedFromGoogle(true)
    setAddressAutocompleteError("")
  }

  const summaryData = {
    city: "Santiago",
    dateFrom: checkinDate ? format(checkinDate, "d MMM", { locale: es }) : "—",
    dateTo: checkoutDate ? format(checkoutDate, "d MMM", { locale: es }) : "—",
    petCount: pets.length || (quote?.pets.length ?? 1),
    withTransport: includeTransport,
  }

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />

        <SearchSummaryBar
          data={summaryData}
          onChangeClick={() => router.push("/")}
        />

        {isLoading && (
          <div className="px-6 py-10 text-sm font-medium" style={{ color: "#0A1830" }}>
            Cargando tu reserva...
          </div>
        )}

        {isError && (
          <div className="px-6 py-10 text-sm font-medium" style={{ color: "#8A1C1C" }}>
            No pudimos cargar los datos de tu reserva. Intenta nuevamente.
          </div>
        )}

        {/* Main content */}
        {quote && (
          <div className="w-full px-4 pb-4 md:px-6 md:pb-6 pt-4">
            <div className="flex flex-col lg:flex-row gap-4">

              {/* Left column — 25% */}
              <div className="flex flex-col gap-4 lg:w-1/4 order-1 lg:order-1">

                {/* Hotel photo + name */}
                <div className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
                  {quote.hotel.mainPhotoUrl ? (
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={quote.hotel.mainPhotoUrl}
                        alt={quote.hotel.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] w-full bg-gray-100" />
                  )}
                  <div className="p-3">
                    <h3 className="font-bold text-sm" style={{ color: "#0A1830" }}>{quote.hotel.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={12} style={{ color: "#6B7280" }} />
                      <span className="text-xs" style={{ color: "#6B7280" }}>{quote.hotel.commune}</span>
                    </div>
                  </div>
                </div>

                {/* Reservation summary */}
                <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                  <h3 className="font-bold text-sm mb-3" style={{ color: "#0A1830" }}>Resumen Reserva</h3>
                  <ul className="flex flex-col gap-1.5 text-xs" style={{ color: "#555" }}>
                    <li>{petCountLabel}{quotedPetSizesLabel ? `, ${quotedPetSizesLabel}` : ""}</li>
                    <li>
                      {nights} {nights === 1 ? "noche" : "noches"}
                      {checkinDate && checkoutDate && (
                        <span>
                          {" "}({format(checkinDate, "d MMM", { locale: es })} - {format(checkoutDate, "d MMM", { locale: es })})
                        </span>
                      )}
                    </li>
                    {includeTransport && <li>Transporte incluido</li>}
                  </ul>
                </div>

                {/* Hotel conditions */}
                {quote.hotel.policies.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                    <h3 className="font-bold text-sm mb-3" style={{ color: "#0A1830" }}>Condiciones del Hotel</h3>
                    <ul className="flex flex-col gap-2">
                      {quote.hotel.policies.map((policy, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs" style={{ color: "#555" }}>
                          <AlertCircle size={14} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                          {policy.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cancellation policy */}
                <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                  <h3 className="font-bold text-sm mb-3" style={{ color: "#0A1830" }}>Política de Cancelación</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "#555" }}>
                    Cancelación gratuita hasta 48 horas antes del check-in. Después de ese plazo se cobra el 50% de la reserva.
                  </p>
                </div>
              </div>

              {/* Right column — 75% */}
              <div className="flex flex-col gap-4 lg:w-3/4 order-2 lg:order-2">

                <h1 className="text-2xl md:text-3xl font-bold mt-6" style={{ color: "#0A1830" }}>
                  Confirmación de Reserva
                </h1>

                {/* Login button / greeting */}
                {isSignedIn ? (
                  <p className="text-base font-semibold" style={{ color: "#0A1830" }}>
                    ¡Hola, {clerkUser?.firstName ?? firstName}!
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => openSignIn()}
                    className="w-full sm:w-auto self-start flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm border-2 transition-colors hover:bg-gray-50"
                    style={{ borderColor: "#0A1830", color: "#0A1830" }}
                  >
                    <User size={16} />
                    Inicia Sesión
                  </button>
                )}

                {/* Personal data */}
                <div className="bg-white rounded-2xl p-5 border overflow-hidden" style={{ borderColor: "#E5E7EB" }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: "#0A1830" }}>Datos personales</h2>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Nombre Tutor</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                            style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Nombre" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Apellidos</label>
                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                          style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Apellidos" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Email</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                        <input type="email" value={email}
                          onChange={(e) => { setEmail(e.target.value); setEmailAccountExists(false) }}
                          onBlur={handleEmailBlur}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                          style={{ borderColor: (emailHasValue && !emailIsValid) || emailAccountExists ? "#F59E0B" : "#E5E7EB", color: "#0A1830" }}
                          placeholder="correo@ejemplo.com" />
                      </div>
                      {emailHasValue && !emailIsValid && (
                        <p className="mt-1.5 text-xs" style={{ color: "#B45309" }}>Ingresa un email válido.</p>
                      )}
                      {isValidatingEmail && (
                        <p className="mt-1.5 text-xs" style={{ color: "#6B7280" }}>Verificando correo...</p>
                      )}
                      {emailAccountExists && (
                        <div className="mt-2 rounded-xl border px-4 py-3" style={{ backgroundColor: "#FFFBEB", borderColor: "#F59E0B" }}>
                          <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
                            Este correo ya está asociado a una cuenta JackCity.
                          </p>
                          <p className="mt-0.5 text-sm" style={{ color: "#92400E" }}>
                            Para proteger tus reservas, por favor inicia sesión o usa otro correo.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Teléfono</label>
                        <div className="flex gap-2">
                          <div className="relative w-24 flex-shrink-0">
                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                            <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                              className="w-full pl-9 pr-2 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 appearance-none cursor-pointer"
                              style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
                              {COUNTRY_CODES.map((cc) => (
                                <option key={cc.code} value={cc.code}>{cc.code}</option>
                              ))}
                            </select>
                          </div>
                          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                            style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="940302010" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>RUT</label>
                        <input type="text" value={rut}
                          onChange={(e) => setRut(e.target.value)}
                          onBlur={() => { if (rutHasValue) setRut(formatChileRut(rut)) }}
                          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                          style={{ borderColor: rutHasValue && !rutIsValid ? "#F59E0B" : "#E5E7EB", color: "#0A1830" }}
                          placeholder="12.345.678-9" inputMode="text" />
                        {rutHasValue && !rutIsValid && (
                          <p className="mt-1.5 text-xs" style={{ color: "#B45309" }}>Ingresa un RUT chileno válido.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pets */}
                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#0A1830" }}>
                      <PawPrint size={20} style={{ color: "#0A1830" }} />
                      Mi(s) Mascota(s)
                    </h2>
                  </div>

                  {anyPetHasId ? (
                    // Cases 2 & 4: some/all pets identified → cards + optional forms
                    <>
                      <div className="flex flex-col gap-3 mt-3">
                        {savedPets.filter(p => selectedPetIds.includes(String(p.id))).map((pet) => (
                          <div key={pet.id} className="flex items-start gap-3 px-4 py-4 rounded-xl border"
                            style={{ borderColor: "#FFC43D", backgroundColor: "#FFFBF0" }}>
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: "#F3F4F6" }}>
                              <PawPrint size={26} style={{ color: "#0A1830" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-bold mb-2" style={{ color: "#0A1830" }}>{pet.name}</p>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                                <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Raza</p><p className="text-sm" style={{ color: "#0A1830" }}>{pet.breed}</p></div>
                                <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Tamaño</p><p className="text-sm" style={{ color: "#0A1830" }}>{PET_SIZE_LABEL[pet.size as PetSize] ?? pet.size}</p></div>
                                <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Género</p><p className="text-sm" style={{ color: "#0A1830" }}>{pet.gender === "MALE" ? "Macho" : pet.gender === "FEMALE" ? "Hembra" : "—"}</p></div>
                                <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Peso</p><p className="text-sm" style={{ color: "#0A1830" }}>{pet.weight ? `${pet.weight} kg` : "—"}</p></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Forms for unidentified pets in the same booking */}
                      {pets.some(p => !p.petId) && (
                        <div className="flex flex-col gap-6 mt-4">
                          {pets.map((pet, index) => !pet.petId ? (
                            <PetForm key={index} pet={pet} index={index} pets={pets} updatePet={updatePet} incrementAge={incrementAge} decrementAge={decrementAge} />
                          ) : null)}
                        </div>
                      )}
                      <p className="mt-3 text-xs" style={{ color: "#9CA3AF" }}>
                        ¿Quieres cambiar {isSinglePet ? "la mascota" : "las mascotas"}?{" "}
                        <Link href="/" className="underline underline-offset-2 hover:opacity-75">Vuelve al inicio</Link>
                      </p>
                    </>
                  ) : savedPetsActive && isMultiPetBooking ? (
                    // Case 5: multi-pet, logged in, no ids → selection list
                    <>
                      <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
                        Selecciona {quote.pets.length === 1 ? "la mascota" : `las ${quote.pets.length} mascotas`} para esta reserva.
                      </p>
                      <p className="text-sm font-bold mb-3" style={{ color: "#0A1830" }}>Mascotas guardadas</p>

                      {/* Selectable pets */}
                      <div className="flex flex-col gap-3">
                        {savedPets.filter(p => requiredSizes.includes(p.size)).map((pet) => {
                          const isSelected = selectedPetIds.includes(pet.id)
                          const isAtMax = selectedPetIds.length >= (quote.pets.length)
                          const isDisabled = !isSelected && isAtMax
                          const isSinglePet = quote.pets.length === 1
                          return (
                            <button
                              key={pet.id}
                              type="button"
                              onClick={() => !isDisabled && togglePetSelection(pet.id)}
                              className="flex items-start gap-3 px-4 py-4 rounded-xl border text-left w-full transition-colors"
                              style={{
                                borderColor: isSelected ? "#FFC43D" : "#E5E7EB",
                                backgroundColor: isSelected ? "#FFFBF0" : "#fff",
                                opacity: isDisabled ? 0.5 : 1,
                                cursor: isDisabled ? "not-allowed" : "pointer",
                              }}
                            >
                              {/* Radio / Checkbox */}
                              {isSinglePet ? (
                                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1"
                                  style={{ borderColor: isSelected ? "#FFC43D" : "#D1D5DB" }}>
                                  {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#FFC43D" }} />}
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1"
                                  style={{ borderColor: isSelected ? "#FFC43D" : "#D1D5DB", backgroundColor: isSelected ? "#FFC43D" : "transparent" }}>
                                  {isSelected && <Check size={12} style={{ color: "#0A1830" }} strokeWidth={3} />}
                                </div>
                              )}
                              {/* Icon */}
                              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: "#F3F4F6" }}>
                                <PawPrint size={26} style={{ color: "#0A1830" }} />
                              </div>
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-bold mb-2" style={{ color: "#0A1830" }}>{pet.name}</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                                  <div>
                                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Raza</p>
                                    <p className="text-sm" style={{ color: "#0A1830" }}>{pet.breed}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Tamaño</p>
                                    <p className="text-sm" style={{ color: "#0A1830" }}>{PET_SIZE_LABEL[pet.size as PetSize] ?? pet.size}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Género</p>
                                    <p className="text-sm" style={{ color: "#0A1830" }}>{pet.gender === "MALE" ? "Macho" : pet.gender === "FEMALE" ? "Hembra" : "—"}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Peso</p>
                                    <p className="text-sm" style={{ color: "#0A1830" }}>{pet.weight ? `${pet.weight} kg` : "—"}</p>
                                  </div>
                                  {(pet.color || pet.age) && (
                                    <>
                                      <div>
                                        <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Color</p>
                                        <p className="text-sm" style={{ color: "#0A1830" }}>{pet.color ?? "—"}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Edad</p>
                                        <p className="text-sm" style={{ color: "#0A1830" }}>{pet.age ? `${pet.age} año${pet.age !== 1 ? "s" : ""}` : "—"}</p>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </button>
                          )
                        })}
                      </div>

                      {/* Inline error for multi-pet size/count mismatch */}
                      {petSelectionErrorMsg && (
                        <div className="mt-2 flex items-start gap-2 rounded-xl border px-4 py-3" style={{ backgroundColor: "#FFFBEB", borderColor: "#F59E0B" }}>
                          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#B45309" }} />
                          <p className="text-sm" style={{ color: "#92400E" }}>{petSelectionErrorMsg}</p>
                        </div>
                      )}

                      {/* Unselectable pets (size mismatch) */}
                      {savedPets.some(p => !requiredSizes.includes(p.size)) && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold mb-2" style={{ color: "#9CA3AF" }}>
                            Tamaño no disponible para la reserva que seleccionaste
                          </p>
                          <div className="flex flex-col gap-3">
                            {savedPets.filter(p => !requiredSizes.includes(p.size)).map((pet) => (
                              <div
                                key={pet.id}
                                className="flex items-start gap-3 px-4 py-4 rounded-xl border text-left w-full"
                                style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB", opacity: 0.6 }}
                              >
                                <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1" style={{ borderColor: "#D1D5DB" }} />
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{ backgroundColor: "#EFEFEF" }}>
                                  <PawPrint size={26} style={{ color: "#9CA3AF" }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-bold mb-2" style={{ color: "#6B7280" }}>{pet.name}</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                                    <div>
                                      <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Raza</p>
                                      <p className="text-sm" style={{ color: "#6B7280" }}>{pet.breed}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Tamaño</p>
                                      <p className="text-sm" style={{ color: "#6B7280" }}>{PET_SIZE_LABEL[pet.size as PetSize] ?? pet.size}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Género</p>
                                      <p className="text-sm" style={{ color: "#6B7280" }}>{pet.gender === "MALE" ? "Macho" : pet.gender === "FEMALE" ? "Hembra" : "—"}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Peso</p>
                                      <p className="text-sm" style={{ color: "#6B7280" }}>{pet.weight ? `${pet.weight} kg` : "—"}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Cases 1, 3, 6: guest or logged-in with no ids → forms
                    <div className="flex flex-col gap-6 mt-4">
                      {pets.map((pet, index) => (
                        <div key={index}>
                          <PetForm pet={pet} index={index} pets={pets} updatePet={updatePet} incrementAge={incrementAge} decrementAge={decrementAge} />
                          {index < pets.length - 1 && <hr className="mt-3" style={{ borderColor: "#E5E7EB" }} />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#0A1830" }}>
                      <MapPin size={20} style={{ color: "#0A1830" }} />
                      Mi dirección
                    </h2>
                    {isSignedIn && savedAddresses.length > 0 && !showNewAddressForm && !hasNoMatchingAddresses && (
                      <button
                        type="button"
                        onClick={() => { setShowNewAddressForm(true); setSelectedAddressId(null) }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors hover:bg-gray-50"
                        style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                      >
                        <Plus size={15} />
                        Nueva dire
                      </button>
                    )}
                  </div>

                  {isSignedIn && savedAddresses.length > 0 && !showNewAddressForm && !hasNoMatchingAddresses ? (
                    <>
                      <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
                        Selecciona una de tus direcciones guardadas o agrega una nueva.
                      </p>
                      <p className="text-sm font-bold mb-3" style={{ color: "#0A1830" }}>Direcciones guardadas</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {matchingAddresses.map((addr, index) => {
                          const isSelected = selectedAddressId === addr.id
                          const line1 = [addr.street, addr.number, addr.apartment ? `Depto ${addr.apartment}` : null].filter(Boolean).join(" ")
                          const line2 = [addr.commune, addr.city, addr.country].filter(Boolean).join(", ")
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => selectSavedAddress(addr)}
                              className="flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors w-full"
                              style={{
                                borderColor: isSelected ? "#FFC43D" : "#E5E7EB",
                                backgroundColor: isSelected ? "#FFFBF0" : "#fff",
                              }}
                            >
                              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                                style={{ borderColor: isSelected ? "#FFC43D" : "#D1D5DB" }}>
                                {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#FFC43D" }} />}
                              </div>
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: "#F3F4F6" }}>
                                <Home size={18} style={{ color: "#0A1830" }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold" style={{ color: "#0A1830" }}>
                                  {addr.label ?? `Dirección ${index + 1}`}
                                </p>
                                <p className="text-xs mt-0.5" style={{ color: "#555" }}>{line1}</p>
                                <p className="text-xs" style={{ color: "#6B7280" }}>{line2}</p>
                              </div>
                              {addr.isDefault && (
                                <span className="flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full"
                                  style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}>
                                  Predeterminada
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {nonMatchingAddresses.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold mb-2" style={{ color: "#9CA3AF" }}>
                            Otras direcciones que tienes registradas en otras comunas
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {nonMatchingAddresses.map((addr, index) => {
                              const line1 = [addr.street, addr.number, addr.apartment ? `Depto ${addr.apartment}` : null].filter(Boolean).join(" ")
                              const line2 = [addr.commune, addr.city, addr.country].filter(Boolean).join(", ")
                              return (
                                <div
                                  key={addr.id}
                                  className="flex items-center gap-3 px-4 py-3 rounded-xl border w-full"
                                  style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB", opacity: 0.6 }}
                                >
                                  <div className="w-5 h-5 rounded-full border-2 flex-shrink-0"
                                    style={{ borderColor: "#D1D5DB" }} />
                                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: "#EFEFEF" }}>
                                    <Home size={18} style={{ color: "#9CA3AF" }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold" style={{ color: "#6B7280" }}>
                                      {addr.label ?? `Dirección ${index + 1}`}
                                    </p>
                                    <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{line1}</p>
                                    <p className="text-xs" style={{ color: "#9CA3AF" }}>{line2}</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col gap-4">

                      {hasNoMatchingAddresses && !(addressSelectedFromGoogle && normalizeCommuneName(commune) === normalizeCommuneName(quotedTransportCommune)) && (
                        <div className="rounded-xl border px-4 py-3" style={{ backgroundColor: "#F0F7FF", borderColor: "#BFD7FF" }}>
                          <p className="text-sm" style={{ color: "#1D4ED8" }}>
                            No tienes ninguna dirección guardada en <strong>{quotedTransportCommune}</strong>, que es la comuna de tu reserva. Ingresa una nueva aquí abajo para continuar, o si prefieres{" "}
                            <Link href="/#buscar" className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-75">
                              edita tu reserva desde el inicio
                            </Link>
                            {" "}para elegir otra comuna.
                          </p>
                        </div>
                      )}

                      {isSignedIn && savedAddresses.length > 0 && showNewAddressForm && (
                        <button
                          type="button"
                          onClick={() => setShowNewAddressForm(false)}
                          className="self-start text-sm font-semibold transition-opacity hover:opacity-75"
                          style={{ color: "#6B7280" }}
                        >
                          ← Volver a mis direcciones
                        </button>
                      )}

                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Dirección</label>
                          <div className="relative">
                            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                            <input ref={addressInputRef} type="text" value={address}
                              onChange={(e) => {
                                setAddress(e.target.value)
                                setStreetName("")
                                setStreetNumber("")
                                setAddressSelectedFromGoogle(false)
                                setCommune("")
                                setCity("")
                                setCountry("")
                              }}
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                              style={{ borderColor: address && !addressSelectedFromGoogle ? "#F59E0B" : "#E5E7EB", color: "#0A1830" }}
                              placeholder="Calle y número" autoComplete="street-address" />
                          </div>
                          {addressAutocompleteError && (
                            <p className="mt-1.5 text-xs" style={{ color: "#B45309" }}>{addressAutocompleteError}</p>
                          )}
                        </div>
                        <div className="w-full sm:w-36">
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Depto</label>
                          <input type="text" value={apartment} onChange={(e) => setApartment(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                            style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Opcional" autoComplete="address-line2" />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>País</label>
                          <input type="text" value={country} readOnly
                            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                            style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Pendiente" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Ciudad</label>
                          <input type="text" value={city} readOnly
                            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                            style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Pendiente" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Comuna</label>
                          <input type="text" value={commune} readOnly
                            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                            style={{
                              backgroundColor: "#F9FAFB",
                              borderColor: selectedAddressCommuneMatchesQuote ? "#E5E7EB" : "#F59E0B",
                              color: "#0A1830",
                            }} placeholder="Pendiente" />
                        </div>
                      </div>

                      {!selectedAddressCommuneMatchesQuote && (
                        <div className="rounded-xl border px-4 py-3" style={{ backgroundColor: "#FFFBEB", borderColor: "#F59E0B" }}>
                          <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
                            La dirección debe estar en {quotedTransportCommune}, que es la comuna usada para cotizar el transporte.{" "}
                            <Link href="/" className="underline underline-offset-2 transition-opacity hover:opacity-75">
                              Cambiar reserva
                            </Link>
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Referencia</label>
                        <input type="text" value={addressReference} onChange={(e) => setAddressReference(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                          style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Ej: Portón negro, casa al fondo" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Save data */}
                {!isSignedIn && (
                  <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border"
                    style={{ borderColor: "#F5C518", backgroundColor: "#FFFBEA" }}>
                    <input type="checkbox" checked={saveData} onChange={(e) => setSaveData(e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer accent-[#F5C518] flex-shrink-0" />
                    <span className="text-sm font-semibold" style={{ color: "#0A1830" }}>
                      Guardar mis datos para las próximas reservas en Jack City
                    </span>
                  </label>
                )}

                {/* Transport schedules */}
                {includeTransport && (
                  <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                    <h2 className="text-lg font-bold mb-4" style={{ color: "#0A1830" }}>
                      Horarios de Transporte de tu mascota
                    </h2>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-2" style={{ color: "#0A1830" }}>Ida</p>
                        <div className="flex flex-col gap-2">
                          {quote.transport.departureSlots.map((slot) => (
                            <button key={`dep-${slot}`} type="button" onClick={() => setSelectedDeparture(slot)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors"
                              style={{
                                backgroundColor: selectedDeparture === slot ? "#FEF3C7" : "#fff",
                                borderColor: selectedDeparture === slot ? "#FFC43D" : "#E5E7EB",
                                color: "#0A1830",
                              }}>
                              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                                style={{ borderColor: selectedDeparture === slot ? "#FFC43D" : "#D1D5DB" }}>
                                {selectedDeparture === slot && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFC43D" }} />}
                              </div>
                              {slotTime(slot)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold mb-2" style={{ color: "#0A1830" }}>Regreso</p>
                        <div className="flex flex-col gap-2">
                          {quote.transport.returnSlots.map((slot) => (
                            <button key={`ret-${slot}`} type="button" onClick={() => setSelectedReturn(slot)}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors"
                              style={{
                                backgroundColor: selectedReturn === slot ? "#FEF3C7" : "#fff",
                                borderColor: selectedReturn === slot ? "#FFC43D" : "#E5E7EB",
                                color: "#0A1830",
                              }}>
                              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                                style={{ borderColor: selectedReturn === slot ? "#FFC43D" : "#D1D5DB" }}>
                                {selectedReturn === slot && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFC43D" }} />}
                              </div>
                              {slotTime(slot)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm conditions */}
                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: "#0A1830" }}>Confirmar Condiciones</h2>
                  <div className="flex flex-col gap-3">
                    {[
                      { checked: vaccinesUpToDate, onChange: setVaccinesUpToDate, label: "Mis mascotas tienen sus vacunas al día" },
                      { checked: isCastrated, onChange: setIsCastrated, label: "Mi mascota está castrada" },
                      { checked: notInHeat, onChange: setNotInHeat, label: "Mi mascota no está en celo" },
                    ].map(({ checked, onChange, label }) => (
                      <label key={label} className="flex items-start gap-3 cursor-pointer">
                        <div
                          className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                          style={{ borderColor: checked ? "#FFC43D" : "#D1D5DB", backgroundColor: checked ? "#FFC43D" : "transparent" }}
                          onClick={() => onChange(!checked)}
                        >
                          {checked && <Check size={14} style={{ color: "#0A1830" }} strokeWidth={3} />}
                        </div>
                        <span className="text-sm" style={{ color: "#333" }}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Reservation summary + pay */}
                <div className="bg-white rounded-2xl border p-4 shadow-sm sm:p-6" style={{ borderColor: "#E5E7EB" }}>
                  <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: "#0A1830" }}>
                        Resumen de tu reserva
                      </h2>
                      <div className="mt-6 flex gap-4">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#ECE8FF" }}>
                          <PawPrint size={28} fill="#0A1830" style={{ color: "#0A1830" }} />
                        </div>
                        <ul className="flex min-w-0 flex-col gap-3 text-base" style={{ color: "#0A1830" }}>
                          <li>{petCountLabel}{quotedPetSizesLabel ? ` (${quotedPetSizesLabel})` : ""}</li>
                          <li className="flex items-center gap-2">
                            <CalendarDays size={18} className="flex-shrink-0" style={{ color: "#26364F" }} />
                            <span>
                              {nights} {nights === 1 ? "noche" : "noches"}
                              {checkinDate && checkoutDate && (
                                <> · {format(checkinDate, "d MMM", { locale: es })} - {format(checkoutDate, "d MMM", { locale: es })}</>
                              )}
                            </span>
                          </li>
                          {includeTransport && (
                            <li className="flex items-center gap-2">
                              <Car size={18} className="flex-shrink-0" style={{ color: "#26364F" }} />
                              <span>Transporte JackCity (Ida y regreso)</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="rounded-2xl border px-5 py-4" style={{ backgroundColor: "#F8FBFF", borderColor: "#BFD7FF" }}>
                      <div className="flex gap-4">
                        <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#2563EB" }}>
                          <Info size={24} style={{ color: "#FFFFFF" }} />
                        </div>
                        <div className="flex flex-col gap-4 text-base leading-relaxed" style={{ color: "#0A1830" }}>
                          <p>
                            Para confirmar tu reserva debes pagar <span className="font-semibold">ahora</span>{" "}
                            <span className="font-semibold" style={{ color: "#125BD8" }}>
                              el 30% del alojamiento{includeTransport ? " + el 100% del transporte" : ""}.
                            </span>
                          </p>
                          <p>
                            El <span className="font-semibold">70% restante del alojamiento</span> lo abonas directamente en el hotel.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-7 rounded-2xl border p-4 sm:p-6" style={{ borderColor: "#E5E7EB" }}>
                    <h3 className="text-xl font-bold" style={{ color: "#0A1830" }}>
                      Total de tu reserva
                    </h3>

                    <div className="mt-6 flex flex-col gap-5 text-base" style={{ color: "#0A1830" }}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#EAF2FF" }}>
                            <Hotel size={22} style={{ color: "#125BD8" }} />
                          </div>
                          <p className="min-w-0">Alojamiento ({nights} {nights === 1 ? "noche" : "noches"})</p>
                        </div>
                        <p className="flex-shrink-0 font-medium">{formatClp(accommodationPrice)}</p>
                      </div>

                      {includeTransport && (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#DDF5EA" }}>
                              <Car size={22} style={{ color: "#08785B" }} />
                            </div>
                            <p className="min-w-0">Transporte JackCity (Ida y regreso)</p>
                          </div>
                          <p className="flex-shrink-0 font-medium">{formatClp(transportPrice)}</p>
                        </div>
                      )}

                      <div className="border-t pt-5" style={{ borderColor: "#E5E7EB" }}>
                        <div className="flex items-end justify-between gap-4">
                          <div>
                            <p className="text-lg font-semibold" style={{ color: "#0A1830" }}>Total reserva</p>
                            <p className="mt-2 text-sm" style={{ color: "#667085" }}>IVA incluido</p>
                          </div>
                          <p className="text-2xl font-bold md:text-3xl" style={{ color: "#0A1830" }}>{formatClp(totalPrice)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 rounded-2xl border p-4 sm:p-6" style={{ backgroundColor: "#FFFBF0", borderColor: "#FFC43D" }}>
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#FFE7A3" }}>
                          <CreditCard size={34} style={{ color: "#0A1830" }} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-xl font-bold" style={{ color: "#0A1830" }}>Pagar ahora por Webpay</h3>
                          <p className="mt-2 text-base" style={{ color: "#0A1830" }}>
                            30% del alojamiento{includeTransport ? " + 100% del transporte" : ""}
                          </p>
                        </div>
                      </div>
                      <p className="text-4xl font-bold sm:text-right" style={{ color: "#B77900" }}>{formatClp(payNowPrice)}</p>
                    </div>

                    <div className="mt-5 border-t pt-5" style={{ borderColor: "#F6CF83", borderStyle: "dashed" }}>
                      <div className="flex flex-col gap-4 text-base" style={{ color: "#0A1830" }}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: "#2F9E68" }} />
                            <p className="min-w-0">30% del alojamiento ({nights} {nights === 1 ? "noche" : "noches"})</p>
                          </div>
                          <p className="flex-shrink-0 font-semibold">{formatClp(payNowAccommodationPrice)}</p>
                        </div>
                        {includeTransport && (
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: "#2F9E68" }} />
                              <p className="min-w-0">Transporte JackCity (Ida y regreso)</p>
                            </div>
                            <p className="flex-shrink-0 font-semibold">{formatClp(transportPrice)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl px-5 py-4" style={{ backgroundColor: "#EEF8F2" }}>
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#D5F1E2" }}>
                        <Building2 size={30} style={{ color: "#08785B" }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-bold" style={{ color: "#08785B" }}>Saldo a pagar en el hotel</p>
                        <p className="mt-1 text-base" style={{ color: "#0A1830" }}>70% restante del alojamiento</p>
                      </div>
                    </div>
                    <p className="flex-shrink-0 text-3xl font-bold" style={{ color: "#08785B" }}>{formatClp(payAtHotelPrice)}</p>
                  </div>

                  <div className="mt-6 rounded-2xl border p-4 sm:p-5" style={{ backgroundColor: "#F8FBFF", borderColor: "#BFD7FF" }}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#EAF2FF" }}>
                          <ShieldCheck size={30} style={{ color: "#125BD8" }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-bold" style={{ color: "#0A1830" }}>Pago seguro y protegido</p>
                          <p className="mt-1 text-sm leading-relaxed" style={{ color: "#0A1830" }}>
                            Serás redirigido a Webpay para realizar el pago de forma segura.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm font-bold">
                        <span style={{ color: "#E91E63" }}>transbank.</span>
                        <span style={{ color: "#1A4BA3" }}>VISA</span>
                        <span style={{ color: "#E11D48" }}>Mastercard</span>
                        <span style={{ color: "#1777B8" }}>AMEX</span>
                        <span style={{ color: "#0A1830" }}>Redcompra</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3">
                    {submitError && (
                      <p className="text-center text-sm text-red-600">{submitError}</p>
                    )}
                    <button
                      onClick={handleConfirm}
                      disabled={!canPay || isSubmitting}
                      className="w-full rounded-xl px-6 py-4 text-lg font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
                      style={{ backgroundColor: "#FFB200", color: "#0A1830" }}
                    >
                      <span className="flex items-center justify-center gap-3">
                        <LockKeyhole size={22} />
                        {isSubmitting ? "Procesando..." : `Ir a pagar ${formatClp(payNowPrice)}`}
                      </span>
                    </button>
                    <p className="text-center text-sm" style={{ color: "#667085" }}>
                      Al continuar, aceptas los términos y condiciones de JackCity.
                    </p>
                  </div>
                </div>

                <div className="h-96" />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  )
}
