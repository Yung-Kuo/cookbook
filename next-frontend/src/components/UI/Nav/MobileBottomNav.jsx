"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppNav } from "@/hooks/useAppNav";
import { isNavLinkActive } from "@/lib/appNav";
import NavGlobeIcon from "@/components/Icons/NavGlobeIcon";
import NavUserIcon from "@/components/Icons/NavUserIcon";
import NavMoreIcon from "@/components/Icons/NavMoreIcon";
import NavMoreSheet from "@/components/UI/Nav/NavMoreSheet";

export default function MobileBottomNav() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { pathname, personalHref, user } = useAppNav();

  if (pathname === "/login") {
    return null;
  }

  const uid = user?.pk;
  const publicActive = isNavLinkActive(pathname, "/", uid);
  const myRecipesActive = isNavLinkActive(pathname, personalHref, uid);
  const moreActive =
    uid != null &&
    (pathname.startsWith(`/users/${uid}/liked`) ||
      pathname.startsWith(`/users/${uid}/collections`));

  const tabClass = (active) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 min-h-14 text-xs font-bold transition-colors ${
      active ? "text-red-300" : "text-neutral-400"
    }`;

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-700 bg-neutral-800/95 backdrop-blur-xs lg:hidden"
        aria-label="Primary"
      >
        <div className="flex items-stretch justify-around pb-[env(safe-area-inset-bottom,0px)]">
          <Link href="/" className={tabClass(publicActive)} aria-current={publicActive ? "page" : undefined}>
            <NavGlobeIcon className="h-6 w-6 shrink-0" />
            Public
          </Link>
          <Link
            href={personalHref}
            className={tabClass(myRecipesActive)}
            aria-current={myRecipesActive ? "page" : undefined}
          >
            <NavUserIcon className="h-6 w-6 shrink-0" />
            My recipes
          </Link>
          <button
            type="button"
            className={tabClass(moreActive)}
            aria-expanded={sheetOpen}
            aria-haspopup="dialog"
            onClick={() => setSheetOpen(true)}
          >
            <NavMoreIcon className="h-6 w-6 shrink-0" />
            More
          </button>
        </div>
      </nav>
      <NavMoreSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
