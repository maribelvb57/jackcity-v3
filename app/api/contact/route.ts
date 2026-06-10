import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { name, email, phone, message } = await req.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 })
    }

    await resend.emails.send({
      from: "JackCity Contacto <onboarding@resend.dev>",
      to: "contacto@jackcity.cl",
      replyTo: email.trim(),
      subject: `Nuevo mensaje de contacto — ${name.trim()}`,
      text: [
        "Nuevo mensaje recibido desde el formulario de contacto de JackCity.cl",
        "",
        `Nombre:   ${name.trim()}`,
        `Email:    ${email.trim()}`,
        `Teléfono: ${phone?.trim() || "No indicado"}`,
        "",
        "Mensaje:",
        message.trim(),
        "",
        "---",
        "Este mensaje fue enviado desde jackcity.cl",
      ].join("\n"),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "No se pudo enviar el mensaje. Intenta más tarde." }, { status: 500 })
  }
}
