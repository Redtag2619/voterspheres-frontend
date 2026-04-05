import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { billingApi } from "../services/api";
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
  const { user } = useAuth();

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(location.search);

  const isTestMode = params.get("test_mode") === "1";
  const checkoutSuccess = params.get("checkout") === "success";
  const planFromUrl = params.get("plan");

  const currentPlan = useMemo(() => {
    return user?.plan_tier || user?.planTier || "starter";
  }, [user]);

  useEffect(() => {
    let active = true;

    async function loadBilling() {
      try {
        const data = await billingApi.getStatus();
        if (active) setBilling(data);
      } catch {
        if (active) setBilling(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBilling();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* HEADER */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
              Billing & Subscription
            </div>

            {isTestMode && <Badge tone="demo">Demo Mode</Badge>}
          </div>

          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Billing Overview
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage your subscription, billing status, and plan access.
          </p>
        </section>

        {/* SUCCESS BANNER */}
        {checkoutSuccess && (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <div className="font-semibold">
              {isTestMode
                ? "Demo checkout successful"
                : "Checkout successful"}
            </div>

            <div className="mt-1 text-sm">
              {isTestMode
                ? `Your plan has been upgraded to ${
                    planFromUrl || currentPlan
                  } (simulated).`
                : "Your subscription has been activated."}
            </div>
          </section>
        )}

        {/* DEMO MODE INFO */}
        {isTestMode && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
            <div className="font-semibold">Demo Mode Active</div>
            <div className="mt-1 text-sm">
              This environment is running in test mode. No real Stripe checkout occurred.
              Plan changes are simulated for demo purposes.
            </div>
          </section>
        )}

        {/* PLAN CARD */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500">Current Plan</div>
          <div className="mt-2 text-2xl font-semibold text-slate-900 capitalize">
            {currentPlan}
          </div>

          <div className="mt-3 flex gap-3">
            {currentPlan === "enterprise" && <Badge tone="active">Full Access</Badge>}
            {currentPlan === "pro" && <Badge tone="active">Pro Access</Badge>}
            {currentPlan === "starter" && <Badge>Starter Access</Badge>}
          </div>
        </section>

        {/* BILLING DEBUG */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-500">System Status</div>

          {loading ? (
            <div className="mt-2 text-sm text-slate-500">Loading billing status...</div>
          ) : (
            <pre className="mt-3 overflow-auto rounded-xl bg-slate-900 p-4 text-xs text-white">
{JSON.stringify(billing || {}, null, 2)}
            </pre>
          )}
        </section>

      </div>
    </div>
  );
}
