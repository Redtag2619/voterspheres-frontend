import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const navGroups = [
  {
    label: "Command",
    items: [
      { label: "Executive Dashboard", to: "/dashboard", badge: "LIVE" },
      { label: "War Room", to: "/war-room", badge: "HOT" },
      { label: "Command Center", to: "/command-center" },
      { label: "Campaign Workspace", to: "/campaign-workspace" }
    ]
  },
  {
    label: "Intelligence",
    items: [
      { label: "Candidates", to: "/candidates" },
      { label: "Map", to: "/map" },
      { label: "Forecast", to: "/forecast" },
      { label: "Power Rankings", to: "/power-rankings" },
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
      { label: "Alert Center", to: "/admin/alerts", badge: "NEW" },
      { label: "Live Intelligence", to: "/admin/live-intelligence" },
      { label: "Beta Access", to: "/admin/beta-access" },
      { label: "Firm Users", to: "/admin/firm-users" },
      { label: "Firm Invites", to: "/admin/firm-invites" },
      { label: "Enterprise Leads", to: "/admin/enterprise-leads" },
      { label: "Candidate Profiles", to: "/admin/candidate-profiles" }
    ]
  },
  {
    label: "Account",
    items: [
      { label: "Billing", to: "/billing" },
      { label: "Pricing", to: "/pricing" }
    ]
  }
];

function getPageTitle(pathname) {
  const allItems = navGroups.flatMap((group) => group.items);
  const found = allItems.find((item) => pathname === item.to);
  return found?.label || "VoterSpheres";
}

export default function AppShell() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const pageTitle = useMemo(
    () => getPageTitle(location.pathname),
    [location.pathname]
  );

  return (
    <div className="vs-app-shell">
      <aside className="vs-sidebar">
        <Link to="/dashboard" className="vs-sidebar-brand">
          <div className="vs-brand-mark">VS</div>
          <div>
            <div className="vs-brand-title">VoterSpheres</div>
            <div className="vs-brand-subtitle">Political Intelligence</div>
          </div>
        </Link>

        <div className="vs-sidebar-status">
          <span className="vs-live-dot" />
          Live intelligence active
        </div>

        <nav className="vs-sidebar-nav">
          {navGroups.map((group) => (
            <div className="vs-nav-group" key={group.label}>
              <div className="vs-nav-label">{group.label}</div>

              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    isActive ? "vs-nav-link vs-nav-link-active" : "vs-nav-link"
                  }
                >
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="vs-nav-badge">{item.badge}</span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="vs-sidebar-footer">
          <div className="vs-user-card">
            <div className="vs-user-avatar">
              {(user?.first_name?.[0] || user?.email?.[0] || "U").toUpperCase()}
            </div>
            <div className="vs-user-meta">
              <div className="vs-user-name">
                {[user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
                  user?.email ||
                  "User"}
              </div>
              <div className="vs-user-role">{user?.role || "user"}</div>
            </div>
          </div>

          {typeof logout === "function" ? (
            <button className="vs-logout-button" type="button" onClick={logout}>
              Sign out
            </button>
          ) : null}
        </div>
      </aside>

      <main className="vs-main">
        <header className="vs-topbar">
          <div>
            <div className="vs-topbar-kicker">Command Surface</div>
            <h1 className="vs-topbar-title">{pageTitle}</h1>
          </div>

          <div className="vs-topbar-actions">
            <Link to="/admin/alerts" className="vs-button vs-button-secondary">
              Alert Center
            </Link>
            <Link to="/admin/live-intelligence" className="vs-button">
              Refresh Intel
            </Link>
          </div>
        </header>

        <div className="vs-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
