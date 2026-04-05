import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  getBillingConfig,
  getBillingDebug,
  createCheckoutSession,
  createPortalSession
} from "../api/billing";
import { useAuth } from "../context/AuthContext";

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
    async function loadConfig() {
      try {
        setLoadingConfig(true);
        setError("");
        const data = await getBillingConfig();
        setConfig(data);
      } catch (err) {
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
        description: "Essential tools for getting started with VoterSpheres.",
        priceId: config.prices.starter || "starter",
        features: [
          "Core campaign workspace",
          "Candidate and election tracking",
          "Basic team access"
        ]
      },
      {
        key: "pro",
        title: "Pro",
        subtitle: "For active campaign operations",
        description: "Advanced workflows and deeper campaign intelligence for growing teams.",
        priceId: config.prices.pro || "pro",
        features: [
          "Everything in Starter",
          "Expanded intelligence access",
          "Advanced campaign operations"
        ]
      },
      {
        key: "enterprise",
        title: "Enterprise",
        subtitle: "For full-scale organizations",
        description: "High-capacity access for firms, teams, and enterprise workflows.",
        priceId: config.prices.enterprise || "enterprise",
        features: [
          "Everything in Pro",
          "Enterprise-scale workflows",
          "Premium platform support"
        ]
      }
    ];
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

  async function handleCheckout(priceId) {
    try {
      setLoadingCheckout(priceId);
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

  const currentPlan =
    debugData?.plan_tier || user?.plan_tier || user?.planTier || "starter";

  const demoModeActive =
    Boolean(config?.billing_test_mode) || localStorage.getItem("vs_demo_mode") === "1";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          Loading billing...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
              Billing & Subscription
            </div>
            {demoModeActive ? <Badge tone="demo">Demo Mode</Badge> : null}
            <Badge tone="active">Current plan: {currentPlan}</Badge>
          </div>

          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Billing Overview
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your subscription, billing status, and plan access.
          </p>

          {checkoutSuccess ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {demoModeActive
                ? `Demo checkout successful. Your plan has been upgraded to ${planFromUrl || currentPlan}.`
                : "Checkout successful. Your subscription has been activated."}
            </div>
          ) : null}

          {demoModeActive ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Demo Mode is active. No real Stripe checkout occurs in this environment.
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.key} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-slate-900">{plan.title}</div>
                  <div className="text-sm text-slate-500">{plan.subtitle}</div>
                </div>
                {demoModeActive ? <Badge tone="demo">Demo checkout</Badge> : null}
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
                onClick={() => handleCheckout(plan.priceId)}
                disabled={loadingCheckout === plan.priceId}
                className="mt-6 w-full rounded-2xl bg-[#0176D3] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {loadingCheckout === plan.priceId ? "Starting..." : `Choose ${plan.title}`}
              </button>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold text-slate-900">Billing Debug</div>
              <div className="text-sm text-slate-500">
                Firm #{firmId || "N/A"} • Refresh after checkout to confirm plan changes.
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={refreshDebug}
                disabled={loadingDebug}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                {loadingDebug ? "Refreshing..." : "Refresh Debug"}
              </button>

              <button
                type="button"
                onClick={handlePortal}
                disabled={loadingPortal}
                className="rounded-xl bg-[#0176D3] px-4 py-2 text-sm font-medium text-white"
              >
                {loadingPortal ? "Opening..." : "Open Billing Portal"}
              </button>
            </div>
          </div>

          {debugError ? (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {debugError}
            </div>
          ) : null}

          <pre className="mt-4 overflow-auto rounded-2xl bg-slate-900 p-4 text-xs text-white">
{JSON.stringify(debugData || {}, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}
