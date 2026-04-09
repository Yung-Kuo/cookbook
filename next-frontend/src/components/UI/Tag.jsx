"use client";

/**
 * @param {React.ReactNode} children - tag label (typically the tag name string)
 * @param {() => void} [onRemove] - when set, shows a dismiss control
 * @param {string} [className]
 */

import CloseIcon from "../Icons/CloseIcon";
export default function Tag({ children, onRemove, className = "" }) {
  return (
    <span
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full border border-transparent bg-neutral-700 text-lg font-medium text-amber-300 ${onRemove ? "pl-4 pr-2" : "px-4"} ${className}`.trim()}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className=" inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent p-0 leading-none text-neutral-400 hover:text-red-300"
          aria-label={
            typeof children === "string" ? `Remove ${children}` : "Remove tag"
          }
        >
          <CloseIcon className="h-full w-full" />
        </button>
      )}
    </span>
  );
}
