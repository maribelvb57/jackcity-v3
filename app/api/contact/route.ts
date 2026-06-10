import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Servicio de correo no configurado." }, { status: 503 })
    }

    const { name, email, phone, message } = await req.json()

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 })
    }

    const resend = new Resend(apiKey)

    const { data, error } = await resend.emails.send({
      from: "JackCity Contacto <contacto@jackcity.cl>",
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

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("Email enviado, id:", data?.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Contact route error:", err)
    return NextResponse.json({ error: "No se pudo enviar el mensaje. Intenta más tarde." }, { status: 500 })
  }
}
