import Image from "next/image"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, Home, Mail, ShieldAlert } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"

export default function BookingConfirmationErrorPage() {
  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#0B1F3A" }}>
      <div className="w-full max-w-[1200px] min-h-screen flex flex-col overflow-hidden" style={{ backgroundColor: "#F8FAFC" }}>
        <SiteNavbar />

        <section className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-10">
          <div
            className="absolute inset-x-0 top-0 h-56"
            style={{ background: "linear-gradient(180deg, #0D2B45 0%, #125BD8 58%, rgba(248,250,252,0) 100%)" }}
          />

          <div className="relative grid w-full max-w-[1040px] overflow-hidden rounded-[28px] border bg-white shadow-2xl lg:grid-cols-[0.9fr_1.1fr]" style={{ borderColor: "#E5E7EB" }}>
            <div className="relative min-h-[280px] overflow-hidden bg-[#FFF7E2] px-6 py-8 sm:px-8 lg:min-h-[560px]">
              <div className="absolute -left-16 top-12 h-44 w-44 rounded-full bg-[#FFC43D]/30" />
              <div className="absolute -right-14 bottom-16 h-52 w-52 rounded-full bg-[#125BD8]/10" />
              <div className="absolute inset-x-8 bottom-8 h-20 rounded-full bg-[#0D2B45]/10 blur-2xl" />

              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-bold" style={{ borderColor: "#F8D68B", color: "#8A1C1C" }}>
                  <ShieldAlert size={14} />
                  Pago no confirmado
                </div>

                <div className="relative mx-auto mt-6 w-full max-w-[340px] lg:mt-0">
                  <Image
                    src="/images/dog-sad.png"
                    alt="Jack triste porque no se pudo confirmar el pago"
                    width={520}
                    height={520}
                    priority
                    className="relative z-10 h-auto w-full object-contain drop-shadow-2xl"
                  />
                </div>

                <p className="relative z-10 mx-auto max-w-[320px] text-center text-sm font-semibold leading-relaxed" style={{ color: "#0D2B45" }}>
                  No te preocupes, todavía podemos ayudarte a completar la reserva de tu peque.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-center px-6 py-8 sm:px-10 lg:px-12">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: "#FEE2E2", color: "#8A1C1C" }}>
                <AlertTriangle size={24} strokeWidth={2.4} />
              </div>

              <p className="mb-3 text-sm font-bold uppercase tracking-[0.12em]" style={{ color: "#B45309" }}>
                Hubo un problema con el pago
              </p>
              <h1 className="max-w-[580px] text-3xl font-black leading-tight sm:text-4xl" style={{ color: "#0A1830" }}>
                No pudimos confirmar tu reserva
              </h1>
              <p className="mt-4 max-w-[620px] text-base font-medium leading-7" style={{ color: "#4B5563" }}>
                El pago fue rechazado, cancelado o ocurrió un error inesperado al procesarlo. Tu reserva no fue confirmada, así que puedes volver a intentarlo con tranquilidad.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border bg-[#F8FAFC] p-4" style={{ borderColor: "#E5E7EB" }}>
                  <p className="text-sm font-bold" style={{ color: "#0A1830" }}>1. Revisa</p>
                  <p className="mt-1 text-xs leading-5" style={{ color: "#667085" }}>Confirma que tu tarjeta o banco haya autorizado el pago.</p>
                </div>
                <div className="rounded-2xl border bg-[#F8FAFC] p-4" style={{ borderColor: "#E5E7EB" }}>
                  <p className="text-sm font-bold" style={{ color: "#0A1830" }}>2. Intenta</p>
                  <p className="mt-1 text-xs leading-5" style={{ color: "#667085" }}>Vuelve a la reserva y realiza el pago nuevamente.</p>
                </div>
                <div className="rounded-2xl border bg-[#F8FAFC] p-4" style={{ borderColor: "#E5E7EB" }}>
                  <p className="text-sm font-bold" style={{ color: "#0A1830" }}>3. Escríbenos</p>
                  <p className="mt-1 text-xs leading-5" style={{ color: "#667085" }}>Si viste un cargo, contáctanos para revisarlo.</p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-black transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
                >
                  <ArrowLeft size={17} strokeWidth={2.6} />
                  Volver a buscar
                </Link>
                <Link
                  href="/"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border-2 bg-white px-6 text-sm font-bold transition-colors hover:bg-[#F8FAFC]"
                  style={{ borderColor: "#0D2B45", color: "#0D2B45" }}
                >
                  <Home size={17} strokeWidth={2.4} />
                  Ir al inicio
                </Link>
              </div>

              <div className="mt-7 rounded-2xl border px-4 py-3" style={{ backgroundColor: "#FFF7E2", borderColor: "#F8D68B" }}>
                <p className="flex items-start gap-2 text-sm font-semibold leading-6" style={{ color: "#6B4E16" }}>
                  <Mail size={17} className="mt-0.5 flex-shrink-0" />
                  Si el cargo aparece en tu tarjeta, guarda el comprobante del banco y contáctanos para revisar el caso.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
