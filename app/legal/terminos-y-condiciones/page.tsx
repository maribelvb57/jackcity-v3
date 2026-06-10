import { TerminosCondicionesContent } from "@/components/legal/terminos-condiciones-content"

export const metadata = {
  title: "Términos y condiciones | JackCity",
  description: "Términos y condiciones de uso de JackCity, plataforma operada por AndesBits SpA.",
}

export default function TerminosYCondicionesPage() {
  return (
    <main className="min-h-screen" style={{ backgroundColor: "#F9FAFB" }}>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold mb-8" style={{ color: "#0A1830" }}>
          Términos y condiciones de uso JackCity
        </h1>
        <div className="bg-white rounded-2xl p-8 border" style={{ borderColor: "#E5E7EB" }}>
          <TerminosCondicionesContent />
        </div>
        <p className="mt-8 text-xs text-center" style={{ color: "#9CA3AF" }}>
          &copy; {new Date().getFullYear()} JackCity. Todos los derechos reservados.
        </p>
      </div>
    </main>
  )
}
