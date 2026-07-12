"use client"

import { use, type ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"
import { ManagerLayout } from "@/components/manager-layout"
import { formatClp } from "@/lib/format"
import { getCommuneNameByCode } from "@/config/communes"
import { PET_SIZE_LABEL, type PetSize } from "@/lib/api/hotels"
import { getHotelInfo } from "@/lib/api/hotel-info"
import { useApiClient } from "@/hooks/use-api-client"
import {
  MapPin,
  Clock,
  ShieldCheck,
  Star,
  Check,
  AlertCircle,
  Car,
  Users,
  Tag,
  Building2,
  Percent,
} from "lucide-react"

const PET_SIZE_ORDER: PetSize[] = ["SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE"]

function Section({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: "#0A1830" }}>
        {icon}
        {title}
      </h2>
      {children}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      className="flex flex-col sm:flex-row gap-1 sm:gap-4 py-2.5 border-b last:border-b-0"
      style={{ borderColor: "#F3F4F6" }}
    >
      <span className="text-xs font-semibold min-w-[160px]" style={{ color: "#9CA3AF" }}>
        {label}
      </span>
      <span className="text-sm" style={{ color: "#0A1830" }}>
        {value}
      </span>
    </div>
  )
}

function HotelInfoContent({ hotelId }: { hotelId: string }) {
  const { apiFetch } = useApiClient()
  const { data, isLoading, isError } = useQuery({
    queryKey: ["hotel-info", hotelId],
    queryFn: () => getHotelInfo(hotelId, apiFetch),
    enabled: !!hotelId,
  })

  const hasTransportPrices =
    data?.hotel.offersTransport && Object.keys(data.transport_prices ?? {}).length > 0

  if (isLoading) {
    return (
      <div className="px-6 py-10 text-sm font-medium" style={{ color: "#0A1830" }}>
        Cargando información del hotel...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-6 py-10 text-sm font-medium" style={{ color: "#8A1C1C" }}>
        No pudimos cargar la información del hotel. Intenta nuevamente.
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="w-full px-4 pb-8 pt-4 md:px-6 flex flex-col gap-4">
      <h1 className="text-2xl md:text-3xl font-bold mt-4" style={{ color: "#0A1830" }}>
        {data.hotel.name}
      </h1>

      {/* Info General */}
      <Section
        title="Info General"
        icon={<Building2 size={20} style={{ color: "#0A1830" }} />}
      >
        <div className="flex flex-col">
          <InfoRow
            label="Estado"
            value={
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: data.hotel.status === "ACTIVE" ? "#D1FAE5" : "#F3F4F6",
                  color: data.hotel.status === "ACTIVE" ? "#065F46" : "#6B7280",
                }}
              >
                {data.hotel.status === "ACTIVE" ? "Activo" : data.hotel.status}
              </span>
            }
          />
          <InfoRow
            label="Ofrece transporte"
            value={data.hotel.offersTransport ? "Sí" : "No"}
          />
          <InfoRow label="Dirección" value={data.hotel.addressStreet} />
          <InfoRow
            label="Comuna"
            value={
              <span className="flex items-center gap-1.5">
                <MapPin size={13} style={{ color: "#9CA3AF" }} />
                {getCommuneNameByCode(data.hotel.communeCode)}
              </span>
            }
          />
          <InfoRow
            label="Puntuación"
            value={
              <span className="flex items-center gap-1.5">
                <Star size={14} style={{ color: "#FFC43D", fill: "#FFC43D" }} />
                <strong>{data.hotel.avgRating}</strong>
                <span style={{ color: "#6B7280" }}>({data.hotel.reviewsCount} reseñas)</span>
              </span>
            }
          />
        </div>

        {(data.hotel.reviewText || data.hotel.description) && (
          <div className="mt-4 flex flex-col gap-4">
            {data.hotel.reviewText && (
              <blockquote
                className="border-l-4 pl-4 italic text-sm leading-relaxed"
                style={{ borderColor: "#FFC43D", color: "#555" }}
              >
                &ldquo;{data.hotel.reviewText}&rdquo;
                {data.hotel.reviewUserName && (
                  <span
                    className="block mt-1 not-italic text-xs font-semibold"
                    style={{ color: "#9CA3AF" }}
                  >
                    — {data.hotel.reviewUserName}
                  </span>
                )}
              </blockquote>
            )}
            {data.hotel.description && (
              <p
                className="text-sm leading-relaxed whitespace-pre-line"
                style={{ color: "#555" }}
              >
                {data.hotel.description}
              </p>
            )}
          </div>
        )}
      </Section>

      {/* Check-in y Check-out */}
      <Section
        title="Check-in y Check-out"
        icon={<Clock size={20} style={{ color: "#0A1830" }} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            className="rounded-xl p-4 border"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: "#9CA3AF" }}>
              Check-in
            </p>
            <p className="text-base font-bold" style={{ color: "#0A1830" }}>
              {data.hotel.checkinTime}
            </p>
          </div>
          <div
            className="rounded-xl p-4 border"
            style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color: "#9CA3AF" }}>
              Check-out
            </p>
            <p className="text-base font-bold" style={{ color: "#0A1830" }}>
              {data.hotel.checkoutTime}
            </p>
          </div>
        </div>
      </Section>

      {/* Políticas del Hotel */}
      {data.hotel.policies.length > 0 && (
        <Section
          title="Políticas del Hotel"
          icon={<ShieldCheck size={20} style={{ color: "#0A1830" }} />}
        >
          <ul className="flex flex-col gap-3">
            {data.hotel.policies.map((policy, i) => (
              <li key={i} className="flex items-start gap-3">
                <AlertCircle
                  size={16}
                  style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }}
                />
                <span className="text-sm flex-1" style={{ color: "#555" }}>
                  {policy.description}
                </span>
                {policy.confirmationRequired && (
                  <span
                    className="flex-shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "#FEF3C7", color: "#B45309" }}
                  >
                    Requiere confirmación
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Beneficios del Hotel */}
      {data.hotel.benefits.length > 0 && (
        <Section
          title="Beneficios del Hotel"
          icon={<Check size={20} style={{ color: "#0A1830" }} />}
        >
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.hotel.benefits.map((benefit, i) => (
              <li
                key={i}
                className="flex items-center gap-2.5 text-sm"
                style={{ color: "#0A1830" }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "#D1FAE5" }}
                >
                  <Check size={11} style={{ color: "#065F46" }} strokeWidth={3} />
                </div>
                {benefit.name}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Precios por noche */}
      {Object.keys(data.pricing).length > 0 && (
        <Section
          title="Precios por noche"
          icon={<Tag size={20} style={{ color: "#0A1830" }} />}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PET_SIZE_ORDER.filter((size) => data.pricing[size] !== undefined).map((size) => (
              <div
                key={size}
                className="rounded-xl p-4 border text-center"
                style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}
              >
                <p className="text-xs font-semibold mb-1.5" style={{ color: "#9CA3AF" }}>
                  {PET_SIZE_LABEL[size]}
                </p>
                <p className="text-lg font-bold" style={{ color: "#0A1830" }}>
                  {formatClp(data.pricing[size])}
                </p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Descuentos */}
      {Object.keys(data.discounts).length > 0 && (
        <Section
          title="Descuentos"
          icon={<Percent size={20} style={{ color: "#0A1830" }} />}
        >
          <ul className="flex flex-col">
            {Object.entries(data.discounts).map(([key, value]) => (
              <li
                key={key}
                className="flex items-center justify-between py-3 border-b last:border-b-0"
                style={{ borderColor: "#F3F4F6" }}
              >
                <span className="text-sm" style={{ color: "#0A1830" }}>
                  {key}
                </span>
                <span
                  className="text-sm font-bold px-2.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "#D1FAE5", color: "#065F46" }}
                >
                  {value}%
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Valores de Transporte */}
      {hasTransportPrices && (
        <Section
          title="Valores de Transporte"
          icon={<Car size={20} style={{ color: "#0A1830" }} />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(data.transport_prices).map(([communeCode, price]) => (
              <div
                key={communeCode}
                className="flex items-center justify-between py-2.5 px-4 rounded-xl"
                style={{ backgroundColor: "#F9FAFB" }}
              >
                <span className="text-sm" style={{ color: "#0A1830" }}>
                  {getCommuneNameByCode(communeCode)}
                </span>
                <span className="text-sm font-bold" style={{ color: "#0A1830" }}>
                  {formatClp(price)}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Usuarios y Staff */}
      {data.usuarios.length > 0 && (
        <Section
          title="Usuarios y Staff"
          icon={<Users size={20} style={{ color: "#0A1830" }} />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.usuarios.map((user, i) => (
              <div
                key={i}
                className="rounded-xl p-4 border flex items-center gap-3"
                style={{ borderColor: "#E5E7EB" }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm uppercase"
                  style={{ backgroundColor: "#EEF2FF", color: "#4F46E5" }}
                >
                  {user.name.charAt(0)}{user.lastName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold" style={{ color: "#0A1830" }}>
                    {user.name} {user.lastName}
                  </p>
                  <p className="text-xs truncate" style={{ color: "#6B7280" }}>
                    {user.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

interface PageProps {
  params: Promise<{ hotelId: string }>
}

export default function HotelInfoPage({ params }: PageProps) {
  const { hotelId } = use(params)

  return (
    <ManagerLayout hotelId={hotelId}>
      <HotelInfoContent hotelId={hotelId} />
    </ManagerLayout>
  )
}
