import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/" },
  { label: "Forecast", to: "/forecast" },
  { label: "Election Map", to: "/election-map" },
  { label: "Firms", to: "/firms" },
  { label: "Campaign Pipeline", to: "/campaigns" }
];

function navClass({ isActive }) {
  return [
    "block rounded-xl px-4 py-3 text-sm font-medium transition",
    isActive
      ? "bg-cyan-500 text-slate-950 shadow-lg"
      : "text-slate-300 hover:bg-white/5 hover:text-white"
  ].join(" ");
}

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[#060b14] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#08101d] xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
              VoterSpheres
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              Campaign OS
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Intelligence, CRM, pipeline, and campaign operations in one place.
            </p>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === "/"} className={navClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/10 px-6 py-5">
            <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Platform Mode
              </div>
              <div className="mt-2 text-sm font-semibold text-white">
                Political Intelligence + CRM
              </div>
              <div className="mt-2 text-sm text-slate-400">
                Forecasting, firms, campaigns, and battleground operations.
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#08101d]/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6 xl:hidden">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                  VoterSpheres
                </div>
                <div className="text-lg font-semibold text-white">
                  Campaign OS
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 px-4 py-3 md:px-6 xl:hidden">
              <div className="flex gap-2 overflow-x-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      [
                        "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-cyan-500 text-slate-950"
                          : "border border-white/10 bg-[#0b1220] text-slate-300"
                      ].join(" ")
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
