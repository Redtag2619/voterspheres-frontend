import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import EmptyState from "../components/ui/EmptyState";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function LeaderRow({ row }) {
  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "70px 1.6fr 1fr 1fr 1fr",
          alignItems: "start"
        }}
      >
        <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--vs-text-muted)" }}>
          #{row.rank}
        </div>

        <div>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{row.name}</div>
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.9rem",
              color: "var(--vs-text-muted)"
            }}
          >
            {row.state || "N/A"} • {row.office || "Race"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Party</div>
          <div style={{ marginTop: "0.35rem", fontSize: "0.9rem", color: "var(--vs-text)" }}>
            {row.party || "N/A"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Receipts</div>
          <div style={{ marginTop: "0.35rem", fontSize: "0.95rem", fontWeight: 700 }}>
            {formatMoney(row.receipts || 0)}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Cash on Hand</div>
          <div style={{ marginTop: "0.35rem", fontSize: "0.95rem", fontWeight: 700 }}>
            {formatMoney(row.cash_on_hand || 0)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, subtitle }) {
  return (
    <div className="vs-card-muted">
      <div className="vs-stat-label">{title}</div>
      <div style={{ marginTop: "0.5rem", fontSize: "1.5rem", fontWeight: 700, color: "var(--vs-text)" }}>
        {value}
      </div>
      <div
        style={{
          marginTop: "0.5rem",
          fontSize: "0.9rem",
          color: "var(--vs-text-muted)"
        }}
      >
        {subtitle}
      </div>
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
    <PageShell
      eyebrow="Fundraising Intelligence"
      title="Finance strength across the field."
      description="Track fundraising leaders, reserve strength, and campaign finance posture across the top modeled races."
      demo={demoMode}
      demoText="Demo fundraising mode is active. Leaderboard totals and finance posture are preloaded for presentation."
    >
      {error ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}
        >
          {error}
        </div>
      ) : null}

      <div className="vs-grid-4">
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

      <div className="vs-grid-2">
        <SectionCard
          title="Fundraising Leaderboard"
          subtitle="Top candidates by receipts and reserve position."
        >
          <div className="vs-stack">
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
        </SectionCard>

        <SectionCard
          title="Finance Summary"
          subtitle="Quick read on receipts, reserves, and fundraising depth."
        >
          <div className="vs-stack">
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
        </SectionCard>
      </div>
    </PageShell>
  );
}
