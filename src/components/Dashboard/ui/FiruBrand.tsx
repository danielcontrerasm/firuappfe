import React from "react";

export default function FiruBrand({ stacked = false }: { stacked?: boolean }) {
  return (
    <div className={`firu-brand${stacked ? " firu-brand-stacked" : ""}`} aria-label="FiruApp">
      <img src="/logo_sidebar.png" alt="FiruApp logo" className="firu-brand-image" />
    </div>
  );
}
