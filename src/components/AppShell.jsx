import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const primaryNav = [
  { label: "Command Center", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Forecast", to: "/forecast" },
  { label: "Election Map", to: "/election-map" }
];

const crmNav = [
  { label: "Firms", to: "/firms" },
  { label: "Campaign Pipeline", to: "/campaigns" },
  { label: "Vendors", to: "/vendors" },
  { label: "MailOps", to: "/mailops" }
];

function linkClasses({ isActive }) {
  return [
    "group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
    isActive
      ? "bg-[#0176D3] text-white shadow-sm"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
  ].join(" ");
}

function SectionTitle({ children }) {
  return (
    <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
      {children}
    </div>
  );
}

function NavSection({ title, items, onNavigate }) {
  return (
    <div className="space-y-2">
      <SectionTitle>{title}</SectionTitle>

      <div className="space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={linkClasses}
            onClick={onNavigate}
          >
            {({ isActive }) => (
              <>
                <span>{item.label}</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    isActive ? "bg-white" : "bg-slate-300 group-hover:bg-slate-400"
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const allItems = [...primaryNav, ...crmNav];
    const exactMatch = allItems.find((item) => item.to === location.pathname);
    if (exactMatch) return exactMatch.label;

    if (location.pathname.startsWith("/firms/")) return "Firm Workspace";
    if (location.pathname.startsWith("/campaigns/")) return "Campaign Workspace";

    return "VoterSpheres";
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f3f6f9] text-slate-900">
      <div className="flex min-h-screen">
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside
          className={[
            "fixed inset-y-0 left-0 z-40 w-80 transform border-r border-slate-200 bg-white shadow-xl transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          ].join(" ")}
        >
          <div className="flex h-full flex-col">
            <div className="border-b border-slate-200 px-6 py-6">
              <NavLink
                to="/"
                className="block"
                onClick={() => setMobileOpen(false)}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0176D3]">
                  Political Operating System
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  VoterSpheres
                </div>
                <div className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  The command platform for campaigns, consultants, vendors, forecasting,
                  and political mail intelligence.
                </div>
              </NavLink>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
              <NavSection
                title="Intelligence"
                items={primaryNav}
                onNavigate={() => setMobileOpen(false)}
              />

              <NavSection
                title="Operations"
                items={crmNav}
                onNavigate={() => setMobileOpen(false)}
              />

              <div className="rounded-3xl border border-[#0176D3]/15 bg-[#0176D3]/5 p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0176D3]">
                  Platform Positioning
                </div>
                <div className="mt-3 text-base font-semibold text-slate-900">
                  Salesforce for politics.
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  CRM, campaign operations, forecast intelligence, mail intelligence,
                  and vendor performance in one system.
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 px-5 py-4">
              <div className="rounded-2xl bg-slate-50 px-4 py-3">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  Platform Mode
                </div>
                <div className="mt-1 text-sm font-medium text-slate-900">
                  National Political Intelligence
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
                  onClick={() => setMobileOpen((value) => !value)}
                  aria-label="Toggle navigation"
                >
                  <span className="text-lg">☰</span>
                </button>

                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0176D3]">
                    VoterSpheres
                  </div>
                  <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 lg:text-2xl">
                    {pageTitle}
                  </h1>
                </div>
              </div>

              <div className="hidden items-center gap-3 md:flex">
                <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  Campaign Intelligence
                </div>
                <div className="rounded-full bg-[#0176D3] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                  Command Mode
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
