export default function ResponsiveRow({
  title,
  subtitle,
  meta = [],
  alert,
  right,
  active = false,
  live = false,
  className = "",
}) {
  const normalizedMeta = [...meta];

  while (normalizedMeta.length < 4) {
    normalizedMeta.push({ label: "", value: "" });
  }

  return (
    <div
      className={[
        "vs-card-muted",
        active ? "vs-row-active-pulse" : "",
        live ? "vs-row-live-flash" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        minWidth: 0,
      }}
    >
      <div
        className="vs-responsive-row"
        style={{
          display: "grid",
          gridTemplateColumns: right ? "minmax(0, 1fr) auto" : "minmax(0, 1fr)",
          gap: "16px",
          alignItems: "center",
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        <div
          className="vs-responsive-left"
          style={{
            minWidth: 0,
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              minWidth: 0,
              maxWidth: "100%",
            }}
          >
            {alert ? <span className={alert} /> : null}

            <div
              className="vs-row-title"
              style={{
                minWidth: 0,
                maxWidth: "100%",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {title}
            </div>
          </div>

          {subtitle ? (
            <div
              className="vs-row-subtitle"
              style={{
                minWidth: 0,
                maxWidth: "100%",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {subtitle}
            </div>
          ) : null}

          {normalizedMeta.length ? (
            <div
              className="vs-responsive-meta"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: "12px",
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                overflow: "hidden",
                marginTop: "12px",
              }}
            >
              {normalizedMeta.slice(0, 4).map((item, index) => (
                <div
                  key={`${item.label || "empty"}-${index}`}
                  className="vs-meta-block"
                  style={{
                    minWidth: 0,
                    maxWidth: "100%",
                    overflow: "hidden",
                    paddingRight: index < 3 ? "10px" : 0,
                    borderRight:
                      index < 3 ? "1px solid rgba(148, 163, 184, 0.12)" : 0,
                    opacity: item.label ? 1 : 0,
                  }}
                >
                  <div
                    className="vs-meta-label"
                    style={{
                      display: "block",
                      width: "100%",
                      minWidth: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {item.label}
                  </div>

                  <div
                    className="vs-meta-value"
                    title={
                      typeof item.value === "string" || typeof item.value === "number"
                        ? String(item.value)
                        : undefined
                    }
                    style={{
                      display: "block",
                      width: "100%",
                      minWidth: 0,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.value ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {right ? (
          <div
            className="vs-responsive-right"
            style={{
              minWidth: 0,
              maxWidth: "100%",
              overflow: "hidden",
              justifySelf: "end",
            }}
          >
            {right}
          </div>
        ) : null}
      </div>
    </div>
  );
}
