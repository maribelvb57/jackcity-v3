import Image from "next/image"
import Link from "next/link"
import { MapPin, Check, Star, ShieldCheck } from "lucide-react"
import { formatClp } from "@/lib/format"
import type { ComunaHotelCard } from "@/lib/comuna-pages"

/**
 * Versión estática de la tarjeta de resultados (components/result-card.tsx) para
 * las landings por comuna: los datos vienen escritos a mano, no de una búsqueda.
 *
 * A diferencia de la dinámica, no muestra "N mascotas, N noches" (no hay búsqueda
 * detrás) sino el precio por noche, y el CTA es un <Link> real: así funciona sin
 * JavaScript y Google lo sigue como enlace interno hacia la ficha del hotel.
 */
export function HotelStaticCard({ card }: { card: ComunaHotelCard }) {
  return (
    <div
      className="flex flex-col sm:flex-row rounded-2xl border overflow-hidden bg-white"
      style={{ borderColor: "#E2E8F0" }}
    >
      {/* Photo */}
      <div className="relative flex-shrink-0 w-full sm:w-[260px] md:w-[300px] min-h-[330px] sm:min-h-[220px]">
        <Image
          src={card.imageUrl}
          alt={card.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 300px"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 md:p-5 gap-2">
        <h2 className="text-lg md:text-2xl font-bold leading-tight" style={{ color: "#0A1830" }}>
          {card.name}
        </h2>

        {/* Score + reviews */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
            style={{ backgroundColor: "#F1F3F5", color: "#526071" }}
          >
            <Star size={13} style={{ color: "#526071" }} />
            Nuevo en JackCity
          </span>
          <span className="text-xs" style={{ color: "#8A94A6" }}>· Sin reseñas.</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5">
          <MapPin size={14} style={{ color: "#555", flexShrink: 0 }} />
          <span className="text-sm" style={{ color: "#555" }}>{card.address}</span>
        </div>

        {/* Features box */}
        <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "#EEF7F2" }}>
          <ul className="flex flex-col gap-1">
            {card.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: "#1a1a1a" }}>
                <Check size={13} style={{ color: "#16a34a", flexShrink: 0 }} strokeWidth={2.5} />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom row: precio por noche | CTA */}
        <div className="flex items-end justify-between gap-2 mt-auto pt-1">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs" style={{ color: "#777" }}>{card.priceLabel ?? "Precio por noche"}</p>
            <div className="flex flex-wrap items-baseline gap-x-2 mt-1">
              <p className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: "#0A1830" }}>
                {formatClp(card.price)}
              </p>
              <span className="text-xs" style={{ color: "#888" }}>IVA incluido</span>
            </div>
            {card.flexibleCancellation && (
              <span
                className="inline-flex self-start items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border mt-1.5"
                style={{ backgroundColor: "#EEF7F2", borderColor: "#CBE5D7", color: "#15803D" }}
              >
                <ShieldCheck size={13} strokeWidth={2.2} style={{ flexShrink: 0 }} />
                Cancelación flexible
              </span>
            )}
          </div>

          <Link
            href={card.detailUrl}
            className="flex items-center gap-1 px-5 py-3 rounded-xl font-bold text-sm flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}
          >
            Ver detalles
            <span className="text-base leading-none">›</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
