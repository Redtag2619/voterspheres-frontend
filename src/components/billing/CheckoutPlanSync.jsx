import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { clearUpgradePrompt } from "../../lib/upgradePrompt.js";

function getCheckoutParams(search = "") {
  const params = new URLSearchParams(search);

  return {
    checkout: params.get("checkout") || "",
    plan: params.get("plan") || "",
    testMode: params.get("test_mode") || "",
  };
}

export default function CheckoutPlanSync() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, refreshMe } = useAuth();

  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function syncPlan() {
      const params = getCheckoutParams(location.search);

      if (params.checkout !== "success") return;
      if (!isAuthenticated) return;

      try {
        setSyncing(true);
        setMessage("Refreshing your upgraded plan...");

        await refreshMe?.();
        clearUpgradePrompt?.();

        if (!active) return;

        setMessage(
          params.plan
            ? `${params.plan.toUpperCase()} plan activated.`
            : "Plan activated."
        );

        const cleanPath = location.pathname || "/dashboard";

        window.setTimeout(() => {
          if (!active) return;
          navigate(cleanPath, { replace: true });
        }, 1600);
      } catch (error) {
        if (!active) return;

        setMessage(
          error?.response?.data?.error ||
            error?.message ||
            "Checkout succeeded. Refresh your page if your plan has not updated yet."
        );
      } finally {
        if (active) setSyncing(false);
      }
    }

    syncPlan();

    return () => {
      active = false;
    };
  }, [isAuthenticated, location.pathname, location.search, navigate, refreshMe]);

  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 99998,
        maxWidth: 360,
        borderRadius: 18,
        border: "1px solid rgba(34,197,94,0.35)",
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.98), rgba(20,83,45,0.92))",
        boxShadow: "0 24px 70px rgba(2,6,23,0.42)",
        color: "white",
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, color: "#86efac" }}>
        {syncing ? "SYNCING BILLING" : "BILLING UPDATED"}
      </div>

      <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.45 }}>
        {message}
      </div>
    </div>
  );
}
