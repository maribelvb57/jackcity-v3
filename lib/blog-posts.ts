/**
 * Artículos del blog.
 *
 * El contenido no vive en este repo: lo escribe Soro (app.trysoro.com) y se lee
 * de su feed RSS, que es la única salida que esa plataforma ofrece hacia Next.
 * De acá salen las rutas /blog/{slug}, el listado y las entradas del sitemap.
 *
 * El feed es la fuente de verdad: si un artículo se despublica en Soro,
 * desaparece del feed y su página deja de existir en la próxima revalidación.
 */

// El id del embed no es secreto: hasta ahora viajaba en el HTML de /blog.
const FEED_URL =
  "https://app.trysoro.com/api/rss/8613b1dd-22b7-4183-841f-2e2dbe861798"

// Cada cuánto se vuelve a pedir el feed. Los artículos se publican de a poco,
// así que una hora sobra y evita pegarle a Soro en cada visita.
const REVALIDATE_SECONDS = 3600

export type BlogPost = {
  /** Último segmento del <link> del feed. Es la ruta: /blog/{slug}. */
  slug: string
  title: string
  description: string
  /** HTML del artículo, tal como lo entrega Soro (viene en content:encoded). */
  contentHtml: string
  /** Fecha de publicación en ISO. Es el único dato de fecha que trae el feed. */
  publishedAt: string
  /** Imagen destacada, del <enclosure>. No todos los feeds la traen. */
  imageUrl?: string
}

/** Saca el envoltorio <![CDATA[ ... ]]> si el campo viene así. */
function unwrapCdata(value: string): string {
  const match = value.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/)
  return match ? match[1] : value
}

/**
 * Entidades XML de los campos de texto (title, description). No se aplica al
 * cuerpo del artículo, que es HTML de verdad y debe quedar tal cual.
 */
function decodeEntities(value: string): string {
  const named: Record<string, string> = {
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    amp: "&",
  }
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    // &amp; va al final: si se resolviera primero, un "&amp;lt;" terminaría
    // convertido en "<" en vez de en el texto "&lt;".
    .replace(/&(lt|gt|quot|apos|amp);/g, (_, name: string) => named[name])
}

/**
 * Baja a h2 los <h1> que algunos artículos traen dentro del cuerpo.
 *
 * La página ya pone el título del artículo como h1: si el contenido trae otro,
 * la página queda con dos y se pierde la jerarquía. Hoy le pasa a un artículo
 * ("Hoteles para perros en Santiago"), y lo arrastraría cualquiera nuevo que
 * Soro genere igual.
 */
function demoteHeadings(html: string): string {
  return html.replace(/<(\/?)h1(\s[^>]*)?>/gi, (_, slash: string, attrs = "") => `<${slash}h2${attrs}>`)
}

/** Contenido del primer <tag> del bloque, ya sin CDATA. */
function readTag(xml: string, name: string): string {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`))
  return match ? unwrapCdata(match[1]).trim() : ""
}

/**
 * El feed apunta a jackcity.cl/{slug} (una estructura que Soro da por hecha y
 * que este sitio no usa): sólo interesa el último segmento.
 */
function slugFromLink(link: string): string {
  try {
    const path = new URL(link).pathname.replace(/^\/+|\/+$/g, "")
    return path.split("/").pop() ?? ""
  } catch {
    return ""
  }
}

function parseFeed(xml: string): BlogPost[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []

  return items
    .map((item): BlogPost => {
      const publishedAt = readTag(item, "pubDate")
      const parsedDate = new Date(publishedAt)
      const enclosure = item.match(/<enclosure\s[^>]*url="([^"]+)"/)

      return {
        slug: slugFromLink(readTag(item, "link")),
        title: decodeEntities(readTag(item, "title")),
        description: decodeEntities(readTag(item, "description")),
        contentHtml: demoteHeadings(readTag(item, "content:encoded")),
        publishedAt: Number.isNaN(parsedDate.getTime()) ? "" : parsedDate.toISOString(),
        imageUrl: enclosure?.[1],
      }
    })
    // Sin slug no hay ruta posible, y sin título no hay nada que mostrar.
    .filter((post) => post.slug && post.title)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

/**
 * Artículos publicados, del más nuevo al más viejo.
 *
 * Si el feed falla devuelve una lista vacía en vez de tirar el error: así un
 * problema de Soro no rompe el build ni tumba el sitemap; el blog queda vacío
 * hasta la próxima revalidación.
 */
export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(FEED_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!response.ok) {
      console.error(`blog: el feed de Soro respondió ${response.status}`)
      return []
    }
    return parseFeed(await response.text())
  } catch (error) {
    console.error("blog: no se pudo leer el feed de Soro", error)
    return []
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  const posts = await getBlogPosts()
  return posts.find((post) => post.slug === slug)
}

/** "17 de septiembre de 2026". En UTC, que es como vienen las fechas del feed. */
export function formatBlogDate(isoDate: string): string {
  if (!isoDate) return ""
  return new Date(isoDate).toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}
