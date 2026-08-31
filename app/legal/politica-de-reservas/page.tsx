import type { Metadata } from "next"
import { PoliticaReservasContent } from "@/components/legal/politica-reservas-content"

export const metadata: Metadata = {
  title: "Política de reservas",
  description: "Conoce la política de reservas de JackCity para el alojamiento de tu mascota.",
  alternates: { canonical: "/legal/politica-de-reservas" },
}

export default function PoliticaDeReservasPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold mb-8" style={{ color: "#0A1830" }}>
          Política de reservas JackCity
        </h1>
        <div className="bg-white rounded-2xl p-8 border" style={{ borderColor: "#E5E7EB" }}>
          <PoliticaReservasContent />
        </div>
        <p className="mt-8 text-xs text-center" style={{ color: "#9CA3AF" }}>
          &copy; {new Date().getFullYear()} JackCity. Todos los derechos reservados.
        </p>
      </div>
    </main>
  )
}
