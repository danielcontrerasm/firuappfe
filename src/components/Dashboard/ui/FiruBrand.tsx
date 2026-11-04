import React from "react";

export default function FiruBrand({ stacked = false }: { stacked?: boolean }) {
  return (
    <div className={`firu-brand${stacked ? " firu-brand-stacked" : ""}`} aria-label="FiruApp">
      <svg viewBox="0 0 124 84" aria-hidden="true">
        <g stroke="#092c32" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path fill="#ffc638" d="M19 28C23 13 35 8 47 8s25 5 29 20l4 21c1 10-9 12-14 4-1 16-9 24-19 24S26 69 25 53c-6 8-15 5-13-5z" />
          <path fill="none" d="m26 29-2 21m43-21 2 21" />
          <ellipse cx="36" cy="39" rx="3" ry="4" fill="#092c32" stroke="none" />
          <ellipse cx="57" cy="39" rx="3" ry="4" fill="#092c32" stroke="none" />
          <path fill="#092c32" d="M41 50q6-5 12 0-1 7-6 7t-6-7" />
          <path fill="none" d="M47 56v6m-11-3q11 15 22 0" />
        </g>
        <g fill="none" stroke="#19b3b0" strokeWidth="5" strokeLinecap="round">
          <path d="M86 15q16-13 32 0M91 23q11-9 22 0M97 31q5-4 10 0" />
        </g>
        <path fill="#ffc638" d="M102 39c-9 0-14 10-9 17l9 13 9-13c5-7 0-17-9-17" />
        <circle cx="102" cy="49" r="5" fill="white" />
      </svg>
      <span>FiruApp</span>
    </div>
  );
}
