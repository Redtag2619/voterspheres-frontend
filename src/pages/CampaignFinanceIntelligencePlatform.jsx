import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const fallbackData = {
  ok: false,
  source: "empty",
  summary: {
    tracked_candidates: 0,
    total_receipts: 0,
    total_cash_on_hand: 0,
    average_receipts: 0,
    pac_committees: 0,
    pac_total: 0,
    states: 0,
    offices: 0,
    parties: 0,
    concentration_score: 0,
    pac_dependency_percentage: 0,
  },
  leaderboards: {
    candidates: [],
    pacs: [],
    states: [],
    parties: [],
    offices: [],
  },
  insights: [],
  risks: [],
  opportunities: [],
  selected_candidate: null,
  updated_at: null,
};

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function num(value) {
  const next = Number(value || 0);
  return Number.isFinite(next) ? next : 0;
}

function money(value) {
  return `$${num(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function pct(value) {
  return `${Math.round(num(value))}%`;
}

function text(value, fallback = "N/A") {
  const next = String(value || "").trim();
  return next || fallback;
}

function toneFromScore(value, inverse = false) {
  const score = num(value);
  if (inverse) {
    if (score >= 70) return "danger";
    if (score >= 45) return "warning";
    return "active";
  }

  if (score >= 70) return "active";
  if (score >= 45) return "accent";
  return "info";
}

function normalizeCandidate(row = {}, index = 0) {
  return {
    rank: num(row.rank || index + 1),
    candidate_id: row.candidate_id || row.id || `${row.name || "candidate"}-${index}`,
    name: row.name || row.candidate_name || "Unknown Candidate",
    state: row.state || "N/A",
    office: row.office || "Race",
    party: row.party || "N/A",
    receipts: num(row.receipts || row.total_receipts),
    cash_on_hand: num(row.cash_on_hand),
    pac_total: num(row.pac_total || row.pac_contributions_total),
    pac_count: num(row.pac_count || arr(row.pac_contributions).length),
    pac_dependency_percentage: num(row.pac_dependency_percentage),
    funding_sources: arr(row.funding_sources),
    pac_contributions: arr(row.pac_contributions),
  };
}

function normalizePayload(payload = {}) {
  const candidates = arr(payload?.leaderboards?.candidates || payload?.candidates || payload?.leaderboard)
    .map(normalizeCandidate);

  return {
    ...fallbackData,
    ...(payload || {}),
    summary: {
      ...fallbackData.summary,
      ...(payload.summary || {}),
    },
    leaderboards: {
      candidates,
      pacs: arr(payload?.leaderboards?.pacs || payload?.pacs),
      states: arr(payload?.leaderboards?.states || payload?.states),
      parties: arr(payload?.leaderboards?.parties || payload?.parties),
      offices: arr(payload?.leaderboards?.offices || payload?.offices),
    },
    insights: arr(payload.insights),
    risks: arr(payload.risks),
    opportunities: arr(payload.opportunities),
    selected_candidate: payload.selected_candidate || candidates[0] || null,
  };
}

function FinanceBar({ value, max }) {
  const width = max > 0 ? Math.max(4, Math.round((num(value) / max) * 100)) : 0;
  return (
    <div className="cfi-bar">
      <i style={{ width: `${width}%` }} />
    </div>
  );
}

function CandidateRow({ candidate, active, onClick, maxReceipts }) {
  return (
    <button
      type="button"
      className={active ? "cfi-candidate-row is-active" : "cfi-candidate-row"}
      onClick={() => onClick(candidate)}
    >
      <div className="cfi-rank">#{candidate.rank}</div>
      <div className="cfi-main">
        <strong>{candidate.name}</strong>
        <span>{candidate.state} · {candidate.office} · {candidate.party}</span>
        <FinanceBar value={candidate.receipts} max={maxReceipts} />
      </div>
      <div className="cfi-mini-stat">
        <span>Total Receipts</span>
        <strong>{money(candidate.receipts)}</strong>
      </div>
      <div className="cfi-mini-stat">
        <span>Cash On Hand</span>
        <strong>{money(candidate.cash_on_hand)}</strong>
      </div>
      <div className="cfi-mini-stat">
        <span>PAC Dependency</span>
        <strong>{pct(candidate.pac_dependency_percentage)}</strong>
        <small>{candidate.pac_count} PAC / Committee Records</small>
      </div>
    </button>
  );
}

function PacRow({ pac, index, maxAmount }) {
  return (
    <div className="cfi-pac-row">
      <div className="cfi-rank">#{index + 1}</div>
      <div className="cfi-main">
        <strong>{pac.committee_name || pac.name || "Unknown PAC / Committee"}</strong>
        <span>
          {text(pac.committee_id)} · {text(pac.committee_type, "Committee")} · {text(pac.committee_party)}
        </span>
        <FinanceBar value={pac.total_amount || pac.amount} max={maxAmount} />
      </div>
      <div className="cfi-mini-stat">
        <span>Total Contributions</span>
        <strong>{money(pac.total_amount || pac.amount)}</strong>
      </div>
      <div className="cfi-mini-stat">
        <span>Candidates Supported</span>
        <strong>{num(pac.candidate_count)}</strong>
      </div>
      <div className="cfi-mini-stat">
        <span>States Involved</span>
        <strong>{num(pac.state_count)}</strong>
      </div>
    </div>
  );
}

function EntityRow({ row, index, label, maxAmount }) {
  return (
    <div className="cfi-entity-row">
      <div>
        <span>{label} #{index + 1}</span>
        <strong>{row.name || row.state || row.party || row.office || "Unknown"}</strong>
      </div>
      <div>
        <span>Total Receipts</span>
        <strong>{money(row.total_receipts || row.receipts)}</strong>
      </div>
      <div>
        <span>Candidate Count</span>
        <strong>{num(row.candidate_count || row.candidates)}</strong>
      </div>
      <FinanceBar value={row.total_receipts || row.receipts} max={maxAmount} />
    </div>
  );
}

function InsightCard({ item }) {
  return (
    <div className="cfi-insight-card">
      <div className="cfi-insight-top">
        <span className={item.tone === "danger" ? "cfi-dot danger" : item.tone === "warning" ? "cfi-dot warning" : "cfi-dot"} />
        <Badge tone={item.tone || "info"}>{item.type || "Finance Intelligence"}</Badge>
      </div>
      <strong>{item.title}</strong>
      <p>{item.description}</p>
    </div>
  );
}

function SelectedCandidatePanel({ candidate }) {
  if (!candidate) {
    return <EmptyState text="Select a candidate to inspect PAC influence and funding-source detail." />;
  }

  const sources = arr(candidate.funding_sources);
  const pacs = arr(candidate.pac_contributions);
  const maxSource = Math.max(...sources.map((item) => num(item.amount)), 0);
  const maxPac = Math.max(...pacs.map((item) => num(item.amount)), 0);

  return (
    <div className="cfi-selected">
      <div className="cfi-selected-head">
        <div>
          <span>Selected Candidate Finance Profile</span>
          <strong>{candidate.name}</strong>
          <p>{candidate.state} · {candidate.office} · {candidate.party}</p>
        </div>
        <div className="cfi-selected-kpis">
          <Badge tone="accent">{money(candidate.receipts)} Receipts</Badge>
          <Badge tone={toneFromScore(candidate.pac_dependency_percentage, true)}>
            {pct(candidate.pac_dependency_percentage)} PAC Dependency
          </Badge>
        </div>
      </div>

      <div className="cfi-selected-grid">
        <div className="cfi-detail-block">
          <div className="cfi-block-title">Funding Source Mix</div>
          <div className="cfi-stack">
            {sources.length ? (
              sources.map((source) => (
                <div key={source.source} className="cfi-source-item">
                  <div>
                    <strong>{source.source}</strong>
                    <span>{money(source.amount)}</span>
                  </div>
                  <FinanceBar value={source.amount} max={maxSource} />
                </div>
              ))
            ) : (
              <EmptyState text="No funding-source breakdown is available for this candidate." />
            )}
          </div>
        </div>

        <div className="cfi-detail-block">
          <div className="cfi-block-title">Named PAC / Committee Support</div>
          <div className="cfi-stack">
            {pacs.length ? (
              pacs.slice(0, 12).map((pac) => (
                <div key={`${pac.committee_id}-${pac.committee_name}`} className="cfi-source-item">
                  <div>
                    <strong>{pac.committee_name || "Unknown PAC / Committee"}</strong>
                    <span>{money(pac.amount)} · {text(pac.committee_type, "Committee")} · {text(pac.state, "National")}</span>
                  </div>
                  <FinanceBar value={pac.amount} max={maxPac} />
                </div>
              ))
            ) : (
              <EmptyState text="No named PAC records are available for this candidate yet." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CampaignFinanceIntelligencePlatform() {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [activeCandidateId, setActiveCandidateId] = useState(null);
  const [filters, setFilters] = useState({
    state: "",
    party: "",
    office: "",
    pac: "",
  });

  const loadData = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");

      const response = await api.get("/campaign-finance-intelligence", {
        params: {
          limit: 1000,
          state: filters.state || undefined,
          party: filters.party || undefined,
          office: filters.office || undefined,
          pac: filters.pac || undefined,
        },
        timeout: 15000,
      });

      const payload = normalizePayload(response?.data || fallbackData);
      setData(payload);

      setActiveCandidateId((current) => {
        if (current && payload.leaderboards.candidates.some((candidate) => String(candidate.candidate_id) === String(current))) {
          return current;
        }
        return payload.leaderboards.candidates[0]?.candidate_id || null;
      });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Campaign Finance Intelligence API is unavailable."
      );
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, [filters.state, filters.party, filters.office, filters.pac]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function runFecSync() {
    setSyncing(true);
    setNotice("");
    setError("");

    try {
      await api.post("/campaign-finance-intelligence/sync", {}, { timeout: 90000 });
      await loadData({ silent: true });
      setNotice("FEC finance and PAC data sync completed. Intelligence platform has been reloaded.");
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Unable to run the FEC finance sync."
      );
    } finally {
      setSyncing(false);
    }
  }

  const candidates = arr(data.leaderboards.candidates);
  const pacs = arr(data.leaderboards.pacs);
  const states = arr(data.leaderboards.states);
  const parties = arr(data.leaderboards.parties);
  const offices = arr(data.leaderboards.offices);
  const summary = data.summary || fallbackData.summary;

  const activeCandidate = useMemo(() => {
    return candidates.find((candidate) => String(candidate.candidate_id) === String(activeCandidateId)) || candidates[0] || null;
  }, [candidates, activeCandidateId]);

  const filterOptions = useMemo(() => {
    const unique = (items, key) =>
      Array.from(new Set(items.map((item) => text(item[key], "")).filter(Boolean))).sort();

    return {
      states: unique(candidates, "state"),
      parties: unique(candidates, "party"),
      offices: unique(candidates, "office"),
      pacs: unique(pacs, "committee_name"),
    };
  }, [candidates, pacs]);

  const maxCandidateReceipts = Math.max(...candidates.map((item) => num(item.receipts)), 0);
  const maxPacAmount = Math.max(...pacs.map((item) => num(item.total_amount || item.amount)), 0);
  const maxStateAmount = Math.max(...states.map((item) => num(item.total_receipts || item.receipts)), 0);
  const maxPartyAmount = Math.max(...parties.map((item) => num(item.total_receipts || item.receipts)), 0);
  const maxOfficeAmount = Math.max(...offices.map((item) => num(item.total_receipts || item.receipts)), 0);

  return (
    <PageShell
      eyebrow="Campaign Finance Intelligence Platform"
      title="Campaign Finance Intelligence Platform"
      description="Executive finance intelligence built on top of live FEC fundraising, PAC contribution, candidate, party, race, and state data."
      demo={String(data.source || "").includes("empty")}
      demoText="No campaign finance intelligence is currently loaded."
      tickerItems={[
        { label: "Candidates", value: `${summary.tracked_candidates || candidates.length}`, dotClass: "vs-live-dot-success" },
        { label: "Receipts", value: money(summary.total_receipts), dotClass: "vs-live-dot-success" },
        { label: "PAC Committees", value: `${summary.pac_committees || pacs.length}`, dotClass: "vs-live-dot-warning" },
        { label: "PAC Dependency", value: pct(summary.pac_dependency_percentage), dotClass: "vs-live-dot-warning" },
      ]}
    >
      <style>{`
        .cfi-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .cfi-toolbar-actions,
        .cfi-chip-row,
        .cfi-selected-kpis {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .cfi-filters {
          display: grid;
          grid-template-columns: repeat(4, minmax(180px, 1fr)) auto;
          gap: 12px;
          align-items: end;
        }

        .cfi-filter {
          display: grid;
          gap: 7px;
        }

        .cfi-filter span,
        .cfi-mini-stat span,
        .cfi-selected-head span,
        .cfi-entity-row span,
        .cfi-block-title {
          color: var(--vs-text-muted);
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .cfi-filter select {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: #0f172a;
          color: #f8fafc;
          padding: 11px 12px;
          outline: none;
          font-weight: 800;
        }

        .cfi-filter select option {
          background: #0f172a;
          color: #f8fafc;
        }

        .cfi-grid-main {
          display: grid;
          grid-template-columns: minmax(0, 1.18fr) minmax(360px, 0.82fr);
          gap: 22px;
          align-items: start;
        }

        .cfi-stack {
          display: grid;
          gap: 12px;
        }

        .cfi-candidate-row,
        .cfi-pac-row,
        .cfi-entity-row,
        .cfi-insight-card,
        .cfi-selected,
        .cfi-detail-block,
        .cfi-source-item {
          background: var(--vs-panel-bg, #111827);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 20px;
          box-shadow: none;
          min-width: 0;
        }

        .cfi-candidate-row,
        .cfi-pac-row {
          display: grid;
          grid-template-columns: 64px minmax(280px, 1.7fr) repeat(3, minmax(150px, 0.8fr));
          gap: 16px;
          align-items: start;
          width: 100%;
          padding: 16px;
          color: inherit;
          text-align: left;
        }

        .cfi-candidate-row {
          cursor: pointer;
        }

        .cfi-candidate-row:hover,
        .cfi-candidate-row.is-active {
          border-color: rgba(251, 146, 60, 0.5);
          background: rgba(15, 23, 42, 0.96);
        }

        .cfi-rank {
          color: var(--vs-text-muted);
          font-weight: 950;
          font-size: 18px;
        }

        .cfi-main,
        .cfi-mini-stat,
        .cfi-source-item div,
        .cfi-entity-row div {
          display: grid;
          gap: 5px;
          min-width: 0;
        }

        .cfi-main strong,
        .cfi-mini-stat strong,
        .cfi-source-item strong,
        .cfi-entity-row strong,
        .cfi-selected-head strong,
        .cfi-insight-card strong {
          color: var(--vs-text);
          overflow-wrap: anywhere;
          line-height: 1.25;
        }

        .cfi-main span,
        .cfi-mini-stat small,
        .cfi-source-item span,
        .cfi-selected-head p,
        .cfi-insight-card p {
          color: var(--vs-text-muted);
          font-size: 12px;
          line-height: 1.5;
          margin: 0;
        }

        .cfi-bar {
          height: 8px;
          border-radius: 999px;
          background: rgba(148, 163, 184, 0.18);
          overflow: hidden;
        }

        .cfi-bar i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #38bdf8, #fb923c);
          min-width: 6px;
        }

        .cfi-pac-row {
          grid-template-columns: 56px minmax(240px, 1.4fr) repeat(3, minmax(130px, 0.75fr));
        }

        .cfi-entity-row {
          display: grid;
          grid-template-columns: minmax(220px, 1.2fr) minmax(160px, 0.8fr) minmax(120px, 0.6fr);
          gap: 14px;
          padding: 14px;
        }

        .cfi-entity-row .cfi-bar {
          grid-column: 1 / -1;
        }

        .cfi-insight-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .cfi-insight-card {
          padding: 16px;
          display: grid;
          gap: 10px;
        }

        .cfi-insight-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .cfi-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #22c55e;
          box-shadow: 0 0 18px rgba(34, 197, 94, 0.55);
        }

        .cfi-dot.warning {
          background: #f59e0b;
          box-shadow: 0 0 18px rgba(245, 158, 11, 0.55);
        }

        .cfi-dot.danger {
          background: #ef4444;
          box-shadow: 0 0 18px rgba(239, 68, 68, 0.55);
        }

        .cfi-selected {
          padding: 18px;
          display: grid;
          gap: 16px;
        }

        .cfi-selected-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }

        .cfi-selected-head strong {
          display: block;
          margin-top: 6px;
          font-size: clamp(22px, 3vw, 32px);
        }

        .cfi-selected-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .cfi-detail-block {
          padding: 14px;
          display: grid;
          gap: 12px;
        }

        .cfi-source-item {
          padding: 12px;
          display: grid;
          gap: 8px;
        }

        @media (max-width: 1320px) {
          .cfi-grid-main,
          .cfi-insight-grid,
          .cfi-selected-grid,
          .cfi-filters {
            grid-template-columns: 1fr;
          }

          .cfi-candidate-row,
          .cfi-pac-row,
          .cfi-entity-row {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 760px) {
          .cfi-candidate-row,
          .cfi-pac-row,
          .cfi-entity-row {
            grid-template-columns: 1fr;
          }

          .cfi-toolbar,
          .cfi-selected-head {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>

      <div className="cfi-toolbar">
        <div className="cfi-chip-row">
          <Badge tone="active">Live FEC Data Layer</Badge>
          <Badge tone="accent">PAC Influence Intelligence</Badge>
          <Badge tone="info">Executive Finance Workspace</Badge>
        </div>

        <div className="cfi-toolbar-actions">
          <button type="button" className="vs-button vs-button-secondary" onClick={() => loadData()} disabled={loading}>
            {loading ? "Refreshing Intelligence..." : "Refresh Intelligence"}
          </button>
          <button type="button" className="vs-button vs-button-primary" onClick={runFecSync} disabled={syncing}>
            {syncing ? "Syncing FEC Data..." : "Sync FEC + PAC Data"}
          </button>
          <Link className="vs-button vs-button-secondary" to="/fundraising">
            Open Fundraising Dashboard
          </Link>
        </div>
      </div>

      {notice ? <div className="vs-banner">{notice}</div> : null}
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <SectionCard
        title="Campaign Finance Filters"
        subtitle="Filter finance intelligence by geography, party, office, or PAC committee."
      >
        <div className="cfi-filters">
          <label className="cfi-filter">
            <span>State</span>
            <select value={filters.state} onChange={(event) => setFilters((current) => ({ ...current, state: event.target.value }))}>
              <option value="">All States</option>
              {filterOptions.states.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="cfi-filter">
            <span>Party</span>
            <select value={filters.party} onChange={(event) => setFilters((current) => ({ ...current, party: event.target.value }))}>
              <option value="">All Parties</option>
              {filterOptions.parties.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="cfi-filter">
            <span>Office</span>
            <select value={filters.office} onChange={(event) => setFilters((current) => ({ ...current, office: event.target.value }))}>
              <option value="">All Offices</option>
              {filterOptions.offices.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="cfi-filter">
            <span>PAC / Committee</span>
            <select value={filters.pac} onChange={(event) => setFilters((current) => ({ ...current, pac: event.target.value }))}>
              <option value="">All PACs / Committees</option>
              {filterOptions.pacs.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => setFilters({ state: "", party: "", office: "", pac: "" })}
          >
            Clear Filters
          </button>
        </div>
      </SectionCard>

      <div className="vs-grid-4">
        <StatCard label="Tracked Candidates" value={summary.tracked_candidates || candidates.length} delta="FEC candidate finance universe" tone="up" />
        <StatCard label="Total Receipts" value={money(summary.total_receipts)} delta="Candidate receipts across active filters" tone="up" />
        <StatCard label="Named PAC Committees" value={summary.pac_committees || pacs.length} delta="PACs and committees detected" tone="up" />
        <StatCard label="PAC Dependency Percentage" value={pct(summary.pac_dependency_percentage)} delta="Share of receipts tied to named PAC totals" tone="up" />
      </div>

      <SectionCard
        title="Executive Finance Intelligence"
        subtitle="AI-style interpretation of campaign finance concentration, PAC exposure, and finance opportunities."
      >
        <div className="cfi-insight-grid">
          {loading ? (
            <EmptyState text="Loading finance insights..." />
          ) : arr(data.insights).length ? (
            data.insights.map((item) => <InsightCard key={item.title} item={item} />)
          ) : (
            <EmptyState text="No campaign finance insights are currently available." />
          )}
        </div>
      </SectionCard>

      <div className="cfi-grid-main">
        <div className="cfi-stack">
          <SectionCard
            title="Candidate Finance Command Board"
            subtitle="Ranked candidate finance strength with PAC dependency and reserve posture."
            right={<Badge tone="accent">{candidates.length} Candidates</Badge>}
          >
            <div className="cfi-stack">
              {loading ? (
                <EmptyState text="Loading candidate finance board..." />
              ) : candidates.length ? (
                candidates.map((candidate) => (
                  <CandidateRow
                    key={candidate.candidate_id}
                    candidate={candidate}
                    active={String(candidate.candidate_id) === String(activeCandidateId)}
                    onClick={(item) => setActiveCandidateId(item.candidate_id)}
                    maxReceipts={maxCandidateReceipts}
                  />
                ))
              ) : (
                <EmptyState text="No candidate finance records match the selected filters." />
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Top PAC / Committee Influence"
            subtitle="Named PACs and committees ranked by total support across the filtered candidate universe."
            right={<Badge tone="info">{pacs.length} PACs</Badge>}
          >
            <div className="cfi-stack">
              {pacs.length ? (
                pacs.slice(0, 25).map((pac, index) => (
                  <PacRow key={`${pac.committee_id || pac.committee_name}-${index}`} pac={pac} index={index} maxAmount={maxPacAmount} />
                ))
              ) : (
                <EmptyState text="No named PAC records are available for the selected filters." />
              )}
            </div>
          </SectionCard>
        </div>

        <div className="cfi-stack">
          <SectionCard
            title="Selected Candidate Finance Profile"
            subtitle="Detailed source mix and named PAC contribution records."
          >
            <SelectedCandidatePanel candidate={activeCandidate} />
          </SectionCard>

          <SectionCard
            title="State Finance Heat"
            subtitle="Receipts and candidate count by state."
          >
            <div className="cfi-stack">
              {states.length ? states.slice(0, 12).map((row, index) => (
                <EntityRow key={row.state || row.name} row={row} index={index} label="State" maxAmount={maxStateAmount} />
              )) : <EmptyState text="No state finance data is available." />}
            </div>
          </SectionCard>

          <SectionCard
            title="Party Finance Distribution"
            subtitle="Receipts and candidate count by party."
          >
            <div className="cfi-stack">
              {parties.length ? parties.map((row, index) => (
                <EntityRow key={row.party || row.name} row={row} index={index} label="Party" maxAmount={maxPartyAmount} />
              )) : <EmptyState text="No party finance data is available." />}
            </div>
          </SectionCard>

          <SectionCard
            title="Office Finance Distribution"
            subtitle="Receipts and candidate count by office type."
          >
            <div className="cfi-stack">
              {offices.length ? offices.map((row, index) => (
                <EntityRow key={row.office || row.name} row={row} index={index} label="Office" maxAmount={maxOfficeAmount} />
              )) : <EmptyState text="No office finance data is available." />}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}

