import { NavLink, Outlet, Link } from "react-router-dom";
import { useDemoMode } from "../../context/DemoModeContext.jsx";

const primaryNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/candidates", label: "Candidates" },
  { to: "/map", label: "Map" },
  { to: "/donors", label: "Donors" },
  { to: "/forecast", label: "Forecast" },
  { to: "/power-rankings", label: "Rankings" },
  { to: "/fundraising", label: "Fundraising" },
  { to: "/vendors", label: "Vendors" },
  { to: "/consultants", label: "Consultants" },
  { to: "/mailops", label: "MailOps" },
  { to: "/ai-chat", label: "AI Chat" },
  { to: "/war-room", label: "War Room" },
  { to: "/command-center", label: "Command Center" },
  { to: "/billing", label: "Billing" }
];

const adminNavItems = [
  { to: "/admin/candidate-profiles", label: "Candidate Profiles" },
  { to: "/admin/beta-access", label: "Beta Access" }
];

const publicNavItems = [
  { to: "/pricing", label: "Pricing" },
  { to: "/signup", label: "Sign Up" }
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
            <Link to="/dashboard" className="vs-brand-mark" aria-label="VoterSpheres home">
              VS
            </Link>

            <div className="vs-brand-copy">
              <div className="vs-brand-name">VoterSpheres</div>
              <div className="vs-brand-tagline">Campaign intelligence operating system</div>
            </div>

            <div className="vs-inline-actions" style={{ marginLeft: "auto" }}>
              <div className="vs-brand-live">
                <span className={demoMode ? "vs-live-dot-warning" : "vs-live-dot-success"} />
                <span>{demoMode ? "Demo Mode" : "Live Mode"}</span>
              </div>

              <button
                type="button"
                className="vs-button vs-button-secondary"
                onClick={toggleDemoMode}
              >
                {demoMode ? "Disable Demo" : "Enable Demo"}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            <nav className="vs-shell-nav" aria-label="Primary navigation">
              {primaryNavItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={navClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <nav
              className="vs-shell-nav"
              aria-label="Admin navigation"
              style={{ borderTop: "1px solid var(--vs-border)", paddingTop: "10px" }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--vs-text-muted)",
                  alignSelf: "center",
                  marginRight: "6px"
                }}
              >
                Admin
              </span>

              {adminNavItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={navClass}>
                  {item.label}
                </NavLink>
              ))}

              {publicNavItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={navClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {demoMode ? (
            <div className="vs-banner vs-banner-demo" style={{ marginTop: "10px" }}>
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
