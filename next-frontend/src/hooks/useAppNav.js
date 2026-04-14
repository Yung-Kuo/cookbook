"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getLoginHref,
  getPersonalHref,
  getLikedHref,
} from "@/lib/appNav";

export function useAppNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuth();

  const loginHref = getLoginHref(pathname, searchParams);
  const personalHref = getPersonalHref(user, isAuthenticated, loginHref);
  const likedHref = getLikedHref(user, isAuthenticated, loginHref);

  return {
    pathname,
    searchParams,
    loginHref,
    personalHref,
    likedHref,
    user,
    isAuthenticated,
    logout,
  };
}
