import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const primaryItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Candidates", to: "/candidates" },
  { label: "War Room", to: "/war-room" },
  { label: "Command", to: "/command-center" },
  { label: "Fundraising", to: "/fundraising" },
  { label: "Vendors", to: "/vendors" }
];

const moreItems = [
  { label: "Map", to: "/map" },
  { label: "Donors", to: "/donors" },
  { label: "Forecast", to: "/forecast" },
  { label: "Consultants", to: "/consultants" },
  { label: "MailOps", to: "/mailops" },
  { label: "Pricing", to: "/pricing" },
  { label: "Billing", to: "/billing" }
];

const adminItems = [
  { label: "Alert Center", to: "/admin/alerts" },
  { label: "Live Intelligence", to: "/admin/live-intelligence" },
  { label: "Beta Access", to: "/admin/beta-access" },
  { label: "Firm Users", to: "/admin/firm-users" },
  { label: "Enterprise Leads", to: "/admin/enterprise-leads" }
];

function NavItem({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        isActive ? "vs-nav-link active" : "vs-nav-link"
      }
    >
      {item.label}
    </NavLink>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="vs-shell">
      <header className="vs-header vs-header-premium">
        <NavLink to="/dashboard" className="vs-logo vs-logo-premium">
          <span className="vs-logo-mark">VS</span>
          <span className="vs-logo-text">VoterSpheres</span>
        </NavLink>

        <nav className="vs-nav vs-nav-premium">
          {primaryItems.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}

          <div className="vs-nav-menu">
            <button type="button" className="vs-nav-menu-trigger">
              More
            </button>
            <div className="vs-nav-menu-panel">
              {moreItems.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </div>
          </div>

          <div className="vs-nav-menu">
            <button type="button" className="vs-nav-menu-trigger vs-nav-admin-trigger">
              Admin
            </button>
            <div className="vs-nav-menu-panel">
              {adminItems.map((item) => (
                <NavItem key={item.to} item={item} />
              ))}
            </div>
          </div>
        </nav>

        <div className="vs-user-area vs-user-area-premium">
          <span className="vs-live-chip">Live</span>
          <span className="vs-user-email">{user?.email}</span>
          {typeof logout === "function" ? (
            <button type="button" className="vs-button vs-button-secondary" onClick={logout}>
              Sign out
            </button>
          ) : null}
        </div>
      </header>

      <main className="vs-page">
        <Outlet />
      </main>
    </div>
  );
}
