import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
      {text}
    </div>
  );
}

function StatCard({ label, value, subtext }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{subtext}</div>
    </div>
  );
}

function Badge({ children, tone = "default" }) {
  const classes =
    tone === "demo"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "active"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : tone === "premium"
      ? "border-[#0176D3]/20 bg-[#0176D3]/10 text-[#0176D3]"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classes}`}>
      {children}
    </span>
  );
}

function ConsultantCard({ consultant }) {
  const specialties = Array.isArray(consultant.specialties)
    ? consultant.specialties
    : String(
        consultant.specialties ||
          consultant.services ||
          consultant.focus_areas ||
          ""
      )
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-slate-900">
            {consultant.name || consultant.firm_name || "Consultant"}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            {consultant.location || consultant.state || "National"} •{" "}
            {consultant.consultant_type || consultant.category || "Political Consulting"}
          </div>
        </div>

        <Badge tone="premium">
          {consultant.tier || consultant.plan_tier || "Verified"}
        </Badge>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        {consultant.description ||
          consultant.summary ||
          "Experienced campaign consulting support across strategy, communications, voter contact, and execution."}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {specialties.length ? (
          specialties.slice(0, 5).map((item) => (
            <span
              key={item}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
            General Strategy
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
            State Reach
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900">
            {consultant.state || consultant.region || "National"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Focus
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900">
            {consultant.primary_focus || consultant.category || "Campaign Strategy"}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
            Contact
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900 break-all">
            {consultant.website || consultant.email || "Available on request"}
          </div>
        </div>
      </div>
    </div>
  );
}

const fallbackData = {
  results: [
    {
      id: 1,
      name: "Red Tag Strategies",
      location: "Georgia",
      consultant_type: "General Consulting",
      description:
        "Full-service political consulting across direct mail, campaign operations, strategic communications, and execution oversight.",
      specialties: ["Direct Mail", "Campaign Strategy", "Operations", "Messaging"],
      state: "Georgia",
      primary_focus: "Campaign Strategy",
      website: "voterspheres.org",
      tier: "Featured"
    },
    {
      id: 2,
      name: "Capitol Victory Group",
      location: "Pennsylvania",
      consultant_type: "Media + Targeting",
      description:
        "Data-informed consulting support for persuasion programs, paid media coordination, and turnout architecture.",
      specialties: ["Media", "Targeting", "Polling", "Turnout"],
      state: "Pennsylvania",
      primary_focus: "Paid Media",
      website: "Available on request",
      tier: "Verified"
    },
    {
      id: 3,
      name: "Southern Field Advisors",
      location: "Georgia",
      consultant_type: "Field + GOTV",
      description:
        "Ground-game consulting for voter contact programs, turnout structure, and regional field execution.",
      specialties: ["Field", "GOTV", "Volunteer Ops", "Regional Execution"],
      state: "Georgia",
      primary_focus: "Field Operations",
      website: "Available on request",
      tier: "Verified"
    }
  ],
  summary: {
    total_consultants: 3,
    featured_consultants: 1,
    states_covered: 2,
    specialties_tracked: 12
  }
};

export default function ConsultantMarketplace() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [marketplaceData, setMarketplaceData] = useState(fallbackData);

  const [filters, setFilters] = useState({
    search: "",
    state: "",
    specialty: ""
  });

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useEffect(() => {
    let active = true;

    async function loadMarketplace() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        if (filters.search) params.set("q", filters.search);
        if (filters.state) params.set("state", filters.state);
        if (filters.specialty) params.set("specialty", filters.specialty);

        const query = params.toString() ? `?${params.toString()}` : "";

        const response = await api.get(`/consultants${query}`, {
          timeout: 6000
        });

        if (!active) return;

        const payload = response?.data || fallbackData;

        setMarketplaceData({
          results: payload.results?.length ? payload.results : fallbackData.results,
          summary: payload.summary || fallbackData.summary
        });
      } catch (err) {
        if (!active) return;

        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load consultant marketplace"
        );

        setMarketplaceData(fallbackData);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMarketplace();

    return () => {
      active = false;
    };
  }, [filters]);

  const consultants = useMemo(
    () => marketplaceData.results || [],
    [marketplaceData.results]
  );

  const summary = marketplaceData.summary || fallbackData.summary;

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
              Consultant Marketplace
            </div>

            {demoMode ? <Badge tone="demo">Demo Mode</Badge> : null}
          </div>

          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Find the campaign operators behind the strongest programs.
          </h1>

          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Discover political consultants, strategy partners, field operators, and campaign specialists across the map.
          </p>

          {demoMode ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Demo consultant marketplace is active. Profiles are preloaded for presentation and testing.
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Visible Consultants"
            value={summary.total_consultants || 0}
            subtext="Profiles in the marketplace"
          />
          <StatCard
            label="Featured Firms"
            value={summary.featured_consultants || 0}
            subtext="Highlighted consultant partners"
          />
          <StatCard
            label="States Covered"
            value={summary.states_covered || 0}
            subtext="Regional and national reach"
          />
          <StatCard
            label="Specialties Tracked"
            value={summary.specialties_tracked || 0}
            subtext="Capabilities across profiles"
          />
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Marketplace Filters</h2>
            <p className="mt-1 text-sm text-slate-500">
              Narrow consultants by state, focus area, and search term.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Search firms, specialties, locations..."
            />

            <input
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
              value={filters.state}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, state: e.target.value }))
              }
              placeholder="Filter by state"
            />

            <input
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
              value={filters.specialty}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, specialty: e.target.value }))
              }
              placeholder="Filter by specialty"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setFilters({
                  search: "",
                  state: "",
                  specialty: ""
                })
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#0176D3]"
            >
              Clear Filters
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Consultant Directory</h2>
            <p className="mt-1 text-sm text-slate-500">
              Political consultants and campaign operators across your active network.
            </p>
          </div>

          <div className="space-y-4">
            {loading ? (
              <EmptyState text="Loading consultant marketplace..." />
            ) : !consultants.length ? (
              <EmptyState text="No consultants found for the current filters." />
            ) : (
              consultants.map((consultant, index) => (
                <ConsultantCard
                  key={`${consultant.id || index}-${consultant.name || consultant.firm_name}`}
                  consultant={consultant}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
