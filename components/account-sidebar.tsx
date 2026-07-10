"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useClerk } from "@clerk/nextjs"
import {
  Home,
  CalendarDays,
  PawPrint,
  User,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  type LucideIcon,
} from "lucide-react"
import { ContactModal } from "@/components/contact-modal"

type NavItem = {
  label: string
  icon: LucideIcon
  href?: string
  soon?: boolean
}

// Items que llevan a una página/sección real. Los marcados con `soon` aún no
// tienen destino y se muestran deshabilitados con un tag "Pronto".
const NAV_ITEMS: NavItem[] = [
  { label: "Resumen de cuenta", icon: Home, href: "/mi-cuenta" },
  { label: "Mis Reservas", icon: CalendarDays, href: "/mis-reservas" },
  { label: "Mis Mascotas", icon: PawPrint, href: "/mi-cuenta#mascotas" },
  { label: "Mis Datos", icon: User, href: "/mi-cuenta#datos" },
  { label: "Direcciones", icon: MapPin, href: "/mi-cuenta#direcciones" },
  { label: "Métodos de Pago", icon: CreditCard, soon: true },
  { label: "Notificaciones", icon: Bell, soon: true },
]

const ACCENT = "#FFC43D"
const SIDEBAR_BG = "#0D2B45"

export function AccountSidebar() {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const [contactOpen, setContactOpen] = useState(false)

  // Solo los links a una página propia (sin ancla) se marcan como activos.
  const isActive = (href?: string) => !!href && !href.includes("#") && pathname === href

  return (
    <>
      <aside
        className="hidden lg:flex w-64 flex-shrink-0 flex-col min-h-[calc(100vh-3.5rem)]"
        style={{ backgroundColor: SIDEBAR_BG }}
      >
        {/* Logo */}
        <div className="px-4 pt-5 pb-6">
          <Link href="/" className="block">
            <Image
              src="/images/logo/logo-003.png"
              alt="JackCity — Vacaciones para perros"
              width={218}
              height={72}
              className="w-full h-auto rounded-xl"
              priority
            />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            const Icon = item.icon

            if (item.soon || !item.href) {
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium cursor-default select-none"
                  style={{ color: "rgba(199,210,221,0.45)" }}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <span
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#8EA1B2" }}
                  >
                    Pronto
                  </span>
                </div>
              )
            }

            return (
              <Link
                key={item.label}
                href={item.href}
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
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* Ayuda y Soporte — abre el modal de contacto */}
          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
            style={{ color: "#C7D2DD" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <HelpCircle size={18} className="flex-shrink-0" />
            <span>Ayuda y Soporte</span>
          </button>
        </nav>

        {/* Support card + logout, pegados abajo */}
        <div className="mt-auto px-3 pb-5 pt-6 flex flex-col gap-4">
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

          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left"
            style={{ color: "#C7D2DD" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <LogOut size={18} className="flex-shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  )
}
