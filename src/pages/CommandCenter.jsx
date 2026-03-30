import React, { useCallback } from "react";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { platformApi } from "../services/api";

const fallbackData = {
  metrics: [
    { label: "National Win Index", value: "61.4", delta: "+2.8", tone: "up" },
    { label: "Active Threats", value: "12", delta: "+3", tone: "down" },
    { label: "Fundraising Pulse", value: "$12.6M", delta: "+11.2%", tone: "up" },
    { label: "Persuasion Opportunity", value: "8.7", delta: "+0.6", tone: "up" }
  ],
  battlegrounds: [
    { race: "PA Senate", probability: "54%", momentum: "+2.1", risk: "Elevated", priority: "Tier 1" },
    { race: "AZ-01", probability: "51%", momentum: "+1.4", risk: "Watch", priority: "Tier 1" },
    { race: "MI-07", probability: "49%", momentum: "-0.8", risk: "High", priority: "Tier 1" }
  ],
  actions: [
    {
      title: "Reallocate persuasion spend",
      owner: "Paid Media",
      due: "Today",
      detail: "Shift 14% of digital spend into three suburban battleground segments."
    },
    {
      title: "Deploy rapid-response package",
      owner: "War Room",
      due: "2 hrs",
      detail: "Push education-cost rebuttal kit to surrogates and state comms leads."
    }
  ],
  feed: [
    {
      time: "08:12",
      title: "Opposition message spike detected",
      source: "Ad monitoring",
      severity: "High"
    },
    {
      time: "09:05",
      title: "Education narrative gaining traction",
      source: "Media signal blend",
      severity: "Medium"
    }
  ]
};

function toneClass(value) {
  return String(value).startsWith("-") ? "down" : "up";
}

const CommandCenter = () => {
  const fetcher = useCallback(() => platformApi.commandCenter(), []);
  const { data, loading, error } = useApiResource(fetcher, fallbackData);

  return (
    <TerminalPage
      eyebrow="Executive Terminal"
      title="The operating system for campaign control, race velocity, and strategic response."
      description="Monitor battleground pressure, fundraising flow, narrative threats, and the next-best actions across the national map from one executive view."
      metrics={data?.metrics || []}
    >
      <Panel
        title="Priority Battleground Board"
        subtitle="Top races requiring executive monitoring and rapid adjustments"
        action="Open full map"
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="vs-table">
            <div className="vs-table-head">
              <span>Race</span>
              <span>Win Prob.</span>
              <span>Momentum</span>
              <span>Risk</span>
              <span>Priority</span>
            </div>

            {data.battlegrounds.map((row) => (
              <div key={row.race} className="vs-table-row vs-table-row-five">
                <span>{row.race}</span>
                <span>{row.probability}</span>
                <span className={toneClass(row.momentum)}>{row.momentum}</span>
                <span>{row.risk}</span>
                <span>{row.priority}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="War Room Feed"
        subtitle="Live risk and narrative events entering the system"
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="vs-warfeed">
            {data.feed.map((item) => (
              <div key={`${item.time}-${item.title}`} className="vs-warfeed-item">
                <div className="vs-warfeed-time">{item.time}</div>
                <div className={`vs-warfeed-severity ${item.severity.toLowerCase()}`}>
                  {item.severity}
                </div>
                <div className="vs-warfeed-content">
                  <div className="vs-warfeed-title">{item.title}</div>
                  <div className="vs-warfeed-source">{item.source}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Executive Action Queue"
        subtitle="Highest-leverage next steps for the next cycle"
        large
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="vs-action-list">
            {data.actions.map((item) => (
              <div key={item.title} className="vs-action-item">
                <div className="vs-action-topline">
                  <div className="vs-action-title">{item.title}</div>
                  <div className="vs-action-due">{item.due}</div>
                </div>
                <div className="vs-action-owner">Owner: {item.owner}</div>
                <div className="vs-action-detail">{item.detail}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </TerminalPage>
  );
};

export default CommandCenter;
