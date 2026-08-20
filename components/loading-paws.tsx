"use client"

import { PawPrint } from "lucide-react"

const PAW_COLORS = ["#FFC43D", "#28548f", "#FFC43D"]

export function LoadingPaws({ size = 14 }: { size?: number }) {
  return (
    <span className="flex items-center gap-0.5 flex-shrink-0" aria-hidden="true">
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
