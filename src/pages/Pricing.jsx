import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { hasPlan, getPlanLabel } from "../lib/plan";

const plans = [
  {
    key: "starter",
    name: "Starter",
    price: "$49",
    period: "/month",
    tagline: "For local campaigns and small teams",
    description:
      "Get the essential campaign workspace tools you need to organize operations and move faster.",
    features: [
      "Campaign CRM and contact tracking",
      "Candidate and election data access",
      "Basic dashboards",
      "Vendor directory access",
      "Starter-level team workflows",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    key: "pro",
    name: "Pro",
    price: "$199",
    period: "/month",
    tagline: "For active campaign teams",
    description:
      "Unlock forecasting, alerts, intelligence, and the operational tools serious teams use every day.",
    features: [
      "Everything in Starter",
      "Forecasting dashboards",
      "Alerts and campaign signals",
      "Rankings and intelligence views",
      "Command Center access",
      "War Room and AI workflows",
    ],
    cta: "Upgrade to Pro",
    highlight: true,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "$499",
    period: "/month",
    tagline: "For firms, PACs, and national-scale operations",
    description:
      "Unlock full operational visibility with fundraising intelligence, MailOps, and enterprise workflows.",
    features: [
      "Everything in Pro",
      "Fundraising intelligence",
      "MailOps dashboard",
      "Executive dashboards",
      "Advanced firm coordination",
      "Enterprise-scale access",
    ],
    cta: "Go Enterprise",
    highlight: false,
  },
];

const comparisonRows = [
  { label: "Candidate & election data", starter: true, pro: true, enterprise: true },
  { label: "Campaign CRM", starter: true, pro: true, enterprise: true },
  { label: "Vendor marketplace access", starter: true, pro: true, enterprise: true },
  { label: "Forecasting", starter: false, pro: true, enterprise: true },
  { label: "Alerts", starter: false, pro: true, enterprise: true },
  { label: "War Room / AI workflows", starter: false, pro: true, enterprise: true },
  { label: "Fundraising intelligence", starter: false, pro: false, enterprise: true },
  { label: "MailOps dashboard", starter: false, pro: false, enterprise: true },
  { label: "Executive dashboards", starter: false, pro: false, enterprise: true },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { isAuthenticated, planTier } = useAuth();

  function handlePlanClick(planKey) {
    if (!isAuthenticated) {
      navigate("/signup");
      return;
    }

    if (hasPlan(planTier, planKey)) {
      navigate("/");
      return;
    }

    navigate("/billing");
  }

  function getButtonLabel(plan) {
    if (!isAuthenticated) return plan.cta;

    if (hasPlan(planTier, plan.key)) {
      return `Current Access: ${getPlanLabel(plan.key)}`;
    }

    return `Upgrade to ${plan.name}`;
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <div style={styles.eyebrow}>Pricing</div>
          <h1 style={styles.heroTitle}>
            Run smarter campaigns. Win with better intelligence.
          </h1>
          <p style={styles.heroSubtitle}>
            VoterSpheres is the command center for political firms, consultants,
            and campaign teams that need speed, visibility, and execution.
          </p>

          <div style={styles.heroActions}>
            <button
              style={styles.primaryButton}
              onClick={() => navigate(isAuthenticated ? "/billing" : "/signup")}
            >
              {isAuthenticated ? "Go to Billing" : "Start Now"}
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() => {
                const section = document.getElementById("plan-grid");
                if (section) section.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Plans
            </button>
          </div>
        </div>
      </section>

      <section style={styles.valueStrip}>
        <div style={styles.valueItem}>Election Intelligence</div>
        <div style={styles.valueItem}>Campaign CRM</div>
        <div style={styles.valueItem}>Forecasting</div>
        <div style={styles.valueItem}>Fundraising Data</div>
        <div style={styles.valueItem}>MailOps Visibility</div>
        <div style={styles.valueItem}>Real-Time Alerts</div>
      </section>

      <section id="plan-grid" style={styles.planSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Choose the plan that fits your operation</h2>
          <p style={styles.sectionSubtitle}>
            Start with the essentials or unlock the full political operating system.
          </p>
        </div>

        <div style={styles.planGrid}>
          {plans.map((plan) => (
            <div
              key={plan.key}
              style={{
                ...styles.planCard,
                ...(plan.highlight ? styles.planCardHighlight : {}),
              }}
            >
              {plan.highlight && <div style={styles.mostPopular}>Most Popular</div>}

              <div style={styles.planTagline}>{plan.tagline}</div>
              <h3 style={styles.planName}>{plan.name}</h3>

              <div style={styles.priceRow}>
                <span style={styles.price}>{plan.price}</span>
                <span style={styles.period}>{plan.period}</span>
              </div>

              <p style={styles.planDescription}>{plan.description}</p>

              <button
                style={plan.highlight ? styles.primaryButton : styles.planButton}
                onClick={() => handlePlanClick(plan.key)}
              >
                {getButtonLabel(plan)}
              </button>

              <ul style={styles.featureList}>
                {plan.features.map((feature) => (
                  <li key={feature} style={styles.featureItem}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.comparisonSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Compare plans</h2>
          <p style={styles.sectionSubtitle}>
            See exactly what unlocks as you move up.
          </p>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thLeft}>Feature</th>
                <th style={styles.th}>Starter</th>
                <th style={styles.th}>Pro</th>
                <th style={styles.th}>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label}>
                  <td style={styles.tdLeft}>{row.label}</td>
                  <td style={styles.td}>{row.starter ? "✓" : "—"}</td>
                  <td style={styles.td}>{row.pro ? "✓" : "—"}</td>
                  <td style={styles.td}>{row.enterprise ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={styles.positioningSection}>
        <div style={styles.positioningCard}>
          <h2 style={styles.sectionTitle}>Built for the realities of political campaigns</h2>
          <p style={styles.positioningText}>
            Campaigns move fast. Data is fragmented. Execution is everything.
            VoterSpheres brings your intelligence, workflows, and operational
            visibility into one place so your team can act faster and make better decisions.
          </p>
        </div>
      </section>

      <section style={styles.ctaSection}>
        <div style={styles.ctaCard}>
          <h2 style={styles.ctaTitle}>Stop guessing. Start executing.</h2>
          <p style={styles.ctaText}>
            Upgrade your campaign operation with the tools built for political professionals.
          </p>

          <div style={styles.heroActions}>
            <button
              style={styles.primaryButton}
              onClick={() => navigate(isAuthenticated ? "/billing" : "/signup")}
            >
              {isAuthenticated ? "Manage Plan" : "Start Your Account"}
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() => navigate("/")}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    color: "#ffffff",
    background:
      "linear-gradient(180deg, #091120 0%, #0b1020 40%, #0f172a 100%)",
  },
  hero: {
    padding: "64px 24px 32px",
  },
  heroContent: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  eyebrow: {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#1d4ed8",
    fontSize: "0.82rem",
    fontWeight: 700,
    marginBottom: "14px",
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(2rem, 4vw, 4rem)",
    lineHeight: 1.05,
    fontWeight: 800,
    maxWidth: "900px",
  },
  heroSubtitle: {
    marginTop: "18px",
    color: "#cbd5e1",
    lineHeight: 1.7,
    fontSize: "1.05rem",
    maxWidth: "760px",
  },
  heroActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "24px",
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
    background: "#111827",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  valueStrip: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 24px 24px",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  valueItem: {
    padding: "10px 14px",
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "999px",
    color: "#dbeafe",
    fontSize: "0.92rem",
    fontWeight: 600,
  },
  planSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "32px 24px",
  },
  sectionHeader: {
    marginBottom: "22px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 800,
  },
  sectionSubtitle: {
    marginTop: "10px",
    color: "#94a3b8",
    lineHeight: 1.6,
  },
  planGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },
  planCard: {
    position: "relative",
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "18px",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  planCardHighlight: {
    border: "1px solid #2563eb",
    boxShadow: "0 0 0 1px rgba(37,99,235,0.25)",
  },
  mostPopular: {
    position: "absolute",
    top: "14px",
    right: "14px",
    background: "#2563eb",
    color: "#fff",
    fontSize: "0.75rem",
    fontWeight: 700,
    padding: "6px 10px",
    borderRadius: "999px",
  },
  planTagline: {
    color: "#60a5fa",
    fontSize: "0.88rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  planName: {
    margin: 0,
    fontSize: "1.6rem",
    fontWeight: 800,
  },
  priceRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "6px",
  },
  price: {
    fontSize: "2.2rem",
    fontWeight: 800,
    lineHeight: 1,
  },
  period: {
    color: "#94a3b8",
    fontWeight: 600,
    marginBottom: "4px",
  },
  planDescription: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.6,
  },
  planButton: {
    padding: "12px 18px",
    border: "1px solid #475569",
    borderRadius: "10px",
    background: "#1f2937",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  featureList: {
    margin: 0,
    paddingLeft: "18px",
    color: "#e5e7eb",
    lineHeight: 1.8,
  },
  featureItem: {
    marginBottom: "4px",
  },
  comparisonSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "16px 24px 32px",
  },
  tableWrap: {
    overflowX: "auto",
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "16px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  thLeft: {
    textAlign: "left",
    padding: "16px",
    borderBottom: "1px solid #334155",
    color: "#fff",
    background: "#0f172a",
  },
  th: {
    textAlign: "center",
    padding: "16px",
    borderBottom: "1px solid #334155",
    color: "#fff",
    background: "#0f172a",
  },
  tdLeft: {
    padding: "14px 16px",
    borderBottom: "1px solid #1f2937",
    color: "#e5e7eb",
  },
  td: {
    padding: "14px 16px",
    borderBottom: "1px solid #1f2937",
    textAlign: "center",
    color: "#dbeafe",
    fontWeight: 700,
  },
  positioningSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 24px 32px",
  },
  positioningCard: {
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "24px",
  },
  positioningText: {
    marginTop: "12px",
    color: "#cbd5e1",
    lineHeight: 1.8,
    maxWidth: "900px",
  },
  ctaSection: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "0 24px 64px",
  },
  ctaCard: {
    background: "linear-gradient(135deg, #1d4ed8 0%, #1e293b 100%)",
    borderRadius: "20px",
    padding: "32px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  ctaTitle: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 800,
  },
  ctaText: {
    marginTop: "12px",
    color: "#dbeafe",
    maxWidth: "760px",
    lineHeight: 1.7,
  },
};
