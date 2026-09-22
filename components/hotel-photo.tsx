"use client"

import Image from "next/image"
import { ImageIcon } from "lucide-react"

// Foto del hotel con fallback cuando la reserva no tiene mainPhotoUrl.
// La usan /mis-reservas y la página pública de calificación.
export function HotelPhoto({ src, alt, sizes }: { src: string | null; alt: string; sizes?: string }) {
  if (!src) {
    return (
      <div className="flex h-full min-h-full w-full items-center justify-center bg-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border" style={{ borderColor: "#E5E7EB", color: "#8A94A6" }}>
          <ImageIcon size={28} />
        </div>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className="object-cover"
    />
  )
}
