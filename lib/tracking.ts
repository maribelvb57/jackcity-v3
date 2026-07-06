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

export function getTrackingHeaders(): Record<string, string> {
  return {
    "X-Visitor-Id": getVisitorId(),
    "X-Session-Id": getSessionId(),
  }
}
