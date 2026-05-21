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

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function normalizeState(value) {
  return String(value || "").trim();
}

function ConsultantRow({ consultant }) {
  return (
    <ResponsiveRow
      title={consultant.name || consultant.firm_name || "Unnamed Consultant"}
      subtitle={[consultant.state || "Unknown state", consultant.category || "Uncategorized"]
        .filter(Boolean)
        .join(" - ")}
      meta={[
        { label: "Category", value: consultant.category || "N/A" },
        { label: "State", value: consultant.state || "N/A" },
        { label: "Website", value: consultant.website || "N/A" },
        { label: "Influence", value: consultant.influence_score || 0 },
      ]}
      alert={
        String(consultant.status || "").toLowerCase() === "active"
          ? "vs-live-dot-success"
          : "vs-live-dot-warning"
      }
      right={
        <Badge tone={statusTone(consultant.status)}>
          {consultant.status || "active"}
        </Badge>
      }
    />
  );
}

export default function ConsultantMarketplace() {
  const { demoMode } = useDemoMode();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [consultantData, setConsultantData] = useState(fallbackData);
  const [isDemoData, setIsDemoData] = useState(Boolean(fallbackData._demo));

  const [localFilters, setLocalFilters] = useState({
    search: "",
    state: "",
    category: "",
    status: "",
  });

  useEffect(() => {
    let active = true;

    async function loadConsultants() {
      try {
        setLoading(true);
        setError("");

        const params = {};
        if (localFilters.state) params.state = localFilters.state;
        if (localFilters.search.trim()) params.search = localFilters.search.trim();
        if (localFilters.category.trim()) params.category = localFilters.category.trim();
        if (localFilters.status.trim()) params.status = localFilters.status.trim();

        const data = api.consultants
          ? await api.consultants(params)
          : await api.get("/consultants", { params }).then((r) => r.data);

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
  }, [
    localFilters.search,
    localFilters.state,
    localFilters.category,
    localFilters.status,
  ]);

  const allRows = useMemo(() => normalizeRows(consultantData), [consultantData]);

  const filteredResults = useMemo(() => {
    let rows = allRows;

    if (localFilters.state) {
      rows = rows.filter(
        (row) =>
          normalizeState(row.state).toLowerCase() ===
          normalizeState(localFilters.state).toLowerCase()
      );
    }

    if (localFilters.search.trim()) {
      const q = localFilters.search.trim().toLowerCase();
      rows = rows.filter((row) => {
        return (
          String(row.name || "").toLowerCase().includes(q) ||
          String(row.firm_name || "").toLowerCase().includes(q) ||
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
  }, [allRows, localFilters]);

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

  const stateOptions = useMemo(() => {
    return Array.from(
      new Set(allRows.map((row) => row.state).filter(Boolean))
    ).sort();
  }, [allRows]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(allRows.map((row) => row.category).filter(Boolean))
    ).sort();
  }, [allRows]);

  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(allRows.map((row) => row.status || "active").filter(Boolean))
    ).sort();
  }, [allRows]);

  return (
    <PageShell
      eyebrow="Consultant Marketplace"
      title="Find the consulting partners behind campaign execution."
      description="Browse consulting firms, campaign specialists, and strategic operators by state, category, and status."
      demo={demoMode}
      demoText="Global Demo Mode is active. This module can render fallback consultant data when live endpoints are unavailable."
      tickerItems={[
        {
          label: "Consultants",
          value: `${summary.total}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "States",
          value: `${summary.states}`,
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
        subtitle="Search and filter consultants across all imported states."
        right={
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() =>
              setLocalFilters({
                search: "",
                state: "",
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

          <select
            className="vs-select"
            value={localFilters.state}
            onChange={(e) =>
              setLocalFilters((prev) => ({ ...prev, state: e.target.value }))
            }
          >
            <option value="">All states</option>
            {stateOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
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
        subtitle="Campaign consulting firms and specialists across the selected marketplace filters."
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
