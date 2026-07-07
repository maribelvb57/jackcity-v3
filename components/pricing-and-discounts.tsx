"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Edit2, Check, X, ArrowRight } from "lucide-react"
import { getHotelInfo } from "@/lib/api/hotel-info"
import { updateHotelPricing } from "@/lib/api/hotel-settings"
import { useApiClient } from "@/hooks/use-api-client"
import { formatClp } from "@/lib/format"
import { PET_SIZE_LABEL, type PetSize } from "@/lib/api/hotels"

const PET_SIZE_ORDER: PetSize[] = ["SMALL", "MEDIUM", "LARGE", "EXTRA_LARGE"]

const CONFIRM_SIZE_LABEL: Record<PetSize, string> = {
  ...PET_SIZE_LABEL,
  MEDIUM: "Tamaño de mascota MEDIANO",
}

interface PriceRow {
  sizeCode: PetSize
  label: string
  price: number
}

interface DiscountRow {
  key: string
  value: number
}

interface PendingSave {
  fieldId: string
  label: string
  oldFormatted: string
  newFormatted: string
  newNumeric: number
}

function ConfirmModal({
  pending,
  loading,
  error,
  onConfirm,
  onCancel,
}: {
  pending: PendingSave | null
  loading: boolean
  error: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!pending) return null
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

        <h3 className="text-base font-bold mb-1" style={{ color: "#0A1830" }}>
          ¿Confirmar cambio?
        </h3>
        <p className="text-sm mb-5" style={{ color: "#6B7280" }}>
          {pending.label}
        </p>

        <div
          className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl mb-5"
          style={{ backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" }}
        >
          <span className="text-sm font-semibold line-through" style={{ color: "#9CA3AF" }}>
            {pending.oldFormatted}
          </span>
          <ArrowRight size={16} style={{ color: "#9CA3AF", flexShrink: 0 }} />
          <span className="text-base font-bold" style={{ color: "#0A1830" }}>
            {pending.newFormatted}
          </span>
        </div>

        {error && (
          <p className="text-xs mb-3 text-center" style={{ color: "#DC2626" }}>
            No se pudo guardar el cambio. Intenta nuevamente.
          </p>
        )}

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
            style={{ backgroundColor: "#1a3a5c" }}
          >
            {loading
              ? <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : "Confirmar"
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export function PricingAndDiscounts({ hotelId }: { hotelId: string }) {
  const { apiFetch } = useApiClient()

  const { data: hotelInfo, isLoading, isError } = useQuery({
    queryKey: ["hotel-info", hotelId],
    queryFn: () => getHotelInfo(hotelId),
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000,
  })

  const [prices, setPrices] = useState<PriceRow[]>([])
  const [discounts, setDiscounts] = useState<DiscountRow[]>([])

  useEffect(() => {
    if (!hotelInfo) return
    setPrices(
      PET_SIZE_ORDER
        .filter((size) => hotelInfo.pricing[size] !== undefined)
        .map((size) => ({
          sizeCode: size,
          label: PET_SIZE_LABEL[size],
          price: hotelInfo.pricing[size],
        }))
    )
    setDiscounts(
      Object.entries(hotelInfo.discounts).map(([key, value]) => ({ key, value }))
    )
  }, [hotelInfo])

  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>("")
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null)
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState(false)

  function startEdit(fieldId: string, currentValue: number) {
    setEditingField(fieldId)
    setEditingValue(String(currentValue))
  }

  function requestSave(fieldId: string) {
    if (!editingValue) return

    if (fieldId.startsWith("price-")) {
      const sizeCode = fieldId.replace("price-", "") as PetSize
      const newPrice = parseInt(editingValue, 10)
      if (isNaN(newPrice) || newPrice <= 0) return
      const row = prices.find((r) => r.sizeCode === sizeCode)
      if (!row) return
      setPendingSave({
        fieldId,
        label: CONFIRM_SIZE_LABEL[sizeCode],
        oldFormatted: formatClp(row.price),
        newFormatted: formatClp(newPrice),
        newNumeric: newPrice,
      })
    } else if (fieldId.startsWith("discount-")) {
      const key = fieldId.replace("discount-", "")
      const newValue = parseFloat(editingValue)
      if (isNaN(newValue) || newValue < 0) return
      const row = discounts.find((r) => r.key === key)
      if (!row) return
      setPendingSave({
        fieldId,
        label: key,
        oldFormatted: `${row.value}%`,
        newFormatted: `${newValue}%`,
        newNumeric: newValue,
      })
    }
  }

  async function confirmSave() {
    if (!pendingSave) return
    const { fieldId, newNumeric } = pendingSave
    setSaveLoading(true)
    setSaveError(false)

    try {
      if (fieldId.startsWith("price-")) {
        const sizeCode = fieldId.replace("price-", "") as PetSize
        await updateHotelPricing(hotelId, sizeCode, newNumeric, apiFetch)
        setPrices((prev) =>
          prev.map((row) => row.sizeCode === sizeCode ? { ...row, price: newNumeric } : row)
        )
      } else if (fieldId.startsWith("discount-")) {
        // TODO: requiere minNights — pendiente de ajuste en GET /api/hotel/info
        const key = fieldId.replace("discount-", "")
        setDiscounts((prev) =>
          prev.map((row) => row.key === key ? { ...row, value: newNumeric } : row)
        )
      }
      setPendingSave(null)
      setEditingField(null)
      setEditingValue("")
    } catch {
      setSaveError(true)
    } finally {
      setSaveLoading(false)
    }
  }

  function cancelSave() {
    setPendingSave(null)
    setSaveError(false)
    // stay in edit mode so user can correct the value
  }

  function cancelEdit() {
    setEditingField(null)
    setEditingValue("")
  }

  if (isLoading) {
    return (
      <div className="px-6 py-10 text-sm font-medium" style={{ color: "#0A1830" }}>
        Cargando precios...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-6 py-10 text-sm font-medium" style={{ color: "#8A1C1C" }}>
        No pudimos cargar los precios del hotel. Intenta nuevamente.
      </div>
    )
  }

  return (
    <>
      <div className="w-full max-w-3xl mx-auto px-4 py-8">

        {/* Precios por Noche */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6" style={{ color: "#1a3a5c" }}>
            Precios por Noche
          </h2>

          <div className="space-y-4">
            {prices.map((row) => {
              const fieldId = `price-${row.sizeCode}`
              const isEditing = editingField === fieldId
              return (
                <div
                  key={row.sizeCode}
                  className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-sm transition-shadow"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <span className="text-sm font-medium flex-1" style={{ color: "#1a3a5c" }}>
                    {row.label}
                  </span>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value.replace(/\D/g, ""))}
                          onKeyDown={(e) => e.key === "Enter" && requestSave(fieldId)}
                          className="w-32 px-3 py-2 text-sm border-2 rounded focus:outline-none"
                          style={{ borderColor: "#FFC43D" }}
                          autoFocus
                        />
                        <button
                          onClick={() => requestSave(fieldId)}
                          className="p-1.5 rounded hover:bg-green-100 transition-colors"
                          title="Guardar"
                        >
                          <Check size={18} style={{ color: "#22C55E" }} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 rounded hover:bg-red-100 transition-colors"
                          title="Cancelar"
                        >
                          <X size={18} style={{ color: "#EF4444" }} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="w-32 text-right font-semibold" style={{ color: "#1a3a5c" }}>
                          {formatClp(row.price)}
                        </span>
                        <button
                          onClick={() => startEdit(fieldId, row.price)}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} style={{ color: "#1a3a5c" }} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Descuentos */}
        {discounts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6" style={{ color: "#1a3a5c" }}>
              Descuentos
            </h2>

            <div className="space-y-4">
              {discounts.map((row) => {
                const fieldId = `discount-${row.key}`
                const isEditing = editingField === fieldId
                return (
                  <div
                    key={row.key}
                    className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-sm transition-shadow"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <span className="text-sm font-medium flex-1" style={{ color: "#1a3a5c" }}>
                      {row.key}
                    </span>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && requestSave(fieldId)}
                            className="w-20 px-3 py-2 text-sm border-2 rounded focus:outline-none"
                            style={{ borderColor: "#FFC43D" }}
                            autoFocus
                          />
                          <span className="text-sm" style={{ color: "#4B5563" }}>%</span>
                          <button
                            onClick={() => requestSave(fieldId)}
                            className="p-1.5 rounded hover:bg-green-100 transition-colors"
                            title="Guardar"
                          >
                            <Check size={18} style={{ color: "#22C55E" }} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1.5 rounded hover:bg-red-100 transition-colors"
                            title="Cancelar"
                          >
                            <X size={18} style={{ color: "#EF4444" }} />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="w-20 text-right font-semibold" style={{ color: "#1a3a5c" }}>
                            {row.value}%
                          </span>
                          <button
                            onClick={() => startEdit(fieldId, row.value)}
                            className="p-1.5 rounded hover:bg-gray-100 transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} style={{ color: "#1a3a5c" }} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>

      <ConfirmModal
        pending={pendingSave}
        loading={saveLoading}
        error={saveError}
        onConfirm={confirmSave}
        onCancel={cancelSave}
      />
    </>
  )
}
