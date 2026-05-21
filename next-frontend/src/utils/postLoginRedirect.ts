const STORAGE_KEY = "cookbook_post_login_return"

/** Only allow same-origin relative paths (no open redirects). */
export const safeInternalPath = (path: unknown): string | null => {
  if (typeof path !== "string" || path.length > 2048) return null
  if (!path.startsWith("/") || path.startsWith("//")) return null
  if (path.includes("://") || path.includes("\\")) return null
  return path
}

export const rememberReturnPathFromNextParam = (nextParam: string | null) => {
  if (typeof window === "undefined") return
  const safe = safeInternalPath(nextParam)
  if (safe) sessionStorage.setItem(STORAGE_KEY, safe)
}

export const clearStoredReturnPath = () => {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(STORAGE_KEY)
}

export const consumeReturnPath = (): string => {
  if (typeof window === "undefined") return "/"
  const raw = sessionStorage.getItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
  return safeInternalPath(raw) || "/"
}

/** Prefer ?next= in URL; otherwise use value stored before OAuth round trip. */
export const getPostLoginDestination = (searchParams: URLSearchParams): string => {
  const fromQuery = safeInternalPath(searchParams.get("next"))
  if (fromQuery) {
    clearStoredReturnPath()
    return fromQuery
  }
  return consumeReturnPath()
}
