"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import { Building2, UserCircle, CalendarDays } from "lucide-react"
import { useApiClient } from "@/hooks/use-api-client"
import { getMyProfile } from "@/lib/api/customers"
import { getHotelInfo } from "@/lib/api/hotel-info"

interface ManagerContextBarProps {
  hotelId: string
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

export function ManagerContextBar({ hotelId }: ManagerContextBarProps) {
  const [dateLabel, setDateLabel] = useState<string>("")
  const { isSignedIn } = useUser()
  const { apiFetch } = useApiClient()

  const { data: profile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () => getMyProfile(apiFetch),
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000,
  })

  const { data: hotelInfo } = useQuery({
    queryKey: ["hotel-info", hotelId],
    queryFn: () => getHotelInfo(hotelId, apiFetch),
    enabled: !!hotelId,
    staleTime: 5 * 60 * 1000,
  })

  const managerName = profile?.user
    ? [profile.user.firstName, profile.user.lastName].filter(Boolean).join(" ")
    : null

  useEffect(() => {
    const now = new Date()
    const day = DAY_NAMES[now.getDay()]
    const date = now.getDate()
    const month = MONTH_NAMES[now.getMonth()]
    const year = now.getFullYear()
    setDateLabel(`${day} ${date} de ${month} de ${year}`)
  }, [])

  return (
    <div
      className="w-full flex items-center justify-between px-6 py-3 border-b"
      style={{
        backgroundColor: "#ffffff",
        borderColor: "#E5E7EB",
      }}
    >
      {/* Left: Hotel name */}
      <div className="flex items-center gap-2">
        <Building2 size={18} style={{ color: "#FFC43D" }} />
        <span
          className="text-lg font-bold tracking-tight"
          style={{ color: "#1a3a5c" }}
        >
          {hotelInfo?.hotel.name ?? "—"}
        </span>
      </div>

      {/* Right: Manager name + date */}
      <div className="flex items-center gap-5">
        {/* Date */}
        <div className="hidden sm:flex items-center gap-1.5">
          <CalendarDays size={15} style={{ color: "#9CA3AF" }} />
          <span className="text-sm" style={{ color: "#6B7280" }}>
            {dateLabel}
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5" style={{ backgroundColor: "#E5E7EB" }} />

        {/* Manager */}
        <div className="flex items-center gap-1.5">
          <UserCircle size={18} style={{ color: "#1a3a5c" }} />
          <span className="text-sm font-semibold" style={{ color: "#1a3a5c" }}>
            {managerName ?? "—"}
          </span>
        </div>
      </div>
    </div>
  )
}
