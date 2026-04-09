"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  const personalHref =
    isAuthenticated && user?.username ? `/users/${user.username}` : "/login";

  const navLinks = [
    { href: "/", label: "Public" },
    { href: personalHref, label: "Personal" },
  ];

  return (
    <nav className="grid grid-cols-1 grid-rows-1 font-bold text-lg h-14 w-full z-30">
      {/* mask */}
      <div className="bg-neutral-800/40 w-full h-full row-start-1 col-start-1 backdrop-blur-xs" />
      <div className="flex items-center justify-between w-full h-full px-8 row-start-1 col-start-1 z-40">
        <div className="flex items-center gap-8">
          {navLinks.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
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
              <button
                onClick={logout}
                className="cursor-pointer rounded-full bg-neutral-700 px-4 py-1  text-neutral-200 transition-all hover:bg-neutral-600"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-red-300 px-4 py-1 text-neutral-900 transition-all hover:bg-red-200"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
