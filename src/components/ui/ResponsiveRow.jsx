import React from "react";

export default function ResponsiveRow({
  title,
  subtitle,
  meta = [],
  right = null,
  alert = null
}) {
  return (
    <div className="vs-card-muted">
      <div className="vs-responsive-row">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {alert ? <span className={alert} /> : null}
            <div style={{ fontWeight: 800, color: "var(--vs-text)" }}>{title}</div>
          </div>

          {subtitle ? (
            <div
              style={{
                marginTop: "6px",
                fontSize: "13px",
                lineHeight: 1.65,
                color: "var(--vs-text-muted)"
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>

        <div style={{ display: "grid", gap: "10px" }}>
          {meta.length ? (
            <div className="vs-responsive-meta">
              {meta.map((item, index) => (
                <div key={`${item.label}-${index}`}>
                  <div className="vs-stat-label">{item.label}</div>
                  <div
                    style={{
                      marginTop: "5px",
                      fontSize: "13px",
                      fontWeight: 800,
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
