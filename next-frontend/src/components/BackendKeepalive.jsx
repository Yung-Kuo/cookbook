"use client";

import { useEffect } from "react";
import {
  configure,
  onVisibilityChange,
  teardown,
} from "@/lib/backendKeepaliveScheduler";

const DEFAULT_INTERVAL_MS = 840_000;

export default function BackendKeepalive() {
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const raw = process.env.NEXT_PUBLIC_BACKEND_KEEPALIVE_INTERVAL_MS;
    const intervalMs =
      raw === undefined || raw === ""
        ? DEFAULT_INTERVAL_MS
        : Number.parseInt(String(raw), 10);

    if (!apiUrl || Number.isNaN(intervalMs) || intervalMs <= 0) {
      return undefined;
    }

    configure({ apiUrl, intervalMs });

    const handler = () => onVisibilityChange();
    document.addEventListener("visibilitychange", handler);

    return () => {
      document.removeEventListener("visibilitychange", handler);
      teardown();
    };
  }, []);

  return null;
}
