export default function FormSection({
  label,
  htmlFor,
  className,
  labelClassName,
  contentClassName,
  children,
}) {
  const outerClass = className ?? "flex flex-col gap-4";
  const lblClass = labelClassName ?? "font-medium text-neutral-300";

  return (
    <div className={outerClass}>
      <label htmlFor={htmlFor} className={lblClass}>
        {label}
      </label>
      <div className={contentClassName}>{children}</div>
    </div>
  );
}
