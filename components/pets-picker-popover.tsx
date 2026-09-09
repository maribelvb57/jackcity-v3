"use client"

import { useState, useRef, useEffect, type ReactNode, type CSSProperties } from "react"
import { ChevronDown, Plus, X, Check } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { defaultMascota, type Mascota } from "@/stores/search-store"
import { PET_SIZE_LABEL, PET_SIZE_MAP, type PetSize } from "@/lib/api/hotels"
import { DOG_BREEDS, breedDisplayLabel, getBreedByCode, getBreedSizeByCode, breedRequiresManualSize, resolveBreedCode } from "@/lib/dog-breeds"
import { getMyProfile } from "@/lib/api/customers"
import { useApiClient } from "@/hooks/use-api-client"

const ACCENT = "rgb(0 6 255)"
const ACCENT_HOVER = "rgb(0 5 220)"
const PANEL_BG = "#FFF9F2"
const PANEL_BORDER = "#D9C7AE"
const HELPER = "#16233B"

// value = code que manejamos internamente, label = lo que ve el usuario.
// "Sin especificar" es el centinela de "sin elegir".
const RAZA_OPTIONS = [
  { value: "Sin especificar", label: "Sin especificar" },
  ...DOG_BREEDS.map((b) => ({ value: b.code, label: breedDisplayLabel(b) })),
]

const TAMANOS = ["Pequeño", "Mediano", "Grande", "Extra Grande"]

const MAX_PETS = 3

// Normaliza el `size` de una mascota guardada a su label ("Mediano", etc.). Acepta el
// código del enum en cualquier caja (SMALL/small) o un label ya formateado.
function petSizeToLabel(size: string): string {
  if (!size) return ""
  const code = size.toUpperCase() as PetSize
  if (PET_SIZE_LABEL[code]) return PET_SIZE_LABEL[code]
  if (PET_SIZE_MAP[size]) return size
  return ""
}

type SavedPet = { id: string; name: string; breed: string; size: string }

type Props = {
  /** Mascotas vigentes. Se copian a un borrador al abrir; se aplican al confirmar. */
  value: Mascota[]
  onApply: (mascotas: Mascota[]) => void
  /** Contenido del botón que abre el panel. */
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function PetsPickerPopover({ value, onApply, children, className, style }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Mascota[]>(value)
  const [error, setError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // El listener de click-fuera se registra una vez: lee el borrador desde un ref.
  const draftRef = useRef<Mascota[]>(draft)
  draftRef.current = draft

  const { user: clerkUser, isSignedIn } = useUser()
  const { apiFetch } = useApiClient()
  const [savedPets, setSavedPets] = useState<SavedPet[]>([])

  useEffect(() => {
    if (!isSignedIn || !clerkUser?.id) return
    getMyProfile(apiFetch)
      .then((data) =>
        setSavedPets(
          data.pets
            .filter((p) => p.active)
            .map((p) => ({ id: String(p.id), name: p.name, breed: resolveBreedCode(p.breed), size: p.size }))
        )
      )
      .catch(() => {})
  }, [isSignedIn, clerkUser?.id])

  const showSavedPetsUI = isSignedIn && savedPets.length > 0

  // Las mascotas con petId ya vienen validadas de la BD; solo exigimos raza/tamaño a
  // las anónimas que el usuario arma a mano.
  const invalidReason = (pets: Mascota[]): string | null => {
    if (pets.length === 0) return "Agrega al menos una mascota."
    const invalid = pets.find(
      (m) => !m.petId && (m.raza === "Sin especificar" || (breedRequiresManualSize(m.raza) && !m.tamano))
    )
    if (!invalid) return null
    return invalid.raza === "Sin especificar" ? "Indica la raza de tu mascota." : "Indica el tamaño de tu mascota."
  }

  const openPanel = () => {
    setDraft(value)
    setError(null)
    setOpen(true)
  }

  // Confirmar explícito: si falta algo, se avisa y el panel queda abierto.
  const confirm = () => {
    const reason = invalidReason(draftRef.current)
    if (reason) {
      setError(reason)
      return
    }
    setOpen(false)
    onApply(draftRef.current)
  }

  // Cerrar por click fuera: aplica si el borrador quedó válido, si no lo descarta.
  const closeAndApply = () => {
    const pets = draftRef.current
    setOpen(false)
    setError(null)
    if (!invalidReason(pets)) onApply(pets)
  }

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) closeAndApply()
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  const updateMascota = (index: number, field: keyof Mascota, mascotaValue: string) => {
    setError(null)
    setDraft((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m
        if (field === "raza") {
          const inferredSize = getBreedSizeByCode(mascotaValue)
          const autoTamano = inferredSize ? PET_SIZE_LABEL[inferredSize] : ""
          // Cambiar la raza a mano significa que ya no es la mascota guardada:
          // limpiamos petId para no enviar un id que no corresponde a esta raza.
          return { ...m, raza: mascotaValue, tamano: autoTamano, petId: null, isDefault: false }
        }
        return { ...m, [field]: mascotaValue, isDefault: false }
      })
    )
  }

  const addMascota = () => setDraft((prev) => [...prev, defaultMascota()])

  const removeMascota = (index: number) => {
    setError(null)
    setDraft((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleSavedPet = (pet: SavedPet) => {
    setError(null)
    setDraft((prev) => {
      const alreadyIn = prev.findIndex((m) => m.petId === pet.id)
      if (alreadyIn >= 0) return prev.filter((_, i) => i !== alreadyIn)
      return [...prev, { raza: pet.breed, tamano: petSizeToLabel(pet.size), petId: pet.id }]
    })
  }

  // Bloque raza + tamaño, igual para la UI de invitado y para las mascotas anónimas
  // que un usuario logueado agrega junto a las suyas.
  const renderBreedAndSize = (mascota: Mascota, index: number) => {
    const sizeDisabled = !breedRequiresManualSize(mascota.raza)
    return (
      <>
        <div className="flex items-center gap-3 mb-2.5">
          <span className="text-sm w-16 flex-shrink-0" style={{ color: HELPER }}>Raza</span>
          <div className="relative flex-1">
            <select
              value={mascota.raza}
              onChange={(e) => updateMascota(index, "raza", e.target.value)}
              className="w-full appearance-none px-3 py-1.5 pr-8 rounded-lg border text-sm"
              style={{ backgroundColor: "#fff", borderColor: PANEL_BORDER, color: "#0A1830" }}
            >
              {RAZA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: ACCENT }} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm w-16 flex-shrink-0" style={{ color: HELPER }}>Tamaño</span>
          <div className="relative flex-1">
            <select
              value={mascota.tamano}
              onChange={(e) => updateMascota(index, "tamano", e.target.value)}
              disabled={sizeDisabled}
              className="w-full appearance-none px-3 py-1.5 pr-8 rounded-lg border text-sm"
              style={{
                backgroundColor: sizeDisabled ? "#F5F3EE" : "#fff",
                borderColor: PANEL_BORDER,
                color: mascota.tamano ? "#0A1830" : "#999",
                cursor: sizeDisabled ? "not-allowed" : "pointer",
                opacity: sizeDisabled ? 0.7 : 1,
              }}
            >
              <option value="" disabled>Indicar tamaño</option>
              {TAMANOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: ACCENT }} />
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button type="button" onClick={() => (open ? closeAndApply() : openPanel())} className={className} style={style}>
        {children}
      </button>

      {open && (
        <div
          className="absolute top-full mt-1 left-1/2 -translate-x-1/2 z-50 rounded-2xl shadow-2xl border p-4"
          style={{ backgroundColor: PANEL_BG, borderColor: PANEL_BORDER, minWidth: 300 }}
        >
          {showSavedPetsUI ? (
            <>
              {savedPets.map((pet) => {
                const isChecked = draft.some((m) => m.petId === pet.id)
                const sizeLabel = petSizeToLabel(pet.size) || pet.size
                return (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => toggleSavedPet(pet)}
                    className="flex items-center gap-3 w-full mb-3 text-left"
                  >
                    <div
                      className="w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center"
                      style={{ borderColor: isChecked ? ACCENT : "#D1D5DB", backgroundColor: isChecked ? ACCENT : "transparent" }}
                    >
                      {isChecked && <Check size={10} strokeWidth={3} style={{ color: "#fff" }} />}
                    </div>
                    <span className="text-sm" style={{ color: "#0A1830" }}>
                      {pet.name}{" "}
                      <span style={{ color: HELPER }}>({getBreedByCode(pet.breed)?.label ?? pet.breed} / {sizeLabel})</span>
                    </span>
                  </button>
                )
              })}

              {draft.map((mascota, index) =>
                mascota.petId ? null : (
                  <div key={index} className="mt-3 pt-3 border-t" style={{ borderColor: "#E5DFC8" }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold" style={{ color: "#0A1830" }}>Otra mascota</span>
                      <button
                        type="button"
                        onClick={() => removeMascota(index)}
                        className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-red-50"
                        style={{ color: "#aaa" }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                    {renderBreedAndSize(mascota, index)}
                  </div>
                )
              )}
            </>
          ) : (
            draft.map((mascota, index) => (
              <div key={index} className="mb-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold" style={{ color: "#0A1830" }}>Mascota {index + 1}</span>
                  {draft.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMascota(index)}
                      className="flex items-center justify-center w-5 h-5 rounded-full transition-colors hover:bg-red-50"
                      style={{ color: "#aaa" }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
                {renderBreedAndSize(mascota, index)}
                {index < draft.length - 1 && <div className="mt-4 border-t" style={{ borderColor: "#E5DFC8" }} />}
              </div>
            ))
          )}

          {draft.length < MAX_PETS && (
            <button
              type="button"
              onClick={addMascota}
              className="flex items-center gap-1.5 text-sm font-medium mt-3 mb-4 transition-opacity hover:opacity-70"
              style={{ color: ACCENT }}
            >
              <Plus size={14} />
              Agregar otra mascota
            </button>
          )}

          {error && (
            <p className="mb-3 text-sm font-medium" style={{ color: "#8A1C1C" }}>{error}</p>
          )}

          <div className="mb-4 border-t" style={{ borderColor: "#E5DFC8" }} />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={confirm}
              className="px-5 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT)}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
