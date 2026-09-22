"use client"

import { Star } from "lucide-react"

// Selector de nota 1-10 reutilizable (alojamiento y transporte comparten el mismo control).
// Lo usan el modal de /mis-reservas y la página pública /calificar/[bookingId].
// En mobile las 10 estrellas bajan a dos filas de 5 para que sigan siendo tocables.
export function ScoreSelector({ label, score, onChange, disabled = false }: {
  label: string
  score: number
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold" style={{ color: "#0A1830" }}>{label}</p>
        <p className="rounded-full px-3 py-1 text-sm font-bold" style={{ backgroundColor: "#FDECC8", color: "#8A6100" }}>
          {score === 0 ? "—" : score}/10
        </p>
      </div>

      <div className="mt-3 grid grid-cols-5 gap-1.5 sm:grid-cols-10 sm:gap-2">
        {Array.from({ length: 10 }, (_, index) => {
          const value = index + 1
          const filled = value <= score
          const current = value === score
          return (
            <div key={value} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChange(value)}
                disabled={disabled}
                className="flex aspect-square w-full items-center justify-center rounded-xl border transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{
                  backgroundColor: current ? "#FFC43D" : "#FFFFFF",
                  borderColor: current ? "#FFC43D" : "#E5E7EB",
                }}
                aria-label={`${label}: calificar con ${value} de 10`}
              >
                <Star
                  size={26}
                  fill={current ? "#FFFFFF" : filled ? "#F5B000" : "#D6DEE8"}
                  style={{ color: current ? "#FFFFFF" : filled ? "#F5B000" : "#D6DEE8" }}
                />
              </button>
              <span className="text-xs font-semibold" style={{ color: "#8A94A6" }}>{value}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: "#8A94A6" }}>Muy malo</span>
        <span className="text-xs font-medium" style={{ color: "#8A94A6" }}>Excelente</span>
      </div>
    </div>
  )
}
