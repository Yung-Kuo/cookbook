"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * @param {{
 *   recipe: { id: number, title: string, cover_image_url?: string | null, is_public?: boolean },
 *   href?: string,
 *   onClick?: () => void,
 *   showPrivateBadge?: boolean,
 *   className?: string,
 * }} props
 */
export default function RecipeCard({
  recipe,
  href,
  onClick,
  showPrivateBadge = false,
  className = "",
}) {
  const inner = (
    <>
      <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-neutral-700">
        {recipe.cover_image_url ? (
          <Image
            src={recipe.cover_image_url}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            No photo
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3 text-left">
        <h3 className="line-clamp-2 text-base font-semibold text-neutral-100">
          {recipe.title}
        </h3>
        {showPrivateBadge && recipe.is_public === false && (
          <span className="text-xs font-medium text-amber-400/90">Private</span>
        )}
      </div>
    </>
  );

  const cardClass = `flex h-full flex-col overflow-hidden rounded-lg border border-neutral-600 bg-neutral-900 text-left transition-colors hover:border-sky-500 ${className}`;

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cardClass}
    >
      {inner}
    </button>
  );
}
