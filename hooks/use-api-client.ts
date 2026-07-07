"use client"

import { useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { API_BASE } from "@/lib/api/config"
import { getTrackingHeaders } from "@/lib/tracking"
import type { ApiFetch } from "@/lib/api/types"

export type { ApiFetch }

export function useApiClient() {
  const { getToken } = useAuth()

  const apiFetch: ApiFetch = useCallback(async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const doRequest = async (t: string | null) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...getTrackingHeaders(),
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...(options.headers as Record<string, string> ?? {}),
      }
      return fetch(`${API_BASE}${path}`, { ...options, headers })
    }

    const token = await getToken()
    let res = await doRequest(token)

    // Si 401 y teníamos token, intentar con token refrescado (una vez)
    if (res.status === 401 && token) {
      const freshToken = await getToken()
      if (freshToken && freshToken !== token) {
        res = await doRequest(freshToken)
      }
    }

    if (!res.ok) throw new Error(`${options.method ?? "GET"} ${path} failed: ${res.status}`)
    if (res.status === 204) return undefined as T
    return res.json()
  }, [getToken])

  return { apiFetch }
}
