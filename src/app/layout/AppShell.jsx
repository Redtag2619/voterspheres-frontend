import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const publicLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/candidates", label: "Candidates" },
  { to: "/map", label: "Election Map" },
  { to: "/donors", label: "Donors" },
  { to: "/warroom", label: "War Room" },
  { to: "/ai", label: "AI" },
  { to: "/forecast", label: "Forecast" },
  { to: "/fundraising", label: "Fundraising" },
  { to: "/rankings", label: "Rankings" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/simulator", label: "Simulator" },
  { to: "/command-center", label: "Command Center" },
];

const authedLinks = [{ to: "/billing", label: "Billing" }];

export default function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, logout, firmId } = useAuth();

  const navLinks = isAuthenticated
    ? [...publicLinks, ...authedLinks]
    : publicLinks;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <div style={styles.brandBlock}>
          <div style={styles.brand}>VoterSpheres</div>
          <div style={styles.tagline}>Political intelligence and campaign operations</div>
        </div>

        <div style={styles.accountArea}>
          {loading ? (
            <div style={styles.accountPill}>Loading...</div>
          ) : isAuthenticated ? (
            <>
              <div style={styles.accountMeta}>
                <div style={styles.accountName}>
                  {user?.email || user?.first_name || "Authenticated User"}
                </div>
                <div style={styles.accountSub}>Firm ID: {firmId || "Not linked"}</div>
              </div>
              <button style={styles.authButton} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.authLink}>
                Login
              </Link>
              <Link to="/signup" style={styles.authPrimaryLink}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      <nav style={styles.nav}>
        {navLinks.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              style={{
                ...styles.navLink,
                ...(active ? styles.navLinkActive : {}),
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <main style={styles.main}>{children}</main>
    </div>
  );
}

const styles = {
  shell: {
    minHeight: "100vh",
    background: "#0b1020",
    color: "#ffffff",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "18px 20px 14px",
    borderBottom: "1px solid #1f2a44",
    background: "rgba(11,16,32,0.96)",
    backdropFilter: "blur(10px)",
    flexWrap: "wrap",
  },
  brandBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  brand: {
    fontSize: "1.25rem",
    fontWeight: 800,
    letterSpacing: "0.02em",
  },
  tagline: {
    color: "#94a3b8",
    fontSize: "0.9rem",
  },
  accountArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  accountMeta: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "2px",
  },
  accountName: {
    fontSize: "0.92rem",
    fontWeight: 700,
  },
  accountSub: {
    fontSize: "0.82rem",
    color: "#94a3b8",
  },
  accountPill: {
    background: "#11192d",
    border: "1px solid #23314f",
    padding: "8px 12px",
    borderRadius: "999px",
    color: "#cbd5e1",
  },
  authButton: {
    background: "#1f2937",
    color: "#fff",
    border: "1px solid #475569",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  authLink: {
    color: "#c7d2fe",
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#11192d",
    border: "1px solid #23314f",
    fontWeight: 600,
  },
  authPrimaryLink: {
    color: "#fff",
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: "10px",
    background: "#2563eb",
    border: "1px solid #2563eb",
    fontWeight: 700,
  },
  nav: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
    padding: "14px 20px",
    borderBottom: "1px solid #1f2a44",
    background: "#0d1325",
  },
  navLink: {
    color: "#c7d2fe",
    textDecoration: "none",
    padding: "9px 12px",
    borderRadius: "10px",
    background: "#11192d",
    border: "1px solid #23314f",
    fontSize: "0.92rem",
    fontWeight: 600,
  },
  navLinkActive: {
    background: "#2563eb",
    color: "#ffffff",
    border: "1px solid #2563eb",
  },
  main: {
    padding: "0",
  },
};
