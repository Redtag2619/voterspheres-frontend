import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBillingConfig,
  createCheckoutSession
} from "../api/billing";
import { useAuth } from "../context/AuthContext.jsx";

const PLAN_META = {
  starter: {
    key: "starter",
    name: "Starter",
    price: "$99",
    period: "/mo",
    description: "Professional entry point for campaign operators who need a clean command workspace.",
    features: [
      "Executive dashboard access",
      "Candidate and vendor management",
      "Map and forecast visibility",
      "Core campaign workspace"
    ]
  },
  pro: {
    key: "pro",
    name: "Pro",
    price: "$149",
    period: "/mo",
    description: "For active firms and campaigns that need stronger intelligence, finance, and operations visibility.",
    features: [
      "Everything in Starter",
      "Fundraising and rankings access",
      "Expanded intelligence workflows",
      "Deeper operational monitoring"
    ]
  },
  enterprise: {
    key: "enterprise",
    name: "Enterprise",
    price: "$499",
    period: "/mo",
    description: "Full operating system for command center execution, war room intelligence, and client-grade demos.",
    features: [
      "Everything in Pro",
      "AI War Room",
      "Command Center",
      "Billing and enterprise workflows",
      "Premium demo environment"
    ]
  }
};

function PlanCard({ plan, currentPlan, billingTestMode, loadingKey, onChoose }) {
  const isCurrent = String(currentPlan || "").toLowerCase() === plan.key;

  return (
    <div
      style={{
        border: "1px solid #273142",
        background: "linear-gradient(180deg, #121821 0%, #10161d 100%)",
        borderRadius: "22px",
        padding: "22px",
        boxShadow: "0 18px 40px rgba(0,0,0,0.34)",
        display: "grid",
        alignContent: "start"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
        <div>
          <div
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              color: "#f59e0b",
              fontWeight: 900
            }}
          >
            {plan.name}
          </div>

          <div
            style={{
              marginTop: "14px",
              fontSize: "42px",
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: "-0.03em"
            }}
          >
            {plan.price}
            <span style={{ marginLeft: "6px", fontSize: "16px", color: "#95a2b3", fontWeight: 600 }}>
              {plan.period}
            </span>
          </div>
        </div>

        <div className="vs-chip-row">
          {billingTestMode ? <span className="vs-badge vs-badge-demo">Demo checkout</span> : null}
          {isCurrent ? <span className="vs-badge vs-badge-active">Current</span> : null}
        </div>
      </div>

      <p style={{ marginTop: "16px", fontSize: "14px", lineHeight: 1.7, color: "#95a2b3" }}>
        {plan.description}
      </p>

      <div style={{ marginTop: "18px", display: "grid", gap: "10px" }}>
        {plan.features.map((feature) => (
          <div
            key={feature}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "14px",
              color: "#dbe3ec"
            }}
          >
            <span className="vs-live-dot-success" />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="vs-button vs-button-primary"
        style={{ marginTop: "22px", width: "100%" }}
        onClick={() => onChoose(plan)}
        disabled={loadingKey === plan.key}
      >
        {loadingKey === plan.key
          ? billingTestMode
            ? "Starting demo..."
            : "Redirecting..."
          : isCurrent
          ? "Current Plan"
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

  const currentPlan = user?.plan_tier || user?.planTier || "starter";

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

      const checkout = await createCheckoutSession({
        priceId: plan.priceId
      });

      if (checkout?.url) {
        window.location.href = checkout.url;
        return;
      }

      navigate("/billing");
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
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top right, rgba(245,158,11,0.08), transparent 22%), linear-gradient(180deg, #0b0f14 0%, #0e131a 100%)",
        color: "#eef2f7",
        padding: "24px"
      }}
    >
      <div style={{ maxWidth: "1320px", margin: "0 auto", display: "grid", gap: "18px" }}>
        <section
          style={{
            border: "1px solid #273142",
            background: "linear-gradient(180deg, #121821 0%, #10161d 100%)",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 18px 40px rgba(0,0,0,0.34)"
          }}
        >
          <div
            style={{
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.22em",
              color: "#f59e0b",
              fontWeight: 900
            }}
          >
            VoterSpheres Pricing
          </div>

          <h1
            style={{
              marginTop: "14px",
              fontSize: "44px",
              lineHeight: 1.02,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              maxWidth: "780px"
            }}
          >
            Premium campaign intelligence plans built for serious operators.
          </h1>

          <p
            style={{
              marginTop: "14px",
              maxWidth: "820px",
              fontSize: "15px",
              lineHeight: 1.75,
              color: "#95a2b3"
            }}
          >
            Choose the operating tier that fits your campaign or consulting firm. From polished
            command visibility to enterprise-grade intelligence workflows, every plan is built to
            look client-ready and perform like a real operating system.
          </p>

          <div className="vs-terminal-strip">
            <div className="vs-terminal-ticker">
              <span className="vs-live-dot-success" />
              <strong>Starter</strong>
              <span>$99</span>
            </div>
            <div className="vs-terminal-ticker">
              <span className="vs-live-dot-warning" />
              <strong>Pro</strong>
              <span>$149</span>
            </div>
            <div className="vs-terminal-ticker">
              <span className="vs-live-dot" />
              <strong>Enterprise</strong>
              <span>$499</span>
            </div>
          </div>

          {billingTestMode ? (
            <div className="vs-banner" style={{ color: "#fbbf24" }}>
              Demo checkout is active. Plan selection can simulate checkout without hitting Stripe.
            </div>
          ) : null}

          {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
        </section>

        {loadingConfig ? (
          <div className="vs-loading-screen" style={{ minHeight: "220px" }}>
            <div className="vs-loading-card">Loading plans...</div>
          </div>
        ) : (
          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "18px"
            }}
          >
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
          </section>
        )}

        <section
          style={{
            border: "1px solid #273142",
            background: "linear-gradient(180deg, #121821 0%, #10161d 100%)",
            borderRadius: "24px",
            padding: "22px",
            boxShadow: "0 18px 40px rgba(0,0,0,0.34)"
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "14px",
              flexWrap: "wrap",
              alignItems: "center"
            }}
          >
            <div>
              <div className="vs-section-title">Need access now?</div>
              <div className="vs-section-subtitle">
                Create your account and return here anytime to upgrade or manage billing.
              </div>
            </div>

            <div className="vs-inline-actions">
              <button
                type="button"
                className="vs-button vs-button-secondary"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </button>
              <button
                type="button"
                className="vs-button vs-button-primary"
                onClick={() => navigate("/signup")}
              >
                Create Account
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
