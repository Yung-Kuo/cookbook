"use client"

import { useCallback } from "react"
import RoundedButton from "@/components/UI/Buttons/RoundedButton"
import PrintIcon from "@/components/Icons/PrintIcon"

type RecipePrintButtonProps = {
  className?: string
}

const defaultClassName =
  "border border-neutral-600 bg-neutral-800/80 text-neutral-100 hover:border-neutral-400 hover:bg-neutral-700/90 focus-visible:ring-2 focus-visible:ring-red-400/50"

const RecipePrintButton = ({ className = "" }: RecipePrintButtonProps) => {
  const handleClick = useCallback(() => {
    window.print()
  }, [])

  return (
    <RoundedButton
      type="button"
      onClick={handleClick}
      className={`${defaultClassName} ${className}`.trim()}
      aria-label="Print or save as PDF"
      title="Print recipe"
    >
      <PrintIcon className="shrink-0" />
      <span>Print</span>
    </RoundedButton>
  )
}

export default RecipePrintButton
