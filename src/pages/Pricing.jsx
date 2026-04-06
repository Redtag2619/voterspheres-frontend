import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBillingConfig,
  createCheckoutSession,
  createPortalSession
} from "../api/billing";
import { useAuth } from "../context/AuthContext";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const PLAN_META = {
  starter: {
    key: "starter",
    name: "Starter",
    price: "$99",
    period: "/mo",
    description:
      "Professional entry point for campaigns and firms that need a modern operating workspace.",
    features: [
      "Core campaign workspace",
      "Candidate and vendor tracking",
      "Basic dashboard intelligence",
      "Campaign operations foundation"
    ]
  },
  pro: {
    key: "pro",
    name: "Pro",
    price: "$149",
    period: "/mo",
    description:
      "For active campaigns that need stronger execution visibility, intelligence, and planning tools.",
    features: [
      "Everything in Starter",
      "Forecast access",
      "Expanded intelligence views",
      "Enhanced campaign operations"
    ]
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    price: "$499",
    period: "/mo",
    description:
      "Full operating system for live campaign command, intelligence fusion, and executive control.",
    features: [
      "Everything in Pro",
      "AI War Room",
      "Command Center",
      "Live demo and executive workflows",
      "Enterprise-scale operating access"
    ]
  }
};

function PlanCard({
  plan,
  currentPlan,
  billingTestMode,
  loadingKey,
  onChoose
}) {
  const isCurrent = String(currentPlan || "").toLowerCase() === plan.key;

  return (
    <div className="vs-card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "flex-start"
        }}
      >
        <div>
          <div className="vs-eyebrow" style={{ marginTop: 0 }}>{plan.name}</div>
          <div className="vs-title" style={{ marginTop: "0.75rem", fontSize: "2.5rem" }}>
            {plan.price}
            <span
              style={{
                marginLeft: "0.35rem",
                fontSize: "1rem",
                fontWeight: 500,
                color: "var(--vs-text-muted)"
              }}
            >
              {plan.period}
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gap: "0.5rem", justifyItems: "end" }}>
          {billingTestMode ? <Badge tone="demo">Demo checkout</Badge> : null}
          {isCurrent ? <Badge tone="active">Current plan</Badge> : null}
        </div>
      </div>

      <p className="vs-description" style={{ maxWidth: "100%", marginTop: "1rem" }}>
        {plan.description}
      </p>

      <div className="vs-stack" style={{ marginTop: "1.5rem" }}>
        {plan.features.map((feature) => (
          <div key={feature} style={{ fontSize: "0.92rem", color: "var(--vs-text)" }}>
            • {feature}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChoose(plan)}
        disabled={loadingKey === plan.key}
        className="vs-button vs-button-primary"
        style={{ width: "100%", marginTop: "2rem" }}
      >
        {loadingKey === plan.key
          ? billingTestMode
            ? "Starting demo..."
            : "Redirecting..."
          : isCurrent
          ? "Manage Current Plan"
          : billingTestMode
          ? `Start ${plan.name} Demo`
          : `Choose ${plan.name}`}
      </button>
    </div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingKey, setLoadingKey] = useState("");
  const [error, setError] = useState("");

  const currentPlan =
    user?.plan_tier || user?.planTier || "starter";

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
            "Failed to load billing configuration"
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

  const plans = useMemo(() => {
    return ["starter", "pro", "enterprise"].map((key) => ({
      ...PLAN_META[key],
      priceId: config?.prices?.[key] || key
    }));
  }, [config]);

  async function handleChoosePlan(plan) {
    try {
      setLoadingKey(plan.key);
      setError("");

      if (String(currentPlan || "").toLowerCase() === plan.key) {
        const portal = await createPortalSession();

        if (portal?.url) {
          window.location.href = portal.url;
          return;
        }

        navigate("/billing");
        return;
      }

      const checkout = await createCheckoutSession({
        priceId: plan.priceId
      });

      if (checkout?.url) {
        window.location.href = checkout.url;
        return;
      }

      throw new Error("Checkout session did not return a URL");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Pricing checkout failed"
      );
    } finally {
      setLoadingKey("");
    }
  }

  const billingTestMode = Boolean(config?.billing_test_mode);

  return (
    <PageShell
      eyebrow="VoterSpheres Pricing"
      title="Choose the operating mode that fits your campaign."
      description="Upgrade access to unlock deeper intelligence, executive workflows, and the full VoterSpheres operating system."
      demo={billingTestMode}
      demoText="Demo checkout is active. Plan selection will simulate checkout locally and route you through the billing success flow without using Stripe."
    >
      {error ? (
        <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>
          {error}
        </div>
      ) : null}

      <SectionCard
        title="Subscription Plans"
        subtitle="Professional pricing aligned with your Stripe plans."
        right={<Badge tone="active">Current plan: {currentPlan}</Badge>}
      >
        {loadingConfig ? (
          <EmptyState text="Loading pricing plans..." />
        ) : (
          <div className="vs-grid-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.key}
                plan={plan}
                currentPlan={currentPlan}
                billingTestMode={billingTestMode}
                loadingKey={loadingKey}
                onChoose={handleChoosePlan}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  );
}
