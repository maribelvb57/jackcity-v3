export function encodePetBreeds(breeds: string[]) {
  return JSON.stringify(breeds)
}

export function encodePetIds(ids: (string | null | undefined)[]) {
  return JSON.stringify(ids.map(id => id ?? null))
}

export function parsePetIdsParam(value: string | null): (string | null)[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.map(v => (typeof v === "string" ? v : null))
  } catch {
    return []
  }
  return []
}

export function parsePetBreedsParam(value: string | null) {
  if (!value) return []

  try {
    const parsedValue = JSON.parse(value)
    if (Array.isArray(parsedValue)) {
      return parsedValue.filter((item): item is string => typeof item === "string")
    }
  } catch {
    return value.split(",").filter(Boolean)
  }

  return []
}
