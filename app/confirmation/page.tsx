"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { SiteNavbar } from "@/components/site-navbar"
import { SearchSummaryBar } from "@/components/search-summary-bar"
import { formatClp } from "@/lib/format"
import { 
  User,
  Mail,
  Phone,
  MapPin,
  PawPrint,
  AlertCircle,
  ChevronDown,
  Minus,
  Plus,
  Check,
  Car,
  X
} from "lucide-react"

// Mock hotel data
const HOTEL_DATA = {
  name: "Cherratón Miramar",
  location: "Vitacura",
  image: "/images/hotel-patitas-inn.jpg",
  conditions: [
    "No recibe perros sin vacunas al día",
    "No recibe perros en celo",
    "Requiere certificado de desparasitación",
  ],
  transportOptions: {
    departure: ["9am - 12m", "12m - 3pm", "3pm - 6pm"],
    return: ["9am - 12m", "12m - 3pm", "3pm - 6pm"],
  },
  cancellationPolicy: "Cancelación gratuita hasta 48 horas antes del check-in. Después de ese plazo se cobra el 50% de la reserva.",
}

// Mock reservation data
const RESERVATION_DATA = {
  petCount: 2,
  petSize: "Tamaño pequeño",
  nights: 2,
  dateFrom: "7 mayo",
  dateTo: "9 mayo",
  withTransport: true,
  transportFrom: "Comuna Macul",
  pricePerNight: 85000,
  transportPrice: 15000,
}

// Country codes for phone
const COUNTRY_CODES = [
  { code: "+56", country: "CL", flag: "🇨🇱" },
  { code: "+54", country: "AR", flag: "🇦🇷" },
  { code: "+51", country: "PE", flag: "🇵🇪" },
  { code: "+57", country: "CO", flag: "🇨🇴" },
  { code: "+52", country: "MX", flag: "🇲🇽" },
]

// Countries list
const COUNTRIES = ["Chile", "Argentina", "Perú", "Colombia", "México", "Brasil", "Ecuador"]

// Cities by country (simplified)
const CITIES: Record<string, string[]> = {
  Chile: ["Santiago", "Valparaíso", "Concepción", "Viña del Mar", "Antofagasta"],
  Argentina: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza"],
  Perú: ["Lima", "Arequipa", "Cusco", "Trujillo"],
  Colombia: ["Bogotá", "Medellín", "Cali", "Barranquilla"],
  México: ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla"],
  Brasil: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
  Ecuador: ["Quito", "Guayaquil", "Cuenca"],
}

// Pet sizes
const PET_SIZES = ["Pequeño", "Mediano", "Grande"]

// Pet colors
const PET_COLORS = ["Negro", "Blanco", "Marrón", "Dorado", "Gris", "Manchado", "Otro"]

interface PetData {
  name: string
  breed: string
  size: string
  gender: string
  weight: string
  color: string
  age: number
}

export default function BookingConfirmationPage() {
  const router = useRouter()
  // User form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [country, setCountry] = useState("Chile")
  const [city, setCity] = useState("")
  const [saveData, setSaveData] = useState(false)
  const [commune, setCommune] = useState("")
  const [address, setAddress] = useState("")
  const [rut, setRut] = useState("")
  const [countryCode, setCountryCode] = useState("+56")
  const [phone, setPhone] = useState("")

  // Pets state
  const [pets, setPets] = useState<PetData[]>([
    { name: "", breed: "", size: "Pequeño", gender: "", weight: "", color: "", age: 0 },
    { name: "", breed: "", size: "Pequeño", gender: "", weight: "", color: "", age: 0 },
  ])
  const [includeTransport, setIncludeTransport] = useState(RESERVATION_DATA.withTransport)
  const [selectedDeparture, setSelectedDeparture] = useState<string | null>(null)
  const [selectedReturn, setSelectedReturn] = useState<string | null>(null)

  // Conditions checkboxes
  const [vaccinesUpToDate, setVaccinesUpToDate] = useState(false)
  const [isCastrated, setIsCastrated] = useState(false)
  const [notInHeat, setNotInHeat] = useState(false)

  const hotel = HOTEL_DATA
  const reservation = RESERVATION_DATA

  const basePrice = reservation.pricePerNight * reservation.nights
  const transportPrice = includeTransport ? reservation.transportPrice : 0
  const totalPrice = basePrice + transportPrice

  const updatePet = (index: number, field: keyof PetData, value: string | number) => {
    const newPets = [...pets]
    newPets[index] = { ...newPets[index], [field]: value }
    setPets(newPets)
  }

  const incrementAge = (index: number) => {
    const newPets = [...pets]
    newPets[index].age = Math.min(newPets[index].age + 1, 25)
    setPets(newPets)
  }

  const decrementAge = (index: number) => {
    const newPets = [...pets]
    newPets[index].age = Math.max(newPets[index].age - 1, 0)
    setPets(newPets)
  }

  const allConditionsAccepted = vaccinesUpToDate && isCastrated && notInHeat

  return (
    <main className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#0B1F3A" }}>
      <div className="w-full max-w-[1200px] flex flex-col" style={{ backgroundColor: "#ffffff" }}>
        {/* Top navigation */}
        <SiteNavbar />

        {/* Search summary bar */}
        <SearchSummaryBar
          data={{
            city: "Santiago",
            dateFrom: "7 mayo",
            dateTo: "9 mayo",
            petCount: 2,
            withTransport: true,
          }}
          onChangeClick={() => {}}
        />

        {/* Main content */}
        <div className="w-full px-4 pb-4 md:px-6 md:pb-6 pt-4">
          {/* Two column layout - reversed: 25% left, 75% right */}
          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* Left column - 25% (info cards) */}
            <div className="flex flex-col gap-4 lg:w-1/4 order-1 lg:order-1">
              
              {/* Hotel photo */}
              <div className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: "#E5E7EB" }}>
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={hotel.image}
                    alt={hotel.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm" style={{ color: "#0A1830" }}>{hotel.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={12} style={{ color: "#6B7280" }} />
                    <span className="text-xs" style={{ color: "#6B7280" }}>{hotel.location}</span>
                  </div>
                </div>
              </div>

              {/* Reservation summary (left column) */}
              <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: "#0A1830" }}>Resumen Reserva</h3>
                <ul className="flex flex-col gap-1.5 text-xs" style={{ color: "#555" }}>
                  <li>{reservation.petCount} mascotas, {reservation.petSize}</li>
                  <li>{reservation.nights} noches ({reservation.dateFrom} - {reservation.dateTo})</li>
                  {reservation.withTransport && <li>Transporte incluido</li>}
                </ul>
              </div>

              {/* Hotel conditions */}
              <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: "#0A1830" }}>Condiciones del Hotel</h3>
                <ul className="flex flex-col gap-2">
                  {hotel.conditions.map((condition, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs" style={{ color: "#555" }}>
                      <AlertCircle size={14} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 1 }} />
                      {condition}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cancellation policy */}
              <div className="bg-white rounded-2xl p-4 border" style={{ borderColor: "#E5E7EB" }}>
                <h3 className="font-bold text-sm mb-3" style={{ color: "#0A1830" }}>Política de Cancelación</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#555" }}>
                  {hotel.cancellationPolicy}
                </p>
              </div>
            </div>

            {/* Right column - 75% (forms) */}
            <div className="flex flex-col gap-4 lg:w-3/4 order-2 lg:order-2">

              {/* Page title */}
              <h1 className="text-2xl md:text-3xl font-bold mt-6" style={{ color: "#0A1830" }}>
                Confirmación de Reserva
              </h1>

              {/* Login button */}
              <button
                className="w-full sm:w-auto self-start flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm border-2 transition-colors hover:bg-gray-50"
                style={{ borderColor: "#0A1830", color: "#0A1830" }}
              >
                <User size={16} />
                Inicia Sesión
              </button>

              {/* User data form */}
              <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: "#0A1830" }}>
                  O completa tus datos:
                </h2>
                
                <div className="flex flex-col gap-4">
                  {/* Name row */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                        Nombre Tutor
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                          style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                          placeholder="Nombre"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                        Apellidos
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                        style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                        placeholder="Apellidos"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                      Email
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                        style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                  </div>

                  {/* Country, City and Commune */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                        País
                      </label>
                      <div className="relative">
                        <select
                          value={country}
                          onChange={(e) => {
                            setCountry(e.target.value)
                            setCity("")
                          }}
                          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 appearance-none cursor-pointer"
                          style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                        >
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                        Ciudad
                      </label>
                      <div className="relative">
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 appearance-none cursor-pointer"
                          style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                        >
                          <option value="">Seleccionar ciudad</option>
                          {(CITIES[country] || []).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                        Comuna
                      </label>
                      <input
                        type="text"
                        value={commune}
                        onChange={(e) => setCommune(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                        style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                        placeholder="Ej: Las Condes"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                      Dirección
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                        style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                        placeholder="Calle y número"
                      />
                    </div>
                  </div>

                  {/* Phone and RUT */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                        Teléfono
                      </label>
                      <div className="flex gap-2">
                        <div className="relative w-24 flex-shrink-0">
                          <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#9CA3AF" }} />
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            className="w-full pl-9 pr-2 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 appearance-none cursor-pointer"
                            style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                          >
                            {COUNTRY_CODES.map((cc) => (
                              <option key={cc.code} value={cc.code}>{cc.code}</option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                          style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                          placeholder="940302010"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                        RUT
                      </label>
                      <input
                        type="text"
                        value={rut}
                        onChange={(e) => setRut(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                        style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                        placeholder="12.345.678-9"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Save data checkbox */}
              <label
                className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl border"
                style={{ borderColor: "#F5C518", backgroundColor: "#FFFBEA" }}
              >
                <input
                  type="checkbox"
                  checked={saveData}
                  onChange={(e) => setSaveData(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer accent-[#F5C518] flex-shrink-0"
                />
                <span className="text-sm font-semibold" style={{ color: "#0A1830" }}>
                  Guardar mis datos para las próximas reservas en Jack City
                </span>
              </label>

              {/* Pets form */}
              <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: "#0A1830" }}>
                  <PawPrint size={20} className="inline-block mr-2" style={{ color: "#0A1830" }} />
                  Mi(s) Mascota(s)
                </h2>

                <div className="flex flex-col gap-6">
                  {pets.map((pet, index) => (
                    <div key={index} className="flex flex-col gap-3">
                      {pets.length > 1 && (
                        <p className="text-xs font-semibold" style={{ color: "#6B7280" }}>
                          Mascota {index + 1}
                        </p>
                      )}
                      
                      {/* Name, Breed, Size row */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                            Nombre
                          </label>
                          <input
                            type="text"
                            value={pet.name}
                            onChange={(e) => updatePet(index, "name", e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                            style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                            placeholder="Nombre mascota"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                            Raza
                          </label>
                          <input
                            type="text"
                            value={pet.breed}
                            onChange={(e) => updatePet(index, "breed", e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2"
                            style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                            placeholder="Raza"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                            Tamaño
                          </label>
                          <div className="relative">
                            <select
                              value={pet.size}
                              onChange={(e) => updatePet(index, "size", e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 appearance-none cursor-pointer"
                              style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                            >
                              {PET_SIZES.map((size) => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
                          </div>
                        </div>
                      </div>

                      {/* Gender, Weight row */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                            Género
                          </label>
                          <div className="px-4 py-2.5 rounded-xl border flex items-center gap-4" style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }}>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`gender-${index}`}
                                value="Macho"
                                checked={pet.gender === "Macho"}
                                onChange={(e) => updatePet(index, "gender", e.target.value)}
                                className="w-4 h-4 cursor-pointer accent-[#0A1830]"
                              />
                              <span className="text-sm" style={{ color: "#0A1830" }}>Macho</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`gender-${index}`}
                                value="Hembra"
                                checked={pet.gender === "Hembra"}
                                onChange={(e) => updatePet(index, "gender", e.target.value)}
                                className="w-4 h-4 cursor-pointer accent-[#0A1830]"
                              />
                              <span className="text-sm" style={{ color: "#0A1830" }}>Hembra</span>
                            </label>
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                            Peso{" "}
                            <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={pet.weight}
                              onChange={(e) => updatePet(index, "weight", e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 pr-12"
                              style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                              placeholder="0"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "#9CA3AF" }}>kg</span>
                          </div>
                        </div>
                      </div>

                      {/* Color, Age row */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                            Color{" "}
                            <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
                          </label>
                          <div className="relative">
                            <select
                              value={pet.color}
                              onChange={(e) => updatePet(index, "color", e.target.value)}
                              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 appearance-none cursor-pointer"
                              style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                            >
                              <option value="">Seleccionar color</option>
                              {PET_COLORS.map((color) => (
                                <option key={color} value={color}>{color}</option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9CA3AF" }} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-semibold mb-1.5" style={{ color: "#0A1830" }}>
                            Edad{" "}
                            <span className="font-normal" style={{ color: "#9CA3AF" }}>(opcional)</span>
                          </label>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => decrementAge(index)}
                              className="w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:bg-gray-50"
                              style={{ borderColor: "#E5E7EB" }}
                            >
                              <Minus size={16} style={{ color: "#0A1830" }} />
                            </button>
                            <div 
                              className="flex-1 h-10 flex items-center justify-center rounded-xl border text-sm font-semibold"
                              style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
                            >
                              {pet.age === 0 ? "—" : `${pet.age} año${pet.age !== 1 ? "s" : ""}`}
                            </div>
                            <button
                              type="button"
                              onClick={() => incrementAge(index)}
                              className="w-10 h-10 flex items-center justify-center rounded-xl border transition-colors hover:bg-gray-50"
                              style={{ borderColor: "#E5E7EB" }}
                            >
                              <Plus size={16} style={{ color: "#0A1830" }} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {index < pets.length - 1 && (
                        <hr className="mt-3" style={{ borderColor: "#E5E7EB" }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected transport */}
              <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                  <h2 className="text-lg font-bold" style={{ color: "#0A1830" }}>
                    Transporte Seleccionado
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setIncludeTransport(!includeTransport)
                      if (includeTransport) {
                        setSelectedDeparture(null)
                        setSelectedReturn(null)
                      }
                    }}
                    className="flex w-full items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors sm:w-auto"
                    style={{
                      backgroundColor: includeTransport ? "#FEF3C7" : "#fff",
                      borderColor: includeTransport ? "#FFC43D" : "#E5E7EB",
                      color: "#0A1830",
                    }}
                  >
                    {includeTransport ? (
                      <>
                        <X size={14} />
                        No deseo transporte
                      </>
                    ) : (
                      <>
                        <Car size={14} />
                        Agregar Transporte
                      </>
                    )}
                  </button>
                </div>

                {includeTransport && (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-2" style={{ color: "#0A1830" }}>Ida</p>
                      <div className="flex flex-col gap-2">
                        {hotel.transportOptions.departure.map((time) => (
                          <button
                            key={`dep-${time}`}
                            type="button"
                            onClick={() => setSelectedDeparture(time)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors"
                            style={{
                              backgroundColor: selectedDeparture === time ? "#FEF3C7" : "#fff",
                              borderColor: selectedDeparture === time ? "#FFC43D" : "#E5E7EB",
                              color: "#0A1830",
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                              style={{ borderColor: selectedDeparture === time ? "#FFC43D" : "#D1D5DB" }}
                            >
                              {selectedDeparture === time && (
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFC43D" }} />
                              )}
                            </div>
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-2" style={{ color: "#0A1830" }}>Regreso</p>
                      <div className="flex flex-col gap-2">
                        {hotel.transportOptions.return.map((time) => (
                          <button
                            key={`ret-${time}`}
                            type="button"
                            onClick={() => setSelectedReturn(time)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors"
                            style={{
                              backgroundColor: selectedReturn === time ? "#FEF3C7" : "#fff",
                              borderColor: selectedReturn === time ? "#FFC43D" : "#E5E7EB",
                              color: "#0A1830",
                            }}
                          >
                            <div
                              className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                              style={{ borderColor: selectedReturn === time ? "#FFC43D" : "#D1D5DB" }}
                            >
                              {selectedReturn === time && (
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFC43D" }} />
                              )}
                            </div>
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm conditions */}
              <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="text-lg font-bold mb-4" style={{ color: "#0A1830" }}>
                  Confirmar Condiciones
                </h2>

                <div className="flex flex-col gap-3">
                  {/* Vaccines checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                      style={{ 
                        borderColor: vaccinesUpToDate ? "#FFC43D" : "#D1D5DB",
                        backgroundColor: vaccinesUpToDate ? "#FFC43D" : "transparent"
                      }}
                      onClick={() => setVaccinesUpToDate(!vaccinesUpToDate)}
                    >
                      {vaccinesUpToDate && <Check size={14} style={{ color: "#0A1830" }} strokeWidth={3} />}
                    </div>
                    <span className="text-sm" style={{ color: "#333" }}>
                      Mis mascotas tienen sus vacunas al día
                    </span>
                  </label>

                  {/* Castrated checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                      style={{ 
                        borderColor: isCastrated ? "#FFC43D" : "#D1D5DB",
                        backgroundColor: isCastrated ? "#FFC43D" : "transparent"
                      }}
                      onClick={() => setIsCastrated(!isCastrated)}
                    >
                      {isCastrated && <Check size={14} style={{ color: "#0A1830" }} strokeWidth={3} />}
                    </div>
                    <span className="text-sm" style={{ color: "#333" }}>
                      Mi mascota está castrada
                    </span>
                  </label>

                  {/* Not in heat checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
                      style={{ 
                        borderColor: notInHeat ? "#FFC43D" : "#D1D5DB",
                        backgroundColor: notInHeat ? "#FFC43D" : "transparent"
                      }}
                      onClick={() => setNotInHeat(!notInHeat)}
                    >
                      {notInHeat && <Check size={14} style={{ color: "#0A1830" }} strokeWidth={3} />}
                    </div>
                    <span className="text-sm" style={{ color: "#333" }}>
                      Mi mascota no está en celo
                    </span>
                  </label>
                </div>
              </div>

              {/* Reservation summary and pay button */}
              <div className="bg-white rounded-2xl p-5 border" style={{ borderColor: "#E5E7EB" }}>
                <h2 className="text-lg font-bold mb-3" style={{ color: "#0A1830" }}>
                  Resumen Reserva
                </h2>

                <ul className="flex flex-col gap-1.5 text-sm mb-4" style={{ color: "#555" }}>
                  <li>{reservation.petCount} mascotas {reservation.petSize.toLowerCase()}</li>
                  <li>{reservation.nights} noches ({reservation.dateFrom} - {reservation.dateTo})</li>
                  {includeTransport && (
                    <li>Transporte incluido desde {reservation.transportFrom}</li>
                  )}
                </ul>

                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-4 border-t" style={{ borderColor: "#E5E7EB" }}>
                  <div>
                    <p className="text-3xl md:text-4xl font-bold" style={{ color: "#0A1830" }}>
                      {formatClp(totalPrice)}
                    </p>
                    <p className="text-xs" style={{ color: "#888" }}>IVA incluido</p>
                  </div>

                  <button
                    onClick={() => router.push("/success")}
                    disabled={!allConditionsAccepted}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-base transition-opacity disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ backgroundColor: "#FFC43D", color: "#0A1830" }}
                  >
                    Ir a Pagar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
