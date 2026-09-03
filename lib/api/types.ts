export type ApiFetch = <T = unknown>(path: string, options?: RequestInit) => Promise<T>

/**
 * Error de una llamada al API. Suma al Error normal el status HTTP y, cuando el
 * backend lo entrega, el mensaje accionable de la respuesta.
 *
 * Ojo: `detail` viene sólo en dev/beta. En producción el backend corre con
 * `server.error.include-message: never`, así que ahí siempre es null y hay que
 * mostrar un texto propio según `status`.
 */
export class ApiError extends Error {
  readonly status: number
  readonly detail: string | null

  constructor(message: string, status: number, detail: string | null) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.detail = detail
  }
}
