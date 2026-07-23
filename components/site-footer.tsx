"use client"

import Image from "next/image"
import { useState } from "react"
import { X } from "lucide-react"
import { PoliticaReservasContent } from "@/components/legal/politica-reservas-content"
import { PoliticaCancelacionContent } from "@/components/legal/politica-cancelacion-content"
import { TerminosCondicionesContent } from "@/components/legal/terminos-condiciones-content"
import { PrivacidadDatosContent } from "@/components/legal/privacidad-datos-content"
import { ContactModal } from "@/components/contact-modal"

type ModalId = "reservas" | "cancelacion" | "terminos" | "privacidad" | null

const footerLinks = [
  {
    title: "JackCity",
    links: [
      { label: "Quiénes somos", href: "#" },
      { label: "Nuestro equipo", href: "#" },
      { label: "Trabaja con nosotros", href: "#" },
      { label: "Blog", href: "#" },
    ],
  },
  {
    title: "Hoteles",
    links: [
      { label: "Buscar hoteles", href: "#" },
      { label: "Hoteles destacados", href: "#" },
      { label: "Registrar mi hotel", href: "#" },
      { label: "Ciudades disponibles", href: "#" },
    ],
  },
  {
    title: "Soporte",
    links: [
      { label: "Contáctanos", href: "#", contact: true },
      { label: "Centro de ayuda", href: "#" },
      { label: "Preguntas frecuentes", href: "#" },
      { label: "Estado del servicio", href: "#" },
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

const MODAL_CONFIG: Record<string, { title: string; href: string; content: React.ReactNode }> = {
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
  const modal = openModal ? MODAL_CONFIG[openModal] : null

  return (
    <>
      <footer style={{ backgroundColor: "#111111", color: "#D6D9DF" }}>
        <div className="mx-auto max-w-[1100px] px-6 pt-14 pb-8">

          {/* Top: logo + columns */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
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
              <p className="text-sm leading-relaxed" style={{ color: "#A6AFBD" }}>
                El hotel de perros que tu peque se merece. Profesional, acogedor y con todo el amor del mundo.
              </p>

              {/* Social links */}
              <div className="flex gap-3 mt-5">
                {["IG", "FB", "TW"].map((s) => (
                  <a
                    key={s}
                    href="#"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors hover:text-white"
                    style={{ backgroundColor: "#232323", color: "#C7CED9" }}
                    aria-label={s === "IG" ? "Instagram" : s === "FB" ? "Facebook" : "Twitter"}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D4AA20")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#232323")}
                  >
                    {s}
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {footerLinks.map((col) => (
              <div key={col.title}>
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
          </div>

          {/* Divider */}
          <div className="border-t mb-6" style={{ borderColor: "#2B2B2B" }} />

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{ color: "#7F8897" }}>
              &copy; <span suppressHydrationWarning>{currentYear}</span> JackCity. Todos los derechos reservados.
            </p>
            <p className="text-xs" style={{ color: "#7F8897" }}>
              v 5.9999999
            </p>
            <p className="text-xs" style={{ color: "#7F8897" }}>
              Hecho con amor para los perritos de Chile
            </p>
          </div>
        </div>
      </footer>

      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />

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
          </div>
        </div>
      )}
    </>
  )
}
