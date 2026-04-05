import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, billingApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { hasPlan, normalizePlan } from "../lib/plan";
import { getPriceIdForPlan } from "../lib/stripePlans";

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: "$0",
    period: "/mo",
    description: "Core campaign workspace for early testing and lightweight use.",
    features: [
      "Dashboard access",
      "Candidate and vendor search",
      "Basic campaign workspace",
      "Starter intelligence access"
    ]
  },
  {
    key: "pro",
    name: "Pro",
    price: "$99",
    period: "/mo",
    description: "For active campaigns that need stronger intelligence and execution tools.",
    features: [
      "Everything in Starter",
      "Forecast tools",
      "MailOps dashboard",
      "Expanded workspace and alerts"
    ]
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "$299",
    period: "/mo",
    description: "Full operating system for live campaign command, intelligence, and execution.",
    features: [
      "Everything in Pro",
      "AI War Room",
      "Command Center",
      "Live fused intelligence",
      "Priority workflow support"
    ]
  }
];

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
  loadingKey,
  onSelect,
  billingTestMode
}) {
  const normalizedCurrent = normalizePlan(currentPlan);
  const isCurrent = hasPlan(normalizedCurrent, plan.key) && normalizedCurrent === plan.key;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[#0176D3]">
            {plan.name}
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">{plan.price}<span className="text-base font-medium text-slate-500">{plan.period}</span></h2>
        </div>

        <div className="flex flex-col items-end gap-2">
          {billingTestMode ? <Badge tone="demo">Demo checkout</Badge> : null}
          {isCurrent ? <Badge tone="active">Current plan</Badge> : null}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-600">{plan.description}</p>

      <div className="mt-5 space-y-2">
        {plan.features.map((feature) => (
          <div key={feature} className="text-sm text-slate-700">
            • {feature}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => onSelect(plan.key)}
        disabled={loadingKey === plan.key}
        className="mt-6 w-full rounded-2xl bg-[#0176D3] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loadingKey === plan.key
          ? billingTestMode
            ? "Starting demo..."
            : "Redirecting..."
          : isCurrent
          ? "Manage plan"
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

  const [loadingKey, setLoadingKey] = useState("");
  const [error, setError] = useState("");
  const [billingConfig, setBillingConfig] = useState({
    billing_test_mode: false,
    prices: {}
  });
  const [configLoaded, setConfigLoaded] = useState(false);

  const currentPlan = useMemo(
    () => normalizePlan(user?.plan_tier || user?.planTier || "starter"),
    [user]
  );

  useEffect(() => {
    let active = true;

    async function loadBillingConfig() {
      try {
        const response = await billingApi.config();
        if (!active) return;

        setBillingConfig({
          billing_test_mode: Boolean(response?.billing_test_mode),
          prices: response?.prices || {}
        });
      } catch {
        if (!active) return;

        setBillingConfig({
          billing_test_mode: false,
          prices: {}
        });
      } finally {
        if (active) setConfigLoaded(true);
      }
    }

    loadBillingConfig();

    return () => {
      active = false;
    };
  }, []);

  async function handleSelectPlan(planKey) {
    try {
      setLoadingKey(planKey);
      setError("");

      if (normalizePlan(currentPlan) === planKey) {
        const portal = await billingApi.createPortalSession();
        if (portal?.url) {
          window.location.href = portal.url;
          return;
        }
        navigate("/billing");
        return;
      }

      const configuredPriceId =
        billingConfig?.prices?.[planKey] || getPriceIdForPlan(planKey);

      const checkout = await billingApi.createCheckoutSession({
        priceId: configuredPriceId || planKey
      });

      if (checkout?.url) {
        window.location.href = checkout.url;
        return;
      }

      throw new Error("Checkout session did not return a redirect URL");
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Pricing checkout failed");
    } finally {
      setLoadingKey("");
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
              VoterSpheres Pricing
            </div>

            {configLoaded && billingConfig.billing_test_mode ? (
              <Badge tone="demo">Demo checkout enabled</Badge>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Choose the operating mode that fits your campaign.
          </h1>

          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Upgrade access to unlock deeper intelligence, execution tools, and live campaign command features.
          </p>

          {configLoaded && billingConfig.billing_test_mode ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Demo checkout is active. Plan selection will simulate checkout locally and route you into the billing success flow without using Stripe.
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              currentPlan={currentPlan}
              loadingKey={loadingKey}
              onSelect={handleSelectPlan}
              billingTestMode={billingConfig.billing_test_mode}
            />
          ))}
        </section>
      </div>
    </div>
  );
}
