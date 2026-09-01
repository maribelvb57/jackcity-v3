/**
 * Ambiente de la app. Lo define NEXT_PUBLIC_APP_ENV en cada deploy:
 *   dev  (default): local
 *   beta:           ambiente de pruebas
 *   prod:           producción
 *
 * El acceso a process.env.NEXT_PUBLIC_APP_ENV tiene que ser literal: Next lo
 * reemplaza en el build, así que no funciona leerlo con una key dinámica.
 */
export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV || "dev"

export const IS_PROD = APP_ENV === "prod"

/**
 * Interruptor único de todo el tracking (GTM —con GA4 y Google Ads adentro— y
 * Meta Pixel). Falla hacia el lado seguro: si la variable no está definida o
 * trae cualquier otro valor, no se carga nada y beta no ensucia las métricas
 * de producción con eventos y conversiones de prueba.
 */
export const TRACKING_ENABLED = IS_PROD
