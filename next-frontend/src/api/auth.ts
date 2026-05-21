import { apiFetch } from "@/api/client"
import type { AuthUser, SocialLoginResponse } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("authToken")
}

export const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken()
  if (!token) return {}
  return { Authorization: `Token ${token}` }
}

export const socialLogin = async (
  provider: string,
  code: string,
): Promise<SocialLoginResponse> => {
  const endpoint =
    provider === "google"
      ? `${API_URL}/auth/google/`
      : `${API_URL}/auth/github/`

  const callbackUrl = `${window.location.origin}/login`

  const response = await apiFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, callback_url: callbackUrl }),
  })

  if (!response.ok) {
    const raw = await response.text()
    let message = `Login failed (${response.status})`
    try {
      const errorData = JSON.parse(raw) as { detail?: string }
      message = errorData.detail || JSON.stringify(errorData)
    } catch {
      if (raw) message = raw
    }
    throw new Error(message)
  }

  const data = (await response.json()) as SocialLoginResponse
  localStorage.setItem("authToken", data.key)
  return data
}

export const logout = async (): Promise<void> => {
  const token = getAuthToken()
  try {
    await apiFetch(`${API_URL}/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    })
  } finally {
    localStorage.removeItem("authToken")
  }
}

export const fetchCurrentUser = async (): Promise<AuthUser | null> => {
  const token = getAuthToken()
  if (!token) return null

  const response = await apiFetch(`${API_URL}/auth/user/`, {
    headers: { Authorization: `Token ${token}` },
  })

  if (!response.ok) {
    localStorage.removeItem("authToken")
    return null
  }

  return (await response.json()) as AuthUser
}
