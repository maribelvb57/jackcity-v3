"use client"

// ⚠ Página temporal de prueba interna — integración de documentos privados de
// mascotas con Cloudflare R2. NO integrar al flujo de reservas ni al menú.
// NO requiere login/JWT.
//
// ⚠ IMPORTANTE: al momento de escribir esto NO existe contrato en
// jackcity-api/contracts para estos endpoints (initiate / confirm /
// download-url / GET documents). Los nombres de campos usados aquí son los
// indicados por Maribel en el brief. El código lee variantes camelCase y
// snake_case de forma defensiva y muestra la respuesta cruda para poder
// verificar la estructura real durante las pruebas.

import { useState } from "react"
import { useApiClient } from "@/hooks/use-api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

const DOCUMENT_TYPE = "VACCINATION_CARD"

type PetDocument = {
  id?: string
  documentId?: string
  filename?: string
  content_type?: string
  file_size_bytes?: number
  status?: string
  valid_until?: string
  [key: string]: unknown
}

// Los endpoints no tienen contrato: leemos varias claves posibles.
function pick<T = string>(obj: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) {
    if (obj && obj[k] != null) return obj[k] as T
  }
  return undefined
}

export default function PetsDocsTestPage() {
  const { apiFetch } = useApiClient()

  const [petId, setPetId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [validUntil, setValidUntil] = useState("")

  const [uploading, setUploading] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const [message, setMessage] = useState<{ kind: "info" | "success" | "error"; text: string } | null>(null)
  const [documents, setDocuments] = useState<PetDocument[]>([])
  const [lastRaw, setLastRaw] = useState<unknown>(null)

  function say(kind: "info" | "success" | "error", text: string) {
    setMessage({ kind, text })
  }

  async function fetchDocuments(id: string) {
    setLoadingList(true)
    try {
      const list = await apiFetch<unknown>(`/api/pets/${id}/documents`)
      const arr = Array.isArray(list)
        ? (list as PetDocument[])
        : ((list as { documents?: PetDocument[] })?.documents ?? [])
      setDocuments(arr)
      setLastRaw(list)
    } catch (err) {
      say("error", `No se pudo consultar los documentos: ${(err as Error).message}`)
    } finally {
      setLoadingList(false)
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (!petId.trim()) return say("error", "Ingresa un pet_id.")
    if (!file) return say("error", "Selecciona un archivo.")

    const id = petId.trim()
    setUploading(true)

    try {
      // 1) initiate — pedir URL temporal de subida
      say("info", "1/3 Iniciando carga (initiate)…")
      const initiateBody = {
        documentType: DOCUMENT_TYPE,
        filename: file.name,
        contentType: file.type || "application/octet-stream",
        fileSizeBytes: file.size,
        validUntil: validUntil || undefined,
      }
      const initiateRes = await apiFetch<Record<string, unknown>>(
        `/api/pets/${id}/documents/initiate`,
        { method: "POST", body: JSON.stringify(initiateBody) },
      )
      setLastRaw(initiateRes)

      const uploadUrl = pick<string>(initiateRes, "upload_url", "uploadUrl", "url")
      const documentId = pick<string>(initiateRes, "document_id", "documentId", "id")

      if (!uploadUrl) throw new Error("initiate no devolvió una URL de subida (upload_url).")
      if (!documentId) throw new Error("initiate no devolvió un id de documento (document_id).")

      // 2) PUT directo a Cloudflare R2 con la URL temporal (NO al backend)
      say("info", "2/3 Subiendo archivo a Cloudflare R2…")
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      })
      if (!putRes.ok) throw new Error(`PUT a R2 falló: ${putRes.status}`)

      // 3) confirm — confirmar la carga en el backend
      say("info", "3/3 Confirmando carga (confirm)…")
      await apiFetch(
        `/api/pets/${id}/documents/${documentId}/confirm`,
        { method: "POST", body: JSON.stringify({}) },
      )

      say("success", "Documento subido y confirmado. Actualizando lista…")

      // 4) volver a consultar la lista
      await fetchDocuments(id)
      say("success", "Documento subido, confirmado y lista actualizada.")
    } catch (err) {
      say("error", `Error en la carga: ${(err as Error).message}`)
    } finally {
      setUploading(false)
    }
  }

  async function handleViewDocument(doc: PetDocument) {
    const id = petId.trim()
    const documentId = doc.documentId ?? doc.id
    if (!id || !documentId) return say("error", "Falta pet_id o document_id para ver el documento.")

    try {
      const res = await apiFetch<Record<string, unknown>>(
        `/api/pets/${id}/documents/${documentId}/download-url`,
      )
      const url = pick<string>(res, "download_url", "downloadUrl", "url")
      if (!url) throw new Error("download-url no devolvió una URL.")
      // Abrir la URL temporal en nueva pestaña. No se guarda ni se reutiliza.
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (err) {
      say("error", `No se pudo obtener la URL de descarga: ${(err as Error).message}`)
    }
  }

  const messageColor =
    message?.kind === "error" ? "#B42318" : message?.kind === "success" ? "#067647" : "#1D4ED8"

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        ⚠ Página temporal de prueba interna — integración de documentos con Cloudflare R2.
        No requiere login. No forma parte del flujo de reservas.
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subir documento de mascota (prueba R2)</CardTitle>
          <CardDescription>
            document_type fijo: <code>{DOCUMENT_TYPE}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="petId">pet_id</Label>
              <Input
                id="petId"
                value={petId}
                onChange={(e) => setPetId(e.target.value)}
                placeholder="55555555-5555-5555-5555-555555555555"
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Archivo</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="text-xs text-muted-foreground">
                  {file.name} · {file.type || "sin tipo"} · {file.size} bytes
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">valid_until</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={uploading}>
                {uploading ? "Subiendo…" : "Subir documento"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loadingList || !petId.trim()}
                onClick={() => fetchDocuments(petId.trim())}
              >
                {loadingList ? "Consultando…" : "Consultar documentos"}
              </Button>
            </div>
          </form>

          {message && (
            <p className="mt-4 text-sm font-medium" style={{ color: messageColor }}>
              {message.text}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
          <CardDescription>
            {documents.length === 0 ? "Sin documentos cargados aún." : `${documents.length} documento(s).`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.map((doc, i) => (
            <div
              key={(doc.documentId ?? doc.id ?? i).toString()}
              className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-0.5 text-sm">
                <p className="font-medium">{doc.filename ?? "(sin filename)"}</p>
                <p className="text-muted-foreground">
                  {doc.content_type ?? "?"} · {doc.file_size_bytes ?? "?"} bytes
                </p>
                <p className="text-muted-foreground">
                  status: {doc.status ?? "?"} · valid_until: {doc.valid_until ?? "?"}
                </p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={() => handleViewDocument(doc)}>
                Ver / descargar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {lastRaw != null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Última respuesta cruda (debug)</CardTitle>
            <CardDescription>Para verificar la estructura real durante las pruebas.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(lastRaw, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
