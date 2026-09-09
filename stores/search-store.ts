import { createStore } from "zustand/vanilla"
import type { DateRange } from "react-day-picker"
import { getDefaultDateRange } from "@/lib/booking-dates"
import { MESTIZO_BREED_CODE } from "@/lib/dog-breeds"
import { PET_SIZE_LABEL } from "@/lib/api/hotels"

export type Mascota = {
  raza: string
  tamano: string
  petId?: string | null
  // true solo mientras sea la mascota precargada por nosotros al abrir el
  // buscador. El usuario logueado con mascotas guardadas no la necesita: el
  // buscador la descarta y en su lugar marca su primera mascota.
  isDefault?: boolean
}

export type SearchState = {
  city: string
  dateRange: DateRange | undefined
  // true mientras dateRange sea el rango que precargamos nosotros y el usuario no
  // haya elegido fechas. El calendario lo usa para abrirse sin nada seleccionado:
  // partir de cero es más fácil que corregir un rango ya marcado.
  datesArePreset: boolean
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

// Mascota en blanco: la que se agrega con "Agregar otra mascota". Parte sin raza
// para que el usuario la elija a conciencia.
export const defaultMascota = (): Mascota => ({ raza: "Sin especificar", tamano: "" })

// Mascota precargada al abrir el buscador, para que la búsqueda funcione sin
// configurar nada. Mestizo no tiene tamaño inferible, así que el select de
// tamaño queda habilitado y el usuario puede corregirlo.
export const initialMascota = (): Mascota => ({
  raza: MESTIZO_BREED_CODE,
  tamano: PET_SIZE_LABEL.SMALL,
  isDefault: true,
})

// Es una función y no una constante: el rango de fechas depende del día de hoy,
// y un proceso de servidor vive lo suficiente como para servir fechas rancias si
// se calculara una sola vez al importar el módulo.
export const createDefaultSearchState = (): SearchState => ({
  city: "SANTIAGO",
  dateRange: getDefaultDateRange(),
  datesArePreset: true,
  needsTransport: false,
  // Sin comuna preseleccionada: el usuario debe elegirla explícitamente cuando
  // pide transporte (se valida al buscar).
  transportCommuneCode: "",
  transportCommune: "",
  mascotas: [initialMascota()],
})

export const createSearchStore = (initState: SearchState = createDefaultSearchState()) => {
  return createStore<SearchStore>()((set) => ({
    ...initState,
    setCity: (city) => set({ city }),
    setDateRange: (dateRange) => set({ dateRange, datesArePreset: false }),
    setNeedsTransport: (needsTransport) => set({ needsTransport }),
    toggleNeedsTransport: () => set((state) => ({ needsTransport: !state.needsTransport })),
    setTransportCommune: ({ communeCode, commune }) => set({ transportCommuneCode: communeCode, transportCommune: commune }),
    setMascotas: (updater) =>
      set((state) => ({
        mascotas: typeof updater === "function" ? updater(state.mascotas) : updater,
      })),
  }))
}
