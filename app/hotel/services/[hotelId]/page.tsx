"use client"

import { use, useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ManagerLayout } from "@/components/manager-layout"
import { useApiClient } from "@/hooks/use-api-client"
import { getHotelInfo } from "@/lib/api/hotel-info"
import { updateHotelStatus, updateHotelTransport } from "@/lib/api/hotel-settings"
import {
  CheckCircle2,
  PauseCircle,
  Car,
  AlertTriangle,
  X,
} from "lucide-react"

interface ToggleProps {
  enabled: boolean
  onChange: () => void
  disabled?: boolean
}

function Toggle({ enabled, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={onChange}
      className="relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none flex-shrink-0"
      style={{
        backgroundColor: enabled ? "#22C55E" : "#D1D5DB",
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <span
        className="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200"
        style={{ transform: enabled ? "translateX(32px)" : "translateX(4px)" }}
      />
    </button>
  )
}

interface ConfirmModalProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  confirmColor: string
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}

function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  confirmColor,
  loading,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={!loading ? onCancel : undefined} />
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        {!loading && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 transition-opacity hover:opacity-60"
            style={{ color: "#9CA3AF" }}
          >
            <X size={20} />
          </button>
        )}
        <div className="flex items-start gap-3 mb-5">
          <AlertTriangle size={22} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
          <div>
            <h3 className="text-base font-bold" style={{ color: "#0A1830" }}>
              {title}
            </h3>
            <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "#6B7280" }}>
              {description}
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 min-w-[100px] flex items-center justify-center"
            style={{ backgroundColor: confirmColor }}
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function HotelServicesContent({ hotelId }: { hotelId: string }) {
  const { apiFetch } = useApiClient()
  const queryClient = useQueryClient()

  const { data: hotelInfo, isLoading, isError } = useQuery({
    queryKey: ["hotel-info", hotelId],
    queryFn: () => getHotelInfo(hotelId, apiFetch),
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000,
  })

  const [reservasActive, setReservasActive] = useState<boolean | null>(null)
  const [transporteActive, setTransporteActive] = useState<boolean | null>(null)

  useEffect(() => {
    if (hotelInfo) {
      setReservasActive(hotelInfo.hotel.status === "ACTIVE")
      setTransporteActive(hotelInfo.hotel.offersTransport)
    }
  }, [hotelInfo])

  const [reservasModal, setReservasModal] = useState(false)
  const [transporteModal, setTransporteModal] = useState(false)
  const [reservasLoading, setReservasLoading] = useState(false)
  const [transporteLoading, setTransporteLoading] = useState(false)
  const [reservasError, setReservasError] = useState(false)
  const [transporteError, setTransporteError] = useState(false)

  const handleReservasConfirm = async () => {
    if (reservasActive === null) return
    setReservasLoading(true)
    setReservasError(false)
    try {
      const next: "ACTIVE" | "PAUSED" = reservasActive ? "PAUSED" : "ACTIVE"
      const result = await updateHotelStatus(hotelId, next, apiFetch)
      setReservasActive(result.status === "ACTIVE")
      queryClient.invalidateQueries({ queryKey: ["hotel-info", hotelId] })
      setReservasModal(false)
    } catch {
      setReservasError(true)
    } finally {
      setReservasLoading(false)
    }
  }

  const handleTransporteConfirm = async () => {
    setTransporteLoading(true)
    setTransporteError(false)
    try {
      const result = await updateHotelTransport(hotelId, false, apiFetch)
      setTransporteActive(result.offersTransport)
      queryClient.invalidateQueries({ queryKey: ["hotel-info", hotelId] })
      setTransporteModal(false)
    } catch {
      setTransporteError(true)
    } finally {
      setTransporteLoading(false)
    }
  }

  if (isLoading || reservasActive === null) {
    return (
      <div className="px-6 py-10 text-sm font-medium" style={{ color: "#0A1830" }}>
        Cargando configuración del hotel...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-6 py-10 text-sm font-medium" style={{ color: "#8A1C1C" }}>
        No pudimos cargar la configuración del hotel. Intenta nuevamente.
      </div>
    )
  }

  return (
    <>
      <div className="w-full px-4 pb-8 pt-4 md:px-6 flex flex-col gap-4">
        <h1 className="text-2xl md:text-3xl font-bold mt-4" style={{ color: "#0A1830" }}>
          Servicios del Hotel
        </h1>

        {/* Card: Estado de reservas */}
        <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: reservasActive ? "#D1FAE5" : "#F3F4F6" }}
              >
                {reservasActive
                  ? <CheckCircle2 size={24} style={{ color: "#059669" }} />
                  : <PauseCircle size={24} style={{ color: "#9CA3AF" }} />
                }
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: "#0A1830" }}>
                  Estado de reservas
                </h2>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "#6B7280" }}>
                  Controla si tu hotel aparece en las búsquedas y acepta nuevas reservas.
                </p>
                <span
                  className="inline-flex items-center mt-2.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: reservasActive ? "#D1FAE5" : "#F3F4F6",
                    color: reservasActive ? "#065F46" : "#6B7280",
                  }}
                >
                  {reservasActive ? "Activo" : "Pausado"}
                </span>
                {reservasError && (
                  <p className="text-xs mt-2" style={{ color: "#DC2626" }}>
                    No se pudo actualizar el estado. Intenta nuevamente.
                  </p>
                )}
              </div>
            </div>
            <Toggle
              enabled={reservasActive}
              onChange={() => { setReservasError(false); setReservasModal(true) }}
            />
          </div>
        </div>

        {/* Card: Transporte */}
        <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: "#E5E7EB" }}>
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: transporteActive ? "#EFF6FF" : "#F3F4F6" }}
              >
                <Car size={24} style={{ color: transporteActive ? "#2563EB" : "#9CA3AF" }} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: "#0A1830" }}>
                  Transporte a domicilio
                </h2>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "#6B7280" }}>
                  Indica si tu hotel ofrece retiro y entrega de mascotas en las comunas configuradas.
                </p>
                <span
                  className="inline-flex items-center mt-2.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: transporteActive ? "#EFF6FF" : "#F3F4F6",
                    color: transporteActive ? "#1D4ED8" : "#6B7280",
                  }}
                >
                  {transporteActive ? "Activo" : "Inactivo"}
                </span>
                {!transporteActive && (
                  <p className="text-xs mt-2" style={{ color: "#9CA3AF" }}>
                    Para activar el transporte contacta al equipo de JackCity.
                  </p>
                )}
                {transporteError && (
                  <p className="text-xs mt-2" style={{ color: "#DC2626" }}>
                    No se pudo actualizar el transporte. Intenta nuevamente.
                  </p>
                )}
              </div>
            </div>
            <Toggle
              enabled={!!transporteActive}
              onChange={() => { setTransporteError(false); setTransporteModal(true) }}
              disabled={!transporteActive}
            />
          </div>
        </div>
      </div>

      {/* Modal: reservas */}
      <ConfirmModal
        open={reservasModal}
        title={reservasActive ? "¿Pausar tu hotel?" : "¿Reactivar tu hotel?"}
        description={
          reservasActive
            ? "Tu hotel dejará de aparecer en las búsquedas y no recibirá nuevas reservas hasta que lo reactives."
            : "Tu hotel volverá a aparecer en las búsquedas y podrá recibir nuevas reservas."
        }
        confirmLabel={reservasActive ? "Sí, pausar" : "Sí, reactivar"}
        confirmColor={reservasActive ? "#F59E0B" : "#059669"}
        loading={reservasLoading}
        onCancel={() => setReservasModal(false)}
        onConfirm={handleReservasConfirm}
      />

      {/* Modal: transporte */}
      <ConfirmModal
        open={transporteModal}
        title="¿Desactivar el transporte?"
        description="Tu hotel dejará de ofrecer el servicio de transporte. Para volver a activarlo deberás contactar al equipo de JackCity."
        confirmLabel="Sí, desactivar"
        confirmColor="#EF4444"
        loading={transporteLoading}
        onCancel={() => setTransporteModal(false)}
        onConfirm={handleTransporteConfirm}
      />
    </>
  )
}

interface PageProps {
  params: Promise<{ hotelId: string }>
}

export default function HotelServicesPage({ params }: PageProps) {
  const { hotelId } = use(params)
  return (
    <ManagerLayout hotelId={hotelId}>
      <HotelServicesContent hotelId={hotelId} />
    </ManagerLayout>
  )
}
