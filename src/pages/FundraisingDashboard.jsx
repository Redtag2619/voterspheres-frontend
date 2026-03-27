import { useAuth } from "../context/AuthContext";
import { hasPlan } from "../lib/plan";
import UpgradeGate from "../components/UpgradeGate"; 

export default function FundraisingDashboard() {
  const { user } = useAuth();

  if (!hasPlan(user?.plan_tier, "enterprise")) {
    return (
      <UpgradeGate
        requiredPlan="enterprise"
        title="Fundraising Intelligence is an Enterprise Feature"
        featureName="Fundraising dashboard"
      />
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Fundraising Dashboard</h1>
        <p style={styles.subtitle}>
          Monitor fundraising leaders, cash movement, and finance pressure points across races.
        </p>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Leaderboard</h2>
          <p style={styles.cardText}>
            Identify top-performing campaigns and finance trends by office and state.
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Cash Strength</h2>
          <p style={styles.cardText}>
            Evaluate financial durability and spot campaigns with staying power.
          </p>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Strategic Signals</h2>
          <p style={styles.cardText}>
            Turn fundraising movement into early-warning intelligence for your team.
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
