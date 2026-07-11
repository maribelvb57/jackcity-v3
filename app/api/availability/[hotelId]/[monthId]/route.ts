import { NextResponse } from "next/server"

interface DateAvailability {
  bookings: number
  capacity: number
  available: number
}

interface HotelAvailability {
  hotelId: number
  monthId: string
  dates: Record<number, DateAvailability>
}

// Mock data generator - simulates backend response
function generateMockAvailability(hotelId: number, monthId: string): HotelAvailability {
  const [year, month] = monthId.split("-").map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()

  const dates: Record<number, DateAvailability> = {}

  for (let day = 1; day <= daysInMonth; day++) {
    // Deterministic values based on day to avoid randomness otro commit
    const bookings = (day + month) % 10
    const capacity = 10 + (day % 5)
    const available = capacity - bookings

    dates[day] = {
      bookings,
      capacity,
      available,
    }
  }

  return {
    hotelId,
    monthId,
    dates,
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hotelId: string; monthId: string }> }
) {
  const { hotelId, monthId } = await params

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 100))

  const data = generateMockAvailability(Number(hotelId), monthId)

  return NextResponse.json(data)
}
