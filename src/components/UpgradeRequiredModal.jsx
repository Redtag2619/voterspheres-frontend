import { getPlanLabel, getUpgradeMessage } from "../lib/plan";

export default function UpgradeRequiredModal({
  isOpen,
  requiredPlan = "starter",
  currentPlan = "free",
  message = "",
  source = "",
  onClose,
  onViewPlans,
  onGoToBilling,
}) {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.badge}>Upgrade Required</div>

        <h2 style={styles.title}>Your current plan does not include this feature</h2>

        <p style={styles.text}>
          {message || getUpgradeMessage(requiredPlan)}
        </p>

        <div style={styles.metaBox}>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>Your plan</span>
            <span style={styles.metaValue}>{getPlanLabel(currentPlan)}</span>
          </div>

          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>Required plan</span>
            <span style={styles.metaValue}>{getPlanLabel(requiredPlan)}</span>
          </div>

          {source ? (
            <div style={styles.metaRow}>
              <span style={styles.metaLabel}>Blocked action</span>
              <span style={styles.metaValue}>{source}</span>
            </div>
          ) : null}
        </div>

        <div style={styles.actions}>
          <button style={styles.primaryButton} onClick={onViewPlans}>
            View Plans
          </button>

          <button style={styles.secondaryButton} onClick={onGoToBilling}>
            Go to Billing
          </button>

          <button style={styles.ghostButton} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2, 6, 23, 0.72)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 9999,
  },
  modal: {
    width: "100%",
    maxWidth: "620px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "20px",
    padding: "28px",
    color: "#fff",
    boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
  },
  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#1d4ed8",
    fontSize: "0.8rem",
    fontWeight: 700,
    marginBottom: "14px",
  },
  title: {
    margin: "0 0 12px 0",
    fontSize: "1.8rem",
    lineHeight: 1.2,
  },
  text: {
    margin: "0 0 18px 0",
    color: "#cbd5e1",
    lineHeight: 1.7,
  },
  metaBox: {
    background: "#111827",
    border: "1px solid #243244",
    borderRadius: "14px",
    padding: "14px 16px",
    marginBottom: "20px",
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "8px 0",
    borderBottom: "1px solid #1f2937",
  },
  metaLabel: {
    color: "#94a3b8",
  },
  metaValue: {
    fontWeight: 700,
    textTransform: "capitalize",
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "1px solid #475569",
    background: "#1f2937",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  ghostButton: {
    padding: "12px 18px",
    borderRadius: "12px",
    border: "1px solid #334155",
    background: "transparent",
    color: "#cbd5e1",
    fontWeight: 700,
    cursor: "pointer",
  },
};
