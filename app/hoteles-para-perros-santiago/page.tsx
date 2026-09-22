import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { MapPin, Tag, Lightbulb, CalendarCheck, HelpCircle, PawPrint } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { JsonLd } from "@/components/json-ld"
import { HotelStaticCard } from "@/components/hotel-static-card"
import type { ComunaHotelCard } from "@/lib/comuna-pages"
import { APP_URL } from "@/lib/site-url"

/**
 * Landing de ciudad: /hoteles-para-perros-santiago.
 *
 * A diferencia de /hoteles-para-perros/{comuna}, esta página no es dinámica: la
 * ruta está escrita a mano y el contenido vive acá mismo, porque es una sola
 * página y su texto lleva enlaces internos a las landings de comuna (que en un
 * archivo de datos de puros strings no se podrían escribir).
 */

// La ruta, en un solo lugar: la usan el canonical y los datos estructurados.
const PATH = "/hoteles-para-perros-santiago"
const TITLE = "Hoteles para perros en Santiago"
const DESCRIPTION =
  "Hoteles y guarderías para perros en Santiago: compara opciones por comuna, revisa precios desde CLP 15.000 la noche y reserva en línea con JackCity."

// Mismo verde agua que las landings por comuna, para que se lean como una familia.
const ICON_COLOR = "#17B4A0"

// width/height son las medidas reales del archivo: Next las usa para reservar el
// espacio antes de cargarlo y evitar que el texto salte.
const MAP = {
  src: "/images/mapas/santiago.jpg",
  alt: "Mapa de Santiago y sus comunas, con el aeropuerto Arturo Merino Benítez al norponiente",
  width: 1306,
  height: 1204,
  caption: "Santiago y sus comunas, con el aeropuerto al norponiente.",
}

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: "website",
    url: PATH,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "JackCity - hoteles para perros en Santiago",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/images/og-image.jpg"],
  },
}

/** Enlace dentro del cuerpo del texto. */
function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="underline underline-offset-2 font-medium transition-opacity hover:opacity-75"
      style={{ color: "#1E56A0" }}
    >
      {children}
    </Link>
  )
}

/** Enlace a una landing de comuna desde el cuerpo del texto. */
function ComunaLink({ slug, children }: { slug: string; children: React.ReactNode }) {
  return <TextLink href={`/hoteles-para-perros/${slug}`}>{children}</TextLink>
}

const FAQS = [
  {
    question: "¿Cuánto cuesta dejar un perro en Santiago?",
    answer: "Desde ~CLP 15.000 la noche, variando por comuna, tamaño y servicios.",
  },
  {
    question: "¿Qué necesito para hospedar a mi perro?",
    answer:
      "Generalmente el carnet de vacunas al día. Cada hotel confirma su documentación al momento de reservar.",
  },
  {
    question: "¿Puedo reservar solo unos días?",
    answer: "Sí, eliges las fechas exactas que necesitas y pagas una seña para confirmar.",
  },
  {
    question: "¿Hay hospedaje cerca del aeropuerto?",
    answer: "Sí, comunas del norte como Colina están a pocos minutos del aeropuerto.",
  },
]

/**
 * Los seis hoteles de Santiago, agrupados por zona igual que el texto de arriba.
 * Los datos van escritos a mano (no vienen de una búsqueda), como en las
 * landings por comuna: acá no hay fechas ni mascotas con las cuales pedir una
 * tarifa real al API.
 */
type Zone = {
  heading: string
  comunaSlug: string
  hotels: ComunaHotelCard[]
}

const ZONES: Zone[] = [
  {
    heading: "Santiago Centro",
    comunaSlug: "santiago-centro",
    hotels: [
      {
        name: "Peluditos",
        imageUrl:
          "https://res.cloudinary.com/jack-city-images/image/upload/f_auto,q_auto,w_1200/prod/hotels/peluditos/image-000",
        address: "Santiago",
        features: [
          "Atención personalizada las 24 horas del día, siempre acompañados por sus cuidadores de día y de noche",
          "Reportes diarios, incluyendo fotos y/o videos",
          "Sin jaulas ni caniles",
        ],
        price: 15000,
        priceLabel: "Precios desde",
        // El hotel tiene política estricta: no se muestra el sello de cancelación flexible.
        flexibleCancellation: false,
        detailUrl: "/hoteles-para-perros/santiago-centro/peluditos",
      },
    ],
  },
  {
    heading: "Sur oriente: La Florida y Pirque",
    comunaSlug: "la-florida",
    hotels: [
      {
        name: "La Guardería de Bruno",
        imageUrl:
          "https://res.cloudinary.com/jack-city-images/image/upload/f_auto,q_auto,w_1200/prod/hotels/bruno/bruno-card",
        address: "La Florida",
        features: [
          "Libre tránsito y sin caniles",
          "Reportes con fotos y videos de su día en tiempo real",
          "Cupos limitados para atención personalizada",
        ],
        price: 20000,
        flexibleCancellation: true,
        detailUrl: "/hoteles-para-perros/la-florida/la-guarderia-de-bruno",
      },
      {
        name: "Perry Lodge",
        imageUrl:
          "https://res.cloudinary.com/jack-city-images/image/upload/f_auto,q_auto,w_1200/prod/hotels/perry/perry-001",
        address: "Pirque",
        features: [
          "+10 años de experiencia y +3.000 huéspedes felices",
          "28 espacios individuales al interior del hotel, seguros y climatizados",
          "Patios para jugar y socializar bajo supervisión permanente",
        ],
        price: 20000,
        priceLabel: "Precios desde",
        flexibleCancellation: true,
        detailUrl: "/hoteles-para-perros/pirque/perry-lodge",
      },
    ],
  },
  {
    heading: "Norte: Colina y Chicureo",
    comunaSlug: "colina",
    hotels: [
      {
        name: "Hotel Mantra",
        imageUrl:
          "https://res.cloudinary.com/jack-city-images/image/upload/f_auto,q_auto,w_1200/prod/hotels/mantra/mantra-001",
        address: "Colina",
        features: [
          "Libres durante el día — perritos socializando en manada, supervisados y separados por tamaño y perfil",
          "Atención veterinaria propia — cuidado profesional en el lugar",
          "Hotel tipo boutique — cupos limitados para una atención focalizada",
        ],
        price: 17000,
        priceLabel: "Precios desde",
        flexibleCancellation: true,
        detailUrl: "/hoteles-para-perros/colina/hotel-canino-mantra",
      },
      {
        name: "El Patio guardería",
        imageUrl:
          "https://res.cloudinary.com/jack-city-images/image/upload/f_auto,q_auto,w_1200/prod/hotels/patio/patio-001",
        address: "Colina",
        features: [
          "Modalidad libre durante el día — perros sueltos y sociabilizando, agrupados por tamaño, carácter y necesidades",
          "8 patios grupales + 4 patios individuales",
          "Cámaras de seguridad 24/7",
        ],
        price: 17000,
        priceLabel: "Precios desde",
        flexibleCancellation: true,
        detailUrl: "/hoteles-para-perros/chicureo/el-patio-guarderia",
      },
    ],
  },
  {
    heading: "Poniente: Peñaflor",
    comunaSlug: "penaflor",
    hotels: [
      {
        name: "Hotel Campestre para Perros",
        imageUrl:
          "https://res.cloudinary.com/jack-city-images/image/upload/f_auto,q_auto,w_1200/prod/hotels/campestre/campestre-001",
        address: "Peñaflor",
        features: [
          "Caniles individuales de gran tamaño y grupales, según el carácter de cada perro",
          "Supervisión permanente (el hotel es también el hogar de los encargados)",
          "Paseos, juegos y salidas al río bajo medidas de seguridad",
        ],
        price: 17000,
        priceLabel: "Precios desde",
        flexibleCancellation: true,
        detailUrl: "/hoteles-para-perros/penaflor/hotel-campestre",
      },
    ],
  },
]

/** FAQPage: habilita las preguntas desplegables en los resultados de Google. */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
}

/** Migas: Inicio › Hoteles para perros en Santiago. */
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Inicio", item: APP_URL },
    { "@type": "ListItem", position: 2, name: TITLE, item: `${APP_URL}${PATH}` },
  ],
}

/** Listado de los hoteles de la página, en el orden en que se muestran. */
const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: TITLE,
  itemListElement: ZONES.flatMap((zone) => zone.hotels).map((hotel, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: hotel.name,
    url: `${APP_URL}${hotel.detailUrl}`,
  })),
}

export default function HotelesParaPerrosSantiagoPage() {
  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />

        <div className="w-full px-4 pt-4 pb-16 md:px-6 md:pt-6 md:pb-24">
          <article className="flex flex-col gap-4 lg:w-3/4">
            <header>
              <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "#0A1830" }}>
                {TITLE}
              </h1>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "#333" }}>
                ¿Necesitas dejar a tu perro en buenas manos mientras viajas o resuelves algo fuera de
                casa? En JackCity reunimos hoteles y guarderías para perros en distintos puntos de
                Santiago, para que encuentres la opción que mejor se ajusta a tu mascota, tu ubicación
                y tu presupuesto — todo en un solo lugar, con reservas y pago en línea.
              </p>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "#333" }}>
                Santiago concentra la mayor oferta de hospedaje canino del país, con alternativas para
                todos los gustos: desde guarderías urbanas en pleno centro hasta hoteles campestres con
                amplios terrenos en las afueras de la ciudad. Sea cual sea tu comuna, es probable que
                tengas una buena opción cerca.
              </p>
            </header>

            {/* El mapa acompaña a la sección de zonas, que es la que habla de
                geografía. Las demás secciones van a ancho completo debajo, para que
                no quede una columna angosta al lado de un espacio vacío. */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
              <section className="bg-white rounded-2xl p-5 border lg:flex-1" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="flex items-center gap-2 text-lg font-bold mb-3" style={{ color: "#0A1830" }}>
                  <MapPin size={19} strokeWidth={2} style={{ color: ICON_COLOR, flexShrink: 0 }} aria-hidden="true" />
                  Encuentra hotel según tu zona
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "#333" }}>
                  Cada sector de Santiago tiene su propio estilo de hospedaje. En las comunas céntricas
                  como <ComunaLink slug="santiago-centro">Santiago Centro</ComunaLink> encuentras
                  guarderías urbanas prácticas y bien conectadas, ideales para perros acostumbrados a la
                  vida de departamento. Hacia el sur oriente, en comunas como{" "}
                  <ComunaLink slug="la-florida">La Florida</ComunaLink>, predominan las opciones tipo
                  casa con patio, de ambiente más hogareño. Y en las zonas rurales —
                  <ComunaLink slug="pirque">Pirque</ComunaLink> hacia la cordillera,{" "}
                  <ComunaLink slug="colina">Colina</ComunaLink> y{" "}
                  <ComunaLink slug="chicureo">Chicureo</ComunaLink> al norte,{" "}
                  <ComunaLink slug="penaflor">Peñaflor</ComunaLink> camino al litoral— están los hoteles
                  campestres con terreno amplio, perfectos para perros activos o de raza grande que
                  agradecen el espacio al aire libre.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#333", marginTop: "0.75rem" }}>
                  Si viajas desde el aeropuerto, las comunas del norte como{" "}
                  <ComunaLink slug="colina">Colina</ComunaLink> quedan a pocos minutos del terminal, muy
                  convenientes para dejar a tu perro de paso antes de volar.
                </p>
              </section>

              <figure
                className="bg-white rounded-2xl p-4 border lg:w-[38%] lg:flex-shrink-0"
                style={{ borderColor: "#E5E7EB" }}
              >
                <Image
                  src={MAP.src}
                  alt={MAP.alt}
                  width={MAP.width}
                  height={MAP.height}
                  className="h-auto w-full rounded-xl"
                  sizes="(max-width: 1024px) 100vw, 380px"
                />
                <figcaption className="mt-3 text-xs text-center" style={{ color: "#6B7280" }}>
                  {MAP.caption}
                </figcaption>
              </figure>
            </div>

            <div className="flex flex-col gap-4">
              <section className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="flex items-center gap-2 text-lg font-bold mb-3" style={{ color: "#0A1830" }}>
                  <Tag size={19} strokeWidth={2} style={{ color: ICON_COLOR, flexShrink: 0 }} aria-hidden="true" />
                  Precios de referencia
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "#333" }}>
                  El hospedaje para perros en Santiago va desde aproximadamente CLP 15.000 por noche en
                  las opciones más económicas, variando según la comuna, el tamaño de tu mascota y los
                  servicios adicionales que elijas (paseos, baño, cuidados especiales). Las guarderías
                  urbanas tienden a ser más accesibles, mientras que los hoteles campestres con más
                  terreno y servicios pueden tener tarifas algo mayores. El valor exacto siempre lo ves
                  al elegir tus fechas.
                </p>
              </section>
              <section className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="flex items-center gap-2 text-lg font-bold mb-3" style={{ color: "#0A1830" }}>
                  <Lightbulb size={19} strokeWidth={2} style={{ color: ICON_COLOR, flexShrink: 0 }} aria-hidden="true" />
                  Qué considerar al elegir un hotel para tu perro
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "#333" }}>
                  Más allá del precio, vale la pena mirar algunos aspectos antes de reservar. El tamaño y
                  la energía de tu perro importan: un perro grande o muy activo suele estar más cómodo en
                  un hospedaje campestre con espacio para moverse, mientras que uno pequeño o de
                  departamento puede adaptarse bien a una guardería urbana. Revisa también las reseñas de
                  otros dueños, los servicios incluidos, y qué documentación piden — la mayoría de los
                  hoteles exige el carnet de vacunas al día. Y considera la cercanía: dejar a tu perro
                  cerca de tu casa o de tu ruta de viaje facilita la entrega y el retiro.
                </p>
              </section>

              <section className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="flex items-center gap-2 text-lg font-bold mb-3" style={{ color: "#0A1830" }}>
                  <CalendarCheck size={19} strokeWidth={2} style={{ color: ICON_COLOR, flexShrink: 0 }} aria-hidden="true" />
                  Cómo funciona reservar en JackCity
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: "#333" }}>
                  Elige el hotel que más te gusta, indica las fechas y los datos de tu mascota, y revisa
                  el precio para tu estadía. Confirmas con una seña y listo — el resto se coordina
                  directamente con el hotel. Todo con pago seguro en línea y reseñas verificadas de otros
                  dueños que ya usaron el servicio.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#333", marginTop: "0.75rem" }}>
                  Antes de confirmar, te recomendamos revisar nuestra{" "}
                  <TextLink href="/legal/politica-de-reservas">política de reservas</TextLink>, donde
                  explicamos cómo funciona la seña, el saldo y la coordinación con el hotel, junto con
                  los <TextLink href="/legal/terminos-y-condiciones">términos y condiciones</TextLink>{" "}
                  del servicio. Si tus planes cambian, la{" "}
                  <TextLink href="/legal/politica-de-cancelacion">política de cancelación</TextLink>{" "}
                  detalla los plazos y devoluciones.
                </p>
              </section>
            </div>

            <section className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
              <h2 className="flex items-center gap-2 text-lg font-bold mb-3" style={{ color: "#0A1830" }}>
                <HelpCircle size={19} strokeWidth={2} style={{ color: ICON_COLOR, flexShrink: 0 }} aria-hidden="true" />
                Preguntas frecuentes
              </h2>
              <dl className="flex flex-col gap-4">
                {FAQS.map((faq) => (
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

            {/* Se separa del bloque de contenido: abre la sección de hoteles. */}
            <section className="flex flex-col gap-10 md:gap-12 mt-6 md:mt-8">
              <h2 className="flex items-center gap-2 text-lg font-bold" style={{ color: "#0A1830" }}>
                <PawPrint size={19} strokeWidth={2} style={{ color: ICON_COLOR, flexShrink: 0 }} aria-hidden="true" />
                Hoteles para perros en Santiago
              </h2>

              {ZONES.map((zone) => (
                <div key={zone.heading} className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-base font-bold" style={{ color: "#0A1830" }}>
                      {zone.heading}
                    </h3>
                    <ComunaLink slug={zone.comunaSlug}>Ver la comuna</ComunaLink>
                  </div>
                  {/* Más separación entre tarjetas que entre el título y la primera:
                      así cada zona se lee como un bloque. */}
                  <div className="flex flex-col gap-8">
                    {zone.hotels.map((card) => (
                      // h4: cuelgan del h3 de la zona, que a su vez cuelga del h2 de la sección.
                      <HotelStaticCard key={card.detailUrl} card={card} headingLevel="h4" />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          </article>
        </div>

        <SiteFooter />
      </div>
    </main>
  )
}
