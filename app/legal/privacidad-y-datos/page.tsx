import { PrivacidadDatosContent } from "@/components/legal/privacidad-datos-content"

export const metadata = {
  title: "Privacidad y datos | JackCity",
  description: "Política de privacidad y tratamiento de datos personales de JackCity, operado por AndesBits SpA.",
}

export default function PrivacidadYDatosPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold mb-8" style={{ color: "#0A1830" }}>
          Política de privacidad y tratamiento de datos JackCity
        </h1>
        <div className="bg-white rounded-2xl p-8 border" style={{ borderColor: "#E5E7EB" }}>
          <PrivacidadDatosContent />
        </div>
        <p className="mt-8 text-xs text-center" style={{ color: "#9CA3AF" }}>
          &copy; {new Date().getFullYear()} JackCity. Todos los derechos reservados.
        </p>
      </div>
    </main>
  )
}
