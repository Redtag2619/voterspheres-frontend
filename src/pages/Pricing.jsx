import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCheckoutSession } from "../api/billing";
import { useAuth } from "../context/AuthContext";
import { hasPlan, normalizePlan } from "../lib/plan";
import { getPriceIdForPlan } from "../lib/stripePlans";
import { saveTrialIntent } from "../lib/trialIntent";

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
        trialDays: 7,
        featured: false,
        description:
          "Core campaign CRM, election data, vendor access, and starter workflow tools.",
        features: [
          "Campaign CRM",
          "Candidate & election data",
          "Vendor access",
          "Up to 2 users",
        ],
      },
      {
        key: "pro",
        name: "Pro",
        price: "$199",
        period: "/month",
        trialDays: 7,
        featured: true,
        description:
          "Forecasting, alerts, command tools, and advanced workflows for active teams.",
        features: [
          "Everything in Starter",
          "Forecasting dashboards",
          "Alerts",
          "Command Center",
          "War Room / AI tools",
        ],
      },
      {
        key: "enterprise",
        name: "Enterprise",
        price: "$499",
        period: "/month",
        trialDays: 7,
        featured: false,
        description:
          "Fundraising intelligence, MailOps, executive dashboards, and enterprise workflows.",
        features: [
          "Everything in Pro",
          "Fundraising intelligence",
          "MailOps dashboard",
          "Executive dashboards",
          "Priority support",
        ],
      },
    ],
    []
  );

  async function handlePlanAction(plan) {
    setError("");

    saveTrialIntent({
      selectedPlan: plan.key,
      trialDays: plan.trialDays,
      source: "pricing",
    });

    if (!isAuthenticated) {
      navigate("/signup", {
        state: {
          selectedPlan: plan.key,
          trialDays: plan.trialDays,
          source: "pricing",
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
      const successUrl = `${frontendBase}/checkout/success?success=1&plan=${plan.key}`;
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

  function getButtonLabel(plan) {
    if (!isAuthenticated) return `Start ${plan.trialDays}-Day Trial`;
    if (hasPlan(planTier, plan.key)) {
      return `Current Access: ${normalizePlan(plan.key).toUpperCase()}`;
    }
    return `Start ${plan.trialDays}-Day Trial`;
  }

  return (
    <div style={styles.page}>
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.badge}>Pricing & Plans</div>
          <h1 style={styles.title}>Run smarter campaigns with VoterSpheres</h1>
          <p style={styles.subtitle}>
            Political intelligence, campaign operations, and execution tools in one platform.
          </p>

          <div style={styles.actions}>
            <button
              style={styles.primaryButton}
              onClick={() => navigate(isAuthenticated ? "/billing" : "/signup")}
            >
              {isAuthenticated ? "Go to Billing" : "Start Your 7-Day Trial"}
            </button>

            <button
              style={styles.secondaryButton}
              onClick={() => {
                const el = document.getElementById("pricing-grid");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Plans
            </button>
          </div>
        </div>
      </section>

      <section id="pricing-grid" style={styles.section}>
        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.grid}>
          {plans.map((plan) => (
            <div
              key={plan.key}
              style={{
                ...styles.card,
                ...(plan.featured ? styles.featuredCard : {}),
              }}
            >
              <div style={styles.cardTop}>
                <div style={plan.featured ? styles.featuredTag : styles.tag}>
                  {plan.featured ? "Most Popular" : plan.name}
                </div>
                <h2 style={styles.cardTitle}>{plan.name}</h2>
                <div style={styles.priceRow}>
                  <span style={styles.price}>{plan.price}</span>
                  <span style={styles.period}>{plan.period}</span>
                </div>
                <div style={styles.trial}>{plan.trialDays}-day free trial</div>
                <p style={styles.description}>{plan.description}</p>
              </div>

              <button
                style={plan.featured ? styles.primaryButton : styles.planButton}
                onClick={() => handlePlanAction(plan)}
                disabled={loadingPlan === plan.key}
              >
                {loadingPlan === plan.key ? "Redirecting..." : getButtonLabel(plan)}
              </button>

              <ul style={styles.list}>
                {plan.features.map((feature) => (
                  <li key={feature} style={styles.listItem}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    color: "#fff",
    background:
      "radial-gradient(circle at top, rgba(37,99,235,0.12) 0%, rgba(11,16,32,1) 32%, rgba(15,23,42,1) 100%)",
  },
  hero: {
    padding: "72px 24px 36px",
  },
  heroInner: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  badge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "rgba(37,99,235,0.18)",
    border: "1px solid rgba(96,165,250,0.3)",
    color: "#dbeafe",
    fontSize: "0.82rem",
    fontWeight: 700,
    marginBottom: "16px",
  },
  title: {
    margin: 0,
    fontSize: "clamp(2.4rem, 5vw, 4.5rem)",
    lineHeight: 1.02,
    fontWeight: 900,
    maxWidth: "900px",
  },
  subtitle: {
    marginTop: "18px",
    maxWidth: "760px",
    color: "#cbd5e1",
    lineHeight: 1.8,
    fontSize: "1.05rem",
  },
  actions: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginTop: "26px",
  },
  section: {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "26px 24px 48px",
  },
  errorBox: {
    marginBottom: "18px",
    padding: "14px 16px",
    borderRadius: "12px",
    background: "#34181b",
    border: "1px solid #7f1d1d",
    color: "#fecaca",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
    gap: "18px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    background: "rgba(17,24,39,0.96)",
    border: "1px solid #334155",
    borderRadius: "22px",
    padding: "26px",
  },
  featuredCard: {
    border: "1px solid rgba(37,99,235,0.7)",
    boxShadow: "0 18px 40px rgba(37,99,235,0.18)",
  },
  cardTop: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  tag: {
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
  featuredTag: {
    display: "inline-block",
    alignSelf: "flex-start",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#1d4ed8",
    border: "1px solid #1d4ed8",
    color: "#fff",
    fontSize: "0.8rem",
    fontWeight: 700,
  },
  cardTitle: {
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
  period: {
    color: "#94a3b8",
    fontWeight: 700,
    marginBottom: "4px",
  },
  trial: {
    color: "#60a5fa",
    fontWeight: 700,
    fontSize: "0.92rem",
  },
  description: {
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.7,
  },
  primaryButton: {
    padding: "13px 18px",
    borderRadius: "12px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    padding: "13px 18px",
    borderRadius: "12px",
    border: "1px solid #475569",
    background: "rgba(15,23,42,0.8)",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
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
  list: {
    margin: 0,
    paddingLeft: "18px",
    color: "#e5e7eb",
    lineHeight: 1.8,
  },
  listItem: {
    marginBottom: "4px",
  },
};
