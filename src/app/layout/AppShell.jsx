import { NavLink, Outlet, Link } from "react-router-dom";
import { useDemoMode } from "../../context/DemoModeContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { hasPermission, PERMISSIONS } from "../../lib/permissions.js";
import CheckoutPlanSync from "../billing/CheckoutPlanSync.jsx";

const primaryNavItems = [
  { to: "/dashboard", label: "Dashboard", permission: PERMISSIONS.VIEW_DASHBOARD },
  { to: "/candidates", label: "Candidates", permission: PERMISSIONS.VIEW_CANDIDATES },
  { to: "/map", label: "Map", permission: PERMISSIONS.VIEW_MAP },
  { to: "/donors", label: "Donors", permission: PERMISSIONS.VIEW_DONORS },
  { to: "/forecast", label: "Forecast", permission: PERMISSIONS.VIEW_FORECAST },
  { to: "/power-rankings", label: "Rankings", permission: PERMISSIONS.VIEW_POWER_RANKINGS },
  { to: "/fundraising", label: "Fundraising", permission: PERMISSIONS.VIEW_FUNDRAISING },
  { to: "/vendors", label: "Vendors", permission: PERMISSIONS.VIEW_VENDORS },
  { to: "/consultants", label: "Consultants", permission: PERMISSIONS.VIEW_CONSULTANTS },
  { to: "/consultant-intel", label: "Consultant Intel", permission: PERMISSIONS.VIEW_COMMAND_CENTER },
  { to: "/committee-intel", label: "Committee Intel", permission: PERMISSIONS.VIEW_COMMAND_CENTER },
  { to: "/dark-money-exposure", label: "Dark Money", permission: PERMISSIONS.VIEW_COMMAND_CENTER },
  { to: "/relationship-graph", label: "Relationship Graph", permission: PERMISSIONS.VIEW_COMMAND_CENTER },
  { to: "/mailops", label: "MailOps", permission: PERMISSIONS.VIEW_MAILOPS },
  { to: "/ai-chat", label: "AI Chat", permission: PERMISSIONS.VIEW_AI_CHAT },
  { to: "/war-room", label: "War Room", permission: PERMISSIONS.VIEW_WAR_ROOM },
  { to: "/command-center", label: "Command Center", permission: PERMISSIONS.VIEW_COMMAND_CENTER },
  { to: "/billing", label: "Billing", permission: PERMISSIONS.VIEW_BILLING },
];

const adminNavItems = [
  {
    to: "/admin/candidate-profiles",
    label: "Candidate Profiles",
    permission: PERMISSIONS.VIEW_CANDIDATE_ADMIN,
  },
  {
    to: "/admin/beta-access",
    label: "Beta Access",
    permission: PERMISSIONS.VIEW_BETA_ACCESS,
  },
  {
    to: "/admin/firm-users",
    label: "Firm Users",
    permission: PERMISSIONS.VIEW_FIRM_USERS,
  },
  {
    to: "/admin/firm-invites",
    label: "Firm Invites",
    permission: PERMISSIONS.VIEW_FIRM_INVITES,
  },
  {
    to: "/admin/enterprise-leads",
    label: "Enterprise Leads",
    permission: PERMISSIONS.VIEW_ENTERPRISE_LEADS,
  },
];

const publicNavItems = [
  { to: "/pricing", label: "Pricing" },
  { to: "/signup", label: "Sign Up" },
];

function navClass({ isActive }) {
  return isActive ? "vs-nav-pill vs-nav-pill-active" : "vs-nav-pill";
}

export default function AppShell() {
  const { demoMode, toggleDemoMode } = useDemoMode();
  const { user, logout } = useAuth();

  const visiblePrimaryItems = primaryNavItems.filter((item) =>
    hasPermission(user, item.permission)
  );

  const visibleAdminItems = adminNavItems.filter((item) =>
    hasPermission(user, item.permission)
  );

  return (
    <>
      <CheckoutPlanSync />

      <div className="vs-shell">
        <header className="vs-shell-header">
          <div className="vs-shell-inner">
            <div className="vs-brand-row">
              <Link
                to="/dashboard"
                className="vs-brand-mark"
                aria-label="VoterSpheres home"
              >
                VS
              </Link>

              <div className="vs-brand-copy">
                <div className="vs-brand-name">VoterSpheres</div>
                <div className="vs-brand-tagline">
                  Campaign intelligence operating system
                </div>
              </div>

              <div className="vs-inline-actions" style={{ marginLeft: "auto" }}>
                <div className="vs-brand-live">
                  <span
                    className={
                      demoMode ? "vs-live-dot-warning" : "vs-live-dot-success"
                    }
                  />
                  <span>{demoMode ? "Demo Mode" : "Live Mode"}</span>
                </div>

                <button
                  type="button"
                  className="vs-button vs-button-secondary"
                  onClick={toggleDemoMode}
                >
                  {demoMode ? "Disable Demo" : "Enable Demo"}
                </button>

                {user ? (
                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={logout}
                  >
                    Log Out
                  </button>
                ) : null}
              </div>
            </div>

            <nav className="vs-shell-nav" aria-label="Primary navigation">
              {visiblePrimaryItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={navClass}>
                  {item.label}
                </NavLink>
              ))}

              {visibleAdminItems.length ? (
                <>
                  <span className="vs-nav-divider" aria-hidden="true" />
                  {visibleAdminItems.map((item) => (
                    <NavLink key={item.to} to={item.to} className={navClass}>
                      {item.label}
                    </NavLink>
                  ))}
                </>
              ) : null}

              {!user
                ? publicNavItems.map((item) => (
                    <NavLink key={item.to} to={item.to} className={navClass}>
                      {item.label}
                    </NavLink>
                  ))
                : null}
            </nav>

            {demoMode ? (
              <div
                className="vs-banner vs-banner-demo"
                style={{ marginTop: "10px" }}
              >
                Global Demo Mode is active. Modules may render fallback data when
                live endpoints are unavailable.
              </div>
            ) : null}
          </div>
        </header>

        <main className="vs-shell-main">
          <Outlet />
        </main>
      </div>
    </>
  );
}

