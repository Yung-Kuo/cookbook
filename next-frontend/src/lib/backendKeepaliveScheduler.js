let timeoutId = null;
let apiUrl = null;
let intervalMs = 0;

function clearPending() {
  if (timeoutId != null) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
}

function scheduleNext() {
  if (!apiUrl || intervalMs <= 0) return;
  timeoutId = setTimeout(async () => {
    timeoutId = null;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }
    const base = apiUrl.replace(/\/$/, "");
    try {
      await fetch(`${base}/health/`, { method: "GET", cache: "no-store" });
    } catch {
      // ignore
    }
    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }
    scheduleNext();
  }, intervalMs);
}

/**
 * @param {{ apiUrl: string, intervalMs: number }} opts
 */
export function configure({ apiUrl: url, intervalMs: ms }) {
  teardown();
  apiUrl = url || null;
  intervalMs = typeof ms === "number" && !Number.isNaN(ms) ? ms : 0;
  if (!apiUrl || intervalMs <= 0) {
    return;
  }
  scheduleNext();
}

export function markBackendActivity() {
  if (!apiUrl || intervalMs <= 0) return;
  clearPending();
  scheduleNext();
}

/** Call when document.visibilityState changes (e.g. from visibilitychange). */
export function onVisibilityChange() {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "hidden") {
    clearPending();
  } else {
    scheduleNext();
  }
}

export function teardown() {
  clearPending();
  apiUrl = null;
  intervalMs = 0;
}
