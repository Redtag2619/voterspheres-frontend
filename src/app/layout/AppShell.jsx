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

function navClass({ isActive }) {
  return isActive
    ? "inline-flex items-center rounded-full border border-[rgba(1,118,211,0.18)] bg-[rgba(1,118,211,0.08)] px-3 py-2 text-sm font-semibold text-[#0176d3]"
    : "inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-[#0176d3] hover:text-[#0176d3]";
}

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0176d3] text-sm font-bold text-white shadow-sm"
            >
              VS
            </Link>

            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-[#0176d3]">
                VoterSpheres
              </div>
              <div className="truncate text-sm text-slate-500">
                Campaign intelligence operating system
              </div>
            </div>
          </div>

          <nav className="hidden flex-wrap items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-slate-100 bg-[#f8fafc] lg:hidden">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={navClass}
                style={{ whiteSpace: "nowrap" }}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
