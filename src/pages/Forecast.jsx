import { useEffect, useState } from "react";
import { api } from "../services/api";

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

function RaceCard({ race }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {race.state} {race.office}
          </h3>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
            {race.rating}
          </p>
        </div>
        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-300">
          {race.winProbability}%
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        <p>
          <span className="text-slate-500">Leader:</span>{" "}
          {race.leader?.name || "Unknown"}
        </p>
        <p>
          <span className="text-slate-500">Runner-up:</span>{" "}
          {race.runnerUp?.name || "Unknown"}
        </p>
        <p>
          <span className="text-slate-500">Confidence:</span> {race.confidence}%
        </p>
        <p>
          <span className="text-slate-500">Volatility:</span> {race.volatility}%
        </p>
        <p>
          <span className="text-slate-500">Receipts Gap:</span> $
          {Number(race.receiptsGap || 0).toLocaleString()}
        </p>
        <p>
          <span className="text-slate-500">Total Receipts:</span> $
          {Number(race.totalReceipts || 0).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function Forecast() {
  const [data, setData] = useState({ metrics: [], races: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadForecast() {
      try {
        setLoading(true);
        setError("");

        const result = await api.intelligenceForecast();

        if (!active) return;

        setData({
          metrics: result?.metrics || [],
          races: result?.races || []
        });
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load forecast");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadForecast();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            VoterSpheres Forecast Engine
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Election Forecast</h1>
          <p className="mt-2 text-sm text-slate-400">
            Live race modeling powered by campaign finance and platform intelligence.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
            Loading forecast...
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

            <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
              <h2 className="mb-4 text-xl font-semibold">Modeled Races</h2>
              {data.races.length === 0 ? (
                <div className="text-sm text-slate-500">
                  No forecast races available.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {data.races.map((race) => (
                    <RaceCard key={race.raceKey} race={race} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
