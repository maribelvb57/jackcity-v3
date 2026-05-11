"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MapPin, CalendarDays, Dog, Truck, Search, ChevronDown, Plus, X } from "lucide-react"
import { DayPicker, DateRange } from "react-day-picker"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useSearchStore } from "@/providers/search-store-provider"
import { defaultMascota, type Mascota } from "@/stores/search-store"
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

const CITIES = [
  { code: "SAN", label: "Santiago de Chile" },
  { code: "CON", label: "Concepción (próximamente)" },
  { code: "VAL", label: "Valparaíso (próximamente)" },
  { code: "VDM", label: "Viña del Mar (próximamente)" },
]

export function SearchBar() {
  const router = useRouter()

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
  const toggleNeedsTransport = useSearchStore((state) => state.toggleNeedsTransport)
  const mascotas = useSearchStore((state) => state.mascotas)
  const setMascotas = useSearchStore((state) => state.setMascotas)

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

  const petsLabel = () => {
    const count = mascotas.length
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
                        const isDisabled = c.code !== "SAN"
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
                    <span className="flex-1 text-left">{dateLabel()}</span>
                  </button>

                  {calendarOpen && (
                    <div className="absolute top-full mt-1 left-0 z-50 rounded-2xl shadow-2xl border p-3" style={{ backgroundColor: inputColor, borderColor: inputBorder, minWidth: 320 }}>
                      <DayPicker
                        mode="range"
                        selected={dateRange}
                        onSelect={setDateRange}
                        locale={es}
                        numberOfMonths={1}
                        fromDate={new Date()}
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
                    {mascotas.map((mascota, index) => (
                      <div key={index} className="mb-4 relative">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold" style={{ color: "#0A1830" }}>
                            Mascota {index + 1}
                          </span>
                          {mascotas.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeMascota(index)}
                              className="flex items-center justify-center w-5 h-5 rounded-full transition-colors hover:bg-red-50"
                              style={{ color: "#aaa" }}
                              aria-label="Eliminar mascota"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>

                        {/* Raza */}
                        <div className="flex items-center gap-3 mb-2.5">
                          <span className="text-sm w-16 flex-shrink-0" style={{ color: helperColor }}>
                            Raza
                          </span>
                          <div className="relative flex-1">
                            <select
                              value={mascota.raza}
                              onChange={(e) => updateMascota(index, "raza", e.target.value)}
                              className="w-full appearance-none px-3 py-1.5 pr-8 rounded-lg border text-sm"
                              style={{
                                backgroundColor: "#fff",
                                borderColor: inputBorder,
                                color: "#0A1830",
                              }}
                            >
                              {RAZAS.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldIconColor }} />
                          </div>
                        </div>

                        {/* Tamaño */}
                        {(() => {
                          const isOtraRaza = mascota.raza === "Otra Raza o mestizo"
                          const isDisabled = !isOtraRaza
                          return (
                            <div className="flex items-center gap-3">
                              <span className="text-sm w-16 flex-shrink-0" style={{ color: helperColor }}>
                                Tamaño
                              </span>
                              <div className="relative flex-1">
                                <select
                                  value={mascota.tamano}
                                  onChange={(e) => updateMascota(index, "tamano", e.target.value)}
                                  disabled={isDisabled}
                                  className="w-full appearance-none px-3 py-1.5 pr-8 rounded-lg border text-sm"
                                  style={{
                                    backgroundColor: isDisabled ? "#F5F3EE" : "#fff",
                                    borderColor: inputBorder,
                                    color: mascota.tamano ? "#0A1830" : "#999",
                                    cursor: isDisabled ? "not-allowed" : "pointer",
                                    opacity: isDisabled ? 0.7 : 1,
                                  }}
                                >
                                  <option value="" disabled>Indicar tamaño</option>
                                  {TAMANOS.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: fieldIconColor }} />
                              </div>
                            </div>
                          )
                        })()}

                        {index < mascotas.length - 1 && (
                          <div className="mt-4 border-t" style={{ borderColor: "#E5DFC8" }} />
                        )}
                      </div>
                    ))}

                    {/* Agregar otra mascota — máximo 3 */}
                    {mascotas.length < 3 && (
                      <button
                        type="button"
                        onClick={addMascota}
                        className="flex items-center gap-1.5 text-sm font-medium mb-4 transition-opacity hover:opacity-70"
                        style={{ color: accentColor }}
                      >
                        <Plus size={14} />
                        Agregar otra mascota
                      </button>
                    )}

                    <div className="mb-4 border-t" style={{ borderColor: "#E5DFC8" }} />

                    {/* Listo */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setPetsOpen(false)}
                        className="px-5 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors"
                        style={{ backgroundColor: accentColor }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
                      >
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
                  onClick={() => router.push("/search")}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all hover:shadow-lg active:scale-95"
                  style={{ backgroundColor: accentColor, color: "#fff", boxShadow: "0 10px 24px rgba(217, 114, 48, 0.35)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
                >
                  <Search size={16} />
                  Buscar hotel !!
                </button>
              </div>
            </div>

            {/* Transport checkbox */}
            <div className="mt-3 pt-3 border-t flex items-center gap-2.5" style={{ borderColor: "rgba(10, 24, 48, 0.18)" }}>
              <button
                type="button"
                role="checkbox"
                aria-checked={needsTransport}
                onClick={toggleNeedsTransport}
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
          </div>
        </div>
      </div>
    </section>
  )
}
