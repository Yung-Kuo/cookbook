"use client"

import Link from "next/link"
import type { ReactNode } from "react"

type BaseCardVariant = "recipe" | "collection"

type BaseCardProps = {
  coverSlot: ReactNode
  infoSlot: ReactNode
  overlaySlot?: ReactNode | null
  withShell?: boolean
  as: "link" | "button"
  href?: string
  onClick?: () => void
  className?: string
  variant?: BaseCardVariant
}

export default function BaseCard({
  coverSlot,
  infoSlot,
  overlaySlot = null,
  withShell = false,
  as,
  href,
  onClick,
  className = "",
  variant = "recipe",
}: BaseCardProps) {
  const hoverRecipe = "hover:border-sky-500"
  const hoverCollection =
    "hover:border-sky-600 hover:ring-1 hover:ring-sky-600"
  const hoverClass = variant === "collection" ? hoverCollection : hoverRecipe

  const body = (
    <>
      {coverSlot}
      {infoSlot}
    </>
  )

  if (withShell) {
    const shellClass =
      `relative overflow-hidden rounded-lg border border-neutral-600 bg-neutral-900 transition-colors ${hoverClass} ${className}`.trim()

    return (
      <div className={shellClass}>
        {as === "link" && href ? (
          <Link
            href={href}
            className="flex h-full w-full min-w-0 flex-col text-left"
          >
            {body}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onClick}
            className="flex h-full w-full min-w-0 cursor-pointer flex-col overflow-hidden text-left"
          >
            {body}
          </button>
        )}
        {overlaySlot}
      </div>
    )
  }

  const interactiveClass =
    `flex h-full min-w-0 w-full cursor-pointer flex-col overflow-hidden rounded-lg border border-neutral-600 bg-neutral-900 text-left transition-colors ${hoverClass} ${className}`.trim()

  if (as === "link" && href) {
    return (
      <Link href={href} className={interactiveClass}>
        {body}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={interactiveClass}>
      {body}
    </button>
  )
}
