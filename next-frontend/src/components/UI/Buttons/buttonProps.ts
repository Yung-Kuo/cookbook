import type Link from "next/link"
import type { ComponentPropsWithoutRef, ReactNode } from "react"

const _layout =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-base font-medium transition-all"

export const roundedButtonLayout = _layout

export type RoundedButtonAsLink = {
  href: string
  className?: string
  children: ReactNode
} & Omit<
  ComponentPropsWithoutRef<typeof Link>,
  "href" | "className" | "children"
>

export type RoundedButtonAsButton = {
  href?: undefined
  className?: string
  type?: "button" | "submit" | "reset"
  children: ReactNode
} & Omit<
  ComponentPropsWithoutRef<"button">,
  "className" | "children" | "type"
>

export type RoundedButtonProps = RoundedButtonAsLink | RoundedButtonAsButton
