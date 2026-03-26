import { Navigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

const PLAN_ORDER = {
  trial: 1,
  pro: 2,
  enterprise: 3
};

function normalizePlan(plan) {
  const value = String(plan || "trial").toLowerCase();
  return PLAN_ORDER[value] ? value : "trial";
}

export default function PlanProtectedRoute({ minPlan = "trial", children }) {
  const { token, isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [firmPlan, setFirmPlan] = useState("trial");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBilling() {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/billing/status`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const text = await response.text();
        const data = text ? JSON.parse(text) : {};

        if (!response.ok) {
          throw new Error(data?.error || "Failed to load billing status");
        }

        setFirmPlan(normalizePlan(data?.firm?.plan_tier));
      } catch (err) {
        setError(err.message || "Failed to load billing");
      } finally {
        setLoading(false);
      }
    }

    loadBilling();
  }, [isAuthenticated, token]);

  const allowed = useMemo(() => {
    return PLAN_ORDER[normalizePlan(firmPlan)] >= PLAN_ORDER[normalizePlan(minPlan)];
  }, [firmPlan, minPlan]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f3f6f9] p-8 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="text-sm text-slate-500">Checking subscription...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f3f6f9] p-8 text-slate-900">
        <div className="mx-auto max-w-3xl rounded-3xl border border-rose-200 bg-white p-10 text-center shadow-sm">
          <div className="text-lg font-semibold text-rose-700">Subscription Check Failed</div>
          <div className="mt-2 text-sm text-slate-500">{error}</div>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/billing" replace />;
  }

  return children;
}
