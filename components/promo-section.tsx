import Image from "next/image"
import { ShieldCheck, Heart, Star } from "lucide-react"

const features = [
  {
    icon: ShieldCheck,
    title: "Seguridad garantizada",
    desc: "Instalaciones 100% seguras, con cámaras, personal certificado y atención veterinaria disponible.",
    color: "#5C7A4A",
  },
  {
    icon: Heart,
    title: "Cuidado con amor",
    desc: "Cada mascota recibe atención personalizada, mimos y cariño durante toda su estadía.",
    color: "#D97230",
  },
  {
    icon: Star,
    title: "Espacios premium",
    desc: "Habitaciones cómodas, áreas de juego y paseos diarios en entornos diseñados para tu peque.",
    color: "#D4AA20",
  },
]

export function PromoSection() {
  return (
    <section>
      <div className="flex items-center justify-center">
        <div
          className="w-full max-w-[1200px] py-16 md:py-20"
          style={{ background: "linear-gradient(180deg, #1a2f51 0%, #7e9ec2 100%)" }}
        >
          <div className="mx-auto max-w-[1100px] px-6">
            {/* Headline */}
            <div className="text-center mb-12">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.14)", color: "#FFFFFF" }}
              >
                Por qué elegirnos
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold text-balance mb-4"
                style={{ color: "#F6F9FF" }}
              >
                Tu peque, en las mejores manos
              </h2>
              <p className="text-base leading-relaxed max-w-xl mx-auto" style={{ color: "rgba(228, 234, 242, 0.78)" }}>
                Sabemos lo mucho que quieres a tu mascota. Por eso nuestros hoteles están pensados y optimizados para que la pase increíble mientras tú disfrutas tu viaje con total tranquilidad.
              </p>
            </div>

            {/* Image grid */}
            <div className="mb-14 md:hidden">
              <div
                className="relative overflow-hidden rounded-3xl border shadow-md"
                style={{ borderColor: "rgba(255, 255, 255, 0.12)" }}
              >
                <Image
                  src="/images/promo-1.jpg"
                  alt="Perros felices descansando en el hotel Jackcity"
                  width={1751}
                  height={833}
                  className="h-auto w-full object-cover"
                  priority={false}
                />
              </div>
            </div>

            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
              {/* Large image */}
              <div className="md:col-span-2 relative rounded-2xl overflow-hidden shadow-md border" style={{ height: 360, borderColor: "rgba(255, 255, 255, 0.08)" }}>
                <Image
                  src="/images/promo-1.jpg"
                  alt="Perros felices descansando en el hotel Jackcity"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,19,24,0.62) 0%, rgba(17,19,24,0.14) 60%)" }} />
                <div className="absolute bottom-4 left-4">
                  <span
                    className="px-3 py-1.5 rounded-xl text-xs font-bold shadow"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.18)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.18)" }}
                  >
                    Suites premium disponibles
                  </span>
                </div>
              </div>

              {/* Stack of 2 small images */}
              <div className="flex flex-col gap-4">
                <div className="relative rounded-2xl overflow-hidden shadow-md flex-1 border" style={{ height: 172, borderColor: "rgba(255, 255, 255, 0.08)" }}>
                  <Image
                    src="/images/promo-2.jpg"
                    alt="Especialista cuidando a una mascota con cariño"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="relative rounded-2xl overflow-hidden shadow-md flex-1 border" style={{ height: 172, borderColor: "rgba(255, 255, 255, 0.08)" }}>
                  <Image
                    src="/images/promo-3.jpg"
                    alt="Área de juegos para perros en JackCity"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(17,19,24,0.58) 0%, rgba(17,19,24,0.12) 60%)" }} />
                  <div className="absolute bottom-3 left-3">
                    <span
                      className="px-3 py-1 rounded-xl text-xs font-bold shadow"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.18)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.18)" }}
                    >
                      Área de juegos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex flex-col gap-3 p-6 rounded-2xl border transition-shadow hover:shadow-md"
                  style={{ backgroundColor: "#E9EDF3", borderColor: "#D4DBE5", boxShadow: "0 16px 30px rgba(10, 16, 28, 0.08)" }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: "#FFFFFF" }}
                  >
                    <f.icon size={22} style={{ color: "#2B5FB8" }} />
                  </div>
                  <h3
                    className="text-lg font-bold"
                    style={{ color: "#16233B" }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#556274" }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
