/**
 * Shared route targets and active-state logic for app navigation (navbar, mobile bar, sheets).
 */

/**
 * @param {string} pathname
 * @param {{ toString(): string } | null | undefined} searchParams
 */
export function getReturnTarget(pathname, searchParams) {
  if (pathname === "/login") return "/";
  const q =
    searchParams && typeof searchParams.toString === "function"
      ? searchParams.toString()
      : "";
  return q ? `${pathname}?${q}` : pathname;
}

/**
 * @param {string} pathname
 * @param {{ toString(): string } | null | undefined} searchParams
 */
export function getLoginHref(pathname, searchParams) {
  if (pathname === "/login") return "/login";
  const next = getReturnTarget(pathname, searchParams);
  return `/login?next=${encodeURIComponent(next)}`;
}

/**
 * @param {{ pk?: number | null } | null} user
 * @param {boolean} isAuthenticated
 * @param {string} loginHref
 */
export function getPersonalHref(user, isAuthenticated, loginHref) {
  return isAuthenticated && user?.pk != null ? `/users/${user.pk}` : loginHref;
}

/**
 * @param {{ pk?: number | null } | null} user
 * @param {boolean} isAuthenticated
 * @param {string} loginHref
 */
export function getLikedHref(user, isAuthenticated, loginHref) {
  return isAuthenticated && user?.pk != null
    ? `/users/${user.pk}/liked`
    : loginHref;
}

/**
 * @param {string} pathname
 * @param {string} href
 * @param {number | null | undefined} userPk
 */
export function isNavLinkActive(pathname, href, userPk) {
  const base = userPk != null ? `/users/${userPk}` : null;
  if (href === "/") {
    return pathname === "/";
  }
  if (base && href === base) {
    const norm = pathname.replace(/\/$/, "") || "/";
    return norm === base;
  }
  if (base && href === `${base}/liked`) {
    return pathname.startsWith(`${base}/liked`);
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
