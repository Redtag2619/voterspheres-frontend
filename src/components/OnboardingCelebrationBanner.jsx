import { Link } from "react-router-dom";

function getCelebrationConfig(planTier = "starter") {
  const plan = String(planTier || "starter").toLowerCase();

  if (plan === "starter") {
    return {
      title: "You’re fully set up for Starter",
      message:
        "Your workspace is ready. Now move into campaign operations and start using VoterSpheres every day.",
      ctaLabel: "Open Campaign Pipeline",
      ctaTo: "/campaign-pipeline",
    };
  }

  if (plan === "pro") {
    return {
      title: "You’re fully set up for Pro",
      message:
        "Your intelligence stack is live. Jump into forecasting and command workflows to start extracting real value.",
      ctaLabel: "Open Forecast",
      ctaTo: "/forecast",
    };
  }

  return {
    title: "You’re fully set up for Enterprise",
    message:
      "Your enterprise environment is ready. Go straight into your highest-value workflows and start driving outcomes.",
    ctaLabel: "Open Fundraising",
    ctaTo: "/fundraising",
  };
}

export default function OnboardingCelebrationBanner({ planTier = "starter" }) {
  const config = getCelebrationConfig(planTier);

  return (
    <div style={styles.wrap}>
      <div style={styles.badge}>Setup Complete</div>
      <h2 style={styles.title}>{config.title}</h2>
      <p style={styles.message}>{config.message}</p>

      <div style={styles.actions}>
        <Link to={config.ctaTo} style={styles.primaryButton}>
          {config.ctaLabel}
        </Link>

        <Link to="/" style={styles.secondaryButton}>
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    background: "linear-gradient(135deg, #1d4ed8 0%, #172554 45%, #0f172a 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "22px",
    padding: "28px",
    boxShadow: "0 18px 50px rgba(29,78,216,0.22)",
  },
  badge: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.14)",
    color: "#fff",
    fontSize: "0.8rem",
    fontWeight: 800,
    marginBottom: "14px",
  },
  title: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 900,
    lineHeight: 1.1,
  },
  message: {
    marginTop: "12px",
    maxWidth: "780px",
    color: "#dbeafe",
    lineHeight: 1.8,
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "20px",
  },
  primaryButton: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#0f172a",
    textDecoration: "none",
    fontWeight: 800,
  },
  secondaryButton: {
    display: "inline-block",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.22)",
    background: "transparent",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 800,
  },
};
