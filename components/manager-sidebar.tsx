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
} from "lucide-react"

interface MenuItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
}

interface ManagerSidebarProps {
  hotelId: string
}

export function ManagerSidebar({ hotelId }: ManagerSidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const menuItems: MenuItem[] = [
    {
      id: "reservas",
      label: "Reservas",
      href: `/hotel/bookings/${hotelId}`,
      icon: <ClipboardList size={20} />,
    },
    {
      id: "datos-hotel",
      label: "Datos del Hotel",
      href: `/hotel/info/${hotelId}`,
      icon: <Building2 size={20} />,
    },
    {
      id: "precios",
      label: "Configurar precios y descuentos",
      href: `/hotel/prices/${hotelId}`,
      icon: <Tag size={20} />,
    },
    {
      id: "disponibilidad",
      label: "Configurar disponibilidad",
      href: `/hotel/availability/${hotelId}`,
      icon: <CalendarDays size={20} />,
    },
    {
      id: "servicios",
      label: "Servicios del Hotel",
      href: `/hotel/services/${hotelId}`,
      icon: <PauseCircle size={20} />,
    },
    {
      id: "transporte",
      label: "Transporte",
      href: `/hotel/transport/${hotelId}`,
      icon: <Car size={20} />,
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
        style={{ backgroundColor: "#1a3a5c", color: "#ffffff" }}
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
          md:translate-x-0 md:relative md:z-auto
          ${isCollapsed ? "md:w-16" : "md:w-64"}
        `}
        style={{ backgroundColor: "#1a3a5c" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between h-16 px-4 border-b"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          {!isCollapsed && (
            <span className="text-white font-bold text-lg truncate">
              Panel Manager
            </span>
          )}
          
          {/* Mobile close */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden text-white hover:opacity-70"
            aria-label="Cerrar menú"
          >
            <X size={24} />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 text-white transition-colors"
            aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Menu items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const active = isActive(item.href)
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-3 rounded-lg
                      transition-colors duration-150
                      ${active
                        ? "font-semibold"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                      }
                    `}
                    style={active ? { backgroundColor: "#FFC43D", color: "#1a3a5c" } : undefined}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="flex-shrink-0">{item.icon}</span>
                    {!isCollapsed && (
                      <span className="text-sm font-medium truncate">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer — espacio visual */}
        <div className="px-4 py-6" />
      </aside>
    </>
  )
}
