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
} from "lucide-react"

const SLOT_LABELS: Record<string, string> = {
  AM: "Mañana (AM)",
  MD: "Mediodía (MD)",
  PM: "Tarde (PM)",
}

const COUNTRY_CODES = [
  { code: "+56", country: "CL" },
  { code: "+54", country: "AR" },
  { code: "+51", country: "PE" },
  { code: "+57", country: "CO" },
  { code: "+52", country: "MX" },
]

const PET_COLORS = ["Negro", "Blanco", "Marrón", "Dorado", "Gris", "Manchado", "Otro"]

interface PetData {
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
  const streetAddress = [route, streetNumber].filter(Boolean).join(" ")
  const commune =
    getAddressComponent(place, "administrative_area_level_3") ||
    getAddressComponent(place, "locality") ||
    getAddressComponent(place, "sublocality_level_1") ||
    getAddressComponent(place, "sublocality")
  const city =
    getAddressComponent(place, "administrative_area_level_2") ||
    getAddressComponent(place, "locality") ||
    commune
  return {
    address: streetAddress || place.name || "",
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

function ConfirmationContent() {
  const router = useRouter()
  const { quoteId } = useParams<{ quoteId: string }>()
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
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [saveData, setSaveData] = useState(false)
  const [commune, setCommune] = useState("")
  const [address, setAddress] = useState("")
  const [apartment, setApartment] = useState("")
  const [addressReference, setAddressReference] = useState("")
  const [addressSelectedFromGoogle, setAddressSelectedFromGoogle] = useState(false)
  const [addressAutocompleteError, setAddressAutocompleteError] = useState("")
  const [rut, setRut] = useState("")
  const [countryCode, setCountryCode] = useState("+56")
  const [phone, setPhone] = useState("")

  // Pets state — initialized when quote loads
  const [pets, setPets] = useState<PetData[]>([])
  const [petsInitialized, setPetsInitialized] = useState(false)
  useEffect(() => {
    if (quote && !petsInitialized) {
      setPets(quote.pets.map((p) => ({
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

  // Transport
  const [selectedDeparture, setSelectedDeparture] = useState<string | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<string | null>(null)

  // Conditions
  const [vaccinesUpToDate, setVaccinesUpToDate] = useState(false)
  const [isCastrated, setIsCastrated] = useState(false)
  const [notInHeat, setNotInHeat] = useState(false)

  // Derived values from quote
  const includeTransport = quote?.needsTransport ?? false
  const quotedTransportCommune = getTransportCommuneByCode(quote?.transportCommune ?? "")?.commune ?? quote?.transportCommune ?? ""
  const transportFrom = quotedTransportCommune ? `Comuna ${quotedTransportCommune}` : ""

  const checkinDate = quote ? new Date(`${quote.checkinDate}T12:00:00`) : null
  const checkoutDate = quote ? new Date(`${quote.checkoutDate}T12:00:00`) : null
  const nights = checkinDate && checkoutDate
    ? Math.round((checkoutDate.getTime() - checkinDate.getTime()) / 86400000)
    : 1

  const totalPrice = includeTransport
    ? (quote?.pricing.totalPrice ?? 0)
    : (quote?.pricing.bookingPrice ?? 0)

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
  const canPay = allConditionsAccepted() && selectedAddressCommuneMatchesQuote && rutIsValid && emailIsValid && transportSlotsSelected

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
          setAddress(parsed.address)
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
  }, [])

  const summaryData = {
    city: "Santiago",
    dateFrom: checkinDate ? format(checkinDate, "d MMM", { locale: es }) : "—",
    dateTo: checkoutDate ? format(checkoutDate, "d MMM", { locale: es }) : "—",
    petCount: pets.length || (quote?.pets.length ?? 1),
    withTransport: includeTransport,
  }

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#0B1F3A" }}>
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />

        <SearchSummaryBar
          data={summaryData}
          onChangeClick={() => router.back()}
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

                {/* Login button */}
                <button
                  className="w-full sm:w-auto self-start flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm border-2 transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#0A1830", color: "#0A1830" }}
                >
                  <User size={16} />
                  Inicia Sesión
                </button>

                {/* Personal data */}
                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
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
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                          style={{ borderColor: emailHasValue && !emailIsValid ? "#F59E0B" : "#E5E7EB", color: "#0A1830" }}
                          placeholder="correo@ejemplo.com" />
                      </div>
                      {emailHasValue && !emailIsValid && (
                        <p className="mt-1.5 text-xs" style={{ color: "#B45309" }}>Ingresa un email válido.</p>
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

                {/* Address */}
                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: "#0A1830" }}>
                    <MapPin size={20} className="inline-block mr-2" style={{ color: "#0A1830" }} />
                    Mi dirección
                  </h2>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Dirección</label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                          <input ref={addressInputRef} type="text" value={address}
                            onChange={(e) => {
                              setAddress(e.target.value)
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
                </div>

                {/* Save data */}
                <label className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border"
                  style={{ borderColor: "#F5C518", backgroundColor: "#FFFBEA" }}>
                  <input type="checkbox" checked={saveData} onChange={(e) => setSaveData(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer accent-[#F5C518] flex-shrink-0" />
                  <span className="text-sm font-semibold" style={{ color: "#0A1830" }}>
                    Guardar mis datos para las próximas reservas en Jack City
                  </span>
                </label>

                {/* Pets form */}
                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: "#0A1830" }}>
                    <PawPrint size={20} className="inline-block mr-2" style={{ color: "#0A1830" }} />
                    Mi(s) Mascota(s)
                  </h2>
                  <div className="flex flex-col gap-6">
                    {pets.map((pet, index) => (
                      <div key={index} className="flex flex-col gap-3">
                        {pets.length > 1 && (
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

                        {index < pets.length - 1 && <hr className="mt-3" style={{ borderColor: "#E5E7EB" }} />}
                      </div>
                    ))}
                  </div>
                </div>

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
                              {SLOT_LABELS[slot] ?? slot}
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
                              {SLOT_LABELS[slot] ?? slot}
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
                <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                  <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>Resumen Reserva</h2>
                  <ul className="flex flex-col gap-1.5 text-sm mb-4" style={{ color: "#555" }}>
                    <li>{petCountLabel}{quotedPetSizesLabel ? ` (${quotedPetSizesLabel})` : ""}</li>
                    <li>
                      {nights} {nights === 1 ? "noche" : "noches"}
                      {checkinDate && checkoutDate && (
                        <span> ({format(checkinDate, "d MMM", { locale: es })} - {format(checkoutDate, "d MMM", { locale: es })})</span>
                      )}
                    </li>
                    {includeTransport && <li>Transporte incluido desde {transportFrom}</li>}
                  </ul>
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
                    <div>
                      <p className="text-3xl md:text-4xl font-bold" style={{ color: "#0A1830" }}>{formatClp(totalPrice)}</p>
                      <p className="text-xs" style={{ color: "#888" }}>IVA incluido</p>
                    </div>
                    <button
                      onClick={() => router.push("/success")}
                      disabled={!canPay}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-base transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                      style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}
                    >
                      Ir a Pagar
                    </button>
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
