import { ManagerLayout } from "@/components/manager-layout"
import { AvailabilityCalendar } from "@/components/availability-calendar"

interface PageProps {
  params: Promise<{ hotelId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { hotelId } = await params
  return {
    title: `Disponibilidad – Hotel ${hotelId}`,
    description: "Gestiona la disponibilidad mensual de tu hotel.",
  }
}

export default async function AvailabilityPage({ params }: PageProps) {
  const { hotelId } = await params

  return (
    <ManagerLayout hotelId={hotelId}>
      <AvailabilityCalendar hotelId={hotelId} />
    </ManagerLayout>
  )
}
