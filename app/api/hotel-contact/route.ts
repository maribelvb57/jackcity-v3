import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Servicio de correo no configurado." }, { status: 503 })
    }

    const { hotelName, comuna, name, email, phone, website, message } = await req.json()

    if (!hotelName?.trim() || !comuna?.trim() || !name?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 })
    }

    const resend = new Resend(apiKey)

    const { data, error } = await resend.emails.send({
      from: "JackCity Hoteles <contacto@jackcity.cl>",
      to: ["staff@jackcity.cl", "maribel@jackcity.cl", "hoteles@jackcity.cl"],
      replyTo: email.trim(),
      subject: `Nuevo hotel interesado — ${hotelName.trim()}`,
      text: [
        "Un hotel quiere sumarse a JackCity.cl",
        "",
        `Hotel:    ${hotelName.trim()}`,
        `Comuna:   ${comuna.trim()}`,
        `Contacto: ${name.trim()}`,
        `Email:    ${email.trim()}`,
        `Teléfono: ${phone.trim()}`,
        `IG / web: ${website?.trim() || "No indicado"}`,
        "",
        "Sobre el hotel:",
        message?.trim() || "No indicado",
        "",
        "---",
        "Este mensaje fue enviado desde jackcity.cl",
      ].join("\n"),
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Email enviado, id:", data?.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Hotel contact route error:", err)
    return NextResponse.json({ error: "No se pudo enviar tu solicitud. Intenta más tarde." }, { status: 500 })
  }
}
