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

function normalizeState(value) {
  return String(value || "").trim().toUpperCase();
}

function displaySource(value) {
  if (value === "fec_schedule_a") return "FEC Schedule A";
  if (value === "manual_live_seed") return "Seeded Donor Data";
  if (value === "manual") return "Manual Donor Data";
  return value || "FEC";
}

const fallbackData = {
  results: [],
  stateBreakdown: [],
  committeeBreakdown: [],
  summary: {
    total_donors: 0,
    total_amount: 0,
    top_state: "N/A",
    source: "No live donor data loaded",
  },
  _demo: false,
};

function strengthTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "danger";
  if (v === "medium") return "demo";
  if (v === "growing") return "info";
  if (v === "new") return "accent";
  return "default";
}

async function loadDonors(params) {
  if (typeof api.donorNetwork === "function") {
    return api.donorNetwork(params);
  }

  if (typeof api.get === "function") {
    const response = await api.get("/donors/network", { params });
    return response?.data || response;
  }

  throw new Error(
    "Missing api.donorNetwork. Add donorNetwork: (params) => get('/donors/network', { params }) to src/services/api.js."
  );
}

function DonorRow({ donor }) {
  const amount = Number(donor.amount || donor.total_amount || 0);
  const sourceLabel = displaySource(donor.source);

  return (
    <ResponsiveRow
      title={donor.donor_name || donor.name || "Unnamed Donor"}
      subtitle={`${donor.state || "Unknown state"} | ${
        donor.donor_type || "Unknown type"
      } | ${donor.committee_name || "Committee unavailable"}`}
      meta={[
        { label: "Amount", value: formatMoney(amount) },
        {
          label: "Contributions",
          value: donor.contribution_count || donor.count || 1,
        },
        {
          label: "Relationship",
          value: donor.relationship_strength || "N/A",
        },
        {
          label: "Source",
          value: sourceLabel,
        },
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

function StateBreakdownRow({ item }) {
  return (
    <ResponsiveRow
      title={item.state || "Unknown"}
      subtitle={`${item.donor_count || 0} donors`}
      meta={[
        { label: "Amount", value: formatMoney(item.total_amount || 0) },
        { label: "Average", value: formatMoney(item.average_amount || 0) },
      ]}
      right={<Badge tone="accent">{formatMoney(item.total_amount || 0)}</Badge>}
    />
  );
}

function CommitteeRow({ item }) {
  return (
    <ResponsiveRow
      title={item.committee_name || item.committee_id || "Unknown Committee"}
      subtitle={`${item.committee_id || "No committee ID"} | ${
        item.state || "National"
      }`}
      meta={[
        { label: "Amount", value: formatMoney(item.total_amount || 0) },
        { label: "Donors", value: item.donor_count || 0 },
      ]}
      right={<Badge tone="info">{formatMoney(item.total_amount || 0)}</Badge>}
    />
  );
}

export default function DonorNetwork() {
  const { demoMode } = useDemoMode();
  const { filters } = useExecutiveFilters();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [networkData, setNetworkData] = useState(fallbackData);
  const [localSearch, setLocalSearch] = useState("");
  const [cycle, setCycle] = useState("2026");
  const [isDemoData, setIsDemoData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDonorNetwork() {
      try {
        setLoading((current) => !networkData?.results?.length || current);
        setRefreshing(Boolean(networkData?.results?.length));
        setError("");

        const params = {
          cycle,
          limit: 100,
        };

        if (filters.state) params.state = filters.state;
        if (localSearch.trim()) params.search = localSearch.trim();

        const data = await loadDonors(params);

        if (!active) return;

        setNetworkData(data || fallbackData);
        setIsDemoData(Boolean(data?._demo || data?.demo));
        setLastUpdated(
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch (err) {
        if (!active) return;

        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load donor network"
        );

        setNetworkData(fallbackData);
        setIsDemoData(false);
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    const timer = setTimeout(loadDonorNetwork, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [filters.state, localSearch, cycle]);

  const filteredResults = useMemo(() => {
    let rows = Array.isArray(networkData?.results) ? networkData.results : [];

    if (filters.state) {
      const filterState = normalizeState(filters.state);
      rows = rows.filter((row) => normalizeState(row.state) === filterState);
    }

    if (localSearch.trim()) {
      const q = localSearch.trim().toLowerCase();

      rows = rows.filter((row) => {
        return (
          String(row.donor_name || row.name || "").toLowerCase().includes(q) ||
          String(row.donor_type || "").toLowerCase().includes(q) ||
          String(row.relationship_strength || "").toLowerCase().includes(q) ||
          String(row.state || "").toLowerCase().includes(q) ||
          String(row.committee_name || "").toLowerCase().includes(q) ||
          String(row.employer || "").toLowerCase().includes(q) ||
          String(row.occupation || "").toLowerCase().includes(q) ||
          String(row.city || "").toLowerCase().includes(q)
        );
      });
    }

    return rows;
  }, [networkData, filters.state, localSearch]);

  const summary = useMemo(() => {
    if (
      networkData?.summary &&
      !localSearch.trim() &&
      !filters.state
    ) {
      return networkData.summary;
    }

    if (!filteredResults.length) {
      return {
        total_donors: 0,
        total_amount: 0,
        top_state: "N/A",
        source: networkData?.summary?.source || "FEC",
      };
    }

    const totalAmount = filteredResults.reduce(
      (sum, row) => sum + Number(row.amount || row.total_amount || 0),
      0
    );

    const stateTotals = filteredResults.reduce((acc, row) => {
      const key = row.state || "Unknown";
      acc[key] = (acc[key] || 0) + Number(row.amount || row.total_amount || 0);
      return acc;
    }, {});

    const topState =
      Object.entries(stateTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "N/A";

    return {
      total_donors: filteredResults.length,
      total_amount: totalAmount,
      top_state: topState,
      source: networkData?.summary?.source || "FEC",
    };
  }, [filteredResults, networkData, localSearch, filters.state]);

  const stateBreakdown = useMemo(() => {
    if (
      Array.isArray(networkData?.stateBreakdown) &&
      networkData.stateBreakdown.length &&
      !filters.state &&
      !localSearch.trim()
    ) {
      return networkData.stateBreakdown;
    }

    const grouped = filteredResults.reduce((acc, row) => {
      const state = row.state || "Unknown";

      if (!acc[state]) {
        acc[state] = {
          state,
          total_amount: 0,
          donor_count: 0,
          average_amount: 0,
        };
      }

      acc[state].total_amount += Number(row.amount || row.total_amount || 0);
      acc[state].donor_count += 1;

      return acc;
    }, {});

    return Object.values(grouped)
      .map((item) => ({
        ...item,
        average_amount: item.donor_count
          ? item.total_amount / item.donor_count
          : 0,
      }))
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 12);
  }, [networkData, filteredResults, filters.state, localSearch]);

  const committeeBreakdown = useMemo(() => {
    if (
      Array.isArray(networkData?.committeeBreakdown) &&
      networkData.committeeBreakdown.length &&
      !localSearch.trim()
    ) {
      return networkData.committeeBreakdown;
    }

    const grouped = filteredResults.reduce((acc, row) => {
      const key = row.committee_id || row.committee_name || "Unknown Committee";

      if (!acc[key]) {
        acc[key] = {
          committee_id: row.committee_id,
          committee_name: row.committee_name || key,
          state: row.state || "National",
          total_amount: 0,
          donor_count: 0,
        };
      }

      acc[key].total_amount += Number(row.amount || row.total_amount || 0);
      acc[key].donor_count += 1;

      return acc;
    }, {});

    return Object.values(grouped)
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 10);
  }, [networkData, filteredResults, localSearch]);

  const highStrengthCount = filteredResults.filter(
    (row) => String(row.relationship_strength || "").toLowerCase() === "high"
  ).length;

  return (
    <PageShell
      eyebrow="Donor Network"
      title="Live FEC Donor Network"
      description="Track itemized FEC contribution activity, donor concentration, committee relationships, state-level funding clusters, and strategic fundraising momentum."
      demo={demoMode}
      demoText="Global Demo Mode is active. Live FEC data still loads when the donor endpoint and FEC API key are configured."
      tickerItems={[
        {
          label: "Donors",
          value: `${summary.total_donors || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "High Strength",
          value: `${highStrengthCount}`,
          dotClass: "vs-live-dot",
        },
        {
          label: "Top State",
          value: `${summary.top_state || "N/A"}`,
          dotClass: "vs-live-dot-warning",
        },
        {
          label: "Source",
          value: displaySource(summary.source),
          dotClass: isDemoData ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: refreshing ? "Refreshing" : lastUpdated || "Live",
          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .donor-live-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(160px, 0.4fr) minmax(160px, 0.4fr);
          gap: 12px;
          align-items: center;
        }

        .donor-live-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(340px, 0.75fr);
          gap: 18px;
          align-items: start;
        }

        .donor-stack {
          display: grid;
          gap: 12px;
        }

        .donor-source-card {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.68));
          padding: 16px;
        }

        .donor-source-card span {
          display: block;
          color: rgba(147, 197, 253, 0.92);
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .donor-source-card strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: 22px;
          letter-spacing: -0.04em;
        }

        .donor-source-card p {
          margin: 8px 0 0;
          color: rgba(226, 232, 240, 0.78);
          font-size: 13px;
          line-height: 1.55;
        }

        @media (max-width: 1000px) {
          .donor-live-grid,
          .donor-live-toolbar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <DemoBanner
        active={isDemoData}
        text="Demo donor network data is active. Configure FEC_API_KEY on Render to populate live FEC contributions."
      />

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="Tracked Donors"
          value={summary.total_donors || 0}
          subtext="Visible across current filters"
        />
        <StatCard
          label="Total Amount"
          value={formatMoney(summary.total_amount || 0)}
          subtext="Combined itemized contribution value"
        />
        <StatCard
          label="Top State"
          value={summary.top_state || "N/A"}
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
        subtitle="Search live FEC itemized contribution records while honoring your executive state filter."
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
        <div className="donor-live-toolbar">
          <input
            className="vs-input"
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Search donor, employer, occupation, committee, state..."
          />

          <select
            className="vs-input"
            value={cycle}
            onChange={(event) => setCycle(event.target.value)}
          >
            <option value="2026">2026 Cycle</option>
            <option value="2024">2024 Cycle</option>
            <option value="2022">2022 Cycle</option>
            <option value="2020">2020 Cycle</option>
          </select>

          <input
            className="vs-input"
            value={filters.state || ""}
            readOnly
            placeholder="Executive state filter"
          />
        </div>
      </SectionCard>

      <div className="donor-live-grid">
        <SectionCard
          title="Donor Relationship Board"
          subtitle="Live itemized contributors and relationship strength across the filtered FEC network."
          right={
            <Badge tone={isDemoData ? "demo" : "active"}>
              {isDemoData ? "Demo Data" : "Live FEC"}
            </Badge>
          }
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading donor network..." />
            ) : !filteredResults.length ? (
              <EmptyState text="No donors match the active filters. Try clearing search or switching cycle." />
            ) : (
              filteredResults.map((donor) => (
                <DonorRow
                  key={donor.id || `${donor.donor_name}-${donor.committee_id}-${donor.amount}`}
                  donor={donor}
                />
              ))
            )}
          </div>
        </SectionCard>

        <div className="donor-stack">
          <div className="donor-source-card">
            <span>Live Data Source</span>
            <strong>{displaySource(summary.source) || "FEC Schedule A"}</strong>
            <p>
              This page is wired for live FEC itemized contribution data. It
              groups contributor records into donor, state, and committee
              intelligence that VoterSpheres can use for executive fundraising
              analysis.
            </p>
          </div>

          <SectionCard
            title="State Concentration"
            subtitle="Where donor money is clustering."
            right={<Badge tone="accent">{stateBreakdown.length} states</Badge>}
          >
            <div className="vs-stack">
              {!stateBreakdown.length ? (
                <EmptyState text="No state concentration available." />
              ) : (
                stateBreakdown.map((item) => (
                  <StateBreakdownRow key={item.state} item={item} />
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Committee Funding Channels"
        subtitle="Committees receiving the largest visible contribution totals in this donor network."
        right={<Badge tone="info">{committeeBreakdown.length} committees</Badge>}
      >
        <div className="vs-stack">
          {!committeeBreakdown.length ? (
            <EmptyState text="No committee funding channels available." />
          ) : (
            committeeBreakdown.map((item) => (
              <CommitteeRow
                key={item.committee_id || item.committee_name}
                item={item}
              />
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}