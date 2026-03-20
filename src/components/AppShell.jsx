import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }

  return data;
}

const primaryNav = [
  { label: "Command Center", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Forecast", to: "/forecast" },
  { label: "Election Map", to: "/election-map" },
  { label: "Alerts", to: "/alerts" }
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

function CommandBar({
  open,
  onClose,
  firms,
  campaigns,
  query,
  setQuery,
  navigate
}) {
  const commandItems = useMemo(() => {
    const routeItems = [...primaryNav, ...crmNav].map((item) => ({
      id: `route-${item.to}`,
      label: item.label,
      sublabel: item.to,
      action: () => navigate(item.to)
    }));

    const firmItems = (firms || []).map((firm) => ({
      id: `firm-${firm.id}`,
      label: firm.name || `Firm ${firm.id}`,
      sublabel: "Firm Workspace",
      action: () => navigate(`/firms/${firm.id}`)
    }));

    const campaignItems = (campaigns || []).map((campaign) => ({
      id: `campaign-${campaign.id}`,
      label: campaign.campaign_name || campaign.candidate_name || `Campaign ${campaign.id}`,
      sublabel: "Campaign Workspace",
      action: () => navigate(`/campaigns/${campaign.id}`)
    }));

    const all = [...routeItems, ...firmItems, ...campaignItems];
    const q = query.trim().toLowerCase();

    if (!q) return all.slice(0, 12);

    return all
      .filter((item) => {
        const haystack = `${item.label} ${item.sublabel}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 20);
  }, [firms, campaigns, query, navigate]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 px-4 pt-24">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 p-4">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, firms, campaigns..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-400"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {commandItems.length ? (
            <div className="space-y-2">
              {commandItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                >
                  <div>
                    <div className="font-medium text-slate-900">{item.label}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.sublabel}</div>
                  </div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    Open
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              No results found.
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>Command Bar</span>
          <button type="button" onClick={onClose} className="rounded-xl px-3 py-1 hover:bg-slate-100">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [firms, setFirms] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [selectedFirmId, setSelectedFirmId] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function loadShellData() {
      try {
        const [firmsRes, campaignsRes, alertsRes] = await Promise.all([
          apiRequest("/api/crm/firms").catch(() => []),
          apiRequest("/api/crm/campaigns").catch(() => []),
          apiRequest("/api/alerts").catch(() => ({ alerts: [] }))
        ]);

        if (!active) return;

        setFirms(Array.isArray(firmsRes) ? firmsRes : []);
        setCampaigns(Array.isArray(campaignsRes) ? campaignsRes : []);
        setAlertsCount(Array.isArray(alertsRes?.alerts) ? alertsRes.alerts.length : 0);
      } catch {
        if (!active) return;
      }
    }

    loadShellData();

    return () => {
      active = false;
    };
  }, [location.pathname]);

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }

      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
      <CommandBar
        open={commandOpen}
        onClose={() => {
          setCommandOpen(false);
          setCommandQuery("");
        }}
        firms={firms}
        campaigns={campaigns}
        query={commandQuery}
        setQuery={setCommandQuery}
        navigate={navigate}
      />

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
              <button
                type="button"
                onClick={() => {
                  navigate("/");
                  setMobileOpen(false);
                }}
                className="block text-left"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#0176D3]">
                  Political Operating System
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  VoterSpheres
                </div>
                <div className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Command center for campaigns, consultants, vendors, forecasting, alerts, and mail intelligence.
                </div>
              </button>
            </div>

            <div className="px-4 pt-5">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Firm Switcher
                </div>
                <select
                  value={selectedFirmId}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedFirmId(value);
                    if (value) navigate(`/firms/${value}`);
                  }}
                  className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none"
                >
                  <option value="">Select firm workspace</option>
                  {firms.map((firm) => (
                    <option key={firm.id} value={firm.id}>
                      {firm.name || `Firm ${firm.id}`}
                    </option>
                  ))}
                </select>
              </div>
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
                  CRM, campaign operations, forecast intelligence, alerts, vendor performance, and mail intelligence in one system.
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
                <button
                  type="button"
                  onClick={() => setCommandOpen(true)}
                  className="inline-flex min-w-[260px] items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 transition hover:bg-slate-100"
                >
                  <span>Search campaigns, firms, pages...</span>
                  <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-400">
                    Ctrl K
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/alerts")}
                  className="relative rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Alerts
                  {alertsCount > 0 ? (
                    <span className="ml-2 inline-flex rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                      {alertsCount}
                    </span>
                  ) : null}
                </button>

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
