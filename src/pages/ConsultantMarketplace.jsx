import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

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
    <div className="vs-card-muted">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "flex-start"
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>
            {consultant.name || consultant.firm_name || "Consultant"}
          </div>

          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.9rem",
              color: "var(--vs-text-muted)"
            }}
          >
            {consultant.location || consultant.state || "National"} •{" "}
            {consultant.consultant_type ||
              consultant.category ||
              "Political Consulting"}
          </div>
        </div>

        <Badge tone="accent">
          {consultant.tier || consultant.plan_tier || "Verified"}
        </Badge>
      </div>

      <div
        style={{
          marginTop: "1rem",
          fontSize: "0.92rem",
          lineHeight: 1.7,
          color: "var(--vs-text-muted)"
        }}
      >
        {consultant.description ||
          consultant.summary ||
          "Experienced campaign consulting support across strategy, communications, voter contact, and execution."}
      </div>

      <div
        style={{
          marginTop: "1rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem"
        }}
      >
        {specialties.length ? (
          specialties.slice(0, 5).map((item) => (
            <span
              key={item}
              className="vs-badge"
            >
              {item}
            </span>
          ))
        ) : (
          <span className="vs-badge">General Strategy</span>
        )}
      </div>

      <div
        style={{
          marginTop: "1.25rem",
          display: "grid",
          gap: "0.75rem",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))"
        }}
      >
        <div className="vs-card-muted" style={{ padding: "0.85rem" }}>
          <div className="vs-stat-label">State Reach</div>
          <div style={{ marginTop: "0.4rem", fontSize: "0.9rem", fontWeight: 700 }}>
            {consultant.state || consultant.region || "National"}
          </div>
        </div>

        <div className="vs-card-muted" style={{ padding: "0.85rem" }}>
          <div className="vs-stat-label">Focus</div>
          <div style={{ marginTop: "0.4rem", fontSize: "0.9rem", fontWeight: 700 }}>
            {consultant.primary_focus ||
              consultant.category ||
              "Campaign Strategy"}
          </div>
        </div>

        <div className="vs-card-muted" style={{ padding: "0.85rem" }}>
          <div className="vs-stat-label">Contact</div>
          <div
            style={{
              marginTop: "0.4rem",
              fontSize: "0.9rem",
              fontWeight: 700,
              wordBreak: "break-word"
            }}
          >
            {consultant.website ||
              consultant.email ||
              "Available on request"}
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
    <PageShell
      eyebrow="Consultant Marketplace"
      title="Find the campaign operators behind the strongest programs."
      description="Discover political consultants, strategy partners, field operators, and campaign specialists across the map."
      demo={demoMode}
      demoText="Demo consultant marketplace is active. Profiles are preloaded for presentation and testing."
    >
      {error ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}
        >
          {error}
        </div>
      ) : null}

      <div className="vs-grid-4">
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

      <SectionCard
        title="Marketplace Filters"
        subtitle="Narrow consultants by state, focus area, and search term."
      >
        <div className="vs-grid-3">
          <input
            className="vs-input"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Search firms, specialties, locations..."
          />

          <input
            className="vs-input"
            value={filters.state}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, state: e.target.value }))
            }
            placeholder="Filter by state"
          />

          <input
            className="vs-input"
            value={filters.specialty}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, specialty: e.target.value }))
            }
            placeholder="Filter by specialty"
          />
        </div>

        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap"
          }}
        >
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() =>
              setFilters({
                search: "",
                state: "",
                specialty: ""
              })
            }
          >
            Clear Filters
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Consultant Directory"
        subtitle="Political consultants and campaign operators across your active network."
      >
        <div className="vs-stack">
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
      </SectionCard>
    </PageShell>
  );
}
