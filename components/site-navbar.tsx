"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { User } from "lucide-react"
import { useClerk, useUser, UserButton } from "@clerk/nextjs"
import { ContactModal } from "@/components/contact-modal"

export function SiteNavbar() {
  const { openSignIn } = useClerk()
  const { isSignedIn } = useUser()
  const [homeHref, setHomeHref] = useState("/")
  const [contactOpen, setContactOpen] = useState(false)

  useEffect(() => {
    setHomeHref(window.location.search ? `/${window.location.search}` : "/")
  }, [])

  return (
    <nav className="w-full px-4 md:px-6 flex items-center h-14" style={{ backgroundColor: "#0D2B45" }}>

      {/* Logo */}
      <Link href={homeHref} className="flex items-center gap-2.5 flex-shrink-0">
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

      {/* Nav links + button pushed to the right */}
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

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

    </nav>
  )
}
