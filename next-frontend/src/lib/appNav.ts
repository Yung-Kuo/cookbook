/**
 * Shared route targets and active-state logic for app navigation (navbar, mobile bar, sheets).
 */

import type { AuthUser } from "@/types"

export const getReturnTarget = (
  pathname: string,
  searchParams: { toString(): string } | null | undefined,
): string => {
  if (pathname === "/login") return "/"
  const q =
    searchParams && typeof searchParams.toString === "function"
      ? searchParams.toString()
      : ""
  return q ? `${pathname}?${q}` : pathname
}

export const getLoginHref = (
  pathname: string,
  searchParams: { toString(): string } | null | undefined,
): string => {
  if (pathname === "/login") return "/login"
  const next = getReturnTarget(pathname, searchParams)
  return `/login?next=${encodeURIComponent(next)}`
}

export const getPersonalHref = (
  user: Pick<AuthUser, "pk"> | null,
  isAuthenticated: boolean,
  loginHref: string,
): string => {
  return isAuthenticated && user?.pk != null ? `/users/${user.pk}` : loginHref
}

export const getLikedHref = (
  user: Pick<AuthUser, "pk"> | null,
  isAuthenticated: boolean,
  loginHref: string,
): string => {
  return isAuthenticated && user?.pk != null
    ? `/users/${user.pk}/liked`
    : loginHref
}

export const isNavLinkActive = (
  pathname: string,
  href: string,
  userPk: number | null | undefined,
): boolean => {
  const base = userPk != null ? `/users/${userPk}` : null
  if (href === "/") {
    return pathname === "/"
  }
  if (base && href === base) {
    const norm = pathname.replace(/\/$/, "") || "/"
    return norm === base
  }
  if (base && href === `${base}/liked`) {
    return pathname.startsWith(`${base}/liked`)
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
