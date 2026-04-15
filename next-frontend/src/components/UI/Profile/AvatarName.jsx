"use client";

import Link from "next/link";
import Image from "next/image";

/** @typedef {'sm' | 'lg'} AvatarNameSize */

const SIZES = {
  sm: {
    root: "group flex max-w-full min-w-0 items-center gap-3",
    avatar:
      "relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-neutral-600",
    img: 40,
    placeholder:
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xl font-semibold text-amber-300 ring-2 ring-neutral-600",
    nameTruncate:
      "block min-w-0 truncate text-2xl font-medium text-neutral-200 group-hover:text-red-300 lg:text-3xl",
    nameWrap:
      "block min-w-0 break-words text-2xl font-medium text-neutral-200 group-hover:text-red-300 lg:text-3xl",
  },
  lg: {
    root: "flex flex-col items-center gap-8 sm:flex-row",
    avatar:
      "relative h-28 w-28 shrink-0 overflow-hidden rounded-full ring-2 ring-neutral-600",
    img: 112,
    placeholder:
      "flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-4xl font-semibold text-amber-300 ring-2 ring-neutral-600",
    textBlock: "min-w-0 flex-1 text-center sm:text-left",
    title: "break-words text-3xl font-semibold text-neutral-100",
    handle: "mt-1 text-lg text-neutral-500",
  },
};

/**
 * Avatar + name (+ optional @handle for `size="lg"`).
 */
export default function AvatarName({
  size = "sm",
  userId,
  avatarUrl,
  displayName,
  handle = null,
  className = "",
  truncateDisplayName = true,
  priority = false,
}) {
  const s = SIZES[size] ?? SIZES.sm;
  const rootClass = `${s.root} ${className}`.trim();
  const px = s.img;

  const avatar =
    avatarUrl != null && avatarUrl !== "" ? (
      <span className={s.avatar}>
        <Image
          src={avatarUrl}
          alt=""
          width={px}
          height={px}
          className="h-full w-full object-cover"
          sizes={`${px}px`}
          priority={size === "lg" ? priority : false}
        />
      </span>
    ) : (
      <div
        className={s.placeholder}
        aria-hidden={size === "lg" ? true : undefined}
      >
        {(displayName || "?").slice(0, 1).toUpperCase()}
      </div>
    );

  const showHandle =
    size === "lg" && Boolean(handle?.trim()) && Boolean(displayName?.trim());

  const text =
    size === "lg" ? (
      <div className={s.textBlock}>
        <h2 className={s.title}>{displayName}</h2>
        {showHandle && <p className={s.handle}>@{handle}</p>}
      </div>
    ) : (
      <div className="min-w-0">
        <span className={truncateDisplayName ? s.nameTruncate : s.nameWrap}>
          {displayName}
        </span>
      </div>
    );

  const inner = (
    <>
      {avatar}
      {text}
    </>
  );

  if (userId == null) {
    return <div className={rootClass}>{inner}</div>;
  }

  return (
    <Link
      href={`/users/${userId}`}
      className={rootClass}
      aria-label={`${displayName}'s profile`}
    >
      {inner}
    </Link>
  );
}
