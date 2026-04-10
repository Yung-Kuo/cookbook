import { apiFetch } from "@/api/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
}

export function getAuthHeaders() {
  const token = getAuthToken();
  if (!token) return {};
  return { Authorization: `Token ${token}` };
}

export async function socialLogin(provider, code) {
  const endpoint =
    provider === "google"
      ? `${API_URL}/auth/google/`
      : `${API_URL}/auth/github/`;

  const callbackUrl = `${window.location.origin}/login`;

  const response = await apiFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, callback_url: callbackUrl }),
  });

  if (!response.ok) {
    const raw = await response.text();
    let message = `Login failed (${response.status})`;
    try {
      const errorData = JSON.parse(raw);
      message = errorData.detail || JSON.stringify(errorData);
    } catch {
      if (raw) message = raw;
    }
    throw new Error(message);
  }

  const data = await response.json();
  localStorage.setItem("authToken", data.key);
  return data;
}

export async function logout() {
  const token = getAuthToken();
  try {
    await apiFetch(`${API_URL}/auth/logout/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Token ${token}` } : {}),
      },
    });
  } finally {
    localStorage.removeItem("authToken");
  }
}

export async function fetchCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  const response = await apiFetch(`${API_URL}/auth/user/`, {
    headers: { Authorization: `Token ${token}` },
  });

  if (!response.ok) {
    localStorage.removeItem("authToken");
    return null;
  }

  return await response.json();
}
