import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useWorkspace } from "../context/WorkspaceContext.jsx";

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

  const {
    workspaces,
    activeWorkspaceId,
    activeWorkspace,
    loadingWorkspaces,
    workspaceError,
    setActiveWorkspaceId
  } = useWorkspace();

  function handleWorkspaceChange(event) {
    const id = event.target.value;
    setActiveWorkspaceId(id);

    if (id) {
      navigate(`/campaign-workspace/${id}`);
    }
  }

  return (
    <div className="vs-shell">
      <header className="vs-shell-header">
        <div className="vs-shell-inner vs-shell-inner-premium">
          <div className="vs-shell-topline">
            <NavLink to="/dashboard" className="vs-brand-row">
              <div className="vs-brand-mark">VS</div>
              <div className="vs-brand-copy">
                <div className="vs-brand-name">VoterSpheres</div>
                <div className="vs-brand-tagline">Political Intelligence Platform</div>
              </div>
            </NavLink>

            <div className="vs-inline-actions">
              <div className="vs-workspace-switcher" title={workspaceError || activeWorkspace?.name || "Workspace"}>
                <select
                  value={activeWorkspaceId || ""}
                  onChange={handleWorkspaceChange}
                  className="vs-select"
                  disabled={loadingWorkspaces || !workspaces.length}
                >
                  {loadingWorkspaces ? (
                    <option value="">Loading workspaces...</option>
                  ) : !workspaces.length ? (
                    <option value="">No workspace</option>
                  ) : (
                    workspaces.map((workspace) => (
                      <option key={workspace.id} value={workspace.id}>
                        {workspace.name || workspace.campaign_name || `Workspace #${workspace.id}`}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <span className="vs-brand-live">
                <span className="vs-live-dot-success" />
                Live Intelligence
              </span>

              <span className="vs-user-email">{user?.email}</span>

              {typeof logout === "function" ? (
                <button type="button" className="vs-button vs-button-secondary" onClick={logout}>
                  Sign out
                </button>
              ) : null}
            </div>
          </div>

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
