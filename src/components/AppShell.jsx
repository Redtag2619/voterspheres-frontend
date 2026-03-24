import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Executive Dashboard", to: "/" },
  { label: "Campaign Pipeline", to: "/campaigns" },
  { label: "Vendors", to: "/vendors" },
  { label: "MailOps", to: "/mailops" },
  { label: "Forecast", to: "/forecast" },
  { label: "Election Map", to: "/election-map" },
  { label: "Firms", to: "/firms" }
];

function navClass({ isActive }) {
  return [
    "rounded-xl px-4 py-2 text-sm font-medium transition",
    isActive
      ? "bg-[#0176D3] text-white shadow-sm"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
  ].join(" ");
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f3f6f9]">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xl font-semibold tracking-tight text-slate-900">
              VoterSpheres
            </Link>
            <span className="hidden rounded-full bg-[#0176D3]/10 px-3 py-1 text-xs font-medium text-[#0176D3] md:inline-flex">
              Political Operating System
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass} end={item.to === "/"}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-900">
                {user?.first_name || user?.email || "User"}
              </div>
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">
                {user?.role || "viewer"}
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
