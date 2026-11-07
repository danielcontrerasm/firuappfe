import React from "react";

export default function FiruBrand({ stacked = false, className = "" }: { stacked?: boolean; className?: string }) {
  return (
    <div className={`firu-brand${stacked ? " firu-brand-stacked" : ""}${className ? ` ${className}` : ""}`} aria-label="FiruApp">
      <img src="/logo_sidebar.png" alt="FiruApp logo" className="firu-brand-image" />
    </div>
  );
}
