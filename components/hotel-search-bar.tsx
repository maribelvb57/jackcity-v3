"use client"

import { useState, useRef, useEffect } from "react"
import { CalendarDays, Dog, Search, ChevronDown, Plus, X, Check } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { DayPicker, Chevron } from "react-day-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useSearchStore } from "@/providers/search-store-provider"
import { defaultMascota, type Mascota } from "@/stores/search-store"
import { PET_SIZE_LABEL, PET_SIZE_MAP, type PetSize } from "@/lib/api/hotels"
import { DOG_BREEDS, breedDisplayLabel, getBreedByCode, getBreedSizeByCode, breedRequiresManualSize, resolveBreedCode } from "@/lib/dog-breeds"
import { getMinCheckinDate, startOfLocalDay, CHECKIN_CUTOFF_HOUR } from "@/lib/booking-dates"
import { getMyProfile } from "@/lib/api/customers"
import { useApiClient } from "@/hooks/use-api-client"
import { TRANSPORT_COMMUNES, getTransportCommuneByCode } from "@/config/transport-communes"
import { checkHotelAvailability, getAvailabilityFailureReason } from "@/lib/api/availability"
import type { AvailabilityFailureReason, AvailabilitySearch, HotelAvailability } from "@/lib/api/availability"
import { HotelUnavailableDialog } from "@/components/hotel-unavailable-dialog"
import "react-day-picker/style.css"

// Opciones del combobox de raza: value = code (lo que manejamos internamente), label = texto al usuario.
// "Sin especificar" es el centinela de "sin elegir" (se filtra antes de enviar).
const RAZA_OPTIONS = [
  { value: "Sin especificar", label: "Sin especificar" },
  ...DOG_BREEDS.map((b) => ({ value: b.code, label: breedDisplayLabel(b) })),
]

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

/**
 * Buscador de la ficha de hotel. Es el mismo de la home (SearchBar) con dos
 * diferencias: no muestra el selector de ciudad —la ciudad se toma del store,
 * que parte en SANTIAGO— y usa una paleta sobria en vez del amarillo.
 *
 * A diferencia de la home, no navega al listado: consulta la disponibilidad de
 * este hotel y avisa al contenedor cuando hay cupo. Si no lo hay, explica el
 * motivo en un modal. Tampoco hidrata desde la query string: estas páginas son
 * estáticas y no reciben parámetros de búsqueda.
 */
export function HotelSearchBar({
  hotelKeyName,
  onAvailable,
  cardColor,
  cardBorder,
}: {
  hotelKeyName: string
  onAvailable: (search: AvailabilitySearch, availability: HotelAvailability) => void
  cardColor: string
  cardBorder: string
}) {
  // Paleta sobria: inputs blancos y acento en el azul de la marca. El color de la
  // tarjeta llega por props para que el resumen de reserva use exactamente el mismo.
  const accentColor = "#28548f"
  const accentHover = "#1F4272"
  const accentSoft = "#E3ECF7"
  const accentOutline = "#28548f40"
  const fieldIconColor = "#28548f"

  const inputColor = "#FFFFFF"
  const inputBorder = "#D9E0EA"
  const dividerColor = "#E5E7EB"
  const labelColor = "#0A1830"
  const helperColor = "#4A5A70"

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [petsOpen, setPetsOpen] = useState(false)

  const [isChecking, setIsChecking] = useState(false)
  const [checkError, setCheckError] = useState(false)
  // Motivo del rechazo; mientras no sea null el modal queda abierto.
  const [failureReason, setFailureReason] = useState<AvailabilityFailureReason | null>(null)

  const city = useSearchStore((state) => state.city)
  const dateRange = useSearchStore((state) => state.dateRange)
  const setDateRange = useSearchStore((state) => state.setDateRange)
  const needsTransport = useSearchStore((state) => state.needsTransport)
  const setNeedsTransport = useSearchStore((state) => state.setNeedsTransport)
  const transportCommuneCode = useSearchStore((state) => state.transportCommuneCode)
  const transportCommune = useSearchStore((state) => state.transportCommune)
  const setTransportCommune = useSearchStore((state) => state.setTransportCommune)
  const mascotas = useSearchStore((state) => state.mascotas)
  const setMascotas = useSearchStore((state) => state.setMascotas)

  // Primer día seleccionable. Se guarda como timestamp para que React descarte el
  // re-render mientras el mínimo no cambie, y se revisa cada minuto por si el
  // usuario deja la página abierta y cruza la hora de corte de Chile.
  const [minCheckinTs, setMinCheckinTs] = useState(() => getMinCheckinDate().getTime())
  const minCheckinDate = new Date(minCheckinTs)

  useEffect(() => {
    const id = setInterval(() => {
      setMinCheckinTs(getMinCheckinDate().getTime())
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  // Un rango elegido antes puede quedar fuera de plazo al cruzar la hora de corte:
  // lo descartamos para que el usuario vuelva a elegir, avisándole por qué
  // desaparecieron sus fechas.
  const [clearedByCutoff, setClearedByCutoff] = useState(false)

  useEffect(() => {
    if (dateRange?.from && startOfLocalDay(dateRange.from) < minCheckinDate) {
      setDateRange(undefined)
      setClearedByCutoff(true)
    }
  }, [minCheckinTs, dateRange])

  const { user: clerkUser, isSignedIn } = useUser()
  const { apiFetch } = useApiClient()
  const [savedPets, setSavedPets] = useState<Array<{ id: string; name: string; breed: string; size: string }>>([])

  useEffect(() => {
    if (!isSignedIn || !clerkUser?.id) return
    getMyProfile(apiFetch)
      .then(data => setSavedPets(data.pets.filter(p => p.active).map(p => ({ id: String(p.id), name: p.name, breed: resolveBreedCode(p.breed), size: p.size }))))
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
    (m) => !!m.petId || (m.raza !== "Sin especificar" && (!breedRequiresManualSize(m.raza) || !!m.tamano))
  )
  const checkinTooSoon = !!dateRange?.from && startOfLocalDay(dateRange.from) < minCheckinDate
  // La comuna solo es obligatoria si el usuario marcó que necesita transporte.
  const missingTransportCommune = needsTransport && !transportCommuneCode
  const isSearchEnabled =
    !!(dateRange?.from && dateRange?.to) && !checkinTooSoon && allPetsValid && !missingTransportCommune

  // Solo mostramos el motivo del botón deshabilitado después de que el usuario
  // intentó buscar; nunca al entrar por primera vez sin haber hecho nada.
  const [attemptedSearch, setAttemptedSearch] = useState(false)

  // Motivo concreto por el que "Buscar hotel" está deshabilitado, para no dejar
  // al usuario con el botón gris sin saber qué campo falta.
  const searchDisabledReason = (() => {
    if (isSearchEnabled) return null
    if (!dateRange?.from || !dateRange?.to) return "Selecciona las fechas de tu estadía."
    if (checkinTooSoon) {
      return `Después de las ${CHECKIN_CUTOFF_HOUR}:00 hrs no se aceptan reservas para el día siguiente. Elige una fecha de inicio desde el ${format(minCheckinDate, "EEEE d 'de' MMMM", { locale: es })}.`
    }
    if (effectiveMascotas.length === 0) return "Agrega al menos una mascota."
    const invalid = effectiveMascotas.find(
      (m) => !m.petId && (m.raza === "Sin especificar" || (breedRequiresManualSize(m.raza) && !m.tamano))
    )
    if (invalid) {
      return invalid.raza === "Sin especificar"
        ? "Indica la raza de tu mascota."
        : "Indica el tamaño de tu mascota."
    }
    if (missingTransportCommune) return "Selecciona la comuna de retiro para el transporte."
    return null
  })()

  const calendarRef = useRef<HTMLDivElement>(null)
  const petsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) setCalendarOpen(false)
      if (petsRef.current && !petsRef.current.contains(e.target as Node)) setPetsOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
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
          const inferredSize = getBreedSizeByCode(value)
          const autoTamano = inferredSize ? PET_SIZE_LABEL[inferredSize] : ""
          // Cambiar la raza a mano significa que ya no es la mascota guardada:
          // limpiamos petId para no enviar un id que no corresponde a esta raza.
          return { ...m, raza: value, tamano: autoTamano, petId: null }
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

  const handleSearch = async () => {
    if (!isSearchEnabled || !dateRange?.from || !dateRange?.to) {
      setAttemptedSearch(true)
      return
    }
    // El corte pudo cumplirse dentro del último minuto (entre ticks del
    // intervalo): revalidamos con la hora real antes de consultar.
    const freshMin = getMinCheckinDate()
    if (startOfLocalDay(dateRange.from) < freshMin) {
      setMinCheckinTs(freshMin.getTime())
      setAttemptedSearch(true)
      return
    }

    const search: AvailabilitySearch = {
      city,
      checkinDate: format(dateRange.from, "yyyy-MM-dd"),
      checkoutDate: format(dateRange.to, "yyyy-MM-dd"),
      needsTransport,
      transportCommune: needsTransport ? transportCommuneCode : null,
      pets: effectiveMascotas.map((m) => ({
        // Un invitado no tiene mascotas guardadas: forzamos id null para no arrastrar
        // un id viejo de una búsqueda previa (logueada).
        id: isSignedIn ? (m.petId ?? null) : null,
        breed: m.raza,
        size: PET_SIZE_MAP[m.tamano] ?? "SMALL",
      })),
    }

    setIsChecking(true)
    setCheckError(false)
    try {
      const availability = await checkHotelAvailability({ hotelKeyName, search, apiFetch })
      if (availability.bookingAvailable) {
        onAvailable(search, availability)
        return
      }
      setFailureReason(getAvailabilityFailureReason(availability))
    } catch {
      setCheckError(true)
    } finally {
      setIsChecking(false)
    }
  }

  // Salidas del modal: en ambas el usuario vuelve al buscador y decide cuándo
  // volver a apretar "Buscar".
  const handleNewSearch = () => setFailureReason(null)

  const handleSearchWithoutTransport = () => {
    setNeedsTransport(false)
    setFailureReason(null)
  }

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ backgroundColor: cardColor, borderColor: cardBorder }}
    >
      <h2 className="text-lg font-bold mb-4" style={{ color: labelColor }}>
        ¿Quieres reservar en este hotel?
      </h2>

      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-end">
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
              <div
                className="absolute top-full mt-1 left-0 z-50 rounded-2xl shadow-2xl border p-2"
                style={{ backgroundColor: inputColor, borderColor: inputBorder }}
              >
                <DayPicker
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => { setClearedByCutoff(false); setDateRange(range) }}
                  locale={es}
                  numberOfMonths={1}
                  disabled={(date) => {
                    const d = startOfLocalDay(date)
                    if (d < minCheckinDate) return true
                    if (dateRange?.from && !dateRange?.to) {
                      const from = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate())
                      if (d.getTime() === from.getTime()) return true
                    }
                    return false
                  }}
                  styles={{
                    // Las medidas van aquí y no en el div padre: react-day-picker declara
                    // sus variables sobre `.rdp-root`, y esa declaración propia gana sobre
                    // cualquier valor heredado del contenedor. `styles.root` se aplica
                    // inline sobre ese mismo elemento, así que sí las pisa.
                    root: {
                      fontFamily: '"Proxima Nova", "Avenir Next", Avenir, "Segoe UI", sans-serif',
                      fontSize: "0.875rem",
                      color: "#0A1830",
                      // react-day-picker v9 pinta el círculo del día seleccionado con
                      // su propia variable (azul por defecto), no con modifiersStyles:
                      // hay que sobreescribirla para que tome el acento de la tarjeta.
                      "--rdp-accent-color": accentColor,
                      "--rdp-accent-background-color": accentSoft,
                      "--rdp-today-color": accentColor,
                      "--rdp-day-width": "34px",
                      "--rdp-day-height": "34px",
                      "--rdp-day_button-width": "32px",
                      "--rdp-day_button-height": "32px",
                      "--rdp-nav-height": "2rem",
                      "--rdp-nav_button-width": "1.75rem",
                      "--rdp-nav_button-height": "1.75rem",
                      "--rdp-weekday-padding": "0.1875rem 0",
                    } as React.CSSProperties,
                    // `font-size: large` viene fijo en el CSS de react-day-picker (no es
                    // una variable): sin bajarlo, el mes queda apretado en la nav de 2rem.
                    month_caption: { color: "#0A1830", fontSize: "0.9375rem" },
                    caption_label: { color: "#0A1830", fontWeight: 700 },
                    nav_button: { color: "#0A1830", backgroundColor: "#FFFFFF", border: `1px solid ${inputBorder}` },
                    day: { color: "#0A1830" },
                    weekday: { color: "#0A1830", fontWeight: 700 },
                  }}
                  // El chevron sale a 24px por defecto y solo recibe `className`, nunca
                  // `style`: el tamaño únicamente se puede bajar sustituyendo el componente.
                  components={{ Chevron: (chevronProps) => <Chevron {...chevronProps} size={14} /> }}
                  modifiersStyles={{
                    selected: { backgroundColor: accentColor, color: "#fff", borderRadius: "8px" },
                    range_start: { backgroundColor: accentColor, color: "#fff", borderRadius: "8px 0 0 8px" },
                    range_end: { backgroundColor: accentColor, color: "#fff", borderRadius: "0 8px 8px 0" },
                    range_middle: { backgroundColor: accentSoft, color: "#0A1830" },
                    today: { fontWeight: 700, color: accentColor },
                  }}
                />
                {dateRange?.from && dateRange?.to && (
                  <div className="mt-1.5 pt-1.5 border-t flex justify-end" style={{ borderColor: dividerColor }}>
                    <button
                      type="button"
                      onClick={() => setCalendarOpen(false)}
                      className="px-4 py-1 rounded-lg text-sm font-semibold text-white"
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
                          <span style={{ color: helperColor }}>({getBreedByCode(pet.breed)?.label ?? pet.breed} / {sizeLabel})</span>
                        </span>
                      </button>
                    )
                  })}

                  {/* Anonymous mascotas (raza selector) */}
                  {mascotas.filter(m => !m.petId).map((mascota, anonIdx) => {
                    const globalIdx = mascotas.findIndex((m, i) => !m.petId && mascotas.slice(0, i).filter(x => !x.petId).length === anonIdx)
                    return (
                      <div key={`anon-${anonIdx}`} className="mt-3 pt-3 border-t" style={{ borderColor: dividerColor }}>
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
                              {RAZA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldIconColor }} />
                          </div>
                        </div>
                        {(() => {
                          const isDisabled = !breedRequiresManualSize(mascota.raza)
                          return (
                            <div className="flex items-center gap-3">
                              <span className="text-sm w-16 flex-shrink-0" style={{ color: helperColor }}>Tamaño</span>
                              <div className="relative flex-1">
                                <select value={mascota.tamano} onChange={(e) => updateMascota(globalIdx, "tamano", e.target.value)}
                                  disabled={isDisabled}
                                  className="w-full appearance-none px-3 py-1.5 pr-8 rounded-lg border text-sm"
                                  style={{ backgroundColor: isDisabled ? "#F1F4F8" : "#fff", borderColor: inputBorder, color: mascota.tamano ? "#0A1830" : "#999", cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.7 : 1 }}>
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
                            {RAZA_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldIconColor }} />
                        </div>
                      </div>
                      {(() => {
                        const isDisabled = !breedRequiresManualSize(mascota.raza)
                        return (
                          <div className="flex items-center gap-3">
                            <span className="text-sm w-16 flex-shrink-0" style={{ color: helperColor }}>Tamaño</span>
                            <div className="relative flex-1">
                              <select value={mascota.tamano} onChange={(e) => updateMascota(index, "tamano", e.target.value)}
                                disabled={isDisabled}
                                className="w-full appearance-none px-3 py-1.5 pr-8 rounded-lg border text-sm"
                                style={{ backgroundColor: isDisabled ? "#F1F4F8" : "#fff", borderColor: inputBorder, color: mascota.tamano ? "#0A1830" : "#999", cursor: isDisabled ? "not-allowed" : "pointer", opacity: isDisabled ? 0.7 : 1 }}>
                                <option value="" disabled>Indicar tamaño</option>
                                {TAMANOS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldIconColor }} />
                            </div>
                          </div>
                        )
                      })()}
                      {index < mascotas.length - 1 && <div className="mt-4 border-t" style={{ borderColor: dividerColor }} />}
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

              <div className="mb-4 border-t" style={{ borderColor: dividerColor }} />

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
            aria-disabled={!isSearchEnabled}
            disabled={isChecking}
            onClick={handleSearch}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${isSearchEnabled && !isChecking ? "shadow-md hover:shadow-lg active:scale-95" : "cursor-not-allowed"}`}
            style={{
              backgroundColor: isSearchEnabled ? accentColor : "#9CA3AF",
              color: isSearchEnabled ? "#fff" : "#F3F4F6",
              opacity: isChecking ? 0.7 : 1,
            }}
            onMouseEnter={(e) => { if (isSearchEnabled && !isChecking) (e.currentTarget.style.backgroundColor = accentHover) }}
            onMouseLeave={(e) => { if (isSearchEnabled && !isChecking) (e.currentTarget.style.backgroundColor = accentColor) }}
          >
            <Search size={16} />
            {isChecking ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </div>

      {clearedByCutoff && (
        <p className="mt-2 text-sm font-medium md:text-right" style={{ color: "#8A1C1C" }}>
          Después de las {CHECKIN_CUTOFF_HOUR}:00 hrs (hora de Chile) no se aceptan reservas
          para el día siguiente. Vuelve a elegir tus fechas desde el{" "}
          {format(minCheckinDate, "EEEE d 'de' MMMM", { locale: es })}.
        </p>
      )}

      {attemptedSearch && searchDisabledReason && !clearedByCutoff && (
        <p className="mt-2 text-sm font-medium md:text-right" style={{ color: "#8A1C1C" }}>
          {searchDisabledReason}
        </p>
      )}

      {checkError && (
        <p className="mt-2 text-sm font-medium md:text-right" style={{ color: "#8A1C1C" }}>
          No pudimos verificar la disponibilidad. Intenta nuevamente.
        </p>
      )}

      {/* Transport checkbox */}
      <div className="mt-3 pt-3 border-t flex flex-col gap-3 md:flex-row md:items-center md:gap-4" style={{ borderColor: dividerColor }}>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            role="checkbox"
            aria-checked={needsTransport}
            onClick={() => setNeedsTransport(!needsTransport)}
            className="w-5 h-5 rounded-none border-2 flex items-center justify-center transition-all flex-shrink-0"
            style={{
              borderColor: needsTransport ? accentColor : "#C3CCD8",
              backgroundColor: needsTransport ? accentColor : "#fff",
            }}
          >
            {needsTransport && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="text-lg leading-none flex-shrink-0" aria-hidden="true">🚘</span>
          <span className="text-sm font-medium" style={{ color: helperColor }}>
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
                aria-invalid={attemptedSearch && missingTransportCommune}
                onChange={(e) => {
                  const selectedCommune = getTransportCommuneByCode(e.target.value)
                  if (selectedCommune) setTransportCommune(selectedCommune)
                }}
                className="w-full appearance-none px-3 py-2 pr-9 rounded-xl border text-sm outline-none md:py-1.5"
                style={{
                  backgroundColor: inputColor,
                  borderColor: attemptedSearch && missingTransportCommune ? "#8A1C1C" : inputBorder,
                  color: transportCommuneCode ? "#0A1830" : "#33415C",
                }}
              >
                <option value="" disabled>
                  Seleccionar comuna
                </option>
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

      <HotelUnavailableDialog
        open={failureReason !== null}
        reason={failureReason}
        onOpenChange={(open) => { if (!open) setFailureReason(null) }}
        onNewSearch={handleNewSearch}
        onSearchWithoutTransport={handleSearchWithoutTransport}
      />
    </div>
  )
}
