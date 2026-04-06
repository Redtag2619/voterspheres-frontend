import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
      {text}
    </div>
  );
}

function StatCard({ label, value, delta, tone = "neutral" }) {
  const toneClass =
    tone === "up"
      ? "text-emerald-600"
      : tone === "down"
      ? "text-rose-600"
      : "text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      <div className={`mt-2 text-sm ${toneClass}`}>{delta}</div>
    </div>
  );
}

function RankingRow({ row }) {
  const momentumUp = !String(row.change || "").startsWith("-");

  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[70px,1.5fr,1fr,1fr,1fr,1fr]">
      <div className="text-xl font-semibold text-slate-400">#{row.rank}</div>

      <div>
        <div className="font-semibold text-slate-900">{row.leader}</div>
        <div className="mt-1 text-sm text-slate-500">
          {row.state || "N/A"} • {row.office || "Race"}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Win Prob.
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-900">
          {row.winProbability}%
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Momentum
        </div>
        <div
          className={`mt-1 text-sm font-semibold ${
            momentumUp ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {row.change || "—"}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Rating
        </div>
        <div className="mt-1 text-sm text-slate-700">{row.rating || "Watch"}</div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Finance
        </div>
        <div className="mt-1 text-sm text-slate-700">{row.financeBand || "Strong"}</div>
      </div>
    </div>
  );
}

const fallbackData = {
  metrics: [
    { label: "National Control Probability", value: "58%", delta: "+3.1", tone: "up" },
    { label: "Battleground Volatility", value: "High", delta: "+7 signals", tone: "down" },
    { label: "Turnout Confidence", value: "72", delta: "+4.8", tone: "up" },
    { label: "Persuasion Efficiency", value: "8.3", delta: "+0.9", tone: "up" }
  ],
  campaigns: [
    {
      rank: 1,
      leader: "Mark Stephens",
      state: "Georgia",
      office: "Senate",
      winProbability: 57,
      change: "+2.4",
      rating: "Lean D",
      financeBand: "Elite"
    },
    {
      rank: 2,
      leader: "Jane Thompson",
      state: "Pennsylvania",
      office: "Senate",
      winProbability: 54,
      change: "+1.8",
      rating: "Lean D",
      financeBand: "Strong"
    },
    {
      rank: 3,
      leader: "Maria Ellis",
      state: "Arizona",
      office: "Senate",
      winProbability: 51,
      change: "+1.1",
      rating: "Toss-up",
      financeBand: "Competitive"
    }
  ]
};

export default function PowerRankings() {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useEffect(() => {
    let active = true;

    async function loadRankings() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/intelligence/rankings", {
          timeout: 6000
        });

        if (!active) return;

        const payload = response?.data || fallbackData;

        setData({
          metrics: payload.metrics?.length ? payload.metrics : fallbackData.metrics,
          campaigns: payload.campaigns?.length ? payload.campaigns : fallbackData.campaigns
        });
      } catch (err) {
        if (!active) return;

        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load power rankings"
        );

        setData(fallbackData);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRankings();

    return () => {
      active = false;
    };
  }, []);

  const campaigns = useMemo(() => data.campaigns || [], [data.campaigns]);

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
              VoterSpheres Modeled Rankings
            </div>

            {demoMode ? (
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Demo Mode
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Power Rankings
          </h1>

          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            A unified intelligence view of race strength, financial positioning, and late-cycle movement across top campaigns.
          </p>

          {demoMode ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Demo rankings are active. Race ordering, financial strength, and momentum are preloaded for presentation.
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(data.metrics || []).map((metric, index) => (
            <StatCard
              key={`${metric.label}-${index}`}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
              tone={metric.tone}
            />
          ))}
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">
              Modeled Race Leaderboard
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Top campaigns ranked by modeled strength, momentum, and finance posture.
            </p>
          </div>

          <div className="space-y-4">
            {loading ? (
              <EmptyState text="Loading power rankings..." />
            ) : !campaigns.length ? (
              <EmptyState text="No ranking data available." />
            ) : (
              campaigns.map((row) => (
                <RankingRow key={`${row.rank}-${row.leader}-${row.state}`} row={row} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
