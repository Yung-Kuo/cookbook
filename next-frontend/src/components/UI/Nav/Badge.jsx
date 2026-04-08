import React from "react";

export default function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold w-5 h-5 ${className}`}
    >
      {children}
    </span>
  );
}
