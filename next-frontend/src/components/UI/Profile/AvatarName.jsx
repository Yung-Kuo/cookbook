"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * Small avatar + linked display name for recipe owner row (Recipe overlay).
 *
 * @param {object} props
 * @param {number | null} props.userId
 * @param {string | null | undefined} [props.avatarUrl]
 * @param {string} props.displayName
 * @param {string} [props.className]
 * @param {boolean} [props.truncateDisplayName] — single-line ellipsis (default true)
 */
export default function AvatarName({
  userId,
  avatarUrl,
  displayName,
  className = "",
  truncateDisplayName = true,
}) {
  const initial = (displayName || "?").slice(0, 1).toUpperCase();

  const rootClass = `flex min-w-0 max-w-full items-center gap-3 ${className}`.trim();

  const titleClass = truncateDisplayName
    ? "block min-w-0 truncate text-2xl font-medium text-neutral-200 transition-colors hover:text-red-300 lg:text-3xl"
    : "block min-w-0 break-words text-2xl font-medium text-neutral-200 transition-colors hover:text-red-300 lg:text-3xl";

  const avatarBlock = avatarUrl ? (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-neutral-600 transition-opacity hover:opacity-90 focus-within:outline-none focus-within:ring-2 focus-within:ring-red-400/60">
      <Image
        src={avatarUrl}
        alt=""
        width={40}
        height={40}
        className="h-full w-full object-cover"
        sizes="40px"
      />
    </span>
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xl font-semibold text-amber-300 ring-2 ring-neutral-600">
      {initial}
    </div>
  );

  const textBlock = (
    <div className="min-w-0">
      <span className={titleClass}>{displayName}</span>
    </div>
  );

  const body = (
    <>
      {avatarBlock}
      {textBlock}
    </>
  );

  if (userId == null) {
    return <div className={rootClass}>{body}</div>;
  }

  return (
    <Link
      href={`/users/${userId}`}
      className={rootClass}
      aria-label={`${displayName}'s profile`}
    >
      {body}
    </Link>
  );
}
