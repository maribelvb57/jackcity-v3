"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { SiteNavbar } from "@/components/site-navbar"
import { SearchSummaryBar } from "@/components/search-summary-bar"
import { ChevronLeft, ChevronRight, SlidersHorizontal, ArrowUpDown, ChevronDown, X } from "lucide-react"
import { ResultCard, type ResultCardData } from "@/components/result-card"
import { SearchFilters } from "@/components/search-filters"
import { SearchBenefitsBanner } from "@/components/search-benefits-banner"
import { useSearchStore } from "@/providers/search-store-provider"
import { searchHotels, type Hotel } from "@/lib/api/hotels"
import { ZONE_COMMUNES } from "@/config/zones"

const ORDENAR_OPTIONS = [
  "Recomendados de Jack",
  "Precio menor a mayor",
  "Precio mayor a menor",
  "Mejor puntuación Usuarios",
]

const CARD_DEFAULTS: Omit<ResultCardData, "name"> = {
  score: 8.5,
  scoreLabel: "Muy bueno",
  reviewCount: 0,
  address: "—",
  features: [],
  freeCancellation: false,
  petCount: 1,
  nights: 1,
  price: 0,
  imageUrl: "/placeholder.jpg",
}

function getScoreLabel(score: number): string {
  if (score >= 9.5) return "Excepcional"
  if (score >= 9.0) return "Fantástico"
  if (score >= 8.5) return "Fabuloso"
  if (score >= 8.0) return "Muy bien"
  if (score >= 7.0) return "Bien"
  if (score >= 6.0) return "Agradable"
  return "Aceptable"
}

function hotelToCardData(hotel: Hotel, petCount: number, nights: number): ResultCardData {
  return {
    ...CARD_DEFAULTS,
    name: hotel.name,
    imageUrl: hotel.mainPhotoUrl ?? CARD_DEFAULTS.imageUrl,
    score: hotel.avgRating ?? CARD_DEFAULTS.score,
    scoreLabel: hotel.avgRating != null ? getScoreLabel(hotel.avgRating) : CARD_DEFAULTS.scoreLabel,
    reviewCount: hotel.reviewsCount ?? CARD_DEFAULTS.reviewCount,
    address: [hotel.addressStreet, hotel.commune].filter(Boolean).join(", ") || CARD_DEFAULTS.address,
    features: hotel.mainBenefits.map((b) => b.name),
    petCount,
    nights,
    price: hotel.pricing?.totalPrice ?? CARD_DEFAULTS.price,
    includesTransport: (hotel.pricing?.transportPrice ?? 0) > 0,
  }
}

export default function SearchPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [mobileOrdenar, setMobileOrdenar] = useState("Recomendados de Jack")
  const [mobileOrdenarOpen, setMobileOrdenarOpen] = useState(false)
  const [zona, setZona] = useState("Todas las zonas")

  const city = useSearchStore((s) => s.city)
  const dateRange = useSearchStore((s) => s.dateRange)
  const mascotas = useSearchStore((s) => s.mascotas)
  const needsTransport = useSearchStore((s) => s.needsTransport)

  const CITY_LABELS: Record<string, string> = {
    SAN: "Santiago de Chile",
    CON: "Concepción",
    VAL: "Valparaíso",
    VDM: "Viña del Mar",
  }

  const summaryData = {
    city: CITY_LABELS[city] ?? city ?? "—",
    dateFrom: dateRange?.from ? format(dateRange.from, "d MMM", { locale: es }) : "—",
    dateTo: dateRange?.to ? format(dateRange.to, "d MMM", { locale: es }) : "—",
    petCount: mascotas.length,
    withTransport: needsTransport,
  }

  const {
    data: hotels = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["search-results", city, dateRange?.from, dateRange?.to, mascotas, needsTransport],
    queryFn: async (): Promise<Hotel[]> => {
      if (!dateRange?.from || !dateRange?.to) return []
      return searchHotels({
        city,
        mascotas,
        startDate: dateRange.from,
        endDate: dateRange.to,
        needTransport: needsTransport,
      })
    },
  })

  const petCount = mascotas.length
  const nights = (dateRange?.from && dateRange?.to)
    ? Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / 86400000)
    : 1

  const allowedCommunes = ZONE_COMMUNES[zona]
  const searchResults = hotels
    .filter((h) => !allowedCommunes || allowedCommunes.includes(h.communeCode ?? ""))
    .map((h) => hotelToCardData(h, petCount, nights))

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#0B1F3A" }}>
      <div className="w-full max-w-[1200px] flex flex-col">
        {/* Top navigation */}
        <SiteNavbar />

        {/* Search summary bar */}
        <SearchSummaryBar
          data={summaryData}
          onChangeClick={() => router.push("/")}
        />

        {/* Benefits banner - Full width */}
        <div className="mt-1">
          <SearchBenefitsBanner />
        </div>

        {/* Main content area */}
        <div className="relative w-full flex flex-col md:flex-row flex-1" style={{ backgroundColor: "#F3F4F6" }}>

          {/* MOBILE: Top pill bar */}
          <div
            className="md:hidden flex items-center justify-between px-4 py-2.5 border-b flex-shrink-0 gap-3"
            style={{ backgroundColor: "#ffffff", borderColor: "#E5E7EB" }}
          >
            {/* Filtros pill */}
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-all flex-1 justify-center"
              style={{
                backgroundColor: mobileFiltersOpen ? "#0A1830" : "#fff",
                color: mobileFiltersOpen ? "#fff" : "#0A1830",
                borderColor: "#0A1830",
              }}
            >
              <SlidersHorizontal size={13} />
              Filtros
            </button>

            {/* Ordenar por pill + combobox */}
            <div className="relative flex-1">
              <button
                onClick={() => setMobileOrdenarOpen(!mobileOrdenarOpen)}
                className="w-full flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border shadow-sm transition-all justify-center"
                style={{
                  backgroundColor: mobileOrdenarOpen ? "#0A1830" : "#fff",
                  color: mobileOrdenarOpen ? "#fff" : "#0A1830",
                  borderColor: "#0A1830",
                }}
              >
                <ArrowUpDown size={13} />
                <span className="truncate max-w-[100px]">Ordenar por</span>
                <ChevronDown size={13} style={{ transform: mobileOrdenarOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
              </button>
              {mobileOrdenarOpen && (
                <div
                  className="absolute top-full mt-1 right-0 z-50 rounded-xl border shadow-lg overflow-hidden"
                  style={{ backgroundColor: "#fff", borderColor: "#D1D5DB", minWidth: 200 }}
                >
                  {ORDENAR_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => { setMobileOrdenar(option); setMobileOrdenarOpen(false) }}
                      className="w-full px-4 py-2.5 text-left text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: mobileOrdenar === option ? "#FEF9C3" : "transparent",
                        color: "#0A1830",
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MOBILE: Filters drawer panel */}
          {mobileFiltersOpen && (
            <div
              className="md:hidden border-b overflow-y-auto flex-shrink-0"
              style={{
                backgroundColor: "#ffffff",
                borderColor: "#E5E7EB",
                maxHeight: "50vh",
              }}
            >
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <span className="text-sm font-bold" style={{ color: "#0A1830" }}>Filtros</span>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-1 rounded-full"
                  style={{ color: "#0A1830" }}
                  aria-label="Cerrar filtros"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="px-4 pb-4">
                <SearchFilters zona={zona} onZonaChange={setZona} />
              </div>
            </div>
          )}

          {/* DESKTOP: Left sidebar - Filters */}
          <aside
            className="hidden md:block relative flex-shrink-0 transition-all duration-300 ease-in-out border-r"
            style={{
              width: sidebarOpen ? 300 : 0,
              backgroundColor: "#ffffff",
              borderColor: "#E5E7EB",
              overflow: "hidden",
            }}
          >
            <div className="p-5 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-80px)]" style={{ width: 300 }}>
              <h2 className="text-lg font-bold mb-5" style={{ color: "#0A1830" }}>
                Filtros
              </h2>
              <SearchFilters zona={zona} onZonaChange={setZona} />
            </div>

            {/* Collapse/Expand toggle button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute z-10 flex items-center justify-center w-6 h-12 rounded-r-lg shadow-md transition-all duration-300 border"
              style={{
                right: -24,
                top: 60,
                backgroundColor: "#ffffff",
                border: "1px solid #E5E7EB",
              }}
              aria-label={sidebarOpen ? "Colapsar filtros" : "Expandir filtros"}
            >
              {sidebarOpen ? (
                <ChevronLeft size={16} style={{ color: "#0A1830" }} />
              ) : (
                <ChevronRight size={16} style={{ color: "#0A1830" }} />
              )}
            </button>
          </aside>

          {/* DESKTOP: Toggle button when sidebar is collapsed */}
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="hidden md:flex absolute z-10 items-center justify-center w-6 h-12 rounded-r-lg shadow-md border"
              style={{
                left: 0,
                top: 104,
                backgroundColor: "#ffffff",
                border: "1px solid #E5E7EB",
              }}
              aria-label="Expandir filtros"
            >
              <ChevronRight size={16} style={{ color: "#0A1830" }} />
            </button>
          )}

          {/* Right section - Search results */}
          <section className="flex-1 p-4 md:p-6 overflow-auto">

            {isLoading && (
              <div className="rounded-2xl border px-5 py-6 text-sm font-medium" style={{ backgroundColor: "#FFFFFF", borderColor: "#D9E0EA", color: "#0A1830" }}>
                Cargando resultados...
              </div>
            )}

            {isError && (
              <div className="rounded-2xl border px-5 py-6 text-sm font-medium" style={{ backgroundColor: "#FFFFFF", borderColor: "#F3C1C1", color: "#8A1C1C" }}>
                No pudimos cargar los resultados. Intenta nuevamente.
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && searchResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
                <img
                  src="/images/dog-sad.png"
                  alt="Sin resultados"
                  className="w-44 h-44 object-contain"
                />
                <div className="flex flex-col gap-2">
                  <p className="text-lg font-bold" style={{ color: "#0A1830" }}>
                    No encontramos hoteles disponibles
                  </p>
                  <p className="text-sm" style={{ color: "#6B7280", maxWidth: 320 }}>
                    Intenta ajustando los filtros o realiza una nueva búsqueda con otras fechas.
                  </p>
                </div>
              </div>
            )}

            {/* Results list */}
            {!isLoading && !isError && searchResults.length > 0 && (
              <div className="flex flex-col gap-4 md:gap-5">
                {searchResults.map((result, index) => (
                  <ResultCard key={index} data={result} />
                ))}
              </div>
            )}
          </section>

          {/* Right margin spacer - 57px */}
          <div style={{ width: "57px", flexShrink: 0 }} />
        </div>
      </div>
    </main>
  )
}
