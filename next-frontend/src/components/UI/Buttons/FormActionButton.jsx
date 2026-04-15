export default function FormActionButton({
  type = "button",
  children,
  className = "",
  ...rest
}) {
  const base =
    "inline-flex h-12 w-32 lg:w-40 shrink-0 cursor-pointer items-center justify-center rounded-md px-2 text-center text-base font-medium transition-all focus:outline-none active:scale-95 lg:text-lg";
  return (
    <button type={type} className={`${base} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
