import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Badge from "../components/ui/Badge";
import SectionCard from "../components/ui/SectionCard";
import EmptyState from "../components/ui/EmptyState";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext.jsx";

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: "$99/mo",
    description: "Core campaign operating system for smaller teams.",
    features: [
      "Executive dashboard",
      "Core workspaces",
      "Candidate and vendor visibility",
      "Basic MailOps tracking",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "$149/mo",
    description: "Advanced execution, reporting, and intelligence workflows.",
    features: [
      "Everything in Starter",
      "Scheduled reports",
      "Command Center workflows",
      "AI War Room access",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "$499/mo",
    description: "Premium multi-workstream control layer for serious firms.",
    features: [
      "Everything in Pro",
      "Unlimited scheduled reports",
      "Enterprise workflow support",
      "Full-platform operations visibility",
    ],
  },
];

function normalizePlan(value = "starter") {
  const plan = String(value || "starter").toLowerCase();
  if (plan === "enterprise") return "enterprise";
  if (plan === "pro") return "pro";
  return "starter";
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPriceId(config = {}, planKey = "") {
  return (
    config?.prices?.[planKey] ||
    config?.priceIds?.[planKey] ||
    config?.[`price_${planKey}`] ||
    config?.[`stripe_price_${planKey}`] ||
    config?.[planKey] ||
    ""
  );
}

function statusTone(status = "") {
  const value = String(status || "").toLowerCase();

  if (value === "active" || value === "trialing") return "active";
  if (value === "past_due" || value === "unpaid") return "danger";
  if (value === "canceled" || value === "inactive") return "default";

  return "demo";
}

export default function Billing() {
  const { refreshMe } = useAuth();

  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState("");
  const [portalBusy, setPortalBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState(null);
  const [debug, setDebug] = useState(null);

  async function loadBilling() {
    try {
      setLoading(true);
      setError("");

      const [billingConfig, billingDebug] = await Promise.all([
        api.billingConfig(),
        api.billingDebug(),
      ]);

      setConfig(billingConfig || {});
      setDebug(billingDebug || {});

      await refreshMe?.();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to load billing information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBilling();
  }, []);

  const firm = debug?.firm || debug || {};
  const currentPlan = normalizePlan(
    firm?.plan_tier ||
      firm?.planTier ||
      debug?.auth?.planTier ||
      debug?.plan_tier ||
      "starter"
  );

  const subscriptionStatus =
    firm?.subscription_status || firm?.status || debug?.status || "active";

  const currentPlanDetails = useMemo(
    () => PLANS.find((plan) => plan.key === currentPlan) || PLANS[0],
    [currentPlan]
  );

  async function startCheckout(plan) {
    try {
      setBusyPlan(plan.key);
      setError("");
      setMessage("");

      const priceId = getPriceId(config, plan.key);

      if (!priceId) {
        throw new Error(`Missing Stripe price ID for ${plan.name}.`);
      }

      const origin = window.location.origin;
      const successUrl = `${origin}/dashboard?checkout=success&plan=${encodeURIComponent(
        plan.key
      )}`;
      const cancelUrl = `${origin}/billing?checkout=cancelled`;

      const response = await api.createCheckoutSession({
        priceId,
        plan: plan.key,
        successUrl,
        cancelUrl,
      });

      const url =
        response?.url ||
        response?.checkout_url ||
        response?.session?.url ||
        "";

      if (!url) {
        throw new Error("Checkout session did not return a URL.");
      }

      window.location.href = url;
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to start checkout."
      );
    } finally {
      setBusyPlan("");
    }
  }

  async function openPortal() {
    try {
      setPortalBusy(true);
      setError("");
      setMessage("");

      const origin = window.location.origin;

      const response = await api.createPortalSession({
        returnUrl: `${origin}/billing`,
      });

      const url =
        response?.url ||
        response?.portal_url ||
        response?.session?.url ||
        "";

      if (!url) {
        throw new Error("Billing portal did not return a URL.");
      }

      window.location.href = url;
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to open billing portal."
      );
    } finally {
      setPortalBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="vs-page">
        <div className="vs-page-header">
          <div>
            <h1 className="vs-page-title">Billing</h1>
            <p className="vs-page-subtitle">Loading subscription details...</p>
          </div>
        </div>

        <EmptyState text="Loading billing center..." />
      </div>
    );
  }

  return (
    <div className="vs-page">
      <div className="vs-page-header">
        <div>
          <h1 className="vs-page-title">Billing Management Center</h1>
          <p className="vs-page-subtitle">
            Manage plan access, Stripe billing, subscription status, and upgrade
            paths for your firm.
          </p>
        </div>

        <div className="vs-inline-actions">
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={loadBilling}
          >
            Refresh
          </button>

          <button
            type="button"
            className="vs-button"
            onClick={openPortal}
            disabled={portalBusy}
          >
            {portalBusy ? "Opening..." : "Open Stripe Portal"}
          </button>
        </div>
      </div>

      {error ? (
        <div
          className="vs-banner"
          style={{
            borderColor: "#fecaca",
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      ) : null}

      {message ? (
        <div
          className="vs-banner"
          style={{
            borderColor: "#bbf7d0",
            background: "#f0fdf4",
            color: "#166534",
          }}
        >
          {message}
        </div>
      ) : null}

      <div className="vs-grid-2">
        <SectionCard
          title="Current Subscription"
          subtitle="Your active firm plan and Stripe subscription state."
          right={<Badge tone={statusTone(subscriptionStatus)}>{subscriptionStatus}</Badge>}
        >
          <div className="vs-stack">
            <div className="vs-card-muted">
              <div className="vs-stat-label">Current Plan</div>
              <div style={{ fontSize: 30, fontWeight: 900, marginTop: 6 }}>
                {currentPlanDetails.name}
              </div>
              <div style={{ color: "var(--vs-text-muted)", marginTop: 6 }}>
                {currentPlanDetails.price}
              </div>
            </div>

            <div className="vs-grid-2">
              <div className="vs-card-muted">
                <div className="vs-stat-label">Subscription Status</div>
                <div style={{ marginTop: 6, fontWeight: 800 }}>
                  {subscriptionStatus || "active"}
                </div>
              </div>

              <div className="vs-card-muted">
                <div className="vs-stat-label">Current Period Ends</div>
                <div style={{ marginTop: 6, fontWeight: 800 }}>
                  {formatDate(firm?.current_period_end)}
                </div>
              </div>
            </div>

            <div className="vs-card-muted">
              <div className="vs-stat-label">Firm</div>
              <div style={{ marginTop: 6, fontWeight: 800 }}>
                {firm?.firm_name || firm?.name || "Your Firm"}
              </div>
              <div style={{ marginTop: 5, color: "var(--vs-text-muted)" }}>
                Stripe Customer: {firm?.stripe_customer_id || "Not linked yet"}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Payment Health"
          subtitle="Keep the firm’s access in good standing."
          right={
            <Badge tone={statusTone(subscriptionStatus)}>
              {String(subscriptionStatus || "active").toUpperCase()}
            </Badge>
          }
        >
          <div className="vs-stack">
            {String(subscriptionStatus).toLowerCase() === "past_due" ? (
              <div
                className="vs-banner"
                style={{
                  borderColor: "#fecaca",
                  background: "#fef2f2",
                  color: "#b91c1c",
                }}
              >
                Payment is past due. Open the Stripe portal to update payment
                details.
              </div>
            ) : (
              <div
                className="vs-banner"
                style={{
                  borderColor: "#bbf7d0",
                  background: "#f0fdf4",
                  color: "#166534",
                }}
              >
                Billing is active. Your platform access is in good standing.
              </div>
            )}

            <button
              type="button"
              className="vs-button"
              onClick={openPortal}
              disabled={portalBusy}
            >
              {portalBusy ? "Opening Portal..." : "Manage Payment Method"}
            </button>

            <div style={{ color: "var(--vs-text-muted)", fontSize: 13, lineHeight: 1.6 }}>
              Invoices, payment methods, cancellation, and subscription changes
              are handled securely through Stripe.
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Change Plan"
        subtitle="Upgrade or manage firm access. Checkout returns to VoterSpheres and refreshes access automatically."
      >
        <div className="vs-grid-3">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === currentPlan;
            const isUpgrade =
              PLANS.findIndex((item) => item.key === plan.key) >
              PLANS.findIndex((item) => item.key === currentPlan);

            return (
              <div
                key={plan.key}
                className="vs-card"
                style={{
                  padding: 18,
                  display: "grid",
                  gap: 12,
                  borderColor: isCurrent
                    ? "rgba(34,197,94,0.45)"
                    : "var(--vs-border)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>{plan.name}</div>
                    <div style={{ marginTop: 4, color: "var(--vs-text-muted)" }}>
                      {plan.price}
                    </div>
                  </div>

                  {isCurrent ? <Badge tone="active">Current</Badge> : null}
                  {!isCurrent && isUpgrade ? <Badge tone="accent">Upgrade</Badge> : null}
                </div>

                <div style={{ color: "var(--vs-text-muted)", fontSize: 13, lineHeight: 1.6 }}>
                  {plan.description}
                </div>

                <div className="vs-stack">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "10px 1fr",
                        gap: 10,
                        alignItems: "start",
                        color: "var(--vs-text-muted)",
                        fontSize: 12,
                        lineHeight: 1.6,
                      }}
                    >
                      <span className="vs-live-dot-success" style={{ marginTop: 6 }} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={openPortal}
                  >
                    Manage Current Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    className="vs-button"
                    onClick={() => startCheckout(plan)}
                    disabled={busyPlan === plan.key}
                  >
                    {busyPlan === plan.key
                      ? "Opening checkout..."
                      : isUpgrade
                        ? `Upgrade to ${plan.name}`
                        : `Switch to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Invoice History"
        subtitle="Stripe manages invoice records and receipts."
        right={
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={openPortal}
            disabled={portalBusy}
          >
            View in Stripe
          </button>
        }
      >
        <EmptyState text="Open the Stripe portal to view receipts, invoices, payment methods, and subscription history." />
      </SectionCard>

      <SectionCard
        title="Enterprise Support"
        subtitle="Need procurement, onboarding, multi-firm operations, or a white-glove rollout?"
      >
        <div className="vs-inline-actions">
          <Link to="/pricing?upgrade=enterprise" className="vs-button">
            Contact Enterprise Sales
          </Link>

          <Link to="/pricing?upgrade=enterprise" className="vs-button vs-button-secondary">
            Review Enterprise Plan   
          </Link>
        </div>
      </SectionCard>
    </div>
  );
}
