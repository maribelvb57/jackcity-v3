function getVisitorId(): string {
  let visitorId = localStorage.getItem("visitor_id")
  if (!visitorId) {
    visitorId = crypto.randomUUID()
    localStorage.setItem("visitor_id", visitorId)
  }
  return visitorId
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem("session_id")
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem("session_id", sessionId)
  }
  return sessionId
}

export function getTrackingHeaders(userId?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Visitor-Id": getVisitorId(),
    "X-Session-Id": getSessionId(),
  }
  if (userId) {
    headers["X-User-Id"] = userId
  }
  return headers
}
