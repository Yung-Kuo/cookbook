"use client";

import { useEffect, useRef, useState } from "react";
import NavMoreIcon from "@/components/Icons/NavMoreIcon";

/**
 * "More" menu: trigger + dropdown with outside-click and Escape dismiss.
 *
 * @param {{
 *   ariaLabel: string,
 *   items?: { label: string, onClick: (e: import("react").MouseEvent) => void | Promise<void>, className?: string }[],
 *   menuContent?: import("react").ReactNode | ((args: { close: () => void }) => import("react").ReactNode),
 *   className?: string,
 *   menuClassName?: string,
 * }} props
 */
export default function CardMoreMenu({
  ariaLabel,
  items,
  menuContent,
  className = "",
  menuClassName = "",
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const hasItems = Array.isArray(items) && items.length > 0;
  const hasMenuContent =
    typeof menuContent === "function" || menuContent != null;
  const resolvedMenuContent =
    typeof menuContent === "function"
      ? menuContent({ close: () => setMenuOpen(false) })
      : menuContent;
  const showDropdown = menuOpen && (hasItems || hasMenuContent);

  return (
    <div
      ref={wrapRef}
      className={`absolute top-2 right-2 z-20 text-base ${className}`.trim()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={ariaLabel}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setMenuOpen((o) => !o);
        }}
        className="cursor-pointer rounded-full border border-neutral-600 bg-neutral-900/90 p-1.5 text-neutral-200 shadow-sm hover:bg-neutral-800"
      >
        <NavMoreIcon className="h-5 w-5" />
      </button>
      {showDropdown && (
        <div
          role="menu"
          className={`absolute right-0 z-30 mt-2 w-max min-w-[10rem] rounded-lg border border-neutral-600 bg-neutral-900 py-1 text-base shadow-lg ${menuClassName}`.trim()}
        >
          {resolvedMenuContent
            ? resolvedMenuContent
            : hasItems
              ? items.map((item, i) => (
                  <button
                    key={`${item.label}-${i}`}
                    type="button"
                    role="menuitem"
                    className={`flex w-full cursor-pointer items-center px-3 py-2 text-left text-neutral-300 hover:bg-neutral-800 ${item.className ?? ""}`.trim()}
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await item.onClick(e);
                      setMenuOpen(false);
                    }}
                  >
                    {item.label}
                  </button>
                ))
              : null}
        </div>
      )}
    </div>
  );
}
