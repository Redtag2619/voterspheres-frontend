import { NavLink, Outlet, Link } from "react-router-dom";
import { useDemoMode } from "../../context/DemoModeContext.jsx";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/candidates", label: "Candidates" },
  { to: "/map", label: "Map" },
  { to: "/donors", label: "Donors" },
  { to: "/forecast", label: "Forecast" },
  { to: "/power-rankings", label: "Rankings" },
  { to: "/fundraising", label: "Fundraising" },
  { to: "/vendors", label: "Vendors" },
  { to: "/consultants", label: "Consultants" },
  { to: "/ai-chat", label: "AI Chat" },
  { to: "/war-room", label: "War Room" },
  { to: "/command-center", label: "Command Center" },
  { to: "/billing", label: "Billing" }
];

function navClass({ isActive }) {
  return isActive ? "vs-nav-pill vs-nav-pill-active" : "vs-nav-pill";
}

export default function AppShell() {
  const { demoMode, toggleDemoMode } = useDemoMode();

  return (
    <div className="vs-shell">
      <header className="vs-shell-header">
        <div className="vs-shell-inner">
          <div className="vs-brand-row">
            <Link to="/dashboard" className="vs-brand-mark">
              VS
            </Link>

            <div className="vs-brand-copy">
              <div className="vs-brand-name">VoterSpheres</div>
              <div className="vs-brand-tagline">Campaign intelligence operating system</div>
            </div>

            <div className="vs-inline-actions" style={{ marginLeft: "auto" }}>
              <div className="vs-brand-live">
                <span className={demoMode ? "vs-live-dot-warning" : "vs-live-dot-success"} />
                <span>{demoMode ? "Demo" : "Live"}</span>
              </div>

              <button
                type="button"
                className="vs-button vs-button-secondary"
                style={{ minHeight: "36px", padding: "8px 12px" }}
                onClick={toggleDemoMode}
              >
                {demoMode ? "Disable Demo" : "Enable Demo"}
              </button>
            </div>
          </div>

          <nav className="vs-shell-nav">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {demoMode ? (
            <div className="vs-banner vs-banner-demo" style={{ marginTop: "6px" }}>
              Global Demo Mode is active. Modules may render fallback data when live endpoints are unavailable.
            </div>
          ) : null}
        </div>
      </header>

      <main className="vs-shell-main">
        <Outlet />
      </main>
    </div>
  );
}
