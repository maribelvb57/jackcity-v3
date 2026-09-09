"use client"

import { useState, useRef, useEffect, type ReactNode, type CSSProperties } from "react"
import { DayPicker, Chevron, type DateRange } from "react-day-picker"
import { es } from "date-fns/locale"
import { getMinCheckinDate, startOfLocalDay } from "@/lib/booking-dates"
import "react-day-picker/style.css"

const ACCENT = "rgb(0 6 255)"
const ACCENT_SOFT = "#FCE8DB"
const PANEL_BG = "#FFF9F2"
const PANEL_BORDER = "#D9C7AE"

type Props = {
  /** Rango vigente: es lo que el calendario muestra al abrir, salvo con `startEmpty`. */
  value: DateRange | undefined
  /** Solo se llama con un rango completo. El popover se cierra al aplicar. */
  onApply: (range: { from: Date; to: Date }) => void
  /**
   * Abre el calendario en blanco en vez de mostrar `value` seleccionado. Se usa donde
   * las fechas son un preset nuestro (el buscador del home) y elegir de cero es más
   * cómodo que corregir. Donde el rango es la elección del usuario (la barra de
   * resultados) queda en false: al reabrir espera ver lo que buscó.
   */
  startEmpty?: boolean
  /** Contenido del botón que abre el calendario. */
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function DateRangePickerPopover({ value, onApply, startEmpty = false, children, className, style }: Props) {
  const [open, setOpen] = useState(false)
  const [selection, setSelection] = useState<DateRange | undefined>(undefined)
  const [minCheckinDate, setMinCheckinDate] = useState(() => getMinCheckinDate())
  const containerRef = useRef<HTMLDivElement>(null)

  // El listener de click-fuera se registra una sola vez, así que lee la selección
  // desde un ref en vez de capturarla del render en que se montó.
  const selectionRef = useRef<DateRange | undefined>(undefined)
  selectionRef.current = selection

  // Si el calendario abre con un rango ya marcado, el primer click lo reemplaza en vez
  // de estirarlo (que es lo que hace react-day-picker por su cuenta): quien vuelve a
  // abrir el calendario quiere elegir fechas nuevas, no corregir el borde del rango.
  const hasEdited = useRef(false)

  const openPicker = () => {
    hasEdited.current = false
    setSelection(startEmpty ? undefined : value)
    // Revisamos la hora de corte por si cambió mientras la página estaba abierta.
    setMinCheckinDate(getMinCheckinDate())
    setOpen(true)
  }

  // Cerrar aplica lo elegido si quedó un rango completo; un rango a medias se descarta.
  const closeAndApply = () => {
    const range = selectionRef.current
    setOpen(false)
    if (range?.from && range?.to) onApply({ from: range.from, to: range.to })
  }

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) closeAndApply()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" onClick={() => (open ? closeAndApply() : openPicker())} className={className} style={style}>
        {children}
      </button>

      {open && (
        <div
          className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 rounded-2xl shadow-2xl border p-2"
          style={{ backgroundColor: PANEL_BG, borderColor: PANEL_BORDER }}
        >
          <DayPicker
            mode="range"
            // Una estadía dura al menos una noche. Sin `min`, react-day-picker cierra el
            // rango en el primer click ({from: X, to: X}) y se puede confirmar una
            // estadía de cero noches; con min=2 el rango queda abierto hasta el segundo.
            min={2}
            selected={selection}
            onSelect={(range, triggerDate) => {
              if (!hasEdited.current) {
                hasEdited.current = true
                setSelection({ from: triggerDate, to: undefined })
                return
              }
              setSelection(range)
            }}
            locale={es}
            numberOfMonths={1}
            defaultMonth={value?.from ?? minCheckinDate}
            disabled={(date) => startOfLocalDay(date) < minCheckinDate}
            styles={{
              // Las medidas van acá y no en el div padre: react-day-picker declara sus
              // variables sobre `.rdp-root` y esa declaración gana sobre lo heredado.
              root: {
                fontFamily: '"Proxima Nova", "Avenir Next", Avenir, "Segoe UI", sans-serif',
                fontSize: "0.875rem",
                color: "#0A1830",
                "--rdp-day-width": "34px",
                "--rdp-day-height": "34px",
                "--rdp-day_button-width": "32px",
                "--rdp-day_button-height": "32px",
                "--rdp-nav-height": "2rem",
                "--rdp-nav_button-width": "1.75rem",
                "--rdp-nav_button-height": "1.75rem",
                "--rdp-weekday-padding": "0.1875rem 0",
              } as CSSProperties,
              month_caption: { color: "#0A1830", fontSize: "0.9375rem" },
              caption_label: { color: "#0A1830", fontWeight: 700 },
              nav_button: { color: "#0A1830", backgroundColor: "#FFFFFF", border: "1px solid #D9C7AE" },
              day: { color: "#0A1830" },
              weekday: { color: "#0A1830", fontWeight: 700 },
            }}
            components={{ Chevron: (chevronProps) => <Chevron {...chevronProps} size={14} /> }}
            modifiersStyles={{
              selected: { backgroundColor: ACCENT, color: "#fff", borderRadius: "8px" },
              range_start: { backgroundColor: ACCENT, color: "#fff", borderRadius: "8px 0 0 8px" },
              range_end: { backgroundColor: ACCENT, color: "#fff", borderRadius: "0 8px 8px 0" },
              range_middle: { backgroundColor: ACCENT_SOFT, color: "#2D2A20" },
              today: { fontWeight: 700, color: "#D97230" },
            }}
          />
          {selection?.from && selection?.to && (
            <div className="mt-1.5 pt-1.5 border-t flex justify-end" style={{ borderColor: "#E5DFC8" }}>
              <button
                type="button"
                onClick={closeAndApply}
                className="px-4 py-1 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: ACCENT }}
              >
                Confirmar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
