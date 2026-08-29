import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { HotelPublicPage } from "@/components/hotel-public-page"
import { fetchHotelPage } from "@/lib/api/hotel-page"
import { buildHotelMetadata, HOTEL_NOT_FOUND_METADATA } from "@/lib/hotel-meta"

// Segundos de vida del prerender de la ruta. Debe ir como literal (Next lo lee
// estáticamente); mantener en sincronía con HOTEL_PAGE_REVALIDATE_SECONDS.
export const revalidate = 300

interface PageProps {
  params: Promise<{ hotelId: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { hotelId } = await params
  const hotel = await fetchHotelPage(hotelId)

  if (!hotel) return HOTEL_NOT_FOUND_METADATA

  // Esta ruta muestra la misma ficha que /hoteles-para-perros/{comuna}/{slug}.
  // Se deja fuera del índice para no competir consigo misma; follow queda activo
  // para que Google siga sus enlaces internos.
  return {
    ...buildHotelMetadata(hotel, `/hotel-para-perros/${hotelId}`),
    robots: { index: false, follow: true },
  }
}

export default async function HotelByIdPage({ params }: PageProps) {
  const { hotelId } = await params
  const hotel = await fetchHotelPage(hotelId)

  if (!hotel) notFound()

  return <HotelPublicPage hotel={hotel} />
}
