import { API_BASE } from "./config"

export type CreateWebpayPaymentResult = {
  token: string
  url: string
}

export class BookingExpiredError extends Error {
  constructor() {
    super("BOOKING_EXPIRED")
    this.name = "BookingExpiredError"
  }
}

export async function createWebpayPayment(bookingId: string): Promise<CreateWebpayPaymentResult> {
  const res = await fetch(`${API_BASE}/api/bookings/${bookingId}/payments/webpay/create`, {
    method: "POST",
  })
  if (!res.ok) {
    if (res.status === 409) {
      const body = await res.json().catch(() => null)
      if (body?.message === "BOOKING_EXPIRED") throw new BookingExpiredError()
    }
    throw new Error(`Create webpay payment failed: ${res.status}`)
  }
  return res.json()
}

export type WebpayPaymentStatus = "INITIATED" | "PENDING" | "COMMITTING" | "PAID" | "REJECTED" | "ABORTED" | "EXPIRED"

export type WebpayVoucherAmounts = {
  totalAmount: number
  paidAmount: number
  pendingAmount: number
}

export type WebpayVoucher = {
  authorized: boolean
  status: WebpayPaymentStatus
  bookingId: string
  paymentId: string
  amount: number
  buyOrder: string
  authorizationCode: string | null
  transactionDate: string | null
  paymentTypeCode: string | null
  installmentsNumber: number | null
  cardLastFourDigits: string | null
  amounts: WebpayVoucherAmounts
}

export async function getWebpayVoucherByBuyOrder(buyOrder: string, voucherToken?: string): Promise<WebpayVoucher> {
  const url = new URL(`${API_BASE}/api/payments/webpay/by-buy-order/${buyOrder}`)
  if (voucherToken) url.searchParams.set("voucherToken", voucherToken)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Get webpay voucher failed: ${res.status}`)
  return res.json()
}

export function getWebpayVoucherPdfUrl(buyOrder: string, voucherToken?: string): string {
  const url = new URL(`${API_BASE}/api/payments/webpay/by-buy-order/${buyOrder}/voucher`)
  if (voucherToken) url.searchParams.set("voucherToken", voucherToken)
  return url.toString()
}
