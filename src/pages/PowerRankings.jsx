import { useEffect, useState } from "react";
import { intelligenceApi } from "../services/api";

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

function RankingRow({ row }) {
  return (
    <div className="grid grid-cols-12 items-center gap-3 rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm">
      <div className="col-span-1 text-slate-400">#{row.rank}</div>
      <div className="col-span-3 font-medium text-white">
        {row.leader || row.candidate_name || row.name || "Unknown"}
      </div>
      <div className="col-span-2 text-slate-300">{row.state || "N/A"}</div>
      <div className="col-span-2 text-slate-300">{row.office || "N/A"}</div>
      <div className="col-span-2 text-center text-cyan-300">
        {Number(row.winProbability ?? row.winProb ?? 0)}%
      </div>
      <div className="col-span-2 text-right text-emerald-300">
        {row.rating || row.category || "Competitive"}
      </div>
    </div>
  );
}

function normalizeRankings(result) {
  const metrics = Array.isArray(result?.metrics) ? result.metrics : [];

  const campaigns =
    result?.campaigns ||
    result?.rankings ||
    result?.results ||
    result?.rows ||
    [];

  return {
    metrics,
    campaigns: Array.isArray(campaigns) ? campaigns : []
  };
}

export default function PowerRankings() {
  const [data, setData] = useState({ metrics: [], campaigns: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadRankings() {
      try {
        setLoading(true);
        setError("");

        const result = await intelligenceApi.rankings();

        if (!active) return;
        setData(normalizeRankings(result));
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load power rankings");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRankings();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            VoterSpheres Modeled Rankings
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Power Rankings</h1>
          <p className="mt-2 text-sm text-slate-400">
            Fundraising-weighted race rankings from the intelligence engine.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
            Loading rankings...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-300">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {data.metrics.length === 0 ? (
                <>
                  <MetricCard
                    label="Tracked Races"
                    value={data.campaigns.length}
                    delta="Live rankings feed"
                    tone="up"
                  />
                  <MetricCard
                    label="Top Tier"
                    value={
                      data.campaigns.filter((r) =>
                        ["safe", "strong", "lean"].includes(
                          String(r.rating || "").toLowerCase()
                        )
                      ).length
                    }
                    delta="High-confidence positions"
                    tone="up"
                  />
                  <MetricCard
                    label="Competitive"
                    value={
                      data.campaigns.filter((r) =>
                        ["toss-up", "competitive"].includes(
                          String(r.rating || r.category || "").toLowerCase()
                        )
                      ).length
                    }
                    delta="Most contested"
                    tone="neutral"
                  />
                  <MetricCard
                    label="Model Active"
                    value="Yes"
                    delta="Intelligence online"
                    tone="up"
                  />
                </>
              ) : (
                data.metrics.map((metric, index) => (
                  <MetricCard
                    key={`${metric.label}-${index}`}
                    label={metric.label}
                    value={metric.value}
                    delta={metric.delta}
                    tone={metric.tone}
                  />
                ))
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
              <h2 className="mb-4 text-xl font-semibold">
                Modeled Race Leaderboard
              </h2>

              <div className="space-y-3">
                {data.campaigns.length === 0 ? (
                  <div className="text-sm text-slate-500">
                    No ranking data available.
                  </div>
                ) : (
                  data.campaigns.map((row, index) => (
                    <RankingRow
                      key={row.raceKey || row.id || `${row.rank || index}-${row.state || "race"}`}
                      row={{
                        ...row,
                        rank: row.rank || index + 1
                      }}
                    />
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
