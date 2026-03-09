import React from "react";

const topMetrics = [
  { label: "Active Donor Networks", value: "86", delta: "+7 this month", tone: "up" },
  { label: "Influence Clusters", value: "24", delta: "+3", tone: "up" },
  { label: "At-Risk Capital", value: "$4.2M", delta: "+8.1%", tone: "down" },
  { label: "High-Confidence Channels", value: "18", delta: "+5", tone: "up" }
];

const donorClusters = [
  {
    name: "Digital Small-Dollar Coalition",
    score: 93,
    trend: "+6.2",
    influence: "National",
    note: "Highest growth efficiency and strongest repeat-conversion engine."
  },
  {
    name: "National Finance Chairs",
    score: 89,
    trend: "+2.8",
    influence: "National",
    note: "Large-dollar backbone with high event conversion and durable reach."
  },
  {
    name: "Issue Advocacy Circle",
    score: 85,
    trend: "+4.7",
    influence: "Regional",
    note: "Accelerating around education and affordability messaging."
  },
  {
    name: "Regional Business Bloc",
    score: 78,
    trend: "-1.6",
    influence: "State",
    note: "Cooling after press instability and donor caution."
  }
];

const networkMap = [
  {
    cluster: "Northeast Finance Corridor",
    raised: "$5.8M",
    velocity: "+14%",
    confidence: "High",
    status: "Scaling"
  },
  {
    cluster: "Sun Belt Donor Circle",
    raised: "$4.4M",
    velocity: "+9%",
    confidence: "Medium",
    status: "Stable"
  },
  {
    cluster: "Midwest Advocacy Bloc",
    raised: "$3.1M",
    velocity: "+17%",
    confidence: "High",
    status: "Accelerating"
  },
  {
    cluster: "Mountain West Business Network",
    raised: "$2.0M",
    velocity: "-6%",
    confidence: "Low",
    status: "Watch"
  },
  {
    cluster: "Pacific Digital Donor Base",
    raised: "$4.9M",
    velocity: "+21%",
    confidence: "High",
    status: "Breakout"
  }
];

const donorAlerts = [
  {
    severity: "High",
    title: "Bundler confidence softening in Mountain West business network",
    note: "Recent press volatility is creating hesitation in top-dollar commitments."
  },
  {
    severity: "Medium",
    title: "Issue-based donor surge around affordability narrative",
    note: "Advocacy-aligned contributors are responding strongly to kitchen-table framing."
  },
  {
    severity: "Medium",
    title: "Northeast event conversion above prior-cycle benchmark",
    note: "Host pipeline and donor attendance rates remain strong."
  },
  {
    severity: "Low",
    title: "Recurring small-dollar cancellation pace improving",
    note: "Retention signals strengthened after reassurance messaging."
  }
];

const influenceLeaders = [
  {
    name: "Digital Small-Dollar Coalition",
    leverage: "92",
    expansion: "+5.8",
    category: "Acquisition + retention"
  },
  {
    name: "National Finance Chairs",
    leverage: "88",
    expansion: "+2.1",
    category: "Bundlers + events"
  },
  {
    name: "Issue Advocacy Circle",
    leverage: "84",
    expansion: "+4.3",
    category: "Narrative-aligned cash"
  },
  {
    name: "Pacific Digital Base",
    leverage: "81",
    expansion: "+6.7",
    category: "Online conversion engine"
  }
];

const capitalFlow = [
  {
    route: "Digital acquisition → recurring donor",
    value: "$1.8M",
    trend: "+19%",
    note: "Best-converting path in the current cycle."
  },
  {
    route: "Major event → bundler expansion",
    value: "$2.3M",
    trend: "+8%",
    note: "Reliable but more narrative-sensitive."
  },
  {
    route: "Advocacy issue list → campaign contribution",
    value: "$1.1M",
    trend: "+23%",
    note: "Strongest growth tied to issue salience."
  },
  {
    route: "Business network → PAC support",
    value: "$0.9M",
    trend: "-5%",
    note: "Cooling due to confidence concerns."
  }
];

const aiNotes = [
  {
    title: "Most valuable network right now",
    detail: "Digital small-dollar remains the most durable capital source because it combines scale, speed, and resilience."
  },
  {
    title: "Fastest-growing donor lane",
    detail: "Issue advocacy contributors are expanding fastest where narrative alignment is strongest."
  },
  {
    title: "Greatest donor-side vulnerability",
    detail: "Regional business donors remain the most exposed to confidence shocks from earned media instability."
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

function scoreWidth(value) {
  return { width: `${value}%` };
}

function DonorNetwork() {
  return (
    <div className="vs-donor-page">
      <section className="vs-donor-hero vs-card">
        <div>
          <div className="vs-section-eyebrow">Donor Network Intelligence</div>
          <h1 className="vs-donor-title">
            Track donor influence, capital movement, and network confidence across the political money map.
          </h1>
          <p className="vs-donor-copy">
            VoterSpheres maps how donor clusters behave, where capital is flowing, and which networks can most shape a campaign’s strategic runway.
          </p>
        </div>

        <div className="vs-donor-hero-grid">
          {topMetrics.map((item) => (
            <div key={item.label} className="vs-donor-stat-card">
              <div className="vs-donor-stat-label">{item.label}</div>
              <div className="vs-donor-stat-value">{item.value}</div>
              <div className={`vs-donor-stat-delta ${item.tone}`}>{item.delta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="vs-donor-grid">
        <div className="vs-card vs-donor-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Donor Cluster Strength</div>
              <div className="vs-card-subtitle">
                Highest-performing ecosystems by influence and reliability
              </div>
            </div>
            <button className="vs-card-link">Open full graph</button>
          </div>

          <div className="vs-donor-cluster-list">
            {donorClusters.map((item) => (
              <div key={item.name} className="vs-donor-cluster-item">
                <div className="vs-donor-cluster-top">
                  <div>
                    <div className="vs-donor-cluster-name">{item.name}</div>
                    <div className="vs-donor-cluster-scope">{item.influence} influence</div>
                  </div>

                  <div className="vs-donor-cluster-side">
                    <div className="vs-donor-cluster-score">{item.score}</div>
                    <div className={toneClass(item.trend)}>{item.trend}</div>
                  </div>
                </div>

                <div className="vs-donor-cluster-bar">
                  <div className="vs-donor-cluster-fill" style={scoreWidth(item.score)} />
                </div>

                <div className="vs-donor-cluster-note">{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-donor-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Regional Network Map</div>
              <div className="vs-card-subtitle">
                Capital velocity, confidence, and network condition by cluster
              </div>
            </div>
          </div>

          <div className="vs-table">
            <div className="vs-table-head">
              <span>Cluster</span>
              <span>Raised</span>
              <span>Velocity</span>
              <span>Confidence</span>
              <span>Status</span>
            </div>

            {networkMap.map((row) => (
              <div key={row.cluster} className="vs-table-row vs-table-row-five">
                <span>{row.cluster}</span>
                <span>{row.raised}</span>
                <span className={toneClass(row.velocity)}>{row.velocity}</span>
                <span>{row.confidence}</span>
                <span>{row.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-donor-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Donor Alert Feed</div>
              <div className="vs-card-subtitle">
                Early-warning signals across donor confidence and behavior
              </div>
            </div>
          </div>

          <div className="vs-donor-alert-list">
            {donorAlerts.map((item) => (
              <div key={item.title} className="vs-donor-alert-item">
                <div className={`vs-donor-alert-severity ${severityClass(item.severity)}`}>
                  {item.severity}
                </div>
                <div className="vs-donor-alert-body">
                  <div className="vs-donor-alert-title">{item.title}</div>
                  <div className="vs-donor-alert-note">{item.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-donor-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Influence Leaders</div>
              <div className="vs-card-subtitle">
                Networks with the highest strategic leverage right now
              </div>
            </div>
          </div>

          <div className="vs-influence-list">
            {influenceLeaders.map((item) => (
              <div key={item.name} className="vs-influence-item">
                <div className="vs-influence-top">
                  <div>
                    <div className="vs-influence-name">{item.name}</div>
                    <div className="vs-influence-category">{item.category}</div>
                  </div>

                  <div className="vs-influence-side">
                    <div className="vs-influence-score">{item.leverage}</div>
                    <div className={toneClass(item.expansion)}>{item.expansion}</div>
                  </div>
                </div>

                <div className="vs-influence-bar">
                  <div className="vs-influence-fill" style={scoreWidth(item.leverage)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-donor-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Capital Flow Routes</div>
              <div className="vs-card-subtitle">
                The most important money pathways entering the campaign
              </div>
            </div>
          </div>

          <div className="vs-capital-flow-list">
            {capitalFlow.map((item) => (
              <div key={item.route} className="vs-capital-flow-item">
                <div className="vs-capital-flow-top">
                  <div className="vs-capital-flow-route">{item.route}</div>
                  <div className="vs-capital-flow-value">{item.value}</div>
                </div>
                <div className="vs-capital-flow-meta">
                  <span className={toneClass(item.trend)}>{item.trend}</span>
                  <span>{item.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-donor-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">AI Donor Notes</div>
              <div className="vs-card-subtitle">
                Machine-assisted interpretation of donor-network strength
              </div>
            </div>
            <button className="vs-card-link">Export note</button>
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

export default DonorNetwork;
