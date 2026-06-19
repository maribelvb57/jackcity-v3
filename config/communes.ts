const COMMUNE_NAMES_BY_CODE: Record<string, string> = {
  ALHUE: "Alhué",
  BUIN: "Buin",
  CALERA_DE_TANGO: "Calera de Tango",
  CERRILLOS: "Cerrillos",
  CERRO_NAVIA: "Cerro Navia",
  CHICUREO: "Chicureo",
  COLINA: "Colina",
  CONCHALI: "Conchalí",
  CURACAVI: "Curacaví",
  EL_BOSQUE: "El Bosque",
  EL_MONTE: "El Monte",
  ESTACION_CENTRAL: "Estación Central",
  HUECHURABA: "Huechuraba",
  INDEPENDENCIA: "Independencia",
  ISLA_DE_MAIPO: "Isla de Maipo",
  LA_CISTERNA: "La Cisterna",
  LA_FLORIDA: "La Florida",
  LA_GRANJA: "La Granja",
  LA_PINTANA: "La Pintana",
  LA_REINA: "La Reina",
  LAMPA: "Lampa",
  LAS_CONDES: "Las Condes",
  LO_BARNECHEA: "Lo Barnechea",
  LO_ESPEJO: "Lo Espejo",
  LO_PRADO: "Lo Prado",
  MACUL: "Macul",
  MAIPU: "Maipú",
  MARIA_PINTO: "María Pinto",
  MELIPILLA: "Melipilla",
  NUNOA: "Ñuñoa",
  PADRE_HURTADO: "Padre Hurtado",
  PAINE: "Paine",
  PEDRO_AGUIRRE_CERDA: "Pedro Aguirre Cerda",
  PENALOLEN: "Peñalolén",
  PIRQUE: "Pirque",
  PROVIDENCIA: "Providencia",
  PUDAHUEL: "Pudahuel",
  PUENTE_ALTO: "Puente Alto",
  QUILICURA: "Quilicura",
  QUINTA_NORMAL: "Quinta Normal",
  RECOLETA: "Recoleta",
  RENCA: "Renca",
  SAN_BERNARDO: "San Bernardo",
  SAN_JOAQUIN: "San Joaquín",
  SAN_JOSE_DE_MAIPO: "San José de Maipo",
  SAN_MIGUEL: "San Miguel",
  SAN_PEDRO: "San Pedro",
  SAN_RAMON: "San Ramón",
  SANTIAGO: "Santiago",
  TALAGANTE: "Talagante",
  TIL_TIL: "Til Til",
  VITACURA: "Vitacura",
}

function fallbackCommuneName(communeCode: string) {
  return communeCode
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function getCommuneNameByCode(communeCode: string | null | undefined) {
  if (!communeCode) return ""
  const normalizedCode = communeCode.trim().toUpperCase().replace(/\s+/g, "_")
  return COMMUNE_NAMES_BY_CODE[normalizedCode] ?? fallbackCommuneName(communeCode)
}
