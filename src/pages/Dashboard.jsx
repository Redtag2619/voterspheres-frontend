import { useEffect, useState } from "react";
import api from "../api";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const result = await api.intelligenceDashboard();
        if (!active) return;
        setData(result);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load dashboard intelligence");
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
    <div className="space-y-6 p-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-400">
          Live intelligence summary from the VoterSpheres backend.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
          Loading dashboard...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-sm text-red-300">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {(data?.metrics || []).map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/10 bg-[#111827] p-5"
              >
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {metric.label}
                </div>
                <div className="mt-2 text-3xl font-bold">{metric.value}</div>
                <div className="mt-2 text-sm text-slate-400">{metric.delta}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-semibold">Alerts</h2>
              <div className="space-y-4">
                {(data?.alerts || []).map((alert, index) => (
                  <div
                    key={`${alert.title}-${index}`}
                    className="rounded-xl border border-white/10 bg-[#111827] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-medium">{alert.title}</h3>
                      <span className="text-xs text-cyan-300">
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{alert.meta}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-semibold">Race Moves</h2>
              <div className="space-y-4">
                {(data?.raceMoves || []).map((item, index) => (
                  <div
                    key={`${item.race}-${index}`}
                    className="rounded-xl border border-white/10 bg-[#111827] p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="font-medium">{item.race}</h3>
                      <span className="text-xs text-emerald-300">
                        {item.change}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      Leader: {item.leader} • {item.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
