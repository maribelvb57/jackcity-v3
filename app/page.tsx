import type { Metadata } from "next"
import { Suspense } from "react"
import { SiteNavbar } from "@/components/site-navbar"
import { HeroHeader } from "@/components/hero-header"
import { SearchBar } from "@/components/search-bar"
import { HotelsDirectAccess } from "@/components/hotels-direct-access"
import { QuienesSomosSection } from "@/components/quienes-somos-section"
import { HowItWorks } from "@/components/how-it-works"
import { Testimonials } from "@/components/testimonials"
import { JackStoryCarousel } from "@/components/jack-story-carousel"
import { SiteFooter } from "@/components/site-footer"
import { JsonLd } from "@/components/json-ld"
import { APP_URL } from "@/lib/site-url"

// Los click-ids de campaña (?gclid=, ?fbclid=) y los parámetros de búsqueda
// generan muchas URLs para esta misma página: el canonical las consolida.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

/**
 * Identidad del sitio para Google: de acá salen el nombre y el logo que se
 * muestran en los resultados. Va en la home porque es la única página donde
 * Google espera encontrarlos. El @id permite que otros schemas del sitio
 * apunten a este mismo Organization en vez de repetirlo.
 *
 * Las URLs de redes deben coincidir con socialLinks de components/site-footer.tsx.
 */
function siteSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${APP_URL}/#organization`,
        name: "JackCity",
        url: APP_URL,
        logo: `${APP_URL}/images/dog-banner.png`,
        sameAs: [
          "https://www.instagram.com/jackcitycl/",
          "https://www.facebook.com/profile.php?id=61592932239251",
          "https://www.tiktok.com/@jackcitycl",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${APP_URL}/#website`,
        name: "JackCity",
        url: APP_URL,
        inLanguage: "es-CL",
        publisher: { "@id": `${APP_URL}/#organization` },
      },
    ],
  }
}

// Sección "Familias que confían en JackCity" (testimonios): oculta temporalmente.
// Para volver a mostrarla, cambiar este flag a true.
const SHOW_TESTIMONIALS: boolean = false

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <JsonLd data={siteSchema()} />
      <div className="w-full max-w-[1200px] flex flex-col">
        {/* Top navigation */}
        <SiteNavbar />

        {/* Section 1: Hero header */}
        <HeroHeader />

        {/* Section 2: Search bar (attached to header) */}
        <div id="buscar">
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>

        {/* Section 3: Acceso directo a las fichas de hotel */}
        <HotelsDirectAccess />

        {/* Section 4: Quiénes somos */}
        <QuienesSomosSection />

        {/* Section 5: How it works */}
        <HowItWorks />

        {/* Section 6: Testimonials — "Familias que confían en JackCity" (oculta: ver SHOW_TESTIMONIALS) */}
        {SHOW_TESTIMONIALS && <Testimonials />}

        {/* Section 7: Jack's Story Carousel */}
        <JackStoryCarousel />

        {/* Section 8: Footer */}
        <SiteFooter />
      </div>
    </main>
  )
}
