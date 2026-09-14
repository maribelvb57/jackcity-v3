export function formatClp(value: number): string {
  const roundedValue = Math.round(value)
  const sign = roundedValue < 0 ? "-" : ""
  const absoluteValue = Math.abs(roundedValue)
  const formattedNumber = absoluteValue
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return `${sign}$${formattedNumber}`
}

// Deja sólo dígitos y el verificador: "12.345.678-k" → "123456789K".
export function cleanRut(value: string): string {
  return value.replace(/[^0-9kK]/g, "").toUpperCase()
}

// "123456789" → "12.345.678-9". Es idempotente: un RUT ya formateado no cambia.
// Si el valor no alcanza a ser un RUT se devuelve tal cual llegó.
export function formatChileRut(value: string): string {
  const cleanedRut = cleanRut(value)
  if (cleanedRut.length < 2) return value
  const body = cleanedRut.slice(0, -1)
  const verifier = cleanedRut.slice(-1)
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${verifier}`
}
