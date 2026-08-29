"use client"

import Link from "next/link"
import { Frown } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { AvailabilityFailureReason } from "@/lib/api/availability"

// Home, directo a la sección de búsqueda (el div id="buscar" de app/page.tsx).
const HOME_SEARCH_URL = "/#buscar"

type Props = {
  open: boolean
  reason: AvailabilityFailureReason | null
  onOpenChange: (open: boolean) => void
  /** Cierra el modal y deja al usuario listo para buscar de nuevo. */
  onNewSearch: () => void
  /** Cierra el modal, desmarca transporte y deja al usuario buscar de nuevo. */
  onSearchWithoutTransport: () => void
}

function InlineAction({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
      style={{ color: "#28548f" }}
    >
      {children}
    </button>
  )
}

function HomeLink({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <Link
      href={HOME_SEARCH_URL}
      onClick={onClick}
      className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
      style={{ color: "#28548f" }}
    >
      {children}
    </Link>
  )
}

/**
 * Modal que explica por qué el hotel no está disponible para lo que se buscó.
 * El texto y las salidas dependen de la condición que falló.
 */
export function HotelUnavailableDialog({
  open,
  reason,
  onOpenChange,
  onNewSearch,
  onSearchWithoutTransport,
}: Props) {
  const close = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Sin DialogDescription: el cuerpo del modal lleva links y botones, que no
          pueden ir dentro del <p> que renderiza ese componente. aria-describedby
          en undefined evita la advertencia de accesibilidad de Radix. */}
      <DialogContent aria-describedby={undefined} className="rounded-lg border-0 bg-white p-0 sm:max-w-[520px]">
        <div className="overflow-hidden rounded-lg">
          <div className="px-6 py-5" style={{ backgroundColor: "#F5F8FC" }}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-bold" style={{ color: "#0A1830" }}>
                <Frown size={40} strokeWidth={1.75} className="flex-shrink-0" style={{ color: "#0A1830" }} aria-hidden="true" />
                Este hotel no está disponible
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 text-sm leading-relaxed" style={{ color: "#333" }}>
            {/* Único caso sin "nueva búsqueda": con el hotel inactivo, cualquier
                búsqueda sobre esta ficha vuelve a fallar. */}
            {reason === "HOTEL_INACTIVE" && (
              <p>
                Te contamos que este hotel se encuentra temporalmente inactivo, te invitamos a{" "}
                <HomeLink onClick={close}>visitar nuestra homepage</HomeLink> y realizar una nueva
                búsqueda para encontrar un hotel de tu preferencia.
              </p>
            )}

            {reason === "PETS_NOT_ALLOWED" && (
              <p>
                Lamentablemente este hotel no recibe mascotas de la raza o tamaño indicados en tu
                búsqueda. Te invitamos a{" "}
                <InlineAction onClick={onNewSearch}>realizar una nueva búsqueda</InlineAction> o a{" "}
                <HomeLink onClick={close}>visitar nuestra homepage</HomeLink> para encontrar un hotel
                de tu preferencia.
              </p>
            )}

            {/* TODO(Maribel): texto pendiente de aprobación. El backend devuelve
                hotelOpenOnDates, que no estaba en la especificación original. */}
            {reason === "HOTEL_CLOSED_ON_DATES" && (
              <p>
                Lamentablemente este hotel no está recibiendo mascotas en las fechas seleccionadas.
                Te invitamos a{" "}
                <InlineAction onClick={onNewSearch}>realizar una nueva búsqueda</InlineAction> o a{" "}
                <HomeLink onClick={close}>visitar nuestra homepage</HomeLink> para encontrar un hotel
                de tu preferencia.
              </p>
            )}

            {reason === "NO_TRANSPORT" && (
              <p>
                Lamentablemente no contamos con transporte disponible para las fechas indicadas. Te
                invitamos a <InlineAction onClick={onNewSearch}>seleccionar otras fechas</InlineAction>,
                realizar una{" "}
                <InlineAction onClick={onSearchWithoutTransport}>nueva búsqueda sin transporte</InlineAction>{" "}
                o <HomeLink onClick={close}>visitar nuestra homepage</HomeLink> y realizar una nueva
                búsqueda para encontrar un hotel de tu preferencia.
              </p>
            )}

            {reason === "NO_HOUSING" && (
              <p>
                Lamentablemente este hotel no tiene cupos disponibles para las fechas seleccionadas.
                Te invitamos a{" "}
                <InlineAction onClick={onNewSearch}>realizar una nueva búsqueda</InlineAction> o a{" "}
                <HomeLink onClick={close}>visitar nuestra homepage</HomeLink> para encontrar un hotel
                de tu preferencia.
              </p>
            )}

            {(reason === "UNKNOWN" || reason === null) && (
              <p>
                Este hotel no está disponible para las condiciones de tu búsqueda. Te invitamos a{" "}
                <InlineAction onClick={onNewSearch}>modificar tu búsqueda</InlineAction> o a{" "}
                <HomeLink onClick={close}>visitar nuestra homepage</HomeLink> para encontrar un hotel
                de tu preferencia.
              </p>
            )}
          </div>

          <div className="flex justify-end border-t px-6 py-4" style={{ borderColor: "#E5E7EB" }}>
            <button
              type="button"
              onClick={onNewSearch}
              className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#28548f" }}
            >
              Entendido
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
