// Reglas de fecha mínima de check-in.
//
// Operación necesita al menos una tarde de anticipación para preparar el ingreso:
// pasada la hora de corte (hora de Chile) ya no se acepta una reserva que empiece
// al día siguiente, y el primer check-in posible pasa a ser en dos días.
//
//   Martes 11:00 → primer check-in: miércoles
//   Martes 14:00 → primer check-in: jueves

export const CHECKIN_CUTOFF_HOUR = 13

const CHILE_TIME_ZONE = "America/Santiago"

const chileFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: CHILE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
})

/**
 * Fecha y hora actuales en Chile, sin depender de la zona horaria del navegador
 * (el usuario puede estar viajando o tener mal el reloj del sistema).
 */
function nowInChile(now: Date): { year: number; month: number; day: number; hour: number } {
  const parts = chileFormatter.formatToParts(now)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0")
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
  }
}

/**
 * Primer día en que se puede iniciar una estadía. Se devuelve como Date local a
 * medianoche para poder compararlo directamente con los días del calendario, que
 * también son fechas locales sin hora.
 */
export function getMinCheckinDate(now: Date = new Date()): Date {
  const { year, month, day, hour } = nowInChile(now)
  const offset = hour >= CHECKIN_CUTOFF_HOUR ? 2 : 1
  return new Date(year, month - 1, day + offset)
}

/** Normaliza una fecha a medianoche local para comparar solo por día calendario. */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
