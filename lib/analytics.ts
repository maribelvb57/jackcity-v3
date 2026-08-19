declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

const PURCHASE_PUSHED_KEY_PREFIX = "jc_purchase_pushed_"

type PurchaseParams = {
  // buyOrder de Webpay: identifica la transacción en GA4.
  transactionId: string
  value: number
  hotelId: string
  hotelName: string
}

/**
 * Pushea el evento `purchase` de GA4 al dataLayer de GTM.
 * Sólo debe llamarse con un pago autorizado por Transbank.
 *
 * El dedupe por transactionId en sessionStorage evita contar la conversión dos
 * veces si el usuario recarga la página de éxito (la URL lleva el orderId y es
 * recargable) o si el efecto se re-ejecuta en el mismo ciclo de vida.
 */
export function pushPurchaseEvent({ transactionId, value, hotelId, hotelName }: PurchaseParams) {
  const storageKey = `${PURCHASE_PUSHED_KEY_PREFIX}${transactionId}`
  if (sessionStorage.getItem(storageKey)) return

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ ecommerce: null })
  window.dataLayer.push({
    event: "purchase",
    ecommerce: {
      transaction_id: transactionId,
      currency: "CLP",
      value,
      items: [
        {
          item_id: hotelId,
          item_name: hotelName,
          item_category: "Housing",
          price: value,
          quantity: 1,
        },
      ],
    },
  })

  sessionStorage.setItem(storageKey, "1")
}
