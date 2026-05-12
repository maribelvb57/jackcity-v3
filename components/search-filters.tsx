"use client"

import { useState } from "react"
import { MapPin, DollarSign, Home, Star, ArrowUpDown, ChevronDown } from "lucide-react"
import { formatClp } from "@/lib/format"

const NAVY = "#0A1830"
const AMBER = "#FFC43D"
const GRAY = "#9CA3AF"
const SEPARATOR = "#F3F4F6"

const ZONAS = [
  "Todas las zonas",
  "Santiago Oriente",
  "Norte de Santiago",
  "Sur de Santiago",
  "Santiago Poniente",
]

const TIPOS_ALOJAMIENTO = [
  "En sitio campestre",
  "Canil Individual",
  "Libre de Jaulas",
  "Veterinario On Site",
  "Comida Incluida",
  "Servicio de Baño/peluquería adicional",
  "Recibe perras en celo",
  "Recibe perros sin castrar",
  "Cancelación gratis",
]

const ORDENAR_OPTIONS = [
  "Recomendados de Jack",
  "Precio menor a mayor",
  "Precio mayor a menor",
  "Mejor puntuación Usuarios",
]

interface SearchFiltersProps {
  zona: string
  onZonaChange: (zona: string) => void
  priceMin: number
  priceMax: number
  presupuesto: number
  onPresupuestoChange: (value: number) => void
}

export function SearchFilters({ zona, onZonaChange, priceMin, priceMax, presupuesto, onPresupuestoChange }: SearchFiltersProps) {
  const [zonaOpen, setZonaOpen] = useState(false)
  const [tiposSeleccionados, setTiposSeleccionados] = useState<string[]>([])
  const [puntuacionMin, setPuntuacionMin] = useState(6)
  const [ordenarPor, setOrdenarPor] = useState("Recomendados de Jack")

  const toggleTipo = (tipo: string) => {
    setTiposSeleccionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    )
  }

  const range = priceMax - priceMin || 1
  const sliderPct = priceMax > priceMin ? ((presupuesto - priceMin) / range) * 100 : 100
  const puntuacionPct = ((puntuacionMin - 6) / (9 - 6)) * 100

  return (
    <div className="flex flex-col gap-5 w-full overflow-x-hidden">

      {/* Zona */}
      <div className="w-full">
        <div className="flex items-center gap-2 mb-2.5">
          <MapPin size={15} style={{ color: AMBER }} />
          <h3 className="text-sm font-bold" style={{ color: NAVY }}>Zona</h3>
        </div>
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setZonaOpen(!zonaOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm"
            style={{ backgroundColor: "#fff", borderColor: "#D1D5DB", color: NAVY }}
          >
            <span className="truncate">{zona}</span>
            <ChevronDown
              size={15}
              className="flex-shrink-0 ml-1"
              style={{
                color: GRAY,
                transform: zonaOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </button>
          {zonaOpen && (
            <div
              className="absolute top-full mt-1 left-0 right-0 z-10 rounded-lg border shadow-lg overflow-hidden"
              style={{ backgroundColor: "#fff", borderColor: "#D1D5DB" }}
            >
              {ZONAS.map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => { onZonaChange(z); setZonaOpen(false) }}
                  className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-amber-50"
                  style={{
                    color: NAVY,
                    backgroundColor: zona === z ? "#FEF3C7" : "transparent",
                  }}
                >
                  {z}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t" style={{ borderColor: SEPARATOR }} />

      {/* Presupuesto */}
      <div className="w-full">
        <div className="flex items-center gap-2 mb-2.5">
          <DollarSign size={15} style={{ color: AMBER }} />
          <h3 className="text-sm font-bold" style={{ color: NAVY }}>Presupuesto</h3>
        </div>
        <div className="px-4 w-full">
          <div className="relative h-6 mb-1">
            {/* Track background */}
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full"
              style={{ backgroundColor: "#E5E7EB" }}
            />
            {/* Fill */}
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full"
              style={{ width: `${sliderPct}%`, backgroundColor: AMBER }}
            />
            {/* Native slider (invisible, on top for interaction) */}
            <input
              type="range"
              min={priceMin}
              max={priceMax}
              step={1000}
              value={presupuesto}
              onChange={(e) => onPresupuestoChange(Number(e.target.value))}
              className="absolute top-0 left-0 w-full h-full cursor-pointer opacity-0"
            />
            {/* Custom thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-md pointer-events-none border-4"
              style={{
                left: `calc(${sliderPct}% - 10px)`,
                backgroundColor: "#fff",
                borderColor: AMBER,
              }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1" style={{ color: GRAY }}>
            <span>{formatClp(priceMin)}</span>
            <span className="font-bold" style={{ color: AMBER }}>{formatClp(presupuesto)}</span>
            <span>{formatClp(priceMax)}</span>
          </div>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: SEPARATOR }} />

      {/* Tipo Alojamiento */}
      <div className="w-full">
        <div className="flex items-center gap-2 mb-2.5">
          <Home size={15} style={{ color: AMBER }} />
          <h3 className="text-sm font-bold" style={{ color: NAVY }}>Tipo Alojamiento</h3>
        </div>
        <div className="flex flex-col gap-2">
          {TIPOS_ALOJAMIENTO.map((tipo) => {
            const checked = tiposSeleccionados.includes(tipo)
            return (
              <label key={tipo} className="flex items-start gap-2.5 cursor-pointer select-none" onClick={() => toggleTipo(tipo)}>
                <div
                  className="w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    borderColor: checked ? "#22C55E" : "#D1D5DB",
                    backgroundColor: checked ? "#22C55E" : "#fff",
                  }}
                >
                  {checked && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className="text-sm leading-tight" style={{ color: NAVY }}>{tipo}</span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="border-t" style={{ borderColor: SEPARATOR }} />

      {/* Puntuación */}
      <div className="w-full">
        <div className="flex items-center gap-2 mb-2.5">
          <Star size={15} style={{ color: AMBER }} />
          <h3 className="text-sm font-bold" style={{ color: NAVY }}>Puntuación mínima</h3>
        </div>
        <div className="px-4 w-full">
          <div className="flex justify-between mb-2">
            {[6, 7, 8, 9].map((val) => (
              <span
                key={val}
                className="text-xs font-semibold"
                style={{ color: puntuacionMin === val ? AMBER : GRAY }}
              >
                {val}+
              </span>
            ))}
          </div>
          {/* Custom puntuacion slider */}
          <div className="relative h-6">
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1.5 rounded-full"
              style={{ backgroundColor: "#E5E7EB" }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full"
              style={{ width: `${puntuacionPct}%`, backgroundColor: AMBER }}
            />
            <input
              type="range"
              min={6}
              max={9}
              step={1}
              value={puntuacionMin}
              onChange={(e) => setPuntuacionMin(Number(e.target.value))}
              className="absolute top-0 left-0 w-full h-full cursor-pointer opacity-0"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full shadow-md pointer-events-none border-4"
              style={{
                left: `calc(${puntuacionPct}% - 10px)`,
                backgroundColor: "#fff",
                borderColor: AMBER,
              }}
            />
          </div>
        </div>
      </div>

      <div className="border-t" style={{ borderColor: SEPARATOR }} />

      {/* Ordenar Por */}
      <div className="w-full pb-4">
        <div className="flex items-center gap-2 mb-2.5">
          <ArrowUpDown size={15} style={{ color: AMBER }} />
          <h3 className="text-sm font-bold" style={{ color: NAVY }}>Ordenar por</h3>
        </div>
        <div className="flex flex-col gap-2.5">
          {ORDENAR_OPTIONS.map((option) => {
            const selected = ordenarPor === option
            return (
              <label key={option} className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setOrdenarPor(option)}>
                <div
                  className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    borderColor: selected ? AMBER : "#D1D5DB",
                    backgroundColor: selected ? AMBER : "#fff",
                  }}
                >
                  {selected && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#fff" }} />
                  )}
                </div>
                <span className="text-sm" style={{ color: NAVY }}>{option}</span>
              </label>
            )
          })}
        </div>
      </div>

    </div>
  )
}
