import { API_BASE } from "./config"
import type { ApiFetch } from "@/lib/api/types"

export type ValidateEmailStatus = "AVAILABLE" | "GUESS_EXISTS" | "ACCOUNT_EXISTS"

export type CustomerProfile = {
  userId: string
  user: {
    firstName: string
    lastName: string
    email: string
    phone: string
    rut: string
  }
  addresses: {
    id: string
    label?: string
    isDefault?: boolean
    street: string
    number: string | null
    apartment: string | null
    commune: string
    city: string
    country: string
    reference: string | null
  }[]
  pets: {
    id: string
    name: string
    breed: string
    size: string
    gender: string
    weight: number | null
    color: string | null
    age: number | null
    active: boolean
  }[]
}

export async function getCustomerProfile(userId: string): Promise<CustomerProfile> {
  const res = await fetch(`${API_BASE}/api/customers/${userId}/profile`)
  if (!res.ok) throw new Error(`Get customer profile failed: ${res.status}`)
  return res.json()
}

export type UpdateMeParams = {
  firstName: string
  lastName: string
  phone: string
  identification: string
}

export type UpdateMeResult = {
  id: string
  clerkUserId: string
  email: string
  firstName: string
  lastName: string
  phone: string
  identification: string
}

export async function updateMe(params: UpdateMeParams, apiFetch: ApiFetch): Promise<UpdateMeResult> {
  return apiFetch("/api/me", { method: "PUT", body: JSON.stringify(params) })
}

export async function validateEmail(email: string): Promise<ValidateEmailStatus> {
  const res = await fetch(`${API_BASE}/api/customers/validate-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) throw new Error(`validate-email failed: ${res.status}`)
  const data = await res.json()
  return data.status as ValidateEmailStatus
}
