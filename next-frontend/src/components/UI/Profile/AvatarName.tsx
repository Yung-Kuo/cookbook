"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

const SIZES = {
  sm: {
    root: "group flex max-w-full min-w-0 items-center gap-3",
    avatar:
      "relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-neutral-600",
    imageSize: 40,
    placeholder:
      "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-xl font-semibold text-amber-300 border-2 border-neutral-600",
    nameTruncate:
      "block min-w-0 truncate text-2xl font-medium text-neutral-200 group-hover:text-red-300 lg:text-3xl",
    nameWrap:
      "block min-w-0 break-words text-2xl font-medium text-neutral-200 group-hover:text-red-300 lg:text-3xl",
  },
  lg: {
    root: "flex flex-col items-center gap-8 sm:flex-row",
    avatar:
      "relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-2 border-neutral-600",
    imageSize: 112,
    placeholder:
      "flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-neutral-700 text-4xl font-semibold text-amber-300 border-2 border-neutral-600",
    textBlock: "min-w-0 flex-1 text-center sm:text-left",
    title: "break-words text-3xl font-semibold text-neutral-100",
    handle: "mt-1 text-lg text-neutral-500",
  },
};

type AvatarNameSize = keyof typeof SIZES;

type AvatarNameProps = {
  size?: AvatarNameSize;
  userId?: string | number | null;
  avatarUrl?: string | null;
  displayName?: string | null;
  handle?: string | null;
  className?: string;
  truncateDisplayName?: boolean;
  priority?: boolean;
};

/** Avatar beside name; `size="lg"` stacks like a profile header and can show `@handle`. */
export default function AvatarName({
  size = "sm",
  userId,
  avatarUrl,
  displayName,
  handle = null,
  className = "",
  truncateDisplayName = true,
  priority = false,
}: AvatarNameProps) {
  const displaySize: AvatarNameSize = size in SIZES ? size : "sm";

  const wrapRoot = (rootClass: string, children: ReactNode) => {
    if (userId == null) {
      return <div className={rootClass}>{children}</div>;
    }
    return (
      <Link
        href={`/users/${userId}`}
        className={rootClass}
        aria-label={`${displayName}'s profile`}
      >
        {children}
      </Link>
    );
  };

  if (displaySize === "lg") {
    const layout = SIZES.lg;
    const imageSize = layout.imageSize;
    const showHandle = Boolean(handle?.trim()) && Boolean(displayName?.trim());

    return wrapRoot(
      `${layout.root} ${className}`.trim(),
      <>
        {avatarUrl != null && avatarUrl !== "" ? (
          <span className={layout.avatar}>
            <Image
              src={avatarUrl}
              alt=""
              width={imageSize}
              height={imageSize}
              className="h-full w-full object-cover"
              sizes={`${imageSize}px`}
              priority={priority}
            />
          </span>
        ) : (
          <div className={layout.placeholder} aria-hidden>
            {(displayName || "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className={layout.textBlock}>
          <h2 className={layout.title}>{displayName}</h2>
          {showHandle ? <p className={layout.handle}>@{handle}</p> : null}
        </div>
      </>,
    );
  }

  const layout = SIZES.sm;
  const imageSize = layout.imageSize;

  return wrapRoot(
    `${layout.root} ${className}`.trim(),
    <>
      {avatarUrl != null && avatarUrl !== "" ? (
        <span className={layout.avatar}>
          <Image
            src={avatarUrl}
            alt=""
            width={imageSize}
            height={imageSize}
            className="h-full w-full object-cover"
            sizes={`${imageSize}px`}
            priority={false}
          />
        </span>
      ) : (
        <div className={layout.placeholder}>
          {(displayName || "?").slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <span
          className={
            truncateDisplayName ? layout.nameTruncate : layout.nameWrap
          }
        >
          {displayName}
        </span>
      </div>
    </>,
  );
}
