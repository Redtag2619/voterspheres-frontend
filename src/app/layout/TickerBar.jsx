import React from "react";

const tickerItems = [
  { label: "Top Race Shift", value: "VA-07 +2.1", tone: "up" },
  { label: "Donor Velocity", value: "+14.8%", tone: "up" },
  { label: "Media Risk", value: "3 elevated", tone: "neutral" },
  { label: "War Room Alerts", value: "7 active", tone: "down" },
  { label: "National Momentum", value: "Toss-up band", tone: "neutral" },
  { label: "Fundraising Pulse", value: "$8.4M / 24h", tone: "up" }
];

function TickerBar() {
  return (
    <div className="vs-ticker-wrap">
      <div className="vs-ticker-label">LIVE</div>

      <div className="vs-ticker-track">
        {tickerItems.map((item) => (
          <div key={item.label} className="vs-ticker-item">
            <span className="vs-ticker-item-label">{item.label}</span>
            <span className={`vs-ticker-item-value ${item.tone}`}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TickerBar;
