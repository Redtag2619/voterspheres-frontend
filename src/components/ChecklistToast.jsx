export default function ChecklistToast({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.icon}>✓</div>

        <div style={styles.body}>
          <div style={styles.title}>{title || "Checklist updated"}</div>
          <div style={styles.message}>
            {message || "A setup step was marked complete."}
          </div>
        </div>

        <button style={styles.closeButton} onClick={onClose} aria-label="Close toast">
          ×
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    zIndex: 10000,
    maxWidth: "420px",
    width: "calc(100% - 40px)",
  },
  card: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    background: "rgba(15,23,42,0.96)",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "14px 14px 14px 12px",
    boxShadow: "0 18px 50px rgba(0,0,0,0.28)",
    color: "#fff",
  },
  icon: {
    width: "28px",
    height: "28px",
    minWidth: "28px",
    borderRadius: "999px",
    background: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 900,
    marginTop: "2px",
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: "0.98rem",
    fontWeight: 800,
    marginBottom: "4px",
  },
  message: {
    color: "#cbd5e1",
    lineHeight: 1.6,
    fontSize: "0.92rem",
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    fontSize: "1.2rem",
    cursor: "pointer",
    lineHeight: 1,
    padding: 0,
  },
};
