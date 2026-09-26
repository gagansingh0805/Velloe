import React from "react";

/**
 * BrandLogo - Sleek monochrome logo mark for Meridian.
 * Combines 3 dynamic autonomous agent pipeline columns with a predictive mesh arc.
 */
export default function BrandLogo({ size = "md", className = "" }) {
  const dimensions = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }[size] || "w-8 h-8";

  return (
    <div
      className={`relative flex items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-800 dark:text-zinc-100 border border-zinc-800 dark:border-zinc-700 shadow-sm flex-shrink-0 ${dimensions} ${className}`}
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-4/5 h-4/5"
      >
        <rect x="5" y="16" width="5" height="10" rx="1.5" fill="currentColor" fillOpacity="0.5" />
        <rect x="13.5" y="11" width="5" height="15" rx="1.5" fill="currentColor" fillOpacity="0.8" />
        <rect x="22" y="6" width="5" height="20" rx="1.5" fill="currentColor" />
        <path
          d="M7.5 13.5C12 10 18 8 24.5 4.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="24" y="4" width="3" height="3" fill="currentColor" />
      </svg>
    </div>
  );
}

