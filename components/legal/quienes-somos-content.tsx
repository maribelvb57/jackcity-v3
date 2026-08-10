import Image from "next/image"
import { Home, Star, Users, ShieldCheck } from "lucide-react"

const beneficios = [
  {
    icon: Home,
    title: "Instalaciones profesionales",
    text: "Diseñadas específicamente para el cuidado canino, con espacios seguros, supervisión y rutinas pensadas para el bienestar de tu mascota.",
  },
  {
    icon: Star,
    title: "Reputación transparente",
    text: "Con reseñas y comentarios reales de muchas familias que ya confiaron su mascota, para que decidas con información y no con promesas.",
  },
  {
    icon: Users,
    title: "Un equipo dedicado y con trayectoria",
    text: "Donde el cuidado de las mascotas es el trabajo de todos los días y no una tarea ocasional.",
  },
  {
    icon: ShieldCheck,
    title: "Respaldo y seguridad en cada reserva",
    text: "Con pagos protegidos y un proceso claro de principio a fin.",
  },
]

export function QuienesSomosContent() {
  return (
    <div className="flex flex-col gap-6 text-sm leading-relaxed" style={{ color: "#374151" }}>
      <p>
        En JackCity creemos que dejar a tu mejor amigo en las mejores manos no debería ser acto de
        fe. Nacimos para transformar esa incertidumbre en confianza.
      </p>
      <p>
        Somos la plataforma que reúne a los mejores hoteles caninos de la Región Metropolitana en
        un solo lugar, para que compares, elijas y reserves con la misma facilidad con la que
        reservarías tus propias vacaciones. Desde tus hoteles favoritos hasta opciones nuevas que
        aún no conoces, todo está disponible para explorar cuando quieras: puedes descubrir un
        hotel, reservar tu cupo y pagar de inmediato, sin llamadas, sin esperas, sin coordinaciones
        interminables. Una experiencia completa, de principio a fin, en un solo sitio.
      </p>
      <p>
        Pero lo que realmente nos mueve va más allá de la comodidad, es que cada hotel que
        encuentras en JackCity está <strong>verificado por Jack</strong>: confirmamos que cada uno
        cuenta con instalaciones adecuadas, pensadas y diseñadas para la máxima seguridad y
        bienestar de tu mascota. No son espacios improvisados, son lugares con estructura, con
        profesionales, protocolos y con experiencia real cuidando mascotas.
      </p>

      <section className="flex flex-col gap-3">
        <h3 className="font-bold text-base" style={{ color: "#0A1830" }}>
          Elegir un hotel en JackCity significa contar con:
        </h3>
        <ul className="flex flex-col gap-3">
          {beneficios.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-3">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#DCFCE7", color: "#22C55E" }}
                aria-hidden="true"
              >
                <Icon size={17} strokeWidth={2} />
              </span>
              <p>
                <strong style={{ color: "#0A1830" }}>{title}</strong>
                {" — "}
                {text}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p>
        Queremos que cada dueño viaje, trabaje o descanse con la tranquilidad de saber que su
        compañero está en un lugar confiable, conocido y bien evaluado.
      </p>
      <p>
        JackCity es una plataforma desarrollada por <strong>AndesBits</strong>, una empresa de
        tecnología chilena que construye herramientas hechas a la medida de nuestro mercado, con
        estándares de calidad y seguridad de primer nivel. Tecnología local, para el bienestar de
        nuestras mascotas.
      </p>

      <Image
        src="/images/jack/jack-001.png"
        alt="Jack, la mascota de JackCity"
        width={1288}
        height={1221}
        sizes="180px"
        className="self-end w-[180px] h-auto -mt-2"
      />
    </div>
  )
}
