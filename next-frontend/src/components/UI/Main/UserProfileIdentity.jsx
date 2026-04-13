"use client";

import Link from "next/link";

/**
 * Avatar + primary name; optional @handle line for profile layout (`size="profile"`).
 *
 * @param {object} props
 * @param {number | null} props.userId
 * @param {string | null | undefined} [props.avatarUrl]
 * @param {string} props.displayName
 * @param {string | null | undefined} [props.handle] — when `size` is `profile`, renders as @handle below title
 * @param {"profile" | "recipeOwner"} props.size
 * @param {string} [props.className]
 * @param {boolean} [props.truncateDisplayName] — for `recipeOwner`, single-line ellipsis (default true); set false for body text flow
 */
export default function UserProfileIdentity({
  userId,
  avatarUrl,
  displayName,
  handle = null,
  size,
  className = "",
  truncateDisplayName = true,
}) {
  const initial = (displayName || "?").slice(0, 1).toUpperCase();
  const showHandle =
    size === "profile" &&
    Boolean(handle?.trim()) &&
    Boolean(displayName?.trim());

  const isProfile = size === "profile";

  const rootClass = isProfile
    ? `flex flex-col items-center gap-8 sm:flex-row ${className}`.trim()
    : `flex min-w-0 max-w-full items-center gap-3 ${className}`.trim();

  const avatarRing = isProfile
    ? "shrink-0 rounded-full ring-2 ring-neutral-600"
    : "shrink-0 rounded-full ring-2 ring-neutral-600 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60";

  const imgClass = isProfile
    ? "h-28 w-28 rounded-full object-cover"
    : "h-10 w-10 rounded-full object-cover";

  const placeholderClass = isProfile
    ? "flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-4xl font-semibold text-amber-300 ring-2 ring-neutral-600"
    : "flex h-10 w-10 items-center justify-center rounded-full bg-neutral-700 text-xl font-semibold text-amber-300";

  const textColClass = isProfile
    ? "min-w-0 flex-1 text-center sm:text-left"
    : "min-w-0";

  const titleClass = isProfile
    ? "text-3xl font-semibold break-words text-neutral-100"
    : truncateDisplayName
      ? "block min-w-0 truncate text-2xl font-medium text-neutral-200 transition-colors hover:text-red-300 lg:text-3xl"
      : "block min-w-0 break-words text-2xl font-medium text-neutral-200 transition-colors hover:text-red-300 lg:text-3xl";

  const subtitleClass = "mt-1 text-lg text-neutral-500";

  const avatarBlock = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" className={imgClass} />
  ) : (
    <div className={placeholderClass} aria-hidden>
      {initial}
    </div>
  );

  const titleInner = isProfile ? (
    <h2 className={titleClass}>{displayName}</h2>
  ) : (
    <span className={titleClass}>{displayName}</span>
  );

  const textBlock = (
    <div className={textColClass}>
      {titleInner}
      {showHandle && <p className={subtitleClass}>@{handle}</p>}
    </div>
  );

  const body = (
    <>
      <div className={avatarRing}>{avatarBlock}</div>
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
