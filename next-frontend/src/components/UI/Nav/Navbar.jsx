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
    collectionsHref,
    user,
    isAuthenticated,
    logout,
  } = useAppNav();

  const uid = user?.pk;

  const navLinks = [
    { href: "/", label: "Public" },
    { href: personalHref, label: "Personal" },
    { href: likedHref, label: "Liked" },
    { href: collectionsHref, label: "Collections" },
  ];

  const linkClass = (active) =>
    `transition-colors ${
      active ? "text-red-300" : "text-neutral-400 hover:text-neutral-100"
    }`;

  return (
    <nav className="fixed hidden top-0 left-0 right-0 lg:grid grid-cols-1 grid-rows-1 font-bold text-lg h-14 w-full z-30">
      <div className="bg-neutral-800/40 w-full h-full row-start-1 col-start-1 backdrop-blur-xs" />

      {/* Desktop */}
      <div className="hidden lg:flex items-center justify-between w-full h-full px-8 row-start-1 col-start-1 z-40">
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
                className="cursor-pointer !text-lg !font-bold bg-neutral-700 text-neutral-100 hover:bg-neutral-600"
                onClick={logout}
              >
                Logout
              </RoundedButton>
            </>
          ) : (
            <RoundedButton
              href={loginHref}
              className="cursor-pointer !text-lg !font-bold bg-red-300 text-neutral-800 hover:bg-red-400"
            >
              Login
            </RoundedButton>
          )}
        </div>
      </div>

      {/* Mobile: slim top bar */}
      <div className="flex lg:hidden items-center justify-between w-full h-full px-6 row-start-1 col-start-1 z-40">
        <Link
          href="/"
          className="text-neutral-100 transition-colors hover:text-red-300"
        >
          Cookbook
        </Link>
        {!isAuthenticated && (
          <RoundedButton
            href={loginHref}
            className="cursor-pointer !text-base !font-bold bg-red-300 text-neutral-800 hover:bg-red-400"
          >
            Login
          </RoundedButton>
        )}
      </div>
    </nav>
  );
}
