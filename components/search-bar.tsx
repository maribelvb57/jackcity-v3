"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { MapPin, CalendarDays, Dog, Truck, Search, ChevronDown, Plus, X, Check } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { DayPicker, DateRange } from "react-day-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useSearchStore } from "@/providers/search-store-provider"
import { defaultMascota, type Mascota } from "@/stores/search-store"
import { PET_SIZE_LABEL, PET_SIZE_MAP, type PetSize } from "@/lib/api/hotels"
import { encodePetBreeds, parsePetBreedsParam, encodePetIds, parsePetIdsParam } from "@/lib/search-pets"
import { getMyProfile } from "@/lib/api/customers"
import { useApiClient } from "@/hooks/use-api-client"
import { TRANSPORT_COMMUNES, getTransportCommuneByCode } from "@/config/transport-communes"
import "react-day-picker/style.css"

const RAZAS_TAMANOS: Record<string, string> = {
  "Akita Inu": "Grande",
  "Beagle": "Mediano",
  "Border Collie": "Mediano",
  "Boxer": "Grande",
  "Bulldog Francés": "Pequeño",
  "Chihuahua": "Pequeño",
  "Cocker Spaniel": "Mediano",
  "Dachshund": "Pequeño",
  "Golden Retriever": "Grande",
  "Husky Siberiano": "Grande",
  "Labrador Retriever": "Grande",
  "Maltés": "Pequeño",
  "Pastor Alemán": "Grande",
  "Pitbull Terrier Americano": "Mediano",
  "Poodle": "Pequeño",
  "Pug": "Pequeño",
  "Rottweiler": "Extra Grande",
  "Schnauzer": "Pequeño",
  "Shih Tzu": "Pequeño",
  "Yorkshire Terrier": "Pequeño",
  "Otra Raza o mestizo": "",
}

const RAZAS = ["Sin especificar", ...Object.keys(RAZAS_TAMANOS)]

const TAMANOS = ["Pequeño", "Mediano", "Grande", "Extra Grande"]

// Normaliza el `size` de una mascota guardada a su label ("Mediano", etc.).
// Acepta el código del enum en cualquier caja (SMALL/small), o un label ya
// formateado ("Mediano"). Devuelve "" si no reconoce el valor.
function petSizeToLabel(size: string): string {
  if (!size) return ""
  const code = size.toUpperCase() as PetSize
  if (PET_SIZE_LABEL[code]) return PET_SIZE_LABEL[code]
  if (PET_SIZE_MAP[size]) return size
  return ""
}

const CITIES = [
  { code: "SANTIAGO", label: "Santiago de Chile" },
  { code: "CON", label: "Concepción (próximamente)" },
  { code: "VAL", label: "Valparaíso (próximamente)" },
  { code: "VDM", label: "Viña del Mar (próximamente)" },
]

export function SearchBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const accentColor = "rgb(0 6 255)"
  const accentHover = "rgb(0 5 220)"
  const accentSoft = "#FCE8DB"
  const accentOutline = "#D9723040"
  const fieldIconColor = "rgb(0 6 255)"

  const cardColor =   "#ffcc02" // "#FFC857"  //"#e9d62c"
  const inputColor = "#FFF9F2"
  const inputBorder = "#D9C7AE"
  const labelColor = "#0A1830"
  const helperColor = "#16233B"

  const [cityOpen, setCityOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [petsOpen, setPetsOpen] = useState(false)

  const city = useSearchStore((state) => state.city)
  const setCity = useSearchStore((state) => state.setCity)
  const dateRange = useSearchStore((state) => state.dateRange)
  const setDateRange = useSearchStore((state) => state.setDateRange)
  const needsTransport = useSearchStore((state) => state.needsTransport)
  const setNeedsTransport = useSearchStore((state) => state.setNeedsTransport)
  const transportCommuneCode = useSearchStore((state) => state.transportCommuneCode)
  const transportCommune = useSearchStore((state) => state.transportCommune)
  const setTransportCommune = useSearchStore((state) => state.setTransportCommune)
  const mascotas = useSearchStore((state) => state.mascotas)
  const setMascotas = useSearchStore((state) => state.setMascotas)

  const { user: clerkUser, isSignedIn } = useUser()
  const { apiFetch } = useApiClient()
  const [savedPets, setSavedPets] = useState<Array<{ id: string; name: string; breed: string; size: string }>>([])

  useEffect(() => {
    if (!isSignedIn || !clerkUser?.id) return
    getMyProfile(apiFetch)
      .then(data => setSavedPets(data.pets.filter(p => p.active).map(p => ({ id: String(p.id), name: p.name, breed: p.breed, size: p.size }))))
      .catch(() => {})
  }, [isSignedIn, clerkUser?.id])

  const showSavedPetsUI = isSignedIn && savedPets.length > 0

  // When saved pets UI activates, drop any default anonymous placeholder
  useEffect(() => {
    if (!showSavedPetsUI) return
    setMascotas(prev => prev.filter(m => m.petId || m.raza !== "Sin especificar"))
  }, [showSavedPetsUI])

  const effectiveMascotas = showSavedPetsUI
    ? mascotas.filter(m => m.petId || m.raza !== "Sin especificar")
    : mascotas

  const toggleSavedPet = (pet: { id: string; name: string; breed: string; size: string }) => {
    const alreadyIn = mascotas.findIndex(m => m.petId === pet.id)
    if (alreadyIn >= 0) {
      setMascotas(prev => prev.filter((_, i) => i !== alreadyIn))
    } else {
      setMascotas(prev => [...prev, { raza: pet.breed, tamano: petSizeToLabel(pet.size), petId: pet.id }])
    }
  }

  // Las mascotas registradas (con petId) ya vienen validadas desde la BD; solo
  // exigimos raza/tamaño a las mascotas anónimas que el usuario configura a mano.
  const allPetsValid = effectiveMascotas.length > 0 && effectiveMascotas.every(
    (m) => !!m.petId || (m.raza !== "Sin especificar" && (m.raza !== "Otra Raza o mestizo" || !!m.tamano))
  )
  const isSearchEnabled = !!(dateRange?.from && dateRange?.to) && allPetsValid

  // Motivo concreto por el que "Buscar hotel" está deshabilitado, para no dejar
  // al usuario con el botón gris sin saber qué campo falta.
  const searchDisabledReason = (() => {
    if (isSearchEnabled) return null
    if (!dateRange?.from || !dateRange?.to) return "Selecciona las fechas de tu estadía."
    if (effectiveMascotas.length === 0) return "Agrega al menos una mascota."
    const invalid = effectiveMascotas.find(
      (m) => !m.petId && (m.raza === "Sin especificar" || (m.raza === "Otra Raza o mestizo" && !m.tamano))
    )
    if (invalid) {
      return invalid.raza === "Sin especificar"
        ? "Indica la raza de tu mascota."
        : "Indica el tamaño de tu mascota mestiza."
    }
    return null
  })()

  const cityRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const petsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setCityOpen(false)
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) setCalendarOpen(false)
      if (petsRef.current && !petsRef.current.contains(e.target as Node)) setPetsOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    const cityParam = searchParams.get("city")
    const checkinParam = searchParams.get("checkin")
    const checkoutParam = searchParams.get("checkout")
    const petsParam = searchParams.get("pets")
    const transportParam = searchParams.get("transport")
    const communeCodeParam = searchParams.get("communeCode")
    const petBreeds = parsePetBreedsParam(searchParams.get("breeds"))

    if (!cityParam && !checkinParam && !checkoutParam && !petsParam && !transportParam && !communeCodeParam && petBreeds.length === 0) {
      return
    }

    if (cityParam) setCity(cityParam)

    if (checkinParam && checkoutParam) {
      setDateRange({
        from: new Date(`${checkinParam}T12:00:00`),
        to: new Date(`${checkoutParam}T12:00:00`),
      })
    }

    if (transportParam != null) setNeedsTransport(transportParam === "true")

    if (communeCodeParam) {
      const selectedCommune = getTransportCommuneByCode(communeCodeParam)
      if (selectedCommune) setTransportCommune(selectedCommune)
    }

    if (petsParam || petBreeds.length > 0) {
      const petSizes = petsParam?.split(",").filter(Boolean) ?? []
      const petIds = parsePetIdsParam(searchParams.get("petIds"))
      const petCount = Math.max(petSizes.length, petBreeds.length, 1)
      setMascotas(
        Array.from({ length: petCount }, (_, index) => {
          const raza = petBreeds[index] ?? "Sin especificar"
          const sizeCode = petSizes[index] as PetSize | undefined
          const tamano = sizeCode ? PET_SIZE_LABEL[sizeCode] ?? "" : RAZAS_TAMANOS[raza] ?? ""
          return { raza, tamano, petId: petIds[index] ?? null }
        })
      )
    }
  }, [])

  const petsLabel = () => {
    const count = effectiveMascotas.length
    if (count === 0) return "Mascotas"
    return count === 1 ? "1 mascota" : `${count} mascotas`
  }

  const updateMascota = (index: number, field: keyof Mascota, value: string) => {
    setMascotas((prev) =>
      prev.map((m: Mascota, i: number) => {
        if (i !== index) return m
        if (field === "raza") {
          const autoTamano = RAZAS_TAMANOS[value] ?? ""
          return { ...m, raza: value, tamano: autoTamano }
        }
        return { ...m, [field]: value }
      })
    )
  }

  const addMascota = () => {
    setMascotas((prev) => [...prev, defaultMascota()])
  }

  const removeMascota = (index: number) => {
    if (mascotas.length > 1) {
      setMascotas((prev) => prev.filter((_: Mascota, i: number) => i !== index))
    }
  }

  const dateLabel = () => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, "dd MMM", { locale: es })} – ${format(dateRange.to, "dd MMM", { locale: es })}`
    }
    if (dateRange?.from) {
      return format(dateRange.from, "dd MMM yyyy", { locale: es })
    }
    return "Selecciona fechas"
  }

  return (
    <section>
      <div className="flex items-center justify-center">
        <div
          className="w-full max-w-[1200px] px-1 pb-1 pt-1"
          style={{ background: "linear-gradient(135deg, #17312E 0%, #1F3A36 55%, #2B4A45 100%)" }}
        >
          {/* Search card */}
          <div
            className="rounded-[28px] shadow-xl p-4 md:p-[18px] border"
            style={{ backgroundColor: cardColor, borderColor: "#FFF27A", boxShadow: "0 18px 40px rgba(10, 24, 48, 0.24)" }}
          >
            <div className="mb-3 md:mb-4">
              <p
                className="text-base font-semibold leading-snug md:text-lg"
                style={{ color: helperColor }}
              >
                Encontremos juntos tu próximo dogtel...
              </p>
            </div>
            <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end">
              {/* City */}
              <div className="flex-1 min-w-0" ref={cityRef}>
                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: labelColor }}>
                  Ciudad
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCityOpen(!cityOpen)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all"
                    style={{
                      backgroundColor: inputColor,
                      borderColor: cityOpen ? accentColor : inputBorder,
                      color: city ? "#0A1830" : "#33415C",
                      outline: cityOpen ? `2px solid ${accentOutline}` : "none",
                    }}
                  >
                    <MapPin size={16} style={{ color: fieldIconColor, flexShrink: 0 }} />
                    <span className="flex-1 text-left truncate">{CITIES.find((c) => c.code === city)?.label || "¿En que ciudad?"}</span>
                    <ChevronDown size={16} style={{ color: fieldIconColor, transform: cityOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </button>

                  {cityOpen && (
                    <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-xl shadow-xl border overflow-hidden" style={{ backgroundColor: inputColor, borderColor: inputBorder }}>
                      {CITIES.map((c) => {
                        const isDisabled = c.code !== "SANTIAGO"
                        const isSelected = city === c.code
                        return (
                          <button
                            key={c.code}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => { setCity(c.code); setCityOpen(false) }}
                            className="w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 transition-colors"
                            style={{
                              backgroundColor: isSelected ? accentSoft : "transparent",
                              color: isDisabled ? "#AAAAAA" : isSelected ? accentColor : "#0A1830",
                              fontWeight: isSelected ? 600 : 400,
                              cursor: isDisabled ? "not-allowed" : "pointer",
                            }}
                            onMouseEnter={(e) => { if (!isDisabled && !isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#FAFAF5" }}
                            onMouseLeave={(e) => { if (!isDisabled && !isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent" }}
                          >
                            <MapPin size={14} style={{ color: isDisabled ? "#CCCCCC" : fieldIconColor }} />
                            {c.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Date range */}
              <div className="flex-1 min-w-0" ref={calendarRef}>
                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: labelColor }}>
                  Fechas
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCalendarOpen(!calendarOpen)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all"
                    style={{
                      backgroundColor: inputColor,
                      borderColor: calendarOpen ? accentColor : inputBorder,
                      color: dateRange?.from ? "#0A1830" : "#33415C",
                      outline: calendarOpen ? `2px solid ${accentOutline}` : "none",
                    }}
                  >
                    <CalendarDays size={16} style={{ color: fieldIconColor, flexShrink: 0 }} />
                    <span className="flex-1 text-left truncate">{dateLabel()}</span>
                    <ChevronDown size={16} style={{ color: fieldIconColor, transform: calendarOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </button>

                  {calendarOpen && (
                    <div className="absolute top-full mt-1 left-0 z-50 rounded-2xl shadow-2xl border p-3" style={{ backgroundColor: inputColor, borderColor: inputBorder, minWidth: 320 }}>
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        locale={es}
                        numberOfMonths={1}
                        disabled={(date) => {
                          const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
                          const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0,0,0,0)
                          if (d < tomorrow) return true
                          if (dateRange?.from && !dateRange?.to) {
                            const from = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate())
                            if (d.getTime() === from.getTime()) return true
                          }
                          return false
                        }}
                        styles={{
                          root: { fontFamily: '"Proxima Nova", "Avenir Next", Avenir, "Segoe UI", sans-serif', fontSize: "0.875rem", color: "#0A1830" },
                          month_caption: { color: "#0A1830" },
                          caption_label: { color: "#0A1830", fontWeight: 700 },
                          nav_button: { color: "#0A1830", backgroundColor: "#FFFFFF", border: "1px solid #D9C7AE" },
                          day: { color: "#0A1830" },
                          weekday: { color: "#0A1830", fontWeight: 700 },
                        }}
                        modifiersStyles={{
                          selected: { backgroundColor: accentColor, color: "#fff", borderRadius: "8px" },
                          range_start: { backgroundColor: accentColor, color: "#fff", borderRadius: "8px 0 0 8px" },
                          range_end: { backgroundColor: accentColor, color: "#fff", borderRadius: "0 8px 8px 0" },
                          range_middle: { backgroundColor: accentSoft, color: "#2D2A20" },
                          today: { fontWeight: 700, color: "#D97230" },
                        }}
                      />
                      {dateRange?.from && dateRange?.to && (
                        <div className="mt-2 pt-2 border-t flex justify-end" style={{ borderColor: "#E5DFC8" }}>
                          <button
                            type="button"
                            onClick={() => setCalendarOpen(false)}
                            className="px-4 py-1.5 rounded-lg text-sm font-semibold text-white"
                            style={{ backgroundColor: accentColor }}
                          >
                            Confirmar
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Pets */}
              <div className="flex-1 min-w-0 relative" ref={petsRef}>
                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase" style={{ color: labelColor }}>
                  Mascotas
                </label>
                <button
                  type="button"
                  onClick={() => setPetsOpen(!petsOpen)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm transition-all"
                  style={{
                    backgroundColor: inputColor,
                    borderColor: petsOpen ? accentColor : inputBorder,
                    color: "#0A1830",
                    outline: petsOpen ? `2px solid ${accentOutline}` : "none",
                  }}
                >
                  <Dog size={16} style={{ color: fieldIconColor, flexShrink: 0 }} />
                  <span className="flex-1 text-left">{petsLabel()}</span>
                  <ChevronDown size={16} style={{ color: fieldIconColor, transform: petsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>

                {petsOpen && (
                  <div
                    className="absolute top-full mt-1 left-0 z-50 rounded-2xl shadow-2xl border p-4"
                    style={{ backgroundColor: inputColor, borderColor: inputBorder, minWidth: 300, width: "100%" }}
                  >
                    {showSavedPetsUI ? (
                      <>
                        {/* Saved pets checkboxes */}
                        {savedPets.map(pet => {
                          const isChecked = mascotas.some(m => m.petId === pet.id)
                          const sizeLabel = petSizeToLabel(pet.size) || pet.size
                          return (
                            <button
                              key={pet.id}
                              type="button"
                              onClick={() => toggleSavedPet(pet)}
                              className="flex items-center gap-3 w-full mb-3 text-left"
                            >
                              <div className="w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center"
                                style={{ borderColor: isChecked ? accentColor : "#D1D5DB", backgroundColor: isChecked ? accentColor : "transparent" }}>
                                {isChecked && <Check size={10} strokeWidth={3} style={{ color: "#fff" }} />}
                              </div>
                              <span className="text-sm" style={{ color: "#0A1830" }}>
                                {pet.name}{" "}
                                <span style={{ color: helperColor }}>({pet.breed} / {sizeLabel})</span>
                              </span>
                            </button>
                          )
                        })}

                        {/* Anonymous mascotas (raza selector) */}
                        {mascotas.filter(m => !m.petId).map((mascota, anonIdx) => {
                          const globalIdx = mascotas.findIndex((m, i) => !m.petId && mascotas.slice(0, i).filter(x => !x.petId).length === anonIdx)
                          return (
                            <div key={`anon-${anonIdx}`} className="mt-3 pt-3 border-t" style={{ borderColor: "#E5DFC8" }}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold" style={{ color: "#0A1830" }}>Otra mascota</span>
                                <button type="button" onClick={() => removeMascota(globalIdx)}
                                  className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-red-50"
                                  style={{ color: "#aaa" }}>
                                  <X size={13} />
                                </button>
                              </div>
                              <div className="flex items-center gap-3 mb-2.5">
                                <span className="text-sm w-16 flex-shrink-0" style={{ color: helperColor }}>Raza</span>
                                <div className="relative flex-1">
                                  <select value={mascota.raza} onChange={(e) => updateMascota(globalIdx, "raza", e.target.value)}
                                    className="w-full appearance-none px-3 py-1.5 pr-8 rounded-lg border text-sm"
                                    style={{ backgroundColor: "#fff", borderColor: inputBorder, color: "#0A1830" }}>
                                    {RAZAS.map(r => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                  <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldIconColor }} />
                                </div>
                              </div>
                              {(() => {
                                const isOtraRaza = mascota.raza === "Otra Raza o mestizo"
                                const isDisabled = !isOtraRaza
                                return (
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm w-16 flex-shrink-0" style={{ color: helperColor }}>Tamaño</span>
                                    <div className="relative flex-1">
                                      <select value={mascota.tamano} onChange={(e) => updateMascota(globalIdx, "tamano", e.target.value)}
                                        disabled={isDisabled}
                                        className="w-full appearance-none px-3 py-1.5 pr-8 rounded-lg border text-sm"
                                        style={{ backgroundColor: isDisabled ? "#F5F3EE" : "#fff", borderColor: inputBorder, color: mascota.tamano ? "#0A1830" : "#999", cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.7 : 1 }}>
                                        <option value="" disabled>Indicar tamaño</option>
                                        {TAMANOS.map(t => <option key={t} value={t}>{t}</option>)}
                                      </select>
                                      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldIconColor }} />
                                    </div>
                                  </div>
                                )
                              })()}
                            </div>
                          )
                        })}

                        {/* Agregar otra mascota */}
                        {mascotas.length < 3 && (
                          <button type="button" onClick={addMascota}
                            className="flex items-center gap-1.5 text-sm font-medium mt-3 mb-4 transition-opacity hover:opacity-70"
                            style={{ color: accentColor }}>
                            <Plus size={14} />
                            Agregar otra mascota
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Guest UI — existing behavior */}
                        {mascotas.map((mascota, index) => (
                          <div key={index} className="mb-4 relative">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-bold" style={{ color: "#0A1830" }}>Mascota {index + 1}</span>
                              {mascotas.length > 1 && (
                                <button type="button" onClick={() => removeMascota(index)}
                                  className="flex items-center justify-center w-5 h-5 rounded-full transition-colors hover:bg-red-50"
                                  style={{ color: "#aaa" }}>
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mb-2.5">
                              <span className="text-sm w-16 flex-shrink-0" style={{ color: helperColor }}>Raza</span>
                              <div className="relative flex-1">
                                <select value={mascota.raza} onChange={(e) => updateMascota(index, "raza", e.target.value)}
                                  className="w-full appearance-none px-3 py-1.5 pr-8 rounded-lg border text-sm"
                                  style={{ backgroundColor: "#fff", borderColor: inputBorder, color: "#0A1830" }}>
                                  {RAZAS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldIconColor }} />
                              </div>
                            </div>
                            {(() => {
                              const isOtraRaza = mascota.raza === "Otra Raza o mestizo"
                              const isDisabled = !isOtraRaza
                              return (
                                <div className="flex items-center gap-3">
                                  <span className="text-sm w-16 flex-shrink-0" style={{ color: helperColor }}>Tamaño</span>
                                  <div className="relative flex-1">
                                    <select value={mascota.tamano} onChange={(e) => updateMascota(index, "tamano", e.target.value)}
                                      disabled={isDisabled}
                                      className="w-full appearance-none px-3 py-1.5 pr-8 rounded-lg border text-sm"
                                      style={{ backgroundColor: isDisabled ? "#F5F3EE" : "#fff", borderColor: inputBorder, color: mascota.tamano ? "#0A1830" : "#999", cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.7 : 1 }}>
                                      <option value="" disabled>Indicar tamaño</option>
                                      {TAMANOS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldIconColor }} />
                                  </div>
                                </div>
                              )
                            })()}
                            {index < mascotas.length - 1 && <div className="mt-4 border-t" style={{ borderColor: "#E5DFC8" }} />}
                          </div>
                        ))}
                        {mascotas.length < 3 && (
                          <button type="button" onClick={addMascota}
                            className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-opacity hover:opacity-70"
                            style={{ color: accentColor }}>
                            <Plus size={14} />
                            Agregar otra mascota
                          </button>
                        )}
                      </>
                    )}

                    <div className="mb-4 border-t" style={{ borderColor: "#E5DFC8" }} />

                    {/* Listo */}
                    <div className="flex justify-end">
                      <button type="button" onClick={() => setPetsOpen(false)}
                        className="px-5 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors"
                        style={{ backgroundColor: accentColor }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accentColor)}>
                        Listo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Search button */}
              <div className="flex flex-col justify-end">
                <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase opacity-0 select-none" aria-hidden="true">
                  &nbsp;
                </label>
                <button
                  type="button"
                  disabled={!isSearchEnabled}
                  onClick={() => {
                    if (!isSearchEnabled || !dateRange?.from || !dateRange?.to) return
                    const params = new URLSearchParams({
                      city,
                      checkin: format(dateRange.from, "yyyy-MM-dd"),
                      checkout: format(dateRange.to, "yyyy-MM-dd"),
                      pets: effectiveMascotas.map((m) => PET_SIZE_MAP[m.tamano] ?? "SMALL").join(","),
                      breeds: encodePetBreeds(effectiveMascotas.map((m) => m.raza)),
                      petIds: encodePetIds(effectiveMascotas.map((m) => m.petId ?? null)),
                      transport: String(needsTransport),
                      ...(needsTransport && {
                        communeCode: transportCommuneCode,
                        commune: transportCommune,
                      }),
                    })
                    router.push(`/search?${params.toString()}`)
                  }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${isSearchEnabled ? "shadow-md hover:shadow-lg active:scale-95" : "cursor-not-allowed opacity-50"}`}
                  style={{
                    backgroundColor: isSearchEnabled ? accentColor : "#6B7280",
                    color: "#fff",
                    boxShadow: isSearchEnabled ? "0 10px 24px rgba(217, 114, 48, 0.35)" : "none",
                  }}
                  onMouseEnter={(e) => { if (isSearchEnabled) (e.currentTarget.style.backgroundColor = accentHover) }}
                  onMouseLeave={(e) => { if (isSearchEnabled) (e.currentTarget.style.backgroundColor = accentColor) }}
                >
                  <Search size={16} />
                  Buscar hotel !!
                </button>
              </div>
            </div>

            {searchDisabledReason && (
              <p className="mt-2 text-sm font-medium md:text-right" style={{ color: "#8A1C1C" }}>
                {searchDisabledReason}
              </p>
            )}

            {/* Transport checkbox */}
            <div className="mt-3 pt-3 border-t flex flex-col gap-3 md:flex-row md:items-center md:gap-4" style={{ borderColor: "rgba(10, 24, 48, 0.18)" }}>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={needsTransport}
                  onClick={() => setNeedsTransport(!needsTransport)}
                  className="w-5 h-5 rounded-none border-2 flex items-center justify-center transition-all flex-shrink-0"
                  style={{
                    borderColor: needsTransport ? accentColor : "#C8BFA0",
                    backgroundColor: needsTransport ? accentColor : "#fff",
                  }}
                >
                  {needsTransport && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <Truck size={15} style={{ color: "#0A1830", flexShrink: 0 }} />
                <span className="text-sm" style={{ color: helperColor }}>
                  Necesito transporte para mi mascota
                </span>
              </div>

              {needsTransport && (
                <div className="w-full max-w-sm md:w-48 md:max-w-none">
                  <label className="block text-xs font-semibold mb-1.5 tracking-wide uppercase md:sr-only" style={{ color: labelColor }}>
                    Comuna
                  </label>
                  <div className="relative">
                    <select
                      value={transportCommuneCode}
                      onChange={(e) => {
                        const selectedCommune = getTransportCommuneByCode(e.target.value)
                        if (selectedCommune) setTransportCommune(selectedCommune)
                      }}
                      className="w-full appearance-none px-3 py-2 pr-9 rounded-xl border text-sm outline-none md:py-1.5"
                      style={{ backgroundColor: inputColor, borderColor: inputBorder, color: "#0A1830" }}
                    >
                      {TRANSPORT_COMMUNES.map((item) => (
                        <option key={item.communeCode} value={item.communeCode}>
                          {item.commune}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldIconColor }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
