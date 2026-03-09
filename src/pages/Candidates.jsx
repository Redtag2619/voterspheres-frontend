import React from "react";

const topMetrics = [
  { label: "Tracked Candidates", value: "248", delta: "+14 this week", tone: "up" },
  { label: "High-Risk Profiles", value: "19", delta: "+3", tone: "down" },
  { label: "Momentum Leaders", value: "27", delta: "+6", tone: "up" },
  { label: "Persuasion Targets", value: "41", delta: "+5", tone: "up" }
];

const featuredCandidates = [
  {
    name: "Elena Garcia",
    office: "U.S. Senate / Pennsylvania",
    party: "Democratic",
    rating: "94.8",
    momentum: "+2.4",
    risk: "Low",
    cash: "$19.2M",
    narrative: "Strong affordability frame and high fundraising efficiency."
  },
  {
    name: "Marcus Coleman",
    office: "U.S. Senate / Georgia",
    party: "Republican",
    rating: "92.7",
    momentum: "+1.8",
    risk: "Medium",
    cash: "$17.8M",
    narrative: "Turnout machine strengthening, but press volatility rising."
  },
  {
    name: "Tara Mitchell",
    office: "U.S. House / AZ-01",
    party: "Independent",
    rating: "89.4",
    momentum: "+3.1",
    risk: "Medium",
    cash: "$8.9M",
    narrative: "Best persuasion gains in suburban women 35–54 segment."
  },
  {
    name: "David Rivers",
    office: "U.S. House / MI-07",
    party: "Democratic",
    rating: "88.6",
    momentum: "+5.0",
    risk: "High",
    cash: "$7.2M",
    narrative: "Breakout momentum, but vulnerable to late media shocks."
  }
];

const candidateBoard = [
  {
    name: "Elena Garcia",
    district: "PA Senate",
    party: "D",
    favorability: "52",
    funds: "$19.2M",
    momentum: "+2.4",
    status: "Leader"
  },
  {
    name: "Marcus Coleman",
    district: "GA Senate",
    party: "R",
    favorability: "50",
    funds: "$17.8M",
    momentum: "+1.8",
    status: "Leader"
  },
  {
    name: "Tara Mitchell",
    district: "AZ-01",
    party: "I",
    favorability: "48",
    funds: "$8.9M",
    momentum: "+3.1",
    status: "Climbing"
  },
  {
    name: "David Rivers",
    district: "MI-07",
    party: "D",
    favorability: "47",
    funds: "$7.2M",
    momentum: "+5.0",
    status: "Breakout"
  },
  {
    name: "Claire Warren",
    district: "WI Senate",
    party: "R",
    favorability: "46",
    funds: "$11.3M",
    momentum: "-1.7",
    status: "Pressure"
  },
  {
    name: "Jon Hale",
    district: "NV Senate",
    party: "R",
    favorability: "49",
    funds: "$10.1M",
    momentum: "+0.7",
    status: "Stable"
  }
];

const vulnerabilities = [
  {
    candidate: "David Rivers",
    severity: "High",
    issue: "Local press sensitivity",
    note: "One unfavorable cycle could compress advantage quickly."
  },
  {
    candidate: "Claire Warren",
    severity: "High",
    issue: "Message fragmentation",
    note: "Current issue mix is reducing persuasion efficiency."
  },
  {
    candidate: "Marcus Coleman",
    severity: "Medium",
    issue: "Bundler confidence wobble",
    note: "Finance network needs reassurance after regional coverage."
  },
  {
    candidate: "Tara Mitchell",
    severity: "Medium",
    issue: "Base enthusiasm ceiling",
    note: "Needs turnout reinforcement while persuasion remains strong."
  }
];

const opportunities = [
  {
    candidate: "Elena Garcia",
    upside: "Women 35–54 suburban growth",
    note: "Best conversion path remains affordability + validator messaging."
  },
  {
    candidate: "Tara Mitchell",
    upside: "Independent crossover vote",
    note: "High-potential lane in late undecided universe."
  },
  {
    candidate: "Marcus Coleman",
    upside: "Rural turnout expansion",
    note: "Field density and surrogate scheduling can still raise ceiling."
  },
  {
    candidate: "Jon Hale",
    upside: "Donor confidence stability",
    note: "More efficient capital use could improve media share fast."
  }
];

const aiNotes = [
  {
    title: "Most resilient candidate profile",
    detail: "Garcia currently combines the strongest finance position, issue ownership, and lowest narrative risk."
  },
  {
    title: "Highest upside challenger",
    detail: "Mitchell has the best probability of late-cycle ranking acceleration if crossover persuasion holds."
  },
  {
    title: "Biggest hidden risk",
    detail: "Rivers is outperforming on momentum, but remains more exposed to local media shocks than peers."
  }
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

function ratingWidth(value) {
  return { width: `${value}%` };
}

function Candidates() {
  return (
    <div className="vs-candidates-page">
      <section className="vs-candidates-hero vs-card">
        <div>
          <div className="vs-section-eyebrow">Candidate Intelligence</div>
          <h1 className="vs-candidates-title">
            The live directory for candidate strength, vulnerability, money, message, and movement.
          </h1>
          <p className="vs-candidates-copy">
            Monitor top candidate profiles across competitive races with strategist-grade signals on fundraising, narrative control, favorability, and path-to-win potential.
          </p>
        </div>

        <div className="vs-candidates-hero-grid">
          {topMetrics.map((item) => (
            <div key={item.label} className="vs-candidates-stat-card">
              <div className="vs-candidates-stat-label">{item.label}</div>
              <div className="vs-candidates-stat-value">{item.value}</div>
              <div className={`vs-candidates-stat-delta ${item.tone}`}>{item.delta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="vs-candidates-grid">
        <div className="vs-card vs-candidates-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Featured Candidate Profiles</div>
              <div className="vs-card-subtitle">
                Highest-priority profiles in the current cycle
              </div>
            </div>
            <button className="vs-card-link">Open full directory</button>
          </div>

          <div className="vs-featured-candidate-list">
            {featuredCandidates.map((item) => (
              <div key={item.name} className="vs-featured-candidate-item">
                <div className="vs-featured-candidate-top">
                  <div>
                    <div className="vs-featured-candidate-name">{item.name}</div>
                    <div className="vs-featured-candidate-office">{item.office}</div>
                  </div>

                  <div className="vs-featured-candidate-badges">
                    <span className="vs-featured-party">{item.party}</span>
                    <span className={`vs-featured-risk ${severityClass(item.risk)}`}>
                      {item.risk} Risk
                    </span>
                  </div>
                </div>

                <div className="vs-featured-candidate-metrics">
                  <div>
                    <div className="vs-featured-metric-label">Rating</div>
                    <div className="vs-featured-metric-value">{item.rating}</div>
                  </div>
                  <div>
                    <div className="vs-featured-metric-label">Momentum</div>
                    <div className={`vs-featured-metric-value ${toneClass(item.momentum)}`}>
                      {item.momentum}
                    </div>
                  </div>
                  <div>
                    <div className="vs-featured-metric-label">Cash</div>
                    <div className="vs-featured-metric-value">{item.cash}</div>
                  </div>
                </div>

                <div className="vs-featured-candidate-bar">
                  <div className="vs-featured-candidate-fill" style={ratingWidth(item.rating)} />
                </div>

                <div className="vs-featured-candidate-note">{item.narrative}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-candidates-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Candidate Market Board</div>
              <div className="vs-card-subtitle">
                Core metrics across priority campaigns
              </div>
            </div>
          </div>

          <div className="vs-table">
            <div className="vs-table-head">
              <span>Name</span>
              <span>Race</span>
              <span>Party</span>
              <span>Fav.</span>
              <span>Funds</span>
              <span>Momentum</span>
              <span>Status</span>
            </div>

            {candidateBoard.map((row) => (
              <div key={`${row.name}-${row.district}`} className="vs-table-row vs-table-row-seven">
                <span>{row.name}</span>
                <span>{row.district}</span>
                <span>{row.party}</span>
                <span>{row.favorability}</span>
                <span>{row.funds}</span>
                <span className={toneClass(row.momentum)}>{row.momentum}</span>
                <span>{row.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-candidates-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Vulnerability Monitor</div>
              <div className="vs-card-subtitle">
                Where candidate profiles show the most exposure
              </div>
            </div>
          </div>

          <div className="vs-candidate-risk-list">
            {vulnerabilities.map((item) => (
              <div key={`${item.candidate}-${item.issue}`} className="vs-candidate-risk-item">
                <div className={`vs-candidate-risk-severity ${severityClass(item.severity)}`}>
                  {item.severity}
                </div>
                <div className="vs-candidate-risk-body">
                  <div className="vs-candidate-risk-title">
                    {item.candidate} — {item.issue}
                  </div>
                  <div className="vs-candidate-risk-note">{item.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-candidates-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Opportunity Watch</div>
              <div className="vs-card-subtitle">
                Highest-upside candidate growth paths
              </div>
            </div>
          </div>

          <div className="vs-candidate-opportunity-list">
            {opportunities.map((item) => (
              <div key={`${item.candidate}-${item.upside}`} className="vs-candidate-opportunity-item">
                <div className="vs-candidate-opportunity-top">
                  <div className="vs-candidate-opportunity-name">{item.candidate}</div>
                  <div className="vs-candidate-opportunity-upside">{item.upside}</div>
                </div>
                <div className="vs-candidate-opportunity-note">{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-candidates-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">AI Candidate Notes</div>
              <div className="vs-card-subtitle">
                Machine-assisted read on profile quality and risk
              </div>
            </div>
            <button className="vs-card-link">Export brief</button>
          </div>

          <div className="vs-ai-note-list">
            {aiNotes.map((item) => (
              <div key={item.title} className="vs-ai-note-item">
                <div className="vs-ai-note-title">{item.title}</div>
                <div className="vs-ai-note-detail">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Candidates;
