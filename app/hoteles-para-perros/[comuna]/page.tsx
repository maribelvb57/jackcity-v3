import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Tag, Lightbulb, HelpCircle, PawPrint } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { JsonLd } from "@/components/json-ld"
import { HotelStaticCard } from "@/components/hotel-static-card"
import { COMUNA_PAGES, getComunaPage } from "@/lib/comuna-pages"
import type { ComunaPage as ComunaPageData, ComunaSectionIcon } from "@/lib/comuna-pages"
import { APP_URL } from "@/lib/site-url"

// Ícono de cada sección: el contenido guarda el nombre y acá se resuelve al
// componente, para que lib/comuna-pages.ts siga siendo datos y no JSX.
const SECTION_ICONS: Record<ComunaSectionIcon, typeof Tag> = {
  price: Tag,
  tips: Lightbulb,
}

// Acento de los íconos que acompañan a los títulos: el mismo verde agua con el
// que los mapas destacan la comuna, para que la página se lea como un conjunto.
const ICON_COLOR = "#17B4A0"

interface PageProps {
  params: Promise<{ comuna: string }>
}

// Sólo existen las comunas de COMUNA_PAGES: cualquier otro slug responde 404.
export const dynamicParams = false

export function generateStaticParams() {
  return COMUNA_PAGES.map(({ slug }) => ({ comuna: slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { comuna } = await params
  const page = getComunaPage(comuna)

  if (!page) return { title: "Comuna no encontrada", robots: { index: false, follow: false } }

  const canonical = `/hoteles-para-perros/${page.slug}`
  const description = page.intro[0]
  // Al compartir el enlace se muestra la foto del hotel destacado de la comuna.
  const cover = page.hotels[0]?.imageUrl

  return {
    title: page.title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: canonical,
      title: page.title,
      description,
      ...(cover && { images: [{ url: cover, alt: page.title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description,
      ...(cover && { images: [cover] }),
    },
  }
}

/** FAQPage: habilita las preguntas desplegables en los resultados de Google. */
function faqSchema(page: ComunaPageData) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  }
}

/** Migas: Inicio › Hoteles para perros en {comuna}. */
function breadcrumbSchema(page: ComunaPageData) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: APP_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: page.title,
        item: `${APP_URL}/hoteles-para-perros/${page.slug}`,
      },
    ],
  }
}

export default async function ComunaPage({ params }: PageProps) {
  const { comuna } = await params
  const page = getComunaPage(comuna)

  if (!page) notFound()

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <JsonLd data={faqSchema(page)} />
      <JsonLd data={breadcrumbSchema(page)} />
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />

        <div className="w-full px-4 pt-4 pb-16 md:px-6 md:pt-6 md:pb-24">
          <article className="flex flex-col gap-4 lg:w-3/4">
            <header>
              <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "#0A1830" }}>
                {page.title}
              </h1>
              {page.intro.map((paragraph, index) => (
                <p key={index} className="text-sm leading-relaxed mb-3" style={{ color: "#333" }}>
                  {paragraph}
                </p>
              ))}
            </header>

            {/* Secciones de contenido con el mapa compartiendo la columna derecha. */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
              <div className="flex flex-col gap-4 lg:flex-1">
                {page.sections.map((section) => {
                  const SectionIcon = section.icon ? SECTION_ICONS[section.icon] : null
                  return (
                  <section
                    key={section.heading}
                    className="bg-white rounded-2xl p-5 border"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <h2 className="flex items-center gap-2 text-lg font-bold mb-3" style={{ color: "#0A1830" }}>
                      {SectionIcon && (
                        <SectionIcon size={19} strokeWidth={2} style={{ color: ICON_COLOR, flexShrink: 0 }} aria-hidden="true" />
                      )}
                      {section.heading}
                    </h2>
                    {section.paragraphs.map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-sm leading-relaxed"
                        style={{ color: "#333", marginTop: index > 0 ? "0.75rem" : 0 }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </section>
                  )
                })}
              </div>

              {page.map && (
                <figure
                  className="bg-white rounded-2xl p-4 border lg:w-[38%] lg:flex-shrink-0"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <Image
                    src={page.map.src}
                    alt={page.map.alt}
                    width={page.map.width}
                    height={page.map.height}
                    className="h-auto w-full rounded-xl"
                    sizes="(max-width: 1024px) 100vw, 380px"
                  />
                  {page.map.caption && (
                    <figcaption className="mt-3 text-xs text-center" style={{ color: "#6B7280" }}>
                      {page.map.caption}
                    </figcaption>
                  )}
                </figure>
              )}
            </div>

            <section className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="flex items-center gap-2 text-lg font-bold mb-3" style={{ color: "#0A1830" }}>
                <HelpCircle size={19} strokeWidth={2} style={{ color: ICON_COLOR, flexShrink: 0 }} aria-hidden="true" />
                Preguntas frecuentes
              </h2>
              <dl className="flex flex-col gap-4">
                {page.faqs.map((faq) => (
                  <div key={faq.question}>
                    <dt className="text-sm font-semibold mb-1" style={{ color: "#0A1830" }}>
                      {faq.question}
                    </dt>
                    <dd className="text-sm leading-relaxed" style={{ color: "#333" }}>
                      {faq.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {page.hotels.length > 0 && (
              // Se separa del bloque de contenido: abre la sección de hoteles.
              <section className="flex flex-col gap-4 mt-6 md:mt-8">
                <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "#0A1830" }}>
                  <PawPrint size={19} strokeWidth={2} style={{ color: ICON_COLOR, flexShrink: 0 }} aria-hidden="true" />
                  Hoteles en {page.name}
                </h2>
                {page.hotels.map((card) => (
                  <HotelStaticCard key={card.detailUrl} card={card} />
                ))}
              </section>
            )}
          </article>
        </div>

        <SiteFooter />
      </div>
    </main>
  )
}
