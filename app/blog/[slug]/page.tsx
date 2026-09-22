import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { JsonLd } from "@/components/json-ld"
import { getBlogPost, getBlogPosts, formatBlogDate } from "@/lib/blog-posts"
import type { BlogPost } from "@/lib/blog-posts"
import { APP_URL } from "@/lib/site-url"

/**
 * Artículo del blog: /blog/{slug}.
 *
 * El contenido viene del feed de Soro y se arma en el servidor, no con el
 * widget JS que se usaba antes: así cada artículo tiene URL propia, su título y
 * su descripción, y Google puede leerlo sin ejecutar JavaScript.
 */

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getBlogPosts()
  return posts.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) return { title: "Artículo no encontrado", robots: { index: false, follow: false } }

  // Canonical propio: antes todos los artículos declaraban /blog y Google los
  // consolidaba en esa única página.
  const canonical = `/blog/${post.slug}`

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt || undefined,
      ...(post.imageUrl && { images: [{ url: post.imageUrl, alt: post.title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      ...(post.imageUrl && { images: [post.imageUrl] }),
    },
  }
}

/** BlogPosting: enlaza el artículo con el Blog y con la Organization del home. */
function articleSchema(post: BlogPost) {
  const url = `${APP_URL}/blog/${post.slug}`
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    inLanguage: "es-CL",
    ...(post.publishedAt && { datePublished: post.publishedAt }),
    ...(post.imageUrl && { image: post.imageUrl }),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@id": `${APP_URL}/blog#blog` },
    publisher: { "@id": `${APP_URL}/#organization` },
  }
}

/** Migas: Inicio › Blog › {artículo}. */
function breadcrumbSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: APP_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${APP_URL}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${APP_URL}/blog/${post.slug}`,
      },
    ],
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) notFound()

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <JsonLd data={articleSchema(post)} />
      <JsonLd data={breadcrumbSchema(post)} />

      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />

        <div className="w-full px-4 pt-4 pb-16 md:px-6 md:pt-6 md:pb-24">
          <article className="mx-auto w-full max-w-[720px]">
            <Link
              href="/blog"
              className="inline-block mb-3 text-xs font-medium transition-opacity hover:opacity-75"
              style={{ color: "#1E56A0" }}
            >
              ‹ Volver al blog
            </Link>

            <h1 className="text-2xl md:text-4xl font-bold leading-tight" style={{ color: "#0A1830" }}>
              {post.title}
            </h1>

            {post.publishedAt && (
              <time
                dateTime={post.publishedAt}
                className="mt-3 block text-xs"
                style={{ color: "#6B7280" }}
              >
                {formatBlogDate(post.publishedAt)}
              </time>
            )}

            {post.imageUrl && (
              <Image
                src={post.imageUrl}
                alt={post.title}
                width={1200}
                height={630}
                priority
                className="mt-6 h-auto w-full rounded-2xl"
                sizes="(max-width: 768px) 100vw, 720px"
              />
            )}

            {/*
              Cuerpo del artículo, tal como lo entrega Soro. Es HTML de la
              plataforma que Maribel contrató, el mismo que hasta ahora inyectaba
              su widget en el navegador; los estilos viven en .blog-content.
            */}
            <div
              className="blog-content mt-8"
              dangerouslySetInnerHTML={{ __html: post.contentHtml }}
            />

            {/*
              Enlace interno hacia la landing de Santiago, con el anchor por el
              que queremos que posicione. Va en la plantilla y no en el texto de
              cada artículo, que se edita en Soro.
            */}
            <aside
              className="mt-10 rounded-2xl border p-5"
              style={{ borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" }}
            >
              <p className="text-sm leading-relaxed" style={{ color: "#333" }}>
                ¿Buscas dónde dejar a tu perro? Mira todos los{" "}
                <Link
                  href="/hotel-para-perros"
                  className="underline underline-offset-2 font-medium transition-opacity hover:opacity-75"
                  style={{ color: "#1E56A0" }}
                >
                  hoteles para perros en Santiago
                </Link>{" "}
                disponibles en JackCity, con precios y reserva en línea.
              </p>
              <Link
                href="/hotel-para-perros"
                className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}
              >
                Ver hoteles
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </aside>
          </article>
        </div>

        <SiteFooter />
      </div>
    </main>
  )
}
