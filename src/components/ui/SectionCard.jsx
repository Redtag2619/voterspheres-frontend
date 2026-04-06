import React from "react";

export default function SectionCard({ title, subtitle, right, children }) {
  return (
    <section className="vs-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          marginBottom: "1.25rem"
        }}
      >
        <div>
          {title ? <div className="vs-section-title">{title}</div> : null}
          {subtitle ? <div className="vs-section-subtitle">{subtitle}</div> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      {children}
    </section>
  );
}
