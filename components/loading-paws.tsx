"use client"

import { PawPrint } from "lucide-react"

const PAW_COLORS = ["#FFC43D", "#28548f", "#FFC43D"]

export function LoadingPaws({ size = 18 }: { size?: number }) {
  // Con la inclinacion de +-14 grados las huellas se rozan al crecer
  const gap = size >= 20 ? 4 : size >= 18 ? 3 : 2

  return (
    <span className="flex items-center flex-shrink-0" style={{ gap }} aria-hidden="true">
      {PAW_COLORS.map((color, i) => (
        <PawPrint
          key={i}
          size={size}
          className="animate-pulse"
          fill={color}
          style={{
            color,
            animationDelay: `${i * 200}ms`,
            transform: i % 2 === 0 ? "rotate(-14deg)" : "rotate(14deg)",
          }}
        />
      ))}
    </span>
  )
}
