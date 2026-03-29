import { Link } from "react-router-dom";

export default function OnboardingChecklist({
  items = [],
  progress,
  onToggle,
  onReset,
}) {
  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>First-run checklist</h2>
          <p style={styles.subtitle}>
            Complete these steps to get momentum on day one.
          </p>
        </div>

        <button style={styles.resetButton} onClick={onReset}>
          Reset
        </button>
      </div>

      <div style={styles.progressWrap}>
        <div style={styles.progressMeta}>
          <span>
            {progress.completed} of {progress.total} complete
          </span>
          <span>{progress.percent}%</span>
        </div>

        <div style={styles.progressBarTrack}>
          <div
            style={{
              ...styles.progressBarFill,
              width: `${progress.percent}%`,
            }}
          />
        </div>
      </div>

      <div style={styles.list}>
        {items.map((item) => (
          <div key={item.id} style={styles.item}>
            <button
              style={{
                ...styles.checkbox,
                ...(item.completed ? styles.checkboxDone : {}),
              }}
              onClick={() => onToggle(item.id)}
              aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
            >
              {item.completed ? "✓" : ""}
            </button>

            <div style={styles.itemBody}>
              <div style={styles.itemTopRow}>
                <h3 style={styles.itemTitle}>{item.title}</h3>
                {item.completed ? (
                  <span style={styles.doneBadge}>Done</span>
                ) : null}
              </div>

              <p style={styles.itemText}>{item.description}</p>

              <div style={styles.actions}>
                <Link to={item.route} style={styles.linkButton}>
                  {item.ctaLabel}
                </Link>
                <button
                  style={styles.toggleButton}
                  onClick={() => onToggle(item.id)}
                >
                  {item.completed ? "Mark Incomplete" : "Mark Complete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: "rgba(17,24,39,0.96)",
    border: "1px solid #334155",
    borderRadius: "20px",
    padding: "24px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "1.8rem",
    fontWeight: 900,
  },
  subtitle: {
    marginTop: "10px",
    color: "#94a3b8",
    lineHeight: 1.7,
  },
  resetButton: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #475569",
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  progressWrap: {
    marginTop: "20px",
    marginBottom: "18px",
  },
  progressMeta: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    color: "#cbd5e1",
    marginBottom: "8px",
    fontWeight: 700,
  },
  progressBarTrack: {
    width: "100%",
    height: "12px",
    borderRadius: "999px",
    background: "#0f172a",
    border: "1px solid #243244",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    background: "linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)",
    borderRadius: "999px",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  item: {
    display: "flex",
    gap: "14px",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #243244",
    background: "#111827",
  },
  checkbox: {
    width: "28px",
    minWidth: "28px",
    height: "28px",
    borderRadius: "8px",
    border: "1px solid #475569",
    background: "transparent",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    alignSelf: "flex-start",
  },
  checkboxDone: {
    background: "#2563eb",
    border: "1px solid #2563eb",
  },
  itemBody: {
    flex: 1,
  },
  itemTopRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  itemTitle: {
    margin: 0,
    fontSize: "1.05rem",
    fontWeight: 800,
  },
  doneBadge: {
    padding: "4px 8px",
    borderRadius: "999px",
    background: "#0f766e",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: 800,
  },
  itemText: {
    marginTop: "8px",
    color: "#cbd5e1",
    lineHeight: 1.7,
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "12px",
  },
  linkButton: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: "12px",
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    fontWeight: 800,
  },
  toggleButton: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #475569",
    background: "#1f2937",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
};
