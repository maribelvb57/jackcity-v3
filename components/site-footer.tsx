"use client"

import Image from "next/image"
import { useState } from "react"
import { X, Instagram } from "lucide-react"
import { PoliticaReservasContent } from "@/components/legal/politica-reservas-content"
import { PoliticaCancelacionContent } from "@/components/legal/politica-cancelacion-content"
import { TerminosCondicionesContent } from "@/components/legal/terminos-condiciones-content"
import { PrivacidadDatosContent } from "@/components/legal/privacidad-datos-content"
import { QuienesSomosContent } from "@/components/legal/quienes-somos-content"
import { ContactModal } from "@/components/contact-modal"
import { HotelContactModal } from "@/components/hotel-contact-modal"

type ModalId = "nosotros" | "reservas" | "cancelacion" | "terminos" | "privacidad" | null

const footerLinks = [
  {
    title: "Enlaces",
    links: [
      { label: "¿Quiénes somos?", href: "#", modal: "nosotros" as ModalId },
      { label: "Quiero a mi hotel en JackCity", href: "#", hotelContact: true },
      { label: "Contáctanos", href: "#", contact: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Política de reservas", href: "#", modal: "reservas" as ModalId },
      { label: "Política de cancelación", href: "#", modal: "cancelacion" as ModalId },
      { label: "Términos y condiciones", href: "#", modal: "terminos" as ModalId },
      { label: "Privacidad y datos", href: "#", modal: "privacidad" as ModalId },
    ],
  },
]

const MODAL_CONFIG: Record<string, { title: string; href?: string; content: React.ReactNode }> = {
  nosotros: {
    title: "¿Quiénes somos?",
    content: <QuienesSomosContent />,
  },
  reservas: {
    title: "Política de reservas JackCity",
    href: "/legal/politica-de-reservas",
    content: <PoliticaReservasContent />,
  },
  cancelacion: {
    title: "Política de cancelación y devoluciones JackCity",
    href: "/legal/politica-de-cancelacion",
    content: <PoliticaCancelacionContent />,
  },
  terminos: {
    title: "Términos y condiciones de uso JackCity",
    href: "/legal/terminos-y-condiciones",
    content: <TerminosCondicionesContent />,
  },
  privacidad: {
    title: "Política de privacidad y tratamiento de datos JackCity",
    href: "/legal/privacidad-y-datos",
    content: <PrivacidadDatosContent />,
  },
}

export function SiteFooter() {
  const currentYear = new Date().getFullYear()
  const [openModal, setOpenModal] = useState<string | null>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [hotelContactOpen, setHotelContactOpen] = useState(false)
  const modal = openModal ? MODAL_CONFIG[openModal] : null

  return (
    <>
      <footer style={{ backgroundColor: "#111111", color: "#D6D9DF" }}>
        <div className="mx-auto max-w-[1100px] px-6 pt-14 pb-8">

          {/* Top: logo + columns */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 md:gap-8 mb-8">

            {/* Brand */}
            <div className="md:max-w-[260px]">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/logo-02.png"
                  alt="JackCity"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <span className="text-xl font-bold text-white">
                  JackCity
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-[38ch]" style={{ color: "#A6AFBD" }}>
                El hospedaje que tu perro merece, la tranquilidad que tú necesitas.
              </p>

              {/* Social links */}
              <div className="mt-5">
                <a
                  href="https://www.instagram.com/jackcitycl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 h-9 pl-3 pr-4 rounded-lg text-xs font-semibold transition-colors"
                  style={{ backgroundColor: "#232323", color: "#C7CED9" }}
                  aria-label="Instagram de JackCity"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#D4AA20"
                    e.currentTarget.style.color = "#111111"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#232323"
                    e.currentTarget.style.color = "#C7CED9"
                  }}
                >
                  <Instagram size={16} />
                  Instagram
                </a>
              </div>
            </div>

            {/* Link columns */}
            {footerLinks.map((col) => (
              <div key={col.title} className="md:shrink-0">
                <h4 className="text-sm font-bold mb-4 text-white">
                  {col.title}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {"contact" in link && link.contact ? (
                        <button
                          type="button"
                          onClick={() => setContactOpen(true)}
                          className="text-sm transition-colors hover:text-white text-left"
                          style={{ color: "#A6AFBD" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#D4AA20")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#A6AFBD")}
                        >
                          {link.label}
                        </button>
                      ) : "hotelContact" in link && link.hotelContact ? (
                        <button
                          type="button"
                          onClick={() => setHotelContactOpen(true)}
                          className="text-sm transition-colors hover:text-white text-left"
                          style={{ color: "#A6AFBD" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#D4AA20")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#A6AFBD")}
                        >
                          {link.label}
                        </button>
                      ) : "modal" in link && link.modal ? (
                        <button
                          type="button"
                          onClick={() => setOpenModal(link.modal as string)}
                          className="text-sm transition-colors hover:text-white text-left"
                          style={{ color: "#A6AFBD" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#D4AA20")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#A6AFBD")}
                        >
                          {link.label}
                        </button>
                      ) : (
                        <a
                          href={link.href}
                          className="text-sm transition-colors hover:text-white"
                          style={{ color: "#A6AFBD" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#D4AA20")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#A6AFBD")}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* AndesBits */}
            <div className="md:shrink-0 md:w-[180px] md:text-right">
              <h4 className="text-sm font-bold mb-4 text-white">
                Un producto de
              </h4>
              <a
                href="https://andesbits.cl"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-xl overflow-hidden transition-opacity hover:opacity-80"
                aria-label="AndesBits"
              >
                <Image
                  src="/images/andesbits-logo.png"
                  alt="AndesBits — Tecnología que conecta el sur"
                  width={180}
                  height={112}
                  className="w-full max-w-[180px] h-auto"
                />
              </a>
              <p className="text-xs mt-3 leading-relaxed max-w-[180px] md:ml-auto" style={{ color: "#7F8897" }}>
                JackCity es un producto de AndesBits.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t mb-5" style={{ borderColor: "#2B2B2B" }} />

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{ color: "#7F8897" }}>
              &copy; <span suppressHydrationWarning>{currentYear}</span> JackCity. Todos los derechos reservados.
            </p>
            <p className="text-xs" style={{ color: "#7F8897" }}>
              v 5.20
            </p>
            <p className="text-xs" style={{ color: "#7F8897" }}>
              Hecho con amor para los perritos de Chile
            </p>
          </div>
        </div>
      </footer>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

      <HotelContactModal open={hotelContactOpen} onClose={() => setHotelContactOpen(false)} />

      {/* Legal modal */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => setOpenModal(null)}
        >
          <div
            className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b flex-shrink-0" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="text-xl font-bold pr-4" style={{ color: "#0A1830" }}>
                {modal.title}
              </h2>
              <button
                type="button"
                onClick={() => setOpenModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100 flex-shrink-0"
                aria-label="Cerrar"
              >
                <X size={18} style={{ color: "#6B7280" }} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto px-6 py-5 flex-1">
              {modal.content}
            </div>

            {/* Footer */}
            {modal.href && (
              <div className="px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "#E5E7EB" }}>
                <a
                  href={modal.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline underline-offset-2 transition-opacity hover:opacity-75"
                  style={{ color: "#6B7280" }}
                >
                  Ver página completa
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
