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
          gap: "14px",
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

          {meta.length ? (
            <div
              className="vs-responsive-meta"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(96px, 1fr))",
                gap: "10px",
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              {meta.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="vs-meta-block"
                  style={{
                    minWidth: 0,
                    maxWidth: "100%",
                    overflow: "hidden",
                  }}
                >
                  <div className="vs-meta-label">{item.label}</div>
                  <div
                    className="vs-meta-value"
                    style={{
                      minWidth: 0,
                      maxWidth: "100%",
                      whiteSpace: "normal",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {item.value}
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
