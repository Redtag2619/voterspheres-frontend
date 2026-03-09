import React from "react";

const topLineStats = [
  { label: "Top Rated Campaign", value: "Garcia Senate", delta: "+2.4", tone: "up" },
  { label: "Fastest Climber", value: "Rivers MI-07", delta: "+5 spots", tone: "up" },
  { label: "Highest Risk Drop", value: "Cole PA-08", delta: "-4 spots", tone: "down" },
  { label: "Consultant Leader", value: "Red Tag Strategies", delta: "91.2 score", tone: "neutral" }
];

const campaignRankings = [
  { rank: 1, name: "Garcia Senate", score: 94.8, movement: "+2", category: "Senate", signal: "Fundraising + message discipline" },
  { rank: 2, name: "Coleman for Georgia", score: 92.7, movement: "+1", category: "Senate", signal: "Turnout + media advantage" },
  { rank: 3, name: "Mitchell AZ-01", score: 89.4, movement: "+3", category: "House", signal: "Persuasion gains" },
  { rank: 4, name: "Rivers MI-07", score: 88.6, movement: "+5", category: "House", signal: "Momentum breakout" },
  { rank: 5, name: "Hale Nevada", score: 87.1, movement: "-1", category: "Senate", signal: "Stable but pressured" },
  { rank: 6, name: "Warren Wisconsin", score: 84.9, movement: "-2", category: "Senate", signal: "Media drag risk" }
];

const consultantRankings = [
  { rank: 1, firm: "Red Tag Strategies", specialty: "Political mail recovery", score: 91.2, trend: "+3.8" },
  { rank: 2, firm: "Summit Strategy Group", specialty: "Paid media", score: 89.7, trend: "+1.9" },
  { rank: 3, firm: "Blue Ridge Analytics", specialty: "Forecast modeling", score: 88.4, trend: "+2.2" },
  { rank: 4, firm: "Northstar Field Ops", specialty: "Ground game", score: 86.6, trend: "-0.7" }
];

const donorPower = [
  { network: "Digital Small-Dollar Coalition", score: 93, trend: "+6.2", note: "Best growth efficiency in current cycle" },
  { network: "National Finance Chairs", score: 89, trend: "+2.8", note: "High reliability, moderate upside" },
  { network: "Issue Advocacy Circle", score: 85, trend: "+4.7", note: "Narrative-aligned cash flow rising" },
  { network: "Regional Business Bloc", score: 78, trend: "-1.6", note: "Confidence softening after press cycle" }
];

const rankingDrivers = [
  {
    title: "Fundraising velocity",
    description: "Measures recent capital inflow strength versus peer average.",
    impact: "High"
  },
  {
    title: "Message performance",
    description: "Evaluates persuasion and resonance across priority audience bands.",
    impact: "High"
  },
  {
    title: "Media risk",
    description: "Assesses exposure to narrative shocks and unfavorable framing.",
    impact: "Medium"
  },
  {
    title: "Ground-game readiness",
    description: "Tracks field coverage, volunteer depth, and turnout infrastructure.",
    impact: "Medium"
  }
];

const moversBoard = [
  {
    title: "Biggest Upward Mover",
    entity: "Rivers MI-07",
    change: "+5",
    note: "Turnout signals and digital message efficiency sharply improved."
  },
  {
    title: "Most Durable Leader",
    entity: "Garcia Senate",
    change: "+2",
    note: "Continues to hold top position on money, message, and risk control."
  },
  {
    title: "Most Vulnerable Favorite",
    entity: "Warren Wisconsin",
    change: "-2",
    note: "Forecast stability deteriorating due to local press volatility."
  }
];

function toneClass(value) {
  const stringValue = String(value);
  if (stringValue.startsWith("-")) return "down";
  if (stringValue.startsWith("+")) return "up";
  return "neutral";
}

function impactClass(value) {
  const normalized = value.toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
  return "low";
}

function scoreWidth(value) {
  return { width: `${value}%` };
}

function PowerRankings() {
  return (
    <div className="vs-rankings-page">
      <section className="vs-rankings-hero vs-card">
        <div>
          <div className="vs-section-eyebrow">Power Rankings</div>
          <h1 className="vs-rankings-title">
            The leaderboard for campaigns, consultants, and donor networks shaping the political market.
          </h1>
          <p className="vs-rankings-copy">
            VoterSpheres ranks the strongest operators and campaigns by fundraising strength, message performance, momentum, resilience, and strategic execution.
          </p>
        </div>

        <div className="vs-rankings-hero-grid">
          {topLineStats.map((item) => (
            <div key={item.label} className="vs-rankings-stat-card">
              <div className="vs-rankings-stat-label">{item.label}</div>
              <div className="vs-rankings-stat-value">{item.value}</div>
              <div className={`vs-rankings-stat-delta ${item.tone}`}>{item.delta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="vs-rankings-grid">
        <div className="vs-card vs-rankings-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Campaign Leaderboard</div>
              <div className="vs-card-subtitle">
                Top campaigns ranked by total strategic strength
              </div>
            </div>
            <button className="vs-card-link">Export rankings</button>
          </div>

          <div className="vs-ranking-list">
            {campaignRankings.map((item) => (
              <div key={item.name} className="vs-ranking-item">
                <div className="vs-ranking-topline">
                  <div className="vs-ranking-left">
                    <div className="vs-ranking-badge">#{item.rank}</div>
                    <div>
                      <div className="vs-ranking-name">{item.name}</div>
                      <div className="vs-ranking-sub">{item.category}</div>
                    </div>
                  </div>

                  <div className="vs-ranking-right">
                    <div className="vs-ranking-score">{item.score}</div>
                    <div className={toneClass(item.movement)}>{item.movement}</div>
                  </div>
                </div>

                <div className="vs-ranking-bar">
                  <div className="vs-ranking-fill" style={scoreWidth(item.score)} />
                </div>

                <div className="vs-ranking-signal">{item.signal}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-rankings-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Consultant Rankings</div>
              <div className="vs-card-subtitle">
                Firms winning on delivery, reliability, and cycle impact
              </div>
            </div>
          </div>

          <div className="vs-table">
            <div className="vs-table-head">
              <span>Rank</span>
              <span>Firm</span>
              <span>Specialty</span>
              <span>Score</span>
              <span>Trend</span>
            </div>

            {consultantRankings.map((row) => (
              <div key={row.firm} className="vs-table-row vs-table-row-five">
                <span>#{row.rank}</span>
                <span>{row.firm}</span>
                <span>{row.specialty}</span>
                <span>{row.score}</span>
                <span className={toneClass(row.trend)}>{row.trend}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-rankings-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Donor Power Index</div>
              <div className="vs-card-subtitle">
                Which funding ecosystems are driving the market
              </div>
            </div>
          </div>

          <div className="vs-donor-power-list">
            {donorPower.map((item) => (
              <div key={item.network} className="vs-donor-power-item">
                <div className="vs-donor-power-top">
                  <div className="vs-donor-power-name">{item.network}</div>
                  <div className="vs-donor-power-score">{item.score}</div>
                </div>

                <div className="vs-donor-power-bar">
                  <div className="vs-donor-power-fill" style={scoreWidth(item.score)} />
                </div>

                <div className="vs-donor-power-meta">
                  <span className={toneClass(item.trend)}>{item.trend}</span>
                  <span>{item.note}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-rankings-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Ranking Drivers</div>
              <div className="vs-card-subtitle">
                Factors powering the current leaderboard model
              </div>
            </div>
          </div>

          <div className="vs-driver-list">
            {rankingDrivers.map((item) => (
              <div key={item.title} className="vs-driver-item">
                <div className="vs-driver-topline">
                  <div className="vs-driver-name">{item.title}</div>
                  <div className={`vs-driver-impact ${impactClass(item.impact)}`}>
                    {item.impact}
                  </div>
                </div>
                <div className="vs-driver-note">{item.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-rankings-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Movers Board</div>
              <div className="vs-card-subtitle">
                Biggest ranking changes and vulnerability signals
              </div>
            </div>
          </div>

          <div className="vs-movers-list">
            {moversBoard.map((item) => (
              <div key={item.title} className="vs-mover-item">
                <div className="vs-mover-topline">
                  <div className="vs-mover-title">{item.title}</div>
                  <div className={toneClass(item.change)}>{item.change}</div>
                </div>
                <div className="vs-mover-entity">{item.entity}</div>
                <div className="vs-mover-note">{item.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default PowerRankings;
