import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function riskTone(label) {
  const value = String(label || "").toLowerCase();
  if (value === "critical" || value === "high") return "danger";
  if (value === "elevated") return "demo";
  return "accent";
}

function riskClass(label) {
  const value = String(label || "").toLowerCase();
  if (value === "critical") return "risk-critical";
  if (value === "high") return "risk-high";
  if (value === "elevated") return "risk-elevated";
  return "risk-stable";
}

function fmtNumber(value) {
  return Number(value || 0).toLocaleString();
}

function StateOpsCard({ item, onOpen }) {
  return (
    <button
      type="button"
      className={`state-index-card ${riskClass(item.risk)}`}
      onClick={() => onOpen(item.state || item.state_code)}
    >
      <div className="state-index-head">
        <div>
          <strong>{item.state || item.state_code}</strong>
          <span>{item.state_name}</span>
        </div>
        <Badge tone={riskTone(item.risk)}>{item.risk || "Stable"}</Badge>
      </div>

      <div className="state-index-pressure">
        <i style={{ width: `${Math.min(100, Number(item.pressure || 0))}%` }} />
      </div>

      <div className="state-index-grid">
        <span>County/Parish <b>{fmtNumber(item.locality_count || item.counties_tracked || 0)}</b></span>
        <span>Critical <b>{fmtNumber(item.critical_counties || 0)}</b></span>
        <span>MailOps <b>{fmtNumber(item.total_mail_jobs || 0)}</b></span>
        <span>Vendor Gaps <b>{fmtNumber(item.vendor_gap_count || 0)}</b></span>
      </div>
    </button>
  );
}

function StateOpsRow({ item, onOpen }) {
  return (
    <div className={`state-index-row ${riskClass(item.risk)}`}>
      <ResponsiveRow
        title={`${item.state || item.state_code} — ${item.state_name}`}
        subtitle={`${fmtNumber(item.locality_count || item.counties_tracked || 0)} counties/parishes • ${fmtNumber(item.vendor_gap_count || 0)} vendor gaps`}
        meta={[
          { label: "Risk", value: item.risk || "Stable" },
          { label: "Pressure", value: `${item.pressure || 0}%` },
          { label: "Critical", value: item.critical_counties || 0 },
          { label: "MailOps", value: item.total_mail_jobs || 0 },
        ]}
        right={
          <button
            type="button"
            className="vs-decision-btn deploy"
            onClick={() => onOpen(item.state || item.state_code)}
          >
            Open
          </button>
        }
      />
    </div>
  );
}

export default function StateOperationsIndex() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [view, setView] = useState("cards");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  async function load({ quiet = false } = {}) {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      if (typeof api.stateOperationsIndex !== "function") {
        throw new Error("State operations index API client is not available.");
      }

      const result = await api.stateOperationsIndex();
      setData(result || { summary: {}, states: [] });
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load state operations index.");
      setData({ summary: {}, states: [] });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();

    const interval = setInterval(() => {
      load({ quiet: true });
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const summary = data?.summary || {};
  const states = data?.states || [];
  const tacticalFeed = data?.tacticalFeed || [];

  const filteredStates = useMemo(() => {
    const term = search.trim().toLowerCase();

    return states.filter((item) => {
      const risk = String(item.risk || "").toLowerCase();
      const stateCode = String(item.state || item.state_code || "").toLowerCase();
      const stateName = String(item.state_name || "").toLowerCase();

      const matchesSearch = !term || stateCode.includes(term) || stateName.includes(term);
      const matchesFilter =
        filter === "all" ||
        (filter === "urgent" && ["critical", "high"].includes(risk)) ||
        filter === risk;

      return matchesSearch && matchesFilter;
    });
  }, [states, search, filter]);

  function openState(stateCode) {
    if (!stateCode) return;
    navigate(`/state-operations/${String(stateCode).toUpperCase()}`);
  }

  return (
    <PageShell
      eyebrow="State Command"
      title="State Operations"
      description="All-state command index for county, parish, DMA, vendor, MailOps, and executive readiness."
      tickerItems={[
        { label: "States", value: `${summary.states_tracked || states.length || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Localities", value: `${fmtNumber(summary.localities_tracked || 0)}`, dotClass: "vs-live-dot-success" },
        { label: "Urgent", value: `${summary.urgent_states || 0}`, dotClass: summary.urgent_states ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Live", dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .state-index-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 16px;
        }

        .state-index-search {
          min-width: min(360px, 100%);
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.72);
          color: white;
          padding: 12px 14px;
          outline: none;
        }

        .state-index-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .state-index-btn {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.86);
          padding: 10px 12px;
          border-radius: 14px;
          font-size: 12px;
          cursor: pointer;
          text-transform: capitalize;
        }

        .state-index-btn.is-active {
          border-color: rgba(96, 165, 250, 0.62);
          color: white;
          background: rgba(37, 99, 235, 0.32);
          box-shadow: 0 0 0 4px rgba(37,99,235,0.1);
        }

        .state-index-grid-wrap {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .state-index-card {
          text-align: left;
          border-radius: 24px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 36%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(2, 6, 23, 0.66));
          padding: 16px;
          cursor: pointer;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .state-index-card:hover {
          transform: translateY(-2px);
          border-color: rgba(96, 165, 250, 0.48);
          box-shadow: 0 18px 45px rgba(2, 6, 23, 0.25);
        }

        .state-index-card.risk-critical,
        .state-index-row.risk-critical {
          border-color: rgba(248, 113, 113, 0.34);
        }

        .state-index-card.risk-high,
        .state-index-row.risk-high {
          border-color: rgba(251, 146, 60, 0.3);
        }

        .state-index-card.risk-elevated,
        .state-index-row.risk-elevated {
          border-color: rgba(251, 191, 36, 0.26);
        }

        .state-index-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: flex-start;
        }

        .state-index-head strong {
          display: block;
          color: white;
          font-size: 24px;
          font-weight: 950;
          letter-spacing: -0.05em;
        }

        .state-index-head span {
          display: block;
          margin-top: 4px;
          color: rgba(203, 213, 225, 0.68);
          font-size: 12px;
        }

        .state-index-pressure {
          margin-top: 15px;
          height: 8px;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.86);
          overflow: hidden;
        }

        .state-index-pressure i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, rgba(59,130,246,0.92), rgba(239,68,68,0.92));
        }

        .state-index-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px;
          margin-top: 14px;
        }

        .state-index-grid span {
          display: block;
          color: rgba(203, 213, 225, 0.62);
          font-size: 11px;
        }

        .state-index-grid b {
          display: block;
          margin-top: 3px;
          color: white;
          font-size: 15px;
        }

        .state-index-list {
          display: grid;
          gap: 12px;
        }

        .state-index-row {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.44));
          overflow: hidden;
        }

        .state-index-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        @media (max-width: 1100px) {
          .state-index-grid-wrap {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .state-index-grid-wrap {
            grid-template-columns: 1fr;
          }

          .state-index-toolbar {
            align-items: stretch;
          }

          .state-index-search {
            width: 100%;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="States Tracked" value={summary.states_tracked || states.length || 0} delta="All-state readiness" tone="up" />
        <StatCard label="Counties / Parishes" value={fmtNumber(summary.localities_tracked || 0)} delta="Imported localities" tone="up" />
        <StatCard label="Urgent States" value={summary.urgent_states || 0} delta="Critical or high" tone={summary.urgent_states ? "down" : "up"} />
        <StatCard label="Vendor Gaps" value={summary.vendor_gap_count || 0} delta="Coverage pressure" tone={summary.vendor_gap_count ? "down" : "up"} />
      </div>

      <SectionCard
        title="All-State Operations Index"
        subtitle="Open any state to inspect county, parish, DMA, vendor, MailOps, and executive signal readiness."
        right={<Badge tone="accent">{filteredStates.length} shown</Badge>}
      >
        <div className="state-index-toolbar">
          <input
            className="state-index-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search state name or abbreviation..."
          />

          <div className="state-index-controls">
            {["all", "urgent", "critical", "high", "elevated", "stable"].map((item) => (
              <button
                key={item}
                type="button"
                className={`state-index-btn ${filter === item ? "is-active" : ""}`}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}

            <button
              type="button"
              className={`state-index-btn ${view === "cards" ? "is-active" : ""}`}
              onClick={() => setView("cards")}
            >
              Cards
            </button>

            <button
              type="button"
              className={`state-index-btn ${view === "list" ? "is-active" : ""}`}
              onClick={() => setView("list")}
            >
              List
            </button>
          </div>
        </div>

        {loading ? (
          <EmptyState text="Loading all-state operations..." />
        ) : !filteredStates.length ? (
          <EmptyState text="No states match the current filter." />
        ) : view === "cards" ? (
          <div className="state-index-grid-wrap">
            {filteredStates.map((item) => (
              <StateOpsCard
                key={item.state || item.state_code}
                item={item}
                onOpen={openState}
              />
            ))}
          </div>
        ) : (
          <div className="state-index-list">
            {filteredStates.map((item) => (
              <StateOpsRow
                key={item.state || item.state_code}
                item={item}
                onOpen={openState}
              />
            ))}
          </div>
        )}
    <SectionCard
  title="National Tactical Intelligence Feed"
  subtitle="Live state-level heat alerts generated from county/parish tactical scoring."
  right={<Badge tone="danger">{tacticalFeed.length} alerts</Badge>}
>
  <div className="state-index-list">
    {!tacticalFeed.length ? (
      <EmptyState text="No tactical state alerts detected." />
    ) : (
      tacticalFeed.map((item) => (
        <div key={item.id} className={`state-index-row ${riskClass(item.severity)}`}>
          <ResponsiveRow
            title={item.title}
            subtitle={`${item.source} • ${item.layer}`}
            meta={[
              { label: "State", value: item.state },
              { label: "Severity", value: item.severity },
              { label: "Heat", value: item.heat_score },
            ]}
            right={
              <button
                type="button"
                className="vs-decision-btn deploy"
                onClick={() => openState(item.state)}
              >
                Inspect
              </button>
            }
          />
        </div>
      ))
    )}
  </div>
</SectionCard>
    </PageShell>
  );
}
