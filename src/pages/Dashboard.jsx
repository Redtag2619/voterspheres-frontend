import { useEffect, useState } from "react";
import api from "../api";

function MetricCard({ label, value, delta, tone = "neutral" }) {
  const toneClass =
    tone === "up"
      ? "text-emerald-300"
      : tone === "down"
      ? "text-rose-300"
      : "text-slate-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className={`mt-2 text-sm ${toneClass}`}>{delta}</div>
    </div>
  );
}

function AlertCard({ title, meta, severity }) {
  const severityClass =
    severity === "High"
      ? "bg-rose-500/15 text-rose-300"
      : severity === "Medium"
      ? "bg-amber-500/15 text-amber-300"
      : "bg-cyan-500/15 text-cyan-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <span className={`rounded-full px-3 py-1 text-xs ${severityClass}`}>
          {severity}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-400">{meta}</p>
    </div>
  );
}

function RaceMoveRow({ race, leader, change, status }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#111827] px-4 py-3">
      <div>
        <div className="text-sm font-medium text-white">{race}</div>
        <div className="text-xs text-slate-400">Leader: {leader}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-emerald-300">{change}</div>
        <div className="text-xs text-slate-400">{status}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState({
    metrics: [],
    alerts: [],
    raceMoves: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const result = await api.intelligenceDashboard();

        if (!active) return;

        setData({
          metrics: result?.metrics || [],
          alerts: result?.alerts || [],
          raceMoves: result?.raceMoves || []
        });
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load dashboard");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="flex flex-col gap-2">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              VoterSpheres Intelligence
            </div>
            <h1 className="text-3xl font-semibold">Campaign Dashboard</h1>
            <p className="text-sm text-slate-400">
              Live executive view powered by your deployed backend.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
            Loading dashboard intelligence...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-300">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {data.metrics.map((metric) => (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  delta={metric.delta}
                  tone={metric.tone}
                />
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
              <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">Live Alerts</h2>
                  <p className="text-sm text-slate-400">
                    Signals from the intelligence layer.
                  </p>
                </div>

                <div className="space-y-4">
                  {data.alerts.length === 0 ? (
                    <div className="text-sm text-slate-500">
                      No alerts available.
                    </div>
                  ) : (
                    data.alerts.map((alert, index) => (
                      <AlertCard
                        key={`${alert.title}-${index}`}
                        title={alert.title}
                        meta={alert.meta}
                        severity={alert.severity}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">Race Moves</h2>
                  <p className="text-sm text-slate-400">
                    State and campaign momentum shifts.
                  </p>
                </div>

                <div className="space-y-3">
                  {data.raceMoves.length === 0 ? (
                    <div className="text-sm text-slate-500">
                      No race movement data available.
                    </div>
                  ) : (
                    data.raceMoves.map((item, index) => (
                      <RaceMoveRow
                        key={`${item.race}-${index}`}
                        race={item.race}
                        leader={item.leader}
                        change={item.change}
                        status={item.status}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
