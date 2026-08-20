"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, User, X } from "lucide-react"
import { useClerk, useUser, UserButton } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import { ContactModal } from "@/components/contact-modal"
import { useApiClient } from "@/hooks/use-api-client"
import { getMyProfile } from "@/lib/api/customers"

const WHATSAPP_NUMBER = "56957763321"
const WHATSAPP_MESSAGE = "Hola Jackcity! Tengo algunas dudas sobre mi reserva.."
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
    </svg>
  )
}

export function SiteNavbar() {
  const { openSignIn } = useClerk()
  const { isSignedIn } = useUser()
  const { apiFetch } = useApiClient()

  const { data: profile } = useQuery({
    queryKey: ["myProfile"],
    queryFn: () => getMyProfile(apiFetch),
    enabled: !!isSignedIn,
    staleTime: 5 * 60 * 1000,
  })

  const isHotelMgr = profile?.user?.role === "HOTEL_MGR"
  const hotelId = profile?.user?.hotelId
  const [homeHref, setHomeHref] = useState("/")
  const [contactOpen, setContactOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setHomeHref(window.location.search ? `/${window.location.search}` : "/")
  }, [])

  const closeMobile = () => setMobileMenuOpen(false)

  return (
    <>
      <nav className="w-full px-4 md:px-6 flex items-center h-11" style={{ backgroundColor: "#0D2B45" }}>

        {/* Logo */}
        <Link href={homeHref} className="flex items-center gap-2.5 flex-shrink-0" onClick={closeMobile}>
          <img
            src="/images/dog-icon.png"
            alt="JackCity mascot"
            className="w-6 h-6 object-contain"
          />
          <span className="text-lg font-bold tracking-tight">
            <span style={{ color: "#ffffff" }}>Jack</span>
            <span style={{ color: "#FFC43D" }}>City</span>
          </span>
          <span className="text-sm font-medium ml-1" style={{ color: "#8899AA" }}></span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 ml-auto">
          <a
            href="/#como-funciona"
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "#ffffff" }}
          >
            Cómo Funciona?
          </a>

          {isSignedIn && (
            <>
              <Link
                href="/mi-cuenta"
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors hover:bg-white/10"
                style={{ color: "#ffffff" }}
              >
                Mi Cuenta
              </Link>
              <Link
                href="/mis-reservas"
                className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors hover:bg-white/10"
                style={{ color: "#ffffff" }}
              >
                Mis Reservas
              </Link>
              {isHotelMgr && hotelId && (
                <Link
                  href={`/hotel/bookings/${hotelId}`}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors hover:bg-white/10"
                  style={{ color: "#FFC43D" }}
                >
                  Mi Hotel
                </Link>
              )}
            </>
          )}

          <button
            type="button"
            onClick={() => setContactOpen(true)}
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "#ffffff" }}
          >
            Contacto
          </button>

          <span
            aria-hidden="true"
            className="w-px h-[18px] mx-2"
            style={{ backgroundColor: "rgba(255,255,255,0.16)" }}
          />

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2.5 py-1 text-sm font-medium rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "#ffffff" }}
          >
            <span
              className="flex items-center justify-center w-[22px] h-[22px] rounded-full flex-shrink-0"
              style={{ backgroundColor: "#25D366", color: "#ffffff" }}
            >
              <WhatsAppIcon size={14} />
            </span>
            WhatsApp
          </a>

          {isSignedIn ? (
            <div className="ml-3">
              <UserButton />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openSignIn()}
              className="ml-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
            >
              <User size={13} strokeWidth={2.5} />
              Iniciar Sesión
            </button>
          )}
        </div>

        {/* Mobile: WhatsApp + hamburger */}
        <div className="md:hidden ml-auto flex items-center gap-1">
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Escríbenos por WhatsApp"
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-white/10"
          >
            <span
              className="flex items-center justify-center w-[26px] h-[26px] rounded-full"
              style={{ backgroundColor: "#25D366", color: "#ffffff" }}
            >
              <WhatsAppIcon size={16} />
            </span>
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "#ffffff" }}
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full shadow-lg" style={{ backgroundColor: "#0D2B45", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex flex-col px-4 py-3 gap-1">
            {isSignedIn && (
              <>
                <Link
                  href="/mi-cuenta"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors hover:bg-white/10"
                  style={{ color: "#ffffff" }}
                >
                  Mi Cuenta
                </Link>
                <Link
                  href="/mis-reservas"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors hover:bg-white/10"
                  style={{ color: "#ffffff" }}
                >
                  Mis Reservas
                </Link>
                {isHotelMgr && hotelId && (
                  <Link
                    href={`/hotel/bookings/${hotelId}`}
                    onClick={closeMobile}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors hover:bg-white/10"
                    style={{ color: "#FFC43D" }}
                  >
                    Mi Hotel
                  </Link>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => { closeMobile(); setContactOpen(true) }}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors hover:bg-white/10 text-left"
              style={{ color: "#ffffff" }}
            >
              Contacto
            </button>

            <div className="mt-1 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {isSignedIn ? (
                <div className="flex items-center gap-3 px-3 py-2">
                  <UserButton />
                  <span className="text-sm font-semibold" style={{ color: "#8899AA" }}>Mi perfil</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { closeMobile(); openSignIn() }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
                >
                  <User size={15} strokeWidth={2.5} />
                  Iniciar Sesión
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  )
}
