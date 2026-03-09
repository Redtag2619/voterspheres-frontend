import React, { useCallback } from "react";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { api } from "../services/api";

const fallbackData = {
  metrics: [
    { label: "Competitive Races", value: "148", delta: "+12 this week", tone: "up" },
    { label: "Fundraising Velocity", value: "$42.8M", delta: "+9.4%", tone: "up" },
    { label: "War Room Events", value: "27", delta: "7 high severity", tone: "down" },
    { label: "AI Strategic Signals", value: "63", delta: "11 new today", tone: "neutral" }
  ],
  alerts: [
    { title: "Narrative acceleration detected in Midwest suburban districts", meta: "Media + polling + donor chatter", severity: "High" },
    { title: "Two top-tier Senate races moved into high-volatility range", meta: "Forecast model update", severity: "Medium" }
  ],
  raceMoves: [
    { race: "AZ Senate", leader: "Garcia", change: "+1.8", status: "Momentum Up" },
    { race: "PA-08", leader: "Mitchell", change: "-0.9", status: "At Risk" },
    { race: "GA Senate", leader: "Coleman", change: "+2.4", status: "Momentum Up" }
  ],
  donorSignals: [
    { name: "Northeast Finance Bloc", movement: "+18%", note: "Bundler activity rising" },
    { name: "Digital Small-Dollar Network", movement: "+11%", note: "Retention strengthening" }
  ]
};

function toneClass(value) {
  return String(value).startsWith("-") ? "down" : "up";
}

const Dashboard = () => {
  const fetcher = useCallback(() => api.dashboard(), []);
  const { data, loading, error } = useApiResource(fetcher, fallbackData);

  return (
    <TerminalPage
      eyebrow="Executive Overview"
      title="Political markets are moving fast. Your strategy should move faster."
      description="VoterSpheres surfaces race movement, donor velocity, media threats, and AI-driven strategic signals in one terminal-grade interface."
      metrics={data?.metrics || []}
    >
      <Panel
        title="Strategic Alert Feed"
        subtitle="High-signal issues requiring executive attention"
      >
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-alert-list">
            {data.alerts.map((alert) => (
              <div key={alert.title} className="vs-alert-row">
                <div className={`vs-alert-severity ${alert.severity.toLowerCase()}`}>
                  {alert.severity}
                </div>
                <div className="vs-alert-content">
                  <div className="vs-alert-title">{alert.title}</div>
                  <div className="vs-alert-meta">{alert.meta}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Race Movement Board"
        subtitle="Latest modeled shifts across priority contests"
      >
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-table">
            <div className="vs-table-head">
              <span>Race</span>
              <span>Leader</span>
              <span>Change</span>
              <span>Status</span>
            </div>
            {data.raceMoves.map((row) => (
              <div key={row.race} className="vs-table-row">
                <span>{row.race}</span>
                <span>{row.leader}</span>
                <span className={toneClass(row.change)}>{row.change}</span>
                <span>{row.status}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title="Donor Network Signals"
        subtitle="Where money and influence are moving"
        large
      >
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-donor-list">
            {data.donorSignals.map((item) => (
              <div key={item.name} className="vs-donor-row">
                <div>
                  <div className="vs-donor-name">{item.name}</div>
                  <div className="vs-donor-note">{item.note}</div>
                </div>
                <div className={`vs-donor-movement ${toneClass(item.movement)}`}>
                  {item.movement}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </TerminalPage>
  );
};

export default Dashboard;
