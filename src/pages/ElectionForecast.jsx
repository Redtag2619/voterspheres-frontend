import React, { useCallback } from "react";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { intelligenceApi } from "../services/api";

const fallbackData = {
  metrics: [
    { label: "National Control Probability", value: "58%", delta: "+3.1", tone: "up" },
    { label: "Battleground Volatility", value: "High", delta: "+7 signals", tone: "down" },
    { label: "Turnout Confidence", value: "72", delta: "+4.8", tone: "up" },
    { label: "Persuasion Efficiency", value: "8.3", delta: "+0.9", tone: "up" }
  ],
  races: [
    { race: "PA Senate", winProb: 54, change: "+2.1", rating: "Lean", status: "Momentum Up" },
    { race: "GA Senate", winProb: 57, change: "+2.9", rating: "Lean", status: "Improving" },
    { race: "AZ-01", winProb: 51, change: "+1.4", rating: "Toss-up", status: "Watch" }
  ],
  scenarios: [
    { title: "Base Case", probability: "44%", summary: "Stable suburban gains and neutral press environment." },
    { title: "Upside Breakout", probability: "27%", summary: "Stronger turnout and message dominance on affordability." }
  ],
  notes: [
    { title: "Probability curve steepening in top suburban districts", detail: "Confidence is improving where affordability and turnout align." },
    { title: "Most efficient growth path remains persuasion + validation", detail: "District-tuned validators outperform broad national messaging." }
  ]
};

function toneClass(v) {
  return String(v || "").startsWith("-") ? "down" : "up";
}

function probabilityWidth(v) {
  return { width: `${Number(v || 0)}%` };
}

function normalizeForecastData(raw) {
  const data = raw || {};

  const races =
    data.races ||
    data.results ||
    data.forecast ||
    [];

  const metrics =
    data.metrics ||
    [
      {
        label: "Tracked Races",
        value: String(Array.isArray(races) ? races.length : 0),
        delta: "Live forecast feed",
        tone: "up"
      }
    ];

  const scenarios =
    data.scenarios ||
    [];

  const notes =
    data.notes ||
    [];

  return {
    metrics,
    races: Array.isArray(races) ? races : [],
    scenarios: Array.isArray(scenarios) ? scenarios : [],
    notes: Array.isArray(notes) ? notes : []
  };
}

const ElectionForecast = () => {
  const fetcher = useCallback(async () => {
    const result = await intelligenceApi.forecast();
    return normalizeForecastData(result);
  }, []);

  const { data, loading, error } = useApiResource(fetcher, fallbackData);

  return (
    <TerminalPage
      eyebrow="Election Forecast Terminal"
      title="Probability, momentum, and scenario intelligence for the races that will decide control."
      description="Track modeled win probability, battleground movement, scenario ranges, and the variables that most affect the path to victory."
      metrics={data?.metrics || []}
    >
      <Panel title="Race Probability Board" subtitle="Live model snapshot across top contested races">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="vs-probability-board">
            {(data?.races || []).map((row, index) => (
              <div
                key={row.race || row.name || row.id || index}
                className="vs-probability-row"
              >
                <div className="vs-probability-top">
                  <div className="vs-probability-race">
                    {row.race || row.name || `${row.state || "State"} ${row.office || ""}`.trim()}
                  </div>
                  <div className="vs-probability-percent">
                    {Number(row.winProb ?? row.winProbability ?? 0)}%
                  </div>
                </div>

                <div className="vs-probability-bar">
                  <div
                    className="vs-probability-fill"
                    style={probabilityWidth(row.winProb ?? row.winProbability ?? 0)}
                  />
                </div>

                <div className="vs-probability-meta">
                  <span className={toneClass(row.change || row.delta || "+0")}>
                    {row.change || row.delta || "+0"}
                  </span>
                  <span>{row.rating || row.category || "Competitive"}</span>
                  <span>{row.status || row.overlayTier || "Active"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Scenario Deck" subtitle="Most likely modeled pathways over the next cycle">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="vs-scenario-list">
            {(data?.scenarios || []).map((item, index) => (
              <div
                key={item.title || index}
                className="vs-scenario-item"
              >
                <div className="vs-scenario-topline">
                  <div className="vs-scenario-title">{item.title}</div>
                  <div className="vs-scenario-probability">
                    {item.probability || item.prob || "N/A"}
                  </div>
                </div>
                <div className="vs-scenario-summary">
                  {item.summary || item.outcome || "No scenario summary available."}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="AI Forecast Notes" subtitle="Highest-signal model interpretation" large>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="vs-ai-note-list">
            {(data?.notes || []).map((item, index) => (
              <div
                key={item.title || index}
                className="vs-ai-note-item"
              >
                <div className="vs-ai-note-title">{item.title}</div>
                <div className="vs-ai-note-detail">
                  {item.detail || item.note || "No note detail available."}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </TerminalPage>
  );
};

export default ElectionForecast;
