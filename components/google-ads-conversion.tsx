"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

// Fragmento de evento de conversión de Google Ads. Se apoya en la etiqueta base
// (gtag.js + config AW-18437004301) que carga app/layout.tsx: acá sólo se
// dispara el evento, la etiqueta no se vuelve a cargar ni a configurar.
const CONVERSION_SEND_TO = "AW-18437004301/aV3FCP3g5vAcEI24uddE"

// La etiqueta base va con strategy="afterInteractive": puede no haber corrido
// todavía cuando este efecto se ejecuta en la primera carga. Se reintenta un
// rato corto en vez de perder esa conversión.
const RETRY_MS = 250
const MAX_ATTEMPTS = 20

type WindowWithGtag = Window & {
  gtag?: (...args: unknown[]) => void
}

/**
 * Dispara el evento de conversión en cada vista de página.
 *
 * La conversión mide vistas de página (alcance y tráfico al sitio), no
 * reservas: es intencional que cuente en todas las rutas.
 *
 * La navegación del App Router es client-side: el layout no se vuelve a montar,
 * así que una llamada suelta allá sólo cubriría la primera carga. Este
 * componente reacciona al pathname para cubrir también cada navegación.
 *
 * Sólo mira el pathname, no el querystring: useSearchParams obligaría a un
 * Suspense boundary o degradaría la página a client-side rendering.
 */
export function GoogleAdsConversion() {
  const pathname = usePathname()

  useEffect(() => {
    let timer: number | undefined

    function fire(attempt: number) {
      const gtag = (window as WindowWithGtag).gtag

      if (typeof gtag === "function") {
        gtag("event", "conversion", {
          send_to: CONVERSION_SEND_TO,
          value: 1.0,
          currency: "CLP",
        })
        return
      }

      // Si la etiqueta base nunca aparece (adblocker, error de red), se
      // abandona en silencio: no tiene sentido reintentar para siempre.
      if (attempt >= MAX_ATTEMPTS) return
      timer = window.setTimeout(() => fire(attempt + 1), RETRY_MS)
    }

    fire(0)

    return () => {
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [pathname])

  return null
}
