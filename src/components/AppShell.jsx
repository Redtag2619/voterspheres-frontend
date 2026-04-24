import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const navGroups = [
  {
    label: "Command",
    items: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "War Room", to: "/war-room" },
      { label: "Command Center", to: "/command-center" },
      { label: "Workspace", to: "/campaign-workspace" }
    ]
  },
  {
    label: "Intelligence",
    items: [
      { label: "Candidates", to: "/candidates" },
      { label: "Map", to: "/map" },
      { label: "Forecast", to: "/forecast" },
      { label: "Rankings", to: "/power-rankings" },
      { label: "Fundraising", to: "/fundraising" }
    ]
  },
  {
    label: "Network",
    items: [
      { label: "Vendors", to: "/vendors" },
      { label: "Consultants", to: "/consultants" },
      { label: "Donors", to: "/donors" },
      { label: "MailOps", to: "/mailops" }
    ]
  },
  {
    label: "Admin",
    items: [
      { label: "Alerts", to: "/admin/alerts" },
      { label: "Live Intelligence", to: "/admin/live-intelligence" },
      { label: "Beta Access", to: "/admin/beta-access" },
      { label: "Firm Users", to: "/admin/firm-users" },
      { label: "Enterprise Leads", to: "/admin/enterprise-leads" }
    ]
  }
];

function getPageTitle(pathname) {
  const item = navGroups.flatMap((g) => g.items).find((i) => i.to === pathname);
  return item?.label || "VoterSpheres";
}

export default function AppShell() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const pageTitle = useMemo(() => getPageTitle(location.pathname), [location.pathname]);

  return (
    <div className="vs-top-shell">
      <header className="vs-premium-nav">
        <div className="vs-nav-inner">
          <Link to="/dashboard" className="vs-premium-brand">
            <div className="vs-premium-logo">VS</div>
            <div>
              <div className="vs-premium-brand-title">VoterSpheres</div>
              <div className="vs-premium-brand-subtitle">Political Intelligence Platform</div>
            </div>
          </Link>

          <nav className="vs-premium-menu">
            {navGroups.map((group) => (
              <div className="vs-premium-menu-group" key={group.label}>
                <button type="button" className="vs-premium-menu-trigger">
                  {group.label}
                  <span>⌄</span>
                </button>

                <div className="vs-premium-dropdown">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        isActive ? "vs-premium-dropdown-link active" : "vs-premium-dropdown-link"
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="vs-premium-actions">
            <Link to="/pricing" className="vs-premium-link">
              Pricing
            </Link>
            <Link to="/billing" className="vs-premium-link">
              Billing
            </Link>
            <Link to="/admin/alerts" className="vs-alert-pill">
              Live Alerts
            </Link>

            <div className="vs-user-chip">
              {(user?.first_name?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </div>

            {typeof logout === "function" ? (
              <button type="button" className="vs-signout" onClick={logout}>
                Sign out
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <section className="vs-command-hero">
        <div>
          <div className="vs-command-eyebrow">
            <span className="vs-live-dot" />
            Live intelligence active
          </div>
          <h1>{pageTitle}</h1>
          <p>
            Campaign intelligence, alerts, fundraising, vendors, polling, news, and operational risk in one command surface.
          </p>
        </div>

        <div className="vs-command-hero-actions">
          <Link to="/admin/live-intelligence" className="vs-button">
            Refresh Intelligence
          </Link>
          <Link to="/admin/alerts" className="vs-button vs-button-secondary">
            Alert Center
          </Link>
        </div>
      </section>

      <main className="vs-premium-content">
        <Outlet />
      </main>
    </div>
  );
}
