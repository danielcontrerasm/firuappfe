import React from "react";

export default function FiruBrand({ stacked = false }: { stacked?: boolean }) {
  return (
    <div className={`firu-brand${stacked ? " firu-brand-stacked" : ""}`} aria-label="FiruApp">
      <span className="firu-brand-mark">
        <img src="/logo-head.png" alt="" className="firu-brand-icon" />
      </span>
      <span className="firu-brand-wordmark"><strong>Firu</strong><em>App</em></span>
    </div>
  );
}
