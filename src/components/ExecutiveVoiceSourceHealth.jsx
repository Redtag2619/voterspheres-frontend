import { useEffect, useState } from "react";
import { getExecutiveVoiceSourceHealth } from "../services/executiveVoiceLiveSourcesApi";

export default function ExecutiveVoiceSourceHealth() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getExecutiveVoiceSourceHealth()
      .then((result) => {
        if (mounted) setHealth(result);
      })
      .catch((loadError) => {
        if (mounted) {
          setError(
            loadError?.response?.data?.error ||
              loadError?.message ||
              "Live-source health could not be loaded."
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="ev-source-health is-error">
        Live Sources Degraded · {error}
      </div>
    );
  }

  if (!health) {
    return (
      <div className="ev-source-health is-loading">
        Checking Live Sources…
      </div>
    );
  }

  return (
    <div className="ev-source-health">
      <style>{`
        .ev-source-health {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
          padding: 10px 12px;
          border: 1px solid rgba(148,163,184,.14);
          border-radius: 15px;
          background: rgba(15,23,42,.54);
          color: rgba(226,232,240,.9);
          font-size: 10px;
          font-weight: 800;
        }

        .ev-source-health-provider {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          padding: 6px 8px;
          border-radius: 999px;
          background: rgba(2,6,23,.54);
        }

        .ev-source-health-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: #ef4444;
        }

        .ev-source-health-provider.is-configured .ev-source-health-dot {
          background: #22c55e;
          box-shadow: 0 0 12px rgba(34,197,94,.5);
        }
      `}</style>

      <strong>
        Live Sources {health.configured_count}/{health.total_count}
      </strong>

      {(health.providers || []).map((provider) => (
        <span
          key={provider.id}
          className={
            "ev-source-health-provider " +
            (provider.configured ? "is-configured" : "is-missing")
          }
          title={
            provider.configured
              ? "Configured"
              : `Missing: ${(provider.required_env || []).join(", ")}`
          }
        >
          <span className="ev-source-health-dot" />
          {provider.id.replaceAll("_", " ")}
        </span>
      ))}
    </div>
  );
}
