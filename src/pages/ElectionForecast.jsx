import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

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

function RaceRow({ race }) {
  return (
    <ResponsiveRow
      title={race.race}
      subtitle={`${race.rating || "Competitive"} • ${race.status || "Watch"}`}
      meta={[
        { label: "Win Prob.", value: `${race.winProb}%` },
        { label: "Change", value: race.change }
      ]}
      alert={String(race.change || "").startsWith("-") ? "vs-live-dot" : "vs-live-dot-success"}
      right={<Badge tone={String(race.status || "").toLowerCase() === "watch" ? "demo" : "accent"}>{race.status || "Watch"}</Badge>}
    />
  );
}

function ScenarioRow({ item }) {
  return (
    <ResponsiveRow
      title={item.title}
      subtitle={item.summary}
      meta={[{ label: "Probability", value: item.probability }]}
      alert="vs-live-dot-warning"
      right={<Badge tone="accent">{item.probability}</Badge>}
    />
  );
}

function NoteRow({ item }) {
  return (
    <ResponsiveRow
      title={item.title}
      subtitle={item.detail}
      alert="vs-live-dot-success"
    />
  );
}

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

  const tossups = races.filter((race) =>
    String(race.rating || "").toLowerCase().includes("toss")
  ).length;

  return (
    <PageShell
      eyebrow="Election Forecast"
      title="Forecast the races that will decide control."
      description="Track modeled win probability, battleground movement, scenario ranges, and the variables most likely to change the map."
      demo={demoMode}
      demoText="Demo forecast mode is active. Battleground movement, race probabilities, and scenario paths are preloaded for presentation."
      tickerItems={[
        { label: "Tracked", value: `${races.length} races`, dotClass: "vs-live-dot-success" },
        { label: "Toss-ups", value: `${tossups}`, dotClass: "vs-live-dot-warning" },
        { label: "Scenarios", value: `${scenarios.length} live`, dotClass: "vs-live-dot" }
      ]}
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

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
        <SectionCard title="Race Probability Board" subtitle="Top battlegrounds requiring active campaign attention.">
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading forecast races..." />
            ) : !races.length ? (
              <EmptyState text="No forecast race data available." />
            ) : (
              races.map((race) => (
                <RaceRow key={`${race.race}-${race.status}`} race={race} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Scenario Deck" subtitle="Most likely modeled paths over the next phase of the cycle.">
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading scenario paths..." />
            ) : !scenarios.length ? (
              <EmptyState text="No forecast scenarios available." />
            ) : (
              scenarios.map((item) => (
                <ScenarioRow key={`${item.title}-${item.probability}`} item={item} />
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Forecast Notes" subtitle="Highest-signal interpretation from the forecast layer.">
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading forecast notes..." />
          ) : !notes.length ? (
            <EmptyState text="No forecast notes available." />
          ) : (
            notes.map((item) => <NoteRow key={item.title} item={item} />)
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
