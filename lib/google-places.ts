// Autocompletado de direcciones con Google Places (usado en la confirmación de reserva).
// El script se carga una sola vez por sesión de navegador y se reutiliza entre pantallas.

export type GoogleAddressComponent = {
  long_name: string
  short_name: string
  types: string[]
}

export type GooglePlaceResult = {
  address_components?: GoogleAddressComponent[]
  geometry?: unknown
  name?: string
}

export type GoogleMapsAutocomplete = {
  addListener: (eventName: "place_changed", handler: () => void) => { remove: () => void }
  getPlace: () => GooglePlaceResult
}

export type GoogleMapsWindow = Window & {
  google?: {
    maps?: {
      places?: {
        Autocomplete: new (
          input: HTMLInputElement,
          options: {
            componentRestrictions?: { country: string }
            fields: string[]
            types: string[]
          }
        ) => GoogleMapsAutocomplete
      }
      event?: {
        clearInstanceListeners: (instance: GoogleMapsAutocomplete) => void
      }
    }
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-places-script"
let googleMapsScriptPromise: Promise<void> | null = null

export function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  const googleWindow = window as GoogleMapsWindow
  if (googleWindow.google?.maps?.places) return Promise.resolve()
  if (googleMapsScriptPromise) return googleMapsScriptPromise

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true })
      existingScript.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps.")), { once: true })
      return
    }
    const script = document.createElement("script")
    const params = new URLSearchParams({ key: apiKey, libraries: "places", language: "es", region: "CL" })
    script.id = GOOGLE_MAPS_SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true
    script.defer = true
    script.addEventListener("load", () => resolve(), { once: true })
    script.addEventListener("error", () => reject(new Error("No se pudo cargar Google Maps.")), { once: true })
    document.head.appendChild(script)
  })
  return googleMapsScriptPromise
}

function getAddressComponent(place: GooglePlaceResult, componentType: string, shortName = false): string {
  const component = place.address_components?.find((item) => item.types.includes(componentType))
  if (!component) return ""
  return shortName ? component.short_name : component.long_name
}

export function parseGoogleAddress(place: GooglePlaceResult) {
  const streetNumber = getAddressComponent(place, "street_number", true)
  const route = getAddressComponent(place, "route")
  const commune =
    getAddressComponent(place, "administrative_area_level_3") ||
    getAddressComponent(place, "locality") ||
    getAddressComponent(place, "sublocality_level_1") ||
    getAddressComponent(place, "sublocality")
  const city =
    getAddressComponent(place, "administrative_area_level_2") ||
    getAddressComponent(place, "locality") ||
    commune
  const displayAddress = [route, streetNumber].filter(Boolean).join(" ") || place.name || ""
  return {
    displayAddress,
    street: route || place.name || "",
    streetNumber,
    commune,
    city,
    country: getAddressComponent(place, "country"),
  }
}

// Comparación tolerante a tildes/mayúsculas para contrastar la comuna de la dirección
// elegida con la comuna usada para cotizar el transporte.
export function normalizeCommuneName(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim()
}
