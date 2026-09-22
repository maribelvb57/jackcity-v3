import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { JsonLd } from "@/components/json-ld"
import { getBlogPosts, formatBlogDate } from "@/lib/blog-posts"
import { APP_URL } from "@/lib/site-url"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Guías y consejos para dejar a tu perro en buenas manos: cómo elegir hotel, qué llevar, cuidados y todo lo que necesitas saber antes de viajar.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: `${APP_URL}/blog`,
    title: "Blog | JackCity",
    description:
      "Guías y consejos para dejar a tu perro en buenas manos: cómo elegir hotel, qué llevar, cuidados y todo lo que necesitas saber antes de viajar.",
  },
}

/**
 * Blog schema. El @id lo referencian los artículos desde su BlogPosting, para
 * declararle a Google que pertenecen a este blog.
 */
function blogSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${APP_URL}/blog#blog`,
    url: `${APP_URL}/blog`,
    name: "Blog de JackCity",
    inLanguage: "es-CL",
    publisher: { "@id": `${APP_URL}/#organization` },
  }
}

export default async function BlogPage() {
  // El listado se arma en el servidor desde el feed de Soro. Antes lo escribía
  // su widget JS en el navegador, y por eso Google no veía ni los títulos ni
  // los enlaces hacia cada artículo.
  const posts = await getBlogPosts()

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <JsonLd data={blogSchema()} />

      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        <SiteNavbar />

        <div className="px-6 py-12 md:py-16">
          <header className="mx-auto max-w-3xl text-center">
            <h1 className="text-3xl md:text-4xl font-bold" style={{ color: "#0A1830" }}>
              Blog JackCity
            </h1>
            <p className="mt-4 text-base md:text-lg" style={{ color: "#4B5563" }}>
              Guías y consejos para dejar a tu perro en buenas manos: cómo elegir hotel,
              qué llevar y qué revisar antes de viajar.
            </p>
          </header>

          {posts.length === 0 ? (
            // El feed puede fallar o venir vacío: la página sigue en pie.
            <p className="mx-auto mt-12 max-w-3xl text-center text-sm" style={{ color: "#6B7280" }}>
              Por ahora no hay artículos publicados. Vuelve pronto.
            </p>
          ) : (
            <ul className="mx-auto mt-10 grid max-w-5xl list-none grid-cols-1 gap-6 p-0 md:mt-14 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.slug}>
                  <article
                    className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white"
                    style={{ borderColor: "#E2E8F0" }}
                  >
                    {post.imageUrl && (
                      // Fuera del orden de tabulación: el título de abajo ya
                      // lleva al mismo artículo.
                      <Link
                        href={`/blog/${post.slug}`}
                        tabIndex={-1}
                        className="relative block aspect-[3/2] w-full"
                      >
                        <Image
                          src={post.imageUrl}
                          alt={post.title}
                          fill
                          sizes="(min-width: 1024px) 373px, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </Link>
                    )}

                    <div className="flex flex-1 flex-col p-5">
                      {post.publishedAt && (
                        <time
                          dateTime={post.publishedAt}
                          className="text-xs"
                          style={{ color: "#8A94A6" }}
                        >
                          {formatBlogDate(post.publishedAt)}
                        </time>
                      )}

                      <h2 className="mt-2 text-lg font-bold leading-tight" style={{ color: "#0A1830" }}>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="transition-opacity hover:opacity-75"
                        >
                          {post.title}
                        </Link>
                      </h2>

                      <p className="mt-2 text-sm leading-relaxed" style={{ color: "#4B5563" }}>
                        {post.description}
                      </p>

                      <Link
                        href={`/blog/${post.slug}`}
                        tabIndex={-1}
                        aria-hidden="true"
                        className="mt-4 inline-block text-sm font-bold transition-opacity hover:opacity-75"
                        style={{ color: "#1E56A0" }}
                      >
                        Leer más ›
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>

        <SiteFooter />
      </div>
    </main>
  )
}
