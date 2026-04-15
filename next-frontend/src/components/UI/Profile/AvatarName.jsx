"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * Avatar + display name. Use `variant="recipe"` for recipe overlay rows; `variant="profile"`
 * for the profile page header (large avatar, optional @handle).
 *
 * @param {object} props
 * @param {'recipe' | 'profile'} [props.variant]
 * @param {number | null} props.userId
 * @param {string | null | undefined} [props.avatarUrl]
 * @param {string} props.displayName
 * @param {string | null | undefined} [props.handle] — profile only; shown as @handle when set
 * @param {string} [props.className]
 * @param {boolean} [props.truncateDisplayName] — recipe only; single-line ellipsis (default true)
 * @param {boolean} [props.priority] — profile image LCP (default false)
 */
export default function AvatarName({
  variant = "recipe",
  userId,
  avatarUrl,
  displayName,
  handle = null,
  className = "",
  truncateDisplayName = true,
  priority = false,
}) {
  const initial = (displayName || "?").slice(0, 1).toUpperCase();
  const isProfile = variant === "profile";

  if (isProfile) {
    const rowClass =
      `flex flex-col items-center gap-8 sm:flex-row ${className}`.trim();
    const showHandle = Boolean(handle?.trim()) && Boolean(displayName?.trim());

    const avatarBlock = avatarUrl ? (
      <span className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full ring-2 ring-neutral-600">
        <Image
          src={avatarUrl}
          alt=""
          width={112}
          height={112}
          className="h-full w-full object-cover"
          sizes="112px"
          priority={priority}
        />
      </span>
    ) : (
      <div
        className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-4xl font-semibold text-amber-200 ring-2 ring-neutral-600"
        aria-hidden
      >
        {initial}
      </div>
    );

    const textBlock = (
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <h2 className="text-3xl font-semibold break-words text-neutral-100">
          {displayName}
        </h2>
        {showHandle && (
          <p className="mt-1 text-lg text-neutral-500">@{handle}</p>
        )}
      </div>
    );

    const body = (
      <>
        {avatarBlock}
        {textBlock}
      </>
    );

    if (userId == null) {
      return <div className={rowClass}>{body}</div>;
    }

    return (
      <Link
        href={`/users/${userId}`}
        className={rowClass}
        aria-label={`${displayName}'s profile`}
      >
        {body}
      </Link>
    );
  }

  const rootClass =
    `flex min-w-0 max-w-full items-center gap-3 ${className}`.trim();

  const titleClass = truncateDisplayName
    ? "block min-w-0 truncate text-2xl font-medium text-neutral-200 transition-colors hover:text-red-300 lg:text-3xl"
    : "block min-w-0 break-words text-2xl font-medium text-neutral-200 transition-colors hover:text-red-300 lg:text-3xl";

  const avatarBlock = avatarUrl ? (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-neutral-600 transition-opacity focus-within:ring-2 focus-within:ring-red-400/60 focus-within:outline-none hover:opacity-90">
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
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xl font-semibold text-sky-600 ring-2 ring-neutral-600">
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
