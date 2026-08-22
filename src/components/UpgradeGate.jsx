import { useNavigate } from "react-router-dom";
import { getPlanLabel, getUpgradeCopy } from "../lib/plan";

export default function UpgradeGate({
  requiredPlan = "pro",
  title = "Upgrade Required",
  featureName = "This feature",
  currentPlan = "free",
}) {
  const navigate = useNavigate();

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.badge}>Locked Feature</div>

        <h2 style={styles.title}>{title}</h2>

        <p style={styles.text}>
          <strong>{featureName}</strong> requires the{" "}
          <strong>
            {requiredPlan === "platform_admin"
              ? "PLATFORM ADMINISTRATOR"
              : getPlanLabel(requiredPlan)}
          </strong>{" "}
          access.
        </p>

        <p style={styles.subtext}>{getUpgradeCopy(requiredPlan)}</p>

        <p style={styles.subtext}>
          Current access: <strong>{getPlanLabel(currentPlan)}</strong>
        </p>

        <div style={styles.actions}>
          {requiredPlan !== "platform_admin" ? (
            <button
              onClick={() => navigate("/pricing")}
              style={styles.primaryButton}
            >
              View Plans
            </button>
          ) : null}

          <button
            onClick={() => navigate("/billing")}
            style={styles.secondaryButton}
          >
            Go to Billing
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "60vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: "680px",
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "28px",
    color: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
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
  },
  text: {
    margin: "0 0 10px 0",
    color: "#e5e7eb",
    lineHeight: 1.6,
    fontSize: "1rem",
  },
  subtext: {
    margin: "0 0 22px 0",
    color: "#94a3b8",
    lineHeight: 1.6,
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  primaryButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "12px 18px",
    border: "1px solid #475569",
    borderRadius: "10px",
    background: "#1f2937",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
};
