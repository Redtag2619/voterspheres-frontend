import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function RaceCard({ race }) {
  const momentumUp = !String(race.change || "").startsWith("-");

  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "flex-start"
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{race.race}</div>
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.9rem",
              color: "var(--vs-text-muted)"
            }}
          >
            {race.rating || "Competitive"} • {race.status || "Watch"}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--vs-text)" }}>
            {race.winProb}%
          </div>
          <div
            className={momentumUp ? "vs-tone-up" : "vs-tone-down"}
            style={{ marginTop: "0.25rem", fontSize: "0.9rem", fontWeight: 700 }}
          >
            {race.change}
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: "1rem",
          height: "0.75rem",
          overflow: "hidden",
          borderRadius: "9999px",
          background: "#e5e7eb"
        }}
      >
        <div
          style={{
            width: `${Number(race.winProb || 0)}%`,
            height: "100%",
            borderRadius: "9999px",
            background: "var(--vs-accent)"
          }}
        />
      </div>
    </div>
  );
}

function ScenarioCard({ item }) {
  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "flex-start"
        }}
      >
        <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{item.title}</div>
        <Badge tone="accent">{item.probability}</Badge>
      </div>

      <div
        style={{
          marginTop: "0.85rem",
          fontSize: "0.92rem",
          lineHeight: 1.7,
          color: "var(--vs-text-muted)"
        }}
      >
        {item.summary}
      </div>
    </div>
  );
}

function NoteCard({ item }) {
  return (
    <div className="vs-card-muted">
      <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>{item.title}</div>
      <div
        style={{
          marginTop: "0.65rem",
          fontSize: "0.92rem",
          lineHeight: 1.7,
          color: "var(--vs-text-muted)"
        }}
      >
        {item.detail}
      </div>
    </div>
  );
}

const fallbackData = {
  metrics: [
    { label: "Tracked Races", value: "12", delta: "Live modeled states", tone: "up" },
    { label: "High Confidence", value: "5", delta: "Stable lanes", tone: "up" },
    { label: "Toss-ups", value: "3", delta: "Competitive map", tone: "down" },
    { label: "Battlegrounds", value: "7", delta: "Priority states", tone: "up" }
  ],
  races: [
    { race: "GA Senate", winProb: 57, change: "+2.4", rating: "Lean D", status: "Improving" },
    { race: "PA Senate", winProb: 54, change: "+1.8", rating: "Lean D", status: "Competitive" },
    { race: "AZ Senate", winProb: 51, change: "+1.1", rating: "Toss-up", status: "Watch" }
  ],
  scenarios: [
    {
      title: "Base Case",
      probability: "46%",
      summary: "Suburban turnout holds, affordability message remains dominant."
    },
    {
      title: "Upside Breakout",
      probability: "24%",
      summary: "Education contrast sticks and mail execution improves late vote returns."
    }
  ],
  notes: [
    {
      title: "Georgia remains the clearest upside path",
      detail: "Metro persuasion plus turnout quality is the strongest route to control."
    }
  ]
};

export default function ElectionForecast() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forecastData, setForecastData] = useState(fallbackData);

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useEffect(() => {
    let active = true;

    async function loadForecast() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/intelligence/forecast", {
          timeout: 6000
        });

        if (!active) return;

        const payload = response?.data || fallbackData;

        setForecastData({
          metrics: payload.metrics?.length ? payload.metrics : fallbackData.metrics,
          races: payload.races?.length ? payload.races : fallbackData.races,
          scenarios: payload.scenarios?.length ? payload.scenarios : fallbackData.scenarios,
          notes: payload.notes?.length ? payload.notes : fallbackData.notes
        });
      } catch (err) {
        if (!active) return;

        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load forecast"
        );

        setForecastData(fallbackData);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadForecast();

    return () => {
      active = false;
    };
  }, []);

  const races = useMemo(() => forecastData.races || [], [forecastData.races]);
  const scenarios = useMemo(() => forecastData.scenarios || [], [forecastData.scenarios]);
  const notes = useMemo(() => forecastData.notes || [], [forecastData.notes]);

  return (
    <PageShell
      eyebrow="Election Forecast"
      title="Forecast the races that will decide control."
      description="Track modeled win probability, battleground movement, scenario ranges, and the variables most likely to change the map."
      demo={demoMode}
      demoText="Demo forecast mode is active. Battleground movement, race probabilities, and scenario paths are preloaded for presentation."
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
        {(forecastData.metrics || []).map((metric, index) => (
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
          title="Race Probability Board"
          subtitle="Top battlegrounds requiring active campaign attention."
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading forecast races..." />
            ) : !races.length ? (
              <EmptyState text="No forecast race data available." />
            ) : (
              races.map((race) => (
                <RaceCard key={`${race.race}-${race.status}`} race={race} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Scenario Deck"
          subtitle="Most likely modeled paths over the next phase of the cycle."
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading scenario paths..." />
            ) : !scenarios.length ? (
              <EmptyState text="No forecast scenarios available." />
            ) : (
              scenarios.map((item) => (
                <ScenarioCard key={`${item.title}-${item.probability}`} item={item} />
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Forecast Notes"
        subtitle="Highest-signal interpretation from the forecast layer."
      >
        <div className="vs-grid-2">
          {loading ? (
            <EmptyState text="Loading forecast notes..." />
          ) : !notes.length ? (
            <EmptyState text="No forecast notes available." />
          ) : (
            notes.map((item) => (
              <NoteCard key={item.title} item={item} />
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
