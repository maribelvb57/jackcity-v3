"use client"

import { use, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  PawPrint,
  ShieldCheck,
  Star,
  Car,
  User,
  CreditCard,
  Info,
  X,
  XCircle,
  LogIn,
  LogOut,
  Ban,
  Lock,
  Hourglass,
  FileText,
  Eye,
  ArrowLeft,
  Pencil,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { ManagerLayout } from "@/components/manager-layout"
import { useApiClient } from "@/hooks/use-api-client"
import { formatClp } from "@/lib/format"
import { getHotelBookings, confirmHotelBooking, checkInHotelBooking, checkOutHotelBooking, markNoShowHotelBooking, type HotelBooking, type HotelBookingStatus, type TransportSlot, type BookingPet, type BookingReviewType } from "@/lib/api/hotel-bookings"
import { getBookingDocuments, getPetDocumentDownloadUrl, approveBookingDocument, rejectBookingDocument, setBookingDocumentValidUntil, setBookingDocumentComments, type BookingDocumentsPet, type BookingDocumentStatus } from "@/lib/api/booking-documents"
import { getBookingStatusLabel } from "@/lib/booking-status"

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Agrupaciones de estados (según definición de negocio):
//   Vigentes:    PAID, CONFIRMED, INITIATED, PENDING_CANCELLATION
//   Completadas: COMPLETED, CLOSED, NO_SHOW
//   Otras:       PENDING_PAYMENT, EXPIRED, CANCELLED
type BookingGroup = "VIGENTES" | "COMPLETADAS" | "OTRAS"

const GROUP_STATUSES: Record<BookingGroup, HotelBookingStatus[]> = {
  VIGENTES: ["PAID", "CONFIRMED", "INITIATED", "PENDING_CANCELLATION"],
  COMPLETADAS: ["COMPLETED", "CLOSED", "NO_SHOW"],
  OTRAS: ["PENDING_PAYMENT", "EXPIRED", "CANCELLED"],
}

function bookingGroup(status: HotelBookingStatus): BookingGroup {
  if (GROUP_STATUSES.VIGENTES.includes(status)) return "VIGENTES"
  if (GROUP_STATUSES.COMPLETADAS.includes(status)) return "COMPLETADAS"
  return "OTRAS"
}

// Acciones disponibles por estado. Aún sin cablear al backend: los endpoints/contratos
// los define Maribel en un paso posterior (ver resumen).
type BookingActionKey = "confirm" | "checkin" | "checkout" | "no_show"

interface BookingAction {
  key: BookingActionKey
  label: string
  variant: "primary" | "danger"
}

const ACTION_CONFIRM: Record<BookingActionKey, { title: string; description: string; confirmLabel: string; danger: boolean }> = {
  confirm: {
    title: "Confirmar reserva",
    description: "La reserva pasará a estado Confirmada y el cliente será notificado.",
    confirmLabel: "Sí, confirmar",
    danger: false,
  },
  checkin: {
    title: "Registrar check-in",
    description: "Se marcará que la mascota ingresó al hotel.",
    confirmLabel: "Sí, hacer check-in",
    danger: false,
  },
  checkout: {
    title: "Registrar check-out",
    description: "La reserva se marcará como completada y la mascota dejó el hotel.",
    confirmLabel: "Sí, hacer check-out",
    danger: false,
  },
  no_show: {
    title: "Marcar como No Show",
    description: "Se registrará que el cliente no se presentó al hotel. Esta acción no se puede deshacer.",
    confirmLabel: "Sí, marcar No Show",
    danger: true,
  },
}

const STATUS_ACTIONS: Record<HotelBookingStatus, BookingAction[]> = {
  PAID: [{ key: "confirm", label: "Confirmar Reserva", variant: "primary" }],
  CONFIRMED: [
    { key: "checkin", label: "Check-in", variant: "primary" },
    { key: "no_show", label: "No Show", variant: "danger" },
  ],
  INITIATED: [{ key: "checkout", label: "Check-out", variant: "primary" }],
  PENDING_CANCELLATION: [],
  PENDING_PAYMENT: [],
  COMPLETED: [],
  CLOSED: [],
  EXPIRED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

function formatDate(date: string) {
  return format(new Date(`${date}T12:00:00`), "d MMM yyyy", { locale: es })
}

function nightsBetween(checkinDate: string, checkoutDate: string) {
  const checkin = new Date(`${checkinDate}T12:00:00`)
  const checkout = new Date(`${checkoutDate}T12:00:00`)
  return Math.max(1, Math.round((checkout.getTime() - checkin.getTime()) / 86400000))
}

const SLOT_LABEL: Record<TransportSlot, string> = { AM: "Mañana", MD: "Mediodía", PM: "Tarde" }

const SIZE_LABEL: Record<string, string> = {
  SMALL: "Pequeño", MEDIUM: "Mediano", LARGE: "Grande", EXTRA_LARGE: "Extra grande",
}
const GENDER_LABEL: Record<string, string> = { MALE: "Macho", FEMALE: "Hembra" }
const SPECIES_LABEL: Record<string, string> = { DOG: "Perro", CAT: "Gato" }

function calcAge(birthDate: string): string {
  const birth = new Date(birthDate)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (months < 12) return `${months} mes${months === 1 ? "" : "es"}`
  const years = Math.floor(months / 12)
  return `${years} año${years === 1 ? "" : "s"}`
}

// ─── Pet Modal ────────────────────────────────────────────────────────────────

function PetModal({ pet, onClose }: { pet: BookingPet; onClose: () => void }) {
  const rows: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Nombre", value: pet.name },
    { label: "Especie", value: pet.species ? (SPECIES_LABEL[pet.species] ?? pet.species) : null },
    { label: "Raza", value: pet.breedName ?? (pet.breedId != null ? `ID ${pet.breedId}` : null) },
    { label: "Tamaño", value: pet.size ? (SIZE_LABEL[pet.size] ?? pet.size) : null },
    { label: "Género", value: pet.gender ? (GENDER_LABEL[pet.gender] ?? pet.gender) : null },
    { label: "Peso", value: pet.weight != null ? `${pet.weight} kg` : null },
    { label: "Edad", value: pet.birthDate ? calcAge(pet.birthDate) : null },
    { label: "Color", value: pet.color },
    { label: "Notas", value: pet.notes },
  ]

  const vaccineEntries = pet.vaccines ? Object.entries(pet.vaccines) : []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#1a3a5c" }}>
          <div className="flex items-center gap-2">
            <PawPrint size={18} style={{ color: "#FFC43D" }} />
            <span className="text-lg font-bold text-white">{pet.name}</span>
          </div>
          <button onClick={onClose} className="text-white hover:opacity-70 transition-opacity" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-2.5 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          {rows.map(({ label, value }) =>
            value ? (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-wide flex-shrink-0" style={{ color: "#9CA3AF" }}>
                  {label}
                </span>
                <span className="text-sm font-semibold text-right" style={{ color: "#0A1830" }}>
                  {value}
                </span>
              </div>
            ) : null
          )}

          {vaccineEntries.length > 0 && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                Vacunas
              </span>
              <div className="mt-1.5 space-y-1">
                {vaccineEntries.map(([name, date]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-xs font-semibold capitalize" style={{ color: "#526071" }}>{name}</span>
                    <span className="text-xs font-semibold" style={{ color: "#0A1830" }}>
                      {formatDate(date)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t flex justify-end" style={{ borderColor: "#E5E7EB" }}>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm Action Modal ───────────────────────────────────────────────────

function ConfirmActionModal({
  action,
  booking,
  isPending,
  onConfirm,
  onCancel,
}: {
  action: BookingActionKey
  booking: HotelBooking
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const meta = ACTION_CONFIRM[action]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#1a3a5c" }}>
          <span className="text-lg font-bold text-white">{meta.title}</span>
          <button onClick={onCancel} disabled={isPending} className="text-white hover:opacity-70 transition-opacity disabled:opacity-50" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm font-medium leading-6" style={{ color: "#526071" }}>
            {meta.description}
          </p>
          <div className="mt-4 rounded-lg border px-4 py-3" style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Reserva</p>
            <p className="mt-1 text-sm font-bold" style={{ color: "#0A1830" }}>
              {customerFullName(booking.customer)} · {petNames(booking.pets)}
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold" style={{ color: "#8A94A6" }}>
              #{booking.id.slice(0, 8)}
            </p>
          </div>
        </div>

        <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderColor: "#E5E7EB" }}>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-bold border transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: "#E5E7EB", color: "#526071" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: meta.danger ? "#9B1C1C" : "#FFC43D",
              color: meta.danger ? "#FFFFFF" : "#0D2B45",
            }}
          >
            {isPending ? "Procesando..." : meta.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function statusMeta(status: HotelBookingStatus) {
  switch (status) {
    case "PENDING_PAYMENT": return { color: "#9B1C1C", bg: "#FDE8E8", icon: Clock }
    case "PAID": return { color: "#125BD8", bg: "#EAF2FF", icon: ShieldCheck }
    case "CONFIRMED": return { color: "#08785B", bg: "#EAF8F3", icon: CheckCircle2 }
    case "INITIATED": return { color: "#4338CA", bg: "#EEF2FF", icon: LogIn }
    case "PENDING_CANCELLATION": return { color: "#9A3412", bg: "#FFF7ED", icon: Hourglass }
    case "COMPLETED": return { color: "#0D2B45", bg: "#EAF2F8", icon: Star }
    case "CLOSED": return { color: "#526071", bg: "#F3F4F6", icon: Lock }
    case "EXPIRED": return { color: "#8A6D1C", bg: "#FEF3C7", icon: Hourglass }
    case "NO_SHOW": return { color: "#9A3412", bg: "#FFEDD5", icon: Ban }
    case "CANCELLED": return { color: "#526071", bg: "#F3F4F6", icon: X }
    default: return { color: "#526071", bg: "#F3F4F6", icon: Clock }
  }
}

function customerFullName(customer: HotelBooking["customer"]) {
  return [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "—"
}

function petNames(pets: HotelBooking["pets"]) {
  const names = pets.map((p) => p.name).filter(Boolean)
  if (names.length === 0) return "Sin mascotas"
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`
}

// ─── Aprobación de documentos ────────────────────────────────────────────────
// Datos reales desde GET /api/booking-documents/by-booking/{bookingId}.
// Las acciones Aprobar/Rechazar y "Ver" aún no tienen endpoint (pendiente Maribel):
// por ahora Aprobar/Rechazar sólo actualizan el estado visual local.

const DOC_STATUS_META: Record<BookingDocumentStatus, { label: string; color: string; bg: string }> = {
  UPLOADED: { label: "Pendiente", color: "#8A6D1C", bg: "#FEF3C7" },
  APPROVED: { label: "Aprobado", color: "#08785B", bg: "#EAF8F3" },
  REJECTED: { label: "Rechazado", color: "#9B1C1C", bg: "#FDE8E8" },
}

// Etiquetas de tipo de documento. Sólo conozco VACCINATION_CARD del backend; el
// resto se "humaniza" hasta tener el enum completo (pendiente Maribel).
const DOCUMENT_TYPE_LABEL: Record<string, string> = {
  VACCINATION_CARD: "Carnet de Vacunas",
}

function humanizeEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ")
}

function docTypeLabel(type: string) {
  return DOCUMENT_TYPE_LABEL[type] ?? humanizeEnum(type)
}

// Modal chico de confirmación para aprobar / rechazar un documento.
function DocConfirmModal({
  action,
  docLabel,
  petName,
  isPending = false,
  errorMessage,
  onConfirm,
  onCancel,
}: {
  action: "APPROVED" | "REJECTED"
  docLabel: string
  petName: string
  isPending?: boolean
  errorMessage?: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  const isApprove = action === "APPROVED"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#1a3a5c" }}>
          <span className="text-lg font-bold text-white">
            {isApprove ? "Aprobar documento" : "Rechazar documento"}
          </span>
          <button onClick={onCancel} disabled={isPending} className="text-white hover:opacity-70 transition-opacity disabled:opacity-50" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-sm font-medium leading-6" style={{ color: "#526071" }}>
            {isApprove
              ? "El documento quedará marcado como aprobado."
              : "El documento quedará marcado como rechazado."}
          </p>
          <div className="mt-4 rounded-lg border px-4 py-3" style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Documento</p>
            <p className="mt-1 text-sm font-bold" style={{ color: "#0A1830" }}>{docLabel}</p>
            <p className="mt-0.5 text-xs font-semibold" style={{ color: "#8A94A6" }}>{petName}</p>
          </div>
          {errorMessage && (
            <p className="mt-3 text-xs font-semibold" style={{ color: "#9B1C1C" }}>{errorMessage}</p>
          )}
        </div>

        <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderColor: "#E5E7EB" }}>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-bold border transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: "#E5E7EB", color: "#526071" }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: isApprove ? "#08785B" : "#9B1C1C" }}
          >
            {isPending ? "Procesando..." : isApprove ? "Sí, aprobar" : "Sí, rechazar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal para editar los comentarios de un documento.
function DocCommentsModal({
  docLabel,
  petName,
  currentValue,
  isPending = false,
  errorMessage,
  onSave,
  onCancel,
}: {
  docLabel: string
  petName: string
  currentValue: string
  isPending?: boolean
  errorMessage?: string | null
  onSave: (value: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(currentValue)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#1a3a5c" }}>
          <span className="text-lg font-bold text-white">Comentarios</span>
          <button onClick={onCancel} disabled={isPending} className="text-white hover:opacity-70 transition-opacity disabled:opacity-50" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="rounded-lg border px-4 py-3" style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>Documento</p>
            <p className="mt-1 text-sm font-bold" style={{ color: "#0A1830" }}>{docLabel}</p>
            <p className="mt-0.5 text-xs font-semibold" style={{ color: "#8A94A6" }}>{petName}</p>
          </div>

          <div className="mt-4">
            <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
              Comentarios
            </label>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isPending}
              rows={4}
              placeholder="Escribe un comentario…"
              className="mt-1.5 w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none focus:border-[#125BD8] disabled:opacity-60"
              style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
            />
          </div>

          {errorMessage && (
            <p className="mt-3 text-xs font-semibold" style={{ color: "#9B1C1C" }}>{errorMessage}</p>
          )}
        </div>

        <div className="px-5 py-4 border-t flex justify-end gap-2" style={{ borderColor: "#E5E7EB" }}>
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-bold border transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: "#E5E7EB", color: "#526071" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(value)}
            disabled={isPending}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
          >
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  )
}

interface DocRowState {
  id: number
  petDocumentId: string
  label: string
  status: BookingDocumentStatus
  validUntil: string
  comments: string
}

function PetDocumentsSection({ pet, bookingId }: { pet: BookingDocumentsPet; bookingId: string }) {
  const { apiFetch } = useApiClient()
  const queryClient = useQueryClient()
  const [docs, setDocs] = useState<DocRowState[]>(() =>
    pet.documents.map((d) => ({
      id: d.id,
      petDocumentId: d.petDocument.id,
      label: docTypeLabel(d.petDocument.documentType),
      status: d.status,
      validUntil: d.petDocument.validUntil ? d.petDocument.validUntil.slice(0, 10) : "",
      comments: d.comments ?? "",
    }))
  )

  // Estado por fila para el botón "Ver": "loading" mientras pide la URL, "error" si falla.
  const [viewState, setViewState] = useState<Record<number, "loading" | "error" | undefined>>({})

  // Documento pendiente de confirmar aprobación/rechazo en el modal.
  const [confirmDoc, setConfirmDoc] = useState<{ row: DocRowState; action: "APPROVED" | "REJECTED" } | null>(null)

  // Documento cuyos comentarios se están editando en el modal.
  const [editComments, setEditComments] = useState<{ row: DocRowState } | null>(null)

  const approveMutation = useMutation({
    mutationFn: (petDocumentId: string) => approveBookingDocument({ bookingId, petDocumentId }, apiFetch),
  })

  const rejectMutation = useMutation({
    mutationFn: (petDocumentId: string) => rejectBookingDocument({ bookingId, petDocumentId }, apiFetch),
  })

  const validUntilMutation = useMutation({
    mutationFn: (vars: { petDocumentId: string; validUntil: string }) =>
      setBookingDocumentValidUntil(vars, apiFetch),
  })

  const commentsMutation = useMutation({
    mutationFn: (vars: { petDocumentId: string; comments: string }) =>
      setBookingDocumentComments({ bookingId, ...vars }, apiFetch),
  })

  const closeEditComments = () => {
    setEditComments(null)
    commentsMutation.reset()
  }

  const saveComments = (value: string) => {
    if (!editComments) return
    const { row } = editComments
    commentsMutation.mutate(
      { petDocumentId: row.petDocumentId, comments: value },
      {
        onSuccess: () => {
          setComments(row.id, value)
          queryClient.invalidateQueries({ queryKey: ["booking-documents", bookingId] })
          closeEditComments()
        },
      }
    )
  }

  const closeConfirm = () => {
    setConfirmDoc(null)
    approveMutation.reset()
    rejectMutation.reset()
  }

  // Guarda la fecha "válido hasta" directamente al elegirla (sin modal). Optimista:
  // actualiza la fila al instante y revierte si el guardado falla.
  const [savingDateId, setSavingDateId] = useState<number | null>(null)
  const saveValidUntil = (row: DocRowState, value: string) => {
    if (!value || value === row.validUntil) return
    const prev = row.validUntil
    setValidUntil(row.id, value)
    setSavingDateId(row.id)
    validUntilMutation.mutate(
      { petDocumentId: row.petDocumentId, validUntil: value },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["booking-documents", bookingId] }),
        onError: () => setValidUntil(row.id, prev),
        onSettled: () => setSavingDateId(null),
      }
    )
  }

  const confirmAction = () => {
    if (!confirmDoc) return
    const { row, action } = confirmDoc
    if (action === "APPROVED") {
      approveMutation.mutate(row.petDocumentId, {
        onSuccess: () => {
          setStatus(row.id, "APPROVED")
          queryClient.invalidateQueries({ queryKey: ["booking-documents", bookingId] })
          closeConfirm()
        },
      })
      return
    }
    // Rechazar
    rejectMutation.mutate(row.petDocumentId, {
      onSuccess: () => {
        setStatus(row.id, "REJECTED")
        queryClient.invalidateQueries({ queryKey: ["booking-documents", bookingId] })
        closeConfirm()
      },
    })
  }

  const handleView = async (row: DocRowState) => {
    // Abrimos la pestaña sincrónicamente (evita bloqueo de pop-ups) y luego la
    // redirigimos a la URL presignada una vez resuelta.
    const win = window.open("", "_blank")
    setViewState((prev) => ({ ...prev, [row.id]: "loading" }))
    try {
      const { url } = await getPetDocumentDownloadUrl(pet.petId, row.petDocumentId, apiFetch)
      if (win) win.location.href = url
      else window.open(url, "_blank", "noopener,noreferrer")
      setViewState((prev) => ({ ...prev, [row.id]: undefined }))
    } catch {
      if (win) win.close()
      setViewState((prev) => ({ ...prev, [row.id]: "error" }))
    }
  }

  const pendingCount = docs.filter((d) => d.status === "UPLOADED").length

  const setStatus = (id: number, status: BookingDocumentStatus) =>
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)))
  const setValidUntil = (id: number, validUntil: string) =>
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, validUntil } : d)))
  const setComments = (id: number, comments: string) =>
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, comments } : d)))

  const headerMeta = [
    pet.breed ? humanizeEnum(pet.breed) : null,
    pet.size ? (SIZE_LABEL[pet.size] ?? pet.size) : null,
    pet.gender ? (GENDER_LABEL[pet.gender] ?? pet.gender) : null,
  ].filter(Boolean).join(" · ")

  return (
    <>
    <div className="overflow-hidden rounded-lg border" style={{ borderColor: "#E5E7EB" }}>
      {/* Header mascota (primera fila) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border" style={{ borderColor: "#E5E7EB", backgroundColor: "#FFFFFF" }}>
            <PawPrint size={20} style={{ color: "#1a3a5c" }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: "#0A1830" }}>{pet.petName}</p>
            {headerMeta && (
              <p className="mt-0.5 text-xs font-semibold" style={{ color: "#8A94A6" }}>{headerMeta}</p>
            )}
          </div>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold"
          style={{
            backgroundColor: pendingCount > 0 ? "#FEF3C7" : "#EAF8F3",
            color: pendingCount > 0 ? "#8A6D1C" : "#08785B",
          }}
        >
          {pendingCount} pendiente{pendingCount === 1 ? "" : "s"} de {docs.length}
        </span>
      </div>

      {/* Tabla de documentos */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: 980 }}>
          {/* Header */}
          <div className="flex items-center gap-3 border-b px-4 py-2.5" style={{ borderColor: "#E5E7EB", backgroundColor: "#FBFCFD" }}>
            <div className="flex-1 text-xs font-bold uppercase tracking-wide" style={{ color: "#8A94A6" }}>Documento</div>
            <div className="w-24 text-xs font-bold uppercase tracking-wide" style={{ color: "#8A94A6" }}>Estado</div>
            <div className="w-[300px] text-xs font-bold uppercase tracking-wide" style={{ color: "#8A94A6" }}>Acciones</div>
            <div className="w-40 text-xs font-bold uppercase tracking-wide" style={{ color: "#8A94A6" }}>Válido hasta</div>
            <div className="w-56 text-xs font-bold uppercase tracking-wide" style={{ color: "#8A94A6" }}>Comentarios</div>
          </div>

          {docs.length === 0 && (
            <div className="px-4 py-6 text-center text-sm font-semibold" style={{ color: "#8A94A6" }}>
              Esta mascota no tiene documentos cargados.
            </div>
          )}

          {/* Filas */}
          {docs.map((doc) => {
            const sMeta = DOC_STATUS_META[doc.status]
            const isApproved = doc.status === "APPROVED"
            const isRejected = doc.status === "REJECTED"
            return (
              <div key={doc.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0" style={{ borderColor: "#EEF2F7" }}>
                <div className="flex flex-1 items-center gap-2">
                  <FileText size={16} style={{ color: "#8A94A6" }} />
                  <span className="text-sm font-bold" style={{ color: "#0A1830" }}>{doc.label}</span>
                </div>
                <div className="w-24">
                  <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: sMeta.bg, color: sMeta.color }}>
                    {sMeta.label}
                  </span>
                </div>
                <div className="flex w-[300px] flex-shrink-0 items-center gap-2">
                  {(() => {
                    const vs = viewState[doc.id]
                    const isError = vs === "error"
                    return (
                      <button
                        type="button"
                        title={isError ? "No se pudo abrir el documento. Reintentar" : "Ver documento"}
                        disabled={vs === "loading"}
                        onClick={() => handleView(doc)}
                        className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ borderColor: isError ? "#F5C6C6" : "#E5E7EB", color: isError ? "#9B1C1C" : "#526071" }}
                      >
                        <Eye size={14} /> {vs === "loading" ? "Abriendo…" : isError ? "Reintentar" : "Ver"}
                      </button>
                    )
                  })()}
                  <button
                    type="button"
                    onClick={() => setConfirmDoc({ row: doc, action: "APPROVED" })}
                    className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors hover:bg-[#EAF8F3]"
                    style={{ borderColor: "#B7E4C7", color: "#08785B", backgroundColor: isApproved ? "#EAF8F3" : "#FFFFFF" }}
                  >
                    <CheckCircle2 size={14} /> Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDoc({ row: doc, action: "REJECTED" })}
                    className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-colors hover:bg-[#FDE8E8]"
                    style={{ borderColor: "#F5C6C6", color: "#9B1C1C", backgroundColor: isRejected ? "#FDE8E8" : "#FFFFFF" }}
                  >
                    <XCircle size={14} /> Rechazar
                  </button>
                </div>
                <div className="w-40 flex-shrink-0">
                  {isApproved ? (
                    <input
                      type="date"
                      // No controlado: usar defaultValue + key evita que un re-render
                      // reinyecte el value y Chrome cierre el calendario nativo al navegar
                      // los meses. El key resincroniza cuando cambia el valor del servidor.
                      key={doc.validUntil}
                      defaultValue={doc.validUntil}
                      disabled={savingDateId === doc.id}
                      // Guardar al salir del campo (no en cada onChange), para no disparar
                      // mutaciones/re-renders mientras el calendario está abierto.
                      onBlur={(e) => saveValidUntil(doc, e.target.value)}
                      className="w-full rounded-lg border px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-[#125BD8] disabled:opacity-60"
                      style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                    />
                  ) : (
                    <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>—</span>
                  )}
                </div>
                <div className="flex w-56 flex-shrink-0 items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {doc.comments ? (
                      <p className="text-xs font-semibold leading-snug" style={{ color: "#526071" }} title={doc.comments}>
                        {doc.comments}
                      </p>
                    ) : (
                      <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>—</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditComments({ row: doc })}
                    title="Editar comentarios"
                    aria-label="Editar comentarios"
                    className="flex-shrink-0 rounded p-1 transition-colors hover:bg-gray-100"
                  >
                    <Pencil size={14} style={{ color: "#1a3a5c" }} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>

    {confirmDoc && (
      <DocConfirmModal
        action={confirmDoc.action}
        docLabel={confirmDoc.row.label}
        petName={pet.petName}
        isPending={confirmDoc.action === "APPROVED" ? approveMutation.isPending : rejectMutation.isPending}
        errorMessage={
          confirmDoc.action === "APPROVED"
            ? approveMutation.isError
              ? "No se pudo aprobar el documento. Intenta nuevamente."
              : null
            : rejectMutation.isError
              ? "No se pudo rechazar el documento. Intenta nuevamente."
              : null
        }
        onConfirm={confirmAction}
        onCancel={closeConfirm}
      />
    )}

    {editComments && (
      <DocCommentsModal
        docLabel={editComments.row.label}
        petName={pet.petName}
        currentValue={editComments.row.comments}
        isPending={commentsMutation.isPending}
        errorMessage={commentsMutation.isError ? "No se pudieron guardar los comentarios. Intenta nuevamente." : null}
        onSave={saveComments}
        onCancel={closeEditComments}
      />
    )}
    </>
  )
}

// Carga y renderiza la lista de documentos de un booking (cara trasera de la card).
function BookingDocumentsFace({ bookingId, enabled }: { bookingId: string; enabled: boolean }) {
  const { apiFetch } = useApiClient()
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["booking-documents", bookingId],
    queryFn: () => getBookingDocuments(bookingId, apiFetch),
    enabled,
  })

  if (isLoading) {
    return (
      <div className="rounded-lg border px-4 py-8 text-center text-sm font-bold" style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
        Cargando documentos...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border px-4 py-8 text-center" style={{ borderColor: "#F3D1D1" }}>
        <p className="text-sm font-bold" style={{ color: "#8A1C1C" }}>No pudimos cargar los documentos</p>
        <button type="button" onClick={() => refetch()} className="mt-3 rounded-full px-4 py-2 text-xs font-bold" style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}>
          Reintentar
        </button>
      </div>
    )
  }

  const pets = data ?? []

  if (pets.length === 0) {
    return (
      <div className="rounded-lg border px-4 py-8 text-center text-sm font-semibold" style={{ borderColor: "#E5E7EB", color: "#8A94A6" }}>
        No hay documentos para esta reserva.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {pets.map((pet) => (
        <PetDocumentsSection key={pet.petId} pet={pet} bookingId={bookingId} />
      ))}
    </div>
  )
}

// ─── Booking Card ─────────────────────────────────────────────────────────────

const ACTION_ICON: Record<BookingActionKey, typeof LogIn> = {
  confirm: CheckCircle2,
  checkin: LogIn,
  checkout: LogOut,
  no_show: Ban,
}

const REVIEW_TYPE_LABEL: Record<BookingReviewType, string> = {
  HOUSING: "Alojamiento",
  TRANSPORT: "Transporte",
}

// Nota con que el tutor evaluó la reserva. El pill muestra la nota de alojamiento
// (o la primera disponible) y, al hacer click, un popover con el desglose por sección
// (alojamiento / transporte) y los comentarios de "Lo bueno" y "Lo malo".
function ReviewRatingPopover({ reviews }: { reviews: HotelBooking["reviews"] }) {
  if (reviews.length === 0) return null
  const primary = reviews.find((review) => review.type === "HOUSING") ?? reviews[0]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors hover:bg-[#FFFBEB]"
          style={{ borderColor: "#F1D07A", backgroundColor: "#FFFBEB", color: "#8A6100" }}
          aria-label={`Ver evaluación del tutor: ${primary.stars} de 10`}
        >
          <Star size={13} fill="#F5B000" style={{ color: "#F5B000" }} />
          <span>{primary.stars}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 rounded-xl border p-0 shadow-lg" style={{ borderColor: "#E5E7EB" }}>
        <div className="border-b px-4 py-3" style={{ borderColor: "#F1F5F9" }}>
          <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Evaluación del tutor</p>
        </div>
        <div className="flex flex-col divide-y" style={{ borderColor: "#F1F5F9" }}>
          {reviews.map((review) => (
            <div key={review.type} className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold" style={{ color: "#0A1830" }}>{REVIEW_TYPE_LABEL[review.type]}</p>
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: "#FDECC8", color: "#8A6100" }}>
                  <Star size={12} fill="#F5B000" style={{ color: "#F5B000" }} />
                  {review.stars}
                </span>
              </div>
              {/* El transporte solo trae la nota; los comentarios de "Lo bueno" y
                  "Lo malo" únicamente aplican al alojamiento. */}
              {review.type === "HOUSING" && (
                <div className="mt-2 flex flex-col gap-2">
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#2E7D32" }}>
                      <ThumbsUp size={13} /> Lo bueno
                    </p>
                    <p className="mt-1 text-sm leading-snug" style={{ color: review.goodThings ? "#0A1830" : "#9CA3AF" }}>
                      {review.goodThings || "Sin comentarios."}
                    </p>
                  </div>
                  <div>
                    <p className="flex items-center gap-1.5 text-xs font-bold" style={{ color: "#9B1C1C" }}>
                      <ThumbsDown size={13} /> Lo malo
                    </p>
                    <p className="mt-1 text-sm leading-snug" style={{ color: review.badThings ? "#0A1830" : "#9CA3AF" }}>
                      {review.badThings || "Sin comentarios."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function BookingCard({
  booking,
  onAction,
  actionPending = false,
  actionError = false,
}: {
  booking: HotelBooking
  onAction: (booking: HotelBooking, action: BookingActionKey) => void
  actionPending?: boolean
  actionError?: boolean
}) {
  const meta = statusMeta(booking.status)
  const StatusIcon = meta.icon
  const nights = nightsBetween(booking.checkinDate, booking.checkoutDate)
  const [selectedPet, setSelectedPet] = useState<BookingPet | null>(null)
  // Fallback a [] por si el backend envía un estado que aún no mapeamos: sin acciones,
  // evita el crash de .map sobre undefined (el estado igual se muestra con su label/meta por defecto).
  const actions = STATUS_ACTIONS[booking.status] ?? []

  // Sólo las reservas pagadas pueden voltear a la vista de aprobación de documentos.
  const canApproveDocs = booking.status === "PAID"
  const [flipped, setFlipped] = useState(false)

  // Documentos del booking (comparte caché con la cara trasera). Sirve para saber
  // si ya están todos aprobados y pintar el botón en verde.
  const { apiFetch } = useApiClient()
  const { data: docsData } = useQuery({
    queryKey: ["booking-documents", booking.id],
    queryFn: () => getBookingDocuments(booking.id, apiFetch),
    enabled: canApproveDocs,
  })
  const allDocsApproved = useMemo(() => {
    const allDocs = (docsData ?? []).flatMap((p) => p.documents)
    return allDocs.length > 0 && allDocs.every((d) => d.status === "APPROVED")
  }, [docsData])
  const anyDocRejected = useMemo(
    () => (docsData ?? []).some((p) => p.documents.some((d) => d.status === "REJECTED")),
    [docsData]
  )

  // El flip 3D apila ambas caras; medimos la cara activa para que la card
  // tome la altura correcta (el reverso es más alto que el frente).
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const [faceHeight, setFaceHeight] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    if (!canApproveDocs) return
    const measure = () => {
      const el = flipped ? backRef.current : frontRef.current
      if (el) setFaceHeight(el.offsetHeight)
    }
    measure()
    // Observa ambas caras: la altura del reverso cambia al cargar los documentos.
    const ro = new ResizeObserver(measure)
    if (frontRef.current) ro.observe(frontRef.current)
    if (backRef.current) ro.observe(backRef.current)
    return () => ro.disconnect()
  }, [flipped, canApproveDocs])

  // Botones de acción de la reserva (confirmar / check-in / etc.), reutilizados
  // en el pie de ambas caras.
  const actionButtonsRow = actions.map((action) => {
    const ActionIcon = ACTION_ICON[action.key]
    const isDanger = action.variant === "danger"
    const isConfirm = action.key === "confirm"
    const isYellow = action.key === "confirm" || action.key === "checkin"
    return (
      <button
        key={action.key}
        type="button"
        disabled={actionPending}
        onClick={() => onAction(booking, action.key)}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: isDanger ? "#FDE8E8" : isYellow ? "#FFC43D" : "#0D2B45",
          color: isDanger ? "#9B1C1C" : isYellow ? "#0D2B45" : "#FFFFFF",
          border: isDanger ? "1px solid #F5C6C6" : "none",
        }}
      >
        <ActionIcon size={14} />
        {actionPending && isConfirm ? "Confirmando..." : action.label}
      </button>
    )
  })

  // Pie de card (contacto + acciones). `showApprove` añade el botón que voltea
  // hacia la vista de aprobación de documentos.
  const renderBottomBar = ({ showApprove }: { showApprove: boolean }) => (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t pt-4" style={{ borderColor: "#EEF2F7" }}>
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-xs font-semibold" style={{ color: "#8A94A6" }}>Contacto:</span>
        <span className="text-xs font-bold" style={{ color: "#526071" }}>{booking.customer.email}</span>
        {booking.customer.phone && (
          <span className="text-xs font-bold" style={{ color: "#526071" }}>{booking.customer.phone}</span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {booking.reviews.length > 0 && <ReviewRatingPopover reviews={booking.reviews} />}

        {(actions.length > 0 || showApprove) && (
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {showApprove && (
              anyDocRejected ? (
                <button
                  type="button"
                  onClick={() => setFlipped(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#FDE8E8", borderColor: "#F5C6C6", color: "#9B1C1C" }}
                >
                  <XCircle size={14} /> Documentos con rechazos
                </button>
              ) : allDocsApproved ? (
                <button
                  type="button"
                  onClick={() => setFlipped(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#EAF8F3", borderColor: "#B7E4C7", color: "#08785B" }}
                >
                  <CheckCircle2 size={14} /> Documentos aprobados
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setFlipped(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-colors hover:bg-gray-50"
                  style={{ borderColor: "#D8DEE7", backgroundColor: "#FFFFFF", color: "#0D2B45" }}
                >
                  <FileText size={14} /> Aprobar documentos
                </button>
              )
            )}
            {actionButtonsRow}
          </div>
          {actionError && (
            <span className="text-xs font-semibold" style={{ color: "#9B1C1C" }}>
              No se pudo completar la acción. Intenta nuevamente.
            </span>
          )}
        </div>
        )}
      </div>
    </div>
  )

  // Grilla de información de la reserva (cara frontal).
  const infoGrid = (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
      <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "#8A94A6" }}>
          <CalendarDays size={13} />
          Fechas
        </p>
        <p className="text-sm font-bold" style={{ color: "#0A1830" }}>
          {formatDate(booking.checkinDate)} – {formatDate(booking.checkoutDate)}
        </p>
        <p className="mt-1 text-xs font-semibold" style={{ color: "#667085" }}>
          {nights} noche{nights === 1 ? "" : "s"}
        </p>
      </div>

      <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "#8A94A6" }}>
          <CreditCard size={13} />
          Precios
        </p>
        <p className="text-sm font-bold" style={{ color: "#0A1830" }}>
          {formatClp(booking.pricing.paidPrice)} pagado
        </p>
        <p className="mt-1 text-xs font-semibold" style={{ color: "#667085" }}>
          Total {formatClp(booking.pricing.totalPrice)}
        </p>
      </div>

      <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] mb-2" style={{ color: "#8A94A6" }}>
          <Car size={13} />
          Transporte
        </p>
        {booking.transport.included ? (
          <>
            <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Incluido</p>
            {booking.transport.pickupCommune && (
              <p className="mt-1 text-xs font-semibold" style={{ color: "#526071" }}>
                Recogida: {booking.transport.pickupCommune}
              </p>
            )}
            {booking.transport.departure && (
              <p className="mt-0.5 text-xs font-semibold" style={{ color: "#526071" }}>
                Ida: {formatDate(booking.transport.departure.date)} · {SLOT_LABEL[booking.transport.departure.slot]}
              </p>
            )}
            {booking.transport.return && (
              <p className="mt-0.5 text-xs font-semibold" style={{ color: "#526071" }}>
                Vuelta: {formatDate(booking.transport.return.date)} · {SLOT_LABEL[booking.transport.return.slot]}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm font-bold" style={{ color: "#8A94A6" }}>No incluido</p>
        )}
      </div>

      {/* Mascotas */}
      <div className="rounded-lg border p-4" style={{ borderColor: "#E5E7EB" }}>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] mb-3" style={{ color: "#8A94A6" }}>
          <PawPrint size={13} />
          Mascotas
        </p>
        <div className="space-y-2.5">
          {booking.pets.map((pet) => (
            <div key={pet.id} className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold" style={{ color: "#0A1830" }}>{pet.name}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: "#526071" }}>
                  {[
                    pet.size ? SIZE_LABEL[pet.size] : null,
                    pet.gender ? GENDER_LABEL[pet.gender] : null,
                    pet.birthDate ? calcAge(pet.birthDate) : null,
                  ].filter(Boolean).join(" · ") || "—"}
                </p>
                {(pet.breedName ?? pet.breedId) && (
                  <p className="text-xs mt-0.5" style={{ color: "#8A94A6" }}>
                    {pet.breedName ?? `Raza ID ${pet.breedId}`}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedPet(pet)}
                className="flex-shrink-0 p-1 rounded hover:bg-gray-100 transition-colors"
                title="Ver ficha completa"
                aria-label={`Ver ficha de ${pet.name}`}
              >
                <Info size={16} style={{ color: "#1a3a5c" }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Cabecera común: estado + cliente + mascotas + id (idéntica en ambas caras).
  const topRow = (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold"
          style={{ backgroundColor: meta.bg, color: meta.color }}
        >
          <StatusIcon size={13} />
          {getBookingStatusLabel(booking.status)}
        </span>
        <div className="flex items-center gap-1.5">
          <User size={15} style={{ color: "#8A94A6" }} />
          <span className="text-sm font-bold" style={{ color: "#0A1830" }}>
            {customerFullName(booking.customer)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <PawPrint size={14} style={{ color: "#2E7D32" }} />
          <span className="text-sm font-medium" style={{ color: "#526071" }}>
            {petNames(booking.pets)}
          </span>
        </div>
      </div>
      <span
        className="rounded border px-2 py-0.5 font-mono text-xs font-bold"
        style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC", color: "#8A94A6" }}
      >
        #{booking.number}
      </span>
    </div>
  )

  return (
    <article
      className="overflow-hidden rounded-lg border bg-white shadow-sm"
      style={{ borderColor: "#E5E7EB" }}
    >
      <div className="p-5 sm:p-6">
        {topRow}

        {canApproveDocs ? (
          <div
            style={{ perspective: "2500px", overflow: "hidden", height: faceHeight, transition: "height 0.6s ease" }}
          >
            <div
              style={{
                display: "grid",
                alignItems: "start",
                transformStyle: "preserve-3d",
                transition: "transform 0.6s ease",
                transform: flipped ? "rotateX(180deg)" : "rotateX(0deg)",
              }}
            >
              {/* Cara frontal: vista reserva */}
              <div
                ref={frontRef}
                aria-hidden={flipped}
                style={{ gridArea: "1 / 1 / 2 / 2", alignSelf: "start", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                {infoGrid}
                {renderBottomBar({ showApprove: true })}
              </div>

              {/* Cara trasera: vista aprobación de documentos */}
              <div
                ref={backRef}
                aria-hidden={!flipped}
                style={{ gridArea: "1 / 1 / 2 / 2", alignSelf: "start", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateX(180deg)" }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <FileText size={18} style={{ color: "#0A1830" }} className="mt-0.5" />
                    <div>
                      <p className="text-base font-bold" style={{ color: "#0A1830" }}>
                        Documentos pendientes por aprobar
                      </p>
                      <p className="mt-0.5 text-sm font-medium" style={{ color: "#526071" }}>
                        Revisa y aprueba los documentos de {petNames(booking.pets)} antes de confirmar la reserva.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFlipped(false)}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-bold transition-colors hover:bg-gray-50"
                    style={{ borderColor: "#D8DEE7", backgroundColor: "#FFFFFF", color: "#0D2B45" }}
                  >
                    <ArrowLeft size={14} /> Volver a vista reserva
                  </button>
                </div>

                <div className="mt-4">
                  <BookingDocumentsFace bookingId={booking.id} enabled={flipped} />
                </div>

                {renderBottomBar({ showApprove: false })}
              </div>
            </div>
          </div>
        ) : (
          <>
            {infoGrid}
            {renderBottomBar({ showApprove: false })}
          </>
        )}
      </div>

      {selectedPet && <PetModal pet={selectedPet} onClose={() => setSelectedPet(null)} />}
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ hotelId: string }>
}

function HotelBookingsContent({ hotelId }: { hotelId: string }) {
  const { apiFetch } = useApiClient()
  const queryClient = useQueryClient()
  const [group, setGroup] = useState<BookingGroup>("VIGENTES")

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hotel-bookings", hotelId],
    queryFn: () => getHotelBookings(hotelId, apiFetch),
    enabled: !!hotelId,
  })

  const invalidateBookings = () => queryClient.invalidateQueries({ queryKey: ["hotel-bookings", hotelId] })

  const confirmMutation = useMutation({
    mutationFn: (bookingId: string) => confirmHotelBooking(bookingId, apiFetch),
    onSuccess: invalidateBookings,
  })

  const checkInMutation = useMutation({
    mutationFn: (bookingId: string) => checkInHotelBooking(bookingId, apiFetch),
    onSuccess: invalidateBookings,
  })

  const checkOutMutation = useMutation({
    mutationFn: (bookingId: string) => checkOutHotelBooking(bookingId, apiFetch),
    onSuccess: invalidateBookings,
  })

  const noShowMutation = useMutation({
    mutationFn: (bookingId: string) => markNoShowHotelBooking(bookingId, apiFetch),
    onSuccess: invalidateBookings,
  })

  const bookings = data?.bookings ?? []

  const filteredBookings = useMemo(
    () => bookings.filter((b) => bookingGroup(b.status) === group),
    [bookings, group]
  )

  const counts = useMemo(() => {
    const c: Record<BookingGroup, number> = { VIGENTES: 0, COMPLETADAS: 0, OTRAS: 0 }
    for (const b of bookings) c[bookingGroup(b.status)]++
    return c
  }, [bookings])

  // Acción pendiente de confirmación en el modal
  const [pendingConfirm, setPendingConfirm] = useState<{ booking: HotelBooking; action: BookingActionKey } | null>(null)

  // Click en el botón de la tarjeta → abre el modal de confirmación
  const requestAction = (booking: HotelBooking, action: BookingActionKey) => {
    setPendingConfirm({ booking, action })
  }

  // Confirmar en el modal → ejecuta la acción real
  const executeAction = () => {
    if (!pendingConfirm) return
    const { booking, action } = pendingConfirm
    const closeOnSuccess = { onSuccess: () => setPendingConfirm(null) }
    if (action === "confirm") {
      confirmMutation.mutate(booking.id, closeOnSuccess)
      return
    }
    if (action === "checkin") {
      checkInMutation.mutate(booking.id, closeOnSuccess)
      return
    }
    if (action === "checkout") {
      checkOutMutation.mutate(booking.id, closeOnSuccess)
      return
    }
    if (action === "no_show") {
      noShowMutation.mutate(booking.id, closeOnSuccess)
      return
    }
  }

  const mutations = [confirmMutation, checkInMutation, checkOutMutation, noShowMutation]
  const actionPendingId = mutations.find((m) => m.isPending)?.variables ?? null
  const actionErroredId = mutations.find((m) => m.isError)?.variables ?? null
  const isActionRunning = mutations.some((m) => m.isPending)

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1100px]">

        {/* Header */}
        <div className="grid gap-5 border-b pb-6 lg:grid-cols-[1fr_320px] lg:items-end" style={{ borderColor: "#E5E7EB" }}>
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em]"
              style={{ borderColor: "#E5E7EB", color: "#2E7D32" }}>
              <PawPrint size={15} />
              Panel Manager
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "#0A1830" }}>
              Reservas
            </h1>
            <p className="mt-3 max-w-[620px] text-base font-medium leading-7" style={{ color: "#526071" }}>
              Gestiona las reservas vigentes, completadas y otras de tu hotel.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border bg-white p-2" style={{ borderColor: "#E5E7EB" }}>
            <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
              <p className="text-2xl font-bold" style={{ color: "#08785B" }}>{counts.VIGENTES}</p>
              <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Vigentes</p>
            </div>
            <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
              <p className="text-2xl font-bold" style={{ color: "#0D2B45" }}>{counts.COMPLETADAS}</p>
              <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Completadas</p>
            </div>
            <div className="rounded-md p-3 text-center" style={{ backgroundColor: "#F8FAFC" }}>
              <p className="text-2xl font-bold" style={{ color: "#8A94A6" }}>{counts.OTRAS}</p>
              <p className="mt-1 text-xs font-bold" style={{ color: "#526071" }}>Otras</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap gap-2">
          {([
            { value: "VIGENTES", label: "Vigentes" },
            { value: "COMPLETADAS", label: "Completadas" },
            { value: "OTRAS", label: "Otras" },
          ] as const).map((item) => {
            const active = group === item.value
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setGroup(item.value)}
                className="min-h-10 rounded-full border px-4 text-sm font-bold transition-colors"
                style={{
                  backgroundColor: active ? "#0D2B45" : "#F8FAFC",
                  borderColor: active ? "#0D2B45" : "#E5E7EB",
                  color: active ? "#FFFFFF" : "#526071",
                }}
              >
                {item.label} ({counts[item.value]})
              </button>
            )
          })}
        </div>

        {/* List */}
        <div className="mt-5 grid gap-5">
          {isLoading && (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm" style={{ borderColor: "#E5E7EB" }}>
              <p className="text-sm font-bold" style={{ color: "#0A1830" }}>Cargando reservas...</p>
            </div>
          )}

          {isError && (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm" style={{ borderColor: "#F3D1D1" }}>
              <p className="text-sm font-bold" style={{ color: "#8A1C1C" }}>No pudimos cargar las reservas</p>
              <p className="mt-2 text-sm font-medium" style={{ color: "#667085" }}>Intenta nuevamente en unos segundos.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-5 min-h-10 rounded-full px-5 text-sm font-bold"
                style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
              >
                Reintentar
              </button>
            </div>
          )}

          {!isLoading && !isError && filteredBookings.length === 0 && (
            <div className="rounded-lg border bg-white p-8 text-center shadow-sm" style={{ borderColor: "#E5E7EB" }}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border" style={{ borderColor: "#E5E7EB", color: "#8A94A6" }}>
                <CalendarDays size={28} />
              </div>
              <p className="mt-4 text-sm font-bold" style={{ color: "#0A1830" }}>No hay reservas para mostrar</p>
              <p className="mt-2 text-sm font-medium" style={{ color: "#667085" }}>
                Cuando tengas reservas, aparecerán aquí.
              </p>
            </div>
          )}

          {!isLoading && !isError && filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onAction={requestAction}
              actionPending={actionPendingId === booking.id}
              actionError={actionErroredId === booking.id}
            />
          ))}
        </div>
      </div>

      {pendingConfirm && (
        <ConfirmActionModal
          action={pendingConfirm.action}
          booking={pendingConfirm.booking}
          isPending={isActionRunning}
          onConfirm={executeAction}
          onCancel={() => setPendingConfirm(null)}
        />
      )}
    </section>
  )
}

export default function HotelBookingsPage({ params }: PageProps) {
  const { hotelId } = use(params)
  return (
    <ManagerLayout hotelId={hotelId}>
      <HotelBookingsContent hotelId={hotelId} />
    </ManagerLayout>
  )
}
