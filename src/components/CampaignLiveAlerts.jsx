import React from "react";

function severityClasses(severity) {
  const value = String(severity || "").toLowerCase();

  if (value === "high") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (value === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function CampaignLiveAlerts({
  alerts = [],
  onResolve,
  resolvingId = ""
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-900">Live Campaign Alerts</h2>
        <p className="mt-1 text-sm text-slate-500">
          Real-time events affecting this campaign workspace.
        </p>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
            No live alerts right now.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-2xl border p-4 ${severityClasses(alert.severity)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{alert.title}</div>
                  <div className="mt-1 text-sm">{alert.message}</div>
                </div>

                <div className="rounded-full border border-current/20 bg-white/70 px-3 py-1 text-xs font-medium">
                  {alert.severity || "info"}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs opacity-80">
                <span>Type: {alert.type || "alert"}</span>
                <span>Source: {alert.source || "system"}</span>
                <span>
                  {alert.created_at
                    ? new Date(alert.created_at).toLocaleString()
                    : "No timestamp"}
                </span>
                <span>Status: {alert.status || "open"}</span>
              </div>

              {alert.status !== "resolved" ? (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => onResolve?.(alert)}
                    disabled={resolvingId === String(alert.id)}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#0176D3]"
                  >
                    {resolvingId === String(alert.id) ? "Resolving..." : "Resolve"}
                  </button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
