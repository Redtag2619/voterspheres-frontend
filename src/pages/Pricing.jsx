import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getBillingConfig,
  createCheckoutSession,
  createPortalSession
} from "../api/billing";
import { useAuth } from "../context/AuthContext";

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

function Badge({ children, tone = "default" }) {
  const classes =
    tone === "demo"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      {children}
    </span>
  );
}

function PlanCard({
  plan,
  currentPlan,
  billingTestMode,
  loadingKey,
  onChoose
}) {
  const isCurrent = String(currentPlan || "").toLowerCase() === plan.key;

  return (
    <div
      className={`rounded-3xl border bg-white p-6 shadow-sm ${
        plan.key === "enterprise"
          ? "border-[#0176D3]/30"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[#0176D3]">
            {plan.name}
          </div>
          <h2 className="mt-3 text-4xl font-semibold text-slate-900">
            {plan.price}
            <span className="ml-1 text-lg font-medium text-slate-500">
              {plan.period}
            </span>
          </h2>
        </div>

        <div className="flex flex-col items-end gap-2">
          {billingTestMode ? <Badge tone="demo">Demo checkout</Badge> : null}
          {isCurrent ? <Badge tone="active">Current plan</Badge> : null}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{plan.description}</p>

      <div className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <div key={feature} className="text-sm text-slate-700">
            • {feature}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onChoose(plan)}
        disabled={loadingKey === plan.key}
        className="mt-8 w-full rounded-2xl bg-[#0176D3] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
              VoterSpheres Pricing
            </div>

            {billingTestMode ? <Badge tone="demo">Demo checkout enabled</Badge> : null}
            <Badge tone="active">Current plan: {currentPlan}</Badge>
          </div>

          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Choose the operating mode that fits your campaign.
          </h1>

          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Upgrade access to unlock deeper intelligence, executive workflows, and the full VoterSpheres operating system.
          </p>

          {billingTestMode ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Demo checkout is active. Plan selection will simulate checkout locally and route you through the billing success flow without using Stripe.
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {loadingConfig
            ? ["starter", "pro", "enterprise"].map((key) => (
                <div
                  key={key}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="h-6 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="mt-4 h-10 w-32 animate-pulse rounded bg-slate-100" />
                  <div className="mt-6 space-y-3">
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                    <div className="h-4 animate-pulse rounded bg-slate-100" />
                  </div>
                  <div className="mt-8 h-12 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              ))
            : plans.map((plan) => (
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
      </div>
    </div>
  );
}
