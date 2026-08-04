"use client"

import { ShieldCheck, AlertCircle } from "lucide-react"
import { CANCELLATION_POLICY_FLEXIBLE, type CancellationPolicy } from "@/lib/api/hotels"

// Tramos de la política STRICT. El color señala cuánto se retiene en cada tramo,
// de menor a mayor, para que la escalada se lea sin tener que comparar los textos.
const STRICT_TIERS = [
  { text: "Hasta 7 días antes del check-in: se retiene un 30%.", color: "#F59E0B" },
  { text: "Entre 7 y 2 días antes del check-in: se retiene un 50%.", color: "#EA7C1F" },
  { text: "A menos de 2 días del check-in: la reserva no es reembolsable.", color: "#DC2626" },
]

// Distintivo de la política. Mismo verde que la pill de la lista de resultados,
// para que quien filtró por "cancelación flexible" reconozca la marca.
export function CancellationPolicyBadge({ policy }: { policy: CancellationPolicy }) {
  const isFlexible = policy === CANCELLATION_POLICY_FLEXIBLE

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={
        isFlexible
          ? { backgroundColor: "#EEF7F2", borderColor: "#CBE5D7", color: "#15803D" }
          : { backgroundColor: "#FFF7E6", borderColor: "#F5DDA8", color: "#96620B" }
      }
    >
      {isFlexible ? (
        <ShieldCheck size={13} strokeWidth={2.2} style={{ flexShrink: 0 }} />
      ) : (
        <AlertCircle size={13} strokeWidth={2.2} style={{ flexShrink: 0 }} />
      )}
      {isFlexible ? "Flexible" : "Por tramos"}
    </span>
  )
}

// Sólo el texto de la política, sin card ni título: sirve dentro de un modal
// o de cualquier contenedor que ya aporte su propio marco.
export function CancellationPolicyBody({ policy }: { policy: CancellationPolicy }) {
  if (policy === CANCELLATION_POLICY_FLEXIBLE) {
    return (
      <p className="text-sm leading-relaxed" style={{ color: "#333" }}>
        Puedes cancelar sin ningún costo hasta las 5pm dos días antes de tu check-in, con el
        reembolso completo del total abonado. Si cancelas después de ese momento, se retiene un 30%
        del valor total de la reserva en concepto de penalización.
      </p>
    )
  }

  return (
    <>
      <p className="text-sm leading-relaxed mb-3" style={{ color: "#333" }}>
        Este hotel maneja una política de cancelación por tramos, calculada sobre el valor total
        de la reserva:
      </p>
      <ul className="flex flex-col gap-2">
        {STRICT_TIERS.map((tier) => (
          <li key={tier.text} className="flex items-start gap-2.5 text-sm" style={{ color: "#333" }}>
            <span
              className="rounded-full flex-shrink-0"
              style={{ backgroundColor: tier.color, width: 7, height: 7, marginTop: 7 }}
            />
            <span className="leading-relaxed">{tier.text}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

type CancellationPolicySectionProps = {
  policy: CancellationPolicy
  className?: string
}

export function CancellationPolicySection({ policy, className }: CancellationPolicySectionProps) {
  return (
    <div className={`bg-white rounded-2xl p-5 border ${className ?? ""}`} style={{ borderColor: "#E5E7EB" }}>
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-lg font-bold" style={{ color: "#0A1830" }}>Política de Cancelación</h2>
        <CancellationPolicyBadge policy={policy} />
      </div>
      <CancellationPolicyBody policy={policy} />
    </div>
  )
}
