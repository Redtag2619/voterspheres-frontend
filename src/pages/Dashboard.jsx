import React from "react";

const kpis = [
  { label: "Competitive Races", value: "148", delta: "+12 this week", tone: "up" },
  { label: "Fundraising Velocity", value: "$42.8M", delta: "+9.4%", tone: "up" },
  { label: "War Room Events", value: "27", delta: "7 high severity", tone: "down" },
  { label: "AI Strategic Signals", value: "63", delta: "11 new today", tone: "neutral" }
];

const alerts = [
  {
    title: "Narrative acceleration detected in Midwest suburban districts",
    meta: "Media + polling + donor chatter",
    severity: "High"
  },
  {
    title: "Two top-tier Senate races moved into high-volatility range",
    meta: "Forecast model update",
    severity: "Medium"
  },
  {
    title: "Fundraising spike linked to endorsement cluster",
    meta: "Donor network signal",
    severity: "Medium"
  },
  {
    title: "Opposition message repetition increasing in digital buys",
    meta: "War room monitoring",
    severity: "High"
  }
];

const raceMoves = [
  { race: "AZ Senate", leader: "Garcia", change: "+1.8", status: "Momentum Up" },
  { race: "PA-08", leader: "Mitchell", change: "-0.9", status: "At Risk" },
  { race: "GA Senate", leader: "Coleman", change: "+2.4", status: "Momentum Up" },
  { race: "MI-10", leader: "Rivers", change: "+0.3", status: "Watch" },
  { race: "NV Senate", leader: "Hale", change: "-1.2", status: "At Risk" }
];

const donorSignals = [
  { name: "Northeast Finance Bloc", movement: "+18%", note: "Bundler activity rising" },
  { name: "Digital Small-Dollar Network", movement: "+11%", note: "Retention strengthening" },
  { name: "Business Leadership PAC Cluster", movement: "-4%", note: "Cooling after media hit" },
  { name: "Issue Advocacy Circle", movement: "+22%", note: "Environment + turnout messaging" }
];

const strategyCards = [
  {
    title: "Path-to-Win Score",
    value: "74 / 100",
    detail: "Most favorable path currently runs through suburban persuasion + women 35–54 turnout."
  },
  {
    title: "Rapid Response Priority",
    value: "Education / Cost",
    detail: "Most attack volume is clustering around affordability and local school messaging."
  },
  {
    title: "Field Allocation Signal",
    value: "Rebalance West",
    detail: "Volunteer and persuasion deployment should increase in three western battleground zones."
  }
];

function toneClass(tone) {
  if (tone === "up") return "up";
  if (tone === "down") return "down";
  return "neutral";
}

function Dashboard() {
  return (
    <div className="vs-dashboard">
      <section className="vs-hero-panel">
        <div>
          <div className="vs-section-eyebrow">Executive Overview</div>
          <h1 className="vs-hero-title">Political markets are moving fast. Your strategy should move faster.</h1>
          <p className="vs-hero-copy">
            VoterSpheres surfaces race movement, donor velocity, media threats, and AI-driven strategic signals in one terminal-grade interface.
          </p>
        </div>

        <div className="vs-hero-metrics">
          <div className="vs-hero-metric-card">
            <div className="vs-hero-metric-label">Win Probability Shift</div>
            <div className="vs-hero-metric-value up">+3.2%</div>
          </div>
          <div className="vs-hero-metric-card">
            <div className="vs-hero-metric-label">Active Battlegrounds</div>
            <div className="vs-hero-metric-value">29</div>
          </div>
          <div className="vs-hero-metric-card">
            <div className="vs-hero-metric-label">Response Window</div>
            <div className="vs-hero-metric-value neutral">4 hrs avg</div>
          </div>
        </div>
      </section>

      <section className="vs-kpi-grid">
        {kpis.map((item) => (
          <div key={item.label} className="vs-card vs-kpi-card">
            <div className="vs-kpi-label">{item.label}</div>
            <div className="vs-kpi-value">{item.value}</div>
            <div className={`vs-kpi-delta ${toneClass(item.tone)}`}>{item.delta}</div>
          </div>
        ))}
      </section>

      <section className="vs-dashboard-grid">
        <div className="vs-card vs-panel-large">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Strategic Alert Feed</div>
              <div className="vs-card-subtitle">High-signal issues requiring executive attention</div>
            </div>
            <button className="vs-card-link">View all</button>
          </div>

          <div className="vs-alert-list">
            {alerts.map((alert) => (
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
        </div>

        <div className="vs-card vs-panel-side">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">AI Strategy Notes</div>
              <div className="vs-card-subtitle">Machine-assisted recommendations</div>
            </div>
          </div>

          <div className="vs-strategy-stack">
            {strategyCards.map((item) => (
              <div key={item.title} className="vs-strategy-card">
                <div className="vs-strategy-title">{item.title}</div>
                <div className="vs-strategy-value">{item.value}</div>
                <div className="vs-strategy-detail">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-panel-large">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Race Movement Board</div>
              <div className="vs-card-subtitle">Latest modeled shifts across priority contests</div>
            </div>
            <button className="vs-card-link">Open forecast</button>
          </div>

          <div className="vs-table">
            <div className="vs-table-head">
              <span>Race</span>
              <span>Leader</span>
              <span>Change</span>
              <span>Status</span>
            </div>

            {raceMoves.map((row) => (
              <div key={row.race} className="vs-table-row">
                <span>{row.race}</span>
                <span>{row.leader}</span>
                <span className={Number(row.change) >= 0 ? "up" : "down"}>{row.change}</span>
                <span>{row.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-panel-side">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Donor Network Signals</div>
              <div className="vs-card-subtitle">Where money and influence are moving</div>
            </div>
          </div>

          <div className="vs-donor-list">
            {donorSignals.map((item) => (
              <div key={item.name} className="vs-donor-row">
                <div>
                  <div className="vs-donor-name">{item.name}</div>
                  <div className="vs-donor-note">{item.note}</div>
                </div>
                <div className="vs-donor-movement up">{item.movement}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
