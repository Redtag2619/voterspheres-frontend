import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Executive Dashboard", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Forecast", to: "/forecast" },
  { label: "Election Map", to: "/election-map" },
  { label: "Firms", to: "/firms" },
  { label: "Campaign Pipeline", to: "/campaign-pipeline" },
  { label: "MailOps", to: "/mailops" }
];

function navClass({ isActive }) {
  return [
    "rounded-xl px-4 py-2 text-sm font-medium transition",
    isActive
      ? "bg-[#0176D3] text-white shadow-sm"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
  ].join(" ");
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <NavLink
            to="/"
            className="text-xl font-semibold tracking-tight text-slate-900"
          >
            VoterSpheres
          </NavLink>
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
      </div>
    </header>
  );
}
