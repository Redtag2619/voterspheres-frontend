import { Link, NavLink, Outlet } from "react-router-dom";

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

function navStyle(isActive) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: "9999px",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 800,
    whiteSpace: "nowrap",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    border: isActive ? "1px solid rgba(245,158,11,0.35)" : "1px solid #232b36",
    background: isActive ? "rgba(245,158,11,0.12)" : "#11161d",
    color: isActive ? "#fbbf24" : "#cbd5e1",
    transition: "all 0.18s ease"
  };
}

export default function AppShell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0d12", color: "#f3f4f6" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          borderBottom: "1px solid #232b36",
          background: "rgba(10, 13, 18, 0.96)",
          backdropFilter: "blur(10px)"
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "14px 16px 12px",
            display: "grid",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
              <Link
                to="/dashboard"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "#f59e0b",
                  color: "#0a0d12",
                  textDecoration: "none",
                  fontWeight: 900,
                  fontSize: "14px",
                  boxShadow: "0 8px 20px rgba(245,158,11,0.25)"
                }}
              >
                VS
              </Link>

              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.24em", color: "#f59e0b", fontWeight: 900 }}>
                  VoterSpheres
                </div>
                <div style={{ marginTop: "2px", fontSize: "13px", color: "#94a3b8" }}>
                  Campaign intelligence operating system
                </div>
              </div>
            </div>

            <div className="vs-terminal-ticker">
              <span className="vs-live-dot" />
              <strong>LIVE</strong>
              <span>Intelligence mode active</span>
            </div>
          </div>

          <nav style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "2px" }}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} style={({ isActive }) => navStyle(isActive)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main>{children ? children : <Outlet />}</main>
    </div>
  );
}
