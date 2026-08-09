"use client"

import { useEffect, useRef } from "react"
import { useAuth, useClerk } from "@clerk/nextjs"

/**
 * Exige sesión activa en una página cliente.
 *
 * Si el usuario no está logueado lo manda al sign-in de Clerk y lo devuelve a la
 * URL actual al terminar. El destino sale de NEXT_PUBLIC_CLERK_SIGN_IN_URL, que
 * cambia por ambiente (local/beta/prod) — ver .env.local.example.
 *
 * Mientras `isLoaded` sea false o `isSignedIn` sea false, la página no debe
 * renderizar contenido ni disparar llamadas al API.
 */
export function useRequireAuth() {
  const { isLoaded, isSignedIn } = useAuth()
  const { redirectToSignIn } = useClerk()
  const hasRedirected = useRef(false)

  useEffect(() => {
    if (!isLoaded || isSignedIn || hasRedirected.current) return
    hasRedirected.current = true
    redirectToSignIn({ signInForceRedirectUrl: window.location.href })
  }, [isLoaded, isSignedIn, redirectToSignIn])

  return { isLoaded, isSignedIn: !!isSignedIn }
}
