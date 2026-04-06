import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getBillingConfig,
  getBillingDebug,
  createCheckoutSession,
  createPortalSession
} from "../api/billing";
import { useAuth } from "../context/AuthContext";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function formatPlan(plan) {
  const value = String(plan || "starter").toLowerCase();
  if (value === "enterprise") return "Enterprise";
  if (value === "pro") return "Pro";
  return "Starter";
}

function BillingInfoCard({ title, value, subtitle }) {
  return (
    <div className="vs-card-muted">
      <div className="vs-stat-label">{title}</div>
      <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--vs-text)" }}>
        {value}
      </div>
      {subtitle ? (
        <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "var(--vs-text-muted)" }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

const PLAN_META = {
  starter: {
    key: "starter",
    name: "Starter",
    price: "$99/mo",
    description: "Professional entry point for campaign operations.",
    priceIdFallback: "starter"
  },
  pro: {
    key: "pro",
    name: "Pro",
    price: "$149/mo",
    description: "Expanded intelligence and execution visibility.",
    priceIdFallback: "pro"
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    price: "$499/mo",
    description: "Full campaign operating system and executive control.",
    priceIdFallback: "enterprise"
  }
};

export default function Billing() {
  const location = useLocation();
  const { user, firmId, isAuthenticated, loading: authLoading } = useAuth();

  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState("");
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState("");

  const [debugData, setDebugData] = useState(null);
  const [loadingDebug, setLoadingDebug] = useState(false);
  const [debugError, setDebugError] = useState("");

  const params = new URLSearchParams(location.search);
  const isTestModeFromUrl = params.get("test_mode") === "1";
  const checkoutSuccess = params.get("checkout") === "success";
  const planFromUrl = params.get("plan");

  useEffect(() => {
    if (isTestModeFromUrl) {
      localStorage.setItem("vs_demo_mode", "1");
    }
  }, [isTestModeFromUrl]);

  useEffect(() => {
    let active = true;

    async function loadConfig() {
      try {
        setLoadingConfig(true);
        setError("");
        const data = await getBillingConfig();
        if (!active) return;
        setConfig(data);
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load billing config"
        );
      } finally {
        if (active) setLoadingConfig(false);
      }
    }

    loadConfig();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDebug() {
      if (!isAuthenticated) return;

      try {
        setLoadingDebug(true);
        setDebugError("");
        const data = await getBillingDebug();
        if (!active) return;
        setDebugData(data);
      } catch (err) {
        if (!active) return;
        setDebugError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load billing debug info"
        );
      } finally {
        if (active) setLoadingDebug(false);
      }
    }

    loadDebug();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const currentPlan =
    debugData?.plan_tier || user?.plan_tier || user?.planTier || "starter";

  const demoModeActive =
    Boolean(config?.billing_test_mode) ||
    localStorage.getItem("vs_demo_mode") === "1";

  const plans = useMemo(() => {
    return ["starter", "pro", "enterprise"].map((key) => ({
      ...PLAN_META[key],
      priceId: config?.prices?.[key] || PLAN_META[key].priceIdFallback
    }));
  }, [config]);

  async function refreshDebug() {
    try {
      setLoadingDebug(true);
      setDebugError("");
      const data = await getBillingDebug();
      setDebugData(data);
    } catch (err) {
      setDebugError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to refresh billing debug"
      );
    } finally {
      setLoadingDebug(false);
    }
  }

  async function handleCheckout(priceId, planKey) {
    try {
      setLoadingCheckout(planKey);
      setError("");

      const result = await createCheckoutSession({ priceId });

      if (result?.url) {
        window.location.href = result.url;
        return;
      }

      throw new Error("Checkout session did not return a URL");
    } catch (err) {
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

      const result = await createPortalSession();

      if (result?.url) {
        window.location.href = result.url;
        return;
      }

      throw new Error("Portal session did not return a URL");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to create portal session"
      );
    } finally {
      setLoadingPortal(false);
    }
  }

  if (authLoading) {
    return (
      <PageShell
        eyebrow="Billing & Subscription"
        title="Billing Overview"
        description="Manage your subscription, billing status, and plan access."
      >
        <EmptyState text="Loading billing..." />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Billing & Subscription"
      title="Billing Overview"
      description="Manage your subscription, billing status, and plan access."
      demo={demoModeActive}
      demoText="Demo mode is active. No real Stripe checkout occurs in this environment."
    >
      {checkoutSuccess ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#bbf7d0", background: "#ecfdf5", color: "#047857" }}
        >
          {demoModeActive
            ? `Demo checkout successful. Your plan has been upgraded to ${formatPlan(planFromUrl || currentPlan)}.`
            : "Checkout successful. Your subscription has been activated."}
        </div>
      ) : null}

      {error ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}
        >
          {error}
        </div>
      ) : null}

      <div className="vs-grid-4">
        <BillingInfoCard
          title="Current Plan"
          value={formatPlan(currentPlan)}
          subtitle="Active plan on your firm account"
        />
        <BillingInfoCard
          title="Firm ID"
          value={firmId || debugData?.firm_id || "N/A"}
          subtitle="Current authenticated firm"
        />
        <BillingInfoCard
          title="Billing Mode"
          value={demoModeActive ? "Demo" : "Live"}
          subtitle={demoModeActive ? "Stripe-free testing enabled" : "Stripe-backed checkout"}
        />
        <BillingInfoCard
          title="Status"
          value={debugData?.status || "active"}
          subtitle="Current subscription state"
        />
      </div>

      <SectionCard
        title="Plan Options"
        subtitle="Choose a plan or manage your current subscription."
        right={<Badge tone="active">Current plan: {formatPlan(currentPlan)}</Badge>}
      >
        {loadingConfig ? (
          <EmptyState text="Loading plan options..." />
        ) : (
          <div className="vs-grid-3">
            {plans.map((plan) => {
              const isCurrent = String(currentPlan).toLowerCase() === plan.key;

              return (
                <div key={plan.key} className="vs-card-muted">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
                    <div>
                      <div className="vs-eyebrow" style={{ marginTop: 0 }}>{plan.name}</div>
                      <div style={{ marginTop: "0.6rem", fontSize: "2rem", fontWeight: 700, color: "var(--vs-text)" }}>
                        {plan.price}
                      </div>
                    </div>
                    {isCurrent ? <Badge tone="active">Current</Badge> : null}
                  </div>

                  <div
                    style={{
                      marginTop: "0.85rem",
                      fontSize: "0.92rem",
                      lineHeight: 1.7,
                      color: "var(--vs-text-muted)"
                    }}
                  >
                    {plan.description}
                  </div>

                  <button
                    type="button"
                    className={`vs-button ${isCurrent ? "vs-button-secondary" : "vs-button-primary"}`}
                    style={{ width: "100%", marginTop: "1.25rem" }}
                    disabled={loadingCheckout === plan.key}
                    onClick={() => handleCheckout(plan.priceId, plan.key)}
                  >
                    {loadingCheckout === plan.key
                      ? "Starting..."
                      : isCurrent
                      ? "Re-run Checkout"
                      : `Choose ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Account Actions"
        subtitle="Refresh billing state or open the billing portal."
      >
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={refreshDebug}
            disabled={loadingDebug}
          >
            {loadingDebug ? "Refreshing..." : "Refresh Billing Debug"}
          </button>

          <button
            type="button"
            className="vs-button vs-button-primary"
            onClick={handlePortal}
            disabled={loadingPortal}
          >
            {loadingPortal ? "Opening..." : "Open Billing Portal"}
          </button>
        </div>

        {debugError ? (
          <div
            className="vs-banner"
            style={{
              marginTop: "1rem",
              borderColor: "#fecaca",
              background: "#fef2f2",
              color: "#b91c1c"
            }}
          >
            {debugError}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="Billing Debug" subtitle="Current backend billing record for your firm.">
        {loadingDebug ? (
          <EmptyState text="Loading billing debug..." />
        ) : (
          <pre
            style={{
              overflow: "auto",
              borderRadius: "1rem",
              background: "#0f172a",
              padding: "1rem",
              color: "white",
              fontSize: "0.78rem"
            }}
          >
{JSON.stringify(debugData || {}, null, 2)}
          </pre>
        )}
      </SectionCard>
    </PageShell>
  );
}
