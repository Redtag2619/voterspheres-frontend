export default function EmptyState({
  text = "No data available.",
  title,
  action,
}) {
  return (
    <div className="vs-empty-state">
      <div style={{ display: "grid", gap: "6px", justifyItems: "center", maxWidth: "560px" }}>
        {title ? (
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              lineHeight: 1.35,
              color: "var(--vs-text)",
            }}
          >
            {title}
          </div>
        ) : null}

        <div
          style={{
            fontSize: "12px",
            lineHeight: 1.6,
            color: "var(--vs-text-muted)",
            textAlign: "center",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {text}
        </div>

        {action ? <div style={{ marginTop: "4px" }}>{action}</div> : null}
      </div>
    </div>
  );
}
