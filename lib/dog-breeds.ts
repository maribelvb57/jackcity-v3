import type { PetSize } from "@/lib/api/hotels"

// Catálogo único de razas de perro. Fuente de verdad para el front.
// - label: texto que mostramos al usuario en formularios y combobox.
// - code: valor que enviamos y recibimos SIEMPRE del backend.
// - size: tamaño inferido de la raza (null en "OTRA", donde el usuario lo elige).
//
// El backend habla en códigos de tamaño: SMALL | MEDIUM | LARGE | EXTRA_LARGE.
// Al usuario le mostramos: Pequeño | Mediano | Grande | Extra Grande (ver PET_SIZE_LABEL).

export type DogBreed = {
  label: string
  code: string
  size: PetSize | null
  emoji?: string
}

// Texto para mostrar en los combobox (label + emoji si lo tiene).
// El emoji NO va en `label` porque `label` se usa para matchear en resolveBreedCode.
export function breedDisplayLabel(breed: DogBreed): string {
  return breed.emoji ? `${breed.label} ${breed.emoji}` : breed.label
}

// Código/label de la opción "OTRA" (sin tamaño inferido → el usuario lo elige a mano).
export const OTHER_BREED_CODE = "OTRA"
export const OTHER_BREED_LABEL = "OTRA"

export const DOG_BREEDS: DogBreed[] = [
  { label: "Akita Americano", code: "AKITA", size: "EXTRA_LARGE" },
  { label: "Basset Hound", code: "BASSET_HOUND", size: "MEDIUM" },
  { label: "Beagle", code: "BEAGLE", size: "MEDIUM" },
  { label: "Border Collie (Lassie)", code: "BORDER_COLLIE", size: "LARGE" },
  { label: "Boston Terrier", code: "BOSTON_TERRIER", size: "SMALL" },
  { label: "Boxer", code: "BOXER", size: "LARGE" },
  { label: "Boyero de Berna", code: "BOYERO_BERNA", size: "EXTRA_LARGE" },
  { label: "Braco Alemán", code: "BRACO_ALEMAN", size: "LARGE" },
  { label: "Bull Terrier", code: "BULL_TERRIER", size: "LARGE" },
  { label: "Bulldog Francés", code: "BULLDOG_FRANCES", size: "SMALL" },
  { label: "Bulldog Inglés", code: "BULLDOG_INGLES", size: "LARGE" },
  { label: "Chihuahua", code: "CHIHUAHUA", size: "SMALL" },
  { label: "Chow Chow", code: "CHOW_CHOW", size: "LARGE" },
  { label: "Cocker Spaniel Americano", code: "COCKER_AMERICANO", size: "MEDIUM" },
  { label: "Cocker Spaniel Inglés", code: "COCKER_INGLES", size: "MEDIUM" },
  { label: "Collie de pelo largo", code: "COLLIE", size: "LARGE" },
  { label: "Dachshund (Salchicha)", code: "DACHSHUND", size: "SMALL" },
  { label: "Foxhound Americano", code: "FOXHOUND", size: "LARGE" },
  { label: "Fox Terrier", code: "FOX_TERRIER", size: "SMALL" },
  { label: "Galgo Español", code: "GALGO", size: "LARGE" },
  { label: "Golden Retriever", code: "GOLDEN_RETRIEVER", size: "LARGE" },
  { label: "Greyhound", code: "GREYHOUND", size: "LARGE" },
  { label: "Husky Siberiano", code: "HUSKY", size: "LARGE" },
  { label: "Jack Russell Terrier", code: "JACK_RUSSELL_TERRIER", size: "SMALL", emoji: "❤️" },
  { label: "Labrador Retriever", code: "LABRADOR", size: "LARGE" },
  { label: "Maltés", code: "MALTES", size: "SMALL" },
  { label: "Mestizo (Quiltro)", code: "MESTIZO", size: "MEDIUM" },
  { label: "Pastor Alemán", code: "PASTOR_ALEMAN", size: "LARGE" },
  { label: "Pastor Australiano", code: "PASTOR_AUSTRALIANO", size: "LARGE" },
  { label: "Pastor Belga", code: "PASTOR_BELGA", size: "LARGE" },
  { label: "Pit Bull Terrier Americano", code: "PIT_BULL", size: "LARGE" },
  { label: "Poodle (Caniche)", code: "POODLE", size: "MEDIUM" },
  { label: "Pug", code: "PUG", size: "SMALL" },
  { label: "Rottweiler", code: "ROTTWEILER", size: "EXTRA_LARGE" },
  { label: "San Bernardo", code: "SAN_BERNARDO", size: "EXTRA_LARGE" },
  { label: "Schnauzer", code: "SCHNAUZER", size: "MEDIUM" },
  { label: "Shar Pei", code: "SHAR_PEI", size: "LARGE" },
  { label: "Shiba Inu", code: "SHIBA_INU", size: "MEDIUM" },
  { label: "Shih Tzu", code: "SHIH_TZU", size: "SMALL" },
  { label: "Staffordshire Bull Terrier", code: "STAFFORDSHIRE", size: "MEDIUM" },
  { label: "Terrier Chileno", code: "TERRIER_CHILENO", size: "SMALL" },
  { label: "Vizsla (Braco Húngaro)", code: "VIZSLA", size: "LARGE" },
  { label: "Welsh Corgi Pembroke", code: "WELSH_CORGI", size: "SMALL" },
  { label: "West Highland White Terrier", code: "WEST_HIGHLAND", size: "SMALL" },
  { label: "Whippet", code: "WHIPPET", size: "MEDIUM" },
  { label: "Yorkshire Terrier", code: "YORKSHIRE", size: "SMALL" },
  { label: OTHER_BREED_LABEL, code: OTHER_BREED_CODE, size: null },
]

// Labels ordenados para poblar los combobox de raza.
export const DOG_BREED_LABELS = DOG_BREEDS.map((b) => b.label)

const BREED_BY_LABEL = new Map(DOG_BREEDS.map((b) => [b.label, b]))
const BREED_BY_CODE = new Map(DOG_BREEDS.map((b) => [b.code, b]))

export function getBreedByLabel(label: string): DogBreed | undefined {
  return BREED_BY_LABEL.get(label)
}

export function getBreedByCode(code: string): DogBreed | undefined {
  return BREED_BY_CODE.get(code)
}

// Tamaño (código backend) inferido desde el label de la raza. null si no se infiere (OTRA / desconocida).
export function getBreedSizeByLabel(label: string): PetSize | null {
  return BREED_BY_LABEL.get(label)?.size ?? null
}

// Tamaño (código backend) inferido desde el code de la raza.
export function getBreedSizeByCode(code: string): PetSize | null {
  return BREED_BY_CODE.get(code)?.size ?? null
}

// Normaliza un valor de raza al code canónico. Acepta un code (en cualquier caja,
// ej. "beagle" → "BEAGLE") o un label ("Beagle"). Si no lo reconoce, devuelve el
// valor original sin tocar (para no perder data). Útil al ingerir mascotas guardadas
// del perfil, que pueden traer el nombre en vez del code.
export function resolveBreedCode(value: string | null | undefined): string {
  if (!value) return ""
  const raw = value.trim()
  const byCode = DOG_BREEDS.find((b) => b.code.toUpperCase() === raw.toUpperCase())
  if (byCode) return byCode.code
  const byLabel = DOG_BREEDS.find((b) => b.label.toLowerCase() === raw.toLowerCase())
  if (byLabel) return byLabel.code
  return raw
}
