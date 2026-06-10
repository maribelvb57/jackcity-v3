import Image from "next/image"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Valentina Morales",
    city: "Santiago",
    image: "/images/testimonial-1.jpg",
    pet: "Max, Golden Retriever",
    rating: 5,
    text: "Dejar a Max en JakCity fue la mejor decisión. Llegué al aeropuerto sin ningún cargo de conciencia porque sabía que estaba en las mejores manos. ¡Max llegó a casa más feliz que nunca!",
  },
  {
    name: "Rodrigo Fuentes",
    city: "Valparaíso",
    image: "/images/testimonial-2.jpg",
    pet: "Luna, Beagle",
    rating: 5,
    text: "Nunca pensé que iba a encontrar un lugar tan profesional para Luna. El staff es increíble, me enviaban fotos y videos todos los días. Reservaré cada vez que viaje.",
  },
  {
    name: "Camila Soto",
    city: "Concepción",
    image: "/images/testimonial-3.jpg",
    pet: "Pancho, French Bulldog",
    rating: 5,
    text: "El proceso de reserva fue rapidísimo y muy claro. Lo del 30% al reservar es genial porque te da mucha flexibilidad. El hotel fue exactamente como lo describían, limpio y acogedor.",
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} de 5 estrellas`}>
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} fill="#D4AA20" style={{ color: "#D4AA20" }} />
      ))}
    </div>
  )
}

export function Testimonials() {
  return (
    <section>
      <div className="flex items-center justify-center">
        <div className="w-full max-w-[1200px] py-16 md:py-20" style={{ backgroundColor: "#FBF8F1" }}>
          <div className="mx-auto max-w-[1100px] px-6">
            {/* Header */}
            <div className="text-center mb-12">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-4"
                style={{ backgroundColor: "#FEF0E4", color: "#D97230" }}
              >
                Lo que dicen nuestros clientes
              </span>
              <h2
                className="text-3xl md:text-4xl font-bold text-balance mb-4"
                style={{ color: "#2D2A20" }}
              >
                Familias que confían en JackCity
              </h2>
              <p className="text-base leading-relaxed max-w-lg mx-auto" style={{ color: "#6B6350" }}>
                Miles de mascotas han disfrutado una estadía increíble en nuestros hoteles. Lee lo que opinan sus familias.
              </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div
                  key={t.name}
                  className="flex flex-col gap-4 p-6 rounded-2xl border transition-shadow hover:shadow-lg"
                  style={{
                    backgroundColor: "#FFFEFB",
                    borderColor: "#F4EEDB",
                    boxShadow: "0 14px 30px rgba(20, 24, 31, 0.06)",
                    transform: i === 1 ? "translateY(-8px)" : "none",
                  }}
                >
                  {/* Stars */}
                  <StarRating count={t.rating} />

                  {/* Quote */}
                  <p className="text-sm leading-relaxed flex-1" style={{ color: "#4A4535" }}>
                    &ldquo;{t.text}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "#F0E8CC" }}>
                    <div className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border-2" style={{ borderColor: "#D4AA2040" }}>
                      <Image
                        src={t.image}
                        alt={`Foto de ${t.name}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#2D2A20" }}>
                        {t.name}
                      </p>
                      <p className="text-xs" style={{ color: "#8A7E6A" }}>
                        {t.city} &middot; {t.pet}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust badge */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
              {[
                { value: "2,400+", label: "mascotas felices" },
                { value: "98%", label: "clientes satisfechos" },
                { value: "4.9/5", label: "valoración promedio" },
                { value: "40+", label: "hoteles asociados" },
              ].map((stat) => (
                <div key={stat.value} className="text-center">
                  <p
                    className="text-2xl font-black"
                    style={{ color: "#D4AA20" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#8A7E6A" }}>
                    {stat.label}
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
