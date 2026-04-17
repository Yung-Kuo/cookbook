"use client";

import Link from "next/link";

/**
 * Circular control that expands horizontally on hover to reveal a label.
 */
export default function ExpandableCircleButton({
  icon,
  label,
  className = "",
  href,
  disabled = false,
  type = "button",
  title,
  ...rest
}) {
  const inner = (
    <>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center leading-none [&_svg]:block [&_svg]:h-5 [&_svg]:w-5 [&_svg]:shrink-0">
        {icon}
      </span>
      <span className="min-w-0 self-center pr-5 text-sm font-medium whitespace-nowrap text-inherit opacity-0 transition-opacity duration-200 ease-out group-hover:opacity-100">
        {label}
      </span>
    </>
  );

  /** Shared look for recipe action rail — keep overrides minimal via className */
  const baseClass =
    "group inline-flex h-12 max-w-[3rem] cursor-pointer items-center overflow-hidden rounded-full border border-neutral-600 bg-neutral-800/90 text-left text-neutral-200 shadow-sm transition-[max-width] duration-300 ease-out hover:max-w-[min(100%,14rem)] hover:border-neutral-500 hover:bg-neutral-700/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50";

  if (href) {
    return (
      <Link
        href={href}
        title={title}
        className={`${baseClass} ${disabled ? "pointer-events-none opacity-60" : ""} ${className}`.trim()}
        {...rest}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      title={title}
      className={`${baseClass} disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      {...rest}
    >
      {inner}
    </button>
  );
}
