export function encodePetBreeds(breeds: string[]) {
  return JSON.stringify(breeds)
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
