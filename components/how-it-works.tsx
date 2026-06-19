"use client"

import Image from "next/image"
import Link from "next/link"
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Heart,
  Hotel,
  MapPinned,
  PawPrint,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

const highlights = [
  { icon: PawPrint, label: "Hoteles pet friendly", color: "#0A1830" },
  { icon: ShieldCheck, label: "Mejor precio garantizado", color: "#2F7D32" },
  { icon: RefreshCw, label: "Cancelación flexible", color: "#FF6B5E" },
]

const steps = [
  {
    number: "1",
    icon: MapPinned,
    title: "Indica lugar, fechas y mascotas",
    desc: "Cuéntanos en qué ciudad buscas, las fechas de tu viaje y cuántos peques necesitan alojamiento.",
    color: "#F5B000",
    bgColor: "#FFF8E4",
    borderColor: "#F2C34A",
  },
  {
    number: "2",
    icon: Hotel,
    title: "Elige el mejor sitio para tu peque",
    desc: "Explora disponibilidad, compara fotos, reseñas, servicios y precios antes de decidir.",
    color: "#2F7D32",
    bgColor: "#EEF8EA",
    borderColor: "#6EA957",
  },
  {
    number: "3",
    icon: ClipboardCheck,
    title: "Ve condiciones del alojamiento",
    desc: "Revisa reglas del hotel, servicios incluidos y condiciones específicas de tu reserva.",
    color: "#EF6C00",
    bgColor: "#FFF0E4",
    borderColor: "#F08A2E",
  },
  {
    number: "4",
    icon: CreditCard,
    title: "Reserva con solo el 30%",
    desc: "Asegura tu lugar pagando solo el 30% del total y cancela sin costo hasta 3 días antes.",
    color: "#0D2B45",
    bgColor: "#EAF2F8",
    borderColor: "#0D2B45",
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona">
      <div className="flex items-center justify-center">
        <div className="w-full max-w-[1200px] overflow-hidden" style={{ backgroundColor: "#FFFDF6" }}>
          <div className="relative px-4 py-12 sm:px-6 md:py-16 lg:px-10">
            <div className="absolute left-0 top-20 h-28 w-20 rounded-r-[56px] bg-[#75A85A]" aria-hidden="true" />
            <div className="absolute bottom-16 right-0 h-32 w-20 rounded-l-[64px] bg-[#F5B000]" aria-hidden="true" />

            <div className="relative mx-auto max-w-[1100px]">
              <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
                <div className="relative z-10">
                  <div className="mb-6 flex flex-wrap gap-3">
                    {highlights.map((item) => (
                      <div
                        key={item.label}
                        className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-bold shadow-sm"
                        style={{ borderColor: "#ECE6D8", color: "#0A1830" }}
                      >
                        <item.icon size={18} style={{ color: item.color }} />
                        {item.label}
                      </div>
                    ))}
                  </div>

                  <p className="mb-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em]" style={{ color: "#2E7D32" }}>
                    <Sparkles size={16} />
                    Así de fácil
                  </p>

                  <h2 className="max-w-[480px] text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl" style={{ color: "#061B3A" }}>
                    Reservar en <span style={{ color: "#F5B000" }}>JackCity</span> es pan comido
                  </h2>

                  <p className="mt-5 max-w-[560px] text-lg font-medium leading-8" style={{ color: "#28384F" }}>
                    En cuatro simples pasos tu peque tendrá su lugar asegurado en el mejor hotel canino.
                  </p>

                  <div className="mt-7 flex flex-wrap items-center gap-4">
                    <Link
                      href="#buscar"
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-7 text-base font-bold shadow-lg transition-transform hover:-translate-y-0.5"
                      style={{ backgroundColor: "#FFC43D", color: "#0D2B45", boxShadow: "0 14px 28px rgba(255, 196, 61, 0.28)" }}
                    >
                      Buscar hotel ahora
                      <PawPrint size={19} fill="currentColor" />
                    </Link>
                    <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#526071" }}>
                      <Search size={17} style={{ color: "#2F7D32" }} />
                      Sin cargos por búsqueda
                    </div>
                  </div>
                </div>

                <div className="relative min-h-[320px] overflow-hidden rounded-lg border shadow-xl sm:min-h-[420px]" style={{ borderColor: "#F0E1C8", backgroundColor: "#F7E7C8" }}>
                  <Image
                    src="/images/jack-reserva-exitosa.jpg"
                    alt="Jack disfrutando unas vacaciones con JackCity"
                    fill
                    sizes="(min-width: 1024px) 520px, 100vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(6,27,58,0.08) 0%, rgba(6,27,58,0.02) 48%, rgba(6,27,58,0.16) 100%)" }} />
                  <div className="absolute left-5 top-5 max-w-[230px] rounded-lg border bg-white/95 p-4 shadow-lg" style={{ borderColor: "#E9D9BE" }}>
                    <p className="text-sm font-bold leading-6" style={{ color: "#061B3A" }}>
                      Diversión, mimos y comodidad garantizada
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-bold" style={{ color: "#2E7D32" }}>
                      <Heart size={15} fill="currentColor" />
                      Tu perro, nuestra prioridad
                    </div>
                  </div>
                  <div className="absolute bottom-5 right-5 hidden rounded-lg border bg-[#2F7D32] px-4 py-3 text-white shadow-lg sm:block" style={{ borderColor: "rgba(255,255,255,0.28)" }}>
                    <p className="text-xs font-bold uppercase tracking-[0.16em]">Reserva segura</p>
                    <p className="mt-1 text-sm font-bold">Cancela sin costo hasta 3 días antes</p>
                  </div>
                </div>
              </div>

              <div className="relative mt-9">
                <div className="hidden lg:block absolute left-[12%] right-[12%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#E8D5AF]" aria-hidden="true" />

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {steps.map((step, index) => (
                    <div
                      key={step.number}
                      className="relative flex min-h-[254px] flex-col rounded-lg border bg-white p-5 shadow-md"
                      style={{ borderColor: "#ECE2CF", boxShadow: "0 18px 36px rgba(6, 27, 58, 0.08)" }}
                    >
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow"
                            style={{ backgroundColor: step.color }}
                          >
                            {step.number}
                          </span>
                          <div
                            className="flex h-14 w-14 items-center justify-center rounded-lg"
                            style={{ backgroundColor: step.bgColor, color: step.color }}
                          >
                            <step.icon size={27} strokeWidth={2.4} />
                          </div>
                        </div>
                        {index < steps.length - 1 && (
                          <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-md lg:flex" style={{ color: "#F5B000" }} aria-hidden="true">
                            <ChevronRight size={28} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <h3 className="text-xl font-bold leading-tight" style={{ color: "#061B3A" }}>
                        {step.title}
                      </h3>
                      <p className="mt-3 text-sm font-medium leading-6" style={{ color: "#4B5563" }}>
                        {step.desc}
                      </p>

                      <div className="mt-auto pt-5">
                        <div className="h-1.5 rounded-full" style={{ backgroundColor: step.borderColor }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid gap-3 text-sm font-semibold sm:grid-cols-2 lg:flex lg:items-center lg:justify-center lg:gap-8" style={{ color: "#39475B" }}>
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle2 size={17} style={{ color: "#2F7D32" }} />
                  Compara hoteles sin compromiso
                </span>
                <span className="flex items-center justify-center gap-2">
                  <CalendarDays size={17} style={{ color: "#0D2B45" }} />
                  Reserva pagando solo una parte
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
