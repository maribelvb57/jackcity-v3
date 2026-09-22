import type { Metadata } from "next"

// La URL lleva el bookingId: no debe indexarse ni aparecer en buscadores.
export const metadata: Metadata = {
  title: "Calificar reserva",
  robots: { index: false, follow: false },
}

export default function CalificarLayout({ children }: { children: React.ReactNode }) {
  return children
}
