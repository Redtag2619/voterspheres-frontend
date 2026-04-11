export default function ResponsiveRow({
  title,
  subtitle,
  meta = [],
  alert,
  right,
}) {
  return (
    <div className="vs-card-muted">
      <div className="vs-responsive-row">
        <div className="vs-responsive-left">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
              minWidth: 0,
            }}
          >
            {alert ? <span className={alert} /> : null}
            <div className="vs-row-title">{title}</div>
          </div>

          {subtitle ? <div className="vs-row-subtitle">{subtitle}</div> : null}

          {meta.length ? (
            <div className="vs-responsive-meta">
              {meta.map((item, index) => (
                <div key={`${item.label}-${index}`} className="vs-meta-block">
                  <div className="vs-meta-label">{item.label}</div>
                  <div className="vs-meta-value">{item.value}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {right ? <div className="vs-responsive-right">{right}</div> : null}
      </div>
    </div>
  );
}
