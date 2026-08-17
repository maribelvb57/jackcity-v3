import { createStore } from "zustand/vanilla"
import type { DateRange } from "react-day-picker"

export type Mascota = {
  raza: string
  tamano: string
  petId?: string | null
}

export type SearchState = {
  city: string
  dateRange: DateRange | undefined
  needsTransport: boolean
  transportCommuneCode: string
  transportCommune: string
  mascotas: Mascota[]
}

export type SearchActions = {
  setCity: (city: string) => void
  setDateRange: (dateRange: DateRange | undefined) => void
  setNeedsTransport: (needsTransport: boolean) => void
  toggleNeedsTransport: () => void
  setTransportCommune: (commune: { communeCode: string; commune: string }) => void
  setMascotas: (updater: Mascota[] | ((prev: Mascota[]) => Mascota[])) => void
}

export type SearchStore = SearchState & SearchActions

export const defaultMascota = (): Mascota => ({ raza: "Sin especificar", tamano: "" })

export const defaultSearchState: SearchState = {
  city: "SANTIAGO",
  dateRange: undefined,
  needsTransport: false,
  // Sin comuna preseleccionada: el usuario debe elegirla explícitamente cuando
  // pide transporte (se valida al buscar).
  transportCommuneCode: "",
  transportCommune: "",
  mascotas: [defaultMascota()],
}

export const createSearchStore = (initState: SearchState = defaultSearchState) => {
  return createStore<SearchStore>()((set) => ({
    ...initState,
    setCity: (city) => set({ city }),
    setDateRange: (dateRange) => set({ dateRange }),
    setNeedsTransport: (needsTransport) => set({ needsTransport }),
    toggleNeedsTransport: () => set((state) => ({ needsTransport: !state.needsTransport })),
    setTransportCommune: ({ communeCode, commune }) => set({ transportCommuneCode: communeCode, transportCommune: commune }),
    setMascotas: (updater) =>
      set((state) => ({
        mascotas: typeof updater === "function" ? updater(state.mascotas) : updater,
      })),
  }))
}
