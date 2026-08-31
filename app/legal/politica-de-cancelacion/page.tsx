import type { Metadata } from "next"
import { PoliticaCancelacionContent } from "@/components/legal/politica-cancelacion-content"

export const metadata: Metadata = {
  title: "Política de cancelación",
  description: "Conoce la política de cancelación de JackCity para reservas de alojamiento y transporte.",
  alternates: { canonical: "/legal/politica-de-cancelacion" },
}

export default function PoliticaDeCancelacionPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold mb-8" style={{ color: "#0A1830" }}>
          Política de cancelación y devoluciones JackCity
        </h1>
        <div className="bg-white rounded-2xl p-8 border" style={{ borderColor: "#E5E7EB" }}>
          <PoliticaCancelacionContent />
        </div>
        <p className="mt-8 text-xs text-center" style={{ color: "#9CA3AF" }}>
          &copy; {new Date().getFullYear()} JackCity. Todos los derechos reservados.
        </p>
      </div>
    </main>
  )
}
