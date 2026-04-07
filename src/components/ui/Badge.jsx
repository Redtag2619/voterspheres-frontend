import React from "react";

export default function Badge({ children, tone = "default" }) {
  const className =
    tone === "demo"
      ? "vs-badge vs-badge-demo"
      : tone === "active"
      ? "vs-badge vs-badge-active"
      : tone === "accent"
      ? "vs-badge vs-badge-accent"
      : tone === "danger"
      ? "vs-badge vs-badge-danger"
      : tone === "info"
      ? "vs-badge vs-badge-info"
      : "vs-badge";

  return <span className={className}>{children}</span>;
}
