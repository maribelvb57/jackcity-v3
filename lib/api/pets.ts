import { API_BASE } from "./config"

export type PetPayload = {
  name: string
  breed: string
  size: string
  gender: string
  weight?: number
  color?: string
  age?: number
}

export async function createPet(data: PetPayload, token: string): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/api/pets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Create pet failed: ${res.status}`)
  return res.json()
}

export async function deletePet(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/pets/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Delete pet failed: ${res.status}`)
}

export async function updatePet(id: string, data: PetPayload, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/pets/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Update pet failed: ${res.status}`)
}
