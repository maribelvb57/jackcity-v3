const API_BASE = "http://localhost:8080"

export type PetPayload = {
  name: string
  breed: string
  size: string
  gender: string
  weight?: number
  color?: string
  age?: number
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
