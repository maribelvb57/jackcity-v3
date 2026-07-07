"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, User, X } from "lucide-react"
import { useClerk, useUser, UserButton } from "@clerk/nextjs"
import { useQuery } from "@tanstack/react-query"
import { ContactModal } from "@/components/contact-modal"
import { useApiClient } from "@/hooks/use-api-client"
import { getMyProfile } from "@/lib/api/customers"

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
      <nav className="w-full px-4 md:px-6 flex items-center h-14" style={{ backgroundColor: "#0D2B45" }}>

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
          <span className="text-sm font-medium ml-1" style={{ color: "#8899AA" }}>   63   </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1 ml-auto">
          <a
            href="/#como-funciona"
            className="px-3 py-1.5 text-sm font-medium rounded-lg transition-colors hover:bg-white/10"
            style={{ color: "#ffffff" }}
          >
            Cómo Funciona
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
                  href={`/hotel/availability/${hotelId}`}
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

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden ml-auto flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-white/10"
          style={{ color: "#ffffff" }}
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
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
                    href={`/hotel/availability/${hotelId}`}
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
