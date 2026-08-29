import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"

export default function HotelNotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />
        <div className="w-full px-4 pt-4 pb-16 md:px-6 md:pt-6 md:pb-24">
          <div className="rounded-2xl border px-5 py-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#D9E0EA" }}>
            <h1 className="text-xl font-bold mb-2" style={{ color: "#0A1830" }}>
              No encontramos este hotel
            </h1>
            <p className="text-sm mb-4" style={{ color: "#555" }}>
              Puede que ya no esté disponible o que el enlace esté incompleto.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}
            >
              Buscar hoteles para perros
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
