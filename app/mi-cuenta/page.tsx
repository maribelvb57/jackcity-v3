"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { useApiClient, type ApiFetch } from "@/hooks/use-api-client"
import { SiteNavbar } from "@/components/site-navbar"
import { AccountSidebar } from "@/components/account-sidebar"
import { AddPetModal } from "@/components/add-pet-modal"
import { getMyProfile, updateMe, type CustomerProfile } from "@/lib/api/customers"
import { createAddress, deleteAddress, type AddressResult } from "@/lib/api/addresses"
import { updatePet, deletePet } from "@/lib/api/pets"
import { PET_SIZE_LABEL, PET_SIZE_MAP, type PetSize } from "@/lib/api/hotels"
import { DOG_BREEDS, breedDisplayLabel, getBreedByCode, getBreedSizeByCode, OTHER_BREED_CODE } from "@/lib/dog-breeds"
import {
  User,
  Mail,
  Phone,
  MapPin,
  PawPrint,
  ChevronDown,
  Minus,
  Plus,
  Pencil,
  Trash2,
  Home,
  Check,
} from "lucide-react"

// ─── Constants ───────────────────────────────────────────────────────────────

const COUNTRY_CODES = [
  { code: "+56", country: "CL" },
  { code: "+54", country: "AR" },
  { code: "+51", country: "PE" },
  { code: "+57", country: "CO" },
  { code: "+52", country: "MX" },
]

const PET_COLORS = ["Negro", "Blanco", "Marrón", "Dorado", "Gris", "Manchado", "Otro"]
const PET_SIZES = Object.entries(PET_SIZE_LABEL) as [PetSize, string][]
const TAMANOS = ["Pequeño", "Mediano", "Grande", "Extra Grande"]
// Opciones del combobox de raza: value = code (interno/backend), label = texto al usuario.
const RAZA_OPTIONS = DOG_BREEDS.map((b) => ({ value: b.code, label: breedDisplayLabel(b) }))

function cleanRut(value: string | null | undefined) {
  return (value ?? "").replace(/[^0-9kK]/g, "").toUpperCase()
}
function isValidChileRut(value: string) {
  const cleaned = cleanRut(value)
  if (cleaned.length < 2) return false
  const body = cleaned.slice(0, -1)
  const verifier = cleaned.slice(-1)
  if (!/^\d+$/.test(body)) return false
  let sum = 0; let multiplier = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  const rem = 11 - (sum % 11)
  return verifier === (rem === 11 ? "0" : rem === 10 ? "K" : String(rem))
}
function formatChileRut(value: string | null | undefined) {
  const cleaned = cleanRut(value)
  if (cleaned.length < 2) return value ?? ""
  const body = cleaned.slice(0, -1)
  const verifier = cleaned.slice(-1)
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${verifier}`
}

// ─── Google Maps helpers (same as /confirmation) ──────────────────────────────

type GoogleAddressComponent = { long_name: string; short_name: string; types: string[] }
type GooglePlaceResult = { address_components?: GoogleAddressComponent[]; geometry?: unknown; name?: string }
type GoogleMapsAutocomplete = {
  addListener: (event: "place_changed", handler: () => void) => { remove: () => void }
  getPlace: () => GooglePlaceResult
}
type GoogleMapsWindow = Window & {
  google?: { maps?: { places?: { Autocomplete: new (input: HTMLInputElement, opts: { componentRestrictions?: { country: string }; fields: string[]; types: string[] }) => GoogleMapsAutocomplete }; event?: { clearInstanceListeners: (a: GoogleMapsAutocomplete) => void } } }
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-places-script"
let googleMapsScriptPromise: Promise<void> | null = null

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  const w = window as GoogleMapsWindow
  if (w.google?.maps?.places) return Promise.resolve()
  if (googleMapsScriptPromise) return googleMapsScriptPromise
  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null
    if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); return }
    const script = document.createElement("script")
    const params = new URLSearchParams({ key: apiKey, libraries: "places", language: "es", region: "CL" })
    script.id = GOOGLE_MAPS_SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true; script.defer = true
    script.addEventListener("load", () => resolve(), { once: true })
    script.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps.")), { once: true })
    document.head.appendChild(script)
  })
  return googleMapsScriptPromise
}

function getAddressComponent(place: GooglePlaceResult, type: string, shortName = false) {
  const c = place.address_components?.find(i => i.types.includes(type))
  if (!c) return ""
  return shortName ? c.short_name : c.long_name
}

function parseGoogleAddress(place: GooglePlaceResult) {
  const streetNumber = getAddressComponent(place, "street_number", true)
  const route = getAddressComponent(place, "route")
  const commune =
    getAddressComponent(place, "administrative_area_level_3") ||
    getAddressComponent(place, "locality") ||
    getAddressComponent(place, "sublocality_level_1") ||
    getAddressComponent(place, "sublocality")
  const city = getAddressComponent(place, "administrative_area_level_2") || getAddressComponent(place, "locality") || commune
  return {
    displayAddress: [route, streetNumber].filter(Boolean).join(" ") || place.name || "",
    street: route || place.name || "",
    streetNumber,
    commune,
    city,
    country: getAddressComponent(place, "country"),
  }
}

// ─── Confirm delete modal ─────────────────────────────────────────────────────

interface ConfirmDeleteModalProps {
  message: string
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDeleteModal({ message, isDeleting, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 flex flex-col gap-4">
        <p className="text-sm text-center" style={{ color: "#0A1830" }}>{message}</p>
        <div className="flex gap-3">
          <button type="button" onClick={onConfirm} disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#EF4444", color: "#fff" }}>
            {isDeleting ? "Eliminando..." : "Sí, eliminar"}
          </button>
          <button type="button" onClick={onCancel} disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit pet modal ───────────────────────────────────────────────────────────

type PetRecord = CustomerProfile["pets"][number]

interface EditPetModalProps {
  pet: PetRecord
  apiFetch: ApiFetch
  onSave: (updated: PetRecord) => void
  onClose: () => void
}

function EditPetModalWrapper(props: EditPetModalProps) {
  return <EditPetModal {...props} />
}

function EditPetModal({ pet, apiFetch, onSave, onClose }: EditPetModalProps) {
  const [name, setName] = useState(pet.name)
  const [breed, setBreed] = useState(pet.breed ?? "")
  // size stored as display label ("Pequeño", etc.) internally, converted to code on save
  const [sizeLabel, setSizeLabel] = useState(PET_SIZE_LABEL[pet.size as PetSize] ?? "")
  const [gender, setGender] = useState(
    pet.gender === "MALE" ? "Macho" : pet.gender === "FEMALE" ? "Hembra" : ""
  )
  const [weight, setWeight] = useState(pet.weight?.toString() ?? "")
  const [color, setColor] = useState(pet.color ?? "")
  const [age, setAge] = useState(pet.age ?? 0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const isOtraRaza = breed === OTHER_BREED_CODE
  const GENDER_MAP: Record<string, string> = { Macho: "MALE", Hembra: "FEMALE" }

  const handleBreedChange = (newBreed: string) => {
    setBreed(newBreed)
    const inferred = getBreedSizeByCode(newBreed)
    setSizeLabel(inferred ? PET_SIZE_LABEL[inferred] : "")
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")
    try {
      const sizeCode = PET_SIZE_MAP[sizeLabel] ?? sizeLabel
      const genderCode = GENDER_MAP[gender] ?? gender
      const weightParsed = parseFloat(weight)
      // El backend hace update parcial: solo mandamos los campos con valor para no pisar
      // datos existentes con vacíos cuando el usuario edita únicamente el nombre.
      await updatePet(pet.id, {
        name,
        ...(breed && { breed }),
        ...(sizeCode && { size: sizeCode }),
        ...(genderCode && { gender: genderCode }),
        ...(isNaN(weightParsed) ? {} : { weight: weightParsed }),
        ...(color && { color }),
        ...(age > 0 && { age }),
      }, apiFetch)
      onSave({
        ...pet,
        name,
        breed: breed || pet.breed,
        size: sizeCode || pet.size,
        gender: genderCode || pet.gender,
        weight: isNaN(weightParsed) ? null : weightParsed,
        color: color || null,
        age: age || null,
      })
    } catch {
      setError("No se pudieron guardar los cambios. Intenta nuevamente.")
    } finally {
      setIsSaving(false)
    }
  }

  // Valores iniciales para detectar cambios reales (el botón dice "Guardar cambios")
  const initialGender = pet.gender === "MALE" ? "Macho" : pet.gender === "FEMALE" ? "Hembra" : ""
  const initialSizeLabel = PET_SIZE_LABEL[pet.size as PetSize] ?? ""
  const hasChanges =
    name !== pet.name ||
    breed !== (pet.breed ?? "") ||
    sizeLabel !== initialSizeLabel ||
    gender !== initialGender ||
    weight !== (pet.weight?.toString() ?? "") ||
    color !== (pet.color ?? "") ||
    age !== (pet.age ?? 0)

  // El nombre es obligatorio; el resto puede venir incompleto desde el perfil y no debe bloquear
  const canSave = name.trim().length > 0 && hasChanges

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#E5E7EB" }}>
          <h3 className="text-base font-bold" style={{ color: "#0A1830" }}>Editar mascota</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: "#6B7280" }}>
            <Plus size={20} className="rotate-45" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">

          {/* Fila 1: Nombre + Género */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Nombre</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                style={{ borderColor: "#E5E7EB", color: "#0A1830" }} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Género</label>
              <div className="px-4 py-2.5 rounded-xl border flex items-center gap-4 h-[42px]" style={{ borderColor: "#E5E7EB" }}>
                {["Macho", "Hembra"].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="edit-pet-gender" value={g}
                      checked={gender === g} onChange={() => setGender(g)}
                      className="w-4 h-4 cursor-pointer accent-[#0A1830]" />
                    <span className="text-sm" style={{ color: "#0A1830" }}>{g}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Fila 2: Raza + Tamaño */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Raza</label>
              <div className="relative">
                <select value={breed} onChange={(e) => handleBreedChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 appearance-none cursor-pointer"
                  style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
                  {RAZA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                Tamaño
                {!isOtraRaza && <span className="font-normal ml-1" style={{ color: "#9CA3AF" }}>(según raza)</span>}
              </label>
              <div className="relative">
                <select value={sizeLabel} onChange={(e) => setSizeLabel(e.target.value)}
                  disabled={!isOtraRaza}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none appearance-none"
                  style={{
                    borderColor: "#E5E7EB",
                    color: sizeLabel ? "#0A1830" : "#9CA3AF",
                    backgroundColor: !isOtraRaza ? "#F9FAFB" : "#fff",
                    cursor: !isOtraRaza ? "default" : "pointer",
                  }}>
                  <option value="">Seleccionar</option>
                  {TAMANOS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
              </div>
            </div>
          </div>

          {/* Fila 3: Peso + Color */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                Peso <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
              </label>
              <div className="relative">
                <input type="text" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 pr-12"
                  style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="0" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#9CA3AF" }}>kg</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                Color <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
              </label>
              <div className="relative">
                <select value={color} onChange={(e) => setColor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 appearance-none cursor-pointer"
                  style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
                  <option value="">Sin color</option>
                  {PET_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
              </div>
            </div>
          </div>

          {/* Edad */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
              Edad <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
            </label>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setAge(a => Math.max(a - 1, 0))}
                className="w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E5E7EB" }}>
                <Minus size={16} style={{ color: "#0A1830" }} />
              </button>
              <div className="flex-1 h-10 flex items-center justify-center rounded-xl border text-sm font-semibold"
                style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
                {age === 0 ? "—" : `${age} año${age !== 1 ? "s" : ""}`}
              </div>
              <button type="button" onClick={() => setAge(a => Math.min(a + 1, 25))}
                className="w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E5E7EB" }}>
                <Plus size={16} style={{ color: "#0A1830" }} />
              </button>
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: "#B45309" }}>{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleSave}
              disabled={isSaving || !canSave}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}>
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" onClick={onClose} disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


// ─── Add address modal ────────────────────────────────────────────────────────

interface AddAddressModalProps {
  apiFetch: ApiFetch
  onSave: (addr: AddressResult) => void
  onClose: () => void
}

function AddAddressModal({ apiFetch, onSave, onClose }: AddAddressModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "#E5E7EB" }}>
          <h3 className="text-base font-bold" style={{ color: "#0A1830" }}>Agregar dirección</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: "#6B7280" }}>
            <Plus size={20} className="rotate-45" />
          </button>
        </div>
        <div className="px-5 pb-5">
          <AddressForm apiFetch={apiFetch} onSave={onSave} onCancel={onClose} />
        </div>
      </div>
    </div>
  )
}

// ─── New address form (sub-component to keep the main component cleaner) ──────

interface AddressFormProps {
  apiFetch: ApiFetch
  onSave: (addr: AddressResult) => void
  onCancel: () => void
}

function AddressForm({ apiFetch, onSave, onCancel }: AddressFormProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [address, setAddress] = useState("")
  const [streetName, setStreetName] = useState("")
  const [streetNumber, setStreetNumber] = useState("")
  const [apartment, setApartment] = useState("")
  const [reference, setReference] = useState("")
  const [commune, setCommune] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [selectedFromGoogle, setSelectedFromGoogle] = useState(false)
  const [autocompleteError, setAutocompleteError] = useState("")
  const [streetNumberError, setStreetNumberError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  useEffect(() => {
    if (selectedFromGoogle && !streetNumber) {
      setStreetNumberError("Debes incluir el número de la calle (ej: Calle Valdivia 123)")
    } else {
      setStreetNumberError("")
    }
  }, [selectedFromGoogle, streetNumber])

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    const input = inputRef.current
    if (!apiKey || !input) return
    let autocomplete: GoogleMapsAutocomplete | null = null
    let listener: { remove: () => void } | null = null
    let mounted = true
    loadGoogleMapsScript(apiKey).then(() => {
      if (!mounted) return
      const Autocomplete = (window as GoogleMapsWindow).google?.maps?.places?.Autocomplete
      if (!Autocomplete) { setAutocompleteError("No se pudo iniciar el autocompletado."); return }
      autocomplete = new Autocomplete(input, { componentRestrictions: { country: "cl" }, fields: ["address_components", "geometry", "name"], types: ["address"] })
      listener = autocomplete.addListener("place_changed", () => {
        if (!autocomplete) return
        const place = autocomplete.getPlace()
        if (!place.geometry) { setSelectedFromGoogle(false); return }
        const parsed = parseGoogleAddress(place)
        setAddress(parsed.displayAddress)
        setStreetName(parsed.street)
        setStreetNumber(parsed.streetNumber)
        setCommune(parsed.commune)
        setCity(parsed.city)
        setCountry(parsed.country)
        setSelectedFromGoogle(true)
        setAutocompleteError("")
      })
    }).catch(() => { if (mounted) setAutocompleteError("No se pudo cargar el autocompletado.") })
    return () => {
      mounted = false
      listener?.remove()
      if (autocomplete) (window as GoogleMapsWindow).google?.maps?.event?.clearInstanceListeners(autocomplete)
    }
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError("")
    try {
      const result = await createAddress({
        street: streetName || address,
        ...(streetNumber && { number: streetNumber }),
        ...(apartment.trim() && { apartment: apartment.trim() }),
        commune, city, country,
        ...(reference.trim() && { reference: reference.trim() }),
      }, apiFetch)
      onSave(result)
    } catch {
      setSaveError("No se pudo guardar la dirección. Intenta nuevamente.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Dirección</label>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
            <input ref={inputRef} type="text" value={address}
              onChange={(e) => { setAddress(e.target.value); setStreetName(""); setStreetNumber(""); setCommune(""); setCity(""); setCountry(""); setSelectedFromGoogle(false) }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
              style={{ borderColor: streetNumberError ? "#DC2626" : address && !selectedFromGoogle ? "#F59E0B" : "#E5E7EB", color: "#0A1830" }}
              placeholder="Calle y número" autoComplete="street-address" />
          </div>
          {autocompleteError && <p className="mt-1.5 text-xs" style={{ color: "#B45309" }}>{autocompleteError}</p>}
          {streetNumberError && <p className="mt-1.5 text-xs" style={{ color: "#DC2626" }}>{streetNumberError}</p>}
        </div>
        <div className="w-full sm:w-36">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Depto</label>
          <input type="text" value={apartment} onChange={(e) => setApartment(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
            style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Opcional" />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>País</label>
          <input type="text" value={country} readOnly className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Pendiente" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Ciudad</label>
          <input type="text" value={city} readOnly className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Pendiente" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Comuna</label>
          <input type="text" value={commune} readOnly className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Pendiente" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Referencia</label>
        <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
          style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Ej: Portón negro, casa al fondo" />
      </div>
      {saveError && <p className="text-sm" style={{ color: "#B45309" }}>{saveError}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={handleSave}
          disabled={!selectedFromGoogle || !streetNumber || isSaving}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}>
          {isSaving ? "Guardando..." : "Guardar dirección"}
        </button>
        <button type="button" onClick={onCancel} disabled={isSaving}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-50"
          style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function MiCuentaContent() {
  const router = useRouter()
  const { apiFetch } = useApiClient()
  const { user: clerkUser, isSignedIn, isLoaded } = useUser()

  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSavingPersonal, setIsSavingPersonal] = useState(false)
  const [savePersonalError, setSavePersonalError] = useState("")

  // Personal data
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [countryCode, setCountryCode] = useState("+56")
  const [phone, setPhone] = useState("")
  const [rut, setRut] = useState("")
  // Originals for cancel
  const [origFirst, setOrigFirst] = useState("")
  const [origLast, setOrigLast] = useState("")
  const [origCountryCode, setOrigCountryCode] = useState("+56")
  const [origPhone, setOrigPhone] = useState("")
  const [origRut, setOrigRut] = useState("")

  // Addresses
  const [addresses, setAddresses] = useState<CustomerProfile["addresses"]>([])
  const [showAddAddressModal, setShowAddAddressModal] = useState(false)

  // Pets
  const [pets, setPets] = useState<CustomerProfile["pets"]>([])
  const [editingPet, setEditingPet] = useState<PetRecord | null>(null)
  const [showAddPetModal, setShowAddPetModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ type: "pet" | "address"; id: string; label: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) { router.push("/"); return }
    if (!clerkUser?.id) return
    getMyProfile(apiFetch)
      .then((data) => {
        setEmail(data.user.email)
        setFirstName(data.user.firstName); setOrigFirst(data.user.firstName)
        setLastName(data.user.lastName); setOrigLast(data.user.lastName)
        setRut(data.user.rut); setOrigRut(data.user.rut)
        const ph = data.user.phone
        const match = COUNTRY_CODES.find(cc => ph.startsWith(cc.code))
        const cc = match?.code ?? "+56"
        const num = match ? ph.slice(cc.length) : ph
        setCountryCode(cc); setOrigCountryCode(cc)
        setPhone(num); setOrigPhone(num)
        setAddresses(data.addresses)
        setPets(data.pets.filter(p => p.active))
      })
      .catch(() => {})
      .finally(() => setIsLoadingProfile(false))
  }, [isLoaded, isSignedIn, clerkUser?.id])

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return
    setIsDeleting(true)
    try {
      if (confirmDelete.type === "pet") {
        await deletePet(confirmDelete.id, apiFetch)
        setPets(prev => prev.filter(p => String(p.id) !== confirmDelete.id))
      } else {
        await deleteAddress(confirmDelete.id, apiFetch)
        setAddresses(prev => prev.filter(a => String(a.id) !== confirmDelete.id))
      }
      setConfirmDelete(null)
    } catch {
      // keep modal open so user can retry
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelPersonalEdit = () => {
    setFirstName(origFirst); setLastName(origLast)
    setCountryCode(origCountryCode); setPhone(origPhone)
    setRut(origRut)
    setSavePersonalError("")
    setIsEditingPersonal(false)
  }

  const savePersonalData = async () => {
    setIsSavingPersonal(true)
    setSavePersonalError("")
    try {
      const result = await updateMe({
        firstName,
        lastName,
        phone: `${countryCode}${phone}`,
        identification: rut,
      }, apiFetch)
      // update originals so cancel works correctly after save
      setOrigFirst(result.firstName); setOrigLast(result.lastName)
      const match = COUNTRY_CODES.find(cc => result.phone.startsWith(cc.code))
      setOrigCountryCode(match?.code ?? "+56")
      setOrigPhone(match ? result.phone.slice((match.code).length) : result.phone)
      setOrigRut(result.identification)
      setIsEditingPersonal(false)
    } catch {
      setSavePersonalError("No se pudieron guardar los cambios. Intenta nuevamente.")
    } finally {
      setIsSavingPersonal(false)
    }
  }

  const rutHasValue = cleanRut(rut).length > 0
  const rutIsValid = rutHasValue && isValidChileRut(rut)


  if (!isLoaded || isLoadingProfile) {
    return (
      <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
        <div className="w-full max-w-[1400px] flex flex-col bg-white min-h-screen">
          <SiteNavbar />
          <div className="px-6 py-10 text-sm font-medium" style={{ color: "#0A1830" }}>Cargando tu perfil...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <div className="w-full max-w-[1400px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />

        <div className="flex flex-1">
          <AccountSidebar />

          <div className="flex-1 min-w-0 px-4 pb-10 md:px-8 pt-6 flex flex-col gap-6 max-w-3xl">

          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#0A1830" }}>Mi Cuenta</h1>

          {/* ── Datos personales ─────────────────────────────────────────── */}
          <div id="datos" className="scroll-mt-20 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#0A1830" }}>
                <User size={20} style={{ color: "#0A1830" }} />
                Datos personales
              </h2>
              {!isEditingPersonal && (
                <button type="button" onClick={() => setIsEditingPersonal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
                  <Pencil size={14} />
                  Editar
                </button>
              )}
            </div>

            {isEditingPersonal ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Nombre</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                      style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Nombre" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Apellidos</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                      style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Apellidos" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                    Email <span className="font-normal text-xs" style={{ color: "#9CA3AF" }}>(no editable)</span>
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                    <input type="email" value={email} readOnly
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none"
                      style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#6B7280" }} />
                  </div>
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
                          {COUNTRY_CODES.map(cc => <option key={cc.code} value={cc.code}>{cc.code}</option>)}
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
                      placeholder="12.345.678-9" />
                    {rutHasValue && !rutIsValid && (
                      <p className="mt-1.5 text-xs" style={{ color: "#B45309" }}>Ingresa un RUT chileno válido.</p>
                    )}
                  </div>
                </div>
                {savePersonalError && (
                  <p className="text-sm" style={{ color: "#B45309" }}>{savePersonalError}</p>
                )}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={savePersonalData}
                    disabled={isSavingPersonal || !firstName || !lastName}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}>
                    {isSavingPersonal ? "Guardando..." : "Guardar cambios"}
                  </button>
                  <button type="button" onClick={cancelPersonalEdit} disabled={isSavingPersonal}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-50"
                    style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#9CA3AF" }}>Nombre</p>
                    <p className="text-sm font-medium" style={{ color: "#0A1830" }}>{firstName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#9CA3AF" }}>Apellidos</p>
                    <p className="text-sm font-medium" style={{ color: "#0A1830" }}>{lastName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#9CA3AF" }}>Email</p>
                    <p className="text-sm font-medium" style={{ color: "#0A1830" }}>{email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#9CA3AF" }}>Teléfono</p>
                    <p className="text-sm font-medium" style={{ color: "#0A1830" }}>
                      {phone ? `${countryCode} ${phone}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold mb-1" style={{ color: "#9CA3AF" }}>RUT</p>
                    <p className="text-sm font-medium" style={{ color: "#0A1830" }}>{rut || "—"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Mis mascotas ──────────────────────────────────────────────── */}
          <div id="mascotas" className="scroll-mt-20 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#0A1830" }}>
                <PawPrint size={20} style={{ color: "#0A1830" }} />
                Mis mascotas
              </h2>
              <button type="button" onClick={() => setShowAddPetModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
                <Plus size={15} />
                Agregar mascota
              </button>
            </div>

            {pets.length === 0 && (
              <p className="text-sm" style={{ color: "#9CA3AF" }}>No tienes mascotas guardadas.</p>
            )}

            {pets.length > 0 && (
              <div className="flex flex-col gap-3 mb-2">
                {pets.map((pet) => (
                  <div key={pet.id}
                    className="flex items-start gap-3 px-4 py-4 rounded-xl border"
                    style={{ borderColor: "#E5E7EB" }}>
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#F3F4F6" }}>
                      <PawPrint size={26} style={{ color: "#0A1830" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold mb-2" style={{ color: "#0A1830" }}>{pet.name}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                        <div>
                          <p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Raza</p>
                          <p className="text-sm" style={{ color: "#0A1830" }}>{getBreedByCode(pet.breed)?.label ?? pet.breed}</p>
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
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button type="button" onClick={() => setEditingPet(pet)}
                        className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                        style={{ color: "#6B7280" }}>
                        <Pencil size={15} />
                      </button>
                      <button type="button"
                        onClick={() => setConfirmDelete({ type: "pet", id: pet.id, label: pet.name })}
                        className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: "#EF4444" }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* ── Mis direcciones ───────────────────────────────────────────── */}
          <div id="direcciones" className="scroll-mt-20 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: "#0A1830" }}>
                <MapPin size={20} style={{ color: "#0A1830" }} />
                Mis direcciones
              </h2>
              <button type="button" onClick={() => setShowAddAddressModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-semibold transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
                <Plus size={15} />
                Agregar dirección
              </button>
            </div>

            {addresses.length === 0 && (
              <p className="text-sm" style={{ color: "#9CA3AF" }}>No tienes direcciones guardadas.</p>
            )}

            {addresses.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                {addresses.map((addr, index) => {
                  const line1 = [addr.street, addr.number, addr.apartment ? `Depto ${addr.apartment}` : null].filter(Boolean).join(" ")
                  const line2 = [addr.commune, addr.city, addr.country].filter(Boolean).join(", ")
                  return (
                    <div key={addr.id}
                      className="flex items-start gap-3 px-4 py-3 rounded-xl border"
                      style={{ borderColor: "#E5E7EB" }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: "#F3F4F6" }}>
                        <Home size={18} style={{ color: "#0A1830" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold" style={{ color: "#0A1830" }}>
                          {addr.label ?? [addr.street, addr.number].filter(Boolean).join(" ")}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#555" }}>{line1}</p>
                        <p className="text-xs" style={{ color: "#6B7280" }}>{line2}</p>
                        {addr.isDefault && (
                          <span className="mt-1.5 inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}>
                            Predeterminada
                          </span>
                        )}
                      </div>
                      <button type="button"
                        onClick={() => setConfirmDelete({ type: "address", id: String(addr.id), label: addr.label ?? line1 })}
                        className="flex-shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: "#EF4444" }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

          </div>

          </div>
        </div>
      </div>

      {editingPet && (
        <EditPetModalWrapper
          pet={editingPet}
          apiFetch={apiFetch}
          onSave={(updated) => {
            setPets(prev => prev.map(p => p.id === updated.id ? updated : p))
            setEditingPet(null)
          }}
          onClose={() => setEditingPet(null)}
        />
      )}

      {showAddPetModal && (
        <AddPetModal
          apiFetch={apiFetch}
          onSave={(newPet) => {
            setPets(prev => [...prev, newPet])
            setShowAddPetModal(false)
          }}
          onClose={() => setShowAddPetModal(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmDeleteModal
          message={`¿Estás segura que quieres eliminar "${confirmDelete.label}"? Esta acción no se puede deshacer.`}
          isDeleting={isDeleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {showAddAddressModal && (
        <AddAddressModal
          apiFetch={apiFetch}
          onSave={(newAddr) => {
            setAddresses(prev => [...prev, newAddr])
            setShowAddAddressModal(false)
          }}
          onClose={() => setShowAddAddressModal(false)}
        />
      )}
    </main>
  )
}

export default function MiCuentaPage() {
  return (
    <Suspense>
      <MiCuentaContent />
    </Suspense>
  )
}
