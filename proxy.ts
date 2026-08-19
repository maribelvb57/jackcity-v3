import { clerkMiddleware } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { CLICK_IDS_COOKIE, CLICK_IDS_COOKIE_OPTIONS, readClickIdsFromUrl } from '@/lib/click-ids'

export default clerkMiddleware(async (auth, req) => {
  const clickIds = readClickIdsFromUrl(req.nextUrl.searchParams)

  // Sin identificadores de campaña el request pasa intacto.
  if (!clickIds) return

  // First-touch wins: el primer clic atribuido es el que se conserva.
  if (req.cookies.has(CLICK_IDS_COOKIE)) return

  const res = NextResponse.next()
  res.cookies.set(CLICK_IDS_COOKIE, JSON.stringify(clickIds), CLICK_IDS_COOKIE_OPTIONS)
  return res
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
