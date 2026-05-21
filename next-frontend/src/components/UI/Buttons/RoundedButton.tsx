"use client"

import Link from "next/link"
import type {
  RoundedButtonAsButton,
  RoundedButtonProps,
} from "@/components/UI/Buttons/buttonProps"
import { roundedButtonLayout } from "@/components/UI/Buttons/buttonProps"

export default function RoundedButton(props: RoundedButtonProps) {
  const className = props.className ?? ""
  const children = props.children
  const c = `${roundedButtonLayout} ${className}`.trim()

  if ("href" in props && props.href !== undefined) {
    const { href, className: _c, children: _ch, ...linkRest } = props
    return (
      <Link href={href} className={c} {...linkRest}>
        {children}
      </Link>
    )
  }

  const {
    type = "button",
    className: _c2,
    children: _ch2,
    ...btnRest
  } = props as RoundedButtonAsButton
  return (
    <button type={type} className={c} {...btnRest}>
      {children}
    </button>
  )
}
