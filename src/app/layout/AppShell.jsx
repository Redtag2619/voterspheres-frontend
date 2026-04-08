import { NavLink, Outlet, Link } from "react-router-dom";

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
  return isActive
    ? "vs-nav-pill vs-nav-pill-active"
    : "vs-nav-pill";
}

export default function AppShell() {
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

            <div className="vs-brand-live">
              <span className="vs-live-dot-warning" />
              <span>Live</span>
            </div>
          </div>

          <nav className="vs-shell-nav">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="vs-shell-main">
        <Outlet />
      </main>
    </div>
  );
}
