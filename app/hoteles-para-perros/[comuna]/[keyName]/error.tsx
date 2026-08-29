"use client"

import { SiteNavbar } from "@/components/site-navbar"

export default function HotelPageError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />
        <div className="w-full px-4 pt-4 pb-16 md:px-6 md:pt-6 md:pb-24">
          <div className="rounded-2xl border px-5 py-6" style={{ backgroundColor: "#FFFFFF", borderColor: "#F3C1C1" }}>
            <p className="text-sm font-medium mb-4" style={{ color: "#8A1C1C" }}>
              No pudimos cargar el detalle del hotel. Intenta nuevamente.
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center px-4 py-2 rounded-xl font-bold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
