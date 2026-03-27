import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  getBillingConfig,
  getBillingDebug,
  createCheckoutSession,
  createPortalSession,
} from "../api/billing";
import { useAuth } from "../context/AuthContext";

export default function Billing() {
  const { user, firmId, isAuthenticated, loading: authLoading } = useAuth();

  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState("");
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState("");

  const [debugData, setDebugData] = useState(null);
  const [loadingDebug, setLoadingDebug] = useState(false);
  const [debugError, setDebugError] = useState("");

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

  useEffect(() => {
    async function loadDebug() {
      if (!isAuthenticated) return;

      try {
        setLoadingDebug(true);
        setDebugError("");
        const data = await getBillingDebug();
        setDebugData(data);
      } catch (err) {
        console.error("Failed to load billing debug:", err);
        setDebugError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load billing debug info"
        );
      } finally {
        setLoadingDebug(false);
      }
    }

    loadDebug();
  }, [isAuthenticated]);

  const plans = useMemo(() => {
    if (!config?.prices) return [];

    return [
      {
        key: "starter",
        title: "Starter",
        subtitle: "Launch your campaign workspace",
        description:
          "Essential tools for getting started with VoterSpheres.",
        priceId: config.prices.starter,
        features: [
          "Core campaign workspace",
          "Candidate and election tracking",
          "Basic team access",
        ],
      },
      {
        key: "pro",
        title: "Pro",
        subtitle: "For active campaign operations",
        description:
          "Advanced workflows and deeper campaign intelligence for growing teams.",
        priceId: config.prices.pro,
        features: [
          "Everything in Starter",
          "Expanded intelligence access",
          "Advanced campaign operations",
        ],
      },
      {
        key: "enterprise",
        title: "Enterprise",
        subtitle: "For full-scale organizations",
        description:
          "High-capacity access for firms, teams, and enterprise workflows.",
        priceId: config.prices.enterprise,
        features: [
          "Everything in Pro",
          "Enterprise-scale workflows",
          "Premium platform support",
        ],
      },
    ];
  }, [config]);

  async function refreshDebug() {
    try {
      setLoadingDebug(true);
      setDebugError("");
      const data = await getBillingDebug();
      setDebugData(data);
    } catch (err) {
      console.error("Failed to refresh billing debug:", err);
      setDebugError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to refresh billing debug info"
      );
    } finally {
      setLoadingDebug(false);
    }
  }

  async function handleSubscribe(planKey, priceId) {
    try {
      setLoadingCheckout(planKey);
      setError("");

      const data = await createCheckoutSession({ priceId });

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

  async function handlePortal() {
    try {
      setLoadingPortal(true);
      setError("");

      const data = await createPortalSession();

      if (!data?.url) {
        throw new Error("Portal URL not returned");
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

  if (authLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.infoBox}>Loading your account...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>Billing</h1>
          <p style={styles.subtext}>
            Manage your VoterSpheres subscription and billing access.
          </p>
        </div>

        <div style={styles.accountBox}>
          <div style={styles.accountRow}>
            <span style={styles.accountLabel}>Signed in as</span>
            <span style={styles.accountValue}>
              {user?.email || user?.first_name || "User"}
            </span>
          </div>
          <div style={styles.accountRow}>
            <span style={styles.accountLabel}>Firm ID</span>
            <span style={styles.accountValue}>{firmId || "Not linked"}</span>
          </div>
        </div>
      </div>

      <div style={styles.debugSection}>
        <div style={styles.debugHeader}>
          <div>
            <h3 style={styles.debugTitle}>Billing Debug</h3>
            <p style={styles.debugText}>
              Live billing sync state from the backend for your current firm.
            </p>
          </div>

          <button
            style={styles.secondaryButton}
            onClick={refreshDebug}
            disabled={loadingDebug}
          >
            {loadingDebug ? "Refreshing..." : "Refresh Debug"}
          </button>
        </div>

        {debugError && <div style={styles.errorBox}>{debugError}</div>}

        {!debugError && loadingDebug && !debugData && (
          <div style={styles.infoBox}>Loading billing debug info...</div>
        )}

        {!debugError && debugData && (
          <div style={styles.debugGrid}>
            <DebugField label="Firm ID" value={debugData.firm_id} />
            <DebugField label="Firm Name" value={debugData.firm_name} />
            <DebugField label="Email" value={debugData.email} />
            <DebugField label="Plan Tier" value={debugData.plan_tier} />
            <DebugField label="Status" value={debugData.status} />
            <DebugField
              label="Stripe Customer ID"
              value={debugData.stripe_customer_id}
            />
            <DebugField
              label="Stripe Subscription ID"
              value={debugData.stripe_subscription_id}
            />
            <DebugField
              label="Last Webhook Event Type"
              value={debugData.last_webhook_event_type}
            />
            <DebugField
              label="Last Webhook Event ID"
              value={debugData.last_webhook_event_id}
            />
            <DebugField
              label="Last Webhook Event At"
              value={debugData.last_webhook_event_at}
            />
            <DebugField label="Updated At" value={debugData.updated_at} />
          </div>
        )}
      </div>

      {loadingConfig && <div style={styles.infoBox}>Loading billing plans...</div>}

      {error && <div style={styles.errorBox}>{error}</div>}

      {!loadingConfig && !error && (
        <>
          <div style={styles.grid}>
            {plans.map((plan) => (
              <div key={plan.key} style={styles.card}>
                <div>
                  <div style={styles.planEyebrow}>{plan.subtitle}</div>
                  <h2 style={styles.cardTitle}>{plan.title}</h2>
                  <p style={styles.cardDescription}>{plan.description}</p>

                  <ul style={styles.featureList}>
                    {plan.features.map((feature) => (
                      <li key={feature} style={styles.featureItem}>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  style={styles.primaryButton}
                  onClick={() => handleSubscribe(plan.key, plan.priceId)}
                  disabled={loadingCheckout === plan.key || !firmId}
                >
                  {loadingCheckout === plan.key ? "Redirecting..." : "Subscribe"}
                </button>
              </div>
            ))}
          </div>

          <div style={styles.portalSection}>
            <div>
              <h3 style={styles.portalTitle}>Manage existing billing</h3>
              <p style={styles.portalText}>
                Open the Stripe billing portal to update payment methods,
                invoices, and subscription settings.
              </p>
            </div>

            <button
              style={styles.secondaryButton}
              onClick={handlePortal}
              disabled={loadingPortal || !firmId}
            >
              {loadingPortal ? "Opening..." : "Manage Billing"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DebugField({ label, value }) {
  return (
    <div style={styles.debugCard}>
      <div style={styles.debugLabel}>{label}</div>
      <div style={styles.debugValue}>{value || "—"}</div>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    color: "#ffffff",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: "24px",
  },
  h1: {
    margin: 0,
    fontSize: "2rem",
    fontWeight: 800,
  },
  subtext: {
    marginTop: "8px",
    color: "#cbd5e1",
  },
  accountBox: {
    minWidth: "260px",
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "16px",
  },
  accountRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "8px",
  },
  accountLabel: {
    color: "#94a3b8",
    fontSize: "0.92rem",
  },
  accountValue: {
    color: "#ffffff",
    fontWeight: 600,
    fontSize: "0.95rem",
  },
  debugSection: {
    marginBottom: "24px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "20px",
  },
  debugHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  debugTitle: {
    margin: 0,
    fontSize: "1.15rem",
  },
  debugText: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#cbd5e1",
  },
  debugGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px",
  },
  debugCard: {
    background: "#111827",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "14px",
  },
  debugLabel: {
    color: "#94a3b8",
    fontSize: "0.82rem",
    marginBottom: "8px",
  },
  debugValue: {
    color: "#ffffff",
    fontWeight: 700,
    wordBreak: "break-word",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  card: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: "18px",
    border: "1px solid #334155",
    borderRadius: "14px",
    padding: "20px",
    background: "#111827",
    minHeight: "320px",
  },
  planEyebrow: {
    color: "#60a5fa",
    fontSize: "0.85rem",
    fontWeight: 700,
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  cardTitle: {
    margin: 0,
    fontSize: "1.4rem",
    fontWeight: 700,
  },
  cardDescription: {
    marginTop: "10px",
    color: "#cbd5e1",
    lineHeight: 1.5,
  },
  featureList: {
    marginTop: "16px",
    paddingLeft: "18px",
    color: "#e5e7eb",
    lineHeight: 1.8,
  },
  featureItem: {
    marginBottom: "4px",
  },
  primaryButton: {
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "#1f2937",
    color: "#ffffff",
    border: "1px solid #475569",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "0.95rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  portalSection: {
    marginTop: "24px",
    padding: "20px",
    borderRadius: "14px",
    background: "#0f172a",
    border: "1px solid #334155",
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  portalTitle: {
    margin: 0,
    fontSize: "1.15rem",
  },
  portalText: {
    marginTop: "8px",
    marginBottom: 0,
    color: "#cbd5e1",
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
};
