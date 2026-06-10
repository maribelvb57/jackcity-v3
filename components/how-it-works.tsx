"use client"

import { MapPin, Building2, ClipboardList, CreditCard } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: MapPin,
    title: "Indica lugar, fechas y mascotas",
    desc: "Cuéntanos en qué ciudad buscas, las fechas de tu viaje y cuántos peques necesitan alojamiento.",
    color: "#D4AA20",
    bgColor: "#FDF6D8",
  },
  {
    number: "02",
    icon: Building2,
    title: "Elige el mejor sitio para tu peque",
    desc: "Explora los hoteles disponibles, compara fotos, servicios y precios. Filtra por lo que más importa para ti.",
    color: "#5C7A4A",
    bgColor: "#EEF4E8",
  },
  {
    number: "03",
    icon: ClipboardList,
    title: "Ve condiciones del alojamiento",
    desc: "Revisa en detalle las reglas del hotel, los servicios incluidos y las condiciones específicas de tu reserva.",
    color: "#D97230",
    bgColor: "#FEF0E4",
  },
  {
    number: "04",
    icon: CreditCard,
    title: "Reserva con solo el 30%",
    desc: "Asegura tu lugar pagando solo el 30% del total. Puedes cancelar sin costo hasta 3 días antes del inicio.",
    color: "#7A5CA0",
    bgColor: "#F2EEF8",
  },
]

export function HowItWorks() {
  return (
    <section>
      <div className="flex items-center justify-center">
        <div className="w-full max-w-[1200px] py-16 md:py-20" style={{ backgroundColor: "#EEF4E8" }}>
          <div className="mx-auto max-w-[1100px] px-6">
            {/* Header */}
            <div className="text-center mb-12">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
                style={{ backgroundColor: "#D4AA2020", color: "#B08800" }}
              >
                Así de fácil
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold text-balance mb-4"
                style={{ color: "#2D2A20" }}
              >
                Reservar en JackCity es pan comido
              </h2>
              <p className="text-base leading-relaxed max-w-lg mx-auto" style={{ color: "#6B6350" }}>
                En cuatro simples pasos tu peque tendrá su lugar asegurado en el mejor hotel canino.
              </p>
            </div>

            {/* Steps */}
            <div className="relative">
              {/* Connector line (desktop) */}
              <div
                className="hidden md:block absolute top-[52px] left-[calc(12.5%+24px)] right-[calc(12.5%+24px)] h-0.5"
                style={{ backgroundColor: "#D4AA2040" }}
                aria-hidden="true"
              />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-4">
                {steps.map((step, i) => (
                  <div key={step.number} className="flex flex-col items-center text-center gap-4">
                    {/* Icon circle */}
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-md z-10 relative"
                        style={{ backgroundColor: step.bgColor, border: `2px solid ${step.color}30` }}
                      >
                        <step.icon size={28} style={{ color: step.color }} />
                      </div>
                      <span
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow z-20"
                        style={{ backgroundColor: step.color, color: "#fff" }}
                      >
                        {i + 1}
                      </span>
                    </div>

                    {/* Content */}
                    <div>
                      <h3
                        className="text-base font-bold mb-2"
                        style={{ color: "#2D2A20" }}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#6B6350" }}>
                        {step.desc}
                      </p>
                    </div>

                    {/* Mobile arrow */}
                    {i < steps.length - 1 && (
                      <div className="md:hidden text-2xl font-bold" style={{ color: "#D4AA2060" }} aria-hidden="true">
                        ↓
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-base shadow-lg transition-all hover:shadow-xl active:scale-95"
                style={{ backgroundColor: "#D4AA20", color: "#fff" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#C49A10")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#D4AA20")}
              >
                Buscar hotel ahora
              </button>
              <p className="mt-3 text-sm" style={{ color: "#8A7E6A" }}>
                Sin cargo por búsqueda. Cancela sin costo hasta 3 días antes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
