import React from "react";

const topMetrics = [
  { label: "24h Raised", value: "$12.6M", delta: "+11.2%", tone: "up" },
  { label: "Small-Dollar Share", value: "38%", delta: "+4.1", tone: "up" },
  { label: "Bundler Confidence", value: "81", delta: "-2.0", tone: "down" },
  { label: "Burn Efficiency", value: "7.8", delta: "+0.9", tone: "up" }
];

const revenueChannels = [
  { channel: "Digital Small-Dollar", amount: "$3.8M", change: "+18%", mix: "30%" },
  { channel: "National Finance Chairs", amount: "$2.9M", change: "+9%", mix: "23%" },
  { channel: "Events / Major Donors", amount: "$2.1M", change: "+6%", mix: "17%" },
  { channel: "Issue Advocacy Networks", amount: "$1.7M", change: "+22%", mix: "13%" },
  { channel: "Regional Business Bloc", amount: "$1.1M", change: "-4%", mix: "9%" },
  { channel: "Recurring Monthly", amount: "$1.0M", change: "+12%", mix: "8%" }
];

const financeAlerts = [
  {
    severity: "High",
    title: "Bundler hesitation detected after negative regional press cycle",
    detail: "Top-dollar channel confidence softened in two target markets over the last 18 hours."
  },
  {
    severity: "Medium",
    title: "Digital conversion rising on affordability creative",
    detail: "Two-message cluster outperforming baseline CPA and donor retention targets."
  },
  {
    severity: "Medium",
    title: "Event pipeline strongest in Northeast corridor",
    detail: "Projected capacity and response rates above prior cycle benchmarks."
  },
  {
    severity: "Low",
    title: "Recurring donor cancellations stabilizing",
    detail: "Recent reassurance messaging reduced cancellation pace in core segments."
  }
];

const donorSegments = [
  {
    segment: "Grassroots Digital",
    score: 92,
    trend: "+6.4",
    note: "Best growth and repeat conversion in current cycle."
  },
  {
    segment: "Major Donor Chairs",
    score: 84,
    trend: "+1.7",
    note: "Strong absolute value, but more narrative-sensitive."
  },
  {
    segment: "Issue-Based Donors",
    score: 88,
    trend: "+4.9",
    note: "High alignment with current affordability and education framing."
  },
  {
    segment: "Regional Business Leaders",
    score: 76,
    trend: "-2.1",
    note: "Requires reassurance around stability and viability."
  }
];

const candidateFinanceBoard = [
  { name: "Garcia Senate", raised: "$8.4M", cash: "$19.2M", burn: "0.42", trend: "+12%" },
  { name: "Coleman for Georgia", raised: "$7.7M", cash: "$17.8M", burn: "0.45", trend: "+9%" },
  { name: "Mitchell AZ-01", raised: "$4.1M", cash: "$8.9M", burn: "0.39", trend: "+14%" },
  { name: "Rivers MI-07", raised: "$3.6M", cash: "$7.2M", burn: "0.51", trend: "+18%" },
  { name: "Warren Wisconsin", raised: "$5.2M", cash: "$11.3M", burn: "0.58", trend: "-3%" }
];

const actionQueue = [
  {
    title: "Launch bundler reassurance brief",
    owner: "Finance Director",
    due: "Today",
    detail: "Send viability, path-to-win, and fundraising pulse memo to top-dollar finance network."
  },
  {
    title: "Scale affordability acquisition creative",
    owner: "Digital Fundraising",
    due: "4 hrs",
    detail: "Shift more budget toward top-performing small-dollar acquisition frame."
  },
  {
    title: "Prioritize Northeast finance events",
    owner: "Events Team",
    due: "48 hrs",
    detail: "Advance hosts and tighten invitation list in strongest-response markets."
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

function widthFromScore(value) {
  return { width: `${value}%` };
}

function FundraisingDashboard() {
  return (
    <div className="vs-fundraising-page">
      <section className="vs-fundraising-hero vs-card">
        <div>
          <div className="vs-section-eyebrow">Fundraising Terminal</div>
          <h1 className="vs-fundraising-title">
            Monitor capital flow, donor confidence, and finance-channel strength like a campaign markets desk.
          </h1>
          <p className="vs-fundraising-copy">
            Track money velocity, donor segment performance, burn efficiency, and the finance actions that protect momentum and expand runway.
          </p>
        </div>

        <div className="vs-fundraising-hero-grid">
          {topMetrics.map((item) => (
            <div key={item.label} className="vs-fundraising-stat-card">
              <div className="vs-fundraising-stat-label">{item.label}</div>
              <div className="vs-fundraising-stat-value">{item.value}</div>
              <div className={`vs-fundraising-stat-delta ${item.tone}`}>{item.delta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="vs-fundraising-grid">
        <div className="vs-card vs-fundraising-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Revenue Channel Board</div>
              <div className="vs-card-subtitle">
                Where money is coming from and which channels are accelerating
              </div>
            </div>
            <button className="vs-card-link">Open finance report</button>
          </div>

          <div className="vs-table">
            <div className="vs-table-head">
              <span>Channel</span>
              <span>Raised</span>
              <span>Change</span>
              <span>Mix</span>
            </div>

            {revenueChannels.map((row) => (
              <div key={row.channel} className="vs-table-row">
                <span>{row.channel}</span>
                <span>{row.amount}</span>
                <span className={toneClass(row.change)}>{row.change}</span>
                <span>{row.mix}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-fundraising-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Finance Alert Feed</div>
              <div className="vs-card-subtitle">
                Risks and opportunities impacting donor behavior
              </div>
            </div>
          </div>

          <div className="vs-finance-alert-list">
            {financeAlerts.map((item) => (
              <div key={item.title} className="vs-finance-alert-item">
                <div className={`vs-finance-alert-severity ${severityClass(item.severity)}`}>
                  {item.severity}
                </div>
                <div className="vs-finance-alert-body">
                  <div className="vs-finance-alert-title">{item.title}</div>
                  <div className="vs-finance-alert-detail">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-fundraising-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Donor Segment Strength</div>
              <div className="vs-card-subtitle">
                Relative health of key donor ecosystems
              </div>
            </div>
          </div>

          <div className="vs-donor-segment-list">
            {donorSegments.map((item) => (
              <div key={item.segment} className="vs-donor-segment-item">
                <div className="vs-donor-segment-top">
                  <div className="vs-donor-segment-name">{item.segment}</div>
                  <div className="vs-donor-segment-score">{item.score}</div>
                </div>

                <div className="vs-donor-segment-bar">
                  <div
                    className="vs-donor-segment-fill"
                    style={widthFromScore(item.score)}
                  />
                </div>

                <div className="vs-donor-segment-meta">
                  <span className={toneClass(item.trend)}>{item.trend}</span>
                  <span>{item.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-fundraising-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Candidate Finance Board</div>
              <div className="vs-card-subtitle">
                Comparative fundraising and cash position by top campaigns
              </div>
            </div>
          </div>

          <div className="vs-table">
            <div className="vs-table-head">
              <span>Campaign</span>
              <span>Raised</span>
              <span>Cash</span>
              <span>Burn</span>
              <span>Trend</span>
            </div>

            {candidateFinanceBoard.map((row) => (
              <div key={row.name} className="vs-table-row vs-table-row-five">
                <span>{row.name}</span>
                <span>{row.raised}</span>
                <span>{row.cash}</span>
                <span>{row.burn}</span>
                <span className={toneClass(row.trend)}>{row.trend}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-fundraising-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Executive Finance Actions</div>
              <div className="vs-card-subtitle">
                Highest-leverage next moves for the finance team
              </div>
            </div>
            <button className="vs-card-link">Create brief</button>
          </div>

          <div className="vs-finance-action-list">
            {actionQueue.map((item) => (
              <div key={item.title} className="vs-finance-action-item">
                <div className="vs-finance-action-top">
                  <div className="vs-finance-action-title">{item.title}</div>
                  <div className="vs-finance-action-due">{item.due}</div>
                </div>
                <div className="vs-finance-action-owner">Owner: {item.owner}</div>
                <div className="vs-finance-action-detail">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default FundraisingDashboard;
