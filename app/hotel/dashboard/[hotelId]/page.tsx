"use client"

import { use, useState } from "react"
import {
  Home,
  Calendar,
  CalendarDays,
  PawPrint,
  DollarSign,
  Star,
  Store,
  Settings,
  Headset,
  Plus,
  ChevronDown,
  BedDouble,
  Info,
  MoreVertical,
  Bell,
  ArrowUp,
} from "lucide-react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts"

// ─── Mock data ──────────────────────────────────────────────────────────────

const OCCUPANCY = [
  { day: 1, value: 52 }, { day: 2, value: 58 }, { day: 3, value: 61 }, { day: 4, value: 66 },
  { day: 5, value: 63 }, { day: 6, value: 69 }, { day: 7, value: 64 }, { day: 8, value: 60 },
  { day: 9, value: 58 }, { day: 10, value: 62 }, { day: 11, value: 70 }, { day: 12, value: 67 },
  { day: 13, value: 55 }, { day: 14, value: 59 }, { day: 15, value: 64 }, { day: 16, value: 72 },
  { day: 17, value: 68 }, { day: 18, value: 74 }, { day: 19, value: 66 }, { day: 20, value: 62 },
  { day: 21, value: 69 }, { day: 22, value: 76 }, { day: 23, value: 71 }, { day: 24, value: 65 },
  { day: 25, value: 70 }, { day: 26, value: 68 }, { day: 27, value: 63 }, { day: 28, value: 72 },
  { day: 29, value: 78 }, { day: 30, value: 80 }, { day: 31, value: 77 },
]

const STATUS_DATA = [
  { name: "Confirmadas", value: 18, pct: 64, color: "#22C55E" },
  { name: "Pendientes", value: 6, pct: 21, color: "#F59E0B" },
  { name: "Completadas", value: 3, pct: 11, color: "#3B82F6" },
  { name: "Canceladas", value: 1, pct: 4, color: "#EF4444" },
]

const TOP_BREEDS = [
  { breed: "Golden Retriever", count: 7 },
  { breed: "Poodle", count: 5 },
  { breed: "Labrador", count: 4 },
  { breed: "Bulldog Francés", count: 3 },
  { breed: "Beagle", count: 2 },
]

type BookingStatus = "Confirmada" | "Pendiente"

const UPCOMING: Array<{
  dateTop: string; dateBottom: string
  guest: string; pet: string; petBreed: string
  range: string; nights: string
  status: BookingStatus; total: string
}> = [
  { dateTop: "Hoy", dateBottom: "8 may", guest: "Camila Rodríguez", pet: "Koda", petBreed: "Labrador", range: "8 may – 10 may", nights: "2 noches", status: "Confirmada", total: "$98.000" },
  { dateTop: "Mañana", dateBottom: "9 may", guest: "Javier Moena", pet: "Luna", petBreed: "Poodle", range: "9 may – 12 may", nights: "3 noches", status: "Confirmada", total: "$147.000" },
  { dateTop: "11 may", dateBottom: "", guest: "María José Silva", pet: "Simba", petBreed: "Golden Retriever", range: "11 may – 13 may", nights: "2 noches", status: "Pendiente", total: "$96.000" },
  { dateTop: "13 may", dateBottom: "", guest: "Andrés Villela", pet: "Rocky", petBreed: "Bulldog Francés", range: "13 may – 14 may", nights: "1 noche", status: "Confirmada", total: "$55.000" },
]

const NAV_ITEMS = [
  { icon: Home, label: "Resumen", active: true },
  { icon: Calendar, label: "Reservas", active: false },
  { icon: CalendarDays, label: "Calendario", active: false },
  { icon: PawPrint, label: "Huéspedes", active: false },
  { icon: DollarSign, label: "Finanzas", active: false },
  { icon: Star, label: "Opiniones", active: false },
  { icon: Store, label: "Mi hotel", active: false },
  { icon: Settings, label: "Configuración", active: false },
]

// ─── Small pieces ─────────────────────────────────────────────────────────────

function Avatar({ label, tone }: { label: string; tone: string }) {
  return (
    <div
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
      style={{ backgroundColor: tone, color: "#0A1830" }}
    >
      {label}
    </div>
  )
}

function KpiCard({
  icon: Icon, iconColor, iconBg, label, value, delta,
}: {
  icon: typeof Home; iconColor: string; iconBg: string; label: string; value: string; delta: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#EAECEF" }}>
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: iconBg }}>
          <Icon size={22} style={{ color: iconColor }} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium" style={{ color: "#6B7280" }}>{label}</p>
          <p className="mt-1 text-3xl font-bold leading-none" style={{ color: "#0A1830" }}>{value}</p>
          <p className="mt-2 flex items-center gap-1 text-xs font-semibold" style={{ color: "#16A34A" }}>
            <ArrowUp size={13} />
            {delta} <span className="font-medium" style={{ color: "#9CA3AF" }}>vs. abril</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const confirmed = status === "Confirmada"
  return (
    <span
      className="inline-flex rounded-full px-3 py-1 text-xs font-semibold"
      style={{
        backgroundColor: confirmed ? "#DCFCE7" : "#FEF3C7",
        color: confirmed ? "#16A34A" : "#B45309",
      }}
    >
      {status}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ hotelId: string }>
}

export default function HotelDashboardPage({ params }: PageProps) {
  use(params) // hotelId disponible para cuando conectemos data real
  const [range] = useState("Por día")

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#F6F7F9" }}>

      {/* ─── Sidebar ─── */}
      <aside className="hidden w-64 flex-shrink-0 flex-col justify-between lg:flex" style={{ backgroundColor: "#0C1B2E" }}>
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 px-6 py-6">
            <PawPrint size={22} style={{ color: "#FFC43D" }} />
            <span className="text-xl font-bold tracking-tight">
              <span style={{ color: "#FFFFFF" }}>Jack</span>
              <span style={{ color: "#FFC43D" }}>City</span>
            </span>
          </div>

          {/* Profile */}
          <div className="mx-4 mb-4 flex items-center gap-3 rounded-xl px-3 py-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-lg" style={{ backgroundColor: "#C9A66B" }}>
              🐶
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">Hotel Happy Paws</p>
              <p className="flex items-center gap-1 truncate text-xs" style={{ color: "#8CA0B3" }}>
                Providencia, Santiago <ChevronDown size={12} />
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1 px-3">
            {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
              <button
                key={label}
                type="button"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: active ? "rgba(255,255,255,0.10)" : "transparent",
                  color: active ? "#FFFFFF" : "#8CA0B3",
                }}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Help card */}
        <div className="m-4 rounded-xl px-4 py-4" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-2">
            <Headset size={18} style={{ color: "#FFC43D" }} />
            <p className="text-sm font-bold text-white">¿Necesitas ayuda?</p>
          </div>
          <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "#8CA0B3" }}>
            Escríbenos por WhatsApp <ChevronDown size={12} className="-rotate-90" />
          </p>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <main className="min-w-0 flex-1 px-5 py-6 sm:px-8">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#0A1830" }}>¡Hola, María! 👋</h1>
            <p className="mt-1 text-sm" style={{ color: "#6B7280" }}>Aquí tienes un resumen de tu hotel hoy.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold shadow-sm"
              style={{ borderColor: "#E5E7EB", color: "#0A1830" }}
            >
              1 – 31 de mayo, 2026
              <CalendarDays size={16} style={{ color: "#6B7280" }} />
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
              style={{ backgroundColor: "#0C1B2E" }}
            >
              <Plus size={16} />
              Nueva reserva
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard icon={CalendarDays} iconColor="#7C3AED" iconBg="#EDE9FE" label="Reservas este mes" value="28" delta="↑ 21%" />
          <KpiCard icon={BedDouble} iconColor="#16A34A" iconBg="#DCFCE7" label="Noches reservadas" value="96" delta="↑ 18%" />
          <KpiCard icon={DollarSign} iconColor="#D97706" iconBg="#FEF3C7" label="Ingresos (antes de comisiones)" value="$1.248.000" delta="↑ 16%" />
          <KpiCard icon={Star} iconColor="#2563EB" iconBg="#DBEAFE" label="Ocupación promedio" value="78%" delta="↑ 12%" />
        </div>

        {/* Middle row */}
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">

          {/* Ocupación del mes */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm xl:col-span-5" style={{ borderColor: "#EAECEF" }}>
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-base font-bold" style={{ color: "#0A1830" }}>
                Ocupación del mes <Info size={14} style={{ color: "#9CA3AF" }} />
              </p>
              <div className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: "#E5E7EB", color: "#374151" }}>
                {range} <ChevronDown size={13} style={{ color: "#9CA3AF" }} />
              </div>
            </div>
            <div className="mt-4 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={OCCUPANCY} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="occFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    ticks={[1, 8, 15, 22, 29]}
                    tickFormatter={(d) => `${d} may`}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    dy={6}
                  />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, "Ocupación"]}
                    labelFormatter={(d) => `${d} may`}
                    contentStyle={{ borderRadius: 10, border: "1px solid #E5E7EB", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={2.5} fill="url(#occFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reservas por estado */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm xl:col-span-4" style={{ borderColor: "#EAECEF" }}>
            <p className="text-base font-bold" style={{ color: "#0A1830" }}>Reservas por estado</p>
            <div className="mt-3 flex items-center gap-4">
              <div className="relative h-[180px] w-[180px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={STATUS_DATA}
                      dataKey="value"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={2}
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                    >
                      {STATUS_DATA.map((s) => <Cell key={s.name} fill={s.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: "#0A1830" }}>28</span>
                  <span className="text-xs" style={{ color: "#6B7280" }}>Reservas</span>
                </div>
              </div>
              <ul className="flex flex-col gap-3">
                {STATUS_DATA.map((s) => (
                  <li key={s.name} className="flex items-start gap-2">
                    <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#0A1830" }}>{s.name}</p>
                      <p className="text-xs" style={{ color: "#6B7280" }}>{s.value} ({s.pct}%)</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Top razas */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm xl:col-span-3" style={{ borderColor: "#EAECEF" }}>
            <p className="text-base font-bold" style={{ color: "#0A1830" }}>Top razas este mes</p>
            <ul className="mt-4 flex flex-col gap-3.5">
              {TOP_BREEDS.map((b) => (
                <li key={b.breed} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "#374151" }}>
                    <PawPrint size={15} style={{ color: "#F59E0B" }} />
                    {b.breed}
                  </span>
                  <span className="text-sm font-bold" style={{ color: "#0A1830" }}>{b.count}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-4 w-full rounded-xl border py-2.5 text-sm font-semibold"
              style={{ borderColor: "#E5E7EB", color: "#6D28D9" }}
            >
              Ver todas las razas
            </button>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">

          {/* Próximas reservas */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm xl:col-span-9" style={{ borderColor: "#EAECEF" }}>
            <p className="text-base font-bold" style={{ color: "#0A1830" }}>Próximas reservas</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>
                    <th className="pb-3 font-semibold">Fecha</th>
                    <th className="pb-3 font-semibold">Huésped</th>
                    <th className="pb-3 font-semibold">Mascota</th>
                    <th className="pb-3 font-semibold">Check-in / Check-out</th>
                    <th className="pb-3 font-semibold">Estado</th>
                    <th className="pb-3 font-semibold">Total</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {UPCOMING.map((r, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: "#F1F3F5" }}>
                      <td className="py-4 pr-4">
                        <p className="text-sm font-bold" style={{ color: "#0A1830" }}>{r.dateTop}</p>
                        {r.dateBottom && <p className="text-xs" style={{ color: "#9CA3AF" }}>{r.dateBottom}</p>}
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar label={r.guest.charAt(0)} tone="#FDE68A" />
                          <span className="text-sm font-semibold" style={{ color: "#0A1830" }}>{r.guest}</span>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#E9E5FF" }}>
                            <PawPrint size={15} style={{ color: "#7C3AED" }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold" style={{ color: "#0A1830" }}>{r.pet}</p>
                            <p className="text-xs" style={{ color: "#9CA3AF" }}>{r.petBreed}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="text-sm font-semibold" style={{ color: "#0A1830" }}>{r.range}</p>
                        <p className="text-xs" style={{ color: "#9CA3AF" }}>{r.nights}</p>
                      </td>
                      <td className="py-4 pr-4"><StatusBadge status={r.status} /></td>
                      <td className="py-4 pr-4">
                        <span className="text-sm font-bold" style={{ color: "#0A1830" }}>{r.total}</span>
                      </td>
                      <td className="py-4">
                        <button type="button" className="rounded-lg p-1.5 hover:bg-gray-100" aria-label="Más opciones">
                          <MoreVertical size={16} style={{ color: "#9CA3AF" }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-xl border py-3 text-sm font-semibold"
              style={{ borderColor: "#E5E7EB", color: "#6D28D9" }}
            >
              Ver todas las reservas
            </button>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5 xl:col-span-3">
            {/* Calificación */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#EAECEF" }}>
              <p className="text-base font-bold" style={{ color: "#0A1830" }}>Calificación promedio</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-4xl font-bold" style={{ color: "#0A1830" }}>4.8</span>
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={18} style={{ color: "#FBBF24" }} fill="#FBBF24" />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm" style={{ color: "#6B7280" }}>Basado en 87 opiniones</p>
              <button
                type="button"
                className="mt-4 w-full rounded-xl border py-2.5 text-sm font-semibold"
                style={{ borderColor: "#E5E7EB", color: "#6D28D9" }}
              >
                Ver opiniones
              </button>
            </div>

            {/* Recordatorios */}
            <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "#EAECEF" }}>
              <p className="flex items-center gap-2 text-base font-bold" style={{ color: "#0A1830" }}>
                <Bell size={17} style={{ color: "#6B7280" }} />
                Recordatorios
              </p>
              <ul className="mt-3 flex flex-col gap-2.5 text-sm" style={{ color: "#374151" }}>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: "#9CA3AF" }} />
                  2 reservas pendientes de confirmar
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: "#9CA3AF" }} />
                  3 check-ins hoy
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
