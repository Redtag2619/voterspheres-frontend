import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function fmtMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function normalizeList(data, keys = []) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return data?.results || data?.vendors || data?.rows || [];
}

function VendorRow({ vendor }) {
  return (
    <div className="vs-premium-row-card">
      <ResponsiveRow
        title={vendor.name || vendor.vendor_name || "Unnamed Vendor"}
        subtitle={`${vendor.state || "Unknown"} • ${vendor.category || "Vendor"}`}
        meta={[
          { label: "Coverage", value: vendor.coverage_area || vendor.state || "—" },
          { label: "Contract", value: fmtMoney(vendor.contract_value) }
        ]}
        right={
          <Badge tone="accent">
            {vendor.status || "active"}
          </Badge>
        }
      />
    </div>
  );
}

function RiskRow({ item }) {
  return (
    <div className={`vs-premium-row-card ${item.severity === "High" ? "is-elevated" : ""}`}>
      <ResponsiveRow
        title={item.title}
        subtitle={item.detail}
        meta={[{ label: "Severity", value: item.severity }]}
        right={<Badge tone={item.severity === "High" ? "danger" : "demo"}>{item.severity}</Badge>}
      />
    </div>
  );
}

export default function Vendors() {
  const [rows, setRows] = useState([]);
  const [states, setStates] = useState([]);
  const [intel, setIntel] = useState(null);

  const [loading, setLoading] = useState(true);
  const [intelLoading, setIntelLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    q: "",
    state: "",
    page: 1,
    limit: 12
  });

  useEffect(() => {
    api.vendorStates?.().then((data) => {
      setStates(normalizeList(data, ["states"]));
    });
  }, []);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.vendors(filters);
        setRows(normalizeList(data, ["results"]));
      } catch (e) {
        setError("Failed to load vendors");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filters]);

  useEffect(() => {
    async function loadIntel() {
      try {
        setIntelLoading(true);
        const data = await api.vendorScoring?.();
        setIntel(data);
      } finally {
        setIntelLoading(false);
      }
    }
    loadIntel();
  }, []);

  const summary = useMemo(() => {
    return intel?.summary || {
      total_vendors: rows.length,
      states_covered: new Set(rows.map((r) => r.state)).size
    };
  }, [intel, rows]);

  return (
    <PageShell
      eyebrow="Vendor Intelligence"
      title="Vendor Network"
      description="Live campaign vendor coverage, gaps, and operational readiness."
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      {/* STATS */}
      <div className="vs-grid-4">
        <StatCard label="Total Vendors" value={summary.total_vendors} />
        <StatCard label="States Covered" value={summary.states_covered} />
        <StatCard label="High Gap States" value={intel?.summary?.high_gap_states || 0} />
        <StatCard label="Medium Gap States" value={intel?.summary?.medium_gap_states || 0} />
      </div>

      {/* FILTERS */}
      <SectionCard title="Filters">
        <div className="vs-grid-2">
          <input
            className="vs-input"
            placeholder="Search vendors"
            value={filters.q}
            onChange={(e) =>
              setFilters((p) => ({ ...p, q: e.target.value }))
            }
          />

          <select
            className="vs-input"
            value={filters.state}
            onChange={(e) =>
              setFilters((p) => ({ ...p, state: e.target.value }))
            }
          >
            <option value="">All states</option>
            {states.map((s, i) => (
              <option key={i} value={s.state || s}>
                {s.state || s}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      {/* DIRECTORY */}
      <SectionCard
        title="Vendor Directory"
        right={<Badge tone="accent">{rows.length} vendors</Badge>}
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading vendors..." />
          ) : rows.length === 0 ? (
            <EmptyState text="No vendors found." />
          ) : (
            rows.map((v, i) => <VendorRow key={i} vendor={v} />)
          )}
        </div>
      </SectionCard>

      {/* GAPS */}
      <SectionCard title="Coverage Gaps">
        <div className="vs-stack">
          {intelLoading ? (
            <EmptyState text="Loading vendor intelligence..." />
          ) : !intel?.gaps?.length ? (
            <EmptyState text="No gaps detected." />
          ) : (
            intel.gaps.map((g, i) => <RiskRow key={i} item={g} />)
          )}
        </div>
      </SectionCard>

      {/* ACTIONS */}
      <SectionCard title="Recommended Actions">
        <div className="vs-stack">
          {!intel?.recommended_actions?.length ? (
            <EmptyState text="No actions available." />
          ) : (
            intel.recommended_actions.map((a, i) => (
              <RiskRow
                key={i}
                item={{
                  title: a.title,
                  detail: a.detail,
                  severity: a.priority
                }}
              />
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
