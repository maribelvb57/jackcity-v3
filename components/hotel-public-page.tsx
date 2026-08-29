import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { CancellationPolicySection } from "@/components/cancellation-policy"
import { HotelPhotoGallery } from "@/components/hotel-photo-gallery"
import { HotelBookingSection } from "@/components/hotel-booking-section"
import type { HotelPage } from "@/lib/api/hotel-page"
import { MapPin, Check, AlertCircle, Clock, Star, ChevronLeft } from "lucide-react"

function getScoreLabel(score: number): string {
  if (score >= 9.5) return "Excepcional"
  if (score >= 9.0) return "Fantástico"
  if (score >= 8.5) return "Fabuloso"
  if (score >= 8.0) return "Muy bien"
  if (score >= 7.0) return "Bien"
  if (score >= 6.0) return "Agradable"
  return "Aceptable"
}

/**
 * Nota y reseña destacada del hotel. Sin evaluaciones (avgRating null o 0) se
 * muestra como hotel nuevo en vez de una nota 0,0.
 */
function ScoreCard({ hotel, className = "" }: { hotel: HotelPage; className?: string }) {
  const score = hotel.avgRating
  const hasScore = score != null && score > 0

  return (
    <div className={`bg-white rounded-2xl p-4 border ${className}`} style={{ borderColor: "#E5E7EB" }}>
      <div className="flex items-center gap-3">
        {hasScore ? (
          <div className="flex items-center justify-center px-3 py-2 rounded-lg text-white font-bold text-xl" style={{ backgroundColor: "#1a6b4a" }}>
            {score.toFixed(1).replace(".", ",")}
          </div>
        ) : (
          <div className="flex items-center justify-center w-11 h-11 rounded-lg flex-shrink-0" style={{ backgroundColor: "#1a6b4a" }}>
            <Star size={22} fill="#FFFFFF" strokeWidth={0} aria-hidden="true" />
          </div>
        )}
        <div>
          <p className="font-semibold" style={{ color: "#0A1830" }}>
            {hasScore ? getScoreLabel(score) : "Nuevo en JackCity"}
          </p>
          {hasScore && (
            <p className="text-sm" style={{ color: "#555" }}>
              {hotel.reviewsCount ?? 0} comentarios
            </p>
          )}
        </div>
      </div>
      {hotel.reviewText && (
        <div className="mt-3 pt-3 border-t" style={{ borderColor: "#E5E7EB" }}>
          <p className="text-sm italic leading-relaxed mb-2" style={{ color: "#333" }}>
            &quot;{hotel.reviewText}&quot;
          </p>
          {hotel.reviewUserName && (
            <p className="text-xs font-semibold" style={{ color: "#555" }}>
              - {hotel.reviewUserName}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Ficha pública del hotel: sin precios, sin transporte y sin resumen de reserva.
 * La comparten la ruta por id (/hotel-para-perros/[hotelId]) y las URLs estáticas
 * por comuna y slug (/hoteles-para-perros/[comuna]/[keyName]), para que ambas
 * muestren exactamente lo mismo.
 */
export function HotelPublicPage({
  hotel,
  hotelKeyName,
  comuna,
}: {
  hotel: HotelPage
  /** Slug del hotel. Sin él no se muestra la sección de búsqueda (ver más abajo). */
  hotelKeyName?: string
  /** Landing de la comuna a la que pertenece la ficha, para volver a ella. */
  comuna?: { slug: string; name: string }
}) {
  const hasConditions = hotel.policies?.length > 0 || !!hotel.checkinTime || !!hotel.checkoutTime

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />

        <div className="w-full px-4 pt-4 pb-16 md:px-6 md:pt-6 md:pb-24">
          {/* Vuelta a la landing de la comuna: es el enlace interno que conecta
              la ficha con su comuna, y la miga visible del breadcrumb. */}
          {comuna && (
            <nav className="mb-3" aria-label="Migas de pan">
              <Link
                href={`/hoteles-para-perros/${comuna.slug}`}
                className="inline-flex items-center gap-1 text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "#28548f" }}
              >
                <ChevronLeft size={15} aria-hidden="true" />
                Hoteles para perros en {comuna.name}
              </Link>
            </nav>
          )}

          {/* Hotel name and location */}
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "#0A1830" }}>
              {hotel.name}
            </h1>
            <div className="flex items-center gap-1.5">
              <MapPin size={16} style={{ color: "#6B7280" }} />
              <span className="text-sm" style={{ color: "#6B7280" }}>
                {[hotel.addressStreet, hotel.commune].filter(Boolean).join(", ") || "—"}
              </span>
            </div>
          </div>

          {/* Two column layout */}
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Left column */}
            <div className="flex flex-col gap-4 lg:w-3/4">

              {/* 1. Photo Gallery */}
              <HotelPhotoGallery photos={hotel.photos} hotelName={hotel.name} className="order-1" />

              {/* 2. Score — mobile only */}
              <ScoreCard hotel={hotel} className="order-2 lg:hidden" />

              {/* 3. Highlights */}
              {hotel.benefits?.length > 0 && (
                <div className="order-3 lg:order-2 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                  <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>¿Por qué elegir este hotel?</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hotel.benefits.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm" style={{ color: "#333" }}>
                        <Check size={14} style={{ color: "#16a34a", flexShrink: 0 }} strokeWidth={2.5} />
                        {b.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 4. Description */}
              {hotel.description && (
                <div className="order-4 lg:order-3 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                  <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>Descripción del Hotel</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#333" }}>
                    {hotel.description}
                  </p>
                </div>
              )}

              {/* 5. Conditions */}
              {hasConditions && (
                <div className="order-5 lg:order-4 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                  <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>Condiciones del Hotel</h2>
                  {hotel.policies?.length > 0 && (
                    <ul className="flex flex-col gap-2 mb-4">
                      {hotel.policies.map((policy, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm" style={{ color: "#333" }}>
                          <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
                          {policy.description}
                        </li>
                      ))}
                    </ul>
                  )}
                  {(hotel.checkinTime || hotel.checkoutTime) && (
                    <div className="flex gap-4 pt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
                      {hotel.checkinTime && (
                        <div className="flex items-start gap-2">
                          <Clock size={16} style={{ color: "#0A1830", flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <p className="text-xs font-semibold" style={{ color: "#0A1830" }}>Check-in</p>
                            <p className="text-sm whitespace-pre-line" style={{ color: "#555" }}>{hotel.checkinTime}</p>
                          </div>
                        </div>
                      )}
                      {hotel.checkoutTime && (
                        <div className="flex items-start gap-2">
                          <Clock size={16} style={{ color: "#0A1830", flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <p className="text-xs font-semibold" style={{ color: "#0A1830" }}>Check-out</p>
                            <p className="text-sm whitespace-pre-line" style={{ color: "#555" }}>{hotel.checkoutTime}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 6. Cancellation Policy */}
              {hotel.cancellationPolicy && (
                <CancellationPolicySection
                  policy={hotel.cancellationPolicy}
                  className="order-6 lg:order-5"
                />
              )}

              {/* 7. Buscador / resumen de reserva — última sección de la columna.
                  Sólo existe en las URLs por keyName: la consulta de disponibilidad
                  se hace con ese slug y la ruta por uuid no lo tiene. */}
              {hotelKeyName && (
                <HotelBookingSection hotelKeyName={hotelKeyName} className="order-7 lg:order-6" />
              )}
            </div>

            {/* Right column — desktop only */}
            <div className="hidden lg:flex flex-col gap-4 lg:w-1/4">
              <ScoreCard hotel={hotel} />
            </div>
          </div>
        </div>

        <SiteFooter />
      </div>
    </main>
  )
}
