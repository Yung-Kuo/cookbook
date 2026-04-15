"use client";

import Link from "next/link";
import { useAppNav } from "@/hooks/useAppNav";
import { isNavLinkActive } from "@/lib/appNav";
import RoundedButton from "@/components/UI/Buttons/RoundedButton";

export default function Navbar() {
  const {
    pathname,
    loginHref,
    personalHref,
    likedHref,
    user,
    isAuthenticated,
    logout,
  } = useAppNav();

  const uid = user?.pk;

  const navLinks = [
    { href: "/", label: "Public" },
    { href: personalHref, label: "Personal" },
    ...(isAuthenticated && uid != null
      ? [{ href: likedHref, label: "Liked" }]
      : []),
  ];

  const linkClass = (active) =>
    `transition-colors ${
      active ? "text-red-300" : "text-neutral-400 hover:text-neutral-100"
    }`;

  return (
    <nav className="fixed top-0 right-0 left-0 z-40 hidden h-14 w-full grid-cols-1 grid-rows-1 text-lg font-bold lg:grid">
      <div className="col-start-1 row-start-1 h-full w-full bg-neutral-800/60 backdrop-blur-xs" />

      {/* Desktop */}
      <div className="z-40 col-start-1 row-start-1 hidden h-full w-full items-center justify-between px-8 lg:flex">
        <div className="flex items-center gap-8">
          {navLinks.map(({ href, label }) => {
            const active = isNavLinkActive(pathname, href, uid);
            return (
              <Link key={label} href={href} className={linkClass(active)}>
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-neutral-400">{user?.username}</span>
              <RoundedButton
                className="cursor-pointer bg-neutral-700 !text-lg !font-bold text-neutral-100 hover:bg-neutral-600"
                onClick={logout}
              >
                Logout
              </RoundedButton>
            </>
          ) : (
            <RoundedButton
              href={loginHref}
              className="cursor-pointer bg-red-300 !text-lg !font-bold text-neutral-800 hover:bg-red-400"
            >
              Login
            </RoundedButton>
          )}
        </div>
      </div>
    </nav>
  );
}
