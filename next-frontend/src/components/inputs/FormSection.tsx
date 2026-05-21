import type { ReactNode } from "react"

type FormSectionProps = {
  label: string
  htmlFor?: string
  className?: string
  labelClassName?: string
  contentClassName?: string
  children: ReactNode
}

export default function FormSection({
  label,
  htmlFor,
  className,
  labelClassName,
  contentClassName,
  children,
}: FormSectionProps) {
  const outerClass = className ?? "flex flex-col gap-4"
  const lblClass = labelClassName ?? "font-medium text-neutral-300"

  return (
    <div className={outerClass}>
      <label htmlFor={htmlFor} className={lblClass}>
        {label}
      </label>
      <div className={contentClassName}>{children}</div>
    </div>
  )
}
