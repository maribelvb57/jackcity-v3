import Image from "next/image"
import {
  Check,
  Headphones,
  Heart,
  Home,
  Lock,
  MessageSquare,
  PawPrint,
  Shield,
  Star,
  Users,
} from "lucide-react"

const NAVY = "#0A2C66"
const YELLOW = "#FFC60E"
const BODY = "#3F4E66"

/** Icono compuesto: trazo navy + detalle amarillo superpuesto, como en el diseño. */
function ComposedIcon({
  base: Base,
  accent: Accent,
  accentSize,
  accentOffsetY = 0,
  accentFilled = true,
}: {
  base: React.ComponentType<{ size?: number; strokeWidth?: number; style?: React.CSSProperties }>
  accent: React.ComponentType<{ size?: number; strokeWidth?: number; fill?: string; style?: React.CSSProperties }>
  accentSize: number
  accentOffsetY?: number
  accentFilled?: boolean
}) {
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: 56, height: 56 }} aria-hidden="true">
      <Base size={52} strokeWidth={1.6} style={{ color: NAVY }} />
      <span className="absolute inset-0 flex items-center justify-center" style={{ transform: `translateY(${accentOffsetY}px)` }}>
        <Accent
          size={accentSize}
          strokeWidth={2}
          fill={accentFilled ? YELLOW : "none"}
          style={{ color: YELLOW }}
        />
      </span>
    </span>
  )
}

const beneficios = [
  {
    title: "Instalaciones profesionales",
    desc: "Diseñadas específicamente para el cuidado canino, con espacios seguros, supervisión y rutinas pensadas para el bienestar de tu mascota.",
    icon: <ComposedIcon base={Home} accent={PawPrint} accentSize={17} accentOffsetY={5} />,
  },
  {
    title: "Reputación transparente",
    desc: "Con reseñas y comentarios reales de muchas familias que ya confiaron su mascota, para que decidas con información y no con promesas.",
    icon: <ComposedIcon base={MessageSquare} accent={Star} accentSize={16} accentOffsetY={-3} />,
  },
  {
    title: "Un equipo dedicado y con trayectoria",
    desc: "Donde el cuidado de las mascotas es el trabajo de todos los días y no una tarea ocasional.",
    icon: <ComposedIcon base={Users} accent={Heart} accentSize={14} accentOffsetY={10} />,
  },
  {
    title: "Respaldo y seguridad en cada reserva",
    desc: "Con pagos protegidos y un proceso claro de principio a fin.",
    icon: <ComposedIcon base={Shield} accent={Check} accentSize={20} accentOffsetY={-1} accentFilled={false} />,
  },
  {
    title: "Acompañamiento siempre",
    desc: "Estamos para ayudarte antes, durante y después de cada estadía.",
    icon: <ComposedIcon base={Headphones} accent={Heart} accentSize={14} accentOffsetY={7} />,
  },
]

export function QuienesSomosSection() {
  return (
    <section className="w-full" style={{ backgroundColor: "#0A1830" }}>
      <div className="max-w-[1200px] mx-auto py-8 md:py-10">
        <div
          className="mx-3 md:mx-6 rounded-3xl overflow-hidden py-9 md:py-11"
          style={{ backgroundColor: "#FFFEF9" }}
        >
          <div className="mx-auto max-w-[1040px] px-6 md:px-8">
            {/* Bloque superior: texto + Jack */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 items-center">
              <div className="flex flex-col">
                <span
                  className="inline-flex items-center gap-2 self-start px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-3"
                  style={{ backgroundColor: "#FDF3D0", color: NAVY }}
                >
                  <PawPrint size={15} fill={YELLOW} strokeWidth={1.5} style={{ color: YELLOW }} aria-hidden="true" />
                  ¿Quiénes somos?
                </span>

                <h2
                  className="text-3xl md:text-[2.6rem] font-bold leading-[1.15] text-balance"
                  style={{ color: NAVY }}
                >
                  Porque tu peque también merece{" "}
                  <span style={{ color: YELLOW }}>las mejores vacaciones</span>
                </h2>

                <span
                  className="block mt-3 mb-4 rounded-full"
                  style={{ width: 56, height: 5, backgroundColor: YELLOW }}
                  aria-hidden="true"
                />

                <p className="text-base leading-relaxed" style={{ color: BODY }}>
                  En JackCity reunimos los mejores hoteles caninos de la Región Metropolitana para
                  que compares, elijas y reserves con la misma facilidad que reservas tus
                  vacaciones. Descubre, reserva y paga en minutos. Sin llamadas, sin esperas, sin
                  coordinaciones interminables.
                </p>

                {/* Sello verificado por Jack */}
                <div
                  className="flex gap-4 mt-5 p-4 md:p-5 rounded-2xl"
                  style={{ backgroundColor: "#FEF8EC" }}
                >
                  <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: 44, height: 44 }} aria-hidden="true">
                    <Shield size={42} strokeWidth={1.6} fill="#FDECC0" style={{ color: NAVY }} />
                    <Check size={17} strokeWidth={3} className="absolute" style={{ color: NAVY }} />
                  </span>
                  <div className="flex flex-col gap-1">
                    <p className="text-base font-bold" style={{ color: NAVY }}>
                      Todos nuestros hoteles están verificados por Jack.
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: BODY }}>
                      Confirmamos instalaciones profesionales, protocolos y experiencia real para
                      garantizar la máxima seguridad y bienestar de tu mascota.
                    </p>
                  </div>
                </div>
              </div>

              <div className="order-first md:order-none">
                <Image
                  src="/images/jack/jack-cama.png"
                  alt="Jack, la mascota de JackCity, descansando con lentes de sol en su cama"
                  width={780}
                  height={500}
                  sizes="(max-width: 768px) 100vw, 520px"
                  className="w-full h-auto"
                  priority={false}
                />
              </div>
            </div>

            {/* Beneficios */}
            <h3
              className="text-xl md:text-2xl font-bold text-center mt-8 md:mt-10 mb-7"
              style={{ color: NAVY }}
            >
              Elegir un hotel en <span style={{ color: YELLOW }}>JackCity</span> significa contar
              con:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-2 gap-y-7">
              {beneficios.map((b, i) => (
                <div
                  key={b.title}
                  className={`flex flex-col items-center text-center px-3 ${
                    i > 0 ? "lg:border-l" : ""
                  }`}
                  style={{ borderColor: "#E3E8F2" }}
                >
                  {b.icon}
                  <h4 className="text-base font-bold mt-3 mb-2 text-balance" style={{ color: NAVY }}>
                    {b.title}
                  </h4>
                  <p className="text-sm leading-relaxed text-balance" style={{ color: BODY }}>
                    {b.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Panel inferior: tranquilidad + pagos seguros */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-0 mt-8 md:mt-10 p-5 md:p-6 rounded-2xl"
              style={{ backgroundColor: "#EDF2FD" }}
            >
              <div className="flex items-center gap-5 md:pr-8">
                <Image
                  src="/images/jack/icono-corazon-perro.png"
                  alt=""
                  width={103}
                  height={95}
                  sizes="72px"
                  className="w-[72px] h-auto shrink-0"
                  aria-hidden="true"
                />
                <p className="text-base md:text-lg leading-relaxed" style={{ color: NAVY }}>
                  Queremos que cada dueño viaje, trabaje o descanse con la tranquilidad de saber que
                  su compañero está en un lugar{" "}
                  <strong className="font-bold">confiable, conocido y bien evaluado.</strong>
                </p>
              </div>

              <div
                className="flex items-start gap-5 md:pl-8 md:border-l"
                style={{ borderColor: "#D5DEF2" }}
              >
                <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: 52, height: 52 }} aria-hidden="true">
                  <Lock size={48} strokeWidth={1.6} style={{ color: NAVY }} />
                  <Check size={15} strokeWidth={3} className="absolute" style={{ color: YELLOW, transform: "translateY(7px)" }} />
                </span>
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-lg font-bold" style={{ color: NAVY }}>
                      Pagos 100% seguros
                    </p>
                    <Image
                      src="/images/logos/transbank.png"
                      alt="Transbank"
                      width={175}
                      height={32}
                      sizes="130px"
                      className="w-[130px] h-auto"
                    />
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: BODY }}>
                    Todas tus reservas y pagos se procesan a través de Transbank, líder en
                    soluciones de pago en Chile. Tu información y tus pagos están siempre
                    protegidos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
