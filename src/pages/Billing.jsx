import { useEffect, useMemo, useState } from "react";
import {
  getBillingConfig,
  createCheckoutSession,
  createPortalSession,
} from "../api/billing";

export default function Billing() {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState("");
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState("");

  const firmId = 1;

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

  const plans = useMemo(() => {
    if (!config?.prices) return [];

    return [
      {
        key: "starter",
        title: "Starter",
        priceId: config.prices.starter,
      },
      {
        key: "pro",
        title: "Pro",
        priceId: config.prices.pro,
      },
      {
        key: "enterprise",
        title: "Enterprise",
        priceId: config.prices.enterprise,
      },
    ];
  }, [config]);

  async function handleSubscribe(planKey, priceId) {
    try {
      setLoadingCheckout(planKey);
      setError("");

      const data = await createCheckoutSession({
        firm_id: firmId,
        priceId,
      });

      if (!data?.url) {
        throw new Error("Checkout URL not returned");
      }

      window.location.href = data.url;
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

      const data = await createPortalSession({
        firm_id: firmId,
      });

      if (!data?.url) {
        throw new Error("Portal URL not returned");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to open billing portal"
      );
    } finally {
      setLoadingPortal(false);
    }
  }

  return (
    <div style={{ padding: 24, color: "#fff" }}>
      <h1>Billing</h1>

      {loadingConfig && <p>Loading billing...</p>}
      {error && <p>{error}</p>}

      {!loadingConfig && !error && (
        <>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {plans.map((plan) => (
              <div
                key={plan.key}
                style={{
                  border: "1px solid #333",
                  borderRadius: 12,
                  padding: 20,
                  minWidth: 220,
                  background: "#111827",
                }}
              >
                <h2>{plan.title}</h2>
                <button
                  onClick={() => handleSubscribe(plan.key, plan.priceId)}
                  disabled={loadingCheckout === plan.key}
                >
                  {loadingCheckout === plan.key ? "Redirecting..." : "Subscribe"}
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <button onClick={handlePortal} disabled={loadingPortal}>
              {loadingPortal ? "Opening..." : "Manage Billing"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
