import React, { useCallback } from "react";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { api } from "../services/api";

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
  return String(v).startsWith("-") ? "down" : "up";
}

function probabilityWidth(v) {
  return { width: `${v}%` };
}

const ElectionForecast = () => {
  const fetcher = useCallback(() => api.forecast(), []);
  const { data, loading, error } = useApiResource(fetcher, fallbackData);

  return (
    <TerminalPage
      eyebrow="Election Forecast Terminal"
      title="Probability, momentum, and scenario intelligence for the races that will decide control."
      description="Track modeled win probability, battleground movement, scenario ranges, and the variables that most affect the path to victory."
      metrics={data?.metrics || []}
    >
      <Panel title="Race Probability Board" subtitle="Live model snapshot across top contested races">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-probability-board">
            {data.races.map((row) => (
              <div key={row.race} className="vs-probability-row">
                <div className="vs-probability-top">
                  <div className="vs-probability-race">{row.race}</div>
                  <div className="vs-probability-percent">{row.winProb}%</div>
                </div>
                <div className="vs-probability-bar">
                  <div className="vs-probability-fill" style={probabilityWidth(row.winProb)} />
                </div>
                <div className="vs-probability-meta">
                  <span className={toneClass(row.change)}>{row.change}</span>
                  <span>{row.rating}</span>
                  <span>{row.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Scenario Deck" subtitle="Most likely modeled pathways over the next cycle">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-scenario-list">
            {data.scenarios.map((item) => (
              <div key={item.title} className="vs-scenario-item">
                <div className="vs-scenario-topline">
                  <div className="vs-scenario-title">{item.title}</div>
                  <div className="vs-scenario-probability">{item.probability}</div>
                </div>
                <div className="vs-scenario-summary">{item.summary}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="AI Forecast Notes" subtitle="Highest-signal model interpretation" large>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-ai-note-list">
            {data.notes.map((item) => (
              <div key={item.title} className="vs-ai-note-item">
                <div className="vs-ai-note-title">{item.title}</div>
                <div className="vs-ai-note-detail">{item.detail}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </TerminalPage>
  );
};

export default ElectionForecast;
