import type { MetadataRoute } from "next"
import { APP_URL } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Todo lo público queda rastreable, incluidas las landings de SEO:
      // /hotel-para-perros (la de Santiago) y /hoteles-para-perros/*.
      allow: "/",
      // Áreas privadas o transaccionales: no aportan nada en resultados de
      // búsqueda y consumen presupuesto de rastreo.
      //
      // Las fichas por uuid, /hotel-para-perros/{id}, tampoco van acá a
      // propósito: se desindexan con noindex, y para que Google lea esa etiqueta
      // necesita poder entrar. Ojo que cuelgan de la landing de arriba, que sí
      // se indexa: por eso no se puede bloquear esa raíz.
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
