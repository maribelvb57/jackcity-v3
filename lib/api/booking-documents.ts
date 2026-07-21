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
