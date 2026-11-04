import React from "react";

export default function PageHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return <header className="firu-page-header"><h1>{title}</h1>{action && <div className="firu-page-header-action">{action}</div>}</header>;
}
