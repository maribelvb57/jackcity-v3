import { SiteNavbar } from "@/components/site-navbar"

export default function ReservaErrorPage() {
  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#0B1F3A" }}>
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />
        <div className="px-6 py-10">
          <h1 className="text-xl font-bold mb-2" style={{ color: "#8A1C1C" }}>
            No pudimos confirmar tu pago
          </h1>
          <p className="text-sm font-medium" style={{ color: "#555" }}>
            El pago fue rechazado, cancelado, o ocurrió un error inesperado al procesarlo. Tu reserva no fue confirmada. Puedes intentar el pago nuevamente desde tu reserva, o contactarnos si el cargo se realizó en tu tarjeta.
          </p>
        </div>
      </div>
    </main>
  )
}
