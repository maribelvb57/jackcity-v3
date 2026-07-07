import { ManagerLayout } from "@/components/manager-layout"
import { TransportCalendar } from "@/components/transport-calendar"

interface PageProps {
  params: Promise<{ hotelId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { hotelId } = await params
  return {
    title: `Transporte – Hotel ${hotelId}`,
    description: "Gestiona la disponibilidad mensual de transporte de tu hotel.",
  }
}

export default async function TransportPage({ params }: PageProps) {
  const { hotelId } = await params

  return (
    <ManagerLayout hotelId={hotelId}>
      <TransportCalendar hotelId={hotelId} />
    </ManagerLayout>
  )
}
