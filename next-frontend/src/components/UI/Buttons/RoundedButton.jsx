"use client";

import Link from "next/link";

const layout =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-base font-medium transition-all";

export default function RoundedButton({
  href,
  className = "",
  type = "button",
  children,
  ...rest
}) {
  const c = `${layout} ${className}`.trim();
  if (href) {
    return (
      <Link href={href} className={c} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={c} {...rest}>
      {children}
    </button>
  );
}
