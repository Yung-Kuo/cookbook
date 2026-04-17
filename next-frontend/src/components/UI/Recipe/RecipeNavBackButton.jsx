"use client";

import { useRouter } from "next/navigation";
import BackArrowIcon from "@/components/Icons/BackArrowIcon";

const PUBLIC_FALLBACK = "/";

/**
 * Browser back when session history has a prior entry; otherwise the public home page.
 */
export default function RecipeNavBackButton({ className = "" }) {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push(PUBLIC_FALLBACK);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      data-recipe-nav-back=""
      className={className.trim()}
      aria-label="Go back to previous page"
    >
      <BackArrowIcon className="z-10 col-start-1 row-start-1 h-full w-full p-2 text-neutral-200" />
      <div className="col-start-1 row-start-1 h-full w-full rounded-full bg-neutral-600/40 backdrop-blur-xs transition-all group-hover:bg-red-300/30" />
    </button>
  );
}
