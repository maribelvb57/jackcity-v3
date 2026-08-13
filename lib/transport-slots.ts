export type TransportSlot = "AM" | "MD" | "PM"

export const SLOT_LABEL: Record<TransportSlot, string> = {
  AM: "Mañana (AM)",
  MD: "Mediodía (MD)",
  PM: "Tarde (PM)",
}

export const SLOT_TIME: Record<TransportSlot, string> = {
  AM: "9am a 12m",
  MD: "12m a 3pm",
  PM: "3pm a 6pm",
}

// Orden cronológico de los tramos; los slots desconocidos quedan al final.
const SLOT_ORDER: TransportSlot[] = ["AM", "MD", "PM"]

export function sortSlots(slots: string[]): string[] {
  return [...slots].sort((a, b) => {
    const ia = SLOT_ORDER.indexOf(a as TransportSlot)
    const ib = SLOT_ORDER.indexOf(b as TransportSlot)
    return (ia === -1 ? SLOT_ORDER.length : ia) - (ib === -1 ? SLOT_ORDER.length : ib)
  })
}

export function slotTime(slot: string): string {
  return SLOT_TIME[slot as TransportSlot] ?? slot
}

export function slotLabel(slot: string): string {
  return SLOT_LABEL[slot as TransportSlot] ?? slot
}
