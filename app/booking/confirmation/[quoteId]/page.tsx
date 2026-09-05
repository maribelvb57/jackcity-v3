"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { SiteNavbar } from "@/components/site-navbar"
import { SearchSummaryBar } from "@/components/search-summary-bar"
import { AddPetModal } from "@/components/add-pet-modal"
import { MarkdownText } from "@/components/markdown-text"
import { getQuote, type Quote } from "@/lib/api/quotes"
import { validateEmail, getMyProfile, type CustomerProfile } from "@/lib/api/customers"
import { saveBookingUser, saveBookingPets, gotoPay, getBookingRequests, addBookingService, removeBookingService, getBookingCart, type BookingRequest, type BookingRequestPet, type BookingCart } from "@/lib/api/bookings"
import { initiateBookingDocument, uploadFileToR2, confirmBookingDocument, deleteBookingDocument } from "@/lib/api/booking-documents"
import { BookingExpiredError, createWebpayPayment } from "@/lib/api/payments"
import { redirectToWebpay } from "@/lib/webpay"
import { useApiClient } from "@/hooks/use-api-client"
import { PET_SIZE_LABEL, type PetSize, CANCELLATION_POLICY_FLEXIBLE } from "@/lib/api/hotels"
import { getBreedByCode, resolveBreedCode } from "@/lib/dog-breeds"
import { slotTime, sortSlots } from "@/lib/transport-slots"
import { getCommuneNameByCode } from "@/config/communes"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import {
  User,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  PawPrint,
  Minus,
  Plus,
  Check,
  UploadCloud,
  Camera,
  Info,
  CheckCircle2,
  Dog,
  CalendarDays,
  Car,
  House,
  CreditCard,
  Building2,
  ShieldCheck,
  LockKeyhole,
  Loader2,
  Trash2,
  HeartPulse,
  X,
} from "lucide-react"
import { formatClp } from "@/lib/format"
import { useClerk, useUser } from "@clerk/nextjs"

const COUNTRY_CODES = [
  { code: "+56", country: "CL" },
  { code: "+54", country: "AR" },
  { code: "+51", country: "PE" },
  { code: "+57", country: "CO" },
  { code: "+52", country: "MX" },
]

const PET_COLORS = ["Negro", "Blanco", "Marrón", "Dorado", "Gris", "Manchado", "Otro"]
const PAY_NOW_PERCENTAGE = 0.3
const GENDER_MAP: Record<string, string> = { Macho: "MALE", Hembra: "FEMALE" }

interface PetData {
  petId: string | null
  name: string
  breed: string
  size: string
  gender: string
  weight: string
  color: string
  age: number
}

interface PetFormProps {
  pet: PetData
  index: number
  pets: PetData[]
  updatePet: (index: number, field: keyof PetData, value: string | number) => void
  incrementAge: (index: number) => void
  decrementAge: (index: number) => void
  // Se enciende recién al intentar continuar, igual que en el paso 1: no marcamos
  // en rojo un formulario que el usuario todavía no terminó de llenar.
  showErrors?: boolean
}

function PetForm({ pet, index, pets, updatePet, incrementAge, decrementAge, showErrors = false }: PetFormProps) {
  const showNameError = showErrors && pet.name.trim().length === 0
  const showGenderError = showErrors && pet.gender.length === 0
  return (
    <div className="flex flex-col gap-3">
      {pets.filter(p => !p.petId).length > 1 && (
        <p className="text-xs font-semibold" style={{ color: "#6B7280" }}>Mascota {index + 1}</p>
      )}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Nombre</label>
          <input type="text" value={pet.name} onChange={(e) => updatePet(index, "name", e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
            style={{ borderColor: showNameError ? "#DC2626" : "#E5E7EB", color: "#0A1830" }} placeholder="Nombre mascota" />
          {showNameError && (
            <p className="mt-1.5 text-xs" style={{ color: "#DC2626" }}>Debes ingresar el nombre de tu mascota para continuar.</p>
          )}
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Raza</label>
          <input type="text" value={getBreedByCode(pet.breed)?.label ?? pet.breed} readOnly
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#0A1830" }} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Tamaño</label>
          <input type="text" value={pet.size} readOnly
            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
            style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#0A1830" }} />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Género</label>
          <div className="px-4 py-2.5 rounded-xl border flex items-center gap-4" style={{ borderColor: showGenderError ? "#DC2626" : "#E5E7EB" }}>
            {["Macho", "Hembra"].map((g) => (
              <label key={g} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name={`gender-${index}`} value={g}
                  checked={pet.gender === g} onChange={(e) => updatePet(index, "gender", e.target.value)}
                  className="w-4 h-4 cursor-pointer accent-[#0A1830]" />
                <span className="text-sm" style={{ color: "#0A1830" }}>{g}</span>
              </label>
            ))}
          </div>
          {showGenderError && (
            <p className="mt-1.5 text-xs" style={{ color: "#DC2626" }}>Debes seleccionar el género de tu mascota para continuar.</p>
          )}
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
            Peso <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
          </label>
          <div className="relative">
            <input type="text" inputMode="decimal" value={pet.weight}
              onChange={(e) => updatePet(index, "weight", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 pr-12"
              style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="0" />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#9CA3AF" }}>kg</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
            Color <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
          </label>
          <div className="relative">
            <select value={pet.color} onChange={(e) => updatePet(index, "color", e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 appearance-none cursor-pointer"
              style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
              <option value="">Seleccionar color</option>
              {PET_COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
            Edad <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
          </label>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => decrementAge(index)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:bg-gray-50"
              style={{ borderColor: "#E5E7EB" }}>
              <Minus size={16} style={{ color: "#0A1830" }} />
            </button>
            <div className="flex-1 h-10 flex items-center justify-center rounded-xl border text-sm font-semibold"
              style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
              {pet.age === 0 ? "—" : `${pet.age} año${pet.age !== 1 ? "s" : ""}`}
            </div>
            <button type="button" onClick={() => incrementAge(index)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:bg-gray-50"
              style={{ borderColor: "#E5E7EB" }}>
              <Plus size={16} style={{ color: "#0A1830" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function cleanRut(value: string) {
  return value.replace(/[^0-9kK]/g, "").toUpperCase()
}

function isValidChileRut(value: string) {
  const cleanedRut = cleanRut(value)
  if (cleanedRut.length < 2) return false
  const body = cleanedRut.slice(0, -1)
  const verifier = cleanedRut.slice(-1)
  if (!/^\d+$/.test(body)) return false
  let sum = 0
  let multiplier = 2
  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  const remainder = 11 - (sum % 11)
  const expectedVerifier = remainder === 11 ? "0" : remainder === 10 ? "K" : String(remainder)
  return verifier === expectedVerifier
}

function formatChileRut(value: string) {
  const cleanedRut = cleanRut(value)
  if (cleanedRut.length < 2) return value
  const body = cleanedRut.slice(0, -1)
  const verifier = cleanedRut.slice(-1)
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${verifier}`
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

// "Formatos permitidos: JPG, PNG o PDF. Máx. 10 MB" a partir de fileTypes + maxFileSize.
function buildFileHint(fileTypes: string[] | null, maxFileSize: number | null) {
  const parts: string[] = []
  if (fileTypes && fileTypes.length > 0) {
    const formats = fileTypes.length === 1
      ? fileTypes[0]
      : `${fileTypes.slice(0, -1).join(", ")} o ${fileTypes[fileTypes.length - 1]}`
    parts.push(`Formatos permitidos: ${formats}.`)
  }
  if (maxFileSize) parts.push(`Máx. ${maxFileSize} MB`)
  return parts.join(" ")
}

// ISO date → "3 de Julio de 2027" (mes capitalizado).
function formatValidUntil(iso: string) {
  const date = new Date(`${iso}T12:00:00`)
  const day = format(date, "d", { locale: es })
  const month = format(date, "MMMM", { locale: es })
  const year = format(date, "yyyy")
  return `${day} de ${month.charAt(0).toUpperCase()}${month.slice(1)} de ${year}`
}

// ─── Servicio relacionado (getrequests → serviceToOffer) ─────────────────
// Cuando la mascota no cumple un requisito (p.ej. le falta una vacuna), el hotel
// puede ofrecer un servicio para resolverlo al llegar. El backend lo entrega en
// request.serviceToOffer; acá lo mapeamos al view-model del enlace + el modal.
type RelatedService = {
  // Texto del enlace en la fila del requisito.
  linkLabel: string
  // Contenido del modal.
  heading: string
  descriptionLines: string[]
  icon: string | null
  focusMessage: boolean
  focusIcon: string | null
  focusText: string | null
  // Datos crudos para POST /booking/addService al confirmar.
  serviceId: number
  serviceName: string
  price: number
}

// Número entero con separador de miles ("18.000"), sin símbolo (el template ya trae "$").
function formatThousands(value: number) {
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

// serviceToOffer → view-model. Reemplaza %PET% (nombre mascota) y %PRICE% (precio).
function resolveServiceToOffer(request: BookingRequest, petName: string): RelatedService | null {
  const offer = request.serviceToOffer
  if (!offer) return null
  const s = offer.service
  const description = s.description
    .replace(/%PRICE%/g, formatThousands(offer.price))
    .replace(/%PET%/g, petName)
  return {
    linkLabel: s.offerText.replace(/%PET%/g, petName),
    heading: s.title.replace(/%PET%/g, petName),
    descriptionLines: description.split("\n").map((l) => l.trim()).filter(Boolean),
    icon: s.icon,
    focusMessage: s.focusMessage,
    focusIcon: s.focusIcon,
    focusText: s.focusText,
    serviceId: offer.serviceId,
    serviceName: s.name,
    price: offer.price,
  }
}

// Los iconos del servicio llegan como clase lucide ("lucide-heart-pulse" o
// "lucide lucide-shield-check"). Resolvemos el nombre kebab a su componente lucide,
// con un fallback cuando el nombre no está en el registro.
const LUCIDE_ICONS: Record<string, typeof HeartPulse> = {
  "heart-pulse": HeartPulse,
  "shield-check": ShieldCheck,
}

function lucideKey(raw: string | null | undefined) {
  if (!raw) return null
  const token = raw.trim().split(/\s+/).pop() ?? ""
  return token.replace(/^lucide-/, "") || null
}

function ServiceIcon({ raw, fallback: Fallback, size, style }: {
  raw: string | null | undefined
  fallback: typeof HeartPulse
  size: number
  style?: React.CSSProperties
}) {
  const key = lucideKey(raw)
  const Icon = (key && LUCIDE_ICONS[key]) || Fallback
  return <Icon size={size} style={style} />
}

// Número de sección: círculo azul (sección activa) o gris (secciones siguientes)
function SectionNumber({ n, active = false }: { n: number; active?: boolean }) {
  return (
    <span
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-base font-bold leading-none"
      style={
        active
          ? { backgroundColor: "#125BD8", color: "#ffffff" }
          : { backgroundColor: "#E2E8F0", color: "#64748B" }
      }
    >
      <span style={{ position: "relative", top: "2px" }}>{n}</span>
    </span>
  )
}

// Cabecera de sección colapsada. Completada (check verde, clickeable) o pendiente (gris).
function CollapsedSection({ n, title, subtitle, completed = false, onClick }: { n: number; title: string; subtitle: string; completed?: boolean; onClick?: () => void }) {
  const clickable = !!onClick
  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl px-5 py-4 border transition-colors hover:bg-gray-50 disabled:hover:bg-white disabled:cursor-default"
      style={{ borderColor: completed ? "#BBF7D0" : "#E5E7EB" }}
    >
      <div className="flex items-center gap-3">
        {completed ? (
          <span
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "#16A34A", color: "#ffffff" }}
          >
            <Check size={18} strokeWidth={3} />
          </span>
        ) : (
          <SectionNumber n={n} />
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold leading-tight" style={{ color: completed ? "#0A1830" : "#94A3B8" }}>{title}</h2>
          <p className="text-sm" style={{ color: completed ? "#16A34A" : "#94A3B8" }}>
            {completed ? "Completado" : subtitle}
          </p>
        </div>
        <ChevronDown size={20} style={{ color: completed ? "#16A34A" : "#94A3B8" }} />
      </div>
    </button>
  )
}

// ─── Requisitos del hotel (sección 3) ────────────────────────────────────
// Checkbox que se pone amarillo al activarse
function YellowCheckbox({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onChange}
      disabled={disabled}
      className="w-6 h-6 rounded-none border-2 flex items-center justify-center flex-shrink-0 transition-colors disabled:cursor-default"
      style={{ borderColor: checked ? "#FFC43D" : "#D1D5DB", backgroundColor: checked ? "#FFC43D" : "transparent" }}
    >
      {checked && <Check size={16} style={{ color: "#0A1830" }} strokeWidth={3} />}
    </button>
  )
}

// Estado de subida de un documento a R2 (por requisito/mascota).
type DocUploadStatus = "idle" | "uploading" | "done" | "error" | "deleting"

// Caja de subida de archivo. Al elegir un archivo dispara la subida real a R2
// (initiate → PUT → confirm) vía el handler del padre; refleja el estado en vivo.
// Una vez subido (o borrándose), muestra el documento con un botón de eliminar
// en lugar del selector de archivo: para subir otro hay que borrar el actual.
function UploadBox({
  id, title, optional = false, hint, uploadedName, status, error, onFile, onDelete, icon,
}: {
  id: string
  title: string
  optional?: boolean
  hint: string
  uploadedName: string | null
  status: DocUploadStatus
  error?: string | null
  onFile: (file: File | null) => void
  onDelete: () => void
  icon: React.ReactNode
}) {
  const isUploading = status === "uploading"
  const isDeleting = status === "deleting"

  // Documento subido: tarjeta con el archivo y el botón de eliminar (sin selector).
  if (status === "done" || isDeleting) {
    return (
      <div
        className="relative flex items-center gap-4 px-5 py-4 rounded-xl border border-dashed"
        style={{ borderColor: "#86EFAC" }}
      >
        <span className="flex-shrink-0" style={{ color: "#16A34A" }}>
          {isDeleting ? <Loader2 size={30} className="animate-spin" /> : <CheckCircle2 size={30} />}
        </span>
        <div className="min-w-0 pr-6">
          <p className="text-sm font-bold" style={{ color: "#125BD8" }}>
            {title}
            {optional && <span className="font-normal" style={{ color: "#6B7280" }}> (opcional)</span>}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: isDeleting ? "#6B7280" : "#16A34A" }}>
            {isDeleting ? "Eliminando…" : (uploadedName ?? "Documento subido")}
          </p>
          {status === "done" && error && (
            <p className="text-xs mt-0.5" style={{ color: "#DC2626" }}>{error}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label="Eliminar documento"
          className="absolute top-2 right-2 p-1 rounded-md transition-colors hover:bg-gray-100 disabled:cursor-default"
          style={{ color: "#9CA3AF" }}
        >
          <Trash2 size={16} />
        </button>
      </div>
    )
  }

  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-4 px-5 py-4 rounded-xl border border-dashed transition-colors ${
        isUploading ? "cursor-wait opacity-80" : "cursor-pointer hover:bg-gray-50"
      }`}
      style={{ borderColor: status === "error" ? "#FCA5A5" : "#CBD5E1" }}
    >
      <span className="flex-shrink-0" style={{ color: "#64748B" }}>
        {isUploading ? <Loader2 size={30} className="animate-spin" /> : icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold" style={{ color: "#125BD8" }}>
          {title}
          {optional && <span className="font-normal" style={{ color: "#6B7280" }}> (opcional)</span>}
        </p>
        {isUploading ? (
          <p className="text-xs mt-0.5 truncate" style={{ color: "#6B7280" }}>
            Subiendo {uploadedName ?? "archivo"}…
          </p>
        ) : status === "error" ? (
          <p className="text-xs mt-0.5" style={{ color: "#DC2626" }}>
            {error ?? "No se pudo subir el archivo."} Toca para reintentar.
          </p>
        ) : (
          <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>{hint}</p>
        )}
      </div>
      <input
        id={id}
        type="file"
        className="hidden"
        disabled={isUploading}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </label>
  )
}

// Fila de un requisito: checkbox + texto a la izquierda, acción de archivo a la derecha.
// Layout de 2 columnas. La 2ª columna (right) puede, a su vez, dividirse internamente
// (p.ej. Carnet de Vacunas + enlace de servicio); eso lo arma quien pasa `right`.
function RequirementRow({
  checked, onToggle, title, description, descriptionMark = false, right, first = false, checkboxDisabled = false,
}: {
  checked: boolean
  onToggle: () => void
  title: React.ReactNode
  description?: string
  // El backend puede mandar la descripción en Markdown (links normales y `modal-img:`).
  descriptionMark?: boolean
  right: React.ReactNode
  first?: boolean
  // Para requisitos con archivo el check lo controla la subida, no el usuario.
  checkboxDisabled?: boolean
}) {
  return (
    <div
      className="flex flex-col gap-4 py-5 md:flex-row md:items-start"
      style={first ? undefined : { borderTop: "1px solid #F1F5F9" }}
    >
      <div className="flex items-start gap-3 md:flex-1">
        <YellowCheckbox checked={checked} onChange={onToggle} disabled={checkboxDisabled} />
        <div className="min-w-0">
          <p className="text-base font-bold" style={{ color: "#0A1830" }}>{title}</p>
          {description && (
            descriptionMark ? (
              <MarkdownText
                text={description}
                className="text-sm mt-1 leading-snug text-[#6B7280]"
              />
            ) : (
              <p className="text-sm mt-1 leading-snug" style={{ color: "#6B7280" }}>{description}</p>
            )
          )}
        </div>
      </div>
      {/* Sin contenido a la derecha (p.ej. requisito sin archivo): no renderizamos la
          2ª columna para que el texto ocupe el ancho completo. */}
      {right != null && <div className="md:flex-1">{right}</div>}
    </div>
  )
}

// Modal que ofrece el servicio relacionado (mockup imagen 2). Aparece al hacer click
// en el enlace "¿%PET% no cuenta con esta vacuna?".
function ServiceModal({
  service, onClose, onConfirm, isSubmitting = false, error = false,
}: {
  service: RelatedService
  onClose: () => void
  onConfirm: () => void
  isSubmitting?: boolean
  error?: boolean
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10, 24, 48, 0.45)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white px-6 py-7 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 rounded-md p-1 transition-colors hover:bg-gray-100"
          style={{ color: "#9CA3AF" }}
        >
          <X size={20} />
        </button>

        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#EAF2FF" }}>
          <ServiceIcon raw={service.icon} fallback={HeartPulse} size={30} style={{ color: "#125BD8" }} />
        </div>

        <h3 className="text-2xl font-extrabold" style={{ color: "#0A1830" }}>
          {service.heading}
        </h3>

        {service.descriptionLines.map((line, i) => (
          <p
            key={i}
            className={`mx-auto mt-3 max-w-xs text-sm leading-snug ${i === service.descriptionLines.length - 1 ? "font-semibold" : ""}`}
            style={{ color: i === service.descriptionLines.length - 1 ? "#0A1830" : "#475569" }}
          >
            {line}
          </p>
        ))}

        {service.focusMessage && service.focusText && (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: "#EEF3FB" }}>
            <ServiceIcon raw={service.focusIcon} fallback={ShieldCheck} size={18} style={{ color: "#125BD8" }} />
            <span className="text-sm font-medium" style={{ color: "#475569" }}>{service.focusText}</span>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm font-medium" style={{ color: "#DC2626" }}>
            No pudimos agregar el servicio. Intenta nuevamente.
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: "#CBD5E1", color: "#125BD8" }}
          >
            No, gracias
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundColor: "#125BD8", color: "#ffffff" }}
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {isSubmitting ? "Agregando…" : "Sí, agregar servicio"}
          </button>
        </div>
      </div>
    </div>
  )
}

// Tamaños ["SMALL","MEDIUM"] → "Pequeño y Mediano" (unión con "y" al final).
function petSizesText(sizes: string[]) {
  const labels = sizes.map((s) => PET_SIZE_LABEL[s as PetSize] ?? s)
  return labels.length <= 1 ? labels.join("") : `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`
}

// Maqueta compartida del sidebar "Resumen Reserva" (versión carrito). La usan tanto
// el resumen basado en la quote (antes del bookingId) como el del cart (después).
function SummaryCard({ headerLines, lines, total, payNow, hasTransport }: {
  headerLines: string[]
  lines: { label: string; price: number }[]
  total: number
  payNow: number
  // Con transporte (monto != 0), el "pagar ahora" no es un 30% simple → tooltip explicativo.
  hasTransport: boolean
}) {
  return (
    <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
      <h3 className="font-bold text-sm mb-2" style={{ color: "#0A1830" }}>Resumen Reserva</h3>
      <div className="flex flex-col gap-0.5 text-xs mb-3" style={{ color: "#555" }}>
        {headerLines.map((line, i) => <p key={i}>{line}</p>)}
      </div>

      <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: "#F1F5F9" }}>
        {lines.map((line, i) => (
          <div key={i} className="flex items-start justify-between gap-3 text-xs">
            <span style={{ color: "#475569" }}>{line.label}</span>
            <span className="flex-shrink-0 font-medium" style={{ color: "#0A1830" }}>{formatClp(line.price)}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3" style={{ borderColor: "#E5E7EB" }}>
        <span className="text-sm font-bold" style={{ color: "#0A1830" }}>Total de tu reserva</span>
        <span className="flex-shrink-0 text-sm font-bold" style={{ color: "#0A1830" }}>{formatClp(total)}</span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 rounded-xl pl-3 pr-0 py-2.5" style={{ backgroundColor: "#FFFBF0" }}>
        <span className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#0A1830" }}>
          A pagar ahora{hasTransport ? "" : " 30%"}
          {hasTransport && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" aria-label="Cómo se calcula el pago ahora" className="inline-flex">
                  <Info size={13} style={{ color: "#94A3B8" }} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[220px] border border-[#E5E7EB] bg-white text-center text-[#0A1830] shadow-md [&>svg]:bg-white [&>svg]:fill-white">
                30% del valor de tu alojamiento y servicios más el total del valor del transporte
              </TooltipContent>
            </Tooltip>
          )}
        </span>
        <span className="flex-shrink-0 text-sm font-bold" style={{ color: "#B77900" }}>{formatClp(payNow)}</span>
      </div>
    </div>
  )
}

// Resumen basado en la quote (antes de que exista bookingId). Mismo look que el cart.
function QuoteSummary({ quote }: { quote: Quote }) {
  const checkIn = new Date(`${quote.checkinDate}T12:00:00`)
  const checkOut = new Date(`${quote.checkoutDate}T12:00:00`)
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000) || 1
  const petCount = quote.pets.length
  const petCountLabel = `${petCount} ${petCount === 1 ? "mascota" : "mascotas"}`
  const sizesText = petSizesText(quote.pets.map((p) => p.size))

  const lines: { label: string; price: number }[] = [
    { label: `${nights} ${nights === 1 ? "noche" : "noches"} alojamiento`, price: quote.pricing.bookingPrice },
    ...(quote.needsTransport
      ? [{
          label: `Transporte Ida y regreso a ${getCommuneNameByCode(quote.transportCommune) ?? quote.transportCommune ?? ""}`,
          price: quote.pricing.transportPrice,
        }]
      : []),
  ]

  return (
    <SummaryCard
      headerLines={[
        `${petCountLabel}${sizesText ? `, ${sizesText}` : ""}`,
        `Fechas: ${format(checkIn, "d MMM", { locale: es })} - ${format(checkOut, "d MMM", { locale: es })}`,
      ]}
      lines={lines}
      total={quote.pricing.totalPrice}
      payNow={quote.pricing.payNowAmount}
      hasTransport={quote.needsTransport && quote.pricing.transportPrice !== 0}
    />
  )
}

// Sidebar "Resumen Reserva" en versión carrito (una vez que existe bookingId).
// Los montos finales vienen del backend (totalBookingAmount / payNowAmount).
function CartSummary({ cart }: { cart: BookingCart }) {
  const petCountLabel = `${cart.petCount} ${cart.petCount === 1 ? "mascota" : "mascotas"}`
  const sizesText = petSizesText(cart.petSizes)
  const checkIn = new Date(`${cart.checkIn}T12:00:00`)
  const checkOut = new Date(`${cart.checkOut}T12:00:00`)

  // Líneas del carrito: alojamiento + servicios agregados + (transporte si aplica).
  const lines: { label: string; price: number }[] = [
    {
      label: `${cart.items.housing.nightsCount} ${cart.items.housing.nightsCount === 1 ? "noche" : "noches"} alojamiento`,
      price: cart.items.housing.price,
    },
    ...cart.items.services.map((s) => ({ label: s.name, price: s.price })),
    ...(cart.items.transport
      ? [{
          label: `Transporte Ida y regreso a ${getCommuneNameByCode(cart.items.transport.communeCode) ?? cart.items.transport.communeCode}`,
          price: cart.items.transport.price,
        }]
      : []),
  ]

  return (
    <SummaryCard
      headerLines={[
        `${petCountLabel}${sizesText ? `, ${sizesText}` : ""}`,
        `Fechas: ${format(checkIn, "d MMM", { locale: es })} - ${format(checkOut, "d MMM", { locale: es })}`,
      ]}
      lines={lines}
      total={cart.totalBookingAmount}
      payNow={cart.payNowAmount}
      hasTransport={(cart.items.transport?.price ?? 0) !== 0}
    />
  )
}

function ConfirmationContent() {
  const router = useRouter()
  const { quoteId } = useParams<{ quoteId: string }>()
  const { openSignIn } = useClerk()
  const { user: clerkUser, isSignedIn, isLoaded } = useUser()
  const { apiFetch } = useApiClient()

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ["quote", quoteId],
    queryFn: () => getQuote(quoteId, apiFetch),
    enabled: !!quoteId,
  })

  // ─── Sección 1: Mis Datos ──────────────────────────────────────────────
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [emailAccountExists, setEmailAccountExists] = useState(false)
  const [isValidatingEmail, setIsValidatingEmail] = useState(false)
  const [rut, setRut] = useState("")
  const [countryCode, setCountryCode] = useState("+56")
  const [phone, setPhone] = useState("")
  const [saveData, setSaveData] = useState(false)

  // ─── Navegación por pasos (acordeón) ───────────────────────────────────
  // Si la reserva incluye transporte se intercala un paso extra (selección de
  // horarios) entre "Requisitos" y "Confirmar y pagar" → 5 pasos en vez de 4.
  const includeTransport = quote?.needsTransport ?? false
  // Si el transporte lo realiza JackCity, el texto de la sección es más corto (sin la
  // coordinación de horario del hotel). Por defecto (HOTEL / sin dato) va el texto largo.
  const transportByJackCity = quote?.transportBy === "JACKCITY"
  const transportSubtitle = transportByJackCity
    ? "Selecciona tu tramo horario de preferencia para el transporte de tu mascota."
    : "Selecciona tu tramo horario de preferencia para el transporte de tu mascota. El hotel hará todo lo posible por recogerlo en ese horario pero si no es posible coordinará contigo un nuevo horario con la debida anticipación."
  const TOTAL_STEPS = includeTransport ? 5 : 4
  const TRANSPORT_STEP = 4
  const PAY_STEP = includeTransport ? 5 : 4
  const [currentStep, setCurrentStep] = useState(1)
  const progressPct = Math.round((currentStep / TOTAL_STEPS) * 100)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const [isSavingStep1, setIsSavingStep1] = useState(false)
  const [step1Error, setStep1Error] = useState(false)
  // userId devuelto por saveuser; se usará para encadenar los siguientes pasos (mascotas, etc.)
  const [savedUserId, setSavedUserId] = useState<string | null>(null)
  // bookingId devuelto por saveuser; requerido para el paso 2 (savepets) y posteriores.
  const [savedBookingId, setSavedBookingId] = useState<string | null>(null)

  // ─── Carrito (sidebar "Resumen Reserva") ───────────────────────────────
  // Se carga aparte, en paralelo, solo una vez que existe bookingId (post /saveuser).
  // Mientras no haya bookingId, el sidebar muestra el resumen basado en la quote.
  const queryClient = useQueryClient()
  const { data: cart } = useQuery({
    queryKey: ["booking-cart", savedBookingId],
    queryFn: () => getBookingCart(savedBookingId!, apiFetch),
    enabled: !!savedBookingId,
  })

  const [isSavingStep2, setIsSavingStep2] = useState(false)
  const [step2Error, setStep2Error] = useState(false)
  const [showStep2Errors, setShowStep2Errors] = useState(false)
  // ids de las mascotas creadas por savepets; se usarán en los pasos siguientes (requisitos, etc.)
  const [savedPetIds, setSavedPetIds] = useState<string[]>([])

  // ─── Paso Transporte (solo si la reserva incluye transporte) ───────────
  // Slots de ida/regreso seleccionados; no se envían a backend hasta gotopay.
  const [selectedDeparture, setSelectedDeparture] = useState<string | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<string | null>(null)
  const transportSlotsSelected = !!selectedDeparture && !!selectedReturn

  // ─── Sección 2: Mis mascotas ───────────────────────────────────────────
  // Mascotas guardadas del perfil (usuario logueado) + selección para esta reserva.
  const [savedPets, setSavedPets] = useState<CustomerProfile["pets"]>([])
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([])
  const [hasInteractedWithPets, setHasInteractedWithPets] = useState(false)
  const [showAddPetModal, setShowAddPetModal] = useState(false)

  const [pets, setPets] = useState<PetData[]>([])
  const [petsInitialized, setPetsInitialized] = useState(false)
  useEffect(() => {
    if (quote && !petsInitialized) {
      setPets(quote.pets.map((p) => ({
        petId: p.id ?? null,
        name: "",
        breed: p.breed,
        size: PET_SIZE_LABEL[p.size as PetSize] ?? p.size,
        gender: "",
        weight: "",
        color: "",
        age: 0,
      })))
      setPetsInitialized(true)
    }
  }, [quote, petsInitialized])

  const updatePet = (index: number, field: keyof PetData, value: string | number) => {
    if (field === "breed" || field === "size") return
    const newPets = [...pets]
    newPets[index] = { ...newPets[index], [field]: value }
    setPets(newPets)
  }

  const incrementAge = (index: number) => {
    const newPets = [...pets]
    newPets[index].age = Math.min(newPets[index].age + 1, 25)
    setPets(newPets)
  }

  const decrementAge = (index: number) => {
    const newPets = [...pets]
    newPets[index].age = Math.max(newPets[index].age - 1, 0)
    setPets(newPets)
  }

  // Auto-seleccionar mascotas guardadas según los ids que ya trae la quote
  useEffect(() => {
    if (!isSignedIn || savedPets.length === 0 || !quote) return
    const idsFromQuote = quote.pets.map(p => p.id).filter((id): id is string => !!id)
    if (idsFromQuote.length === 0) return
    const validIds = idsFromQuote.filter(id => savedPets.some(p => String(p.id) === String(id)))
    if (validIds.length === 0) return
    setSelectedPetIds(prev => {
      const toAdd = validIds.map(String).filter(id => !prev.includes(id))
      return toAdd.length > 0 ? [...prev, ...toAdd] : prev
    })
  }, [savedPets, quote, isSignedIn])

  // Sincronizar las mascotas guardadas seleccionadas → estado `pets` (payload de savepets)
  useEffect(() => {
    if (!quote || !isSignedIn || savedPets.length === 0) return
    if (selectedPetIds.length === 0) {
      setPets(quote.pets.map((p) => ({
        petId: null, name: "", breed: p.breed,
        size: PET_SIZE_LABEL[p.size as PetSize] ?? p.size,
        gender: "", weight: "", color: "", age: 0,
      })))
      return
    }
    const selected = savedPets.filter(p => selectedPetIds.includes(p.id))
    const remaining = [...selected]
    setPets(quote.pets.map((quotePet) => {
      const idx = remaining.findIndex(p => p.breed === quotePet.breed)
      if (idx >= 0) {
        const sp = remaining.splice(idx, 1)[0]
        return {
          petId: sp.id,
          name: sp.name,
          breed: sp.breed,
          size: PET_SIZE_LABEL[sp.size as PetSize] ?? sp.size,
          gender: sp.gender === "MALE" ? "Macho" : sp.gender === "FEMALE" ? "Hembra" : sp.gender,
          weight: sp.weight?.toString() ?? "",
          color: sp.color ?? "",
          age: sp.age ?? 0,
        }
      }
      return { petId: null, name: "", breed: quotePet.breed, size: PET_SIZE_LABEL[quotePet.size as PetSize] ?? quotePet.size, gender: "", weight: "", color: "", age: 0 }
    }))
  }, [selectedPetIds, savedPets, quote, isSignedIn])

  const togglePetSelection = (petId: string) => {
    setHasInteractedWithPets(true)
    const isSinglePet = (quote?.pets.length ?? 1) === 1
    if (isSinglePet) {
      setSelectedPetIds(prev => prev[0] === petId ? [] : [petId])
    } else {
      const maxPets = quote?.pets.length ?? 0
      setSelectedPetIds(prev => {
        if (prev.includes(petId)) return prev.filter(id => id !== petId)
        if (prev.length >= maxPets) return prev
        return [...prev, petId]
      })
    }
  }

  // Mascota recién creada desde el paso 2: la agregamos a la lista y la auto-seleccionamos.
  const handlePetCreated = (newPet: CustomerProfile["pets"][number]) => {
    setSavedPets(prev => [...prev, { ...newPet, breed: resolveBreedCode(newPet.breed) }])
    setHasInteractedWithPets(true)
    const maxPets = quote?.pets.length ?? 1
    const single = maxPets === 1
    setSelectedPetIds(prev => {
      if (prev.includes(newPet.id)) return prev
      if (single) return [newPet.id]
      if (prev.length >= maxPets) return prev
      return [...prev, newPet.id]
    })
    setShowAddPetModal(false)
  }

  // ─── Sección 3: Requisitos del hotel ───────────────────────────────────
  // Los requisitos se traen del backend (POST getrequests) al entrar al paso 3.
  // El JSON viene por requisito (cada request con su pets[] anidado); acá lo pivoteamos
  // a "por mascota" para pintar la sección agrupada como en el mockup.
  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    isError: isRequestsError,
  } = useQuery({
    queryKey: ["booking-requests", savedBookingId],
    queryFn: () => getBookingRequests({ bookingId: savedBookingId! }, apiFetch),
    enabled: currentStep >= 3 && !!savedBookingId,
  })

  const reqKey = (petId: string, requestId: number) => `${petId}:${requestId}`

  // Estado de los checkboxes por (mascota, requisito).
  const [reqChecks, setReqChecks] = useState<Record<string, boolean>>({})
  // Estado de subida a R2 por (mascota, requisito): status + nombre + id + error.
  type ReqUpload = { status: DocUploadStatus; filename?: string; documentId?: string; error?: string }
  const [reqUploads, setReqUploads] = useState<Record<string, ReqUpload>>({})

  // ─── Servicio relacionado (serviceToOffer) ─────────────────────────────
  // Modal abierto (con el servicio a ofrecer) y servicios ya agregados por
  // (mascota, requisito) → guardamos el bookingServiceId que devuelve addService,
  // necesario para poder quitarlo luego (removeService).
  const [openService, setOpenService] = useState<{ key: string; service: RelatedService } | null>(null)
  const [addedServices, setAddedServices] = useState<Record<string, number>>({})
  const [isAddingService, setIsAddingService] = useState(false)
  const [addServiceError, setAddServiceError] = useState(false)
  // Estado de la remoción por (mascota, requisito): en curso + error.
  const [removingServices, setRemovingServices] = useState<Record<string, boolean>>({})
  const [removeServiceErrors, setRemoveServiceErrors] = useState<Record<string, boolean>>({})

  // Confirma el servicio del modal → POST /bookings/addService. Al éxito guarda el
  // bookingServiceId, marca el requisito como cumplido y cierra; en error lo muestra
  // en el modal para reintentar.
  const handleAddService = async () => {
    if (!openService || !savedBookingId) return
    setIsAddingService(true)
    setAddServiceError(false)
    try {
      const { id: bookingServiceId } = await addBookingService({
        bookingId: savedBookingId,
        serviceId: openService.service.serviceId,
        serviceName: openService.service.serviceName,
        servicePrice: openService.service.price,
      }, apiFetch)
      setAddedServices((prev) => ({ ...prev, [openService.key]: bookingServiceId }))
      // El servicio resuelve el requisito: activamos su checkbox (queda cumplido).
      setReqChecks((prev) => ({ ...prev, [openService.key]: true }))
      setOpenService(null)
      // El servicio recién agregado cambia el carrito → refrescar el resumen.
      queryClient.invalidateQueries({ queryKey: ["booking-cart", savedBookingId] })
    } catch {
      setAddServiceError(true)
    } finally {
      setIsAddingService(false)
    }
  }

  // Quita un servicio agregado → DELETE /bookings/removeService/{bookingServiceId}.
  // Al éxito revierte el requisito (vuelve a exigir documento) y refresca el carrito.
  const handleRemoveService = async (key: string) => {
    const bookingServiceId = addedServices[key]
    if (bookingServiceId == null || !savedBookingId) return
    setRemovingServices((prev) => ({ ...prev, [key]: true }))
    setRemoveServiceErrors((prev) => ({ ...prev, [key]: false }))
    try {
      await removeBookingService(bookingServiceId, apiFetch)
      setAddedServices((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      // Al quitar el servicio, el requisito vuelve a exigir su documento.
      setReqChecks((prev) => ({ ...prev, [key]: false }))
      // Quitar el servicio cambia el carrito → refrescar el resumen.
      queryClient.invalidateQueries({ queryKey: ["booking-cart", savedBookingId] })
    } catch {
      setRemoveServiceErrors((prev) => ({ ...prev, [key]: true }))
    } finally {
      setRemovingServices((prev) => ({ ...prev, [key]: false }))
    }
  }

  // Sube un documento a R2 (initiate → PUT → confirm) apenas el usuario elige el archivo.
  // Al confirmar con éxito, auto-cumple el requisito (marca el check) para habilitar el avance.
  const handleUploadDocument = async (
    key: string,
    petId: string,
    request: BookingRequest,
    file: File | null,
  ) => {
    if (!file) return
    if (!savedBookingId) return
    if (!request.documentType) {
      setReqUploads((prev) => ({ ...prev, [key]: { status: "error", filename: file.name, error: "El requisito no tiene tipo de documento." } }))
      return
    }
    setReqUploads((prev) => ({ ...prev, [key]: { status: "uploading", filename: file.name } }))
    try {
      const { documentId, uploadUrl } = await initiateBookingDocument({
        petId,
        bookingId: savedBookingId,
        documentType: request.documentType,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        fileSizeBytes: file.size,
      }, apiFetch)
      await uploadFileToR2(uploadUrl, file)
      await confirmBookingDocument(documentId, apiFetch)
      setReqUploads((prev) => ({ ...prev, [key]: { status: "done", filename: file.name, documentId } }))
      setReqChecks((prev) => ({ ...prev, [key]: true }))
    } catch (err) {
      setReqUploads((prev) => ({ ...prev, [key]: { status: "error", filename: file.name, error: (err as Error).message } }))
      setReqChecks((prev) => ({ ...prev, [key]: false }))
    }
  }

  // Borra el documento subido de un requisito. Al terminar, vuelve al estado inicial
  // (textos + link para subir) y desmarca el requisito para exigir un nuevo archivo.
  const handleDeleteDocument = async (key: string) => {
    const upload = reqUploads[key]
    if (!upload?.documentId) return
    setReqUploads((prev) => ({ ...prev, [key]: { ...upload, status: "deleting", error: undefined } }))
    try {
      await deleteBookingDocument(upload.documentId, apiFetch)
      setReqUploads((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setReqChecks((prev) => ({ ...prev, [key]: false }))
    } catch (err) {
      // Falló el borrado: el documento sigue existiendo, así que lo dejamos como subido
      // con un mensaje de error para reintentar.
      setReqUploads((prev) => ({ ...prev, [key]: { ...upload, status: "done", error: `No se pudo eliminar: ${(err as Error).message}` } }))
    }
  }

  // Al cargar los requisitos, inicializa los checks: pre-marcado si ya hay documento vigente.
  useEffect(() => {
    if (!requestsData) return
    const init: Record<string, boolean> = {}
    for (const request of requestsData.requests) {
      for (const pet of request.pets ?? []) {
        init[reqKey(pet.petId, request.id)] = !!pet.foundValidFile
      }
    }
    setReqChecks(init)
  }, [requestsData])

  // Pivote request-first → pet-first: una tarjeta por mascota con sus requisitos.
  // El backend solo envía requests activos, así que no filtramos por status.
  const petRequirementGroups = useMemo(() => {
    if (!requestsData) return []
    const groups = new Map<string, { petId: string; petName: string; breed: string; gender: string; items: { request: BookingRequest; pet: BookingRequestPet }[] }>()
    for (const request of requestsData.requests) {
      for (const pet of request.pets ?? []) {
        let group = groups.get(pet.petId)
        if (!group) {
          group = { petId: pet.petId, petName: pet.petName, breed: pet.breed, gender: pet.gender, items: [] }
          groups.set(pet.petId, group)
        }
        group.items.push({ request, pet })
      }
    }
    return Array.from(groups.values())
  }, [requestsData])

  // Todos los checkboxes (de todas las mascotas) deben estar activados para continuar.
  const allRequirementsChecked =
    !!requestsData &&
    petRequirementGroups.every((g) => g.items.every((it) => reqChecks[reqKey(g.petId, it.request.id)]))

  // Hay alguna subida o borrado en curso: bloquea el avance hasta que termine.
  const anyDocumentBusy = Object.values(reqUploads).some((u) => u.status === "uploading" || u.status === "deleting")

  // Se activa al intentar continuar del paso 1: recién ahí se muestran los errores
  // de campos obligatorios (no queremos marcar en rojo un form que el usuario no tocó).
  const [showStep1Errors, setShowStep1Errors] = useState(false)

  // Pre-fill personal data when user logs in
  useEffect(() => {
    if (!isSignedIn || !clerkUser?.id) return
    getMyProfile(apiFetch).then((profile) => {
      const { firstName: fn, lastName: ln, email: em, phone: ph, rut: rt } = profile.user
      if (fn) setFirstName(fn)
      if (ln) setLastName(ln)
      if (em) setEmail(em)
      if (rt) setRut(rt)
      if (ph) {
        const match = COUNTRY_CODES.find((cc) => ph.startsWith(cc.code))
        if (match) {
          setCountryCode(match.code)
          setPhone(ph.slice(match.code.length))
        } else {
          setPhone(ph)
        }
      }
      const activePets = profile.pets.filter(p => p.active)
      if (activePets.length > 0) {
        // Normalizamos el breed a code (algunas mascotas legacy vienen con el nombre)
        setSavedPets(activePets.map(p => ({ ...p, breed: resolveBreedCode(p.breed) })))
      }
    }).catch(() => {
      // si falla no bloqueamos el flujo, el usuario puede llenar manualmente
    })
  }, [isSignedIn, clerkUser?.id])

  // Login a mitad del proceso (invitado → logueado): reiniciamos al paso 1 y limpiamos
  // el estado encadenado del flujo invitado. Así "Mis datos" se re-llena con los datos
  // del usuario logueado y las mascotas se re-arman desde su perfil, re-guardando todo
  // con la identidad correcta (evita arrastrar el userId de invitado).
  const wasGuestRef = useRef(false)
  useEffect(() => {
    if (!isLoaded) return
    if (isSignedIn === false) {
      wasGuestRef.current = true
      return
    }
    if (isSignedIn && wasGuestRef.current) {
      wasGuestRef.current = false
      setCurrentStep(1)
      setSavedUserId(null)
      setSavedBookingId(null)
      setSavedPetIds([])
      setSelectedPetIds([])
      setHasInteractedWithPets(false)
      setStep1Error(false)
      setStep2Error(false)
      setSubmitError(false)
    }
  }, [isLoaded, isSignedIn])

  // Derived values from quote (resumen de la izquierda)
  const checkinDate = quote ? new Date(`${quote.checkinDate}T12:00:00`) : null
  const checkoutDate = quote ? new Date(`${quote.checkoutDate}T12:00:00`) : null
  const nights = checkinDate && checkoutDate
    ? Math.round((checkoutDate.getTime() - checkinDate.getTime()) / 86400000)
    : 1

  const petCount = quote?.pets.length ?? 1
  const petCountLabel = `${petCount} ${petCount === 1 ? "mascota" : "mascotas"}`
  const quotedPetSizesLabel = (quote?.pets ?? [])
    .map((p) => PET_SIZE_LABEL[p.size as PetSize] ?? p.size)
    .filter(Boolean)
    .join(", ")

  // ─── Derivados de mascotas (guardadas / selección) ─────────────────────
  const requiredBreeds = quote?.pets.map(p => p.breed) ?? []
  const savedPetsActive = isSignedIn && savedPets.length > 0
  const isSinglePet = (quote?.pets.length ?? 1) === 1
  const anyPetHasId = (quote?.pets ?? []).some(p => !!p.id)

  // Razas elegibles al agregar una mascota nueva: las de la reserva (deduplicadas por code).
  // Con esto el form muestra raza/tamaño bloqueados o limitados a las de la quote.
  const allowedBreeds = Array.from(
    new Map((quote?.pets ?? []).map(p => [p.breed, { code: p.breed, size: p.size as PetSize }])).values()
  )

  const petSelectionErrorMsg = (() => {
    if (!savedPetsActive || anyPetHasId || !hasInteractedWithPets) return null
    const needed = quote?.pets.length ?? 0
    if (selectedPetIds.length < needed) {
      const missing = needed - selectedPetIds.length
      return `Selecciona ${missing} mascota${missing > 1 ? "s" : ""} más para completar la reserva`
    }
    const reqCount = (quote?.pets ?? []).reduce<Record<string, number>>(
      (a, p) => ({ ...a, [p.breed]: (a[p.breed] ?? 0) + 1 }), {}
    )
    const selPets = savedPets.filter(p => selectedPetIds.includes(p.id))
    const selCount = selPets.reduce<Record<string, number>>(
      (a, p) => ({ ...a, [p.breed]: (a[p.breed] ?? 0) + 1 }), {}
    )
    const matches = JSON.stringify(Object.entries(selCount).sort()) === JSON.stringify(Object.entries(reqCount).sort())
    if (!matches) {
      const needed = Object.entries(reqCount)
        .map(([breed, count]) => `${count} ${getBreedByCode(breed)?.label ?? breed}`)
        .join(", ")
      return `Las mascotas seleccionadas no coinciden con las razas de la reserva (necesitas: ${needed})`
    }
    return null
  })()

  const petsMatchQuote = !savedPetsActive || anyPetHasId || (() => {
    const reqCount = (quote?.pets ?? []).reduce<Record<string, number>>(
      (a, p) => ({ ...a, [p.breed]: (a[p.breed] ?? 0) + 1 }), {}
    )
    const selPets = savedPets.filter(p => selectedPetIds.includes(p.id))
    const selCount = selPets.reduce<Record<string, number>>(
      (a, p) => ({ ...a, [p.breed]: (a[p.breed] ?? 0) + 1 }), {}
    )
    return JSON.stringify(Object.entries(selCount).sort()) === JSON.stringify(Object.entries(reqCount).sort())
  })()

  // Precios (sección 4 — Confirmar y pagar)
  const accommodationPrice = quote?.pricing.bookingPrice ?? 0
  const transportPrice = includeTransport ? (quote?.pricing.transportPrice ?? 0) : 0
  const totalPrice = includeTransport
    ? (quote?.pricing.totalPrice ?? accommodationPrice + transportPrice)
    : accommodationPrice
  const payNowAccommodationPrice = Math.round(accommodationPrice * PAY_NOW_PERCENTAGE)
  const payNowPrice = payNowAccommodationPrice + transportPrice

  // ─── Paso 5 (Confirmar y pagar): datos desde el cart ───────────────────
  // El cart ya existe en este paso (el booking está creado) e incluye los servicios
  // agregados. Si por algún motivo aún no llegó, caemos a los valores de la quote.
  const cartServices = cart?.items.services ?? []
  const hasCartServices = cartServices.length > 0
  const cartServicesSum = cartServices.reduce((acc, s) => acc + s.price, 0)
  const payHousingPrice = cart?.items.housing.price ?? accommodationPrice
  const payTransportPrice = cart?.items.transport?.price ?? transportPrice
  const payHasTransport = cart ? cart.items.transport != null : includeTransport
  const payNights = cart?.items.housing.nightsCount ?? nights
  // Total y pago-ahora los da el backend; el saldo del hotel es la diferencia.
  const payTotalAmount = cart?.totalBookingAmount ?? totalPrice
  const payNowAmount = cart?.payNowAmount ?? payNowPrice
  const payAtHotelAmount = payTotalAmount - payNowAmount
  // Línea "30% del alojamiento (y servicios)" del desglose de pago-ahora. El backend no
  // entrega ese desglose por ítem, así que este monto (solo esta línea) se calcula acá.
  const payNowHousingLine = Math.round((payHousingPrice + cartServicesSum) * PAY_NOW_PERCENTAGE)
  // Encabezado del resumen (mascotas, tamaños, fechas) desde el cart.
  const payPetCountLabel = cart ? `${cart.petCount} ${cart.petCount === 1 ? "mascota" : "mascotas"}` : petCountLabel
  const payPetSizes = cart ? petSizesText(cart.petSizes) : quotedPetSizesLabel
  const payCheckIn = cart ? new Date(`${cart.checkIn}T12:00:00`) : checkinDate
  const payCheckOut = cart ? new Date(`${cart.checkOut}T12:00:00`) : checkoutDate

  // Validación paso 1. Obligatorios: nombre, apellidos, email y teléfono.
  // El RUT es opcional: si viene vacío no bloquea; si viene mal escrito solo avisa.
  const firstNameHasValue = firstName.trim().length > 0
  const lastNameHasValue = lastName.trim().length > 0
  const phoneHasValue = phone.trim().length > 0

  const rutHasValue = cleanRut(rut).length > 0
  const rutIsValid = rutHasValue && isValidChileRut(rut)
  const showRutWarning = rutHasValue && !rutIsValid

  const emailHasValue = email.trim().length > 0
  const emailIsValid = emailHasValue && isValidEmail(email)
  const emailFieldValid = emailIsValid && !emailAccountExists
  const emailErrorMessage = !emailHasValue
    ? "Debes ingresar tu email para continuar."
    : !emailIsValid
      ? "Ingresa un email válido."
      : "Este correo ya tiene cuenta. Inicia sesión o usa otro."

  const showFirstNameError = showStep1Errors && !firstNameHasValue
  const showLastNameError = showStep1Errors && !lastNameHasValue
  const showPhoneError = showStep1Errors && !phoneHasValue
  const showEmailError = showStep1Errors && !emailFieldValid

  const step1Valid = firstNameHasValue && lastNameHasValue && phoneHasValue && emailFieldValid

  // Paso 1 → 2. Guarda los datos del tutor vía POST /api/bookings/confirm/saveuser.
  // Nota: address se omite por ahora (la sección 1 no captura dirección).
  const handleContinueStep1 = async () => {
    if (!quote) return
    // Validación en cliente: si falta un obligatorio no llamamos al backend.
    if (!step1Valid) {
      setShowStep1Errors(true)
      setStep1Error(false)
      return
    }
    setIsSavingStep1(true)
    setStep1Error(false)
    try {
      const { userId, bookingId } = await saveBookingUser({
        quoteId: quote.quoteId,
        user: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: `${countryCode}${phone.trim()}`,
          rut: rut.trim(),
          saveUserData: saveData,
        },
      }, apiFetch)
      setSavedUserId(userId)
      setSavedBookingId(bookingId)
      setCurrentStep(2)
    } catch {
      setStep1Error(true)
    } finally {
      setIsSavingStep1(false)
    }
  }

  // Validación paso 2. Obligatorios: nombre y género de cada mascota nueva —
  // el backend los exige y sin ellos /savepets responde error. Las mascotas ya
  // guardadas (con petId) traen sus datos del perfil, así que no se revisan.
  const step2Valid = pets.every(
    (pet) => pet.petId !== null || (pet.name.trim().length > 0 && pet.gender.length > 0),
  )

  // Paso 2 → 3. Guarda las mascotas vía POST /api/bookings/confirm/savepets.
  // pet.id va en null (usuario no logueado); más adelante, con flujo logueado, se enviará el id real.
  const handleContinueStep2 = async () => {
    if (!quote || !savedBookingId) return
    // Validación en cliente: si falta un obligatorio no llamamos al backend.
    if (!step2Valid) {
      setShowStep2Errors(true)
      setStep2Error(false)
      return
    }
    setIsSavingStep2(true)
    setStep2Error(false)
    try {
      const weightParsed = (weight: string) => {
        const n = parseFloat(weight)
        return isNaN(n) ? undefined : n
      }
      const { petIds } = await saveBookingPets({
        quoteId: quote.quoteId,
        userId: savedUserId,
        bookingId: savedBookingId,
        pets: pets.map((pet, i) => ({
          id: pet.petId ?? null,
          breed: quote.pets[i]?.breed ?? pet.breed,
          size: quote.pets[i]?.size ?? pet.size,
          name: pet.name.trim(),
          gender: GENDER_MAP[pet.gender] ?? pet.gender,
          ...(weightParsed(pet.weight) !== undefined && { weight: weightParsed(pet.weight) }),
          ...(pet.color && { color: pet.color }),
          ...(pet.age > 0 && { age: pet.age }),
        })),
      }, apiFetch)
      setSavedPetIds(petIds)
      setCurrentStep(3)
      // Guardar mascotas puede cambiar el carrito (cantidad/tamaños) → refrescar.
      queryClient.invalidateQueries({ queryKey: ["booking-cart", savedBookingId] })
    } catch {
      setStep2Error(true)
    } finally {
      setIsSavingStep2(false)
    }
  }

  // Paso 3 → 4. Los documentos se suben uno a uno a R2 al elegirlos (ver
  // handleUploadDocument). El botón solo se habilita cuando todos los requisitos
  // están cumplidos (allRequirementsChecked) y no hay subidas en curso.
  const handleContinueStep3 = () => {
    setCurrentStep(4)
  }

  // Paso final — Confirmar y pagar. Crea la reserva vía POST /api/bookings/confirm/gotopay
  // (misma respuesta que el viejo /confirm) y continúa con el pago Webpay.
  // Si la reserva incluye transporte, se envían los slots elegidos en el paso previo.
  const handleConfirmPayment = async () => {
    if (!quote || !savedBookingId) return
    setIsSubmitting(true)
    setSubmitError(false)
    try {
      const { bookingId, voucherToken } = await gotoPay({
        quoteId: quote.quoteId,
        bookingId: savedBookingId,
        ...(includeTransport && selectedDeparture && selectedReturn && {
          transport: { departureSlot: selectedDeparture, returnSlot: selectedReturn },
        }),
      }, apiFetch)
      sessionStorage.setItem("jc_voucher_token", voucherToken)
      const { token, url } = await createWebpayPayment(bookingId)
      redirectToWebpay(url, token)
    } catch (error) {
      if (error instanceof BookingExpiredError) {
        router.push("/booking/confirmation/error?retryable=false&reason=expired")
        return
      }
      setSubmitError(true)
      setIsSubmitting(false)
    }
  }

  const handleEmailBlur = async () => {
    if (!emailIsValid) return
    setIsValidatingEmail(true)
    try {
      const status = await validateEmail(email.trim())
      setEmailAccountExists(status === "ACCOUNT_EXISTS")
    } catch {
      // si falla la validación dejamos pasar, el backend lo rechazará si corresponde
    } finally {
      setIsValidatingEmail(false)
    }
  }

  const summaryData = {
    city: "Santiago",
    dateFrom: checkinDate ? format(checkinDate, "d MMM", { locale: es }) : "—",
    dateTo: checkoutDate ? format(checkoutDate, "d MMM", { locale: es }) : "—",
    petCount,
    withTransport: includeTransport,
  }

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />

        <SearchSummaryBar
          data={summaryData}
          onChangeClick={() => router.push("/")}
        />

        {isLoading && (
          <div className="px-6 py-10 text-sm font-medium" style={{ color: "#0A1830" }}>
            Cargando tu reserva...
          </div>
        )}

        {isError && (
          <div className="px-6 py-10 text-sm font-medium" style={{ color: "#8A1C1C" }}>
            No pudimos cargar los datos de tu reserva. Intenta nuevamente.
          </div>
        )}

        {/* Main content */}
        {quote && (
          <div className="w-full px-4 pb-4 md:px-6 md:pb-6 pt-4">
            <div className="flex flex-col lg:flex-row gap-4">

              {/* Left column — 25% */}
              <div className="flex flex-col gap-4 lg:w-1/4 order-1 lg:order-1">

                {/* Hotel photo + name */}
                <div className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
                  {quote.hotel.mainPhotoUrl ? (
                    <div className="relative aspect-[4/3] w-full">
                      <Image
                        src={quote.hotel.mainPhotoUrl}
                        alt={quote.hotel.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] w-full bg-gray-100" />
                  )}
                  <div className="p-3">
                    <h3 className="font-bold text-sm" style={{ color: "#0A1830" }}>{quote.hotel.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin size={12} style={{ color: "#6B7280" }} />
                      <span className="text-xs" style={{ color: "#6B7280" }}>{quote.hotel.commune}</span>
                    </div>
                  </div>
                </div>

                {/* Reservation summary — carrito (cart) una vez que hay bookingId;
                    mientras tanto, resumen basado en la quote (mismo look). */}
                {cart ? <CartSummary cart={cart} /> : <QuoteSummary quote={quote} />}

                {/* Hotel conditions */}
                {quote.hotel.policies.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                    <h3 className="font-bold text-sm mb-3" style={{ color: "#0A1830" }}>Condiciones del Hotel</h3>
                    <ul className="flex flex-col gap-2">
                      {quote.hotel.policies.map((policy, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs" style={{ color: "#555" }}>
                          <AlertCircle size={14} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                          {policy.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Cancellation policy — el texto depende del enum que entrega /api/quotes */}
                {quote.hotel.cancellationPolicy && (
                  <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                    {quote.hotel.cancellationPolicy === CANCELLATION_POLICY_FLEXIBLE ? (
                      <>
                        <h3 className="flex items-start gap-1.5 font-bold text-sm mb-3" style={{ color: "#0A1830" }}>
                          <ShieldCheck size={15} strokeWidth={2.2} style={{ color: "#15803D", flexShrink: 0, marginTop: 1 }} />
                          Política de Cancelación Flexible
                        </h3>
                        <p className="text-xs leading-relaxed" style={{ color: "#555" }}>
                          Cancelación gratuita hasta dos días antes de tu check-in (Límite 5pm). Después
                          de ese plazo se cobra el 30% de la reserva abonado.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="flex items-start gap-1.5 font-bold text-sm mb-3" style={{ color: "#0A1830" }}>
                          <AlertCircle size={15} strokeWidth={2.2} style={{ color: "#D08706", flexShrink: 0, marginTop: 1 }} />
                          Política de Cancelación por tramos
                        </h3>
                        <p className="text-xs leading-relaxed" style={{ color: "#555" }}>
                          Hasta 7 días antes del check-in: se retiene un 30% del total de la reserva.
                          Entre 7 y 2 días antes del check-in: se retiene un 50%. A menos de 2 días del
                          check-in: la reserva no es reembolsable.
                        </p>
                        <p className="mt-2 text-xs italic leading-relaxed" style={{ color: "#777" }}>
                          Te recomendamos revisar tus fechas con anticipación al momento de reservar.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Right column — 75% */}
              <div className="flex flex-col gap-4 lg:w-3/4 order-2 lg:order-2">

                <h1 className="text-2xl md:text-3xl font-bold mt-6" style={{ color: "#0A1830" }}>
                  Confirmación de Reserva
                </h1>

                {/* Login prompt / greeting + progreso */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {isSignedIn ? (
                    <p className="text-base font-semibold" style={{ color: "#0A1830" }}>
                      ¡Hola, {clerkUser?.firstName ?? firstName}!
                    </p>
                  ) : (
                    <p className="text-sm" style={{ color: "#6B7280" }}>
                      ¿Ya tienes cuenta?{" "}
                      <button
                        type="button"
                        onClick={() => openSignIn()}
                        className="font-semibold transition-opacity hover:opacity-75"
                        style={{ color: "#125BD8" }}
                      >
                        Inicia sesión
                      </button>
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium whitespace-nowrap" style={{ color: "#6B7280" }}>
                      Paso {currentStep} de {TOTAL_STEPS}
                    </span>
                    <div className="h-2 w-32 overflow-hidden rounded-full" style={{ backgroundColor: "#E5E7EB" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: "#125BD8" }} />
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap" style={{ color: "#6B7280" }}>
                      {progressPct}% completado
                    </span>
                  </div>
                </div>

                {/* Sección 1 — Mis Datos */}
                {currentStep === 1 ? (
                <div className="bg-white rounded-2xl p-5 border-2 overflow-hidden" style={{ borderColor: "#125BD8" }}>
                  <div className="mb-4 flex items-center gap-3">
                    <SectionNumber n={1} active />
                    <div>
                      <h2 className="text-lg font-bold leading-tight" style={{ color: "#0A1830" }}>Mis datos personales</h2>
                      <p className="text-sm" style={{ color: "#6B7280" }}>Cuéntanos quién hace la reserva.</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Nombre Tutor</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                            style={{ borderColor: showFirstNameError ? "#DC2626" : "#E5E7EB", color: "#0A1830" }} placeholder="Nombre" />
                        </div>
                        {showFirstNameError && (
                          <p className="mt-1.5 text-xs" style={{ color: "#DC2626" }}>Debes ingresar tu nombre para continuar.</p>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Apellidos</label>
                        <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                          style={{ borderColor: showLastNameError ? "#DC2626" : "#E5E7EB", color: "#0A1830" }} placeholder="Apellidos" />
                        {showLastNameError && (
                          <p className="mt-1.5 text-xs" style={{ color: "#DC2626" }}>Debes ingresar tus apellidos para continuar.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Email</label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                        <input type="email" value={email}
                          onChange={(e) => { setEmail(e.target.value); setEmailAccountExists(false) }}
                          onBlur={handleEmailBlur}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                          style={{ borderColor: showEmailError ? "#DC2626" : (emailHasValue && !emailIsValid) || emailAccountExists ? "#F59E0B" : "#E5E7EB", color: "#0A1830" }}
                          placeholder="correo@ejemplo.com" />
                      </div>
                      {showEmailError ? (
                        <p className="mt-1.5 text-xs" style={{ color: "#DC2626" }}>{emailErrorMessage}</p>
                      ) : emailHasValue && !emailIsValid ? (
                        <p className="mt-1.5 text-xs" style={{ color: "#B45309" }}>Ingresa un email válido.</p>
                      ) : null}
                      {isValidatingEmail && (
                        <p className="mt-1.5 text-xs" style={{ color: "#6B7280" }}>Verificando correo...</p>
                      )}
                      {emailAccountExists && (
                        <div className="mt-2 rounded-xl border px-4 py-3" style={{ backgroundColor: "#FFFBEB", borderColor: "#F59E0B" }}>
                          <p className="text-sm font-semibold" style={{ color: "#92400E" }}>
                            Este correo ya está asociado a una cuenta JackCity.
                          </p>
                          <p className="mt-0.5 text-sm" style={{ color: "#92400E" }}>
                            Para proteger tus reservas, por favor inicia sesión o usa otro correo.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Teléfono</label>
                        <div className="flex gap-2">
                          <div className="relative w-24 flex-shrink-0">
                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                            <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                              className="w-full pl-9 pr-2 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 appearance-none cursor-pointer"
                              style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
                              {COUNTRY_CODES.map((cc) => (
                                <option key={cc.code} value={cc.code}>{cc.code}</option>
                              ))}
                            </select>
                          </div>
                          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                            style={{ borderColor: showPhoneError ? "#DC2626" : "#E5E7EB", color: "#0A1830" }} placeholder="940302010" />
                        </div>
                        {showPhoneError && (
                          <p className="mt-1.5 text-xs" style={{ color: "#DC2626" }}>Debes ingresar tu teléfono para continuar.</p>
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>RUT <span className="font-normal" style={{ color: "#6B7280" }}>(opcional)</span></label>
                        <input type="text" value={rut}
                          onChange={(e) => setRut(e.target.value)}
                          onBlur={() => { if (rutHasValue) setRut(formatChileRut(rut)) }}
                          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                          style={{ borderColor: showRutWarning ? "#F59E0B" : "#E5E7EB", color: "#0A1830" }}
                          placeholder="12.345.678-9" inputMode="text" />
                        {showRutWarning && (
                          <p className="mt-1.5 text-xs" style={{ color: "#B45309" }}>Ingresa un RUT chileno válido.</p>
                        )}
                      </div>
                    </div>

                    {/* Guardar datos */}
                    {!isSignedIn && (
                      <label className="flex items-start gap-3 cursor-pointer px-4 py-3 rounded-xl border"
                        style={{ borderColor: "#F5C518", backgroundColor: "#FFFBEA" }}>
                        <input type="checkbox" checked={saveData} onChange={(e) => setSaveData(e.target.checked)}
                          className="w-4 h-4 mt-0.5 rounded cursor-pointer accent-[#F5C518] flex-shrink-0" />
                        <span>
                          <span className="block text-sm font-semibold" style={{ color: "#0A1830" }}>
                            Guardar mis datos para las próximas reservas en Jack City
                          </span>
                          <span className="block text-xs" style={{ color: "#6B7280" }}>
                            Podrás reservar más rápido la próxima vez.
                          </span>
                        </span>
                      </label>
                    )}

                    <div className="flex flex-col items-end gap-2">
                      {showStep1Errors && !step1Valid && (
                        <p className="text-sm" style={{ color: "#DC2626" }}>
                          Completa los campos obligatorios para continuar.
                        </p>
                      )}
                      {step1Error && (
                        <p className="text-sm" style={{ color: "#DC2626" }}>
                          No pudimos guardar tus datos. Intenta nuevamente.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={handleContinueStep1}
                        disabled={isSavingStep1}
                        className="flex items-center gap-2 rounded-xl px-8 py-2.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50"
                        style={{ backgroundColor: "#125BD8", color: "#ffffff" }}
                      >
                        {isSavingStep1 ? "Guardando..." : "Continuar a Mis Mascotas"}
                        {!isSavingStep1 && <ArrowRight size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
                ) : (
                  <CollapsedSection
                    n={1}
                    title="Mis datos personales"
                    subtitle="Cuéntanos quién hace la reserva."
                    completed={currentStep > 1}
                    onClick={() => setCurrentStep(1)}
                  />
                )}

                {/* Sección 2 — Mis Mascotas */}
                {currentStep === 2 ? (
                  <div className="bg-white rounded-2xl p-5 border-2 overflow-hidden" style={{ borderColor: "#125BD8" }}>
                    <div className="mb-4 flex items-center gap-3">
                      <SectionNumber n={2} active />
                      <div>
                        <h2 className="text-lg font-bold leading-tight flex items-center gap-2" style={{ color: "#0A1830" }}>
                          <PawPrint size={20} style={{ color: "#0A1830" }} />
                          Mis mascotas
                        </h2>
                        <p className="text-sm" style={{ color: "#6B7280" }}>Agrega la información de cada una de tus mascotas.</p>
                      </div>
                    </div>

                    {anyPetHasId ? (
                      // Casos 2 & 4: la quote ya trae mascotas identificadas → tarjetas + form para las no identificadas
                      <>
                        <div className="flex flex-col gap-3">
                          {savedPets.filter(p => selectedPetIds.includes(String(p.id))).map((pet) => (
                            <div key={pet.id} className="flex items-start gap-3 px-4 py-4 rounded-xl border" style={{ borderColor: "#FFC43D", backgroundColor: "#FFFBF0" }}>
                              <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F3F4F6" }}>
                                <PawPrint size={26} style={{ color: "#0A1830" }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-bold mb-2" style={{ color: "#0A1830" }}>{pet.name}</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                                  <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Raza</p><p className="text-sm" style={{ color: "#0A1830" }}>{getBreedByCode(pet.breed)?.label ?? pet.breed}</p></div>
                                  <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Tamaño</p><p className="text-sm" style={{ color: "#0A1830" }}>{PET_SIZE_LABEL[pet.size as PetSize] ?? pet.size}</p></div>
                                  <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Género</p><p className="text-sm" style={{ color: "#0A1830" }}>{pet.gender === "MALE" ? "Macho" : pet.gender === "FEMALE" ? "Hembra" : "—"}</p></div>
                                  <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Peso</p><p className="text-sm" style={{ color: "#0A1830" }}>{pet.weight ? `${pet.weight} kg` : "—"}</p></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {pets.some(p => !p.petId) && (
                          <div className="flex flex-col gap-6 mt-4">
                            {pets.map((pet, index) => !pet.petId ? (
                              <PetForm key={index} pet={pet} index={index} pets={pets} updatePet={updatePet} incrementAge={incrementAge} decrementAge={decrementAge} showErrors={showStep2Errors} />
                            ) : null)}
                          </div>
                        )}
                        <p className="mt-3 text-xs" style={{ color: "#9CA3AF" }}>
                          ¿Quieres cambiar {isSinglePet ? "la mascota" : "las mascotas"}?{" "}
                          <Link href="/" className="underline underline-offset-2 hover:opacity-75">Vuelve al inicio</Link>
                        </p>
                      </>
                    ) : savedPetsActive ? (
                      // Logueado con mascotas guardadas, sin ids → lista de selección (1 o varias mascotas)
                      <>
                        <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
                          Selecciona {quote.pets.length === 1 ? "la mascota" : `las ${quote.pets.length} mascotas`} para esta reserva.
                        </p>
                        <div className="flex flex-col gap-3">
                          {savedPets.filter(p => requiredBreeds.includes(p.breed)).map((pet) => {
                            const isSelected = selectedPetIds.includes(pet.id)
                            const singlePet = quote.pets.length === 1
                            const isAtMax = selectedPetIds.length >= (quote.pets.length)
                            // En single-pet el radio permite cambiar de mascota, así que no deshabilitamos las otras.
                            const isDisabled = !singlePet && !isSelected && isAtMax
                            return (
                              <button key={pet.id} type="button" onClick={() => !isDisabled && togglePetSelection(pet.id)}
                                className="flex items-start gap-3 px-4 py-4 rounded-xl border text-left w-full transition-colors"
                                style={{ borderColor: isSelected ? "#FFC43D" : "#E5E7EB", backgroundColor: isSelected ? "#FFFBF0" : "#fff", opacity: isDisabled ? 0.5 : 1, cursor: isDisabled ? "not-allowed" : "pointer" }}>
                                {singlePet ? (
                                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1" style={{ borderColor: isSelected ? "#FFC43D" : "#D1D5DB" }}>
                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#FFC43D" }} />}
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-1" style={{ borderColor: isSelected ? "#FFC43D" : "#D1D5DB", backgroundColor: isSelected ? "#FFC43D" : "transparent" }}>
                                    {isSelected && <Check size={12} style={{ color: "#0A1830" }} strokeWidth={3} />}
                                  </div>
                                )}
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#F3F4F6" }}>
                                  <PawPrint size={26} style={{ color: "#0A1830" }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-bold mb-2" style={{ color: "#0A1830" }}>{pet.name}</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                                    <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Raza</p><p className="text-sm" style={{ color: "#0A1830" }}>{getBreedByCode(pet.breed)?.label ?? pet.breed}</p></div>
                                    <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Tamaño</p><p className="text-sm" style={{ color: "#0A1830" }}>{PET_SIZE_LABEL[pet.size as PetSize] ?? pet.size}</p></div>
                                    <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Género</p><p className="text-sm" style={{ color: "#0A1830" }}>{pet.gender === "MALE" ? "Macho" : pet.gender === "FEMALE" ? "Hembra" : "—"}</p></div>
                                    <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Peso</p><p className="text-sm" style={{ color: "#0A1830" }}>{pet.weight ? `${pet.weight} kg` : "—"}</p></div>
                                    {(pet.color || pet.age) && (
                                      <>
                                        <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Color</p><p className="text-sm" style={{ color: "#0A1830" }}>{pet.color ?? "—"}</p></div>
                                        <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Edad</p><p className="text-sm" style={{ color: "#0A1830" }}>{pet.age ? `${pet.age} año${pet.age !== 1 ? "s" : ""}` : "—"}</p></div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>

                        {petSelectionErrorMsg && (
                          <div className="mt-2 flex items-start gap-2 rounded-xl border px-4 py-3" style={{ backgroundColor: "#FFFBEB", borderColor: "#F59E0B" }}>
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#B45309" }} />
                            <p className="text-sm" style={{ color: "#92400E" }}>{petSelectionErrorMsg}</p>
                          </div>
                        )}

                        {selectedPetIds.length < quote.pets.length && (
                          <div className="mt-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setShowAddPetModal(true)}
                              className="flex items-center gap-2 rounded-xl border px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-gray-50"
                              style={{ borderColor: "#125BD8", color: "#125BD8" }}
                            >
                              <Plus size={16} />
                              Agregar mascota
                            </button>
                          </div>
                        )}

                        {savedPets.some(p => !requiredBreeds.includes(p.breed)) && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold mb-2" style={{ color: "#9CA3AF" }}>
                              Mascotas con raza no disponible para la reserva que seleccionaste
                            </p>
                            <div className="flex flex-col gap-3">
                              {savedPets.filter(p => !requiredBreeds.includes(p.breed)).map((pet) => (
                                <div key={pet.id} className="flex items-start gap-3 px-4 py-4 rounded-xl border text-left w-full" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB", opacity: 0.6 }}>
                                  <div className="w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1" style={{ borderColor: "#D1D5DB" }} />
                                  <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#EFEFEF" }}>
                                    <PawPrint size={26} style={{ color: "#9CA3AF" }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold mb-2" style={{ color: "#6B7280" }}>{pet.name}</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
                                      <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Raza</p><p className="text-sm" style={{ color: "#6B7280" }}>{getBreedByCode(pet.breed)?.label ?? pet.breed}</p></div>
                                      <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Tamaño</p><p className="text-sm" style={{ color: "#6B7280" }}>{PET_SIZE_LABEL[pet.size as PetSize] ?? pet.size}</p></div>
                                      <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Género</p><p className="text-sm" style={{ color: "#6B7280" }}>{pet.gender === "MALE" ? "Macho" : pet.gender === "FEMALE" ? "Hembra" : "—"}</p></div>
                                      <div><p className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Peso</p><p className="text-sm" style={{ color: "#6B7280" }}>{pet.weight ? `${pet.weight} kg` : "—"}</p></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      // Casos 1, 3, 6: invitado o logueado sin ids → forms
                      <div className="flex flex-col gap-6">
                        {pets.map((pet, index) => (
                          <div key={index}>
                            <PetForm pet={pet} index={index} pets={pets} updatePet={updatePet} incrementAge={incrementAge} decrementAge={decrementAge} showErrors={showStep2Errors} />
                            {index < pets.length - 1 && <hr className="mt-3" style={{ borderColor: "#E5E7EB" }} />}
                          </div>
                        ))}
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>
                          ¿Quieres cambiar {pets.length === 1 ? "la mascota" : "las mascotas"}?{" "}
                          <Link href="/" className="underline underline-offset-2 hover:opacity-75">Vuelve al inicio</Link>
                        </p>
                      </div>
                    )}

                    <div className="mt-5 flex flex-col gap-2">
                      {step2Error && (
                        <p className="text-sm text-right" style={{ color: "#DC2626" }}>
                          No pudimos guardar tus mascotas. Intenta nuevamente.
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-sm font-semibold transition-opacity hover:opacity-75"
                          style={{ color: "#6B7280" }}
                        >
                          ← Volver
                        </button>
                        <button
                          type="button"
                          onClick={handleContinueStep2}
                          disabled={isSavingStep2 || !petsMatchQuote}
                          className="flex items-center gap-2 rounded-xl px-8 py-2.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50"
                          style={{ backgroundColor: "#125BD8", color: "#ffffff" }}
                        >
                          {isSavingStep2 ? "Guardando..." : "Continuar a Requisitos del hotel"}
                          {!isSavingStep2 && <ArrowRight size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <CollapsedSection
                    n={2}
                    title="Mis mascotas"
                    subtitle="Agrega la información de cada una de tus mascotas."
                    completed={currentStep > 2}
                    onClick={currentStep > 2 ? () => setCurrentStep(2) : undefined}
                  />
                )}

                {/* Sección 3 — Requisitos del hotel */}
                {currentStep === 3 ? (
                  <div className="bg-white rounded-2xl p-5 border-2 overflow-hidden" style={{ borderColor: "#125BD8" }}>
                    <div className="mb-4 flex items-center gap-3">
                      <SectionNumber n={3} active />
                      <div>
                        <h2 className="text-lg font-bold leading-tight" style={{ color: "#0A1830" }}>Requisitos del hotel</h2>
                        <p className="text-sm" style={{ color: "#6B7280" }}>Completa los requisitos solicitados por el hotel.</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-5">
                      {isLoadingRequests && (
                        <p className="text-sm font-medium" style={{ color: "#0A1830" }}>Cargando requisitos del hotel...</p>
                      )}
                      {isRequestsError && (
                        <p className="text-sm font-medium" style={{ color: "#8A1C1C" }}>No pudimos cargar los requisitos del hotel. Intenta nuevamente.</p>
                      )}
                      {petRequirementGroups.map((group, groupIndex) => {
                        // Raza (breed-code → nombre con el helper) y género vienen en la respuesta.
                        const genderLabel = group.gender === "MALE" ? "Macho" : group.gender === "FEMALE" ? "Hembra" : group.gender
                        const petDetails = [
                          getBreedByCode(group.breed)?.label ?? group.breed,
                          genderLabel || null,
                        ].filter(Boolean).join(" · ")
                        return (
                          <div key={group.petId} className="rounded-2xl border" style={{ borderColor: "#E5E7EB" }}>
                            {/* Cabecera de la mascota */}
                            <div className="flex items-center justify-between gap-3 p-5 border-b" style={{ borderColor: "#F1F5F9" }}>
                              <div className="flex items-center gap-4 min-w-0">
                                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "#F3F4F6" }}>
                                  <Dog size={28} style={{ color: "#64748B" }} />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xl font-bold truncate" style={{ color: "#0A1830" }}>{group.petName}</p>
                                  {petDetails && <p className="text-sm truncate" style={{ color: "#6B7280" }}>{petDetails}</p>}
                                </div>
                              </div>
                              {petRequirementGroups.length > 1 && (
                                <span className="flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium" style={{ backgroundColor: "#EAF2FF", color: "#125BD8" }}>
                                  <PawPrint size={16} />
                                  Mascota {groupIndex + 1} de {petRequirementGroups.length}
                                </span>
                              )}
                            </div>

                            {/* Requisitos */}
                            <div className="px-5">
                              {group.items.map(({ request, pet }, itemIndex) => {
                                const key = reqKey(group.petId, request.id)
                                // Requisitos que exigen subir un archivo ahora (no resueltos aún):
                                // su check lo controla la subida, no un click manual del usuario.
                                const needsUpload = request.fileRequired && !pet.foundValidFile
                                const upload = reqUploads[key]
                                // Servicio relacionado para esta fila (null si el requisito no lo ofrece).
                                const service = resolveServiceToOffer(request, pet.petName)
                                const serviceAdded = addedServices[key] != null
                                const isRemoving = !!removingServices[key]
                                const removeError = !!removeServiceErrors[key]
                                const uploadBox = (
                                  <UploadBox
                                    id={`req-${group.petId}-${request.id}`}
                                    title={request.fileText ?? "Subir archivo"}
                                    hint={buildFileHint(request.fileTypes, request.maxFileSize)}
                                    uploadedName={upload?.filename ?? null}
                                    status={upload?.status ?? "idle"}
                                    error={upload?.error ?? null}
                                    onFile={(file) => handleUploadDocument(key, group.petId, request, file)}
                                    onDelete={() => handleDeleteDocument(key)}
                                    icon={request.icon === "PHOTO" ? <Camera size={30} /> : <UploadCloud size={30} />}
                                  />
                                )
                                return (
                                  <RequirementRow
                                    key={request.id}
                                    first={itemIndex === 0}
                                    checked={reqChecks[key] ?? false}
                                    checkboxDisabled={needsUpload}
                                    onToggle={() => setReqChecks((prev) => ({ ...prev, [key]: !prev[key] }))}
                                    title={request.title.replace(/%PET%/g, pet.petName)}
                                    description={request.description ?? undefined}
                                    descriptionMark={request.descriptionMark ?? false}
                                    right={
                                      // Layout de 2 columnas. Estados de la 2ª columna:
                                      // (0) servicio agregado → reemplaza la caja de subida;
                                      // (1) no requiere archivo; (2) ya hay uno vigente;
                                      // (3) requiere subirlo + ofrece servicio → 2/3 upload + 1/3 enlace;
                                      // (4) requiere subirlo sin servicio → solo el upload.
                                      serviceAdded ? (
                                        <div>
                                          <div className="flex items-center justify-between gap-2 rounded-xl px-4 py-4" style={{ backgroundColor: "#F0FDF4" }}>
                                            <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: "#16A34A" }}>
                                              <CheckCircle2 size={20} /> Servicio agregado
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveService(key)}
                                              disabled={isRemoving}
                                              aria-label="Quitar servicio"
                                              className="rounded-md p-0.5 transition-colors hover:bg-green-100 disabled:cursor-default disabled:opacity-60"
                                              style={{ color: "#16A34A" }}
                                            >
                                              {isRemoving ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                                            </button>
                                          </div>
                                          {removeError && (
                                            <p className="mt-1 text-xs" style={{ color: "#DC2626" }}>
                                              No se pudo quitar. Intenta nuevamente.
                                            </p>
                                          )}
                                        </div>
                                      ) : !request.fileRequired ? (
                                        // Sin archivo: no mostramos caja; el texto ocupa el ancho completo.
                                        null
                                      ) : pet.foundValidFile ? (
                                        <div className="flex items-center gap-2 px-5 py-4 rounded-xl" style={{ backgroundColor: "#F0FDF4" }}>
                                          <CheckCircle2 size={20} style={{ color: "#16A34A" }} />
                                          <span className="text-sm font-medium" style={{ color: "#16A34A" }}>
                                            {pet.validUntil
                                              ? `Documento disponible y válido hasta ${formatValidUntil(pet.validUntil)}`
                                              : "Documento disponible"}
                                          </span>
                                        </div>
                                      ) : service ? (
                                        // El enlace le "roba" un tercio a la caja del carnet (2/3 + 1/3).
                                        <div className="flex items-stretch gap-3">
                                          <div className="flex-[3] min-w-0">{uploadBox}</div>
                                          <button
                                            type="button"
                                            onClick={() => { setAddServiceError(false); setOpenService({ key, service }) }}
                                            className="flex flex-1 items-center justify-center rounded-lg px-2 py-2 text-xs leading-snug text-center transition-colors hover:opacity-80"
                                            style={{ backgroundColor: "#EEF1F6", color: "#475569" }}
                                          >
                                            {service.linkLabel}
                                          </button>
                                        </div>
                                      ) : (
                                        uploadBox
                                      )
                                    }
                                  />
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Nota importante */}
                    <div className="mt-5 flex items-start gap-3 rounded-xl px-5 py-4" style={{ backgroundColor: "#F8FAFC" }}>
                      <Info size={22} className="flex-shrink-0" style={{ color: "#125BD8" }} />
                      <p className="text-sm leading-snug" style={{ color: "#475569" }}>
                        <span className="font-bold" style={{ color: "#0A1830" }}>Importante:</span> El hotel revisará la información y los documentos enviados. Si algún requisito no se cumple, podrá solicitar antecedentes adicionales o rechazar la estadía según sus políticas.
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-sm font-semibold transition-opacity hover:opacity-75"
                        style={{ color: "#6B7280" }}
                      >
                        ← Volver
                      </button>
                      <button
                        type="button"
                        onClick={handleContinueStep3}
                        disabled={!allRequirementsChecked || anyDocumentBusy}
                        className="flex items-center gap-2 rounded-xl px-8 py-2.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50"
                        style={{ backgroundColor: "#125BD8", color: "#ffffff" }}
                      >
                        {anyDocumentBusy ? "Procesando documentos…" : includeTransport ? "Continuar a Transporte" : "Continuar a Confirmar y pagar"}
                        <ArrowRight size={16} />
                      </button>
                    </div>

                    {/* Modal de servicio relacionado (MOCK) */}
                    {openService && (
                      <ServiceModal
                        service={openService.service}
                        isSubmitting={isAddingService}
                        error={addServiceError}
                        onClose={() => {
                          if (isAddingService) return
                          setAddServiceError(false)
                          setOpenService(null)
                        }}
                        onConfirm={handleAddService}
                      />
                    )}
                  </div>
                ) : (
                  <CollapsedSection
                    n={3}
                    title="Requisitos del hotel"
                    subtitle="Completa los requisitos solicitados por el hotel."
                    completed={currentStep > 3}
                    onClick={currentStep > 3 ? () => setCurrentStep(3) : undefined}
                  />
                )}

                {/* Sección 4 — Transporte (solo si la reserva incluye transporte) */}
                {includeTransport && (
                  currentStep === TRANSPORT_STEP ? (
                    <div className="bg-white rounded-2xl p-5 border-2 overflow-hidden" style={{ borderColor: "#125BD8" }}>
                      <div className="mb-4 flex items-center gap-3">
                        <SectionNumber n={4} active />
                        <div>
                          <h2 className="text-lg font-bold leading-tight flex items-center gap-2" style={{ color: "#0A1830" }}>
                            <Car size={20} style={{ color: "#0A1830" }} />
                            Horarios de transporte
                          </h2>
                          <p className="text-sm" style={{ color: "#6B7280" }}>{transportSubtitle}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold mb-2" style={{ color: "#0A1830" }}>Ida</p>
                          <div className="flex flex-col gap-2">
                            {sortSlots(quote.transport.departureSlots).map((slot) => (
                              <button key={`dep-${slot}`} type="button" onClick={() => setSelectedDeparture(slot)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors"
                                style={{
                                  backgroundColor: selectedDeparture === slot ? "#FEF3C7" : "#fff",
                                  borderColor: selectedDeparture === slot ? "#FFC43D" : "#E5E7EB",
                                  color: "#0A1830",
                                }}>
                                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                                  style={{ borderColor: selectedDeparture === slot ? "#FFC43D" : "#D1D5DB" }}>
                                  {selectedDeparture === slot && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFC43D" }} />}
                                </div>
                                {slotTime(slot)}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold mb-2" style={{ color: "#0A1830" }}>Regreso</p>
                          <div className="flex flex-col gap-2">
                            {sortSlots(quote.transport.returnSlots).map((slot) => (
                              <button key={`ret-${slot}`} type="button" onClick={() => setSelectedReturn(slot)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors"
                                style={{
                                  backgroundColor: selectedReturn === slot ? "#FEF3C7" : "#fff",
                                  borderColor: selectedReturn === slot ? "#FFC43D" : "#E5E7EB",
                                  color: "#0A1830",
                                }}>
                                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                                  style={{ borderColor: selectedReturn === slot ? "#FFC43D" : "#D1D5DB" }}>
                                  {selectedReturn === slot && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFC43D" }} />}
                                </div>
                                {slotTime(slot)}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="text-sm font-semibold transition-opacity hover:opacity-75"
                          style={{ color: "#6B7280" }}
                        >
                          ← Volver
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(PAY_STEP)}
                          disabled={!transportSlotsSelected}
                          className="flex items-center gap-2 rounded-xl px-8 py-2.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:opacity-50"
                          style={{ backgroundColor: "#125BD8", color: "#ffffff" }}
                        >
                          Continuar a Confirmar y pagar
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <CollapsedSection
                      n={4}
                      title="Horarios de transporte"
                      subtitle={transportSubtitle}
                      completed={currentStep > TRANSPORT_STEP}
                      onClick={currentStep > TRANSPORT_STEP ? () => setCurrentStep(TRANSPORT_STEP) : undefined}
                    />
                  )
                )}

                {/* Sección final — Confirmar y pagar */}
                {currentStep === PAY_STEP ? (
                  <div className="bg-white rounded-2xl p-4 border-2 overflow-hidden" style={{ borderColor: "#125BD8" }}>
                    <div className="mb-3 flex items-center gap-3">
                      <SectionNumber n={PAY_STEP} active />
                      <div>
                        <h2 className="text-base font-bold leading-tight" style={{ color: "#0A1830" }}>Confirmar y pagar</h2>
                        <p className="text-xs" style={{ color: "#6B7280" }}>Revisa tu reserva y realiza el pago seguro.</p>
                      </div>
                    </div>

                    {/* Reservation summary + pay */}
                    <div className="rounded-xl border p-3 shadow-sm sm:p-4" style={{ borderColor: "#E5E7EB" }}>
                      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                        <div>
                          <h2 className="text-base font-bold" style={{ color: "#0A1830" }}>
                            Resumen de tu reserva
                          </h2>
                          <div className="mt-3 flex gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#ECE8FF" }}>
                              <PawPrint size={18} fill="#0A1830" style={{ color: "#0A1830" }} />
                            </div>
                            <ul className="flex min-w-0 flex-col gap-1.5 text-sm" style={{ color: "#0A1830" }}>
                              <li>{payPetCountLabel}{payPetSizes ? ` (${payPetSizes})` : ""}</li>
                              <li className="flex items-center gap-2">
                                <CalendarDays size={15} className="flex-shrink-0" style={{ color: "#26364F" }} />
                                <span>
                                  {payNights} {payNights === 1 ? "noche" : "noches"}
                                  {payCheckIn && payCheckOut && (
                                    <> · {format(payCheckIn, "d MMM", { locale: es })} - {format(payCheckOut, "d MMM", { locale: es })}</>
                                  )}
                                </span>
                              </li>
                              {payHasTransport && (
                                <li className="flex items-center gap-2">
                                  <Car size={15} className="flex-shrink-0" style={{ color: "#26364F" }} />
                                  <span>Transporte JackCity (Ida y regreso)</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="rounded-xl border px-4 py-3" style={{ backgroundColor: "#F8FBFF", borderColor: "#BFD7FF" }}>
                          <div className="flex gap-3">
                            <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#2563EB" }}>
                              <Info size={18} style={{ color: "#FFFFFF" }} />
                            </div>
                            <div className="flex flex-col gap-1.5 text-sm leading-snug" style={{ color: "#0A1830" }}>
                              <p>
                                Para confirmar tu reserva debes pagar <span className="font-semibold">ahora</span>{" "}
                                <span className="font-semibold" style={{ color: "#125BD8" }}>
                                  el 30% del alojamiento{hasCartServices ? " y servicios adicionales" : ""}{payHasTransport ? " + el 100% del transporte" : ""}.
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border p-3 sm:p-4" style={{ borderColor: "#E5E7EB" }}>
                        <h3 className="text-base font-bold" style={{ color: "#0A1830" }}>
                          Total de tu reserva
                        </h3>

                        <div className="mt-2.5 flex flex-col gap-1.5 text-sm" style={{ color: "#0A1830" }}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#EAF2FF" }}>
                                <House size={13} style={{ color: "#125BD8" }} />
                              </div>
                              <p className="min-w-0">Alojamiento ({payNights} {payNights === 1 ? "noche" : "noches"})</p>
                            </div>
                            <p className="flex-shrink-0 font-medium">{formatClp(payHousingPrice)}</p>
                          </div>

                          {cartServices.map((service, i) => (
                            <div key={i} className="flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#EAF2FF" }}>
                                  <HeartPulse size={13} style={{ color: "#125BD8" }} />
                                </div>
                                <p className="min-w-0">{service.name}</p>
                              </div>
                              <p className="flex-shrink-0 font-medium">{formatClp(service.price)}</p>
                            </div>
                          ))}

                          {payHasTransport && (
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#DDF5EA" }}>
                                  <Car size={13} style={{ color: "#08785B" }} />
                                </div>
                                <p className="min-w-0">Transporte JackCity (Ida y regreso)</p>
                              </div>
                              <p className="flex-shrink-0 font-medium">{formatClp(payTransportPrice)}</p>
                            </div>
                          )}

                          <div className="mt-1 border-t pt-2.5" style={{ borderColor: "#E5E7EB" }}>
                            <div className="flex items-end justify-between gap-3">
                              <div>
                                <p className="text-base font-semibold" style={{ color: "#0A1830" }}>Total reserva</p>
                                <p className="mt-0.5 text-xs" style={{ color: "#667085" }}>IVA incluido</p>
                              </div>
                              <p className="text-lg font-bold" style={{ color: "#0A1830" }}>{formatClp(payTotalAmount)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border p-3 sm:p-4" style={{ backgroundColor: "#FFFBF0", borderColor: "#FFC43D" }}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#FFE7A3" }}>
                              <CreditCard size={24} style={{ color: "#0A1830" }} />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base font-bold" style={{ color: "#0A1830" }}>Pagar ahora por Webpay</h3>
                              <p className="mt-0.5 text-xs" style={{ color: "#0A1830" }}>
                                30% del alojamiento{hasCartServices ? " y servicios adicionales" : ""}{payHasTransport ? " + 100% del transporte" : ""}
                              </p>
                            </div>
                          </div>
                          <p className="text-lg font-bold sm:text-right" style={{ color: "#B77900" }}>{formatClp(payNowAmount)}</p>
                        </div>

                        <div className="mt-3 border-t pt-3" style={{ borderColor: "#F6CF83", borderStyle: "dashed" }}>
                          <div className="flex flex-col gap-2 text-sm" style={{ color: "#0A1830" }}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: "#2F9E68" }} />
                                <p className="min-w-0">
                                  {hasCartServices
                                    ? "30% del alojamiento y servicios adicionales"
                                    : `30% del alojamiento (${payNights} ${payNights === 1 ? "noche" : "noches"})`}
                                </p>
                              </div>
                              <p className="flex-shrink-0 font-semibold">{formatClp(payNowHousingLine)}</p>
                            </div>
                            {payHasTransport && (
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: "#2F9E68" }} />
                                  <p className="min-w-0">Transporte JackCity (Ida y regreso)</p>
                                </div>
                                <p className="flex-shrink-0 font-semibold">{formatClp(payTransportPrice)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-col gap-3 rounded-xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ backgroundColor: "#EEF8F2" }}>
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#D5F1E2" }}>
                            <Building2 size={20} style={{ color: "#08785B" }} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-base font-bold" style={{ color: "#08785B" }}>Saldo a pagar en el hotel</p>
                            <p className="mt-0.5 text-xs" style={{ color: "#0A1830" }}>70% restante del alojamiento{hasCartServices ? " y servicios adicionales" : ""}</p>
                          </div>
                        </div>
                        <p className="flex-shrink-0 text-lg font-bold sm:text-right" style={{ color: "#08785B" }}>{formatClp(payAtHotelAmount)}</p>
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        {submitError && (
                          <p className="text-center text-xs" style={{ color: "#DC2626" }}>
                            No pudimos procesar el pago. Intenta nuevamente.
                          </p>
                        )}
                        <button
                          onClick={handleConfirmPayment}
                          disabled={isSubmitting}
                          className="w-full rounded-xl px-5 py-2.5 text-base font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90"
                          style={{ backgroundColor: "#FFB200", color: "#0A1830" }}
                        >
                          <span className="flex items-center justify-center gap-2">
                            <LockKeyhole size={18} />
                            {isSubmitting ? "Procesando..." : `Ir a pagar ${formatClp(payNowAmount)}`}
                          </span>
                        </button>
                        <p className="text-center text-xs" style={{ color: "#667085" }}>
                          Al continuar, aceptas los términos y condiciones de JackCity.
                        </p>
                      </div>

                      <div className="mt-3 rounded-xl border p-3" style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB" }}>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#F3F4F6" }}>
                              <ShieldCheck size={20} style={{ color: "#98A2B3" }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold" style={{ color: "#667085" }}>Pago seguro y protegido</p>
                              <p className="mt-0.5 text-xs leading-snug" style={{ color: "#98A2B3" }}>
                                Serás redirigido a Webpay para realizar el pago de forma segura.
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold" style={{ color: "#98A2B3" }}>
                            <span>transbank.</span>
                            <span>VISA</span>
                            <span>Mastercard</span>
                            <span>AMEX</span>
                            <span>Redcompra</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(PAY_STEP - 1)}
                        className="text-sm font-semibold transition-opacity hover:opacity-75"
                        style={{ color: "#6B7280" }}
                      >
                        ← Volver
                      </button>
                    </div>
                  </div>
                ) : (
                  <CollapsedSection
                    n={PAY_STEP}
                    title="Confirmar y pagar"
                    subtitle="Revisa tu reserva y realiza el pago seguro."
                    completed={currentStep > PAY_STEP}
                    onClick={currentStep > PAY_STEP ? () => setCurrentStep(PAY_STEP) : undefined}
                  />
                )}

                <div className="h-96" />
              </div>
            </div>
          </div>
        )}

        {showAddPetModal && (
          <AddPetModal
            apiFetch={apiFetch}
            allowedBreeds={allowedBreeds}
            onSave={handlePetCreated}
            onClose={() => setShowAddPetModal(false)}
          />
        )}
      </div>
    </main>
  )
}

export default function BookingConfirmationPage() {
  return (
    <Suspense>
      <ConfirmationContent />
    </Suspense>
  )
}
