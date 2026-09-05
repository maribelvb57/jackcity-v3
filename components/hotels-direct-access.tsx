import Image from "next/image"
import Link from "next/link"
import { ArrowRight, PawPrint } from "lucide-react"
import { formatClp } from "@/lib/format"
import { HOTEL_STATIC_PAGES } from "@/lib/hotel-static-pages"

/**
 * Acceso directo a las fichas de hotel desde el home, debajo del buscador.
 *
 * Los precios son "desde" escritos a mano, igual que en las landings por comuna:
 * no vienen del API porque acá no hay búsqueda (ni fechas ni mascotas) con la
 * cual pedir una tarifa real. Cuando el home consulte tarifas, esto debería
 * pasar a leerlas en vez de mantenerlas duplicadas.
 *
 * Las rutas salen de HOTEL_STATIC_PAGES para no duplicar los slugs: esa lista
 * es la que define qué pares comuna/keyName existen, así que si un hotel se da
 * de baja allá, acá falla en build y no queda un link roto en producción.
 */
type HotelCard = {
  keyName: string
  name: string
  comunaLabel: string
  pricePerNight: number
  image: string
}

const HOTEL_CARDS: HotelCard[] = [
  {
    keyName: "hotel-campestre",
    name: "Hotel Campestre",
    comunaLabel: "Peñaflor",
    pricePerNight: 16900,
    image: "/images/hotels/cards-3-2/campestre.jpg",
  },
  {
    keyName: "hotel-canino-mantra",
    name: "Hotel Mantra",
    comunaLabel: "Colina",
    pricePerNight: 17000,
    image: "/images/hotels/cards-3-2/mantra.jpg",
  },
  {
    keyName: "peluditos",
    name: "Peluditos",
    comunaLabel: "Santiago Centro",
    pricePerNight: 15000,
    image: "/images/hotels/cards-3-2/peluditos.jpg",
  },
  {
    keyName: "la-guarderia-de-bruno",
    name: "La Guardería de Bruno",
    comunaLabel: "La Florida",
    pricePerNight: 20000,
    image: "/images/hotels/cards-3-2/bruno.jpg",
  },
  {
    keyName: "perry-lodge",
    name: "Perry Lodge",
    comunaLabel: "Pirque",
    pricePerNight: 20000,
    image: "/images/hotels/cards-3-2/perry.jpg",
  },
  {
    keyName: "el-patio-guarderia",
    name: "El Patio Guardería",
    comunaLabel: "Chicureo",
    pricePerNight: 17500,
    image: "/images/hotels/cards-3-2/patio.jpg",
  },
]

function hotelHref(keyName: string) {
  const page = HOTEL_STATIC_PAGES.find((p) => p.keyName === keyName)
  if (!page) {
    throw new Error(
      `hotels-direct-access: "${keyName}" no está en HOTEL_STATIC_PAGES, la ruta daría 404.`,
    )
  }
  return `/hoteles-para-perros/${page.comuna}/${page.keyName}`
}

export function HotelsDirectAccess() {
  return (
    <section className="flex items-center justify-center">
      <div className="w-full max-w-[1200px] bg-white px-4 pb-12 pt-6 sm:px-6 md:pb-16 md:pt-8 lg:px-10">
        <div className="mb-8">
          <p
            className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em]"
            style={{ backgroundColor: "#FEF9E7", color: "#061B3A" }}
          >
            <PawPrint size={13} style={{ color: "#F5B000" }} aria-hidden="true" />
            Hoteles destacados
          </p>

          <h2
            className="text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl"
            style={{ color: "#061B3A" }}
          >
            Sus próximas <span style={{ color: "#F5B000" }}>vacaciones</span>{" "}
            empiezan aquí
          </h2>

          <p
            className="mt-3 max-w-[680px] text-sm font-medium leading-6 sm:text-base"
            style={{ color: "#28384F" }}
          >
            Conoce algunos de los hoteles caninos más populares de Santiago y
            encuentra el lugar perfecto para tu mejor amigo.
          </p>
        </div>

        <ul className="grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {HOTEL_CARDS.map((hotel) => (
            <li key={hotel.keyName}>
              <article
                className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm"
                style={{ borderColor: "#E2E8F0" }}
              >
                <div className="relative aspect-[3/2] w-full">
                  <Image
                    src={hotel.image}
                    alt={`${hotel.name}, hotel para perros en ${hotel.comunaLabel}`}
                    fill
                    sizes="(min-width: 1024px) 373px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-1 flex-col p-4">
                  {/* Nombre y comuna a la izquierda, precio a la derecha, con un
                      divisor entre ambos como en el diseño de referencia. */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3
                        className="truncate text-lg font-bold leading-tight"
                        style={{ color: "#1E56A0" }}
                      >
                        {hotel.name}
                      </h3>
                      <p className="mt-1 text-sm" style={{ color: "#526071" }}>
                        {hotel.comunaLabel}
                      </p>
                    </div>

                    <div
                      className="flex-shrink-0 border-l pl-3 text-right"
                      style={{ borderColor: "#E2E8F0" }}
                    >
                      <p className="text-xs leading-none" style={{ color: "#8A94A6" }}>
                        Desde
                      </p>
                      <p
                        className="mt-1 text-xl font-bold leading-none"
                        style={{ color: "#0A1830" }}
                      >
                        {formatClp(hotel.pricePerNight)}
                      </p>
                      <p className="mt-1 text-xs leading-none" style={{ color: "#8A94A6" }}>
                        por noche
                      </p>
                    </div>
                  </div>

                  <Link
                    href={hotelHref(hotel.keyName)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-bold transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}
                  >
                    Ver hotel
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
