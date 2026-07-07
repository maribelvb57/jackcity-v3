import { ManagerLayout } from "@/components/manager-layout"
import { PricingAndDiscounts } from "@/components/pricing-and-discounts"

interface PageProps {
  params: Promise<{ hotelId: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { hotelId } = await params
  return {
    title: `Precios y Descuentos – Hotel ${hotelId}`,
    description: "Configura los precios y descuentos de tu hotel.",
  }
}

export default async function PricingPage({ params }: PageProps) {
  const { hotelId } = await params

  return (
    <ManagerLayout hotelId={hotelId}>
      <PricingAndDiscounts hotelId={hotelId} />
    </ManagerLayout>
  )
}
