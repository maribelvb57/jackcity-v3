/**
 * Captura de identificadores de clic de campañas (Google Ads y Meta).
 *
 * Llegan como query params en la URL de aterrizaje y casi nunca vienen dos
 * juntos. Como el usuario rara vez reserva en la misma visita, se persisten en
 * una cookie propia para poder atribuir la conversión más adelante.
 */

export const CLICK_IDS_COOKIE = "jc_click_ids"

// gclid/wbraid/gbraid son de Google Ads (wbraid y gbraid aparecen cuando el
// usuario viene de iOS y no hay consentimiento para gclid); fbclid es de Meta.
export const CLICK_ID_PARAMS = ["gclid", "wbraid", "gbraid", "fbclid"] as const

export type ClickIdParam = (typeof CLICK_ID_PARAMS)[number]
export type ClickIds = Partial<Record<ClickIdParam, string>>

// Tope defensivo: la cookie completa no puede pasar los ~4KB del browser.
const MAX_VALUE_LENGTH = 512

// httpOnly porque sólo la lee el backend server-side en el checkout, nunca el cliente.
export const CLICK_IDS_COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 90, // 90 días
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
} as const

/**
 * Devuelve sólo los identificadores presentes en la URL, o null si no vino
 * ninguno (en ese caso el llamador no debe tocar cookies).
 */
export function readClickIdsFromUrl(searchParams: URLSearchParams): ClickIds | null {
  const clickIds: ClickIds = {}

  for (const param of CLICK_ID_PARAMS) {
    const value = searchParams.get(param)?.trim()
    if (!value) continue
    clickIds[param] = value.slice(0, MAX_VALUE_LENGTH)
  }

  return Object.keys(clickIds).length > 0 ? clickIds : null
}
