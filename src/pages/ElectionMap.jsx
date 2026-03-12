import { useEffect, useState } from "react";
import { api } from "../services/api";

function MetricCard({ label, value, delta }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-cyan-300">{delta}</div>
    </div>
  );
}

function BattlegroundCard({ row }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{row.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
            {row.state}
          </p>
        </div>
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-300">
          {row.raceRating}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        <p>
          <span className="text-slate-500">Win Probability:</span> {row.winProb}%
        </p>
        <p>
          <span className="text-slate-500">Momentum:</span> {row.momentum}
        </p>
        <p>
          <span className="text-slate-500">Modeled Funds:</span> {row.funds}
        </p>
        <p>
          <span className="text-slate-500">Risk:</span> {row.risk}
        </p>
        <p className="text-slate-400">{row.note}</p>
        <p className="text-xs text-slate-500">
          Center: {Array.isArray(row.center) ? row.center.join(", ") : "N/A"}
        </p>
      </div>
    </div>
  );
}

export default function ElectionMap() {
  const [data, setData] = useState({ metrics: [], battlegrounds: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMap() {
      try {
        setLoading(true);
        setError("");

        const result = await api.intelligenceMap();

        if (!active) return;

        setData({
          metrics: result?.metrics || [],
          battlegrounds: result?.battlegrounds || []
        });
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load election map");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMap();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            VoterSpheres National Map
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Election Map</h1>
          <p className="mt-2 text-sm text-slate-400">
            Battleground geography shaped by live modeling and campaign finance.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
            Loading election map...
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
                />
              ))}
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
              <h2 className="mb-4 text-xl font-semibold">Battleground States</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.battlegrounds.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No battleground map data available.
                  </div>
                ) : (
                  data.battlegrounds.map((row) => (
                    <BattlegroundCard key={row.name} row={row} />
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
