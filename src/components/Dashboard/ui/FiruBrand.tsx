import React from "react";

export default function FiruBrand({
  stacked = false,
  horizontal = false,
  className = "",
}: {
  stacked?: boolean;
  horizontal?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`firu-brand${stacked ? " firu-brand-stacked" : ""}${horizontal ? " firu-brand-horizontal" : ""}${className ? ` ${className}` : ""}`}
      aria-label="FiruApp"
    >
      {horizontal ? (
        <>
          <span className="firu-brand-mark" aria-hidden="true">
            <img src="/logo_sidebar.png" alt="" className="firu-brand-image" />
          </span>
          <span className="firu-brand-wordmark">FiruApp</span>
        </>
      ) : (
        <img src="/logo_sidebar.png" alt="FiruApp logo" className="firu-brand-image" />
      )}
    </div>
  );
}
