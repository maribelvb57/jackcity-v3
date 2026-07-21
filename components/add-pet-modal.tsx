"use client"

import { useState } from "react"
import { ChevronDown, Plus, Minus } from "lucide-react"
import type { ApiFetch } from "@/lib/api/types"
import type { CustomerProfile } from "@/lib/api/customers"
import { createPet } from "@/lib/api/pets"
import { PET_SIZE_MAP, PET_SIZE_LABEL, type PetSize } from "@/lib/api/hotels"
import { DOG_BREEDS, breedDisplayLabel, getBreedByCode, getBreedSizeByCode, OTHER_BREED_CODE } from "@/lib/dog-breeds"

const TAMANOS = ["Pequeño", "Mediano", "Grande", "Extra Grande"]
const PET_COLORS = ["Negro", "Blanco", "Marrón", "Dorado", "Gris", "Manchado", "Otro"]
const RAZA_OPTIONS = DOG_BREEDS.map((b) => ({ value: b.code, label: breedDisplayLabel(b) }))

type PetRecord = CustomerProfile["pets"][number]

interface AddPetModalProps {
  apiFetch: ApiFetch
  onSave: (pet: PetRecord) => void
  onClose: () => void
  // Restringe las razas elegibles (codes) y bloquea el tamaño (viene de la reserva).
  // 1 raza → queda bloqueada; varias → el usuario elige entre esas.
  allowedBreeds?: { code: string; size: PetSize }[]
}

export function AddPetModal({ apiFetch, onSave, onClose, allowedBreeds }: AddPetModalProps) {
  const restricted = !!allowedBreeds && allowedBreeds.length > 0
  const allowedSizeByCode = new Map((allowedBreeds ?? []).map((a) => [a.code, a.size]))
  const lockedSingleBreed = restricted && allowedBreeds!.length === 1
  const breedOptions = restricted
    ? allowedBreeds!.map((a) => ({ value: a.code, label: getBreedByCode(a.code) ? breedDisplayLabel(getBreedByCode(a.code)!) : a.code }))
    : RAZA_OPTIONS

  const [name, setName] = useState("")
  const [breed, setBreed] = useState(restricted ? allowedBreeds![0].code : "")
  const [sizeLabel, setSizeLabel] = useState(restricted ? PET_SIZE_LABEL[allowedBreeds![0].size] : "")
  const [gender, setGender] = useState("")
  const [weight, setWeight] = useState("")
  const [color, setColor] = useState("")
  const [age, setAge] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const isOtraRaza = breed === OTHER_BREED_CODE
  const GENDER_MAP: Record<string, string> = { Macho: "MALE", Hembra: "FEMALE" }
  // En modo restringido el tamaño siempre está bloqueado (lo fija la reserva).
  const sizeDisabled = restricted ? true : !isOtraRaza

  const handleBreedChange = (newBreed: string) => {
    setBreed(newBreed)
    if (restricted) {
      const s = allowedSizeByCode.get(newBreed)
      setSizeLabel(s ? PET_SIZE_LABEL[s] : "")
    } else {
      const inferred = getBreedSizeByCode(newBreed)
      setSizeLabel(inferred ? PET_SIZE_LABEL[inferred] : "")
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")
    try {
      const sizeCode = PET_SIZE_MAP[sizeLabel] ?? sizeLabel
      const weightParsed = parseFloat(weight)
      const result = await createPet({
        name, breed,
        size: sizeCode,
        gender: GENDER_MAP[gender] ?? gender,
        ...(isNaN(weightParsed) ? {} : { weight: weightParsed }),
        ...(color && { color }),
        ...(age > 0 && { age }),
      }, apiFetch)
      onSave({
        id: result.id,
        name, breed,
        size: sizeCode,
        gender: GENDER_MAP[gender] ?? gender,
        weight: isNaN(weightParsed) ? null : weightParsed,
        color: color || null,
        age: age || null,
        active: true,
      })
    } catch {
      setError("No se pudo agregar la mascota. Intenta nuevamente.")
    } finally {
      setIsSaving(false)
    }
  }

  const canSave = !!name && !!breed && !!sizeLabel && !!gender

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "#E5E7EB" }}>
          <h3 className="text-base font-bold" style={{ color: "#0A1830" }}>Agregar mascota</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: "#6B7280" }}>
            <Plus size={20} className="rotate-45" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-2.5">
          {/* Fila 1: Nombre + Género */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Nombre</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="Nombre mascota" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Género</label>
              <div className="px-4 py-2.5 rounded-xl border flex items-center gap-4 h-[42px]" style={{ borderColor: "#E5E7EB" }}>
                {["Macho", "Hembra"].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="add-pet-gender" value={g}
                      checked={gender === g} onChange={() => setGender(g)}
                      className="w-4 h-4 cursor-pointer accent-[#0A1830]" />
                    <span className="text-sm" style={{ color: "#0A1830" }}>{g}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Fila 2: Raza + Tamaño */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>Raza</label>
              {lockedSingleBreed ? (
                <input type="text" value={breedOptions[0]?.label ?? breed} readOnly
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: "#0A1830" }} />
              ) : (
                <div className="relative">
                  <select value={breed} onChange={(e) => handleBreedChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 appearance-none cursor-pointer"
                    style={{ borderColor: "#E5E7EB", color: breed ? "#0A1830" : "#9CA3AF" }}>
                    {!restricted && <option value="">Seleccionar raza</option>}
                    {breedOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                Tamaño
                {restricted ? (
                  <span className="font-normal ml-1" style={{ color: "#9CA3AF" }}>(según reserva)</span>
                ) : !isOtraRaza && breed ? (
                  <span className="font-normal ml-1" style={{ color: "#9CA3AF" }}>(según raza)</span>
                ) : null}
              </label>
              {sizeDisabled ? (
                <input type="text" value={sizeLabel} readOnly
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                  style={{ backgroundColor: "#F9FAFB", borderColor: "#E5E7EB", color: sizeLabel ? "#0A1830" : "#9CA3AF" }}
                  placeholder="—" />
              ) : (
                <div className="relative">
                  <select value={sizeLabel} onChange={(e) => setSizeLabel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none appearance-none cursor-pointer"
                    style={{ borderColor: "#E5E7EB", color: sizeLabel ? "#0A1830" : "#9CA3AF" }}>
                    <option value="">Seleccionar</option>
                    {TAMANOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
                </div>
              )}
            </div>
          </div>

          {/* Fila 3: Peso + Color */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                Peso <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
              </label>
              <div className="relative">
                <input type="text" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 pr-12"
                  style={{ borderColor: "#E5E7EB", color: "#0A1830" }} placeholder="0" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#9CA3AF" }}>kg</span>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                Color <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
              </label>
              <div className="relative">
                <select value={color} onChange={(e) => setColor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 appearance-none cursor-pointer"
                  style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
                  <option value="">Sin color</option>
                  {PET_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
              </div>
            </div>
          </div>

          {/* Edad */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
              Edad <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
            </label>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setAge(a => Math.max(a - 1, 0))}
                className="w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E5E7EB" }}>
                <Minus size={16} style={{ color: "#0A1830" }} />
              </button>
              <div className="flex-1 h-10 flex items-center justify-center rounded-xl border text-sm font-semibold"
                style={{ borderColor: "#E5E7EB", color: "#0A1830" }}>
                {age === 0 ? "—" : `${age} año${age !== 1 ? "s" : ""}`}
              </div>
              <button type="button" onClick={() => setAge(a => Math.min(a + 1, 25))}
                className="w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:bg-gray-50"
                style={{ borderColor: "#E5E7EB" }}>
                <Plus size={16} style={{ color: "#0A1830" }} />
              </button>
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: "#B45309" }}>{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleSave}
              disabled={isSaving || !canSave}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}>
              {isSaving ? "Guardando..." : "Agregar mascota"}
            </button>
            <button type="button" onClick={onClose} disabled={isSaving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-gray-50 disabled:opacity-50"
              style={{ borderColor: "#E5E7EB", color: "#6B7280" }}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
