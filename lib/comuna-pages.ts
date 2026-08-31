/**
 * Contenido de las landings por comuna: /hoteles-para-perros/{comuna}.
 *
 * Sólo existen las comunas listadas acá (la ruta usa dynamicParams = false):
 * cualquier otro slug responde 404 hasta que se le escriba contenido.
 */
export type ComunaFaq = {
  question: string
  answer: string
}

/** Tarjeta de hotel escrita a mano para la landing. No viene de una búsqueda. */
export type ComunaHotelCard = {
  name: string
  imageUrl: string
  address: string
  features: string[]
  /** Precio de referencia, en pesos. */
  price: number
  /** Texto sobre el precio. Por defecto, "Precio por noche". */
  priceLabel?: string
  flexibleCancellation: boolean
  detailUrl: string
}

/**
 * Mapa de ubicación de la comuna, al costado de las secciones de contenido.
 * width/height son las medidas reales del archivo: no todos los mapas tienen la
 * misma proporción, y Next las usa para reservar el espacio antes de cargarlo.
 */
export type ComunaMap = {
  src: string
  alt: string
  width: number
  height: number
  caption?: string
}

/** Ícono que acompaña al título de la sección (ver SECTION_ICONS en la página). */
export type ComunaSectionIcon = "price" | "tips"

export type ComunaSection = {
  heading: string
  icon?: ComunaSectionIcon
  paragraphs: string[]
}

export type ComunaPage = {
  slug: string
  /** Nombre de la comuna tal como se escribe en los textos. */
  name: string
  title: string
  intro: string[]
  map?: ComunaMap
  sections: ComunaSection[]
  faqs: ComunaFaq[]
  hotels: ComunaHotelCard[]
}

export const COMUNA_PAGES: ComunaPage[] = [
  {
    slug: "la-florida",
    name: "La Florida",
    title: "Hoteles para perros en La Florida",
    intro: [
      "¿Buscas dónde dejar a tu perro en La Florida? En esta comuna del sector suroriente de Santiago encuentras hospedaje canino con atención personalizada, ideal si vives por el sector y prefieres dejar a tu mascota cerca de casa.",
      "La Florida combina zonas residenciales tranquilas con buena conexión hacia el resto de la ciudad, lo que la hace cómoda tanto para quienes viven ahí como para quienes pasan por la zona antes de viajar.",
    ],
    map: {
      src: "/images/mapas/la-florida.png",
      alt: "Mapa de las comunas de Santiago con La Florida destacada",
      width: 700,
      height: 675,
      caption: "La Florida, en el sector suroriente de Santiago.",
    },
    sections: [
      {
        heading: "Precios de referencia",
        icon: "price",
        paragraphs: [
          "El hospedaje para perros en La Florida parte desde aproximadamente CLP 20.000 por noche, según el tamaño de tu mascota y los servicios adicionales (paseos, baño, cuidados especiales). El valor exacto lo ves al elegir tus fechas.",
        ],
      },
      {
        heading: "Qué considerar al elegir",
        icon: "tips",
        paragraphs: [
          "Si prefieres un ambiente hogareño por sobre una guardería grande, en La Florida encuentras opciones tipo casa con patio, donde tu perro convive en un entorno familiar y no en jaulas. Revisa siempre las reseñas, los servicios incluidos y qué documentación piden (la mayoría exige vacunas al día).",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Cuánto cuesta dejar un perro en La Florida?",
        answer: "Desde ~CLP 20.000 la noche, variando por tamaño y servicios.",
      },
      {
        question: "¿Qué necesito para hospedar a mi perro?",
        answer: "Generalmente el carnet de vacunas al día. Cada hotel confirma su documentación al reservar.",
      },
      {
        question: "¿Puedo reservar solo unos días?",
        answer: "Sí, eliges las fechas exactas que necesitas y pagas una seña para confirmar.",
      },
    ],
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
    ],
  },
  {
    slug: "pirque",
    name: "Pirque",
    title: "Hoteles para perros en Pirque",
    intro: [
      "¿Buscas dónde dejar a tu perro en Pirque? Esta comuna al sur oriente de Santiago, rodeada de campo y aire limpio, es ideal si prefieres que tu mascota se hospede en un entorno natural y espacioso en lugar de un local urbano.",
      "Pirque combina tranquilidad rural con buena conexión hacia Puente Alto y el resto de la ciudad, lo que la hace conveniente tanto para quienes viven en la zona cordillerana como para quienes buscan un hospedaje campestre para su perro.",
    ],
    map: {
      src: "/images/mapas/pirque.png",
      alt: "Mapa con la comuna de Pirque destacada, al sur oriente de Santiago",
      width: 700,
      height: 689,
      caption: "Pirque, al sur oriente de Santiago.",
    },
    sections: [
      {
        heading: "Precios de referencia",
        icon: "price",
        paragraphs: [
          "El hospedaje para perros en Pirque parte desde aproximadamente CLP 20.000 por noche, según el tamaño de tu mascota y los servicios adicionales (paseos, baño, cuidados especiales). El valor exacto lo ves al elegir tus fechas.",
        ],
      },
      {
        heading: "Qué considerar al elegir",
        icon: "tips",
        paragraphs: [
          "Si valoras que tu perro tenga espacio para moverse al aire libre, en Pirque encuentras opciones campestres con terreno amplio, muy distintas a una guardería urbana. Es una buena alternativa para perros activos o de raza grande que agradecen el espacio. Revisa siempre las reseñas, los servicios incluidos y qué documentación piden (la mayoría exige vacunas al día).",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Cuánto cuesta dejar un perro en Pirque?",
        answer: "Desde ~CLP 20.000 la noche, variando por tamaño y servicios.",
      },
      {
        question: "¿Qué necesito para hospedar a mi perro?",
        answer: "Generalmente el carnet de vacunas al día. Cada hotel confirma su documentación al reservar.",
      },
      {
        question: "¿Puedo reservar solo unos días?",
        answer: "Sí, eliges las fechas exactas que necesitas y pagas una seña para confirmar.",
      },
    ],
    hotels: [
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
    slug: "santiago-centro",
    name: "Santiago Centro",
    title: "Hoteles para perros en Santiago Centro",
    intro: [
      "¿Buscas dónde dejar a tu perro en Santiago Centro? Por su ubicación en el corazón de la ciudad, esta comuna es una de las más convenientes si vives o trabajas en el centro y necesitas un hospedaje canino cercano y bien conectado.",
      "Santiago Centro concentra buena conectividad con metro y accesos hacia todas las direcciones, lo que la hace práctica tanto para quienes viven en el sector como para quienes pasan por acá antes de viajar.",
    ],
    map: {
      src: "/images/mapas/santiago-centro.png",
      alt: "Mapa de las comunas de Santiago con Santiago Centro destacada",
      width: 700,
      height: 675,
      caption: "Santiago Centro, en el corazón de la ciudad.",
    },
    sections: [
      {
        heading: "Precios de referencia",
        icon: "price",
        paragraphs: [
          "El hospedaje para perros en Santiago Centro parte desde aproximadamente CLP 15.000 por noche, según el tamaño de tu mascota y los servicios adicionales (paseos, baño, cuidados especiales). El valor exacto lo ves al elegir tus fechas.",
        ],
      },
      {
        heading: "Qué considerar al elegir",
        icon: "tips",
        paragraphs: [
          "En una comuna urbana como Santiago Centro encuentras guarderías pensadas para el ritmo de la ciudad, con cuidado por el día y hospedaje por noche. Si tu perro está acostumbrado a la vida de departamento, este tipo de opción suele adaptarse bien. Revisa siempre las reseñas, los servicios incluidos y qué documentación piden (la mayoría exige vacunas al día).",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Cuánto cuesta dejar un perro en Santiago Centro?",
        answer: "Desde ~CLP 15.000 la noche, variando por tamaño y servicios.",
      },
      {
        question: "¿Qué necesito para hospedar a mi perro?",
        answer: "Generalmente el carnet de vacunas al día. Cada hotel confirma su documentación al reservar.",
      },
      {
        question: "¿Puedo reservar solo unos días?",
        answer: "Sí, eliges las fechas exactas que necesitas y pagas una seña para confirmar.",
      },
    ],
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
    slug: "chicureo",
    name: "Chicureo",
    title: "Hoteles para perros en Chicureo",
    intro: [
      "¿Buscas dónde dejar a tu perro en Chicureo? Este sector residencial de Colina, al norte de Santiago, es ideal si vives por la zona y prefieres un hospedaje canino con espacio y entorno natural, lejos del ruido de la ciudad.",
      "Chicureo se caracteriza por sus barrios amplios y su ambiente semi rural, con buena conexión hacia la autopista y el resto de la Región Metropolitana. Es una alternativa cómoda tanto para quienes viven en el sector como para quienes buscan un hospedaje con terreno para su perro.",
    ],
    map: {
      src: "/images/mapas/chicureo.png",
      alt: "Mapa del sector de Chicureo, en la comuna de Colina, destacado al norte de Santiago",
      width: 700,
      height: 878,
      caption: "Chicureo, en la comuna de Colina, al norte de Santiago.",
    },
    sections: [
      {
        heading: "Precios de referencia",
        icon: "price",
        paragraphs: [
          "El hospedaje para perros en Chicureo parte desde aproximadamente CLP 17.000 por noche, según el tamaño de tu mascota y los servicios adicionales (paseos, baño, cuidados especiales). El valor exacto lo ves al elegir tus fechas.",
        ],
      },
      {
        heading: "Qué considerar al elegir",
        icon: "tips",
        paragraphs: [
          "Si valoras que tu perro tenga espacio al aire libre, en Chicureo encuentras opciones campestres con terreno amplio, muy distintas a una guardería urbana. Es una buena alternativa para perros activos o de raza grande que agradecen moverse con libertad. Revisa siempre las reseñas, los servicios incluidos y qué documentación piden (la mayoría exige vacunas al día).",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Cuánto cuesta dejar un perro en Chicureo?",
        answer: "Desde ~CLP 17.000 la noche, variando por tamaño y servicios.",
      },
      {
        question: "¿Qué necesito para hospedar a mi perro?",
        answer: "Generalmente el carnet de vacunas al día. Cada hotel confirma su documentación al reservar.",
      },
      {
        question: "¿Puedo reservar solo unos días?",
        answer: "Sí, eliges las fechas exactas que necesitas y pagas una seña para confirmar.",
      },
    ],
    hotels: [
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
    slug: "colina",
    name: "Colina",
    title: "Hoteles para perros en Colina",
    intro: [
      "¿Buscas dónde dejar a tu perro en Colina? Esta comuna del sector norte de la Región Metropolitana es una excelente opción si vives por la zona o si viajas desde el aeropuerto, ya que queda a pocos minutos del Arturo Merino Benítez.",
      "Colina destaca por su entorno amplio y semi rural —que incluye sectores como Chicureo— con buena conexión hacia la autopista y el norte de Santiago. Es cómoda tanto para quienes viven en la comuna como para quienes buscan dejar a su perro cerca del aeropuerto antes de viajar.",
    ],
    map: {
      src: "/images/mapas/colina.png",
      alt: "Mapa con la comuna de Colina destacada, al norte de Santiago, con el sector de Chicureo y el aeropuerto",
      width: 700,
      height: 628,
      caption: "Colina, al norte de Santiago, a pocos minutos del aeropuerto.",
    },
    sections: [
      {
        heading: "Precios de referencia",
        icon: "price",
        paragraphs: [
          "El hospedaje para perros en Colina parte desde aproximadamente CLP 17.000 por noche, según el tamaño de tu mascota y los servicios adicionales (paseos, baño, cuidados especiales). El valor exacto lo ves al elegir tus fechas.",
        ],
      },
      {
        heading: "Qué considerar al elegir",
        icon: "tips",
        paragraphs: [
          "En Colina encuentras hospedajes campestres con terreno amplio, ideales para perros que agradecen el espacio al aire libre. Si viajas y buscas dejar a tu mascota cerca del aeropuerto, la ubicación de la comuna es una gran ventaja. Revisa siempre las reseñas, los servicios incluidos y qué documentación piden (la mayoría exige vacunas al día).",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Cuánto cuesta dejar un perro en Colina?",
        answer: "Desde ~CLP 17.000 la noche, variando por tamaño y servicios.",
      },
      {
        question: "¿Hay hospedaje cerca del aeropuerto?",
        answer: "Sí, Colina está a pocos minutos del aeropuerto, ideal si viajas.",
      },
      {
        question: "¿Qué necesito para hospedar a mi perro?",
        answer: "Generalmente el carnet de vacunas al día. Cada hotel confirma su documentación al reservar.",
      },
    ],
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
    ],
  },
  {
    slug: "penaflor",
    name: "Peñaflor",
    title: "Hoteles para perros en Peñaflor",
    intro: [
      "¿Buscas dónde dejar a tu perro en Peñaflor? Esta comuna del sector poniente de la Región Metropolitana ofrece un entorno tranquilo y campestre, ideal si vives por la zona o si viajas hacia el litoral y buscas dejar a tu mascota en un espacio amplio y natural.",
      "Peñaflor se caracteriza por su ambiente de campo y su conexión hacia la ruta 78 camino a San Antonio y el litoral central. Es una alternativa cómoda tanto para quienes viven en el sector poniente como para quienes pasan por la zona antes de viajar a la costa.",
    ],
    sections: [
      {
        heading: "Precios de referencia",
        icon: "price",
        paragraphs: [
          "El hospedaje para perros en Peñaflor parte desde aproximadamente CLP 17.000 por noche, según el tamaño de tu mascota y los servicios adicionales (paseos, baño, cuidados especiales). El valor exacto lo ves al elegir tus fechas.",
        ],
      },
      {
        heading: "Qué considerar al elegir",
        icon: "tips",
        paragraphs: [
          "En Peñaflor encuentras hospedajes campestres con terreno amplio, muy distintos a una guardería urbana. Es una buena opción para perros activos o de raza grande que agradecen el espacio al aire libre. Si viajas al litoral, la ubicación de la comuna la hace conveniente de paso. Revisa siempre las reseñas, los servicios incluidos y qué documentación piden (la mayoría exige vacunas al día).",
        ],
      },
    ],
    faqs: [
      {
        question: "¿Cuánto cuesta dejar un perro en Peñaflor?",
        answer: "Desde ~CLP 17.000 la noche, variando por tamaño y servicios.",
      },
      {
        question: "¿Qué necesito para hospedar a mi perro?",
        answer: "Generalmente el carnet de vacunas al día. Cada hotel confirma su documentación al reservar.",
      },
      {
        question: "¿Puedo reservar solo unos días?",
        answer: "Sí, eliges las fechas exactas que necesitas y pagas una seña para confirmar.",
      },
    ],
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

export function getComunaPage(slug: string): ComunaPage | undefined {
  return COMUNA_PAGES.find((page) => page.slug === slug)
}
