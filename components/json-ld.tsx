/**
 * Datos estructurados (schema.org) para Google. No renderiza nada visible.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // El contenido puede traer un "</script>" y cerrar la etiqueta antes de
      // tiempo: se escapa todo "<" a su forma unicode.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}
