"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { ManagerLayout } from "@/components/manager-layout"
import { useApiClient } from "@/hooks/use-api-client"
import { getHotelHolidays, getHotelNoWorkingDays } from "@/lib/api/hotel-closed-days"
import { CalendarX2, Info, CalendarDays } from "lucide-react"

const WEEKLY_OPTIONS = [
  { id: "NONE", label: "Ninguno", days: [] as number[] },
  { id: "WEEKENDS", label: "Sábados y Domingos", days: [6, 7] },
  { id: "SUNDAYS", label: "Domingos", days: [7] },
]

// 1 = lunes … 7 = domingo (ISO-8601, como lo entrega el backend).
const ISO_WEEKDAY_PLURAL: Record<number, string> = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábados",
  7: "Domingos",
}

/**
 * Busca a cuál de las tres opciones del selector corresponde lo que mandó el
 * backend. El endpoint devuelve un array libre de días ISO, así que puede traer
 * combinaciones fuera de esas tres (ej: [1, 7]); en ese caso devuelve null y la
 * UI lista los días reales en vez de marcar una opción equivocada.
 */
function matchWeeklyOption(days: number[]): (typeof WEEKLY_OPTIONS)[number] | null {
  const sorted = [...days].sort((a, b) => a - b)
  return (
    WEEKLY_OPTIONS.find(
      (option) =>
        option.days.length === sorted.length &&
        option.days.every((day, i) => day === sorted[i])
    ) ?? null
  )
}

/** [1, 7] → "Lunes y Domingos" */
function formatWeekdays(days: number[]): string {
  const names = [...days]
    .sort((a, b) => a - b)
    .map((day) => ISO_WEEKDAY_PLURAL[day] ?? `Día ${day}`)
  if (names.length <= 1) return names[0] ?? ""
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`
}

/**
 * "2026-12-25" → "Viernes 25 de diciembre de 2026".
 * Se parsea a mano (no `new Date(iso)`) para que la fecha no se corra un día
 * según la zona horaria del navegador.
 */
function formatHoliday(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number)
  const date = new Date(year, month - 1, day)
  const text = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function ClosedDaysContent({ hotelId }: { hotelId: string }) {
  const { apiFetch } = useApiClient()

  const noWorkingDaysQuery = useQuery({
    queryKey: ["hotel-noworkingdays", hotelId],
    queryFn: () => getHotelNoWorkingDays(hotelId, apiFetch),
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000,
  })

  const holidaysQuery = useQuery({
    queryKey: ["hotel-holidays", hotelId],
    queryFn: () => getHotelHolidays(hotelId, apiFetch),
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000,
  })

  const noWorkingDays = noWorkingDaysQuery.data ?? []
  const matchedOption = matchWeeklyOption(noWorkingDays)
  const holidays = holidaysQuery.data ?? []

  return (
    <div className="w-full px-4 pb-8 pt-4 md:px-6 flex flex-col gap-4">
      <h1 className="text-2xl md:text-3xl font-bold mt-4" style={{ color: "#0A1830" }}>
        Días Cerrados
      </h1>

      {/* Aclaración: qué significa "cerrado" */}
      <div
        className="rounded-2xl p-5 border flex items-start gap-4"
        style={{ backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#DBEAFE" }}
        >
          <Info size={20} style={{ color: "#2563EB" }} />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold" style={{ color: "#0A1830" }}>
            ¿Qué significa un día cerrado?
          </h2>
          <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "#1E3A5F" }}>
            En estas fechas <strong>no se pueden hacer check-in ni check-out</strong>: nadie
            ingresa ni retira a su mascota ese día.
          </p>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: "#1E3A5F" }}>
            No afecta a los huéspedes que ya están alojados. Las mascotas que ingresaron en
            días hábiles anteriores <strong>siguen su estadía con normalidad</strong>.
          </p>
        </div>
      </div>

      {/* Sección: días de la semana no laborables */}
      <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: "#E5E7EB" }}>
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#FEF3C7" }}
          >
            <CalendarDays size={24} style={{ color: "#D97706" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold" style={{ color: "#0A1830" }}>
              Días de la semana no laborables
            </h2>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "#6B7280" }}>
              Se repiten todas las semanas del año.
            </p>

            {noWorkingDaysQuery.isPending ? (
              <div
                className="mt-4 h-11 w-full sm:w-80 rounded-xl animate-pulse"
                style={{ backgroundColor: "#F3F4F6" }}
              />
            ) : noWorkingDaysQuery.isError ? (
              <p className="text-sm mt-4" style={{ color: "#DC2626" }}>
                No pudimos cargar los días no laborables. Intenta nuevamente.
              </p>
            ) : matchedOption ? (
              /* Selector en una sola línea, en modo lectura */
              <div
                className="mt-4 inline-flex w-full sm:w-auto rounded-xl p-1 gap-1"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                {WEEKLY_OPTIONS.map((option) => {
                  const selected = option.id === matchedOption.id
                  return (
                    <span
                      key={option.id}
                      aria-current={selected ? "true" : undefined}
                      className="flex-1 sm:flex-none text-center whitespace-nowrap px-4 py-2 rounded-lg text-sm font-semibold"
                      style={{
                        backgroundColor: selected ? "#0D2B45" : "transparent",
                        color: selected ? "#FFFFFF" : "#9CA3AF",
                        boxShadow: selected ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                      }}
                    >
                      {option.label}
                    </span>
                  )
                })}
              </div>
            ) : (
              /* El backend mandó una combinación fuera de las tres opciones */
              <div className="mt-4">
                <span
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold"
                  style={{ backgroundColor: "#0D2B45", color: "#FFFFFF" }}
                >
                  {formatWeekdays(noWorkingDays)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección: feriados no laborables */}
      <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: "#E5E7EB" }}>
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <CalendarX2 size={24} style={{ color: "#DC2626" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold" style={{ color: "#0A1830" }}>
              Feriados no laborables
            </h2>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "#6B7280" }}>
              Fechas puntuales del calendario en las que el hotel no recibe ni entrega mascotas.
            </p>

            {holidaysQuery.isPending ? (
              <div className="mt-4 flex flex-col gap-2.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-4 w-56 max-w-full rounded animate-pulse"
                    style={{ backgroundColor: "#F3F4F6" }}
                  />
                ))}
              </div>
            ) : holidaysQuery.isError ? (
              <p className="text-sm mt-4" style={{ color: "#DC2626" }}>
                No pudimos cargar los feriados. Intenta nuevamente.
              </p>
            ) : holidays.length === 0 ? (
              <p className="text-sm mt-4" style={{ color: "#9CA3AF" }}>
                No hay feriados configurados.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-2.5">
                {holidays.map((iso) => (
                  <li key={iso} className="flex items-start gap-3">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[7px]"
                      style={{ backgroundColor: "#DC2626" }}
                    />
                    <span className="text-sm" style={{ color: "#0A1830" }}>
                      {formatHoliday(iso)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface PageProps {
  params: Promise<{ hotelId: string }>
}

export default function ClosedDaysPage({ params }: PageProps) {
  const { hotelId } = use(params)
  return (
    <ManagerLayout hotelId={hotelId}>
      <ClosedDaysContent hotelId={hotelId} />
    </ManagerLayout>
  )
}
