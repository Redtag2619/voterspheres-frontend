import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCheckoutSession } from "../api/billing";
import { useAuth } from "../context/AuthContext";
import { hasPlan, normalizePlan } from "../lib/plan";

const TRUST_ITEMS = [
  "Built for political firms and campaign teams",
  "Designed for fast-moving campaign decisions",
  "Plan-based access for secure team operations",
  "Billing and upgrades built directly into the platform",
];

const FAQS = [
  {
    q: "Is there a free trial?",
    a: "Yes. New customers can start with a 7-day trial on eligible plans before committing to a paid subscription.",
  },
  {
    q: "Can I upgrade later?",
    a: "Yes. You can upgrade from Starter to Pro or Enterprise at any time from the Billing page.",
  },
  {
    q: "Who is Enterprise for?",
    a: "Enterprise is designed for firms, PACs, national programs, and operations that need fundraising intelligence, MailOps visibility, and executive reporting.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { isAuthenticated, planTier } = useAuth();

  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState("");

  const plans = useMemo(
    () => [
      {
        key: "starter",
        name: "Starter",
        price: "$49",
        period: "/month",
        badge: "Best for local teams",
        headline: "Launch your political workspace",
        description:
          "Get organized fast with campaign CRM, election data, vendor access, and the core tools needed to manage operations.",
        features: [
          "Campaign CRM and contact tracking",
          "Candidate and election data",
          "Vendor directory access",
          "Starter workflow tools",
          "Up to 2 users",
        ],
        trialDays: 7,
        featured: false,
      },
      {
        key: "pro",
        name: "Pro",
        price: "$199",
        period: "/month",
        badge: "Most Popular",
        headline: "Run serious campaign operations",
        description:
          "Unlock forecasting, alerts, AI-assisted workflows, and decision tools for fast-moving campaign teams.",
        features: [
          "Everything in Starter",
          "Forecasting dashboards",
          "Alerts and intelligence views",
          "Command Center access",
          "War Room and AI workflows",
          "Multi-user operations",
        ],
        trialDays: 7,
        featured: true,
      },
      {
        key: "enterprise",
        name: "Enterprise",
        price: "$499",
        period: "/month",
        badge: "For firms and PACs",
        headline: "Operate at enterprise scale",
        description:
          "Gain fundraising intelligence, MailOps visibility, executive dashboards, and the workflows needed by larger organizations.",
        features: [
          "Everything in Pro",
          "Fundraising intelligence",
          "MailOps dashboard",
          "Executive dashboards",
          "Firm-wide operational visibility",
          "Priority support and scale",
        ],
        trialDays: 7,
        featured: false,
      },
    ],
    []
  );

  const comparisonRows = [
    { label: "Candidate & election data", starter: true, pro: true, enterprise: true },
    { label: "Campaign CRM", starter: true, pro: true, enterprise: true },
    { label: "Vendor access", starter: true, pro: true, enterprise: true },
    { label: "Forecasting", starter: false, pro: true, enterprise: true },
    { label: "Alerts", starter: false, pro: true, enterprise: true },
    { label: "Command Center", starter: false, pro: true, enterprise: true },
    { label: "AI / War Room workflows", starter: false, pro: true, enterprise: true },
    { label: "Fundraising intelligence", starter: false, pro: false, enterprise: true },
    { label: "MailOps dashboard", starter: false, pro: false, enterprise: true },
    { label: "Executive dashboards", starter: false, pro: false, enterprise: true },
  ];

  async function handlePlanAction(plan) {
    setError("");

    if (!isAuthenticated) {
      navigate("/signup", {
        state: {
          selectedPlan: plan.key,
          trialDays: plan.trialDays,
        },
      });
      return;
    }

    if (hasPlan(planTier, plan.key)) {
      navigate("/billing");
      return;
    }

    try {
      setLoadingPlan(plan.key);

      const frontendBase = window.location.origin;
      const successUrl = `${frontendBase}/billing?success=1&plan=${plan.key}`;
      const cancelUrl = `${frontendBase}/pricing?canceled=1`;

      const data = await createCheckoutSession({
        priceId: getPriceIdForPlan(plan.key),
        successUrl,
        cancelUrl,
        trialDays: plan.trialDays,
      });

      if (!data?.url) {
        throw new Error("Checkout URL not returned");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Pricing checkout error:", err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to start checkout right now."
      );
    } finally {
      setLoadingPlan("");
    }
  }

  function getPriceIdForPlan(planKey) {
    const prices = {
      starter: import.meta.env.VITE_STRIPE_PRICE_STARTER || "starter",
      pro: import.meta.env.VITE_STRIPE_PRICE_PRO || "pro",
      enterprise: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || "enterprise",
    };

    return prices[planKey];
  }

  function getButtonLabel(plan) {
    if (!isAuthenticated) {
      return `Start ${plan.trialDays}-Day Trial`;
    }

    if (hasPlan(planTier, plan.key)) {
      return `Current Access: ${normalizePlan(plan.key).toUpperCase()}`;
    }

    return `Start ${plan.trialDays}-Day Trial`;
  }

  function renderCell(value) {
    return value ? "✓" : "—";
  }

  return (
    <div style={styles.page}>
      <section style={styles.heroSection}>
        <div style={styles.heroGlowOne} />
        <div style={styles.heroGlowTwo} />

        <div style={styles.heroContent}>
          <div style={styles.heroBadge}>Pricing & Plans</div>

          <h1 style={styles.heroTitle}>
            The operating system for modern political campaigns
          </h1>

          <p style={styles.heroSubtitle}>
            VoterSpheres helps firms, consultants, and campaign teams move faster
            with election intelligence, operational visibility, and execution tools
            built for political work.
          </p>

          <div style={styles.heroActions}>
            <button
              style={styles.primaryHeroButton}
              onClick={() => navigate(isAuthenticated ? "/billing" : "/signup")}
            >
              {isAuthenticated ? "Go to Billing" : "Start Your 7-Day Trial"}
            </button>

            <button
              style={styles.secondaryHeroButton}
              onClick={() => {
                const el = document.getElementById("pricing-grid");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Compare Plans
            </button>
          </div>

          <div style={styles.trustRow}>
            {TRUST_ITEMS.map((item) => (
              <div key={item} style={styles.trustPill}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={styles.funnelSection}>
        <div style={styles.funnelGrid}>
          <div style={styles.funnelCard}>
            <div style={styles.funnelStep}>01</div>
            <h3 style={styles.funnelTitle}>Start your trial</h3>
            <p style={styles.funnelText}>
              Pick the plan that matches your operation and start with a low-friction trial.
            </p>
          </div>

          <div style={styles.funnelCard}>
            <div style={styles.funnelStep}>02</div>
            <h3 style={styles.funnelTitle}>Unlock the right tools</h3>
            <p style={styles.funnelText}>
              Access forecasting, alerts, fundraising intelligence, MailOps, and team workflows.
            </p>
          </div>

          <div style={styles.funnelCard}>
            <div style={styles.funnelStep}>03</div>
            <h3 style={styles.funnelTitle}>Scale with confidence</h3>
            <p style={styles.funnelText}>
              Upgrade as your campaign operation grows, without changing platforms.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing-grid" style={styles.planSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Simple plans for serious political work</h2>
          <p style={styles.sectionSubtitle}>
            Choose the level of access your operation needs today and expand as you grow.
          </p>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.planGrid}>
          {plans.map((plan) => (
            <div
              key={plan.key}
              style={{
                ...styles.planCard,
                ...(plan.featured ? styles.featuredPlanCard : {}),
              }}
            >
              <div style={styles.planTop}>
                <div
                  style={{
                    ...styles.planBadge,
                    ...(plan.featured ? styles.featuredBadge : {}),
                  }}
                >
                  {plan.badge}
                </div>

                <h3 style={styles.planName}>{plan.name}</h3>

                <div style={styles.priceRow}>
                  <span style={styles.price}>{plan.price}</span>
                  <span style={styles.pricePeriod}>{plan.period}</span>
                </div>

                <div style={styles.trialText}>{plan.trialDays}-day free trial</div>

                <p style={styles.planHeadline}>{plan.headline}</p>
                <p style={styles.planDescription}>{plan.description}</p>
              </div>

              <button
                style={plan.featured ? styles.featuredPlanButton : styles.planButton}
                onClick={() => handlePlanAction(plan)}
                disabled={loadingPlan === plan.key}
              >
                {loadingPlan === plan.key ? "Redirecting..." : getButtonLabel(plan)}
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
          <h2 style={styles.sectionTitle}>Compare what unlocks at each level</h2>
          <p style={styles.sectionSubtitle}>
            Turn pricing into a clear operational decision for your team.
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
                  <td style={styles.td}>{renderCell(row.starter)}</td>
                  <td style={styles.td}>{renderCell(row.pro)}</td>
                  <td style={styles.td}>{renderCell(row.enterprise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section style={styles.authoritySection}>
        <div style={styles.authorityCard}>
          <h2 style={styles.sectionTitle}>Built for the realities of campaigns</h2>
          <p style={styles.authorityText}>
            Political operations do not have time for fragmented tools, stale data,
            or disconnected workflows. VoterSpheres brings your intelligence,
            campaign visibility, and operational execution into one platform.
          </p>
        </div>
      </section>

      <section style={styles.faqSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Frequently asked questions</h2>
          <p style={styles.sectionSubtitle}>
            Answers that help teams move faster to a decision.
          </p>
        </div>

        <div style={styles.faqGrid}>
          {FAQS.map((faq) => (
            <div key={faq.q} style={styles.faqCard}>
              <h3 style={styles.faqQuestion}>{faq.q}</h3>
              <p style={styles.faqAnswer}>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.finalCtaSection}>
        <div style={styles.finalCtaCard}>
          <h2 style={styles.finalCtaTitle}>Stop guessing. Start executing.</h2>
          <p style={styles.finalCtaText}>
            Choose your plan, start your trial, and put campaign intelligence to work.
          </p>

          <div style={styles.heroActions}>
            <button
              style={styles.primaryHeroButton}
              onClick={() => navigate(isAuthenticated ? "/billing" : "/signup")}
            >
              {isAuthenticated ? "Manage Billing" : "Start Your Trial"}
            </button>

            <button
              style={styles.secondaryHeroButton}
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
      "radial-gradient(circle at top, rgba(37,99,235,0.12) 0%, rgba(11,16,32,1) 32%, rgba(15,23,42,1) 100%)",
  },
  heroSection: {
    position: "relative",
    overflow: "hidden",
    padding: "72px 24px 36px",
  },
  heroGlowOne: {
    position: "absolute",
    top: "-120px",
    left: "-80px",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(37,99,235,0.18)",
    filter: "blur(70px)",
  },
  heroGlowTwo: {
    position: "absolute",
    top: "20px",
    right: "-40px",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "rgba(59,130,246,0.12)",
    filter: "blur(80px)",
  },
  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1180px",
    margin: "0 auto",
  },
  heroBadge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "rgba(37,99,235,0.18)",
    border: "1px solid rgba(96,165,250,0.3)",
    color: "#dbeafe",
    fontSize: "0.82rem",
    fontWeight: 700,
    marginBottom: "16px",
    backdropFilter: "blur(8px)",
  },
  heroTitle: {
    margin: 0,
    fontSize: "clamp(2.4rem, 5vw, 4.8rem)",
    lineHeight: 1.02,
    fontWeight: 900,
    letterSpacing: "-0.03em",
    maxWidth: "980px",
  },
  heroSubtitle: {
    marginTop: "18px",
    maxWidth: "760px",
    color: "#cbd5e1",
    lineHeight: 1.8,
    fontSize: "1.08rem",
  },
  heroActions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "26px",
  },
  primaryHeroButton: {
    padding: "13px 20px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(37,99,235,0.25)",
  },
  secondaryHeroButton: {
    padding: "13px 20px",
    borderRadius: "12px",
    border: "1px solid #475569",
    background: "rgba(15,23,42,0.8)",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  trustRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "26px",
  },
  trustPill: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "rgba(17,24,39,0.92)",
    border: "1px solid #334155",
    color: "#dbeafe",
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  funnelSection: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "0 24px 28px",
  },
  funnelGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "16px",
  },
  funnelCard: {
    background: "rgba(17,24,39,0.92)",
    border: "1px solid #334155",
    borderRadius: "18px",
    padding: "22px",
  },
  funnelStep: {
    fontSize: "0.82rem",
    fontWeight: 800,
    color: "#60a5fa",
    marginBottom: "10px",
  },
  funnelTitle: {
    margin: 0,
    fontSize: "1.15rem",
    fontWeight: 800,
  },
  funnelText: {
    marginTop: "10px",
    color: "#cbd5e1",
    lineHeight: 1.7,
  },
  planSection: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "26px 24px 32px",
  },
  sectionHeader: {
    marginBottom: "24px",
  },
  sectionTitle: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 850,
    letterSpacing: "-0.02em",
  },
  sectionSubtitle: {
    marginTop: "10px",
    color: "#94a3b8",
    lineHeight: 1.7,
    maxWidth: "760px",
  },
  errorBox: {
    marginBottom: "18px",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#34181b",
    border: "1px solid #7f1d1d",
    color: "#fecaca",
  },
  planGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: "18px",
  },
  planCard: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    background: "rgba(17,24,39,0.96)",
    border: "1px solid #334155",
    borderRadius: "22px",
    padding: "26px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
  },
  featuredPlanCard: {
    border: "1px solid rgba(37,99,235,0.7)",
    boxShadow: "0 18px 40px rgba(37,99,235,0.18)",
    transform: "translateY(-4px)",
  },
  planTop: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  planBadge: {
    display: "inline-block",
    alignSelf: "flex-start",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#1f2937",
    border: "1px solid #334155",
    color: "#cbd5e1",
    fontSize: "0.8rem",
    fontWeight: 700,
  },
  featuredBadge: {
    background: "#1d4ed8",
    border: "1px solid #1d4ed8",
    color: "#fff",
  },
  planName: {
    margin: 0,
    fontSize: "1.75rem",
    fontWeight: 900,
  },
  priceRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
  },
  price: {
    fontSize: "2.6rem",
    fontWeight: 900,
    lineHeight: 1,
  },
  pricePeriod: {
    color: "#94a3b8",
    fontWeight: 700,
    marginBottom: "4px",
  },
  trialText: {
    color: "#60a5fa",
    fontWeight: 700,
    fontSize: "0.92rem",
  },
  planHeadline: {
    margin: 0,
    fontWeight: 800,
    fontSize: "1rem",
    color: "#ffffff",
  },
  planDescription: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.7,
  },
  planButton: {
    padding: "13px 18px",
    borderRadius: "12px",
    border: "1px solid #475569",
    background: "#1f2937",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  featuredPlanButton: {
    padding: "13px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(37,99,235,0.22)",
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
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "12px 24px 34px",
  },
  tableWrap: {
    overflowX: "auto",
    borderRadius: "18px",
    background: "rgba(17,24,39,0.96)",
    border: "1px solid #334155",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  thLeft: {
    textAlign: "left",
    padding: "16px",
    background: "#0f172a",
    borderBottom: "1px solid #334155",
  },
  th: {
    textAlign: "center",
    padding: "16px",
    background: "#0f172a",
    borderBottom: "1px solid #334155",
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
    fontWeight: 800,
  },
  authoritySection: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "0 24px 34px",
  },
  authorityCard: {
    padding: "28px",
    borderRadius: "20px",
    background: "rgba(17,24,39,0.96)",
    border: "1px solid #334155",
  },
  authorityText: {
    marginTop: "14px",
    color: "#cbd5e1",
    lineHeight: 1.8,
    maxWidth: "900px",
  },
  faqSection: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "0 24px 34px",
  },
  faqGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  faqCard: {
    background: "rgba(17,24,39,0.96)",
    border: "1px solid #334155",
    borderRadius: "18px",
    padding: "22px",
  },
  faqQuestion: {
    margin: 0,
    fontSize: "1.05rem",
    fontWeight: 800,
  },
  faqAnswer: {
    marginTop: "10px",
    color: "#cbd5e1",
    lineHeight: 1.7,
  },
  finalCtaSection: {
    maxWidth: "1180px",
    margin: "0 auto",
    padding: "0 24px 64px",
  },
  finalCtaCard: {
    padding: "34px",
    borderRadius: "24px",
    background: "linear-gradient(135deg, #1d4ed8 0%, #172554 45%, #0f172a 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 18px 50px rgba(29,78,216,0.2)",
  },
  finalCtaTitle: {
    margin: 0,
    fontSize: "2.1rem",
    fontWeight: 900,
  },
  finalCtaText: {
    marginTop: "12px",
    color: "#dbeafe",
    lineHeight: 1.8,
    maxWidth: "760px",
  },
};
