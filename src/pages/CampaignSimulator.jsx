import React, { useCallback } from "react";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { api } from "../services/api";

const fallbackData = {
  metrics: [
    { label: "Base Win Scenario", value: "54%", delta: "+2.1", tone: "up" },
    { label: "Upside Ceiling", value: "63%", delta: "+3.7", tone: "up" },
    { label: "Downside Risk", value: "41%", delta: "-2.9", tone: "down" },
    { label: "Model Confidence", value: "78", delta: "+4.2", tone: "up" }
  ],
  scenarios: [
    { title: "Base Case", probability: "44%", outcome: "Stable suburban gains and neutral media conditions.", status: "Most Likely" },
    { title: "Narrative Shock", probability: "18%", outcome: "Negative media cycle compresses margins.", status: "Risk" }
  ],
  board: [
    { race: "PA Senate", base: "54%", upside: "61%", downside: "47%", trigger: "Women suburban turnout" },
    { race: "GA Senate", base: "57%", upside: "64%", downside: "50%", trigger: "Turnout mix" }
  ],
  notes: [
    { title: "Best upside path", note: "Affordability discipline plus suburban turnout remains the cleanest route." },
    { title: "Most fragile assumption", note: "Current model is most exposed to local press instability." }
  ]
};

function statusClass(value) {
  const v = value.toLowerCase();
  if (v === "risk") return "high";
  if (v === "upside" || v === "opportunity") return "medium";
  return "low";
}

const CampaignSimulator = () => {
  const fetcher = useCallback(() => api.simulator(), []);
  const { data, loading, error } = useApiResource(fetcher, fallbackData);

  return (
    <TerminalPage
      eyebrow="Campaign Simulator"
      title="Model what happens next before the political market gets there first."
      description="Test turnout shifts, message gains, donor confidence changes, media shocks, and execution decisions to see how they alter the path to victory."
      metrics={data?.metrics || []}
    >
      <Panel title="Scenario Deck" subtitle="Most important modeled pathways across the next cycle">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-sim-scenario-list">
            {data.scenarios.map((item) => (
              <div key={item.title} className="vs-sim-scenario-item">
                <div className="vs-sim-scenario-top">
                  <div>
                    <div className="vs-sim-scenario-title">{item.title}</div>
                    <div className="vs-sim-scenario-probability">{item.probability}</div>
                  </div>
                  <div className={`vs-sim-scenario-status ${statusClass(item.status)}`}>
                    {item.status}
                  </div>
                </div>
                <div className="vs-sim-scenario-outcome">{item.outcome}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Battleground Simulation Board" subtitle="Base, upside, and downside ranges by priority race">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-table">
            <div className="vs-table-head">
              <span>Race</span>
              <span>Base</span>
              <span>Upside</span>
              <span>Downside</span>
              <span>Primary Trigger</span>
            </div>
            {data.board.map((row) => (
              <div key={row.race} className="vs-table-row vs-table-row-five">
                <span>{row.race}</span>
                <span>{row.base}</span>
                <span className="up">{row.upside}</span>
                <span className="down">{row.downside}</span>
                <span>{row.trigger}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="AI Simulation Notes" subtitle="Highest-signal interpretation from current simulation runs" large>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-ai-note-list">
            {data.notes.map((item) => (
              <div key={item.title} className="vs-ai-note-item">
                <div className="vs-ai-note-title">{item.title}</div>
                <div className="vs-ai-note-detail">{item.note}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </TerminalPage>
  );
};

export default CampaignSimulator;
