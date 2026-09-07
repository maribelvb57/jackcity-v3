import type { Metadata } from "next"
import Script from "next/script"
import { SiteNavbar } from "@/components/site-navbar"
import { SiteFooter } from "@/components/site-footer"
import { JsonLd } from "@/components/json-ld"
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

// El widget de Soro inyecta los artículos dentro de #soro-blog. Este Blog
// schema le declara a Google qué es la página aunque el listado llegue por JS.
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

export default function BlogPage() {
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

          {/*
            Punto de montaje del widget de Soro. El contenido lo escribe el
            script de terceros, no React: suppressHydrationWarning evita que la
            hidratación reclame por los nodos que aparecen después.
          */}
          <div className="mx-auto max-w-3xl mt-10 md:mt-14">
            <div id="soro-blog" suppressHydrationWarning />
          </div>
        </div>

        <SiteFooter />
      </div>

      {/*
        Widget de blog de Soro (app.trysoro.com). Va con afterInteractive para
        que #soro-blog ya exista en el DOM cuando el script corra.
      */}
      <Script
        id="soro-blog-embed"
        src="https://app.trysoro.com/api/embed/8613b1dd-22b7-4183-841f-2e2dbe861798"
        strategy="afterInteractive"
      />
    </main>
  )
}
