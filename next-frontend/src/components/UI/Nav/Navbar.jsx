"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import RoundedButton from "@/components/UI/Buttons/RoundedButton";

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout } = useAuth();

  const returnTarget =
    pathname === "/login"
      ? "/"
      : `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const loginHref =
    pathname === "/login"
      ? "/login"
      : `/login?next=${encodeURIComponent(returnTarget)}`;

  const personalHref =
    isAuthenticated && user?.pk != null ? `/users/${user.pk}` : loginHref;

  const likedHref =
    isAuthenticated && user?.pk != null ? `/users/${user.pk}/liked` : loginHref;

  const collectionsHref =
    isAuthenticated && user?.pk != null
      ? `/users/${user.pk}/collections`
      : loginHref;

  const navLinks = [
    { href: "/", label: "Public" },
    { href: personalHref, label: "Personal" },
    { href: likedHref, label: "Liked" },
    { href: collectionsHref, label: "Collections" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 grid grid-cols-1 grid-rows-1 font-bold text-lg h-14 w-full z-30">
      {/* mask */}
      <div className="bg-neutral-800/40 w-full h-full row-start-1 col-start-1 backdrop-blur-xs" />
      <div className="flex items-center justify-between w-full h-full px-8 row-start-1 col-start-1 z-40">
        <div className="flex items-center gap-8">
          {navLinks.map(({ href, label }) => {
            const uid = user?.pk;
            const base = uid != null ? `/users/${uid}` : null;
            let isActive = false;
            if (href === "/") {
              isActive = pathname === "/";
            } else if (base && href === base) {
              const norm = pathname.replace(/\/$/, "") || "/";
              isActive = norm === base;
            } else if (base && href === `${base}/liked`) {
              isActive = pathname.startsWith(`${base}/liked`);
            } else if (base && href === `${base}/collections`) {
              isActive = pathname.startsWith(`${base}/collections`);
            } else {
              isActive = pathname === href || pathname.startsWith(`${href}/`);
            }
            return (
              <Link
                key={label}
                href={href}
                className={`transition-colors ${
                  isActive
                    ? "text-red-300"
                    : "text-neutral-400 hover:text-neutral-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className=" text-neutral-400">{user?.username}</span>
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
              className="cursor-pointer text-lg font-bold bg-red-300 text-neutral-800 hover:bg-red-400"
            >
              Login
            </RoundedButton>
          )}
        </div>
      </div>
    </nav>
  );
}
