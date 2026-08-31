import type { MetadataRoute } from "next"
import { APP_URL } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Áreas privadas o transaccionales: no aportan nada en resultados de
      // búsqueda y consumen presupuesto de rastreo.
      //
      // /hotel-para-perros/ (ruta por uuid) NO va acá a propósito: se desindexa
      // con noindex, y para que Google lea esa etiqueta necesita poder entrar.
      disallow: [
        "/hotel/",
        "/booking/",
        "/confirmation/",
        "/mi-cuenta",
        "/mis-reservas",
        "/pets/",
        "/api/",
      ],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
