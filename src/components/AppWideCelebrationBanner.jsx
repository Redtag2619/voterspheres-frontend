import { Link } from "react-router-dom";

function getConfig(planTier = "starter") {
  const plan = String(planTier || "starter").toLowerCase();

  if (plan === "starter") {
    return {
      title: "You’re fully set up",
      message: "Your Starter workspace is ready. Jump into campaign operations now.",
      ctaLabel: "Open Campaign Pipeline",
      ctaTo: "/campaign-pipeline",
    };
  }

  if (plan === "pro") {
    return {
      title: "You’re fully set up",
      message: "Your Pro intelligence stack is ready. Start forecasting and command workflows now.",
      ctaLabel: "Open Forecast",
      ctaTo: "/forecast",
    };
  }

  return {
    title: "You’re fully set up",
    message: "Your Enterprise environment is ready. Go straight into your highest-value workflows.",
    ctaLabel: "Open Fundraising",
    ctaTo: "/fundraising",
  };
}

export default function AppWideCelebrationBanner({
  planTier = "starter",
  onDismiss,
}) {
  const config = getConfig(planTier);

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <div style={styles.badge}>Setup Complete</div>

        <div style={styles.body}>
          <div style={styles.title}>{config.title}</div>
          <div style={styles.message}>{config.message}</div>
        </div>

        <div style={styles.actions}>
          <Link to={config.ctaTo} style={styles.primaryButton}>
            {config.ctaLabel}
          </Link>

          <button style={styles.secondaryButton} onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "sticky",
    top: 0,
    zIndex: 9000,
    padding: "12px 20px 0",
    background: "transparent",
  },
  card: {
    maxWidth: "1280px",
    margin: "0 auto",
    display: "flex",
    gap: "16px",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    padding: "16px 18px",
    borderRadius: "18px",
    background: "linear-gradient(135deg, #1d4ed8 0%, #172554 45%, #0f172a 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 14px 40px rgba(29,78,216,0.18)",
    color: "#fff",
  },
  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.15)",
    fontSize: "0.76rem",
    fontWeight: 800,
  },
  body: {
    flex: 1,
    minWidth: "240px",
  },
  title: {
    fontSize: "1rem",
    fontWeight: 900,
    marginBottom: "4px",
  },
  message: {
    color: "#dbeafe",
    lineHeight: 1.6,
    fontSize: "0.92rem",
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    display: "inline-block",
    padding: "10px 14px",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#0f172a",
    textDecoration: "none",
    fontWeight: 800,
  },
  secondaryButton: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "transparent",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
};
