const STORAGE_KEY = "cookbook_post_login_return";

/**
 * Only allow same-origin relative paths (no open redirects).
 */
export function safeInternalPath(path) {
  if (typeof path !== "string" || path.length > 2048) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (path.includes("://") || path.includes("\\")) return null;
  return path;
}

export function rememberReturnPathFromNextParam(nextParam) {
  if (typeof window === "undefined") return;
  const safe = safeInternalPath(nextParam);
  if (safe) sessionStorage.setItem(STORAGE_KEY, safe);
}

export function clearStoredReturnPath() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function consumeReturnPath() {
  if (typeof window === "undefined") return "/";
  const raw = sessionStorage.getItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  return safeInternalPath(raw) || "/";
}

/** Prefer ?next= in URL; otherwise use value stored before OAuth round trip. */
export function getPostLoginDestination(searchParams) {
  const fromQuery = safeInternalPath(searchParams.get("next"));
  if (fromQuery) {
    clearStoredReturnPath();
    return fromQuery;
  }
  return consumeReturnPath();
}
