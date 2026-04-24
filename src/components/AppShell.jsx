import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Candidates", to: "/candidates" },
  { label: "Map", to: "/map" },
  { label: "Donors", to: "/donors" },
  { label: "War Room", to: "/war-room" },
  { label: "Forecast", to: "/forecast" },
  { label: "Fundraising", to: "/fundraising" },
  { label: "Vendors", to: "/vendors" },
  { label: "Consultants", to: "/consultants" },
  { label: "MailOps", to: "/mailops" },
  { label: "Billing", to: "/billing" },
  { label: "Pricing", to: "/pricing" }
];

const adminItems = [
  { label: "Alerts", to: "/admin/alerts" },
  { label: "Live Intelligence", to: "/admin/live-intelligence" },
  { label: "Beta Access", to: "/admin/beta-access" },
  { label: "Firm Users", to: "/admin/firm-users" },
  { label: "Enterprise Leads", to: "/admin/enterprise-leads" }
];

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="vs-shell">
      <header className="vs-header">
        <NavLink to="/dashboard" className="vs-logo">
          VoterSpheres
        </NavLink>

        <nav className="vs-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "vs-nav-link active" : "vs-nav-link"
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="vs-nav-admin">
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "vs-nav-link active" : "vs-nav-link"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="vs-user-area">
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
