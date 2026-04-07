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
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    border: isActive ? "1px solid #f59e0b" : "1px solid #334155",
    background: isActive ? "rgba(245, 158, 11, 0.14)" : "#111827",
    color: isActive ? "#f59e0b" : "#e5e7eb",
    transition: "all 0.18s ease"
  };
}

export default function AppShell({ children }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0f14",
        color: "#f8fafc"
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          borderBottom: "1px solid #1f2937",
          background: "rgba(10, 14, 20, 0.96)",
          backdropFilter: "blur(10px)"
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "16px 16px 14px",
            display: "grid",
            gap: "14px"
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                minWidth: 0
              }}
            >
              <Link
                to="/dashboard"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "14px",
                  background: "#f59e0b",
                  color: "#0b0f14",
                  textDecoration: "none",
                  fontWeight: 800,
                  fontSize: "14px",
                  boxShadow: "0 8px 20px rgba(245,158,11,0.25)"
                }}
              >
                VS
              </Link>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.24em",
                    color: "#f59e0b",
                    fontWeight: 800
                  }}
                >
                  VoterSpheres
                </div>
                <div
                  style={{
                    marginTop: "2px",
                    fontSize: "14px",
                    color: "#94a3b8"
                  }}
                >
                  Campaign intelligence operating system
                </div>
              </div>
            </div>
          </div>

          <nav
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "2px"
            }}
          >
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} style={({ isActive }) => navStyle(isActive)}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {children ? children : <Outlet />}
      </main>
    </div>
  );
}
