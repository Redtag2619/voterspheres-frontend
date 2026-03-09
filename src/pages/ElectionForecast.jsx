import React from "react";

const nationalOutlook = [
  { label: "National Control Probability", value: "58%", delta: "+3.1", tone: "up" },
  { label: "Battleground Volatility", value: "High", delta: "+7 signals", tone: "down" },
  { label: "Turnout Confidence", value: "72", delta: "+4.8", tone: "up" },
  { label: "Persuasion Efficiency", value: "8.3", delta: "+0.9", tone: "up" }
];

const marketBoard = [
  { race: "PA Senate", winProb: 54, change: "+2.1", rating: "Lean", status: "Momentum Up" },
  { race: "GA Senate", winProb: 57, change: "+2.9", rating: "Lean", status: "Improving" },
  { race: "AZ-01", winProb: 51, change: "+1.4", rating: "Toss-up", status: "Watch" },
  { race: "MI-07", winProb: 49, change: "-0.8", rating: "Toss-up", status: "Pressure" },
  { race: "NV-03", winProb: 53, change: "+0.7", rating: "Lean", status: "Stable" },
  { race: "WI Senate", winProb: 48, change: "-1.6", rating: "Tilt", status: "Risk Rising" }
];

const scenarioDeck = [
  {
    title: "Base Case",
    probability: "44%",
    summary: "Stable suburban gains, neutral press environment, and disciplined fundraising continuation."
  },
  {
    title: "Upside Breakout",
    probability: "27%",
    summary: "Higher small-dollar conversion, stronger women 35–54 turnout, and message dominance on affordability."
  },
  {
    title: "Adverse Shock",
    probability: "18%",
    summary: "Negative press cycle, donor hesitation, and compressed persuasion efficiency in top-tier races."
  },
  {
    title: "Late Momentum Surge",
    probability: "11%",
    summary: "Debate overperformance, endorsement chain reaction, and favorable local media framing."
  }
];

const forecastDrivers = [
  {
    driver: "Suburban women turnout",
    weight: "High",
    impact: "+4.3",
    note: "Single most important turnout lever in current path model."
  },
  {
    driver: "Cost-of-living message ownership",
    weight: "High",
    impact: "+3.8",
    note: "Narrative discipline is improving persuasion conversion."
  },
  {
    driver: "Finance network confidence",
    weight: "Medium",
    impact: "+1.9",
    note: "Bundler reassurance stabilizing larger-dollar channel."
  },
  {
    driver: "Volunteer density in west region",
    weight: "Medium",
    impact: "+1.2",
    note: "Field reallocation offers measurable turnout upside."
  },
  {
    driver: "Negative press cycle risk",
    weight: "High",
    impact: "-2.7",
    note: "One bad week could compress margin in two senate contests."
  }
];

const battlegroundStates = [
  { state: "Pennsylvania", index: 76, shift: "+4.1", outlook: "Advantage" },
  { state: "Georgia", index: 68, shift: "+2.6", outlook: "Competitive+" },
  { state: "Arizona", index: 61, shift: "+1.9", outlook: "Competitive" },
  { state: "Michigan", index: 55, shift: "-0.8", outlook: "Watch" },
  { state: "Nevada", index: 59, shift: "+0.4", outlook: "Competitive" },
  { state: "Wisconsin", index: 52, shift: "-1.7", outlook: "Pressure" }
];

const momentumBands = [
  { label: "Safe / Strong", seats: 18, colorClass: "strong" },
  { label: "Lean", seats: 24, colorClass: "lean" },
  { label: "Toss-up", seats: 16, colorClass: "tossup" },
  { label: "Tilt Opponent", seats: 11, colorClass: "risk" }
];

const aiSignals = [
  {
    title: "Probability curve steepening in top suburban districts",
    detail: "Model confidence is improving where affordability messaging and female turnout indicators are aligning."
  },
  {
    title: "Most efficient growth path remains persuasion + local validation",
    detail: "Broad national messaging is less efficient than district-tuned validator deployment."
  },
  {
    title: "Risk remains concentrated in media volatility rather than field weakness",
    detail: "Operational execution is stable; narrative shocks remain the most credible downside."
  }
];

function toneClass(value) {
  return String(value).startsWith("-") ? "down" : "up";
}

function probabilityWidth(value) {
  return { width: `${value}%` };
}

function weightClass(value) {
  const v = value.toLowerCase();
  if (v === "high") return "high";
  if (v === "medium") return "medium";
  return "low";
}

function bandWidth(seats) {
  return { width: `${Math.max(12, seats * 2)}%` };
}

function ElectionForecast() {
  return (
    <div className="vs-forecast-page">
      <section className="vs-forecast-hero vs-card">
        <div>
          <div className="vs-section-eyebrow">Election Forecast Terminal</div>
          <h1 className="vs-forecast-title">
            Probability, momentum, and scenario intelligence for the races that will decide control.
          </h1>
          <p className="vs-forecast-copy">
            Track modeled win probability, battleground movement, scenario ranges, and the variables that most affect the path to victory.
          </p>
        </div>

        <div className="vs-forecast-hero-grid">
          {nationalOutlook.map((item) => (
            <div key={item.label} className="vs-forecast-stat-card">
              <div className="vs-forecast-stat-label">{item.label}</div>
              <div className="vs-forecast-stat-value">{item.value}</div>
              <div className={`vs-forecast-stat-delta ${item.tone}`}>{item.delta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="vs-forecast-grid">
        <div className="vs-card vs-forecast-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Race Probability Board</div>
              <div className="vs-card-subtitle">
                Live model snapshot across top contested races
              </div>
            </div>
            <button className="vs-card-link">Open map view</button>
          </div>

          <div className="vs-probability-board">
            {marketBoard.map((row) => (
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
        </div>

        <div className="vs-card vs-forecast-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Scenario Deck</div>
              <div className="vs-card-subtitle">
                Most likely modeled pathways over the next cycle
              </div>
            </div>
          </div>

          <div className="vs-scenario-list">
            {scenarioDeck.map((item) => (
              <div key={item.title} className="vs-scenario-item">
                <div className="vs-scenario-topline">
                  <div className="vs-scenario-title">{item.title}</div>
                  <div className="vs-scenario-probability">{item.probability}</div>
                </div>
                <div className="vs-scenario-summary">{item.summary}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-forecast-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Forecast Drivers</div>
              <div className="vs-card-subtitle">
                Variables with the strongest impact on win probability
              </div>
            </div>
          </div>

          <div className="vs-driver-table">
            {forecastDrivers.map((item) => (
              <div key={item.driver} className="vs-driver-row">
                <div className="vs-driver-main">
                  <div className="vs-driver-name">{item.driver}</div>
                  <div className="vs-driver-note">{item.note}</div>
                </div>

                <div className="vs-driver-side">
                  <div className={`vs-driver-weight ${weightClass(item.weight)}`}>
                    {item.weight}
                  </div>
                  <div className={toneClass(item.impact)}>{item.impact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-forecast-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Battleground State Index</div>
              <div className="vs-card-subtitle">
                Relative forecast strength by priority state
              </div>
            </div>
          </div>

          <div className="vs-state-index-list">
            {battlegroundStates.map((item) => (
              <div key={item.state} className="vs-state-index-item">
                <div className="vs-state-index-top">
                  <div className="vs-state-name">{item.state}</div>
                  <div className="vs-state-index-score">{item.index}</div>
                </div>

                <div className="vs-state-index-bar">
                  <div
                    className="vs-state-index-fill"
                    style={probabilityWidth(item.index)}
                  />
                </div>

                <div className="vs-state-index-meta">
                  <span className={toneClass(item.shift)}>{item.shift}</span>
                  <span>{item.outlook}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-forecast-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Control Momentum Bands</div>
              <div className="vs-card-subtitle">
                Distribution of contests across confidence ranges
              </div>
            </div>
          </div>

          <div className="vs-band-list">
            {momentumBands.map((item) => (
              <div key={item.label} className="vs-band-item">
                <div className="vs-band-topline">
                  <div className="vs-band-label">{item.label}</div>
                  <div className="vs-band-seats">{item.seats} seats</div>
                </div>

                <div className="vs-band-bar">
                  <div
                    className={`vs-band-fill ${item.colorClass}`}
                    style={bandWidth(item.seats)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-forecast-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">AI Forecast Notes</div>
              <div className="vs-card-subtitle">
                Highest-signal model interpretation
              </div>
            </div>
            <button className="vs-card-link">Export note</button>
          </div>

          <div className="vs-ai-note-list">
            {aiSignals.map((item) => (
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

export default ElectionForecast;
