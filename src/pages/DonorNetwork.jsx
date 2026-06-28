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
import PoliticalGraphContextPanel from "../components/graph/PoliticalGraphContextPanel";

const STATES = [
  ["", "All States"],
  ["AL", "Alabama"],
  ["AK", "Alaska"],
  ["AZ", "Arizona"],
  ["AR", "Arkansas"],
  ["CA", "California"],
  ["CO", "Colorado"],
  ["CT", "Connecticut"],
  ["DE", "Delaware"],
  ["DC", "District of Columbia"],
  ["FL", "Florida"],
  ["GA", "Georgia"],
  ["HI", "Hawaii"],
  ["ID", "Idaho"],
  ["IL", "Illinois"],
  ["IN", "Indiana"],
  ["IA", "Iowa"],
  ["KS", "Kansas"],
  ["KY", "Kentucky"],
  ["LA", "Louisiana"],
  ["ME", "Maine"],
  ["MD", "Maryland"],
  ["MA", "Massachusetts"],
  ["MI", "Michigan"],
  ["MN", "Minnesota"],
  ["MS", "Mississippi"],
  ["MO", "Missouri"],
  ["MT", "Montana"],
  ["NE", "Nebraska"],
  ["NV", "Nevada"],
  ["NH", "New Hampshire"],
  ["NJ", "New Jersey"],
  ["NM", "New Mexico"],
  ["NY", "New York"],
  ["NC", "North Carolina"],
  ["ND", "North Dakota"],
  ["OH", "Ohio"],
  ["OK", "Oklahoma"],
  ["OR", "Oregon"],
  ["PA", "Pennsylvania"],
  ["RI", "Rhode Island"],
  ["SC", "South Carolina"],
  ["SD", "South Dakota"],
  ["TN", "Tennessee"],
  ["TX", "Texas"],
  ["UT", "Utah"],
  ["VT", "Vermont"],
  ["VA", "Virginia"],
  ["WA", "Washington"],
  ["WV", "West Virginia"],
  ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
];

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

function strengthTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "danger";
  if (v === "medium") return "demo";
  if (v === "growing") return "info";
  if (v === "new") return "accent";
  return "default";
}

function getInfluenceScore(donor) {
  const amount = Number(donor.amount || donor.total_amount || 0);
  const count = Number(donor.contribution_count || donor.count || 1);

  const amountScore = Math.min(60, Math.round(amount / 25000));
  const countScore = Math.min(25, count * 5);
  const relationshipScore =
    String(donor.relationship_strength || "").toLowerCase() === "high"
      ? 15
      : String(donor.relationship_strength || "").toLowerCase() === "medium"
      ? 10
      : 5;

  return Math.min(100, amountScore + countScore + relationshipScore);
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

function DonorContactPanel({ donor }) {
  const location = [donor.city, donor.state, donor.postal_code]
    .filter(Boolean)
    .join(", ");

  const employerLine = [donor.employer, donor.occupation]
    .filter(Boolean)
    .join(" | ");

  const addressLine = [donor.address_line1, donor.address_line2]
    .filter(Boolean)
    .join(" ");

  const hasDirectContact = Boolean(
    donor.website_url ||
      donor.linkedin_url ||
      donor.x_url ||
      donor.facebook_url ||
      donor.phone
  );

  return (
    <div className="donor-contact-panel">
      <div>
        <span>FEC Contact Disclosure</span>
        <strong>{location || "Location unavailable"}</strong>
        <small>{employerLine || "Employer and occupation unavailable"}</small>
      </div>

      <div>
        <span>Address Intelligence</span>
        <strong>{addressLine || "Street address unavailable"}</strong>
        <small>
          {donor.postal_code
            ? `Postal code: ${donor.postal_code}`
            : "ZIP unavailable from current record"}
        </small>
      </div>

      <div>
        <span>Verified Channels</span>
        <strong>{hasDirectContact ? "Available" : "Unavailable"}</strong>
        <small>
          {donor.contact_verified
            ? `Verified via ${donor.contact_source || "manual review"}`
            : "FEC does not provide phone, website, or social profiles. Add only verified enrichment."}
        </small>
      </div>
    </div>
  );
}

function DonorRow({ donor }) {
  const amount = Number(donor.amount || donor.total_amount || 0);
  const sourceLabel = displaySource(donor.source);
  const influenceScore = getInfluenceScore(donor);

  return (
    <div className="donor-contact-card">
      <ResponsiveRow
        title={donor.donor_name || donor.name || "Unnamed Donor"}
        subtitle={`${donor.state || "National"} | ${
          donor.donor_type || "Unknown type"
        } | ${donor.committee_name || "Committee unavailable"}`}
        meta={[
          { label: "Amount", value: formatMoney(amount) },
          { label: "Contributions", value: donor.contribution_count || donor.count || 1 },
          { label: "Relationship", value: donor.relationship_strength || "N/A" },
          { label: "Influence", value: `${influenceScore}/100` },
          { label: "Source", value: sourceLabel },
        ]}
        alert={
          influenceScore >= 80
            ? "vs-live-dot"
            : influenceScore >= 50
            ? "vs-live-dot-warning"
            : "vs-live-dot-success"
        }
        right={
          <Badge tone={influenceScore >= 80 ? "danger" : strengthTone(donor.relationship_strength)}>
            {influenceScore}/100
          </Badge>
        }
      />

      <DonorContactPanel donor={donor} />
    </div>
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
      subtitle={`${item.committee_id || "No committee ID"} | ${item.state || "National"}`}
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
  const [selectedState, setSelectedState] = useState("");
  const [isDemoData, setIsDemoData] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    if (filters.state) {
      setSelectedState(normalizeState(filters.state));
    }
  }, [filters.state]);

  useEffect(() => {
    let active = true;

    async function loadDonorNetwork() {
      try {
        setLoading((current) => !networkData?.results?.length || current);
        setRefreshing(Boolean(networkData?.results?.length));
        setError("");

        const params = {
          cycle,
          limit: 250,
        };

        if (selectedState) params.state = selectedState;
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

        const status = err?.response?.status;
        if (status === 401 || status === 402) {
          setError(
            "Donor Intelligence is an Enterprise feature. Please sign in with an active Enterprise subscription."
          );
        } else {
          setError(
            err?.response?.data?.error ||
              err?.message ||
              "Failed to load donor intelligence"
          );
        }

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
  }, [selectedState, localSearch, cycle]);

  const filteredResults = useMemo(() => {
    let rows = Array.isArray(networkData?.results) ? networkData.results : [];

    if (selectedState) {
      rows = rows.filter((row) => normalizeState(row.state) === selectedState);
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
          String(row.city || "").toLowerCase().includes(q) ||
          String(row.postal_code || "").toLowerCase().includes(q)
        );
      });
    }

    return rows;
  }, [networkData, selectedState, localSearch]);

  const summary = useMemo(() => {
    if (networkData?.summary && !localSearch.trim() && !selectedState) {
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
      Object.entries(stateTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    return {
      total_donors: filteredResults.length,
      total_amount: totalAmount,
      top_state: topState,
      source: networkData?.summary?.source || "FEC",
    };
  }, [filteredResults, networkData, localSearch, selectedState]);

  const stateBreakdown = useMemo(() => {
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
        average_amount: item.donor_count ? item.total_amount / item.donor_count : 0,
      }))
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, 12);
  }, [filteredResults]);

  const committeeBreakdown = useMemo(() => {
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
  }, [filteredResults]);

  const topInfluence = useMemo(() => {
    return [...filteredResults]
      .sort((a, b) => getInfluenceScore(b) - getInfluenceScore(a))
      .slice(0, 8);
  }, [filteredResults]);

  const highStrengthCount = filteredResults.filter(
    (row) => String(row.relationship_strength || "").toLowerCase() === "high"
  ).length;

  const contactDisclosureCount = filteredResults.filter(
    (row) => row.city || row.postal_code || row.employer || row.occupation
  ).length;

  const verifiedContactCount = filteredResults.filter((row) =>
    Boolean(row.contact_verified)
  ).length;

  const averageInfluence = filteredResults.length
    ? Math.round(
        filteredResults.reduce((sum, row) => sum + getInfluenceScore(row), 0) /
          filteredResults.length
      )
    : 0;

  return (
    <PageShell
      eyebrow="Enterprise Donor Intelligence"
      title="Donor Intelligence Command Center"
      description="Track live FEC donor activity, funding concentration, committee channels, influence scores, disclosed contact fields, and verified enrichment readiness."
      demo={demoMode}
      demoText="Enterprise Donor Intelligence is protected by subscription access. Live FEC data loads when the backend donor endpoint and FEC key are configured."
      tickerItems={[
        { label: "Donors", value: `${summary.total_donors || 0}`, dotClass: "vs-live-dot-success" },
        { label: "High Strength", value: `${highStrengthCount}`, dotClass: "vs-live-dot" },
        { label: "Avg Influence", value: `${averageInfluence}/100`, dotClass: "vs-live-dot-warning" },
        { label: "Contact Fields", value: `${contactDisclosureCount}`, dotClass: "vs-live-dot-success" },
        { label: "Verified", value: `${verifiedContactCount}`, dotClass: verifiedContactCount ? "vs-live-dot-success" : "vs-live-dot-warning" },
        { label: "Updated", value: refreshing ? "Refreshing" : lastUpdated || "Live", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .donor-command-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(160px, 0.35fr) minmax(220px, 0.55fr);
          gap: 12px;
          align-items: center;
        }

        .donor-command-grid {
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

        .donor-contact-card {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.42);
          overflow: hidden;
        }

        .donor-contact-card .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .donor-contact-panel {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          padding: 0 14px 14px;
        }

        .donor-contact-panel div {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(2, 6, 23, 0.28);
          padding: 12px;
        }

        .donor-contact-panel span {
          display: block;
          color: rgba(147, 197, 253, 0.9);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .donor-contact-panel strong {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 13px;
        }

        .donor-contact-panel small {
          display: block;
          margin-top: 4px;
          color: rgba(203, 213, 225, 0.68);
          font-size: 11px;
          line-height: 1.4;
        }

        @media (max-width: 1000px) {
          .donor-command-grid,
          .donor-command-toolbar {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 900px) {
          .donor-contact-panel {
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
        <StatCard label="Tracked Donors" value={summary.total_donors || 0} subtext="Visible across current filters" />
        <StatCard label="Total Amount" value={formatMoney(summary.total_amount || 0)} subtext="Combined itemized contribution value" />
        <StatCard label="Contact Fields" value={contactDisclosureCount} subtext="FEC-disclosed city, ZIP, employer or occupation" />
        <StatCard label="Verified Contacts" value={verifiedContactCount} subtext="Manual or enriched verification" />
      </div>

      <SectionCard
        title="Donor Intelligence Filters"
        subtitle="Use All States to view the full national donor network, or focus on a single state."
        right={
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => {
              setLocalSearch("");
              setSelectedState("");
            }}
          >
            Clear Filters
          </button>
        }
      >
        <div className="donor-command-toolbar">
          <input
            className="vs-input"
            value={localSearch}
            onChange={(event) => setLocalSearch(event.target.value)}
            placeholder="Search donor, employer, occupation, committee, city, ZIP..."
          />

          <select className="vs-input" value={cycle} onChange={(event) => setCycle(event.target.value)}>
            <option value="2026">2026 Cycle</option>
            <option value="2024">2024 Cycle</option>
            <option value="2022">2022 Cycle</option>
            <option value="2020">2020 Cycle</option>
          </select>

          <select
            className="vs-input"
            value={selectedState}
            onChange={(event) => setSelectedState(event.target.value)}
          >
            {STATES.map(([value, label]) => (
              <option key={value || "ALL"} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      <div className="donor-command-grid">
        <SectionCard
          title="Donor Relationship Board"
          subtitle="Live itemized contributors, influence score, contact disclosures, relationship strength, and committee funding connections."
          right={<Badge tone={isDemoData ? "demo" : "active"}>{isDemoData ? "Demo Data" : "Live FEC"}</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading donor intelligence..." />
            ) : !filteredResults.length ? (
              <EmptyState text="No donors match the active filters. Select All States or clear search." />
            ) : (
              filteredResults.map((donor) => (
                <DonorRow
                  key={donor.id || `${donor.donor_name}-${donor.state}-${donor.amount}`}
                  donor={donor}
                />
              ))
            )}
          </div>
        </SectionCard>

        <div className="donor-stack">
          <div className="donor-source-card">
            <span>Safe Contact Intelligence</span>
            <strong>{displaySource(summary.source) || "FEC Schedule A"}</strong>
            <p>
              FEC records can safely provide disclosed city, state, ZIP, employer, occupation and committee context.
              Phone numbers, websites and social profiles remain blank unless manually verified or enriched later.
            </p>
          </div>

          <SectionCard
            title="Top Influence Donors"
            subtitle="Highest composite donor power scores."
            right={<Badge tone="danger">{topInfluence.length} ranked</Badge>}
          >
            <div className="vs-stack">
              {!topInfluence.length ? (
                <EmptyState text="No influence donors available." />
              ) : (
                topInfluence.map((donor) => (
                  <DonorRow
                    key={`top-${donor.id || `${donor.donor_name}-${donor.state}`}`}
                    donor={donor}
                  />
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="vs-grid-2" style={{ marginTop: 18 }}>
        <SectionCard
          title="State Funding Concentration"
          subtitle="States receiving the highest visible donor concentration."
          right={<Badge tone="accent">{stateBreakdown.length} states</Badge>}
        >
          <div className="vs-stack">
            {!stateBreakdown.length ? (
              <EmptyState text="No state concentration available." />
            ) : (
              stateBreakdown.map((item) => <StateBreakdownRow key={item.state} item={item} />)
            )}
          </div>
        </SectionCard>

        {(filteredDonors?.[0] || donors?.[0] || rows?.[0]) ? (
          <PoliticalGraphContextPanel
            entityType="donor"
            entityId={(filteredDonors?.[0] || donors?.[0] || rows?.[0])?.id}
            entityName={
              (filteredDonors?.[0] || donors?.[0] || rows?.[0])?.donor_name ||
              (filteredDonors?.[0] || donors?.[0] || rows?.[0])?.name
            }
            state={(filteredDonors?.[0] || donors?.[0] || rows?.[0])?.state}
            title="Donor Relationship Graph"
            subtitle="Candidates, endorsements, states, vendors, and tasks connected to this donor."
            compact
          />
        ) : null}

        <SectionCard
          title="Committee Funding Channels"
          subtitle="Committees receiving the largest visible contribution totals."
          right={<Badge tone="info">{committeeBreakdown.length} committees</Badge>}
        >
          <div className="vs-stack">
            {!committeeBreakdown.length ? (
              <EmptyState text="No committee funding channels available." />
            ) : (
              committeeBreakdown.map((item) => (
                <CommitteeRow key={item.committee_id || item.committee_name} item={item} />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}

