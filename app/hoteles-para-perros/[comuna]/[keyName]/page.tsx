import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { HotelPublicPage } from "@/components/hotel-public-page"
import { JsonLd } from "@/components/json-ld"
import { fetchHotelPageByKey } from "@/lib/api/hotel-page"
import { buildHotelMetadata, HOTEL_NOT_FOUND_METADATA } from "@/lib/hotel-meta"
import { HOTEL_STATIC_PAGES } from "@/lib/hotel-static-pages"
import { getComunaPage } from "@/lib/comuna-pages"
import { APP_URL } from "@/lib/site-url"
import type { HotelPage } from "@/lib/api/hotel-page"

// Segundos de vida del prerender de la ruta. Debe ir como literal (Next lo lee
// estáticamente); mantener en sincronía con HOTEL_PAGE_REVALIDATE_SECONDS.
export const revalidate = 300

// Sólo existen las combinaciones de HOTEL_STATIC_PAGES: cualquier otro par
// comuna/slug responde 404 sin llegar al backend.
export const dynamicParams = false

interface PageProps {
  params: Promise<{ comuna: string; keyName: string }>
}

export function generateStaticParams() {
  return HOTEL_STATIC_PAGES.map(({ comuna, keyName }) => ({ comuna, keyName }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { comuna, keyName } = await params
  const hotel = await fetchHotelPageByKey(keyName)

  if (!hotel) return HOTEL_NOT_FOUND_METADATA

  return buildHotelMetadata(hotel, `/hoteles-para-perros/${comuna}/${keyName}`)
}

/** Ficha del hotel para Google: nombre, fotos, dirección y comuna. */
function hotelSchema(hotel: HotelPage, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: hotel.name,
    url,
    ...(hotel.description && { description: hotel.description }),
    ...(hotel.photos.length > 0 && { image: hotel.photos.map((photo) => photo.url) }),
    address: {
      "@type": "PostalAddress",
      ...(hotel.addressStreet && { streetAddress: hotel.addressStreet }),
      ...(hotel.commune && { addressLocality: hotel.commune }),
      addressCountry: "CL",
    },
  }
}

/** Migas: Inicio › Hoteles para perros en {comuna} › {hotel}. */
function breadcrumbSchema(hotelName: string, comuna: { slug: string; name: string } | null, url: string) {
  const items: Record<string, unknown>[] = [
    { "@type": "ListItem", position: 1, name: "Inicio", item: APP_URL },
  ]
  if (comuna) {
    items.push({
      "@type": "ListItem",
      position: 2,
      name: `Hoteles para perros en ${comuna.name}`,
      item: `${APP_URL}/hoteles-para-perros/${comuna.slug}`,
    })
  }
  items.push({ "@type": "ListItem", position: items.length + 1, name: hotelName, item: url })

  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items }
}

export default async function HotelStaticPage({ params }: PageProps) {
  const { comuna, keyName } = await params
  const hotel = await fetchHotelPageByKey(keyName)

  if (!hotel) notFound()

  const comunaPage = getComunaPage(comuna)
  const comunaLink = comunaPage ? { slug: comunaPage.slug, name: comunaPage.name } : null
  const url = `${APP_URL}/hoteles-para-perros/${comuna}/${keyName}`

  return (
    <>
      <JsonLd data={hotelSchema(hotel, url)} />
      <JsonLd data={breadcrumbSchema(hotel.name, comunaLink, url)} />
      <HotelPublicPage hotel={hotel} hotelKeyName={keyName} comuna={comunaLink ?? undefined} />
    </>
  )
}
