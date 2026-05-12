"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { formatClp } from "@/lib/format"
import { SiteNavbar } from "@/components/site-navbar"
import { SearchSummaryBar } from "@/components/search-summary-bar"
import {
  MapPin,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Clock
} from "lucide-react"

// Mock data for hotel detail
const HOTEL_DATA = {
  id: "1",
  name: "Cherratón Miramar",
  location: "Vitacura",
  score: 8.5,
  scoreLabel: "Muy bueno",
  reviewCount: 133,
  images: [
    "/images/hotel-patitas-inn.jpg",
    "/images/hotel-huellitas.jpg",
    "/images/hotel-pet-lodge.jpg",
    "/images/hotel-casa-canina.jpg",
  ],
  description: `El Cherratón Miramar es un exclusivo hotel para mascotas ubicado en el corazón de Vitacura. Nuestras instalaciones cuentan con amplios espacios verdes donde tu mascota podrá correr y jugar libremente. Contamos con personal capacitado las 24 horas del día para garantizar el bienestar y la seguridad de tu compañero peludo.

Ofrecemos habitaciones individuales y compartidas, todas con climatización y camas ortopédicas. Además, contamos con servicio de alimentación personalizada según las necesidades de cada mascota.`,
  highlights: [
    "Veterinario on site",
    "Cámaras de TV 24/7",
    "Amplios jardines",
    "Piscina para perros",
    "Alimentación premium",
  ],
  conditions: [
    "No recibe perros sin vacunas al día",
    "No recibe perros en celo",
    "Requiere certificado de desparasitación",
  ],
  checkIn: "10am - 6pm",
  checkOut: "1pm - 4pm",
  reviews: [
    {
      id: "1",
      author: "Ernesto",
      text: "Una experiencia positiva. Mi perro Max estuvo muy feliz y bien cuidado durante toda su estadía.",
      rating: 9,
    },
    {
      id: "2",
      author: "Carolina",
      text: "Excelente servicio, las instalaciones son muy limpias y el personal muy amable.",
      rating: 8,
    },
  ],
  pricePerNight: 32000,
}

// Mock reservation data (would come from search store)
const RESERVATION_DATA = {
  petCount: 2,
  petSize: "Tamaño pequeño",
  nights: 3,
}

// Mock search data (would come from search store)
const SEARCH_DATA = {
  city: "Santiago",
  dateFrom: "9 mayo",
  dateTo: "12 mayo",
  petCount: 2,
  withTransport: true,
}

export default function HotelDetailPage() {
  const router = useRouter()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const hotel = HOTEL_DATA
  const reservation = RESERVATION_DATA

  const basePrice = hotel.pricePerNight * reservation.nights * reservation.petCount
  const includeTransport = SEARCH_DATA.withTransport
  const transportPrice = includeTransport ? 15000 : 0
  const totalPrice = basePrice + transportPrice

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % hotel.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + hotel.images.length) % hotel.images.length)
  }

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#0B1F3A" }}>
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        {/* Top navigation */}
        <SiteNavbar />

        {/* Search summary bar */}
        <SearchSummaryBar
          data={SEARCH_DATA}
          onChangeClick={() => {
            // TODO: Open edit modal or redirect to search
            console.log("Cambiar búsqueda clicked")
          }}
        />

        {/* Main content */}
        <div className="w-full px-4 pt-4 pb-[300px] md:px-6 md:pt-6 md:pb-[300px]">
          {/* Back button */}
          <div className="mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: "#0A1830", color: "#0A1830" }}
            >
              <ChevronLeft size={16} />
              Volver a la lista de hoteles
            </button>
          </div>

          {/* Hotel name and location */}
          <div className="mb-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: "#0A1830" }}>
              {hotel.name}
            </h1>
            <div className="flex items-center gap-1.5">
              <MapPin size={16} style={{ color: "#6B7280" }} />
              <span className="text-sm" style={{ color: "#6B7280" }}>{hotel.location}</span>
            </div>
          </div>

          {/* Two column layout */}
          <div className="flex flex-col lg:flex-row gap-4">

            {/* Left column - 75% */}
            <div className="flex flex-col gap-4 lg:w-3/4">

              {/* 1. Photo Gallery — order 1 on mobile, 1 on desktop */}
              <div className="order-1 bg-white rounded-2xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src={hotel.images[currentImageIndex]}
                    alt={`${hotel.name} - Foto ${currentImageIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                  {/* Navigation arrows */}
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
                  {/* Image counter */}
                  <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}>
                    {currentImageIndex + 1} / {hotel.images.length}
                  </div>
                </div>
              </div>

              {/* 2. Score + Highlights — visible only on mobile, order 2 */}
              <div className="flex flex-col gap-4 order-2 lg:hidden">
                {/* Score and reviews */}
                <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="flex items-center justify-center px-3 py-2 rounded-lg text-white font-bold text-xl"
                      style={{ backgroundColor: "#1a6b4a" }}
                    >
                      {hotel.score.toFixed(1).replace(".", ",")}
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: "#0A1830" }}>{hotel.scoreLabel}</p>
                      <p className="text-sm" style={{ color: "#555" }}>{hotel.reviewCount} comentarios</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t" style={{ borderColor: "#E5E7EB" }}>
                    <p className="text-sm italic leading-relaxed mb-2" style={{ color: "#333" }}>
                      &quot;{hotel.reviews[0].text}&quot;
                    </p>
                    <p className="text-xs font-semibold" style={{ color: "#555" }}>
                      - {hotel.reviews[0].author}
                    </p>
                  </div>
                </div>

                {/* Highlights */}
                <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                  <h3 className="text-sm font-bold mb-3" style={{ color: "#0A1830" }}>
                    Puntos destacables
                  </h3>
                  <ul className="flex flex-col gap-2">
                    {hotel.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm" style={{ color: "#333" }}>
                        <Check size={14} style={{ color: "#16a34a", flexShrink: 0 }} strokeWidth={2.5} />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 3. Description — order 3 on mobile, 2 on desktop */}
              <div className="order-3 lg:order-2 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>
                  Descripcion del Hotel
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#333" }}>
                  {hotel.description}
                </p>
              </div>

              {/* 4. Conditions — order 4 on mobile, 3 on desktop */}
              <div className="order-4 lg:order-3 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>
                  Condiciones del Hotel
                </h2>
                <ul className="flex flex-col gap-2 mb-4">
                  {hotel.conditions.map((condition, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm" style={{ color: "#333" }}>
                      <AlertCircle size={16} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
                      {condition}
                    </li>
                  ))}
                </ul>

                {/* Check-in / Check-out */}
                <div className="flex gap-4 pt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
                  <div className="flex items-center gap-2">
                    <Clock size={16} style={{ color: "#0A1830" }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "#0A1830" }}>Check-in</p>
                      <p className="text-sm" style={{ color: "#555" }}>{hotel.checkIn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} style={{ color: "#0A1830" }} />
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "#0A1830" }}>Check-out</p>
                      <p className="text-sm" style={{ color: "#555" }}>{hotel.checkOut}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Reservation Summary — order 5 on mobile, 4 on desktop */}
              <div className="order-5 lg:order-4 bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>
                      Resumen de Reserva
                    </h2>
                    <ul className="flex flex-col gap-1 text-sm" style={{ color: "#555" }}>
                      <li>{reservation.petCount} mascotas, {reservation.petSize}</li>
                      <li>{reservation.nights} noches</li>
                      {includeTransport && <li>Transporte incluido</li>}
                    </ul>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1">
                    <p className="text-3xl md:text-4xl font-bold" style={{ color: "#0A1830" }}>
                      {formatClp(totalPrice)}
                    </p>
                    <p className="text-xs" style={{ color: "#888" }}>IVA incluido</p>
                  </div>
                </div>

                {/* Reserve button */}
                <button
                  onClick={() => router.push("/confirmation")}
                  className="w-full mt-4 py-3.5 rounded-xl font-bold text-base transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}
                >
                  Reservar
                </button>
              </div>
            </div>

            {/* Right column - 25% — hidden on mobile, shown on desktop */}
            <div className="hidden lg:flex flex-col gap-4 lg:w-1/4">

              {/* Score and reviews count */}
              <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="flex items-center justify-center px-3 py-2 rounded-lg text-white font-bold text-xl"
                    style={{ backgroundColor: "#1a6b4a" }}
                  >
                    {hotel.score.toFixed(1).replace(".", ",")}
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "#0A1830" }}>{hotel.scoreLabel}</p>
                    <p className="text-sm" style={{ color: "#555" }}>{hotel.reviewCount} comentarios</p>
                  </div>
                </div>

                {/* Featured review */}
                <div className="pt-3 border-t" style={{ borderColor: "#E5E7EB" }}>
                  <p className="text-sm italic leading-relaxed mb-2" style={{ color: "#333" }}>
                    &quot;{hotel.reviews[0].text}&quot;
                  </p>
                  <p className="text-xs font-semibold" style={{ color: "#555" }}>
                    - {hotel.reviews[0].author}
                  </p>
                </div>
              </div>

              {/* Highlights */}
              <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                <h3 className="text-sm font-bold mb-3" style={{ color: "#0A1830" }}>
                  Puntos destacables
                </h3>
                <ul className="flex flex-col gap-2">
                  {hotel.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm" style={{ color: "#333" }}>
                      <Check size={14} style={{ color: "#16a34a", flexShrink: 0 }} strokeWidth={2.5} />
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
