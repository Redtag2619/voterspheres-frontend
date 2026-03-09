import React from "react";

const topMetrics = [
  { label: "Base Win Scenario", value: "54%", delta: "+2.1", tone: "up" },
  { label: "Upside Ceiling", value: "63%", delta: "+3.7", tone: "up" },
  { label: "Downside Risk", value: "41%", delta: "-2.9", tone: "down" },
  { label: "Model Confidence", value: "78", delta: "+4.2", tone: "up" }
];

const scenarioCards = [
  {
    title: "Base Case",
    probability: "44%",
    outcome: "Narrow control path with stable suburban gains and neutral media conditions.",
    status: "Most Likely"
  },
  {
    title: "Breakout Surge",
    probability: "27%",
    outcome: "Higher persuasion efficiency, strong women 35–54 turnout, and digital fundraising acceleration.",
    status: "Upside"
  },
  {
    title: "Narrative Shock",
    probability: "18%",
    outcome: "Negative media cycle compresses margins in two top-tier battlegrounds.",
    status: "Risk"
  },
  {
    title: "Late Momentum Wave",
    probability: "11%",
    outcome: "Debate overperformance and endorsement cascade improves final map position.",
    status: "Opportunity"
  }
];

const variableBoard = [
  {
    variable: "Suburban turnout +3%",
    impact: "+4.8",
    effect: "High",
    note: "Largest single turnout lever in the current model."
  },
  {
    variable: "Cost-of-living message gain",
    impact: "+3.9",
    effect: "High",
    note: "Strongest persuasion driver across independents and soft partisans."
  },
  {
    variable: "Bundler confidence recovery",
    impact: "+1.8",
    effect: "Medium",
    note: "Improves runway and stabilizes paid media planning."
  },
  {
    variable: "Negative press cycle",
    impact: "-3.2",
    effect: "High",
    note: "Fastest route to compressed margins in contested states."
  },
  {
    variable: "Field capacity expansion",
    impact: "+1.4",
    effect: "Medium",
    note: "Most valuable in western and exurban battleground zones."
  }
];

const battlegroundSim = [
  { race: "PA Senate", base: "54%", upside: "61%", downside: "47%", trigger: "Women suburban turnout" },
  { race: "GA Senate", base: "57%", upside: "64%", downside: "50%", trigger: "Rural + urban turnout mix" },
  { race: "AZ-01", base: "51%", upside: "58%", downside: "45%", trigger: "Independent crossover" },
  { race: "MI-07", base: "49%", upside: "56%", downside: "41%", trigger: "Media volatility" },
  { race: "NV-03", base: "53%", upside: "59%", downside: "47%", trigger: "Digital donor retention" }
];

const leverQueue = [
  {
    lever: "Reallocate 14% digital spend",
    payoff: "High",
    timeline: "24 hrs",
    detail: "Shift more spend into top-performing persuasion audiences in suburban battlegrounds."
  },
  {
    lever: "Deploy validator surrogates",
    payoff: "High",
    timeline: "48 hrs",
    detail: "Raise credibility in education and affordability message lanes."
  },
  {
    lever: "Increase field density west region",
    payoff: "Medium",
    timeline: "72 hrs",
    detail: "Target volunteer and GOTV lift in under-covered opportunity zones."
  },
  {
    lever: "Bundler reassurance brief",
    payoff: "Medium",
    timeline: "Today",
    detail: "Protect high-dollar stability and preserve media purchasing flexibility."
  }
];

const scenarioSignals = [
  {
    title: "Best upside path",
    note: "Affordability message discipline plus suburban turnout growth remains the cleanest route to improved probability."
  },
  {
    title: "Most fragile assumption",
    note: "Current model remains most exposed to local press instability in a small number of top-tier races."
  },
  {
    title: "Fastest actionable gain",
    note: "Paid-media reallocation and validator deployment could move two to three battlegrounds quickly."
  }
];

const simulationTimeline = [
  { phase: "Week 1", shift: "+0.8", note: "Message optimization and small-dollar growth" },
  { phase: "Week 2", shift: "+1.3", note: "Regional surrogate lift and turnout prep" },
  { phase: "Week 3", shift: "-0.6", note: "Potential earned media volatility" },
  { phase: "Week 4", shift: "+2.1", note: "Debate, endorsements, and late persuasion" }
];

function toneClass(value) {
  return String(value).startsWith("-") ? "down" : "up";
}

function effectClass(value) {
  const normalized = value.toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function statusClass(value) {
  const normalized = value.toLowerCase();
  if (normalized === "risk") return "high";
  if (normalized === "upside" || normalized === "opportunity") return "medium";
  return "low";
}

function percentWidth(value) {
  return { width: `${parseInt(value, 10)}%` };
}

function CampaignSimulator() {
  return (
    <div className="vs-simulator-page">
      <section className="vs-simulator-hero vs-card">
        <div>
          <div className="vs-section-eyebrow">Campaign Simulator</div>
          <h1 className="vs-simulator-title">
            Model what happens next before the political market gets there first.
          </h1>
          <p className="vs-simulator-copy">
            Test turnout shifts, message gains, donor confidence changes, media shocks, and execution decisions to see how they alter the path to victory.
          </p>
        </div>

        <div className="vs-simulator-hero-grid">
          {topMetrics.map((item) => (
            <div key={item.label} className="vs-simulator-stat-card">
              <div className="vs-simulator-stat-label">{item.label}</div>
              <div className="vs-simulator-stat-value">{item.value}</div>
              <div className={`vs-simulator-stat-delta ${item.tone}`}>{item.delta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="vs-simulator-grid">
        <div className="vs-card vs-simulator-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Scenario Deck</div>
              <div className="vs-card-subtitle">
                Most important modeled pathways across the next cycle
              </div>
            </div>
            <button className="vs-card-link">Run custom sim</button>
          </div>

          <div className="vs-sim-scenario-list">
            {scenarioCards.map((item) => (
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
        </div>

        <div className="vs-card vs-simulator-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Variable Impact Board</div>
              <div className="vs-card-subtitle">
                Which conditions move the model the most
              </div>
            </div>
          </div>

          <div className="vs-sim-variable-list">
            {variableBoard.map((item) => (
              <div key={item.variable} className="vs-sim-variable-item">
                <div className="vs-sim-variable-top">
                  <div className="vs-sim-variable-name">{item.variable}</div>
                  <div className={`vs-driver-impact ${effectClass(item.effect)}`}>
                    {item.effect}
                  </div>
                </div>
                <div className="vs-sim-variable-meta">
                  <span className={toneClass(item.impact)}>{item.impact}</span>
                  <span>{item.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-simulator-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Battleground Simulation Board</div>
              <div className="vs-card-subtitle">
                Base, upside, and downside ranges by priority race
              </div>
            </div>
            <button className="vs-card-link">Open forecast</button>
          </div>

          <div className="vs-table">
            <div className="vs-table-head">
              <span>Race</span>
              <span>Base</span>
              <span>Upside</span>
              <span>Downside</span>
              <span>Primary Trigger</span>
            </div>

            {battlegroundSim.map((row) => (
              <div key={row.race} className="vs-table-row vs-table-row-five">
                <span>{row.race}</span>
                <span>{row.base}</span>
                <span className="up">{row.upside}</span>
                <span className="down">{row.downside}</span>
                <span>{row.trigger}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-simulator-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Leverage Queue</div>
              <div className="vs-card-subtitle">
                Highest-payoff actions identified by the simulator
              </div>
            </div>
          </div>

          <div className="vs-sim-lever-list">
            {leverQueue.map((item) => (
              <div key={item.lever} className="vs-sim-lever-item">
                <div className="vs-sim-lever-top">
                  <div className="vs-sim-lever-title">{item.lever}</div>
                  <div className={`vs-driver-impact ${effectClass(item.payoff)}`}>
                    {item.payoff}
                  </div>
                </div>
                <div className="vs-sim-lever-time">{item.timeline}</div>
                <div className="vs-sim-lever-detail">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-simulator-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Simulation Timeline</div>
              <div className="vs-card-subtitle">
                Modeled movement by phase over the next four-week cycle
              </div>
            </div>
          </div>

          <div className="vs-sim-timeline-list">
            {simulationTimeline.map((item) => (
              <div key={item.phase} className="vs-sim-timeline-item">
                <div className="vs-sim-timeline-top">
                  <div className="vs-sim-timeline-phase">{item.phase}</div>
                  <div className={toneClass(item.shift)}>{item.shift}</div>
                </div>

                <div className="vs-sim-timeline-bar">
                  <div
                    className={`vs-sim-timeline-fill ${toneClass(item.shift)}`}
                    style={percentWidth(`${Math.min(Math.abs(parseFloat(item.shift)) * 25, 100)}%`)}
                  />
                </div>

                <div className="vs-sim-timeline-note">{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-simulator-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">AI Simulation Notes</div>
              <div className="vs-card-subtitle">
                Highest-signal interpretation from current simulation runs
              </div>
            </div>
            <button className="vs-card-link">Export model brief</button>
          </div>

          <div className="vs-ai-note-list">
            {scenarioSignals.map((item) => (
              <div key={item.title} className="vs-ai-note-item">
                <div className="vs-ai-note-title">{item.title}</div>
                <div className="vs-ai-note-detail">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default CampaignSimulator;
