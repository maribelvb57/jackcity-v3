"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { MapPin, Check, Heart, Star } from "lucide-react"
import { useState } from "react"
import { formatClp } from "@/lib/format"

export type ResultCardData = {
  name: string
  score: number
  scoreLabel: string
  reviewCount: number
  address: string
  features: string[]
  freeCancellation: boolean
  petCount: number
  nights: number
  price: number
  imageUrl: string
  detailUrl: string
  includesTransport?: boolean
  transportProvider?: string
  recommended?: boolean
}

type ResultCardProps = {
  data: ResultCardData
}

export function ResultCard({ data }: ResultCardProps) {
  const router = useRouter()
  const [wished, setWished] = useState(false)

  return (
    <div
      className="flex flex-col sm:flex-row rounded-2xl border overflow-hidden bg-white"
      style={{ borderColor: "#E2E8F0" }}
    >
      {/* Photo */}
      <div className="relative flex-shrink-0 w-full sm:w-[260px] md:w-[300px]" style={{ minHeight: 220 }}>
        <Image
          src={data.imageUrl}
          alt={data.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 300px"
        />

        {/* Jack recommended badge */}
        {data.recommended && (
          <Image
            src="/images/recommended-by-jack.png"
            alt="Recomendado por Jack"
            width={578}
            height={222}
            className="absolute bottom-2 left-1 z-10 h-auto w-[82%] max-w-[262px] drop-shadow-[0_10px_14px_rgba(10,24,48,0.28)]"
            sizes="(max-width: 640px) 82vw, 262px"
          />
        )}

        {/* Wishlist heart */}
        <button
          onClick={() => setWished(!wished)}
          aria-label="Guardar en favoritos"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors"
          style={{ backgroundColor: "#fff" }}
        >
          <Heart
            size={16}
            strokeWidth={2}
            style={{ color: wished ? "#E05B3A" : "#555", fill: wished ? "#E05B3A" : "none" }}
          />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 md:p-5 gap-2">

        {/* Name */}
        <h2 className="text-lg md:text-2xl font-bold leading-tight" style={{ color: "#0A1830" }}>
          {data.name}
        </h2>

        {/* Score + reviews */}
        <div className="flex items-center gap-2">
          {data.score === 0 ? (
            <>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                style={{ backgroundColor: "#F1F3F5", color: "#526071" }}
              >
                <Star size={13} style={{ color: "#526071" }} />
                Nuevo en JackCity
              </span>
              <span className="text-xs" style={{ color: "#8A94A6" }}>· Aún sin evaluaciones</span>
            </>
          ) : (
            <>
              <div
                className="flex items-center justify-center px-2 py-0.5 rounded-md text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: "#1a6b4a" }}
              >
                {data.score.toFixed(1).replace(".", ",")}
              </div>
              <span className="text-sm" style={{ color: "#333" }}>
                <span className="font-semibold">{data.scoreLabel}</span>
                {" · "}
                {data.reviewCount} comentarios
              </span>
            </>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5">
          <MapPin size={14} style={{ color: "#555", flexShrink: 0 }} />
          <span className="text-sm" style={{ color: "#555" }}>{data.address}</span>
        </div>

        {/* Features box */}
        <div
          className="rounded-xl px-4 py-3"
          style={{ backgroundColor: "#EEF7F2" }}
        >
          <ul className="flex flex-col gap-1">
            {data.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm" style={{ color: "#1a1a1a" }}>
                <Check size={13} style={{ color: "#16a34a", flexShrink: 0 }} strokeWidth={2.5} />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom row: cancellation + pets/nights | price + CTA */}
        <div className="flex items-end justify-between gap-2 mt-auto pt-1">
          {/* Left: cancellation + details */}
          <div className="flex flex-col gap-0.5">
            {data.freeCancellation && (
              <div className="flex items-center gap-1.5">
                <Check size={13} style={{ color: "#16a34a", flexShrink: 0 }} strokeWidth={2.5} />
                <span className="text-sm font-semibold" style={{ color: "#16a34a" }}>Cancelación gratis</span>
              </div>
            )}
            <p className="text-xs" style={{ color: "#777" }}>
              {data.petCount} {data.petCount === 1 ? "mascota" : "mascotas"}, {data.nights} {data.nights === 1 ? "noche" : "noches"}
            </p>
            {/* Price */}
            <p className="text-2xl md:text-3xl font-bold leading-tight mt-1" style={{ color: "#0A1830" }}>
              {formatClp(data.price)}
            </p>
            {data.includesTransport && (
              <p className="text-xs" style={{ color: "#888" }}>
                Transporte incluido{data.transportProvider === "HOTEL" ? " por el hotel" : data.transportProvider === "JACKCITY" ? " por JackCity" : ""}
              </p>
            )}
            <p className="text-xs" style={{ color: "#888" }}>IVA incluido</p>
          </div>

          {/* CTA button */}
          <button
            onClick={() => router.push(data.detailUrl)}
            className="flex items-center gap-1 px-5 py-3 rounded-xl font-bold text-sm flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}
          >
            Ver detalles
            <span className="text-base leading-none">›</span>
          </button>
        </div>
      </div>
    </div>
  )
}
