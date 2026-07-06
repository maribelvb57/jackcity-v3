"use client"

export default function SentryTestPage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <p style={{ color: "#B42318", fontWeight: "bold" }}>
        ⚠ Página temporal de prueba — borrar después de verificar Sentry.
      </p>
      <button
        type="button"
        onClick={() => {
          // @ts-expect-error — error intencional para probar Sentry
          myUndefinedFunction()
        }}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}
      >
        Disparar error de prueba
      </button>
    </div>
  )
}
