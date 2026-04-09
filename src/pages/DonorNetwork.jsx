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

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

const fallbackData = {
  results: [
    {
      id: 1,
      donor_name: "Atlantic Leadership Fund",
      donor_type: "PAC",
      state: "Georgia",
      amount: 250000,
      relationship_strength: "High",
    },
    {
      id: 2,
      donor_name: "Keystone Civic Network",
      donor_type: "Individual Network",
      state: "Pennsylvania",
      amount: 175000,
      relationship_strength: "Medium",
    },
    {
      id: 3,
      donor_name: "Great Lakes Action Council",
      donor_type: "PAC",
      state: "Michigan",
      amount: 120000,
      relationship_strength: "Growing",
    },
  ],
  summary: {
    total_donors: 3,
    total_amount: 545000,
    top_state: "Georgia",
  },
  _demo: true,
};

function strengthTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "danger";
  if (v === "medium") return "demo";
  if (v === "growing") return "info";
  return "default";
}

function DonorRow({ donor }) {
  return (
    <ResponsiveRow
      title={donor.donor_name || "Unnamed Donor"}
      subtitle={`${donor.state || "Unknown state"} • ${donor.donor_type || "Unknown type"}`}
      meta={[
        { label: "Amount", value: formatMoney(donor.amount || 0) },
        { label: "Relationship", value: donor.relationship_strength || "N/A" },
      ]}
      alert={
        String(donor.relationship_strength || "").toLowerCase() === "high"
          ? "vs-live-dot"
          : String(donor.relationship_strength || "").toLowerCase() === "medium"
          ? "vs-live-dot-warning"
          : "vs-live-dot-success"
      }
      right={
        <Badge tone={strengthTone(donor.relationship_strength)}>
          {donor.relationship_strength || "Unknown"}
        </Badge>
      }
    />
  );
}

export default function DonorNetwork() {
  const { demoMode } = useDemoMode();
  const { filters } = useExecutiveFilters();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [networkData, setNetworkData] = useState(fallbackData);
  const [localSearch, setLocalSearch] = useState("");
  const [isDemoData, setIsDemoData] = useState(Boolean(fallbackData._demo));

  useEffect(() => {
    let active = true;

    async function loadDonorNetwork() {
      try {
        setLoading(true);
        setError("");

        const params = {};
        if (filters.state) params.state = filters.state;
        if (localSearch.trim()) params.search = localSearch.trim();

        const data = await api.donorNetwork(params);

        if (!active) return;

        setNetworkData(data || fallbackData);
        setIsDemoData(Boolean(data?._demo || data?.demo));
      } catch (err) {
        if (!active) return;

        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load donor network"
        );
        setNetworkData(fallbackData);
        setIsDemoData(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDonorNetwork();

    return () => {
      active = false;
    };
  }, [filters.state, localSearch]);

  const filteredResults = useMemo(() => {
    let rows = Array.isArray(networkData?.results) ? networkData.results : [];

    if (filters.state) {
      rows = rows.filter((row) => row.state === filters.state);
    }

    if (localSearch.trim()) {
      const q = localSearch.trim().toLowerCase();
      rows = rows.filter((row) => {
        return (
          String(row.donor_name || "").toLowerCase().includes(q) ||
          String(row.donor_type || "").toLowerCase().includes(q) ||
          String(row.relationship_strength || "").toLowerCase().includes(q) ||
          String(row.state || "").toLowerCase().includes(q)
        );
      });
    }

    return rows;
  }, [networkData, filters.state, localSearch]);

  const summary = useMemo(() => {
    if (!filteredResults.length) {
      return {
        total_donors: 0,
        total_amount: 0,
        top_state: "N/A",
      };
    }

    const totalAmount = filteredResults.reduce(
      (sum, row) => sum + Number(row.amount || 0),
      0
    );

    const stateTotals = filteredResults.reduce((acc, row) => {
      const key = row.state || "Unknown";
      acc[key] = (acc[key] || 0) + Number(row.amount || 0);
      return acc;
    }, {});

    const topState =
      Object.entries(stateTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    return {
      total_donors: filteredResults.length,
      total_amount: totalAmount,
      top_state: topState,
    };
  }, [filteredResults]);

  const highStrengthCount = filteredResults.filter(
    (row) => String(row.relationship_strength || "").toLowerCase() === "high"
  ).length;

  return (
    <PageShell
      eyebrow="Donor Network"
      title="See the donor network behind campaign momentum."
      description="Track donor relationships, contribution concentration, and strategic fundraising clusters across your executive filter set."
      demo={demoMode}
      demoText="Global Demo Mode is active. This module can render fallback donor intelligence when live endpoints are unavailable."
      tickerItems={[
        {
          label: "Donors",
          value: `${summary.total_donors}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "High Strength",
          value: `${highStrengthCount}`,
          dotClass: "vs-live-dot",
        },
        {
          label: "Top State",
          value: `${summary.top_state}`,
          dotClass: "vs-live-dot-warning",
        },
      ]}
    >
      <DemoBanner
        active={isDemoData}
        text="Demo donor network data is active for this module."
      />

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="Tracked Donors"
          value={summary.total_donors}
          subtext="Visible across current filters"
        />
        <StatCard
          label="Total Amount"
          value={formatMoney(summary.total_amount)}
          subtext="Combined network contribution value"
        />
        <StatCard
          label="Top State"
          value={summary.top_state}
          subtext="Highest donor concentration"
        />
        <StatCard
          label="High Strength"
          value={highStrengthCount}
          subtext="Strongest donor relationships"
        />
      </div>

      <SectionCard
        title="Donor Filters"
        subtitle="Search within the donor network while honoring your executive state filter."
        right={
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => setLocalSearch("")}
          >
            Clear Search
          </button>
        }
      >
        <div className="vs-grid-2">
          <input
            className="vs-input"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search donor name, type, state, or relationship..."
          />
          <input
            className="vs-input"
            value={filters.state || ""}
            readOnly
            placeholder="Executive state filter"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Donor Relationship Board"
        subtitle="High-value contributors and relationship strength across the filtered network."
        right={<Badge tone={isDemoData ? "demo" : "active"}>{isDemoData ? "Demo Data" : "Live Data"}</Badge>}
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading donor network..." />
          ) : !filteredResults.length ? (
            <EmptyState text="No donors match the active filters." />
          ) : (
            filteredResults.map((donor) => (
              <DonorRow key={donor.id || donor.donor_name} donor={donor} />
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
