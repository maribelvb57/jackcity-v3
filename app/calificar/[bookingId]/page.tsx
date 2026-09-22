"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarCheck2, CheckCircle2, PawPrint, SearchX, Star, XCircle } from "lucide-react"
import { SiteNavbar } from "@/components/site-navbar"
import { HotelPhoto } from "@/components/hotel-photo"
import { ScoreSelector } from "@/components/score-selector"
import { LoadingPaws } from "@/components/loading-paws"
import { useApiClient } from "@/hooks/use-api-client"
import { ApiError } from "@/lib/api/types"
import { getPublicBookingForReview, type PublicBookingForReview } from "@/lib/api/bookings"
import { createReview } from "@/lib/api/reviews"

function formatDate(date: string) {
  return format(new Date(`${date}T12:00:00`), "d MMM yyyy", { locale: es })
}

function petNames(pets: PublicBookingForReview["pets"]) {
  const names = pets.map((pet) => pet.name).filter(Boolean)
  if (names.length === 0) return null
  if (names.length === 1) return names[0]
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`
}

// Textos de cada motivo por el que el backend deja canReview en false.
// Una reserva ya calificada no vuelve a mostrar el formulario: sólo el agradecimiento.
const REASON_SCREENS = {
  ALREADY_REVIEWED: {
    icon: CheckCircle2,
    color: "#08785B",
    bg: "#EAF8F3",
    title: "Esta reserva ya fue calificada",
    body: "¡Muchas gracias por tu ayuda! Tu opinión nos sirve para cuidar mejor a los peques.",
  },
  NOT_COMPLETED: {
    icon: CalendarCheck2,
    color: "#125BD8",
    bg: "#EAF2FF",
    title: "Todavía no puedes calificar esta reserva",
    body: "Vas a poder dejar tu calificación cuando termine la estadía. Te avisaremos apenas esté disponible.",
  },
  CANCELLED: {
    icon: XCircle,
    color: "#9A3412",
    bg: "#FFF7ED",
    title: "Esta reserva fue cancelada",
    body: "Como la estadía no se realizó, no hay nada que calificar.",
  },
  EXPIRED: {
    icon: XCircle,
    color: "#526071",
    bg: "#EEF2F7",
    title: "Este enlace ya no está disponible",
    body: "El plazo para calificar esta reserva terminó. Si quieres contarnos algo, escríbenos y te ayudamos.",
  },
} as const

// Contenedor común de todas las pantallas: navbar + caja blanca centrada.
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#28548f" }}>
      <div className="w-full max-w-[1400px] min-h-screen flex flex-col" style={{ backgroundColor: "#F8FAFC" }}>
        <SiteNavbar />
        <div className="flex flex-1 justify-center px-4 py-8 sm:px-6 sm:py-12">
          <div className="w-full max-w-[720px]">{children}</div>
        </div>
      </div>
    </main>
  )
}

// Pantalla de un solo mensaje: se usa para los motivos de REASON_SCREENS,
// para el agradecimiento post-envío y para los errores de carga.
function MessageScreen({
  icon: Icon,
  color,
  bg,
  title,
  body,
  children,
}: {
  icon: typeof Star
  color: string
  bg: string
  title: string
  body: string
  children?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border bg-white px-6 py-12 text-center" style={{ borderColor: "#E5E7EB" }}>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: bg, color }}>
        <Icon size={32} />
      </div>
      <h1 className="mt-5 text-2xl font-bold" style={{ color: "#0D2B45" }}>{title}</h1>
      <p className="mx-auto mt-3 max-w-[440px] text-sm font-medium" style={{ color: "#667085" }}>{body}</p>
      {children ?? (
        <Link
          href="/"
          className="mt-7 inline-flex min-h-11 items-center rounded-full px-6 text-sm font-bold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
        >
          Ir a JackCity
        </Link>
      )}
    </div>
  )
}

export default function CalificarReservaPage() {
  const params = useParams<{ bookingId: string }>()
  const bookingId = params.bookingId
  const { apiFetch } = useApiClient()

  // 0 = sin nota seleccionada (la página abre sin ninguna estrella marcada)
  const [housingScore, setHousingScore] = useState(0)
  const [transportScore, setTransportScore] = useState(0)
  const [positiveText, setPositiveText] = useState("")
  const [negativeText, setNegativeText] = useState("")
  const [sent, setSent] = useState(false)

  const { data: booking, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["public-booking-review", bookingId],
    queryFn: () => getPublicBookingForReview(bookingId),
    // El link se abre una vez: no tiene sentido reintentar un 404.
    retry: (failureCount, err) => !(err instanceof ApiError && err.status === 404) && failureCount < 2,
  })

  // Housing siempre; si la reserva incluye transporte, se envía además la review TRANSPORT
  // (segundo llamado, solo con su nota — los comentarios van únicamente en HOUSING).
  // OJO: por ahora apunta al POST /api/reviews que ya existe, que es el autenticado.
  // Sin sesión el request viaja sin Authorization; falta confirmar con Maribel si ese
  // endpoint acepta llamadas públicas o si necesitamos uno nuevo para esta página.
  const reviewMutation = useMutation({
    mutationFn: async () => {
      await createReview(
        {
          bookingId,
          type: "HOUSING",
          stars: housingScore,
          goodThings: positiveText.trim() || undefined,
          badThings: negativeText.trim() || undefined,
        },
        apiFetch,
      )
      if (booking?.transport.included) {
        await createReview({ bookingId, type: "TRANSPORT", stars: transportScore }, apiFetch)
      }
    },
    onSuccess: () => setSent(true),
  })

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex flex-col items-center gap-3 rounded-2xl border bg-white px-6 py-16" style={{ borderColor: "#E5E7EB" }}>
          <LoadingPaws size={22} />
          <p className="text-sm font-semibold" style={{ color: "#667085" }}>Cargando tu reserva...</p>
        </div>
      </PageShell>
    )
  }

  if (isError || !booking) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <PageShell>
        <MessageScreen
          icon={SearchX}
          color="#8A1C1C"
          bg="#FDECEC"
          title={notFound ? "No encontramos esta reserva" : "No pudimos cargar tu reserva"}
          body={
            notFound
              ? "Revisa que el enlace esté completo. Si lo copiaste de un correo, vuelve a abrirlo desde ahí."
              : "Hubo un problema de conexión. Inténtalo de nuevo en unos segundos."
          }
        >
          {!notFound && (
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-7 inline-flex min-h-11 items-center rounded-full px-6 text-sm font-bold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
            >
              Reintentar
            </button>
          )}
        </MessageScreen>
      </PageShell>
    )
  }

  if (sent) {
    return (
      <PageShell>
        <MessageScreen
          icon={CheckCircle2}
          color="#08785B"
          bg="#EAF8F3"
          title="¡Gracias por tu calificación!"
          body={`Ya registramos tu opinión sobre ${booking.hotel.name}. Nos ayuda a cuidar mejor a los peques y a mejorar el servicio.`}
        />
      </PageShell>
    )
  }

  if (!booking.canReview) {
    const screen = REASON_SCREENS[booking.reason ?? "EXPIRED"] ?? REASON_SCREENS.EXPIRED
    return (
      <PageShell>
        <MessageScreen icon={screen.icon} color={screen.color} bg={screen.bg} title={screen.title} body={screen.body} />
      </PageShell>
    )
  }

  // Nombres de las mascotas de la reserva: encabezan el título y la tarjeta.
  // null cuando la reserva no trae mascotas, para no escribir "Calificar reserva de".
  const pets = petNames(booking.pets)

  const canSubmit =
    housingScore > 0 && (!booking.transport.included || transportScore > 0) && !reviewMutation.isPending

  return (
    <PageShell>
      <div className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: "#E5E7EB" }}>
        <div className="px-6 pt-8 pb-2 sm:px-8">
          <h1 className="flex items-center gap-2.5 text-2xl font-bold sm:text-3xl" style={{ color: "#0D2B45" }}>
            <Star size={26} fill="currentColor" className="flex-shrink-0" />
            {pets ? `¿Cómo estuvo la reserva de ${pets}?` : "¿Cómo estuvo tu reserva?"}
          </h1>
          <p className="mt-2 text-sm font-medium" style={{ color: "#667085" }}>
            {booking.transport.included
              ? "Califica de 1 a 10 el alojamiento y el transporte, y déjanos dos comentarios simples."
              : "Una calificación de 1 a 10 y dos comentarios simples para entender la experiencia."}
          </p>
        </div>

        <div className="px-6 py-6 sm:px-8">
          <div className="flex items-center gap-4 rounded-2xl border p-4" style={{ borderColor: "#E5E7EB" }}>
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-[#EEF2F7]">
              <HotelPhoto src={booking.hotel.mainPhotoUrl} alt={booking.hotel.name} sizes="96px" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-bold" style={{ color: "#0A1830" }}>{booking.hotel.name}</p>
              <p className="mt-1.5 text-sm font-semibold" style={{ color: "#667085" }}>
                {formatDate(booking.checkinDate)} - {formatDate(booking.checkoutDate)}
              </p>
              {pets && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#8A94A6" }}>
                  <PawPrint size={15} />
                  {pets}
                </p>
              )}
            </div>
          </div>

          <div className="mt-7">
            <ScoreSelector
              label={booking.transport.included ? "Nota de alojamiento" : "Tu nota"}
              score={housingScore}
              onChange={setHousingScore}
              disabled={reviewMutation.isPending}
            />
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold" style={{ color: "#0A1830" }}>Lo positivo</span>
              <textarea
                value={positiveText}
                onChange={(event) => setPositiveText(event.target.value)}
                rows={5}
                disabled={reviewMutation.isPending}
                className="mt-2 w-full resize-none rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-[#FFC43D]"
                style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                placeholder="Qué te gustó del hotel, del cuidado o del proceso..."
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold" style={{ color: "#0A1830" }}>Lo negativo</span>
              <textarea
                value={negativeText}
                onChange={(event) => setNegativeText(event.target.value)}
                rows={5}
                disabled={reviewMutation.isPending}
                className="mt-2 w-full resize-none rounded-xl border px-4 py-3 text-sm font-medium outline-none focus:border-[#FFC43D]"
                style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                placeholder="Qué podría mejorar para la próxima estadía..."
              />
            </label>
          </div>

          {booking.transport.included && (
            <div className="mt-7">
              <ScoreSelector
                label="Nota de transporte"
                score={transportScore}
                onChange={setTransportScore}
                disabled={reviewMutation.isPending}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8" style={{ borderColor: "#E5E7EB" }}>
          {reviewMutation.isError ? (
            <p className="text-sm font-semibold" style={{ color: "#D92D20" }}>
              No pudimos guardar tu calificación. Intenta de nuevo.
            </p>
          ) : (
            <p className="text-sm font-semibold" style={{ color: "#8A94A6" }}>
              Reserva {booking.number}
            </p>
          )}
          <button
            type="button"
            onClick={() => reviewMutation.mutate()}
            disabled={!canSubmit}
            className="min-h-11 w-full rounded-full px-6 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            style={{ backgroundColor: "#FFC43D", color: "#0D2B45" }}
          >
            {reviewMutation.isPending ? "Enviando..." : "Enviar calificación"}
          </button>
        </div>
      </div>
    </PageShell>
  )
}
