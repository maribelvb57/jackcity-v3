import { getImageProps } from "next/image"

const ALT_MOBILE =
  "Perro Jack Russell con anteojos de sol asomado dentro de una maleta de viaje. Porque con JackCity tu peque también se va de vacaciones: hospedaje premium, seguridad 24/7, amor y cuidado todo el día, fotos y videos diarios."
const ALT_DESKTOP =
  "Perro Jack Russell con anteojos de sol asomado dentro de una maleta de viaje. Porque con JackCity tu peque también se va de vacaciones: hospedaje premium, seguridad 24/7, amor y cuidado todo el día, fotos y videos diarios. Más que un hotel, sus vacaciones felices."

// El breakpoint md de Tailwind es 768px, así que mobile es todo lo de abajo.
const MEDIA_MOBILE = "(max-width: 767px)"
const MEDIA_DESKTOP = "(min-width: 768px)"

// Anchos reales de los archivos en public/images. Servir un candidato más
// ancho que esto es upscale: pesa más y no agrega detalle, así que podamos
// el srcSet a lo que el archivo puede sostener de verdad.
const MAX_SRC_WIDTH = { mobile: 1101, desktop: 1697 }

// El hero siempre ocupa el ancho completo, así que los candidatos chicos que
// Next agrega por defecto (32w–384w, pensados para iconos) nunca se eligen y
// solo inflan el atributo.
const MIN_SRC_WIDTH = 640

function capSrcSet(srcSet: string, maxWidth: number) {
  const candidates = srcSet
    .split(/,\s*(?=\/)/)
    .map((entry) => {
      const match = entry.trim().match(/^(.*)\s+(\d+)w$/)
      return match ? { url: match[1], w: Number(match[2]) } : null
    })
    .filter((c): c is { url: string; w: number } => c !== null)

  const withinBudget = candidates.filter(
    (c) => c.w <= maxWidth && c.w >= MIN_SRC_WIDTH,
  )
  // Si todos los candidatos exceden el ancho del archivo nos quedamos con el
  // más chico, para no devolver un srcSet vacío.
  const kept = withinBudget.length > 0 ? withinBudget : candidates.slice(0, 1)
  return kept.map((c) => `${c.url} ${c.w}w`).join(", ")
}

export function HeroHeader() {
  const common = { fill: true, quality: 75, sizes: "" } as const

  const mobile = getImageProps({
    ...common,
    src: "/images/hero-bg-mobile.jpg",
    alt: ALT_MOBILE,
    sizes: "100vw",
  }).props

  const desktop = getImageProps({
    ...common,
    src: "/images/hero-bg.jpg",
    alt: ALT_DESKTOP,
    sizes: "min(100vw, 1200px)",
  }).props

  const mobileSrcSet = capSrcSet(mobile.srcSet ?? "", MAX_SRC_WIDTH.mobile)
  const desktopSrcSet = capSrcSet(desktop.srcSet ?? "", MAX_SRC_WIDTH.desktop)

  return (
    <header className="w-full">
      {/* Preload del LCP, uno por breakpoint. El `media` es lo que evita que
          cada viewport se baje además la imagen del otro: sin él, los dos
          <link> se resuelven y el ahorro del <picture> se pierde en el head. */}
      <link
        rel="preload"
        as="image"
        media={MEDIA_MOBILE}
        imageSrcSet={mobileSrcSet}
        imageSizes="100vw"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        media={MEDIA_DESKTOP}
        imageSrcSet={desktopSrcSet}
        imageSizes="min(100vw, 1200px)"
        fetchPriority="high"
      />

      {/* El mensaje del hero está dentro del JPG, así que no hay texto que
          Google pueda leer. Este h1 lo expone en el HTML sin alterar el diseño:
          sr-only lo oculta a la vista, pero sigue indexable y disponible para
          lectores de pantalla. Cuando el copy del hero pase a ser texto real,
          este h1 debería volverse visible en vez de duplicarse. */}
      <h1 className="sr-only">
        Encuentra hoteles para perros en Santiago de Chile
      </h1>
      <div className="flex items-center justify-center">
        <div className="relative w-full max-w-[1200px] aspect-[1101/1351] overflow-hidden md:aspect-[1697/849]">
          {/* Un solo elemento descargado por viewport. Las URLs apuntan al
              optimizador de Next, que negocia AVIF/WebP/JPEG por Accept, así
              que no hacen falta <source type> por formato. */}
          <picture>
            <source
              media={MEDIA_MOBILE}
              srcSet={mobileSrcSet}
              sizes="100vw"
            />
            <source
              media={MEDIA_DESKTOP}
              srcSet={desktopSrcSet}
              sizes="min(100vw, 1200px)"
            />
            <img
              src={desktop.src}
              alt={ALT_DESKTOP}
              decoding="async"
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </picture>
        </div>
      </div>
    </header>
  )
}
