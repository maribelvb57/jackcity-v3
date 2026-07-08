import type { ApiFetch } from "@/lib/api/types"

export type PetPayload = {
  name: string
  breed?: string
  size?: string
  gender?: string
  weight?: number
  color?: string
  age?: number
}

export async function createPet(data: PetPayload, apiFetch: ApiFetch): Promise<{ id: string }> {
  return apiFetch("/api/pets", { method: "POST", body: JSON.stringify(data) })
}

export async function deletePet(id: string, apiFetch: ApiFetch): Promise<void> {
  await apiFetch(`/api/pets/${id}`, { method: "DELETE" })
}

export async function updatePet(id: string, data: PetPayload, apiFetch: ApiFetch): Promise<void> {
  await apiFetch(`/api/pets/${id}`, { method: "PUT", body: JSON.stringify(data) })
}
