import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

export default function Billing() {
  const { token } = useAuth();

  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");

  async function loadBilling() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/api/billing/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load billing");
      }

      setBilling(data);
    } catch (err) {
      setError(err.message || "Failed to load billing");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadBilling();
    }
  }, [token]);

  async function startCheckout(plan) {
    try {
      setActionLoading(plan);
      setError("");

      const response = await fetch(`${API_BASE}/api/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan })
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data?.error || "Failed to start checkout");
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err.message || "Checkout failed");
    } finally {
      setActionLoading("");
    }
  }

  async function openPortal() {
    try {
      setActionLoading("portal");
      setError("");

      const response = await fetch(`${API_BASE}/api/billing/portal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data?.error || "Failed to open billing portal");
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err.message || "Billing portal failed");
    } finally {
      setActionLoading("");
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-[28px] border border-[#d8dde6] bg-gradient-to-r from-[#0176D3] to-[#0b5cab] p-8 text-white shadow-sm">
          <div className="text-xs uppercase tracking-[0.22em] text-blue-100">
            Billing
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Subscription & Access</h1>
          <p className="mt-3 max-w-3xl text-sm text-blue-50">
            Upgrade your firm to unlock full VoterSpheres campaign operations.
          </p>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {loading ? (
            <div className="text-sm text-slate-500">Loading billing status...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Firm</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">
                  {billing?.firm?.name || "Unknown"}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Current Plan</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">
                  {billing?.firm?.plan_tier || "trial"}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Subscription Status</div>
                <div className="mt-2 text-xl font-semibold text-slate-900">
                  {billing?.firm?.stripe_subscription_status || "not subscribed"}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Trial</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">$0</div>
            <div className="mt-3 text-sm text-slate-500">
              Basic access, evaluation mode, limited capability.
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>Dashboard access</li>
              <li>Campaign pipeline view</li>
              <li>Limited workspace evaluation</li>
            </ul>
          </div>

          <div className="rounded-3xl border-2 border-[#0176D3] bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Pro</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">Paid</div>
            <div className="mt-3 text-sm text-slate-500">
              Full campaign operations for firms and operators.
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>Command center</li>
              <li>MailOps</li>
              <li>Vendor management</li>
              <li>Alerts + activity timeline</li>
            </ul>
            <button
              type="button"
              onClick={() => startCheckout("pro")}
              disabled={actionLoading === "pro"}
              className="mt-5 w-full rounded-2xl bg-[#0176D3] px-4 py-3 text-sm font-semibold text-white"
            >
              {actionLoading === "pro" ? "Starting..." : "Upgrade to Pro"}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Enterprise</div>
            <div className="mt-2 text-3xl font-semibold text-slate-900">Custom</div>
            <div className="mt-3 text-sm text-slate-500">
              Advanced deployment and higher-touch support.
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>Enterprise access control</li>
              <li>Advanced billing support</li>
              <li>Expanded deployment options</li>
            </ul>
            <button
              type="button"
              onClick={() => startCheckout("enterprise")}
              disabled={actionLoading === "enterprise"}
              className="mt-5 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              {actionLoading === "enterprise" ? "Starting..." : "Request Enterprise"}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={openPortal}
            disabled={actionLoading === "portal"}
            className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
          >
            {actionLoading === "portal" ? "Opening..." : "Open Billing Portal"}
          </button>
        </section>
      </div>
    </div>
  );
}
