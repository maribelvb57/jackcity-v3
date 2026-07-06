import type { ApiFetch } from "@/lib/api/types"

export type AddressPayload = {
  street: string
  number?: string
  apartment?: string
  commune: string
  city: string
  country: string
  reference?: string
}

export type AddressResult = {
  id: string
  street: string
  number: string | null
  apartment: string | null
  commune: string
  city: string
  country: string
  reference: string | null
  label?: string
  isDefault?: boolean
}

export async function deleteAddress(id: string, apiFetch: ApiFetch): Promise<void> {
  await apiFetch(`/api/me/addresses/${id}`, { method: "DELETE" })
}

export async function createAddress(data: AddressPayload, apiFetch: ApiFetch): Promise<AddressResult> {
  return apiFetch("/api/me/addresses", { method: "POST", body: JSON.stringify(data) })
}
