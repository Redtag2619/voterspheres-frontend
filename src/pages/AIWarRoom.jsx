import React from "react";

const liveThreats = [
  {
    title: "Cost-of-living attack cluster accelerating in suburban paid media",
    severity: "High",
    source: "Ad monitoring",
    velocity: "+38%",
    recommendation: "Deploy affordability rebuttal pack across surrogates and rapid-response channels."
  },
  {
    title: "Education narrative moving from fringe content into mainstream local pickup",
    severity: "Medium",
    source: "Media monitoring",
    velocity: "+21%",
    recommendation: "Push validator-driven local messaging and district-specific contrast points."
  },
  {
    title: "Donor confidence wobble after negative press cycle",
    severity: "High",
    source: "Finance sentiment",
    velocity: "+16%",
    recommendation: "Send reassurance brief with path-to-win model and recent fundraising pulse."
  },
  {
    title: "Opponent clip outperforming baseline share rates in youth audiences",
    severity: "Medium",
    source: "Social velocity",
    velocity: "+27%",
    recommendation: "Counter with creator-ready short-form response and values-based frame."
  }
];

const narrativeHeat = [
  { topic: "Cost of Living", intensity: 88, change: "+12" },
  { topic: "Education", intensity: 74, change: "+8" },
  { topic: "Border / Security", intensity: 63, change: "-3" },
  { topic: "Healthcare", intensity: 58, change: "+5" },
  { topic: "Economy / Jobs", intensity: 81, change: "+9" }
];

const responseQueue = [
  {
    priority: "P1",
    owner: "Rapid Response",
    item: "Finalize affordability contrast memo",
    eta: "45 min"
  },
  {
    priority: "P1",
    owner: "Digital",
    item: "Cut rebuttal vertical video package",
    eta: "1 hr"
  },
  {
    priority: "P2",
    owner: "Comms",
    item: "Draft surrogate talking points for local radio",
    eta: "2 hrs"
  },
  {
    priority: "P2",
    owner: "Finance",
    item: "Issue donor confidence note",
    eta: "Today"
  }
];

const signalStream = [
  {
    time: "08:44",
    channel: "Cable / Clips",
    text: "Opposition segment repetition rate crossed high-risk threshold in two battleground markets."
  },
  {
    time: "09:12",
    channel: "Social / X",
    text: "Narrative crossover detected from activist accounts to persuadable audience clusters."
  },
  {
    time: "10:03",
    channel: "Search / Trends",
    text: "Keyword volume for affordability contrast rose sharply after local story pickup."
  },
  {
    time: "11:28",
    channel: "Press / Local",
    text: "Regional reporter framing shifted from neutral to skeptical in one senate market."
  }
];

const messagePerformance = [
  {
    message: "Affordability + kitchen table contrast",
    score: "9.1",
    action: "Scale immediately"
  },
  {
    message: "Local schools + stability frame",
    score: "8.4",
    action: "Use with validators"
  },
  {
    message: "Jobs and business confidence",
    score: "7.6",
    action: "Refine target segments"
  },
  {
    message: "Democracy / norms defense",
    score: "6.2",
    action: "Reserve for base"
  }
];

const suggestedDrafts = [
  {
    type: "Press Statement",
    headline: "New contrast statement for cost-of-living attacks",
    preview: "Families need results, not recycled political noise. Our plan lowers everyday costs and protects working households..."
  },
  {
    type: "Surrogate Brief",
    headline: "Morning validator script",
    preview: "Lead with local costs, pivot to accountability, close with practical action and community impact..."
  },
  {
    type: "Digital Response",
    headline: "15-second rebuttal concept",
    preview: "Open with attack claim, cut to fact frame, land on trusted messenger and direct contrast..."
  }
];

function severityClass(value) {
  const normalized = value.toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function deltaClass(value) {
  return String(value).startsWith("-") ? "down" : "up";
}

function intensityWidth(value) {
  return { width: `${value}%` };
}

function AIWarRoom() {
  return (
    <div className="vs-warroom-page">
      <section className="vs-warroom-hero vs-card">
        <div>
          <div className="vs-section-eyebrow">AI War Room</div>
          <h1 className="vs-warroom-title">
            Detect threats early, shape the narrative fast, and move before the market does.
          </h1>
          <p className="vs-warroom-copy">
            AI War Room watches message velocity, media framing, donor sentiment, and emerging attack patterns so your campaign can respond with speed and precision.
          </p>
        </div>

        <div className="vs-warroom-hero-stats">
          <div className="vs-warroom-stat-card">
            <div className="vs-warroom-stat-label">Active Threats</div>
            <div className="vs-warroom-stat-value">12</div>
            <div className="vs-warroom-stat-delta down">+3 in last 6 hrs</div>
          </div>

          <div className="vs-warroom-stat-card">
            <div className="vs-warroom-stat-label">Narrative Spikes</div>
            <div className="vs-warroom-stat-value">7</div>
            <div className="vs-warroom-stat-delta up">2 containable</div>
          </div>

          <div className="vs-warroom-stat-card">
            <div className="vs-warroom-stat-label">Response Window</div>
            <div className="vs-warroom-stat-value">43 min</div>
            <div className="vs-warroom-stat-delta neutral">Average target</div>
          </div>
        </div>
      </section>

      <section className="vs-warroom-grid">
        <div className="vs-card vs-warroom-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Live Threat Board</div>
              <div className="vs-card-subtitle">
                Highest-priority attacks and adverse narrative acceleration
              </div>
            </div>
            <button className="vs-card-link">Escalate all</button>
          </div>

          <div className="vs-threat-list">
            {liveThreats.map((item) => (
              <div key={item.title} className="vs-threat-item">
                <div className={`vs-threat-severity ${severityClass(item.severity)}`}>
                  {item.severity}
                </div>

                <div className="vs-threat-body">
                  <div className="vs-threat-title">{item.title}</div>

                  <div className="vs-threat-meta">
                    <span>{item.source}</span>
                    <span className={deltaClass(item.velocity)}>{item.velocity}</span>
                  </div>

                  <div className="vs-threat-recommendation">
                    {item.recommendation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-warroom-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Response Queue</div>
              <div className="vs-card-subtitle">
                Immediate tactical moves for the next cycle
              </div>
            </div>
          </div>

          <div className="vs-response-queue">
            {responseQueue.map((item) => (
              <div key={item.item} className="vs-response-item">
                <div className="vs-response-topline">
                  <div className="vs-response-priority">{item.priority}</div>
                  <div className="vs-response-eta">{item.eta}</div>
                </div>
                <div className="vs-response-title">{item.item}</div>
                <div className="vs-response-owner">Owner: {item.owner}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-warroom-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Narrative Heat Map</div>
              <div className="vs-card-subtitle">
                Issues with the strongest pressure and growth rates
              </div>
            </div>
          </div>

          <div className="vs-heat-list">
            {narrativeHeat.map((item) => (
              <div key={item.topic} className="vs-heat-item">
                <div className="vs-heat-row">
                  <span className="vs-heat-topic">{item.topic}</span>
                  <span className={`vs-heat-change ${deltaClass(item.change)}`}>
                    {item.change}
                  </span>
                </div>

                <div className="vs-heat-bar">
                  <div className="vs-heat-bar-fill" style={intensityWidth(item.intensity)} />
                </div>

                <div className="vs-heat-intensity">Intensity {item.intensity}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-warroom-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Signal Stream</div>
              <div className="vs-card-subtitle">
                Cross-channel intelligence entering the terminal
              </div>
            </div>
          </div>

          <div className="vs-signal-stream">
            {signalStream.map((item) => (
              <div key={`${item.time}-${item.channel}`} className="vs-signal-item">
                <div className="vs-signal-time">{item.time}</div>
                <div className="vs-signal-content">
                  <div className="vs-signal-channel">{item.channel}</div>
                  <div className="vs-signal-text">{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-warroom-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Message Performance</div>
              <div className="vs-card-subtitle">
                Frames currently producing the strongest response
              </div>
            </div>
          </div>

          <div className="vs-table">
            <div className="vs-table-head">
              <span>Message</span>
              <span>Score</span>
              <span>Action</span>
            </div>

            {messagePerformance.map((row) => (
              <div key={row.message} className="vs-table-row">
                <span>{row.message}</span>
                <span className="up">{row.score}</span>
                <span>{row.action}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-warroom-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">AI Drafts Ready</div>
              <div className="vs-card-subtitle">
                Suggested responses generated from current threat context
              </div>
            </div>
            <button className="vs-card-link">Open composer</button>
          </div>

          <div className="vs-draft-list">
            {suggestedDrafts.map((item) => (
              <div key={item.headline} className="vs-draft-item">
                <div className="vs-draft-type">{item.type}</div>
                <div className="vs-draft-headline">{item.headline}</div>
                <div className="vs-draft-preview">{item.preview}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AIWarRoom;
