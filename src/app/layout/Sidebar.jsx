import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", short: "DB" },
  { to: "/command-center", label: "Command Center", short: "CC" },
  { to: "/warroom", label: "War Room", short: "WR" },
  { to: "/forecast", label: "Forecast", short: "FC" },
  { to: "/map", label: "Election Map", short: "MP" },
  { to: "/candidates", label: "Candidates", short: "CD" },
  { to: "/donors", label: "Donor Network", short: "DN" },
  { to: "/fundraising", label: "Fundraising", short: "FR" },
  { to: "/rankings", label: "Power Rankings", short: "PR" },
  { to: "/marketplace", label: "Marketplace", short: "MK" },
  { to: "/simulator", label: "Simulator", short: "SM" },
  { to: "/ai", label: "AI Chat", short: "AI" }
];

function Sidebar() {
  return (
    <aside className="vs-sidebar">
      <div className="vs-sidebar-brand">
        <div className="vs-sidebar-brand-mark">VS</div>
        <div>
          <div className="vs-sidebar-brand-title">VoterSpheres</div>
          <div className="vs-sidebar-brand-subtitle">Political Intelligence Terminal</div>
        </div>
      </div>

      <nav className="vs-sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `vs-nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="vs-nav-badge">{item.short}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="vs-sidebar-footer">
        <div className="vs-terminal-status">
          <span className="vs-status-dot" />
          <span>System Live</span>
        </div>
        <div className="vs-terminal-meta">Build: Campaign OS / v1.0</div>
      </div>
    </aside>
  );
}

export default Sidebar;
