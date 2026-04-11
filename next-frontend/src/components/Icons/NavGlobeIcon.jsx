export default function NavGlobeIcon({ className = "h-6 w-6" }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      {/* Sphere */}
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      {/* Prime meridian (vertical great circle) */}
      <ellipse
        cx="12"
        cy="12"
        rx="3.75"
        ry="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Equator */}
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="3.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
