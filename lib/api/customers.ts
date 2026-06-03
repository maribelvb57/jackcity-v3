const API_BASE = "http://localhost:8080"

export type ValidateEmailStatus = "AVAILABLE" | "GUESS_EXISTS" | "ACCOUNT_EXISTS"

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
