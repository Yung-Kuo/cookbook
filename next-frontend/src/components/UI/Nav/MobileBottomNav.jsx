"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppNav } from "@/hooks/useAppNav";
import { isNavLinkActive } from "@/lib/appNav";
import NavGlobeIcon from "@/components/Icons/NavGlobeIcon";
import NavUserIcon from "@/components/Icons/NavUserIcon";
import NavHeartIcon from "@/components/Icons/NavHeartIcon";
import NavMoreIcon from "@/components/Icons/NavMoreIcon";
import NavMoreSheet from "@/components/UI/Nav/NavMoreSheet";

export default function MobileBottomNav() {
  const { pathname, personalHref, likedHref, user, isAuthenticated } =
    useAppNav();
  const [moreOpen, setMoreOpen] = useState(false);

  if (pathname === "/login") {
    return null;
  }

  const uid = user?.pk;
  const publicActive = isNavLinkActive(pathname, "/", uid);
  const profileActive = isNavLinkActive(pathname, personalHref, uid);
  const likedActive = uid != null && isNavLinkActive(pathname, likedHref, uid);

  const tabClass = (active) =>
    `flex flex-1 flex-col items-center justify-center active:outline-none gap-0.5 min-h-14 text-xs font-bold transition-colors ${
      active ? "text-red-300" : "text-neutral-400"
    }`;

  return (
    <>
      <nav
        data-app-mobile-nav=""
        className="fixed right-0 bottom-0 left-0 z-30 border-t border-neutral-700 bg-neutral-800/95 backdrop-blur-xs lg:hidden"
        aria-label="Primary"
      >
        <div className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom,0px)]">
          <Link
            href="/"
            className={tabClass(publicActive)}
            aria-current={publicActive ? "page" : undefined}
          >
            <NavGlobeIcon className="h-6 w-6 shrink-0" />
            Public
          </Link>
          {isAuthenticated && uid != null && (
            <Link
              href={likedHref}
              className={tabClass(likedActive)}
              aria-current={likedActive ? "page" : undefined}
            >
              <NavHeartIcon className="h-6 w-6 shrink-0" />
              Liked
            </Link>
          )}
          <Link
            href={personalHref}
            className={tabClass(profileActive)}
            aria-current={profileActive ? "page" : undefined}
          >
            <NavUserIcon className="h-6 w-6 shrink-0" />
            Profile
          </Link>
          {isAuthenticated && (
            <button
              type="button"
              className={tabClass(false)}
              aria-label="More"
              onClick={() => setMoreOpen(true)}
            >
              <NavMoreIcon className="h-6 w-6 shrink-0" />
              More
            </button>
          )}
        </div>
      </nav>
      <NavMoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
