import { useEffect, useState } from "react";
import { alertsApi } from "../services/api";

function severityClasses(severity) {
  if (severity === "high") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (severity === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function AlertsCenter() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState({ metrics: [], alerts: [] });

  async function loadAlerts() {
    try {
      setLoading(true);
      setError("");
      const result = await alertsApi.list();
      setData(result || { metrics: [], alerts: [] });
    } catch (err) {
      setError(err?.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }

  async function rebuildAlerts() {
    try {
      await alertsApi.rebuild();
      await loadAlerts();
    } catch (err) {
      setError(err?.message || "Failed to rebuild alerts");
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.24em] text-[#0176D3]">
                VoterSpheres Intelligence
              </div>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Alerts Center
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Live operational flags for campaign tasks, mail delays, vendor risk, and pipeline issues.
              </p>
            </div>

            <button
              type="button"
              onClick={rebuildAlerts}
              className="rounded-2xl bg-[#0176D3] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Rebuild Alerts
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {(data.metrics || []).map((metric, index) => (
            <div
              key={`${metric.label}-${index}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                {metric.label}
              </div>
              <div className="mt-3 text-3xl font-semibold text-slate-900">
                {metric.value}
              </div>
              <div className="mt-2 text-sm text-slate-500">{metric.delta}</div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Active Alerts</h2>
          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Loading alerts...
              </div>
            ) : data.alerts?.length ? (
              data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        {alert.title}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {alert.description || alert.note || "No description provided."}
                      </div>
                    </div>

                    <div
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityClasses(
                        String(alert.severity || "low").toLowerCase()
                      )}`}
                    >
                      {alert.severity || "low"}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No active alerts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
