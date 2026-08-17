"use client"

import { use } from "react"
import { useQuery } from "@tanstack/react-query"
import { ManagerLayout } from "@/components/manager-layout"
import { formatClp } from "@/lib/format"
import { getCommuneNameByCode } from "@/config/communes"
import { getHotelInfo } from "@/lib/api/hotel-info"
import { useApiClient } from "@/hooks/use-api-client"
import { Car } from "lucide-react"

function TransportPricesContent({ hotelId }: { hotelId: string }) {
  const { apiFetch } = useApiClient()

  // Misma queryKey que ManagerSidebar / ManagerContextBar: comparten caché.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["hotel-info", hotelId],
    queryFn: () => getHotelInfo(hotelId, apiFetch),
    enabled: !!hotelId,
  })

  if (isLoading) {
    return (
      <div className="px-6 py-10 text-sm font-medium" style={{ color: "#0A1830" }}>
        Cargando precios de transporte...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-6 py-10 text-sm font-medium" style={{ color: "#8A1C1C" }}>
        No pudimos cargar los precios de transporte. Intenta nuevamente.
      </div>
    )
  }

  if (!data) return null

  // Orden alfabético por nombre de comuna (localeCompare "es" respeta tildes y ñ).
  const prices = Object.entries(data.transport_prices ?? {})
    .map(([communeCode, price]) => ({
      communeCode,
      communeName: getCommuneNameByCode(communeCode),
      price,
    }))
    .sort((a, b) => a.communeName.localeCompare(b.communeName, "es"))

  const hasPrices = data.hotel.offersTransport && prices.length > 0

  return (
    <div className="w-full px-4 pb-8 pt-4 md:px-6 flex flex-col gap-4">
      <div className="mt-4">
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#0A1830" }}>
          Precios de transporte
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
          Valores de transporte <strong>por tramo</strong> y por comuna
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#0A1830" }}>
          <Car size={20} style={{ color: "#0A1830" }} />
          Valores de Transporte
        </h2>

        {hasPrices ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {prices.map(({ communeCode, communeName, price }) => (
              <div
                key={communeCode}
                className="flex items-center justify-between py-2.5 px-4 rounded-xl"
                style={{ backgroundColor: "#F9FAFB" }}
              >
                <span className="text-sm" style={{ color: "#0A1830" }}>
                  {communeName}
                </span>
                <span className="text-sm font-bold" style={{ color: "#0A1830" }}>
                  {formatClp(price)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm" style={{ color: "#6B7280" }}>
            {data.hotel.offersTransport
              ? "Todavía no hay precios de transporte configurados."
              : "Este hotel no ofrece servicio de transporte."}
          </p>
        )}
      </div>
    </div>
  )
}

interface PageProps {
  params: Promise<{ hotelId: string }>
}

export default function TransportPricesPage({ params }: PageProps) {
  const { hotelId } = use(params)

  return (
    <ManagerLayout hotelId={hotelId}>
      <TransportPricesContent hotelId={hotelId} />
    </ManagerLayout>
  )
}
