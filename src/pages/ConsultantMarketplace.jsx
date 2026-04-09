import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import DemoBanner from "../components/ui/DemoBanner";
import { useDemoMode } from "../context/DemoModeContext.jsx";
import { useExecutiveFilters } from "../context/ExecutiveFiltersContext.jsx";

const fallbackData = {
  results: [
    {
      id: 1,
      name: "Red Tag Strategies",
      category: "General Consulting",
      state: "Louisiana",
      website: "https://example.com",
      status: "active",
    },
    {
      id: 2,
      name: "Capitol Campaign Group",
      category: "Media + Strategy",
      state: "Georgia",
      website: "https://example.com",
      status: "active",
    },
    {
      id: 3,
      name: "Keystone Field Partners",
      category: "Field Operations",
      state: "Pennsylvania",
      website: "https://example.com",
      status: "active",
    },
  ],
  _demo: true,
};

function statusTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "active") return "active";
  if (v === "featured") return "accent";
  if (v === "watch") return "demo";
  return "default";
}

function ConsultantRow({ consultant }) {
  return (
    <ResponsiveRow
      title={consultant.name || "Unnamed Consultant"}
      subtitle={`${consultant.state || "Unknown state"} • ${consultant.category || "Uncategorized"}`}
      meta={[
        { label: "Category", value: consultant.category || "N/A" },
        { label: "State", value: consultant.state || "N/A" },
        { label: "Website", value: consultant.website || "N/A" },
      ]}
      alert={
        String(consultant.status || "").toLowerCase() === "active"
          ? "vs-live-dot-success"
          : "vs-live-dot-warning"
      }
      right={
        <Badge tone={statusTone(consultant.status)}>
          {consultant.status || "Unknown"}
        </Badge>
      }
    />
  );
}

export default function ConsultantMarketplace() {
  const { demoMode } = useDemoMode();
  const { filters } = useExecutiveFilters();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [consultantData, setConsultantData] = useState(fallbackData);
  const [localFilters, setLocalFilters] = useState({
    search: "",
    category: "",
    status: "",
  });
  const [isDemoData, setIsDemoData] = useState(Boolean(fallbackData._demo));

  useEffect(() => {
    let active = true;

    async function loadConsultants() {
      try {
        setLoading(true);
        setError("");

        const params = {};
        if (filters.state) params.state = filters.state;
        if (localFilters.search.trim()) params.search = localFilters.search.trim();
        if (localFilters.category.trim()) params.category = localFilters.category.trim();
        if (localFilters.status.trim()) params.status = localFilters.status.trim();

        const data = await api.consultants(params);

        if (!active) return;

        setConsultantData(data || fallbackData);
        setIsDemoData(Boolean(data?._demo || data?.demo));
      } catch (err) {
        if (!active) return;

        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load consultants"
        );
        setConsultantData(fallbackData);
        setIsDemoData(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadConsultants();

    return () => {
      active = false;
    };
  }, [filters.state, localFilters.search, localFilters.category, localFilters.status]);

  const filteredResults = useMemo(() => {
    let rows = Array.isArray(consultantData?.results) ? consultantData.results : [];

    if (filters.state) {
      rows = rows.filter((row) => row.state === filters.state);
    }

    if (localFilters.search.trim()) {
      const q = localFilters.search.trim().toLowerCase();
      rows = rows.filter((row) => {
        return (
          String(row.name || "").toLowerCase().includes(q) ||
          String(row.category || "").toLowerCase().includes(q) ||
          String(row.state || "").toLowerCase().includes(q)
        );
      });
    }

    if (localFilters.category.trim()) {
      rows = rows.filter(
        (row) =>
          String(row.category || "").toLowerCase() ===
          localFilters.category.trim().toLowerCase()
      );
    }

    if (localFilters.status.trim()) {
      rows = rows.filter(
        (row) =>
          String(row.status || "").toLowerCase() ===
          localFilters.status.trim().toLowerCase()
      );
    }

    return rows;
  }, [consultantData, filters.state, localFilters]);

  const summary = useMemo(() => {
    const categories = new Set(filteredResults.map((row) => row.category).filter(Boolean));
    const states = new Set(filteredResults.map((row) => row.state).filter(Boolean));
    const activeCount = filteredResults.filter(
      (row) => String(row.status || "").toLowerCase() === "active"
    ).length;

    return {
      total: filteredResults.length,
      categories: categories.size,
      states: states.size,
      active: activeCount,
    };
  }, [filteredResults]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(
        (consultantData?.results || [])
          .map((row) => row.category)
          .filter(Boolean)
      )
    ).sort();
  }, [consultantData]);

  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(
        (consultantData?.results || [])
          .map((row) => row.status)
          .filter(Boolean)
      )
    ).sort();
  }, [consultantData]);

  return (
    <PageShell
      eyebrow="Consultant Marketplace"
      title="Find the consulting partners behind campaign execution."
      description="Browse consulting firms, campaign specialists, and strategic operators across your active executive filter set."
      demo={demoMode}
      demoText="Global Demo Mode is active. This module can render fallback consultant data when live endpoints are unavailable."
      tickerItems={[
        {
          label: "Consultants",
          value: `${summary.total}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Categories",
          value: `${summary.categories}`,
          dotClass: "vs-live-dot-warning",
        },
        {
          label: "Active",
          value: `${summary.active}`,
          dotClass: "vs-live-dot",
        },
      ]}
    >
      <DemoBanner
        active={isDemoData}
        text="Demo consultant marketplace data is active for this module."
      />

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="Visible Consultants"
          value={summary.total}
          subtext="Results in current view"
        />
        <StatCard
          label="Categories"
          value={summary.categories}
          subtext="Specialties represented"
        />
        <StatCard
          label="States"
          value={summary.states}
          subtext="Geographic footprint"
        />
        <StatCard
          label="Active Firms"
          value={summary.active}
          subtext="Currently marked active"
        />
      </div>

      <SectionCard
        title="Marketplace Filters"
        subtitle="Search within the consultant marketplace while honoring your executive state filter."
        right={
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() =>
              setLocalFilters({
                search: "",
                category: "",
                status: "",
              })
            }
          >
            Clear Filters
          </button>
        }
      >
        <div className="vs-grid-2">
          <input
            className="vs-input"
            value={localFilters.search}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Search consultant, category, or state..."
          />

          <input
            className="vs-input"
            value={filters.state || ""}
            readOnly
            placeholder="Executive state filter"
          />
        </div>

        <div className="vs-grid-2" style={{ marginTop: "12px" }}>
          <select
            className="vs-select"
            value={localFilters.category}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, category: e.target.value }))
            }
          >
            <option value="">All categories</option>
            {categoryOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            className="vs-select"
            value={localFilters.status}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="">All statuses</option>
            {statusOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      <SectionCard
        title="Consultant Directory"
        subtitle="Campaign consulting firms and specialists across the filtered marketplace."
        right={
          <Badge tone={isDemoData ? "demo" : "active"}>
            {isDemoData ? "Demo Data" : "Live Data"}
          </Badge>
        }
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading consultant marketplace..." />
          ) : !filteredResults.length ? (
            <EmptyState text="No consultants match the active filters." />
          ) : (
            filteredResults.map((consultant) => (
              <ConsultantRow
                key={consultant.id || consultant.name}
                consultant={consultant}
              />
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
