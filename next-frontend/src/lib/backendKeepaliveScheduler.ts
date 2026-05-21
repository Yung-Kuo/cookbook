let timeoutId: ReturnType<typeof setTimeout> | null = null
let apiUrl: string | null = null
let intervalMs = 0

const clearPending = () => {
  if (timeoutId != null) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

const scheduleNext = () => {
  if (!apiUrl || intervalMs <= 0) return
  const baseUrl = apiUrl
  timeoutId = setTimeout(async () => {
    timeoutId = null
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return
    }
    const base = baseUrl.replace(/\/$/, "")
    try {
      await fetch(`${base}/health/`, { method: "GET", cache: "no-store" })
    } catch {
      // ignore
    }
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return
    }
    scheduleNext()
  }, intervalMs)
}

type ConfigureOpts = {
  apiUrl: string
  intervalMs: number
}

export const configure = ({ apiUrl: url, intervalMs: ms }: ConfigureOpts) => {
  teardown()
  apiUrl = url || null
  intervalMs = typeof ms === "number" && !Number.isNaN(ms) ? ms : 0
  if (!apiUrl || intervalMs <= 0) {
    return
  }
  scheduleNext()
}

export const markBackendActivity = () => {
  if (!apiUrl || intervalMs <= 0) return
  clearPending()
  scheduleNext()
}

/** Call when document.visibilityState changes (e.g. from visibilitychange). */
export const onVisibilityChange = () => {
  if (typeof document === "undefined") return
  if (document.visibilityState === "hidden") {
    clearPending()
  } else {
    scheduleNext()
  }
}

export const teardown = () => {
  clearPending()
  apiUrl = null
  intervalMs = 0
}
