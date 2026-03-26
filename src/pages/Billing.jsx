import { useEffect, useMemo, useState } from "react";
import {
  getBillingConfig,
  createCheckoutSession,
  createPortalSession,
} from "../api/billing";

export default function Billing() {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState("");
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState("");

  // TEMPORARY until auth wiring is finished
  const firmId = 1;

  useEffect(() => {
    async function loadConfig() {
      try {
        setLoadingConfig(true);
        setError("");
        const data = await getBillingConfig();
        setConfig(data);
      } catch (err) {
        console.error("Failed to load billing config:", err);
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load billing config"
        );
      } finally {
        setLoadingConfig(false);
      }
    }

    loadConfig();
  }, []);

  const plans = useMemo(() => {
    if (!config?.prices) return [];

    return [
      {
        key: "starter",
        title: "Starter",
        description: "Core access for firms getting started.",
        priceId: config.prices.starter,
        features: [
          "Basic platform access",
          "Core election research tools",
          "Foundational campaign workflow",
        ],
      },
      {
        key: "pro",
        title: "Pro",
        description: "Advanced tools for active campaign operations.",
        priceId: config.prices.pro,
        features: [
          "Everything in Starter",
          "Expanded intelligence workflows",
          "Advanced campaign support",
        ],
      },
      {
        key: "enterprise",
        title: "Enterprise",
        description: "Full-scale access for large teams and organizations.",
        priceId: config.prices.enterprise,
        features: [
          "Everything in Pro",
          "Team-scale operations",
          "Premium workflow support",
        ],
      },
    ];
  }, [config]);

  async function handleSubscribe(planKey, priceId) {
    if (!priceId) {
      setError(`Missing Stripe price for ${planKey}`);
      return;
    }

    try {
      setLoadingCheckout(planKey);
      setError("");

      const data = await createCheckoutSession({
        firm_id: firmId,
        priceId,
      });

      if (!data?.url) {
        throw new Error("Checkout URL not returned");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to create checkout session"
      );
    } finally {
      setLoadingCheckout("");
    }
  }

  async function handleOpenPortal() {
    try {
      setLoadingPortal(true);
      setError("");

      const data = await createPortalSession({
        firm_id: firmId,
      });

      if (!data?.url) {
        throw new Error("Billing portal URL not returned");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Portal error:", err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to open billing portal"
      );
    } finally {
      setLoadingPortal(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.h1}>VoterSpheres Billing</h1>
        <p style={styles.subtext}>
          Choose a plan and manage your VoterSpheres subscription.
        </p>
      </div>

      {loadingConfig && <div style={styles.infoBox}>Loading billing plans...</div>}

      {error && <div style={styles.errorBox}>{error}</div>}

      {!loadingConfig && !error && (
        <>
          <div style={styles.grid}>
            {plans.map((plan) => (
              <div key={plan.key} style={styles.card}>
                <div style={styles.cardTop}>
                  <h2 style={styles.cardTitle}>{plan.title}</h2>
                  <p style={styles.cardDescription}>{plan.description}</p>
                </div>

                <ul style={styles.featureList}>
                  {plan.features.map((feature) => (
                    <li key={feature} style={styles.featureItem}>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  style={styles.primaryButton}
                  onClick={() => handleSubscribe(plan.key, plan.priceId)}
                  disabled={loadingCheckout === plan.key}
                >
                  {loadingCheckout === plan.key ? "Redirecting..." : `Choose ${plan.title}`}
                </button>
              </div>
            ))}
          </div>

          <div style={styles.portalSection}>
            <h3 style={styles.portalTitle}>Already subscribed?</h3>
            <p style={styles.portalText}>
              Open the Stripe billing portal to manage payment methods,
              invoices, and subscription details.
            </p>

            <button
              style={styles.secondaryButton}
              onClick={handleOpenPortal}
              disabled={loadingPortal}
            >
              {loadingPortal ? "Opening..." : "Manage Billing"}
            </button>
          </div>

          <div style={styles.noteBox}>
            Temporary frontend note: this page is currently using{" "}
            <strong>firm_id = 1</strong>. Next we will connect billing to your
            live login/auth flow so the correct firm is selected automatically.
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "32px 20px",
    maxWidth: "1200px",
    margin: "0 auto",
    color: "#eaeaea",
  },
  header: {
    marginBottom: "28px",
  },
  h1: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 800,
  },
  subtext: {
    marginTop: "8px",
    color: "#b8b8b8",
    fontSize: "1rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "20px",
  },
  card: {
    background: "#121826",
    border: "1px solid #243047",
    borderRadius: "16px",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "340px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
  },
  cardTop: {
    marginBottom: "18px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: 700,
  },
  cardDescription: {
    marginTop: "10px",
    color: "#b8c0d4",
    lineHeight: 1.5,
  },
  featureList: {
    paddingLeft: "18px",
    margin: "0 0 24px 0",
    color: "#d9deeb",
    lineHeight: 1.8,
  },
  featureItem: {
    marginBottom: "4px",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#1f2937",
    color: "#fff",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  portalSection: {
    marginTop: "30px",
    padding: "22px",
    borderRadius: "16px",
    background: "#10151f",
    border: "1px solid #243047",
  },
  portalTitle: {
    marginTop: 0,
    marginBottom: "8px",
    fontSize: "1.2rem",
  },
  portalText: {
    marginTop: 0,
    marginBottom: "16px",
    color: "#b8c0d4",
  },
  infoBox: {
    background: "#162032",
    border: "1px solid #2a3a57",
    color: "#dbe8ff",
    padding: "14px 16px",
    borderRadius: "12px",
  },
  errorBox: {
    background: "#34181b",
    border: "1px solid #7f1d1d",
    color: "#fecaca",
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
  },
  noteBox: {
    marginTop: "24px",
    background: "#1a1a1a",
    border: "1px solid #333",
    color: "#d1d5db",
    padding: "14px 16px",
    borderRadius: "12px",
  },
};
