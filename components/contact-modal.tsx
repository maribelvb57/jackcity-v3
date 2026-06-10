"use client"

import { useState } from "react"
import { X, User, Mail, Phone, MessageSquare, Send, CheckCircle } from "lucide-react"

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

export function ContactModal({ open, onClose }: ContactModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  if (!open) return null

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
  const canSubmit = name.trim() && emailIsValid && message.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al enviar")
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje. Intenta más tarde.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setName(""); setEmail(""); setPhone(""); setMessage("")
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
        className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b" style={{ borderColor: "#E5E7EB" }}>
          <h2 className="text-xl font-bold" style={{ color: "#0A1830" }}>Contáctanos</h2>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
            aria-label="Cerrar"
          >
            <X size={18} style={{ color: "#6B7280" }} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle size={48} style={{ color: "#16A34A" }} />
              <p className="text-lg font-bold" style={{ color: "#0A1830" }}>¡Mensaje enviado!</p>
              <p className="text-sm" style={{ color: "#6B7280" }}>
                Recibimos tu mensaje y te responderemos a <strong>{email}</strong> a la brevedad.
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
                Completa el formulario y te responderemos lo antes posible.
              </p>

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                  Nombre completo
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
                  Teléfono <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
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

              {/* Mensaje */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                  Mensaje
                </label>
                <div className="relative">
                  <MessageSquare size={16} className="absolute left-3 top-3" style={{ color: "#9CA3AF" }} />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="¿En qué podemos ayudarte?"
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
                {isSubmitting ? "Enviando..." : "Enviar mensaje"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
