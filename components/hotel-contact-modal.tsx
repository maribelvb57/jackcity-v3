"use client"

import { useState } from "react"
import { X, Building2, User, Mail, Phone, MapPin, Globe, MessageSquare, Send, CheckCircle } from "lucide-react"

interface HotelContactModalProps {
  open: boolean
  onClose: () => void
}

export function HotelContactModal({ open, onClose }: HotelContactModalProps) {
  const [hotelName, setHotelName] = useState("")
  const [comuna, setComuna] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  if (!open) return null

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  const canSubmit = hotelName.trim() && comuna.trim() && name.trim() && emailIsValid && phone.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/hotel-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelName, comuna, name, email, phone, website, message }),
      })
      const contentType = res.headers.get("content-type") ?? ""
      const data = contentType.includes("application/json") ? await res.json() : {}
      if (!res.ok) throw new Error(data.error || "No se pudo enviar tu solicitud. Intenta más tarde.")
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar tu solicitud. Intenta más tarde.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setHotelName(""); setComuna(""); setName(""); setEmail("")
      setPhone(""); setWebsite(""); setMessage("")
      setError(""); setSent(false)
    }, 300)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={handleClose}
    >
      <div
        className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b flex-shrink-0" style={{ borderColor: "#E5E7EB" }}>
          <h2 className="text-xl font-bold pr-4" style={{ color: "#0A1830" }}>Quiero a mi hotel en JackCity</h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100 flex-shrink-0"
            aria-label="Cerrar"
          >
            <X size={18} style={{ color: "#6B7280" }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle size={48} style={{ color: "#16A34A" }} />
              <p className="text-lg font-bold" style={{ color: "#0A1830" }}>¡Solicitud enviada!</p>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Recibimos los datos de <strong>{hotelName}</strong>. Te contactaremos a{" "}
                <strong>{email}</strong> para continuar con el proceso de verificación.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#0A1830", color: "#fff" }}
              >
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Cuéntanos sobre tu hotel y nos pondremos en contacto para iniciar el proceso de
                verificación y publicación en JackCity.
              </p>

              {/* Nombre del hotel */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                  Nombre del hotel
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                  <input
                    type="text"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    placeholder="Hotel canino Ejemplo"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                  />
                </div>
              </div>

              {/* Comuna */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                  Comuna
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                  <input
                    type="text"
                    value={comuna}
                    onChange={(e) => setComuna(e.target.value)}
                    placeholder="La Reina"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                  />
                </div>
              </div>

              {/* Nombre de contacto */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                  Nombre de contacto
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                  Teléfono
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+56 9 1234 5678"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                  />
                </div>
              </div>

              {/* Instagram o página web */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                  Instagram o página web{" "}
                  <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
                </label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="@mihotel o www.mihotel.cl"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100"
                    style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                  />
                </div>
              </div>

              {/* Mensaje */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                  Cuéntanos sobre tu hotel{" "}
                  <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
                </label>
                <div className="relative">
                  <MessageSquare size={16} className="absolute left-3 top-3" style={{ color: "#9CA3AF" }} />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Capacidad, servicios que ofreces, años de experiencia..."
                    rows={4}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                    style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm rounded-xl border px-4 py-3" style={{ backgroundColor: "#FFF5F5", borderColor: "#FCA5A5", color: "#B91C1C" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                style={{ backgroundColor: "#0A1830", color: "#fff" }}
              >
                <Send size={16} />
                {isSubmitting ? "Enviando..." : "Enviar solicitud"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
