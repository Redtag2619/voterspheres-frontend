import React from "react";

const headlineMetrics = [
  {
    label: "National Win Index",
    value: "61.4",
    delta: "+2.8",
    tone: "up"
  },
  {
    label: "Active Threats",
    value: "12",
    delta: "+3",
    tone: "down"
  },
  {
    label: "Fundraising Pulse",
    value: "$12.6M",
    delta: "+11.2%",
    tone: "up"
  },
  {
    label: "Persuasion Opportunity",
    value: "8.7",
    delta: "+0.6",
    tone: "up"
  }
];

const battlegrounds = [
  {
    race: "PA Senate",
    probability: "54%",
    momentum: "+2.1",
    risk: "Elevated",
    priority: "Tier 1"
  },
  {
    race: "AZ-01",
    probability: "51%",
    momentum: "+1.4",
    risk: "Watch",
    priority: "Tier 1"
  },
  {
    race: "MI-07",
    probability: "49%",
    momentum: "-0.8",
    risk: "High",
    priority: "Tier 1"
  },
  {
    race: "GA Senate",
    probability: "57%",
    momentum: "+2.9",
    risk: "Watch",
    priority: "Tier 1"
  },
  {
    race: "NV-03",
    probability: "53%",
    momentum: "+0.7",
    risk: "Low",
    priority: "Tier 2"
  }
];

const warRoomFeed = [
  {
    time: "08:12",
    title: "Opposition message spike detected in suburban cost-of-living ads",
    source: "Ad monitoring / digital spend",
    severity: "High"
  },
  {
    time: "09:05",
    title: "Education narrative gaining traction in two priority districts",
    source: "Media and social signal blend",
    severity: "Medium"
  },
  {
    time: "10:18",
    title: "Surrogate clip outperforming baseline engagement by 34%",
    source: "Content performance engine",
    severity: "Low"
  },
  {
    time: "11:02",
    title: "Donor hesitation cluster forming after local press cycle",
    source: "Finance network sentiment",
    severity: "High"
  }
];

const strategicActions = [
  {
    title: "Reallocate persuasion spend",
    owner: "Paid Media",
    due: "Today",
    detail: "Shift 14% of digital spend into three suburban battleground segments with rising persuasion elasticity."
  },
  {
    title: "Deploy rapid-response package",
    owner: "War Room",
    due: "2 hrs",
    detail: "Push education-cost rebuttal kit to surrogates, state comms leads, and allied validators."
  },
  {
    title: "Elevate donor reassurance brief",
    owner: "Finance",
    due: "Today",
    detail: "Distribute confidence memo to top bundlers with path-to-win and spend-efficiency highlights."
  }
];

const fundraisingLeaders = [
  { name: "Small-Dollar Digital", amount: "$3.8M", change: "+18%" },
  { name: "National Finance Chairs", amount: "$2.9M", change: "+9%" },
  { name: "Issue Advocacy Bloc", amount: "$1.7M", change: "+22%" },
  { name: "Regional Business Circle", amount: "$1.1M", change: "-4%" }
];

const forecastDrivers = [
  {
    driver: "Suburban women turnout",
    impact: "High",
    note: "Most favorable upside lever across current path model."
  },
  {
    driver: "Cost-of-living message discipline",
    impact: "High",
    note: "Narrative control directly affecting persuasion efficiency."
  },
  {
    driver: "Volunteer density in west region",
    impact: "Medium",
    note: "Ground-game lift available with modest reallocation."
  },
  {
    driver: "Earned media volatility",
    impact: "Medium",
    note: "One unfavorable cycle could compress margin in two senate contests."
  }
];

const regionalBoard = [
  { region: "Midwest", score: "72", trend: "+4.2", status: "Advantage" },
  { region: "Sun Belt", score: "58", trend: "+1.1", status: "Competitive" },
  { region: "Mountain West", score: "49", trend: "-1.4", status: "Pressure" },
  { region: "Northeast", score: "67", trend: "+0.8", status: "Stable" }
];

function toneClass(value) {
  return String(value).startsWith("-") ? "down" : "up";
}

function severityClass(value) {
  const normalized = value.toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function CommandCenter() {
  return (
    <div className="vs-command-center">
      <section className="vs-command-hero vs-card">
        <div>
          <div className="vs-section-eyebrow">Executive Terminal</div>
          <h1 className="vs-command-title">
            The operating system for campaign control, race velocity, and strategic response.
          </h1>
          <p className="vs-command-copy">
            Monitor battleground pressure, fundraising flow, narrative threats, and the next-best actions across the national map from one executive view.
          </p>
        </div>

        <div className="vs-command-status-grid">
          {headlineMetrics.map((item) => (
            <div key={item.label} className="vs-command-status-card">
              <div className="vs-command-status-label">{item.label}</div>
              <div className="vs-command-status-value">{item.value}</div>
              <div className={`vs-command-status-delta ${item.tone}`}>
                {item.delta}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="vs-command-grid">
        <div className="vs-card vs-command-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Priority Battleground Board</div>
              <div className="vs-card-subtitle">
                Top races requiring executive monitoring and rapid adjustments
              </div>
            </div>
            <button className="vs-card-link">Open full map</button>
          </div>

          <div className="vs-table">
            <div className="vs-table-head">
              <span>Race</span>
              <span>Win Prob.</span>
              <span>Momentum</span>
              <span>Risk</span>
              <span>Priority</span>
            </div>

            {battlegrounds.map((row) => (
              <div
                key={row.race}
                className="vs-table-row vs-table-row-five"
              >
                <span>{row.race}</span>
                <span>{row.probability}</span>
                <span className={toneClass(row.momentum)}>{row.momentum}</span>
                <span>{row.risk}</span>
                <span>{row.priority}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-command-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">War Room Feed</div>
              <div className="vs-card-subtitle">
                Live risk and narrative events entering the system
              </div>
            </div>
          </div>

          <div className="vs-warfeed">
            {warRoomFeed.map((item) => (
              <div key={`${item.time}-${item.title}`} className="vs-warfeed-item">
                <div className="vs-warfeed-time">{item.time}</div>
                <div className={`vs-warfeed-severity ${severityClass(item.severity)}`}>
                  {item.severity}
                </div>
                <div className="vs-warfeed-content">
                  <div className="vs-warfeed-title">{item.title}</div>
                  <div className="vs-warfeed-source">{item.source}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-command-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Executive Action Queue</div>
              <div className="vs-card-subtitle">
                Highest-leverage next steps for the next cycle
              </div>
            </div>
            <button className="vs-card-link">Send brief</button>
          </div>

          <div className="vs-action-list">
            {strategicActions.map((item) => (
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
        </div>

        <div className="vs-card vs-command-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Fundraising Pulse</div>
              <div className="vs-card-subtitle">
                Capital inflow by highest-performing network
              </div>
            </div>
          </div>

          <div className="vs-metric-list">
            {fundraisingLeaders.map((item) => (
              <div key={item.name} className="vs-metric-row">
                <div>
                  <div className="vs-metric-name">{item.name}</div>
                  <div className="vs-metric-sub">24-hour contribution channel</div>
                </div>
                <div className="vs-metric-values">
                  <div className="vs-metric-main">{item.amount}</div>
                  <div className={toneClass(item.change)}>{item.change}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-command-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Forecast Drivers</div>
              <div className="vs-card-subtitle">
                Variables with the largest modeled impact right now
              </div>
            </div>
          </div>

          <div className="vs-driver-list">
            {forecastDrivers.map((item) => (
              <div key={item.driver} className="vs-driver-item">
                <div className="vs-driver-topline">
                  <div className="vs-driver-name">{item.driver}</div>
                  <div className={`vs-driver-impact ${severityClass(item.impact)}`}>
                    {item.impact}
                  </div>
                </div>
                <div className="vs-driver-note">{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-command-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Regional Pressure Board</div>
              <div className="vs-card-subtitle">
                Relative strategic strength across operating theaters
              </div>
            </div>
          </div>

          <div className="vs-region-board">
            {regionalBoard.map((item) => (
              <div key={item.region} className="vs-region-card">
                <div className="vs-region-name">{item.region}</div>
                <div className="vs-region-score">{item.score}</div>
                <div className={`vs-region-trend ${toneClass(item.trend)}`}>
                  {item.trend}
                </div>
                <div className="vs-region-status">{item.status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default CommandCenter;
