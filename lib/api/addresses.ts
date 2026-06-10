const API_BASE = "http://localhost:8080"

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

export async function deleteAddress(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/me/addresses/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Delete address failed: ${res.status}`)
}

export async function createAddress(data: AddressPayload, token: string): Promise<AddressResult> {
  const res = await fetch(`${API_BASE}/api/me/addresses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Create address failed: ${res.status}`)
  return res.json()
}
