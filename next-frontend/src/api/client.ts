import { markBackendActivity } from "@/lib/backendKeepaliveScheduler"

const API_BASE = process.env.NEXT_PUBLIC_API_URL

const getApiOrigin = (): string | null => {
  if (!API_BASE) return null
  try {
    return new URL(API_BASE).origin
  } catch {
    return null
  }
}

const urlMatchesApi = (input: RequestInfo | URL): boolean => {
  const apiOrigin = getApiOrigin()
  if (!apiOrigin) return false
  try {
    let resolved: URL
    if (typeof input === "string") {
      resolved = new URL(input)
    } else if (input instanceof URL) {
      resolved = input
    } else if (typeof Request !== "undefined" && input instanceof Request) {
      resolved = new URL(input.url)
    } else {
      return false
    }
    return resolved.origin === apiOrigin
  } catch {
    return false
  }
}

/**
 * Wraps native fetch and marks backend activity for the Render keepalive scheduler
 * when the request targets NEXT_PUBLIC_API_URL.
 */
export const apiFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  if (urlMatchesApi(input)) {
    markBackendActivity()
  }
  return fetch(input, init)
}
