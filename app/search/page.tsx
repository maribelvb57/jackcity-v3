"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { SiteNavbar } from "@/components/site-navbar"
import { SearchSummaryBar } from "@/components/search-summary-bar"
import { ChevronLeft, ChevronRight, SlidersHorizontal, ArrowUpDown, ChevronDown, X } from "lucide-react"
import { ResultCard, type ResultCardData } from "@/components/result-card"
import { SearchFilters } from "@/components/search-filters"
import { SearchBenefitsBanner } from "@/components/search-benefits-banner"
import { useApiClient } from "@/hooks/use-api-client"
import { useSearchStore } from "@/providers/search-store-provider"
import { searchHotels, type Hotel, type PetSize, PET_SIZE_LABEL, type SearchResult } from "@/lib/api/hotels"
import { parsePetBreedsParam, parsePetIdsParam } from "@/lib/search-pets"
import { ZONE_COMMUNES } from "@/config/zones"
import { getTransportCommuneByCode } from "@/config/transport-communes"

const ORDENAR_OPTIONS = [
  "Recomendados de Jack",
  "Precio menor a mayor",
  "Precio mayor a menor",
  "Mejor puntuación Usuarios",
]

const CARD_DEFAULTS: Omit<ResultCardData, "name" | "detailUrl"> = {
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

function hotelToCardData(
  hotel: Hotel,
  petCount: number,
  nights: number,
  urlParams: { city: string; checkin: string; checkout: string; pets: string; breeds?: string; petIds?: string; transport: boolean; communeCode?: string; commune?: string; searchId: string; listIndex: number }
): ResultCardData {
  const transportBy = hotel.transport?.provider ?? ""
  const qs = new URLSearchParams({
    city: urlParams.city,
    checkin: urlParams.checkin ?? "",
    checkout: urlParams.checkout ?? "",
    pets: urlParams.pets,
    ...(urlParams.breeds && { breeds: urlParams.breeds }),
    ...(urlParams.petIds && { petIds: urlParams.petIds }),
    transport: String(urlParams.transport),
    ...(urlParams.transport && urlParams.communeCode && { communeCode: urlParams.communeCode }),
    ...(urlParams.transport && urlParams.commune && { commune: urlParams.commune }),
    ...(transportBy && { transportBy }),
    searchId: urlParams.searchId,
    listIndex: String(urlParams.listIndex),
  })
  return {
    ...CARD_DEFAULTS,
    name: hotel.name,
    detailUrl: `/hotel/${hotel.id}?${qs.toString()}`,
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
    transportProvider: hotel.transport?.provider,
    recommended: hotel.recommendedByJack,
  }
}

const CITY_LABELS: Record<string, string> = {
  SANTIAGO: "Santiago de Chile",
  CON: "Concepción",
  VAL: "Valparaíso",
  VDM: "Viña del Mar",
}

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { apiFetch } = useApiClient()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [mobileOrdenar, setMobileOrdenar] = useState("Recomendados de Jack")
  const [mobileOrdenarOpen, setMobileOrdenarOpen] = useState(false)
  const [zona, setZona] = useState("Todas las zonas")
  const [presupuesto, setPresupuesto] = useState(0)
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])
  const [puntuacionMin, setPuntuacionMin] = useState(6)
  const [ordenarPor, setOrdenarPor] = useState("Recomendados de Jack")

  const cityParam = searchParams.get("city") ?? "SANTIAGO"
  const fromParam = searchParams.get("checkin")
  const toParam = searchParams.get("checkout")
  const petsParam = searchParams.get("pets") ?? "SMALL"
  const breedsParam = searchParams.get("breeds") ?? ""
  const petBreeds = parsePetBreedsParam(breedsParam)
  const petIdsParam = searchParams.get("petIds") ?? ""
  const transportParam = searchParams.get("transport") === "true"
  const communeCodeParam = searchParams.get("communeCode") ?? ""
  const selectedTransportCommune = communeCodeParam ? getTransportCommuneByCode(communeCodeParam) : undefined
  const communeParam = searchParams.get("commune")?.trim() || selectedTransportCommune?.commune || ""
  const startDate = fromParam ? new Date(`${fromParam}T12:00:00`) : null
  const endDate = toParam ? new Date(`${toParam}T12:00:00`) : null

  const petSizes = petsParam.split(",") as PetSize[]

  const setCity = useSearchStore((s) => s.setCity)
  const setDateRange = useSearchStore((s) => s.setDateRange)
  const setMascotas = useSearchStore((s) => s.setMascotas)
  const setNeedsTransport = useSearchStore((s) => s.setNeedsTransport)
  const setTransportCommune = useSearchStore((s) => s.setTransportCommune)

  useEffect(() => {
    setCity(cityParam)
    if (startDate && endDate) setDateRange({ from: startDate, to: endDate })
    const petIds = parsePetIdsParam(searchParams.get("petIds"))
    setMascotas(petSizes.map((s, index) => ({ raza: petBreeds[index] ?? "Sin especificar", tamano: PET_SIZE_LABEL[s] ?? "", petId: petIds[index] ?? null })))
    setNeedsTransport(transportParam)
    if (transportParam && selectedTransportCommune) setTransportCommune(selectedTransportCommune)
  }, [])

  const summaryData = {
    city: CITY_LABELS[cityParam] ?? cityParam,
    dateFrom: startDate ? format(startDate, "d MMM", { locale: es }) : "—",
    dateTo: endDate ? format(endDate, "d MMM", { locale: es }) : "—",
    petCount: petSizes.length,
    withTransport: transportParam,
  }
  const landingUrl = searchParams.toString() ? `/?${searchParams.toString()}` : "/"

  const {
    data: searchResult,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["search-results", cityParam, fromParam, toParam, petsParam, breedsParam, transportParam, communeCodeParam],
    queryFn: async (): Promise<SearchResult> => {
      if (!startDate || !endDate) return { searchId: "", hotels: [] }
      return searchHotels({
        city: cityParam,
        mascotas: petSizes.map((s) => ({ tamano: PET_SIZE_LABEL[s] ?? "" })),
        startDate,
        endDate,
        needTransport: transportParam,
        transportCommune: transportParam ? communeCodeParam : undefined,
        apiFetch,
      })
    },
  })

  const hotels = searchResult?.hotels ?? []
  const searchId = searchResult?.searchId ?? ""

  const prices = useMemo(
    () => hotels.map((h) => h.pricing?.totalPrice ?? 0).filter((p) => p > 0),
    [hotels]
  )
  const priceMin = prices.length ? Math.min(...prices) : 0
  const priceMax = prices.length ? Math.max(...prices) : 0

  useEffect(() => {
    setPresupuesto(priceMax)
  }, [priceMax])

  const petCount = petSizes.length
  const nights = (startDate && endDate)
    ? Math.round((endDate.getTime() - startDate.getTime()) / 86400000)
    : 1

  const allowedCommunes = ZONE_COMMUNES[zona]
  const searchResults = hotels
    .map((h, originalIndex) => ({ hotel: h, originalIndex }))
    .filter(({ hotel: h }) => !allowedCommunes || allowedCommunes.includes(h.communeCode ?? ""))
    .filter(({ hotel: h }) => presupuesto === 0 || (h.pricing?.totalPrice ?? 0) <= presupuesto)
    .filter(({ hotel: h }) => selectedBenefits.length === 0 || selectedBenefits.every((code) => h.benefits.some((b) => b.code === code)))
    .filter(({ hotel: h }) => (h.avgRating ?? 0) >= puntuacionMin)
    .sort((a, b) => {
      if (ordenarPor === "Precio menor a mayor") return (a.hotel.pricing?.totalPrice ?? 0) - (b.hotel.pricing?.totalPrice ?? 0)
      if (ordenarPor === "Precio mayor a menor") return (b.hotel.pricing?.totalPrice ?? 0) - (a.hotel.pricing?.totalPrice ?? 0)
      if (ordenarPor === "Mejor puntuación Usuarios") return (b.hotel.avgRating ?? 0) - (a.hotel.avgRating ?? 0)
      return 0
    })
    .map(({ hotel: h, originalIndex }) => hotelToCardData(h, petCount, nights, {
      city: cityParam,
      checkin: fromParam ?? "",
      checkout: toParam ?? "",
      pets: petsParam,
      breeds: breedsParam,
      petIds: petIdsParam,
      transport: transportParam,
      communeCode: communeCodeParam,
      commune: communeParam,
      searchId,
      listIndex: originalIndex,
    }))

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <div className="w-full max-w-[1200px] flex flex-col">
        {/* Top navigation */}
        <SiteNavbar />

        {/* Search summary bar */}
        <SearchSummaryBar
          data={summaryData}
          onChangeClick={() => router.push(landingUrl)}
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
                <SearchFilters zona={zona} onZonaChange={setZona} priceMin={priceMin} priceMax={priceMax} presupuesto={presupuesto} onPresupuestoChange={setPresupuesto} selectedBenefits={selectedBenefits} onBenefitsChange={setSelectedBenefits} puntuacionMin={puntuacionMin} onPuntuacionChange={setPuntuacionMin} ordenarPor={ordenarPor} onOrdenarChange={setOrdenarPor} />
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
              <SearchFilters zona={zona} onZonaChange={setZona} priceMin={priceMin} priceMax={priceMax} presupuesto={presupuesto} onPresupuestoChange={setPresupuesto} selectedBenefits={selectedBenefits} onBenefitsChange={setSelectedBenefits} puntuacionMin={puntuacionMin} onPuntuacionChange={setPuntuacionMin} ordenarPor={ordenarPor} onOrdenarChange={setOrdenarPor} />
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
          <section className="flex-1 px-4 pt-4 pb-96 md:px-6 md:pt-6 overflow-auto">

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

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageContent />
    </Suspense>
  )
}
