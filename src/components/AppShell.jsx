import { NavLink } from "react-router-dom";

const primaryNavItems = [
  { label: "Dashboard", to: "/" },
  { label: "Forecast", to: "/forecast" },
  { label: "Election Map", to: "/election-map" },
  { label: "Firms", to: "/firms" },
  { label: "Campaign Pipeline", to: "/campaigns" }
];

const secondaryNavItems = [
  { label: "Vendors", to: "/vendors", disabled: true },
  { label: "MailOps", to: "/mailops", disabled: true },
  { label: "Compliance", to: "/compliance", disabled: true },
  { label: "Calendar", to: "/calendar", disabled: true }
];

function navClass({ isActive }, disabled = false) {
  if (disabled) {
    return "block cursor-not-allowed rounded-xl border border-white/5 bg-[#0b1220] px-4 py-3 text-sm font-medium text-slate-500 opacity-70";
  }

  return [
    "block rounded-xl px-4 py-3 text-sm font-medium transition",
    isActive
      ? "bg-[#0176D3] text-white shadow-lg"
      : "text-slate-300 hover:bg-white/5 hover:text-white"
  ].join(" ");
}

function NavGroup({ title, items }) {
  return (
    <div>
      <div className="mb-3 px-3 text-xs uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>

      <div className="space-y-2">
        {items.map((item) =>
          item.disabled ? (
            <div key={item.label} className={navClass({ isActive: false }, true)}>
              <div className="flex items-center justify-between gap-3">
                <span>{item.label}</span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-slate-500">
                  Soon
                </span>
              </div>
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={(state) => navClass(state)}
            >
              {item.label}
            </NavLink>
          )
        )}
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-80 shrink-0 border-r border-slate-200 bg-[#0b1220] xl:flex xl:flex-col">
          <div className="border-b border-white/10 px-6 py-6">
            <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">
              VoterSpheres
            </div>
            <div className="mt-2 text-2xl font-semibold text-white">
              Political Command Cloud
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Salesforce-style campaign operations with Bloomberg-style political intelligence.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-8">
              <NavGroup title="Workspace" items={primaryNavItems} />
              <NavGroup title="Next Modules" items={secondaryNavItems} />
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-5">
            <div className="rounded-2xl border border-white/10 bg-[#111827] p-4 shadow-lg">
              <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                Platform Mode
              </div>
              <div className="mt-2 text-sm font-semibold text-white">
                Consultant CRM + Race Intelligence
              </div>
              <div className="mt-2 text-sm text-slate-400">
                Firms, campaigns, fundraising, forecasting, and national election operations.
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6 xl:hidden">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
                  VoterSpheres
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  Political Command Cloud
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 px-4 py-3 md:px-6 xl:hidden">
              <div className="flex gap-2 overflow-x-auto">
                {primaryNavItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/"}
                    className={({ isActive }) =>
                      [
                        "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
                        isActive
                          ? "bg-[#0176D3] text-white"
                          : "border border-slate-200 bg-white text-slate-700"
                      ].join(" ")
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 bg-[#f3f6f9]">{children}</main>
        </div>
      </div>
    </div>
  );
}
