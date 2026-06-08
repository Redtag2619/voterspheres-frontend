import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function tone(value) {
  const v = String(value || "").toLowerCase();
  if (["high", "critical", "danger"].includes(v)) return "danger";
  if (["medium", "watch", "warning"].includes(v)) return "demo";
  if (["normal", "stable"].includes(v)) return "active";
  return "accent";
}

function typeTone(type) {
  const v = String(type || "").toLowerCase();
  if (["alert", "signal", "task"].includes(v)) return "danger";
  if (["workspace", "report", "crm"].includes(v)) return "info";
  if (["client", "vendor"].includes(v)) return "demo";
  return "accent";
}

function prettyType(type = "") {
  return String(type || "result").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function UniversalSearch() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    q: searchParams.get("q") || "",
    type: searchParams.get("type") || "",
    state: searchParams.get("state") || "",
  });

  const [data, setData] = useState({
    query: "",
    results: [],
    type_counts: {},
    summary: {},
    states: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runSearch = useCallback(async (nextFilters = filters) => {
    try {
      setLoading(true);
      setError("");

      const result = await api.universalSearch({
        ...nextFilters,
        limit: 150,
      });

      setData({
        query: result?.query || "",
        results: arr(result?.results),
        type_counts: result?.type_counts || {},
        summary: result?.summary || {},
        states: arr(result?.states),
      });
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.detail || err?.message || "Failed to run universal search.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    runSearch(filters);
  }, []);

  const results = arr(data.results);
  const summary = data.summary || {};
  const typeCounts = data.type_counts || {};

  const sortedTypes = useMemo(() => {
    return Object.entries(typeCounts).sort((a, b) => Number(b[1]) - Number(a[1]));
  }, [typeCounts]);

  function submit(event) {
    event.preventDefault();

    const next = {};
    if (filters.q) next.q = filters.q;
    if (filters.type) next.type = filters.type;
    if (filters.state) next.state = filters.state;

    setSearchParams(next);
    runSearch(filters);
  }

  function updateFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <PageShell
      eyebrow="Global Universal Search"
      title="Universal Search"
      description="Search across workspaces, candidates, vendors, tasks, reports, clients, CRM contacts, alerts, and political signals from one command surface."
      tickerItems={[
        { label: "Results", value: `${summary.total || 0}`, dotClass: "vs-live-dot-success" },
        { label: "High Priority", value: `${summary.high_priority || 0}`, dotClass: summary.high_priority ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "Types", value: `${summary.types || 0}`, dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .search-layout {
          display: grid;
          grid-template-columns: minmax(0, .72fr) minmax(0, 1.28fr);
          gap: 18px;
          align-items: start;
        }

        .search-stack {
          display: grid;
          gap: 14px;
        }

        .search-form {
          display: grid;
          gap: 12px;
        }

        .search-box {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
        }

        .search-form input,
        .search-form select {
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, .18);
          background: rgba(15, 23, 42, .74);
          color: white;
          padding: 12px 13px;
        }

        .search-type-grid {
          display: grid;
          gap: 8px;
        }

        .search-type-button {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, .16);
          background: rgba(15, 23, 42, .62);
          color: rgba(226, 232, 240, .9);
          padding: 10px 12px;
          cursor: pointer;
        }

        .search-type-button.active {
          border-color: rgba(251, 146, 60, .42);
          background: rgba(251, 146, 60, .14);
          color: white;
        }

        .search-result-row {
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, .16);
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, .1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, .78), rgba(2, 6, 23, .54));
          overflow: hidden;
        }

        .search-result-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .search-empty-tip {
          color: rgba(148, 163, 184, .84);
          line-height: 1.65;
          font-size: 13px;
        }

        @media (max-width: 1100px) {
          .search-layout,
          .search-box {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Results" value={summary.total || 0} delta="Universal index" tone="up" />
        <StatCard label="High Priority" value={summary.high_priority || 0} delta="Critical matches" tone={summary.high_priority ? "down" : "up"} />
        <StatCard label="Medium Priority" value={summary.medium_priority || 0} delta="Watchlist matches" tone="neutral" />
        <StatCard label="Entity Types" value={summary.types || 0} delta="Result categories" tone="up" />
      </div>

      <div className="search-layout">
        <div className="search-stack">
          <SectionCard title="Search" subtitle="Find anything across VoterSpheres.">
            <form className="search-form" onSubmit={submit}>
              <div className="search-box">
                <input
                  autoFocus
                  placeholder="Search candidates, donors, vendors, workspaces, reports..."
                  value={filters.q}
                  onChange={(event) => updateFilter("q", event.target.value)}
                />
                <button className="vs-button" type="submit">
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>

              <select value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
                <option value="">All Types</option>
                <option value="workspace">Workspaces</option>
                <option value="candidate">Candidates</option>
                <option value="task">Tasks</option>
                <option value="signal">Signals</option>
                <option value="vendor">Vendors</option>
                <option value="report">Reports</option>
                <option value="client">Clients</option>
                <option value="crm">CRM Contacts</option>
                <option value="alert">Alerts</option>
              </select>

              <select value={filters.state} onChange={(event) => updateFilter("state", event.target.value)}>
                <option value="">All States</option>
                {arr(data.states).map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </form>
          </SectionCard>

          <SectionCard title="Result Types" subtitle="Filter by source system.">
            <div className="search-type-grid">
              <button className={`search-type-button ${!filters.type ? "active" : ""}`} onClick={() => updateFilter("type", "")}>
                <span>All</span>
                <Badge tone="accent">{summary.total || 0}</Badge>
              </button>

              {sortedTypes.map(([type, count]) => (
                <button
                  key={type}
                  className={`search-type-button ${filters.type === type ? "active" : ""}`}
                  onClick={() => updateFilter("type", type)}
                >
                  <span>{prettyType(type)}</span>
                  <Badge tone={typeTone(type)}>{count}</Badge>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Search Tips" subtitle="Examples you can try.">
            <div className="search-empty-tip">
              Try searches like <strong>Louisiana Senate</strong>, <strong>vendor gap</strong>, <strong>overdue invoice</strong>, <strong>critical signal</strong>, <strong>Democratic</strong>, or <strong>client report</strong>.
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Results" subtitle="Matching records across the VoterSpheres operating system." right={<Badge tone={results.length ? "accent" : "active"}>{results.length}</Badge>}>
          {loading ? (
            <EmptyState text="Searching VoterSpheres..." />
          ) : !results.length ? (
            <EmptyState title="No results yet" text="Enter a search term or adjust filters." />
          ) : (
            <div className="search-stack">
              {results.map((item) => (
                <div key={item.id} className="search-result-row">
                  <ResponsiveRow
                    title={item.title}
                    subtitle={item.description || item.subtitle}
                    meta={[
                      { label: "Type", value: prettyType(item.type) },
                      { label: "State", value: item.state || "National" },
                      { label: "Priority", value: item.priority || "normal" },
                      { label: "Score", value: item.score || 0 },
                    ]}
                    right={
                      <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                        <Badge tone={typeTone(item.type)}>{prettyType(item.type)}</Badge>
                        <Link className="vs-button vs-button-secondary" to={item.path || "/national-command"}>
                          Open
                        </Link>
                      </div>
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  );
}
