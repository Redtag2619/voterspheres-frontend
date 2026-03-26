import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getUpgradeMessage } from "../lib/plans";

export default function PlanProtectedRoute({
  children,
  requiredPlan = "starter",
}) {
  const { isAuthenticated, loading, canAccess, planTier } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>Loading your access...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccess(requiredPlan)) {
    return (
      <div style={styles.wrap}>
        <div style={styles.upgradeCard}>
          <div style={styles.eyebrow}>Upgrade Required</div>
          <h2 style={styles.title}>This feature is not in your current plan</h2>
          <p style={styles.text}>{getUpgradeMessage(requiredPlan)}</p>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>Your plan</span>
            <span style={styles.metaValue}>{planTier || "free"}</span>
          </div>
          <div style={styles.metaRow}>
            <span style={styles.metaLabel}>Required plan</span>
            <span style={styles.metaValue}>{requiredPlan}</span>
          </div>
          <a href="/billing" style={styles.button}>
            Upgrade in Billing
          </a>
        </div>
      </div>
    );
  }

  return children;
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
    background: "#111827",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "16px 20px",
  },
  upgradeCard: {
    maxWidth: "560px",
    width: "100%",
    background: "#111827",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "24px",
  },
  eyebrow: {
    color: "#60a5fa",
    fontSize: "0.82rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    marginBottom: "10px",
  },
  title: {
    margin: "0 0 10px 0",
    fontSize: "1.5rem",
  },
  text: {
    margin: "0 0 18px 0",
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    padding: "10px 0",
    borderTop: "1px solid #243047",
  },
  metaLabel: {
    color: "#94a3b8",
  },
  metaValue: {
    fontWeight: 700,
    textTransform: "capitalize",
  },
  button: {
    display: "inline-block",
    marginTop: "20px",
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    padding: "12px 16px",
    borderRadius: "10px",
    fontWeight: 700,
  },
};
