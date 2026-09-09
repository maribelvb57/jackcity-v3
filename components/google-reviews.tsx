/**
 * Reseñas de Google de un hotel: logo, estrellas y cantidad.
 *
 * Los valores llegan del API como texto ("4.6", "312"), así que se parsean acá.
 * `parseGoogleReviews` devuelve null cuando el hotel no tiene reseñas de Google
 * (campo ausente, null, vacío o 0) y en ese caso no se muestra nada.
 */

const GOLD = "#FBBC04"
const STAR_EMPTY = "#DADCE0"

export type GoogleReviews = {
  avg: number
  count: number
}

export function parseGoogleReviews(
  avg: string | null | undefined,
  count: string | null | undefined
): GoogleReviews | null {
  const parsedAvg = Number(avg)
  if (!Number.isFinite(parsedAvg) || parsedAvg <= 0) return null
  const parsedCount = Number(count)
  return {
    avg: parsedAvg,
    count: Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 0,
  }
}

// El resto de la ficha muestra las notas con coma decimal ("8,7"), así que estas
// también.
function formatAvg(avg: number): string {
  return avg.toFixed(1).replace(".", ",")
}

function formatCount(count: number): string {
  return count.toLocaleString("es-CL")
}

/** Logo "G" de Google, para atribuir de dónde vienen las reseñas. */
function GoogleGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  )
}

/**
 * Cinco estrellas con la última rellenada en proporción a la nota (4,6 → cuatro
 * llenas y un 60% de la quinta), como las muestra Google.
 */
function Stars({ avg, size = 14 }: { avg: number; size?: number }) {
  const filledRatio = Math.max(0, Math.min(1, avg / 5)) * 100

  const row = (color: string) => (
    <span className="flex" style={{ gap: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={color} className="flex-shrink-0">
          <path d="M12 2l2.9 6.26 6.85.72-5.1 4.62 1.42 6.72L12 16.9l-6.07 3.42 1.42-6.72-5.1-4.62 6.85-.72L12 2z" />
        </svg>
      ))}
    </span>
  )

  return (
    <span className="relative inline-flex flex-shrink-0" aria-hidden="true">
      {row(STAR_EMPTY)}
      <span className="absolute inset-0 overflow-hidden" style={{ width: `${filledRatio}%` }}>
        {row(GOLD)}
      </span>
    </span>
  )
}

function accessibleLabel({ avg, count }: GoogleReviews): string {
  const rating = `${formatAvg(avg)} de 5 en Google`
  if (count === 0) return rating
  return `${rating}, ${formatCount(count)} ${count === 1 ? "reseña" : "reseñas"}`
}

// Píldora blanca con borde, sobre la tarjeta (también blanca), para que la nota de
// Google se despegue de la pill gris de estado que va a su izquierda.
const PILL_BG = "#FFFFFF"
const PILL_TEXT = "#526071"
// El borde va como sombra interior y no como `border`: así no suma 2px al alto y la
// píldora queda exactamente igual de alta que la de "Nuevo en JackCity", que no
// tiene borde.
const PILL_BORDER = "inset 0 0 0 1px #E2E8F0"

/**
 * Versión compacta, para acompañar el título de la tarjeta.
 *
 * Con `pill` se dibuja dentro de una píldora blanca con borde, del mismo alto que la
 * de "Nuevo en JackCity" (tarjetas de resultados). Sin ella va suelta, que es como se
 * usa junto al título de la ficha de hotel en mobile.
 */
export function GoogleReviewsInline({
  reviews,
  pill = false,
}: {
  reviews: GoogleReviews
  pill?: boolean
}) {
  return (
    <div
      className={
        pill
          ? "inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          : "flex items-center gap-1.5"
      }
      style={pill ? { backgroundColor: PILL_BG, color: PILL_TEXT, boxShadow: PILL_BORDER } : undefined}
      aria-label={accessibleLabel(reviews)}
    >
      {/* Suelta (ficha de hotel en mobile) el logo va más grande: ahí la fila mide
          20px de alto, contra los 16px de la píldora. */}
      <GoogleGlyph size={pill ? 15 : 19} />
      <span
        className={pill ? "font-semibold" : "text-sm font-semibold"}
        style={{ color: pill ? PILL_TEXT : "#0A1830" }}
        aria-hidden="true"
      >
        {formatAvg(reviews.avg)}
      </span>
      <Stars avg={reviews.avg} size={pill ? 11 : 12} />
      {reviews.count > 0 && (
        <span
          className={pill ? undefined : "text-xs"}
          style={{ color: pill ? PILL_TEXT : "#555" }}
          aria-hidden="true"
        >
          ({formatCount(reviews.count)})
        </span>
      )}
    </div>
  )
}

/** Bloque con título, para el pie de la tarjeta en desktop. */
export function GoogleReviewsBlock({ reviews }: { reviews: GoogleReviews }) {
  return (
    <div aria-label={accessibleLabel(reviews)}>
      <div className="flex items-center gap-2">
        <GoogleGlyph size={20} />
        <p className="font-semibold" style={{ color: "#0A1830" }} aria-hidden="true">
          Google Reviews
        </p>
      </div>
      <div className="mt-2 flex items-center gap-2" aria-hidden="true">
        <span className="text-sm font-semibold" style={{ color: "#0A1830" }}>
          {formatAvg(reviews.avg)}
        </span>
        <Stars avg={reviews.avg} size={14} />
        {reviews.count > 0 && (
          <span className="text-sm" style={{ color: "#555" }}>
            {formatCount(reviews.count)} reviews
          </span>
        )}
      </div>
    </div>
  )
}
