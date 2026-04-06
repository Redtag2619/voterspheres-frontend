import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function RankingRow({ row }) {
  const momentumUp = !String(row.change || "").startsWith("-");

  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "70px 1.5fr 1fr 1fr 1fr 1fr",
          alignItems: "start"
        }}
      >
        <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--vs-text-muted)" }}>
          #{row.rank}
        </div>

        <div>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{row.leader}</div>
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
          <div className="vs-stat-label">Win Prob.</div>
          <div style={{ marginTop: "0.35rem", fontSize: "0.95rem", fontWeight: 700 }}>
            {row.winProbability}%
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Momentum</div>
          <div
            className={momentumUp ? "vs-tone-up" : "vs-tone-down"}
            style={{ marginTop: "0.35rem", fontSize: "0.95rem", fontWeight: 700 }}
          >
            {row.change || "—"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Rating</div>
          <div style={{ marginTop: "0.35rem", fontSize: "0.9rem", color: "var(--vs-text)" }}>
            {row.rating || "Watch"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Finance</div>
          <div style={{ marginTop: "0.35rem" }}>
            <Badge tone="accent">{row.financeBand || "Strong"}</Badge>
          </div>
        </div>
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
    <PageShell
      eyebrow="VoterSpheres Modeled Rankings"
      title="Power Rankings"
      description="A unified intelligence view of race strength, financial positioning, and late-cycle movement across top campaigns."
      demo={demoMode}
      demoText="Demo rankings are active. Race ordering, financial strength, and momentum are preloaded for presentation."
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

      <SectionCard
        title="Modeled Race Leaderboard"
        subtitle="Top campaigns ranked by modeled strength, momentum, and finance posture."
      >
        <div className="vs-stack">
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
      </SectionCard>
    </PageShell>
  );
}
