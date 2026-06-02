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
  if (value === "stable") return "active";
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

function fmtDecimal(value, digits = 2) {
  return Number(value || 0).toFixed(digits);
}

function getStateCode(item = {}) {
  return String(item.state_code || item.state || "").toUpperCase();
}

function StateRow({ item, onOpen }) {
  const stateCode = getStateCode(item);
  const heat = item.heat_score || item.pressure || item.operational_score || 0;

  return (
    <div className={`state-ops-row ${riskClass(item.risk || item.risk_label)}`}>
      <ResponsiveRow
        title={`${item.state_name || stateCode} Operations`}
        subtitle={`${stateCode} • ${fmtNumber(item.locality_count || item.counties_tracked || 0)} counties/parishes tracked`}
        meta={[
          { label: "Heat", value: fmtDecimal(heat) },
          { label: "Risk", value: item.risk || item.risk_label || "Stable" },
          { label: "Active", value: fmtNumber(item.active_task_count || 0) },
          { label: "Resolved", value: fmtNumber(item.resolved_task_count || 0) },
          { label: "Vendor Gaps", value: fmtNumber(item.vendor_gap_count || 0) },
        ]}
        right={
          <button
            type="button"
            className="vs-button"
            onClick={() => onOpen(stateCode)}
            disabled={!stateCode}
          >
            Open
          </button>
        }
      />
    </div>
  );
}

function FeedRow({ item, onOpen }) {
  const stateCode = getStateCode(item);

  return (
    <div className={`state-feed-row ${riskClass(item.severity || item.risk)}`}>
      <ResponsiveRow
        title={item.title || "Tactical state signal"}
        subtitle={`${item.source || "State Operations"} • ${item.layer || "State Heat"}`}
        meta={[
          { label: "State", value: stateCode || "—" },
          { label: "Severity", value: item.severity || item.risk || "Signal" },
          { label: "Status", value: item.command_status || "No Task" },
          { label: "Heat", value: fmtDecimal(item.heat_score || 0) },
        ]}
        right={
          stateCode ? (
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => onOpen(stateCode)}
            >
              Inspect
            </button>
          ) : null
        }
      />
    </div>
  );
}

export default function StateOperationsIndex() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("heat");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  function openState(stateCode) {
    const next = String(stateCode || "").toUpperCase();

    if (!next) return;

    navigate(`/state-operations/${next}`);
  }

  async function load({ quiet = false } = {}) {
    try {
      if (quiet) setRefreshing(true);
      else setLoading(true);

      setError("");

      if (typeof api.stateOperationsIndex !== "function") {
        throw new Error("State operations index API client is not available.");
      }

      const result = await api.stateOperationsIndex();

      setData(
        result || {
          summary: {},
          states: [],
          tacticalFeed: [],
        }
      );

      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load State Operations."
      );

      setData({
        summary: {},
        states: [],
        tacticalFeed: [],
      });
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
  const tacticalFeed = data?.tacticalFeed || data?.alerts || [];

  const filteredStates = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = states.filter((item) => {
      const stateCode = getStateCode(item);
      const risk = String(item.risk || item.risk_label || "").toLowerCase();

      const matchesSearch =
        !term ||
        stateCode.toLowerCase().includes(term) ||
        String(item.state_name || "").toLowerCase().includes(term);

      const matchesFilter =
        filter === "all" ||
        filter === risk ||
        (filter === "urgent" && ["critical", "high"].includes(risk)) ||
        (filter === "active-tasks" && Number(item.active_task_count || 0) > 0) ||
        (filter === "resolved" && Number(item.resolved_task_count || 0) > 0);

      return matchesSearch && matchesFilter;
    });

    return rows.sort((a, b) => {
      if (sort === "state") return getStateCode(a).localeCompare(getStateCode(b));
      if (sort === "active") return Number(b.active_task_count || 0) - Number(a.active_task_count || 0);
      if (sort === "resolved") return Number(b.resolved_task_count || 0) - Number(a.resolved_task_count || 0);
      if (sort === "vendors") return Number(b.vendor_gap_count || 0) - Number(a.vendor_gap_count || 0);

      return (
        Number(b.heat_score || b.pressure || b.operational_score || 0) -
        Number(a.heat_score || a.pressure || a.operational_score || 0)
      );
    });
  }, [states, search, filter, sort]);

  const urgentStates = states.filter((item) =>
    ["Critical", "High"].includes(item.risk || item.risk_label)
  );

  const criticalStates = states.filter(
    (item) => String(item.risk || item.risk_label).toLowerCase() === "critical"
  );

  const activeTaskStates = states.filter((item) => Number(item.active_task_count || 0) > 0);

  const nationalHeat =
    summary.national_heat_score ||
    (states.length
      ? states.reduce(
          (sum, item) =>
            sum + Number(item.heat_score || item.pressure || item.operational_score || 0),
          0
        ) / states.length
      : 0);

  return (
    <PageShell
      eyebrow="State Operations"
      title="State Operations Command"
      description="All-state tactical operations index with county/parish heat, active escalations, resolved task pressure, vendor gaps, and live state-level risk."
      tickerItems={[
        {
          label: "National Heat",
          value: `${fmtDecimal(nationalHeat)}%`,
          dotClass:
            Number(nationalHeat || 0) >= 65
              ? "vs-live-dot-warning"
              : "vs-live-dot-success",
        },
        {
          label: "States",
          value: `${summary.states_tracked || states.length || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Urgent",
          value: `${summary.urgent_states || urgentStates.length || 0}`,
          dotClass: urgentStates.length ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Active Tasks",
          value: `${summary.active_task_count || 0}`,
          dotClass: summary.active_task_count ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
        {
          label: "Updated",
          value: lastUpdated || "Live",
          dotClass: refreshing ? "vs-live-dot-warning" : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .state-ops-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 16px;
        }

        .state-ops-search,
        .state-ops-select {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 12px 14px;
          outline: none;
        }

        .state-ops-search {
          min-width: min(360px, 100%);
        }

        .state-ops-controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .state-ops-filter-btn {
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.84);
          border-radius: 14px;
          padding: 10px 12px;
          font-size: 12px;
          cursor: pointer;
          text-transform: capitalize;
        }

        .state-ops-filter-btn.is-active {
          border-color: rgba(96, 165, 250, 0.62);
          background: rgba(37, 99, 235, 0.28);
          color: white;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }

        .state-ops-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(340px, 0.65fr);
          gap: 18px;
          align-items: start;
        }

        .state-ops-stack {
          display: grid;
          gap: 12px;
        }

        .state-ops-row,
        .state-feed-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.78), rgba(2, 6, 23, 0.56));
          overflow: hidden;
        }

        .state-ops-row .vs-responsive-row,
        .state-feed-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .risk-critical,
        .risk-high {
          border-color: rgba(248, 113, 113, 0.36) !important;
        }

        .risk-elevated {
          border-color: rgba(251, 191, 36, 0.3) !important;
        }

        .risk-stable {
          border-color: rgba(34, 197, 94, 0.2);
        }

        .state-pressure-card {
          border-radius: 28px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 36%),
            radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.14), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.82));
          padding: 22px;
        }

        .state-pressure-score {
          color: white;
          font-size: 58px;
          font-weight: 950;
          letter-spacing: -0.07em;
          line-height: 1;
        }

        .state-pressure-label {
          margin-top: 8px;
          color: rgba(203, 213, 225, 0.72);
          font-size: 13px;
        }

        .state-mini-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .state-mini-grid div {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.13);
          background: rgba(2, 6, 23, 0.32);
          padding: 12px;
        }

        .state-mini-grid span {
          display: block;
          color: rgba(203, 213, 225, 0.64);
          font-size: 11px;
          font-weight: 800;
        }

        .state-mini-grid b {
          display: block;
          margin-top: 5px;
          color: white;
          font-size: 20px;
        }

        @media (max-width: 1100px) {
          .state-ops-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .state-ops-toolbar {
            align-items: stretch;
          }

          .state-ops-search,
          .state-ops-select {
            width: 100%;
          }

          .state-ops-controls,
          .state-mini-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="National Heat"
          value={`${fmtDecimal(nationalHeat)}%`}
          delta="Average state pressure"
          tone={Number(nationalHeat || 0) >= 65 ? "down" : "up"}
        />
        <StatCard
          label="States Tracked"
          value={fmtNumber(summary.states_tracked || states.length || 0)}
          delta={`${fmtNumber(summary.localities_tracked || 0)} localities`}
          tone="up"
        />
        <StatCard
          label="Urgent States"
          value={fmtNumber(summary.urgent_states || urgentStates.length || 0)}
          delta={`${fmtNumber(criticalStates.length)} critical`}
          tone={urgentStates.length ? "down" : "up"}
        />
        <StatCard
          label="Active Tasks"
          value={fmtNumber(summary.active_task_count || 0)}
          delta={`${fmtNumber(summary.resolved_task_count || 0)} resolved`}
          tone={summary.active_task_count ? "down" : "up"}
        />
      </div>

      <div className="state-ops-layout">
        <div>
          <SectionCard
            title="All State Operations"
            subtitle="Open any state to inspect county/parish heat and task status."
            right={<Badge tone="accent">{filteredStates.length} states</Badge>}
          >
            <div className="state-ops-toolbar">
              <input
                className="state-ops-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search state name or abbreviation..."
              />

              <div className="state-ops-controls">
                {["all", "urgent", "active-tasks", "resolved", "critical", "high", "elevated", "stable"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`state-ops-filter-btn ${filter === item ? "is-active" : ""}`}
                    onClick={() => setFilter(item)}
                  >
                    {item.replace("-", " ")}
                  </button>
                ))}

                <select
                  className="state-ops-select"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="heat">Sort: Heat</option>
                  <option value="state">Sort: State</option>
                  <option value="active">Sort: Active Tasks</option>
                  <option value="resolved">Sort: Resolved</option>
                  <option value="vendors">Sort: Vendor Gaps</option>
                </select>
              </div>
            </div>

            {loading ? (
              <EmptyState text="Loading all state operations..." />
            ) : !filteredStates.length ? (
              <EmptyState text="No states match the current filters." />
            ) : (
              <div className="state-ops-stack">
                {filteredStates.map((item) => (
                  <StateRow
                    key={getStateCode(item)}
                    item={item}
                    onOpen={openState}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="state-ops-stack">
          <div className="state-pressure-card">
            <div className="state-pressure-score">{fmtDecimal(nationalHeat)}%</div>
            <div className="state-pressure-label">
              National state operations pressure.
            </div>

            <div className="state-mini-grid">
              <div><span>Critical</span><b>{fmtNumber(criticalStates.length)}</b></div>
              <div><span>Urgent</span><b>{fmtNumber(urgentStates.length)}</b></div>
              <div><span>Active Task States</span><b>{fmtNumber(activeTaskStates.length)}</b></div>
              <div><span>Vendor Gaps</span><b>{fmtNumber(summary.vendor_gap_count || 0)}</b></div>
            </div>
          </div>

          <SectionCard
            title="Tactical State Feed"
            subtitle="Highest-pressure state signals from the operations engine."
            right={<Badge tone={tacticalFeed.length ? "danger" : "active"}>{tacticalFeed.length} signals</Badge>}
          >
            {!tacticalFeed.length ? (
              <EmptyState text="No tactical state alerts detected." />
            ) : (
              <div className="state-ops-stack">
                {tacticalFeed.slice(0, 10).map((item) => (
                  <FeedRow
                    key={item.id || `${item.state}-${item.title}`}
                    item={item}
                    onOpen={openState}
                  />
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
