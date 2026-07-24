"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2,
  Tag,
  CalendarDays,
  PauseCircle,
  Car,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  PawPrint,
  type LucideIcon,
} from "lucide-react"
import { ContactModal } from "@/components/contact-modal"

interface MenuItem {
  id: string
  label: string
  href: string
  icon: LucideIcon
}

interface ManagerSidebarProps {
  hotelId: string
}

const ACCENT = "#FFC43D"
const SIDEBAR_BG = "#0D2B45"

export function ManagerSidebar({ hotelId }: ManagerSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)

  const menuItems: MenuItem[] = [
    {
      id: "reservas",
      label: "Reservas",
      href: `/hotel/bookings/${hotelId}`,
      icon: ClipboardList,
    },
    {
      id: "datos-hotel",
      label: "Datos del Hotel",
      href: `/hotel/info/${hotelId}`,
      icon: Building2,
    },
    {
      id: "precios",
      label: "Configurar precios y descuentos",
      href: `/hotel/prices/${hotelId}`,
      icon: Tag,
    },
    {
      id: "disponibilidad",
      label: "Configurar disponibilidad",
      href: `/hotel/availability/${hotelId}`,
      icon: CalendarDays,
    },
    {
      id: "servicios",
      label: "Servicios del Hotel",
      href: `/hotel/services/${hotelId}`,
      icon: PauseCircle,
    },
    {
      id: "transporte",
      label: "Transporte",
      href: `/hotel/transport/${hotelId}`,
      icon: Car,
    },
  ]

  function isActive(href: string): boolean {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-20 left-4 z-40 md:hidden flex items-center justify-center w-10 h-10 rounded-lg shadow-md"
        style={{ backgroundColor: SIDEBAR_BG, color: "#ffffff" }}
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-50 flex flex-col
          transition-all duration-300 ease-in-out
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:relative md:z-auto md:min-h-[calc(100vh-2.75rem)]
          ${isCollapsed ? "md:w-16" : "md:w-64"}
        `}
        style={{ backgroundColor: SIDEBAR_BG }}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4">
          {!isCollapsed && (
            <span className="font-bold text-lg truncate" style={{ color: "#ffffff" }}>
              Panel Manager
            </span>
          )}

          {/* Mobile close */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden hover:opacity-70"
            style={{ color: "#ffffff" }}
            aria-label="Cerrar menú"
          >
            <X size={24} />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: "#C7D2DD" }}
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 py-2 overflow-y-auto">
          {menuItems.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                title={isCollapsed ? item.label : undefined}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  color: active ? ACCENT : "#C7D2DD",
                  backgroundColor: active ? "rgba(255,196,61,0.10)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.backgroundColor = "transparent"
                }}
              >
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full"
                    style={{ backgroundColor: ACCENT }}
                  />
                )}
                <Icon size={18} className="flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Support card, pegada abajo */}
        {!isCollapsed && (
          <div className="mt-auto px-3 pb-5 pt-6">
            <div
              className="rounded-2xl p-4"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <PawPrint size={16} style={{ color: ACCENT }} />
                <p className="text-sm font-bold" style={{ color: "#ffffff" }}>¿Necesitas ayuda?</p>
              </div>
              <p className="text-xs mb-3" style={{ color: "#8EA1B2" }}>Estamos aquí para ti</p>
              <button
                type="button"
                onClick={() => setContactOpen(true)}
                className="w-full py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: ACCENT, color: SIDEBAR_BG }}
              >
                Contactar soporte
              </button>
            </div>
          </div>
        )}
      </aside>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  )
}
