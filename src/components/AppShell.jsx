import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect, useState } from "react";

const primaryItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Candidates", to: "/candidates" },
  { label: "War Room", to: "/war-room" },
  { label: "Command", to: "/command-center" },
  { label: "Fundraising", to: "/fundraising" },
  { label: "Vendors", to: "/vendors" }
];

const secondaryItems = [
  { label: "Map", to: "/map" },
  { label: "Forecast", to: "/forecast" },
  { label: "Donors", to: "/donors" },
  { label: "Consultants", to: "/consultants" },
  { label: "MailOps", to: "/mailops" },
  { label: "Pricing", to: "/pricing" },
  { label: "Billing", to: "/billing" },
  { label: "Alerts", to: "/admin/alerts" },
  { label: "Live Intel", to: "/admin/live-intelligence" }
];

function Pill({ item }) {
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        isActive ? "vs-nav-pill vs-nav-pill-active" : "vs-nav-pill"
      }
    >
      {item.label}
    </NavLink>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // 🔥 Workspace state (temporary demo — will connect to API next)
  const [workspaces, setWorkspaces] = useState([
    { id: "1", name: "Stephens for Senate" },
    { id: "2", name: "Georgia Governor Race" }
  ]);

  const [activeWorkspaceId, setActiveWorkspaceId] = useState(
    () => localStorage.getItem("vs_active_workspace") || "1"
  );

  useEffect(() => {
    localStorage.setItem("vs_active_workspace", activeWorkspaceId);
  }, [activeWorkspaceId]);

  function handleWorkspaceChange(e) {
    const id = e.target.value;
    setActiveWorkspaceId(id);

    // 🚀 route into workspace
    navigate(`/campaign-workspace/${id}`);
  }

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0];

  return (
    <div className="vs-shell">
      <header className="vs-shell-header">
        <div className="vs-shell-inner vs-shell-inner-premium">

          {/* TOP ROW */}
          <div className="vs-shell-topline">
            <NavLink to="/dashboard" className="vs-brand-row">
              <div className="vs-brand-mark">VS</div>
              <div className="vs-brand-copy">
                <div className="vs-brand-name">VoterSpheres</div>
                <div className="vs-brand-tagline">
                  Political Intelligence Platform
                </div>
              </div>
            </NavLink>

            <div className="vs-inline-actions">

              {/* 🔥 WORKSPACE SELECTOR */}
              <div className="vs-workspace-switcher">
                <select
                  value={activeWorkspaceId}
                  onChange={handleWorkspaceChange}
                  className="vs-select"
                >
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <span className="vs-brand-live">
                <span className="vs-live-dot-success" />
                Live Intelligence
              </span>

              <span className="vs-user-email">{user?.email}</span>

              {typeof logout === "function" && (
                <button
                  type="button"
                  className="vs-button vs-button-secondary"
                  onClick={logout}
                >
                  Sign out
                </button>
              )}
            </div>
          </div>

          {/* NAV */}
          <nav className="vs-shell-nav vs-shell-nav-premium">
            {primaryItems.map((item) => (
              <Pill key={item.to} item={item} />
            ))}

            <div className="vs-nav-divider" />

            {secondaryItems.map((item) => (
              <Pill key={item.to} item={item} />
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
