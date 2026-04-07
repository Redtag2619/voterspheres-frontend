import React from "react";

export default function ResponsiveRow({
  title,
  subtitle,
  meta = [],
  right = null
}) {
  return (
    <div className="vs-card-muted">
      <div className="vs-responsive-row">
        <div>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{title}</div>
          {subtitle ? (
            <div
              style={{
                marginTop: "0.35rem",
                fontSize: "0.92rem",
                lineHeight: 1.65,
                color: "var(--vs-text-muted)"
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {meta.length ? (
            <div className="vs-responsive-meta">
              {meta.map((item, index) => (
                <div key={`${item.label}-${index}`}>
                  <div className="vs-stat-label">{item.label}</div>
                  <div
                    style={{
                      marginTop: "0.35rem",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "var(--vs-text)"
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {right ? <div style={{ display: "flex", justifyContent: "flex-start" }}>{right}</div> : null}
        </div>
      </div>
    </div>
  );
}
