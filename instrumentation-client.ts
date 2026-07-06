import * as Sentry from "@sentry/nextjs"

const SENSITIVE_KEYS = new Set([
  // Datos del dueño
  "firstName", "lastName", "name", "email", "phone", "rut", "identification",
  // Datos de mascotas
  "petName", "breed", "weight", "color", "age", "gender",
  // Transbank / pagos
  "token", "buyOrder", "amount", "cardNumber", "authorizationCode",
  "token_ws", "voucher_token",
])

function scrubObject(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj
  if (Array.isArray(obj)) return obj.map(scrubObject)
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = SENSITIVE_KEYS.has(key) ? "[Filtered]" : scrubObject(value)
  }
  return result
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,

  beforeSend(event) {
    if (event.request?.data) {
      event.request.data = scrubObject(event.request.data)
    }
    if (event.extra) {
      event.extra = scrubObject(event.extra) as typeof event.extra
    }
    return event
  },
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
