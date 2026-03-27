import { useAuth } from "../context/AuthContext";
import { hasPlan } from "../lib/plan";
import UpgradeGate from "../components/UpgradeGate";

export default function Forecast() {
  const { user } = useAuth();

  if (!hasPlan(user?.plan_tier, "pro")) {
    return (
      <UpgradeGate
        requiredPlan="pro"
        title="Forecasting is a Pro Feature"
        featureName="Forecasting dashboard"
      />
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Forecast Dashboard</h1>
        <p style={styles.subtitle}>
          Track projected outcomes, movement, and high-priority races from one place.
        </p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Race Outlook</h2>
          <p style={styles.cardText}>
            View forecast snapshots, competitive movement, and likely trend shifts.
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Priority Monitoring</h2>
          <p style={styles.cardText}>
            Focus on the races that need immediate strategic attention.
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Overlay Intelligence</h2>
          <p style={styles.cardText}>
            Combine forecast movement with campaign, geographic, and fundraising signals.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    color: "#fff",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 800,
  },
  subtitle: {
    marginTop: "8px",
    color: "#94a3b8",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "20px",
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "10px",
    fontSize: "1.15rem",
  },
  cardText: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
};
