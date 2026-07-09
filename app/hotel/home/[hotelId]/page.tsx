"use client"

import { use, type ReactNode } from "react"
import Link from "next/link"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowUp,
  BedDouble,
  Bell,
  Building2,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  DollarSign,
  HelpCircle,
  Home,
  Info,
  MoreVertical,
  PawPrint,
  Plus,
  Settings,
  Star,
} from "lucide-react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

type PageProps = {
  params: Promise<{ hotelId: string }>
}

const dogAvatar =
  "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=160&q=80"

const navItems = [
  { label: "Resumen", icon: Home, href: "home" },
  { label: "Reservas", icon: ClipboardList, href: "bookings" },
  { label: "Calendario", icon: CalendarDays, href: "availability" },
  { label: "Huéspedes", icon: PawPrint, href: "guests" },
  { label: "Finanzas", icon: DollarSign, href: "finances" },
  { label: "Opiniones", icon: Star, href: "reviews" },
  { label: "Mi hotel", icon: Building2, href: "info" },
  { label: "Configuración", icon: Settings, href: "settings" },
]

const summaryCards = [
  {
    label: "Reservas este mes",
    value: "28",
    trend: "21%",
    detail: "vs. abril",
    icon: Calendar,
    iconColor: "#6E4EF6",
    iconBg: "#E7DDFF",
  },
  {
    label: "Noches reservadas",
    value: "96",
    trend: "18%",
    detail: "vs. abril",
    icon: BedDouble,
    iconColor: "#3DBE78",
    iconBg: "#DDF7E9",
  },
  {
    label: "Ingresos (antes de comisiones)",
    value: "$1.248.000",
    trend: "16%",
    detail: "vs. abril",
    icon: DollarSign,
    iconColor: "#E9A414",
    iconBg: "#FFE382",
  },
  {
    label: "Ocupación promedio",
    value: "78%",
    trend: "12%",
    detail: "vs. abril",
    icon: Star,
    iconColor: "#4194E9",
    iconBg: "#D6EAFF",
  },
]

const occupancyData = [
  { day: "1 may", occupancy: 50 },
  { day: "2 may", occupancy: 51 },
  { day: "3 may", occupancy: 56 },
  { day: "4 may", occupancy: 64 },
  { day: "5 may", occupancy: 71 },
  { day: "6 may", occupancy: 70 },
  { day: "7 may", occupancy: 64 },
  { day: "8 may", occupancy: 59 },
  { day: "9 may", occupancy: 66 },
  { day: "10 may", occupancy: 56 },
  { day: "11 may", occupancy: 66 },
  { day: "12 may", occupancy: 71 },
  { day: "13 may", occupancy: 63 },
  { day: "14 may", occupancy: 67 },
  { day: "15 may", occupancy: 46 },
  { day: "16 may", occupancy: 47 },
  { day: "17 may", occupancy: 65 },
  { day: "18 may", occupancy: 79 },
  { day: "19 may", occupancy: 64 },
  { day: "20 may", occupancy: 67 },
  { day: "21 may", occupancy: 61 },
  { day: "22 may", occupancy: 79 },
  { day: "23 may", occupancy: 72 },
  { day: "24 may", occupancy: 76 },
  { day: "25 may", occupancy: 56 },
  { day: "26 may", occupancy: 62 },
  { day: "27 may", occupancy: 66 },
  { day: "28 may", occupancy: 75 },
  { day: "29 may", occupancy: 79 },
]

const statusData = [
  { name: "Confirmadas", value: 18, percent: 64, fill: "#45C57D" },
  { name: "Pendientes", value: 6, percent: 21, fill: "#F5BE2F" },
  { name: "Completadas", value: 3, percent: 11, fill: "#54A5F7" },
  { name: "Canceladas", value: 1, percent: 4, fill: "#F0526E" },
]

const breedRows = [
  ["Golden Retriever", "7"],
  ["Poodle", "5"],
  ["Labrador", "4"],
  ["Bulldog Francés", "3"],
  ["Beagle", "2"],
]

const reservations = [
  {
    date: "Hoy\n8 may",
    guest: "Camila Rodríguez",
    guestAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80",
    pet: "Koda",
    breed: "Labrador",
    petAvatar:
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=96&q=80",
    stay: "8 may – 10 may",
    nights: "2 noches",
    status: "Confirmada",
    statusTone: "success",
    total: "$98.000",
  },
  {
    date: "Mañana\n9 may",
    guest: "Javier Moena",
    guestAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&q=80",
    pet: "Luna",
    breed: "Poodle",
    petAvatar:
      "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=96&q=80",
    stay: "9 may – 12 may",
    nights: "3 noches",
    status: "Confirmada",
    statusTone: "success",
    total: "$147.000",
  },
  {
    date: "11 may",
    guest: "María José Silva",
    guestAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&q=80",
    pet: "Simba",
    breed: "Golden Retriever",
    petAvatar:
      "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=96&q=80",
    stay: "11 may – 13 may",
    nights: "2 noches",
    status: "Pendiente",
    statusTone: "warning",
    total: "$96.000",
  },
  {
    date: "13 may",
    guest: "Andrés Villela",
    guestAvatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&q=80",
    pet: "Rocky",
    breed: "Bulldog Francés",
    petAvatar:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=96&q=80",
    stay: "13 may – 14 may",
    nights: "1 noche",
    status: "Confirmada",
    statusTone: "success",
    total: "$55.000",
  },
]

const occupancyConfig = {
  occupancy: {
    label: "Ocupación",
    color: "#6F49F5",
  },
} satisfies ChartConfig

const statusConfig = {
  value: {
    label: "Reservas",
  },
  Confirmadas: {
    label: "Confirmadas",
    color: "#45C57D",
  },
  Pendientes: {
    label: "Pendientes",
    color: "#F5BE2F",
  },
  Completadas: {
    label: "Completadas",
    color: "#54A5F7",
  },
  Canceladas: {
    label: "Canceladas",
    color: "#F0526E",
  },
} satisfies ChartConfig

function Sidebar({ hotelId }: { hotelId: string }) {
  return (
    <aside className="flex min-h-full w-full flex-col bg-[#071E37] px-5 py-8 text-white lg:sticky lg:top-0 lg:h-screen lg:w-[320px] lg:shrink-0">
      <Link href={`/hotel/home/${hotelId}`} className="flex items-center gap-1.5 px-4">
        <span className="text-[32px] font-bold leading-none text-[#FFC43D]">Jack</span>
        <span className="relative text-[32px] font-bold leading-none text-white">
          <PawPrint
            aria-hidden="true"
            className="absolute -top-2 left-[18px] h-4 w-4 rotate-[-10deg] text-[#FFC43D]"
            fill="#FFC43D"
          />
          City
        </span>
      </Link>

      <div className="mt-12 flex items-center gap-4 px-2">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-[#FFC43D] bg-white">
          <img src={dogAvatar} alt="Hotel Happy Paws" className="h-full w-full object-cover" />
          <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-[#071E37] bg-[#22C5D6]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">Hotel Happy Paws</p>
          <button
            type="button"
            className="mt-1 inline-flex max-w-full items-center gap-1 text-left text-sm text-white/80"
          >
            <span className="truncate">Providencia, Santiago</span>
            <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </div>

      <nav className="mt-10 flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = item.href === "home"
            const href =
              item.href === "home"
                ? `/hotel/home/${hotelId}`
                : item.href === "guests" || item.href === "finances" || item.href === "reviews" || item.href === "settings"
                  ? `/hotel/home/${hotelId}`
                  : `/hotel/${item.href}/${hotelId}`

            return (
              <li key={item.label}>
                <Link
                  href={href}
                  className={cn(
                    "flex min-h-12 items-center gap-4 rounded-lg px-5 text-[15px] font-semibold transition-colors",
                    isActive
                      ? "bg-[#244A7F] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon
                    aria-hidden="true"
                    className={cn("h-6 w-6", isActive ? "text-[#55A7FF]" : "text-white/80")}
                    fill={isActive && item.label === "Resumen" ? "#55A7FF" : "none"}
                  />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-8 rounded-lg bg-[#254978] p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/80">
            <HelpCircle aria-hidden="true" className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">¿Necesitas ayuda?</p>
            <p className="mt-1 truncate text-xs text-white/72">Escríbenos por WhatsApp</p>
          </div>
          <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0 text-white/72" />
        </div>
      </div>
    </aside>
  )
}

function DashboardCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[#DFE6F0] bg-white shadow-[0_18px_42px_rgba(16,24,40,0.035)]",
        className,
      )}
    >
      {children}
    </section>
  )
}

function SummaryCard({ item }: { item: (typeof summaryCards)[number] }) {
  const Icon = item.icon

  return (
    <DashboardCard className="flex min-h-[156px] items-center gap-6 px-6 py-5">
      <div
        className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: item.iconBg, color: item.iconColor }}
      >
        <Icon aria-hidden="true" className="h-8 w-8" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-medium text-[#18233A]">{item.label}</p>
        <p className="mt-2 text-[31px] font-bold leading-none text-[#101B31]">{item.value}</p>
        <p className="mt-4 flex items-center gap-1.5 text-sm text-[#344054]">
          <ArrowUp aria-hidden="true" className="h-4 w-4 text-[#0BA566]" />
          <span className="font-semibold text-[#0BA566]">{item.trend}</span>
          <span>{item.detail}</span>
        </p>
      </div>
    </DashboardCard>
  )
}

function OccupancyChart() {
  return (
    <DashboardCard className="p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[#111827]">Ocupación del mes</h2>
          <Info aria-hidden="true" className="h-4 w-4 text-[#9AA4B2]" />
        </div>
        <button
          type="button"
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#DDE4EE] bg-white px-4 text-sm font-semibold text-[#18233A] shadow-sm"
        >
          Por día
          <ChevronDown aria-hidden="true" className="h-4 w-4 text-[#98A2B3]" />
        </button>
      </div>

      <ChartContainer config={occupancyConfig} className="h-[260px] w-full">
        <AreaChart data={occupancyData} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="occupancyFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#7652F6" stopOpacity={0.26} />
              <stop offset="96%" stopColor="#7652F6" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#E9EEF5" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            interval={6}
            tickMargin={12}
            tick={{ fill: "#344054", fontSize: 13 }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(value) => `${value}%`}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fill: "#344054", fontSize: 13 }}
          />
          <ChartTooltip
            cursor={{ stroke: "#7652F6", strokeWidth: 1 }}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Area
            type="monotone"
            dataKey="occupancy"
            stroke="#6F49F5"
            strokeWidth={3}
            fill="url(#occupancyFill)"
            activeDot={{ r: 5, fill: "#6F49F5", stroke: "#ffffff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ChartContainer>
    </DashboardCard>
  )
}

function StatusDonut() {
  return (
    <DashboardCard className="p-6">
      <h2 className="text-lg font-bold text-[#111827]">Reservas por estado</h2>
      <div className="mt-6 grid items-center gap-5 sm:grid-cols-[minmax(180px,1fr)_auto]">
        <div className="relative mx-auto h-[230px] w-[230px]">
          <ChartContainer config={statusConfig} className="h-full w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={103}
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[29px] font-bold leading-none text-[#101B31]">28</span>
            <span className="mt-1 text-[15px] font-medium text-[#18233A]">Reservas</span>
          </div>
        </div>

        <div className="min-w-[150px] space-y-4">
          {statusData.map((item) => (
            <div key={item.name} className="flex items-start gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.fill }} />
              <div>
                <p className="text-sm font-semibold leading-5 text-[#18233A]">{item.name}</p>
                <p className="text-sm leading-5 text-[#344054]">
                  {item.value} ({item.percent}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  )
}

function TopBreeds() {
  return (
    <DashboardCard className="p-6">
      <h2 className="text-lg font-bold text-[#111827]">Top razas este mes</h2>
      <div className="mt-5 space-y-4">
        {breedRows.map(([breed, count]) => (
          <div key={breed} className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <PawPrint aria-hidden="true" className="h-5 w-5 shrink-0 text-[#D89210]" fill="#D89210" />
              <span className="truncate text-[15px] font-medium text-[#18233A]">{breed}</span>
            </div>
            <span className="text-[15px] font-semibold text-[#101B31]">{count}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-6 h-12 w-full rounded-lg border border-[#D9E2EE] bg-white text-sm font-semibold text-[#4D2DCF]"
      >
        Ver todas las razas
      </button>
    </DashboardCard>
  )
}

function statusClass(tone: string) {
  if (tone === "warning") return "bg-[#FFF3D8] text-[#C87904]"
  return "bg-[#DDF7E9] text-[#0B8A53]"
}

function ReservationsTable() {
  return (
    <DashboardCard className="p-6">
      <h2 className="text-lg font-bold text-[#111827]">Próximas reservas</h2>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-[#D9E2EE] text-sm font-semibold text-[#344054]">
              <th className="pb-3 pr-6">Fecha</th>
              <th className="pb-3 pr-6">Huésped</th>
              <th className="pb-3 pr-6">Mascota</th>
              <th className="pb-3 pr-6">Check-in / Check-out</th>
              <th className="pb-3 pr-6">Estado</th>
              <th className="pb-3 pr-6">Total</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={`${reservation.guest}-${reservation.pet}`} className="border-b border-[#EEF2F7] last:border-b-0">
                <td className="whitespace-pre-line py-4 pr-6 text-sm font-medium leading-6 text-[#18233A]">
                  {reservation.date}
                </td>
                <td className="py-4 pr-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={reservation.guestAvatar}
                      alt={reservation.guest}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-[#18233A]">{reservation.guest}</span>
                  </div>
                </td>
                <td className="py-4 pr-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={reservation.petAvatar}
                      alt={reservation.pet}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[#18233A]">{reservation.pet}</p>
                      <p className="mt-0.5 text-xs font-medium text-[#344054]">{reservation.breed}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 pr-6">
                  <p className="text-sm font-medium text-[#18233A]">{reservation.stay}</p>
                  <p className="mt-1 text-sm text-[#344054]">{reservation.nights}</p>
                </td>
                <td className="py-4 pr-6">
                  <span
                    className={cn(
                      "inline-flex min-w-[112px] justify-center rounded-lg px-3 py-1.5 text-sm font-semibold",
                      statusClass(reservation.statusTone),
                    )}
                  >
                    {reservation.status}
                  </span>
                </td>
                <td className="py-4 pr-6 text-sm font-bold text-[#101B31]">{reservation.total}</td>
                <td className="py-4">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D9E2EE] text-[#667085]"
                    aria-label={`Más acciones para ${reservation.pet}`}
                  >
                    <MoreVertical aria-hidden="true" className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        className="mt-6 h-12 w-full rounded-lg border border-[#D9E2EE] bg-white text-sm font-semibold text-[#4D2DCF]"
      >
        Ver todas las reservas
      </button>
    </DashboardCard>
  )
}

function RatingCard() {
  return (
    <DashboardCard className="p-6">
      <h2 className="text-lg font-bold text-[#111827]">Calificación promedio</h2>
      <div className="mt-6 flex items-center gap-3">
        <span className="text-[36px] font-bold leading-none text-[#101B31]">4.8</span>
        <div className="flex items-center gap-1 text-[#F4B321]">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} aria-hidden="true" className="h-6 w-6" fill="#F4B321" />
          ))}
        </div>
      </div>
      <p className="mt-5 text-sm font-medium text-[#344054]">Basado en 87 opiniones</p>
      <button
        type="button"
        className="mt-7 h-12 w-full rounded-lg border border-[#D9E2EE] bg-white text-sm font-semibold text-[#4D2DCF]"
      >
        Ver opiniones
      </button>
    </DashboardCard>
  )
}

function RemindersCard() {
  return (
    <DashboardCard className="p-6">
      <div className="flex items-center gap-3">
        <Bell aria-hidden="true" className="h-5 w-5 text-[#667085]" />
        <h2 className="text-lg font-bold text-[#111827]">Recordatorios</h2>
      </div>
      <ul className="mt-5 space-y-4 text-sm font-medium text-[#18233A]">
        <li className="flex items-start gap-3">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#667085]" />
          <span>2 reservas pendientes de confirmar</span>
        </li>
        <li className="flex items-start gap-3">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#667085]" />
          <span>3 check-ins hoy</span>
        </li>
      </ul>
    </DashboardCard>
  )
}

function HotelDashboard({ hotelId }: { hotelId: string }) {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#101B31] lg:flex">
      <Sidebar hotelId={hotelId} />

      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto max-w-[1540px]">
          <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-[32px] font-bold leading-tight text-[#101B31] sm:text-[40px]">
                ¡Hola, María! 👋
              </h1>
              <p className="mt-2 text-lg font-medium text-[#18233A]">Aquí tienes un resumen de tu hotel hoy.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex h-14 items-center gap-5 rounded-lg border border-[#D9E2EE] bg-white px-6 text-base font-semibold text-[#111827] shadow-sm"
              >
                <span>1 – 31 de mayo, 2026</span>
                <Calendar aria-hidden="true" className="h-5 w-5 text-[#667085]" />
              </button>
              <button
                type="button"
                className="inline-flex h-14 items-center gap-2.5 rounded-lg bg-[#101B31] px-6 text-base font-semibold text-white shadow-[0_14px_30px_rgba(16,27,49,0.18)]"
              >
                <Plus aria-hidden="true" className="h-5 w-5" />
                Nueva reserva
              </button>
            </div>
          </header>

          <section className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((item) => (
              <SummaryCard key={item.label} item={item} />
            ))}
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[2fr_1.25fr_1fr]">
            <OccupancyChart />
            <StatusDonut />
            <TopBreeds />
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[2fr_1fr]">
            <ReservationsTable />
            <div className="grid gap-5">
              <RatingCard />
              <RemindersCard />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

export default function HotelHomePage({ params }: PageProps) {
  const { hotelId } = use(params)

  return <HotelDashboard hotelId={hotelId} />
}
