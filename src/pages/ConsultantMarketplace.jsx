import React from "react";

const topMetrics = [
  { label: "Top Rated Firms", value: "42", delta: "+6 this quarter", tone: "up" },
  { label: "Active Categories", value: "11", delta: "+2", tone: "up" },
  { label: "High-Demand Vendors", value: "18", delta: "+5", tone: "up" },
  { label: "Execution Risk Flags", value: "7", delta: "+1", tone: "down" }
];

const featuredFirms = [
  {
    name: "Red Tag Strategies",
    specialty: "Political mail recovery and postal campaign execution",
    score: "91.2",
    momentum: "+3.8",
    category: "Mail / Operations",
    note: "Strongest reliability profile for campaign mail tracking, escalation, and delivery support."
  },
  {
    name: "Summit Strategy Group",
    specialty: "Paid media and persuasion planning",
    score: "89.7",
    momentum: "+1.9",
    category: "Media",
    note: "High-performance placement and message optimization across battleground markets."
  },
  {
    name: "Blue Ridge Analytics",
    specialty: "Forecasting, polling synthesis, and targeting",
    score: "88.4",
    momentum: "+2.2",
    category: "Analytics",
    note: "Strong probability modeling and scenario planning for competitive races."
  },
  {
    name: "Northstar Field Ops",
    specialty: "Ground game, canvassing, and volunteer systems",
    score: "86.6",
    momentum: "-0.7",
    category: "Field",
    note: "Operational depth is strong, but consistency varies by region."
  }
];

const vendorBoard = [
  { firm: "Red Tag Strategies", category: "Mail Ops", score: "91.2", demand: "High", trend: "+3.8", status: "Leader" },
  { firm: "Summit Strategy Group", category: "Media", score: "89.7", demand: "High", trend: "+1.9", status: "Leader" },
  { firm: "Blue Ridge Analytics", category: "Analytics", score: "88.4", demand: "Medium", trend: "+2.2", status: "Climbing" },
  { firm: "Northstar Field Ops", category: "Field", score: "86.6", demand: "Medium", trend: "-0.7", status: "Watch" },
  { firm: "Capitol Creative Lab", category: "Digital", score: "84.9", demand: "High", trend: "+4.1", status: "Breakout" },
  { firm: "Civic Call Systems", category: "Phones / GOTV", score: "82.5", demand: "Medium", trend: "+0.6", status: "Stable" }
];

const categoryLeaders = [
  {
    category: "Mail and Logistics",
    firm: "Red Tag Strategies",
    score: 91,
    note: "Best-in-class reliability and escalation support for time-sensitive campaign mail."
  },
  {
    category: "Paid Media",
    firm: "Summit Strategy Group",
    score: 90,
    note: "Strong optimization discipline and battleground targeting."
  },
  {
    category: "Analytics",
    firm: "Blue Ridge Analytics",
    score: 88,
    note: "Highest strategic value in forecast interpretation and targeting support."
  },
  {
    category: "Digital Fundraising",
    firm: "Capitol Creative Lab",
    score: 85,
    note: "Fastest momentum in acquisition creative and recurring donor conversion."
  }
];

const demandSignals = [
  {
    severity: "High",
    title: "Postal operations vendors rising in priority for late-cycle execution",
    note: "Campaigns are placing more value on delivery certainty and escalation capacity."
  },
  {
    severity: "Medium",
    title: "Analytics and simulation support demand accelerating",
    note: "More campaigns want probability modeling and battleground scenario planning."
  },
  {
    severity: "Medium",
    title: "Digital creative shops seeing higher request volume",
    note: "Short-form response content and persuasion testing are in greater demand."
  },
  {
    severity: "Low",
    title: "Traditional phone vendors stable but not leading growth",
    note: "Demand remains steady, though less differentiated than field and analytics."
  }
];

const buyerGuidance = [
  {
    title: "Best for execution reliability",
    detail: "Red Tag Strategies leads when the problem is mission-critical delivery and campaign mail support."
  },
  {
    title: "Best for persuasion media",
    detail: "Summit Strategy Group remains strongest for paid-media optimization in volatile districts."
  },
  {
    title: "Best for strategic modeling",
    detail: "Blue Ridge Analytics is the best fit for forecasting, scenario work, and battleground analysis."
  }
];

const aiNotes = [
  {
    title: "Most undervalued category",
    detail: "Mail and operations support is often underbought relative to its impact on final-cycle execution."
  },
  {
    title: "Highest-demand consultant stack",
    detail: "The strongest operating mix right now is analytics + media + mail execution."
  },
  {
    title: "Biggest vendor-side risk",
    detail: "Field operations firms with uneven regional coverage can underperform when scaling rapidly."
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

function ConsultantMarketplace() {
  return (
    <div className="vs-marketplace-page">
      <section className="vs-marketplace-hero vs-card">
        <div>
          <div className="vs-section-eyebrow">Consultant Marketplace</div>
          <h1 className="vs-marketplace-title">
            The operating directory for political consultants, vendors, and execution partners.
          </h1>
          <p className="vs-marketplace-copy">
            Evaluate firms by reliability, momentum, demand, and strategic fit across media, analytics, mail, field, and campaign operations.
          </p>
        </div>

        <div className="vs-marketplace-hero-grid">
          {topMetrics.map((item) => (
            <div key={item.label} className="vs-marketplace-stat-card">
              <div className="vs-marketplace-stat-label">{item.label}</div>
              <div className="vs-marketplace-stat-value">{item.value}</div>
              <div className={`vs-marketplace-stat-delta ${item.tone}`}>{item.delta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="vs-marketplace-grid">
        <div className="vs-card vs-marketplace-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Featured Firms</div>
              <div className="vs-card-subtitle">
                Highest-priority firms in the current campaign-services market
              </div>
            </div>
            <button className="vs-card-link">Open full directory</button>
          </div>

          <div className="vs-marketplace-featured-list">
            {featuredFirms.map((item) => (
              <div key={item.name} className="vs-marketplace-featured-item">
                <div className="vs-marketplace-featured-top">
                  <div>
                    <div className="vs-marketplace-featured-name">{item.name}</div>
                    <div className="vs-marketplace-featured-specialty">{item.specialty}</div>
                  </div>

                  <div className="vs-marketplace-featured-side">
                    <div className="vs-marketplace-featured-score">{item.score}</div>
                    <div className={toneClass(item.momentum)}>{item.momentum}</div>
                  </div>
                </div>

                <div className="vs-marketplace-featured-tags">
                  <span className="vs-marketplace-tag">{item.category}</span>
                </div>

                <div className="vs-marketplace-featured-bar">
                  <div
                    className="vs-marketplace-featured-fill"
                    style={scoreWidth(item.score)}
                  />
                </div>

                <div className="vs-marketplace-featured-note">{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-marketplace-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Vendor Market Board</div>
              <div className="vs-card-subtitle">
                Comparative ranking across top consulting categories
              </div>
            </div>
          </div>

          <div className="vs-table">
            <div className="vs-table-head">
              <span>Firm</span>
              <span>Category</span>
              <span>Score</span>
              <span>Demand</span>
              <span>Trend</span>
              <span>Status</span>
            </div>

            {vendorBoard.map((row) => (
              <div key={row.firm} className="vs-table-row vs-table-row-six">
                <span>{row.firm}</span>
                <span>{row.category}</span>
                <span>{row.score}</span>
                <span>{row.demand}</span>
                <span className={toneClass(row.trend)}>{row.trend}</span>
                <span>{row.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-marketplace-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Category Leaders</div>
              <div className="vs-card-subtitle">
                Best-in-class firms across major campaign disciplines
              </div>
            </div>
          </div>

          <div className="vs-marketplace-category-list">
            {categoryLeaders.map((item) => (
              <div key={item.category} className="vs-marketplace-category-item">
                <div className="vs-marketplace-category-top">
                  <div>
                    <div className="vs-marketplace-category-name">{item.category}</div>
                    <div className="vs-marketplace-category-firm">{item.firm}</div>
                  </div>
                  <div className="vs-marketplace-category-score">{item.score}</div>
                </div>

                <div className="vs-marketplace-category-bar">
                  <div
                    className="vs-marketplace-category-fill"
                    style={scoreWidth(item.score)}
                  />
                </div>

                <div className="vs-marketplace-category-note">{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-marketplace-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Demand Signals</div>
              <div className="vs-card-subtitle">
                Where campaign demand is moving across vendor categories
              </div>
            </div>
          </div>

          <div className="vs-marketplace-demand-list">
            {demandSignals.map((item) => (
              <div key={item.title} className="vs-marketplace-demand-item">
                <div className={`vs-marketplace-demand-severity ${severityClass(item.severity)}`}>
                  {item.severity}
                </div>
                <div className="vs-marketplace-demand-body">
                  <div className="vs-marketplace-demand-title">{item.title}</div>
                  <div className="vs-marketplace-demand-note">{item.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-marketplace-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Buyer Guidance</div>
              <div className="vs-card-subtitle">
                Recommended consultant fits based on strategic need
              </div>
            </div>
          </div>

          <div className="vs-marketplace-guidance-list">
            {buyerGuidance.map((item) => (
              <div key={item.title} className="vs-marketplace-guidance-item">
                <div className="vs-marketplace-guidance-title">{item.title}</div>
                <div className="vs-marketplace-guidance-detail">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-marketplace-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">AI Marketplace Notes</div>
              <div className="vs-card-subtitle">
                Machine-assisted read on vendor strategy and market shape
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

export default ConsultantMarketplace;
