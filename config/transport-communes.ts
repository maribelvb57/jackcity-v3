export type TransportCommune = {
  communeCode: string
  commune: string
}

export const TRANSPORT_COMMUNES: TransportCommune[] = [
  { communeCode: "CHICUREO", commune: "Chicureo" },
  { communeCode: "HUECHURABA", commune: "Huechuraba" },
  { communeCode: "LA_FLORIDA", commune: "La Florida" },
  { communeCode: "LA_REINA", commune: "La Reina" },
  { communeCode: "LAS_CONDES", commune: "Las Condes" },
  { communeCode: "LO_BARNECHEA", commune: "Lo Barnechea" },
  { communeCode: "MACUL", commune: "Macul" },
  { communeCode: "PENALOLEN", commune: "Peñalolén" },
  { communeCode: "PROVIDENCIA", commune: "Providencia" },
  { communeCode: "RECOLETA", commune: "Recoleta" },
  { communeCode: "SAN_JOAQUIN", commune: "San Joaquín" },
  { communeCode: "SAN_MIGUEL", commune: "San Miguel" },
  { communeCode: "SANTIAGO", commune: "Santiago" },
  { communeCode: "VITACURA", commune: "Vitacura" },
  { communeCode: "NUNOA", commune: "Ñuñoa" },
]

export const DEFAULT_TRANSPORT_COMMUNE = TRANSPORT_COMMUNES[0]

export function getTransportCommuneByCode(communeCode: string) {
  return TRANSPORT_COMMUNES.find((item) => item.communeCode === communeCode)
}
