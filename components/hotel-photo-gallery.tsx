"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { HotelPagePhoto } from "@/lib/api/hotel-page"

// Se usa si el hotel no tiene fotos cargadas.
const GALLERY_FALLBACK_IMAGE = "/images/hotel-patitas-inn.jpg"

// Recorrido mínimo del dedo para cambiar de foto (mismo umbral que JackStoryCarousel).
const SWIPE_THRESHOLD_PX = 50

/**
 * Galería de fotos del hotel con flechas y swipe. Es la única parte interactiva
 * de la ficha pública; el resto de la página se renderiza en el servidor.
 */
export function HotelPhotoGallery({
  photos,
  hotelName,
  className = "",
}: {
  photos: HotelPagePhoto[]
  hotelName: string
  className?: string
}) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  // El índice puede quedar fuera de rango si cambia la galería; se acota al mostrar.
  const photoIndex = currentImageIndex < photos.length ? currentImageIndex : 0
  const currentPhoto = photos[photoIndex] ?? null

  // Avanzan desde photoIndex (el índice realmente visible) y no desde currentImageIndex,
  // que puede haber quedado fuera de rango si la galería cambió.
  const nextImage = () => setCurrentImageIndex((photoIndex + 1) % photos.length)
  const prevImage = () => setCurrentImageIndex((photoIndex - 1 + photos.length) % photos.length)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return
    setTouchStart(null)
    if (photos.length < 2) return

    const deltaX = e.changedTouches[0].clientX - touchStart.x
    const deltaY = e.changedTouches[0].clientY - touchStart.y
    // Sólo se toma como swipe si el gesto fue más horizontal que vertical:
    // de lo contrario el usuario estaba haciendo scroll de la página sobre la foto.
    if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX && Math.abs(deltaX) > Math.abs(deltaY)) {
      deltaX < 0 ? nextImage() : prevImage()
    }
  }

  return (
    <div className={`bg-white rounded-2xl overflow-hidden border ${className}`} style={{ borderColor: "#E5E7EB" }}>
      <div
        className="relative aspect-[3/2] w-full select-none overflow-hidden"
        style={{ backgroundColor: "#F3F4F6" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Fondo: la misma foto ampliada y difuminada, para que las franjas que
            deja object-contain no queden vacías. Mismo src y sizes que la foto
            principal, así el navegador reutiliza el archivo ya descargado. */}
        <Image
          src={currentPhoto?.url ?? GALLERY_FALLBACK_IMAGE}
          alt=""
          fill
          aria-hidden="true"
          className="object-cover scale-125 blur-2xl"
          sizes="(max-width: 1024px) 100vw, 75vw"
          draggable={false}
        />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(10,24,48,0.28)" }} aria-hidden="true" />

        {/* La foto se ajusta al alto del marco y se ve completa: las verticales
            dejan franjas a los lados en vez de recortarse. */}
        <Image
          src={currentPhoto?.url ?? GALLERY_FALLBACK_IMAGE}
          alt={currentPhoto?.caption ?? hotelName}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 75vw"
          priority
          draggable={false}
        />
        {photos.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={24} style={{ color: "#0A1830" }} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:bg-white transition-colors"
              aria-label="Siguiente foto"
            >
              <ChevronRight size={24} style={{ color: "#0A1830" }} />
            </button>
            <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}>
              {photoIndex + 1} / {photos.length}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
