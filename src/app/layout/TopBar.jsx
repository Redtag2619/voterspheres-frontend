import React from "react";

function TopBar() {
  return (
    <header className="vs-topbar">
      <div>
        <div className="vs-topbar-title">Command Dashboard</div>
        <div className="vs-topbar-subtitle">
          National campaign intelligence, fundraising signals, race movement, and strategic alerts.
        </div>
      </div>

      <div className="vs-topbar-actions">
        <button className="vs-btn vs-btn-secondary">Export Brief</button>
        <button className="vs-btn vs-btn-primary">AI Analyst</button>
      </div>
    </header>
  );
}

export default TopBar;
