"use client";

import Link from "next/link";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useAppNav } from "@/hooks/useAppNav";
import RoundedButton from "@/components/UI/Buttons/RoundedButton";

export default function NavMoreSheet({ open, onClose }) {
  const {
    loginHref,
    likedHref,
    collectionsHref,
    user,
    isAuthenticated,
    logout,
  } = useAppNav();

  const rowClass =
    "flex w-full items-center px-4 py-3.5 text-left text-lg font-bold text-neutral-100 transition-colors hover:bg-neutral-700/80";

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-[60]">
      <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50">
        <DialogPanel className="w-full max-h-[85dvh] overflow-y-auto rounded-t-2xl border border-neutral-600 bg-neutral-800 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-2 shadow-xl">
          <div className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-neutral-500" />
          <DialogTitle className="sr-only">More navigation</DialogTitle>

          <nav className="flex flex-col border-b border-neutral-700 pb-2">
            <Link href={likedHref} className={rowClass} onClick={onClose}>
              Liked
            </Link>
            <Link href={collectionsHref} className={rowClass} onClick={onClose}>
              Collections
            </Link>
          </nav>

          <div className="flex flex-col gap-3 px-4 py-4">
            {isAuthenticated ? (
              <>
                <p className="text-center text-base font-bold text-neutral-400">
                  {user?.username}
                </p>
                <RoundedButton
                  type="button"
                  className="w-full cursor-pointer !text-lg !font-bold bg-neutral-700 text-neutral-100 hover:bg-neutral-600"
                  onClick={handleLogout}
                >
                  Logout
                </RoundedButton>
              </>
            ) : (
              <RoundedButton
                href={loginHref}
                className="block w-full cursor-pointer text-center !text-lg !font-bold bg-red-300 text-neutral-800 hover:bg-red-400"
                onClick={onClose}
              >
                Login
              </RoundedButton>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
