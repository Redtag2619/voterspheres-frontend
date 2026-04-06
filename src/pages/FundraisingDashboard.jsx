import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

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

function LeaderRow({ row }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[70px,1.6fr,1fr,1fr,1fr]">
      <div className="text-xl font-semibold text-slate-400">#{row.rank}</div>

      <div>
        <div className="font-semibold text-slate-900">{row.name}</div>
        <div className="mt-1 text-sm text-slate-500">
          {row.state || "N/A"} • {row.office || "Race"}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Party
        </div>
        <div className="mt-1 text-sm text-slate-700">{row.party || "N/A"}</div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Receipts
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-900">
          {formatMoney(row.receipts || 0)}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Cash on Hand
        </div>
        <div className="mt-1 text-sm font-semibold text-slate-900">
          {formatMoney(row.cash_on_hand || 0)}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
        {title}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{subtitle}</div>
    </div>
  );
}

const fallbackData = {
  metrics: [
    { label: "Tracked Finance Leaders", value: "4", delta: "Demo finance layer", tone: "up" },
    { label: "Modeled Receipts", value: "$41.2M", delta: "Leaderboard total", tone: "up" },
    { label: "Average Raise", value: "$10.3M", delta: "Across leaders", tone: "up" },
    { label: "Cash On Hand", value: "$18.9M", delta: "Competitive reserves", tone: "up" }
  ],
  leaderboard: [
    {
      rank: 1,
      candidate_id: 1,
      name: "Mark Stephens",
      state: "Georgia",
      office: "Senate",
      party: "Democratic",
      receipts: 12850000,
      cash_on_hand: 6100000
    },
    {
      rank: 2,
      candidate_id: 2,
      name: "Jane Thompson",
      state: "Pennsylvania",
      office: "Senate",
      party: "Democratic",
      receipts: 11120000,
      cash_on_hand: 5400000
    },
    {
      rank: 3,
      candidate_id: 3,
      name: "Maria Ellis",
      state: "Arizona",
      office: "Senate",
      party: "Democratic",
      receipts: 9875000,
      cash_on_hand: 4200000
    },
    {
      rank: 4,
      candidate_id: 4,
      name: "Daniel Brooks",
      state: "Michigan",
      office: "House",
      party: "Republican",
      receipts: 8420000,
      cash_on_hand: 3150000
    }
  ],
  summary: {
    tracked_candidates: 4,
    total_receipts: 41165000,
    total_cash_on_hand: 18850000,
    average_receipts: 10291250
  }
};

export default function FundraisingDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(fallbackData);

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useEffect(() => {
    let active = true;

    async function loadFundraising() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/intelligence/fundraising/leaderboard", {
          timeout: 6000
        });

        if (!active) return;

        const payload = response?.data || fallbackData;

        setData({
          metrics: payload.metrics?.length ? payload.metrics : fallbackData.metrics,
          leaderboard: payload.leaderboard?.length
            ? payload.leaderboard
            : fallbackData.leaderboard,
          summary: payload.summary || fallbackData.summary
        });
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load fundraising dashboard"
        );
        setData(fallbackData);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFundraising();

    return () => {
      active = false;
    };
  }, []);

  const leaderboard = useMemo(() => data.leaderboard || [], [data.leaderboard]);
  const summary = data.summary || fallbackData.summary;

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
              Fundraising Intelligence
            </div>

            {demoMode ? (
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Demo Mode
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Finance strength across the field.
          </h1>

          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Track fundraising leaders, reserve strength, and campaign finance posture across the top modeled races.
          </p>

          {demoMode ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Demo fundraising mode is active. Leaderboard totals and finance posture are preloaded for presentation.
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

        <div className="grid gap-6 xl:grid-cols-[1.25fr,0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">
                Fundraising Leaderboard
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Top candidates by receipts and reserve position.
              </p>
            </div>

            <div className="space-y-4">
              {loading ? (
                <EmptyState text="Loading fundraising leaderboard..." />
              ) : !leaderboard.length ? (
                <EmptyState text="No fundraising leaders available." />
              ) : (
                leaderboard.map((row) => (
                  <LeaderRow
                    key={`${row.rank}-${row.candidate_id || row.name}`}
                    row={row}
                  />
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">
                Finance Summary
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Quick read on receipts, reserves, and fundraising depth.
              </p>
            </div>

            <div className="space-y-4">
              <SummaryCard
                title="Tracked Candidates"
                value={summary.tracked_candidates || 0}
                subtitle="Candidates included in the modeled finance layer"
              />

              <SummaryCard
                title="Total Receipts"
                value={formatMoney(summary.total_receipts || 0)}
                subtitle="Combined receipts across the leaderboard"
              />

              <SummaryCard
                title="Cash on Hand"
                value={formatMoney(summary.total_cash_on_hand || 0)}
                subtitle="Current reserve strength across tracked campaigns"
              />

              <SummaryCard
                title="Average Raise"
                value={formatMoney(summary.average_receipts || 0)}
                subtitle="Average total receipts per ranked campaign"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
