import type { ApiFetch } from "@/lib/api/types"

// ⚠ Al momento de escribir esto NO existe contrato en jackcity-api/contracts
// para estos endpoints (initiate / confirm). Los nombres de campos del request
// siguen el brief entregado por Maribel. Como la respuesta de initiate tampoco
// está contratada, leemos variantes camelCase / snake_case de forma defensiva.
//
// Flujo de subida de documentos de mascota a Cloudflare R2:
//   1. initiate  → el backend valida y crea el registro, devuelve URL temporal.
//   2. PUT a R2  → el frontend sube el archivo directamente a R2.
//   3. confirm   → el backend verifica y actualiza el estado del documento.

export type InitiateBookingDocumentParams = {
  petId: string
  bookingId: string
  documentType: string
  filename: string
  contentType: string
  fileSizeBytes: number
  // Opcionales: por ahora no se envían (la UI del paso 3 no los captura).
  validUntil?: string
  fileText?: string
}

export type InitiateBookingDocumentResult = {
  documentId: string
  uploadUrl: string
  raw: unknown
}

// La respuesta no tiene contrato: probamos varias claves posibles.
function pick(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj?.[key]
    if (typeof value === "string" && value) return value
  }
  return undefined
}

export async function initiateBookingDocument(
  params: InitiateBookingDocumentParams,
  apiFetch: ApiFetch,
): Promise<InitiateBookingDocumentResult> {
  const res = await apiFetch<Record<string, unknown>>("/api/booking-documents/initiate", {
    method: "POST",
    body: JSON.stringify(params),
  })
  const uploadUrl = pick(res, "upload_url", "uploadUrl", "url")
  const documentId = pick(res, "document_id", "documentId", "id")
  if (!uploadUrl) throw new Error("initiate no devolvió una URL de subida.")
  if (!documentId) throw new Error("initiate no devolvió un id de documento.")
  return { documentId, uploadUrl, raw: res }
}

// PUT directo a Cloudflare R2 con la URL temporal (no pasa por el backend).
export async function uploadFileToR2(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  })
  if (!res.ok) throw new Error(`Subida a R2 falló: ${res.status}`)
}

export async function confirmBookingDocument(documentId: string, apiFetch: ApiFetch): Promise<void> {
  await apiFetch("/api/booking-documents/confirm", {
    method: "POST",
    body: JSON.stringify({ documentId }),
  })
}

// Elimina un documento ya subido (para reemplazarlo por otro).
export async function deleteBookingDocument(documentId: string, apiFetch: ApiFetch): Promise<void> {
  await apiFetch(`/api/booking-documents/${documentId}`, { method: "DELETE" })
}

// ─── Aprobación de documentos (vista del hotel) ──────────────────────────────
// GET /api/booking-documents/by-booking/{bookingId} (spec entregada por Maribel).

// Estado de revisión del documento dentro del booking.
export type BookingDocumentStatus = "UPLOADED" | "APPROVED" | "REJECTED"

// Archivo subido asociado a la mascota.
export interface PetDocumentFile {
  id: string
  petId: string
  documentType: string
  filename: string
  contentType: string
  fileSizeBytes: number
  status: string
  validUntil: string | null
  createdAt: string
  updatedAt: string
}

export interface BookingDocument {
  id: number
  bookingId: string
  status: BookingDocumentStatus
  comments: string
  fileText: string
  petDocument: PetDocumentFile
}

export interface BookingDocumentsPet {
  petId: string
  petName: string
  breed: string | null
  size: string | null
  gender: string | null
  documents: BookingDocument[]
}

export type BookingDocumentsResponse = BookingDocumentsPet[]

// Lista las mascotas de un booking con sus documentos y estado de aprobación.
export async function getBookingDocuments(
  bookingId: string,
  apiFetch: ApiFetch,
): Promise<BookingDocumentsResponse> {
  return apiFetch<BookingDocumentsResponse>(`/api/booking-documents/by-booking/${bookingId}`)
}

// URL temporal (presignada en R2) para visualizar/descargar un documento.
export interface PetDocumentDownloadUrl {
  url: string
  expiresAt: string
}

// GET /api/pets/{petId}/documents/{documentId}/download-url — `documentId` es el
// id del petDocument (UUID), no el id numérico del bookingDocument.
export async function getPetDocumentDownloadUrl(
  petId: string,
  documentId: string,
  apiFetch: ApiFetch,
): Promise<PetDocumentDownloadUrl> {
  return apiFetch<PetDocumentDownloadUrl>(`/api/pets/${petId}/documents/${documentId}/download-url`)
}

// POST /api/booking-documents/approve — aprueba un documento de la reserva.
export interface ApproveBookingDocumentParams {
  bookingId: string
  petDocumentId: string
}

export async function approveBookingDocument(
  params: ApproveBookingDocumentParams,
  apiFetch: ApiFetch,
): Promise<void> {
  await apiFetch("/api/booking-documents/approve", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

// POST /api/booking-documents/reject — rechaza un documento de la reserva.
// Mismo body que approve: { bookingId, petDocumentId }.
export async function rejectBookingDocument(
  params: ApproveBookingDocumentParams,
  apiFetch: ApiFetch,
): Promise<void> {
  await apiFetch("/api/booking-documents/reject", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

// POST /api/booking-documents/valid-until — actualiza la fecha de validez.
export interface SetValidUntilParams {
  petDocumentId: string
  validUntil: string
}

export async function setBookingDocumentValidUntil(
  params: SetValidUntilParams,
  apiFetch: ApiFetch,
): Promise<void> {
  await apiFetch("/api/booking-documents/valid-until", {
    method: "POST",
    body: JSON.stringify(params),
  })
}

// POST /api/booking-documents/comments — actualiza los comentarios del documento.
export interface SetCommentsParams {
  bookingId: string
  petDocumentId: string
  comments: string
}

export async function setBookingDocumentComments(
  params: SetCommentsParams,
  apiFetch: ApiFetch,
): Promise<void> {
  await apiFetch("/api/booking-documents/comments", {
    method: "POST",
    body: JSON.stringify(params),
  })
}
