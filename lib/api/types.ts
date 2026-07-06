export type ApiFetch = <T = unknown>(path: string, options?: RequestInit) => Promise<T>
