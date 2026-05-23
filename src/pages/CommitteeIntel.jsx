import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function money(value) {
  const amount = number(value);
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
  return `$${Math.round(amount).toLocaleString()}`;
}

function joinText(values = []) {
  return values.filter(Boolean).map(String).join(" - ");
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function toneForScore(value) {
  const score = number(value);
  if (score >= 75) return "danger";
  if (score >= 50) return "warning";
  if (score >= 25) return "info";
  return "default";
}

function riskTone(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("high") || text.includes("exposure") || text.includes("critical")) return "danger";
  if (text.includes("watch") || text.includes("elevated") || text.includes("thin")) return "warning";
  if (text.includes("active") || text.includes("complete") || text.includes("stable")) return "active";
  return "default";
}

function getCommitteeKey(row = {}) {
  return row.committee_id || row.committee_name || row.id || "unknown";
}

function getCommitteeName(row = {}) {
  return row.committee_name || row.name || "Unknown Committee";
}

function buildCommitteeRows(relationships = []) {
  const map = new Map();

  for (const row of relationships) {
    const key = getCommitteeKey(row);
    const existing = map.get(key) || {
      committee_id: row.committee_id,
      committee_name: row.committee_name || "Unknown Committee",
      candidate_count: 0,
      consultant_count: 0,
      total_amount: 0,
      transaction_count: 0,
      states: new Set(),
      parties: new Set(),
      offices: new Set(),
      categories: new Set(),
      consultants: new Map(),
      candidates: new Map(),
      last_activity: row.last_disbursement_date || row.updated_at || null,
    };

    existing.total_amount += number(row.total_amount);
    existing.transaction_count += number(row.transaction_count);

    if (row.candidate_state) existing.states.add(row.candidate_state);
    if (row.candidate_party) existing.parties.add(row.candidate_party);
    if (row.candidate_office) existing.offices.add(row.candidate_office);
    if (row.category) existing.categories.add(row.category);

    if (row.consultant_id || row.consultant_name) {
      const consultantKey = row.consultant_id || row.consultant_name;
      const consultant = existing.consultants.get(consultantKey) || {
        consultant_id: row.consultant_id,
        consultant_name: row.consultant_name || "Consultant",
        category: row.category,
        total_amount: 0,
        transaction_count: 0,
        influence_score: row.influence_score || 0,
        risk_label: row.risk_label || "Signal",
      };
      consultant.total_amount += number(row.total_amount);
      consultant.transaction_count += number(row.transaction_count);
      existing.consultants.set(consultantKey, consultant);
    }

    if (row.candidate_id || row.candidate_name) {
      const candidateKey = row.candidate_id || row.candidate_name;
      const candidate = existing.candidates.get(candidateKey) || {
        candidate_id: row.candidate_id,
        candidate_name: row.candidate_name || "Candidate",
        candidate_state: row.candidate_state,
        candidate_party: row.candidate_party,
        candidate_office: row.candidate_office,
        total_amount: 0,
        transaction_count: 0,
      };
      candidate.total_amount += number(row.total_amount);
      candidate.transaction_count += number(row.transaction_count);
      existing.candidates.set(candidateKey, candidate);
    }

    const nextDate = row.last_disbursement_date || row.updated_at;
    if (nextDate && (!existing.last_activity || new Date(nextDate) > new Date(existing.last_activity))) {
      existing.last_activity = nextDate;
    }

    map.set(key, existing);
  }

  return [...map.values()]
    .map((row) => ({
      ...row,
      state_count: row.states.size,
      party_count: row.parties.size,
      office_count: row.offices.size,
      category_count: row.categories.size,
      candidate_count: row.candidates.size,
      consultant_count: row.consultants.size,
      states: [...row.states].sort(),
      parties: [...row.parties].sort(),
      offices: [...row.offices].sort(),
      categories: [...row.categories].sort(),
      consultants: [...row.consultants.values()].sort((a, b) => number(b.total_amount) - number(a.total_amount)),
      candidates: [...row.candidates.values()].sort((a, b) => number(b.total_amount) - number(a.total_amount)),
      concentration_score: Math.min(100, Math.round(row.consultants.size * 12 + row.candidates.size * 5 + Math.log(Math.max(row.total_amount, 1)) * 3)),
    }))
    .sort((a, b) => number(b.total_amount) - number(a.total_amount));
}

function CommitteeCard({ committee, expanded, onToggle, onOpenGraph }) {
  return (
    <div className="vs-card-muted" style={{ padding: 14, display: "grid", gap: 12 }}>
      <button
        type="button"
        onClick={onToggle}
        style={{ appearance: "none", border: 0, background: "transparent", padding: 0, textAlign: "left", cursor: "pointer", display: "grid", gap: 10 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--vs-text)", fontWeight: 900, fontSize: 16, lineHeight: 1.25 }}>
              {getCommitteeName(committee)}
            </div>
            <div style={{ color: "var(--vs-text-muted)", fontSize: 12, marginTop: 4 }}>
              {joinText([
                committee.committee_id || "Committee ID N/A",
                committee.states?.slice(0, 4).join(", ") || "National",
                committee.parties?.slice(0, 3).join(", ") || "Party N/A",
              ])}
            </div>
          </div>

          <div className="vs-chip-row">
            <Badge tone={toneForScore(committee.concentration_score)}>
              Concentration {committee.concentration_score || 0}
            </Badge>
            <Badge tone="info">{money(committee.total_amount)}</Badge>
            <Badge tone="default">{expanded ? "Hide Details" : "Show Details"}</Badge>
          </div>
        </div>

        <div className="vs-chip-row">
          <Badge tone="accent">{committee.consultant_count || 0} consultants</Badge>
          <Badge tone="info">{committee.candidate_count || 0} candidates</Badge>
          <Badge tone="warning">{committee.state_count || 0} states</Badge>
          <Badge tone="default">{committee.transaction_count || 0} transactions</Badge>
          {committee.last_activity ? <Badge tone="active">Last {String(committee.last_activity).slice(0, 10)}</Badge> : null}
        </div>
      </button>

      {expanded ? (
        <div className="vs-stack">
          <SectionCard
            title="Committee Intelligence Summary"
            subtitle="Spend concentration, state footprint, and relationship coverage for this committee."
            right={<button type="button" className="vs-button vs-button-secondary" onClick={onOpenGraph}>Open Graph</button>}
          >
            <div className="vs-grid-4">
              <StatCard label="Total Spend" value={money(committee.total_amount)} subtext="Mapped disbursements" />
              <StatCard label="Consultants" value={committee.consultant_count || 0} subtext="Vendor relationships" />
              <StatCard label="Candidates" value={committee.candidate_count || 0} subtext="Candidate links" />
              <StatCard label="States" value={committee.state_count || 0} subtext={committee.states?.join(", ") || "N/A"} />
            </div>

            <div className="vs-banner" style={{ marginTop: 12 }}>
              <strong>Readout:</strong> This committee is connected to {committee.consultant_count || 0} consultant/vendor relationship{committee.consultant_count === 1 ? "" : "s"} and {committee.candidate_count || 0} candidate relationship{committee.candidate_count === 1 ? "" : "s"} across {committee.state_count || 0} state{committee.state_count === 1 ? "" : "s"}.
            </div>
          </SectionCard>

          <div className="vs-grid-2" style={{ alignItems: "start" }}>
            <SectionCard title="Consultant / Vendor Relationships" subtitle="Top consultants or vendors paid by this committee.">
              <div className="vs-stack">
                {committee.consultants?.length ? committee.consultants.slice(0, 10).map((consultant) => (
                  <div key={consultant.consultant_id || consultant.consultant_name} className="vs-card-muted" style={{ padding: 12, display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <strong style={{ color: "var(--vs-text)" }}>{consultant.consultant_name}</strong>
                      <Badge tone={toneForScore(consultant.influence_score)}>Influence {consultant.influence_score || 0}</Badge>
                    </div>
                    <div className="vs-chip-row">
                      <Badge tone="info">{money(consultant.total_amount)}</Badge>
                      <Badge tone="accent">{consultant.transaction_count || 0} transactions</Badge>
                      <Badge tone={riskTone(consultant.risk_label)}>{consultant.risk_label || "Signal"}</Badge>
                      <Badge tone="default">{consultant.category || "Political Consulting"}</Badge>
                    </div>
                  </div>
                )) : <EmptyState text="No consultant relationships mapped for this committee." />}
              </div>
            </SectionCard>

            <SectionCard title="Candidate Relationships" subtitle="Candidates connected to this committee through disbursement intelligence.">
              <div className="vs-stack">
                {committee.candidates?.length ? committee.candidates.slice(0, 10).map((candidate) => (
                  <div key={candidate.candidate_id || candidate.candidate_name} className="vs-card-muted" style={{ padding: 12, display: "grid", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <strong style={{ color: "var(--vs-text)" }}>{candidate.candidate_name}</strong>
                      <Badge tone="info">{money(candidate.total_amount)}</Badge>
                    </div>
                    <div className="vs-chip-row">
                      <Badge tone="accent">{candidate.candidate_state || "State N/A"}</Badge>
                      <Badge tone="default">{candidate.candidate_office || "Office N/A"}</Badge>
                      <Badge tone="warning">{candidate.candidate_party || "Party N/A"}</Badge>
                      <Badge tone="info">{candidate.transaction_count || 0} transactions</Badge>
                    </div>
                  </div>
                )) : <EmptyState text="No candidate relationships mapped for this committee." />}
              </div>
            </SectionCard>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HeatmapPanel({ rows = [] }) {
  const stateRows = useMemo(() => {
    const map = new Map();
    for (const committee of rows) {
      for (const state of committee.states || []) {
        const existing = map.get(state) || { state, committee_count: 0, total_amount: 0, consultant_count: 0, candidate_count: 0 };
        existing.committee_count += 1;
        existing.total_amount += number(committee.total_amount);
        existing.consultant_count += number(committee.consultant_count);
        existing.candidate_count += number(committee.candidate_count);
        map.set(state, existing);
      }
    }
    return [...map.values()].sort((a, b) => number(b.total_amount) - number(a.total_amount));
  }, [rows]);

  return (
    <SectionCard title="Committee State Heatmap" subtitle="State-level spend and committee relationship pressure.">
      <div className="vs-stack">
        {stateRows.length ? stateRows.slice(0, 12).map((row) => (
          <div key={row.state} className="vs-card-muted" style={{ padding: 12, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <strong style={{ color: "var(--vs-text)" }}>{row.state}</strong>
              <Badge tone="info">{money(row.total_amount)}</Badge>
            </div>
            <div className="vs-chip-row">
              <Badge tone="accent">{row.committee_count} committees</Badge>
              <Badge tone="warning">{row.consultant_count} consultant links</Badge>
              <Badge tone="default">{row.candidate_count} candidate links</Badge>
            </div>
          </div>
        )) : <EmptyState text="No state heatmap data available yet." />}
      </div>
    </SectionCard>
  );
}

function ConcentrationPanel({ rows = [] }) {
  return (
    <SectionCard title="Consultant Concentration Risk" subtitle="Committees with the highest concentration of consultant/vendor relationships.">
      <div className="vs-stack">
        {rows.length ? rows.slice(0, 8).map((row) => (
          <div key={getCommitteeKey(row)} className="vs-card-muted" style={{ padding: 12, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <strong style={{ color: "var(--vs-text)" }}>{getCommitteeName(row)}</strong>
              <Badge tone={toneForScore(row.concentration_score)}>Score {row.concentration_score}</Badge>
            </div>
            <div className="vs-chip-row">
              <Badge tone="info">{money(row.total_amount)}</Badge>
              <Badge tone="accent">{row.consultant_count} consultants</Badge>
              <Badge tone="warning">{row.candidate_count} candidates</Badge>
              <Badge tone="default">{row.party_count} parties</Badge>
            </div>
          </div>
        )) : <EmptyState text="No concentration risk records available." />}
      </div>
    </SectionCard>
  );
}

export default function CommitteeIntel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");
  const [rawRelationships, setRawRelationships] = useState([]);
  const [expandedKey, setExpandedKey] = useState("");
  const [filters, setFilters] = useState({ search: "", state: "", party: "", minAmount: "" });

  const demoMode = typeof window !== "undefined" && localStorage.getItem("vs_demo_mode") === "1";

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      const dashboard = await api.get("/consultants/risk/dashboard", { params: { limit: 250 } }).then((r) => r.data);
      setRawRelationships(normalizeArray(dashboard?.recent_relationships));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load committee intelligence.");
      setRawRelationships([]);
    } finally {
      setLoading(false);
    }
  }

  async function runScore() {
    try {
      setScoring(true);
      await api.post("/consultants/risk/score", {});
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to refresh committee intelligence.");
    } finally {
      setScoring(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const committees = useMemo(() => buildCommitteeRows(rawRelationships), [rawRelationships]);

  const filteredCommittees = useMemo(() => {
    let rows = committees;
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      rows = rows.filter((row) => String(row.committee_name || "").toLowerCase().includes(q) || String(row.committee_id || "").toLowerCase().includes(q) || row.consultants.some((item) => String(item.consultant_name || "").toLowerCase().includes(q)) || row.candidates.some((item) => String(item.candidate_name || "").toLowerCase().includes(q)));
    }
    if (filters.state) rows = rows.filter((row) => row.states.includes(filters.state));
    if (filters.party) rows = rows.filter((row) => row.parties.includes(filters.party));
    if (filters.minAmount) rows = rows.filter((row) => number(row.total_amount) >= number(filters.minAmount));
    return rows;
  }, [committees, filters]);

  const summary = useMemo(() => {
    const consultantIds = new Set();
    const candidateIds = new Set();
    let totalAmount = 0;
    let transactions = 0;
    for (const committee of filteredCommittees) {
      totalAmount += number(committee.total_amount);
      transactions += number(committee.transaction_count);
      for (const consultant of committee.consultants) consultantIds.add(consultant.consultant_id || consultant.consultant_name);
      for (const candidate of committee.candidates) candidateIds.add(candidate.candidate_id || candidate.candidate_name);
    }
    return { total_committees: filteredCommittees.length, total_amount: totalAmount, total_transactions: transactions, total_consultants: consultantIds.size, total_candidates: candidateIds.size };
  }, [filteredCommittees]);

  const stateOptions = useMemo(() => [...new Set(committees.flatMap((row) => row.states || []))].sort(), [committees]);
  const partyOptions = useMemo(() => [...new Set(committees.flatMap((row) => row.parties || []))].sort(), [committees]);

  return (
    <PageShell
      eyebrow="PAC / Committee Intelligence"
      title="Committee spend and influence network."
      description="Track committee spend, consultant concentration, PAC/vendor relationships, candidate links, and battleground committee pressure."
      demo={demoMode}
      demoText="Demo committee intelligence mode is active."
      tickerItems={[
        { label: "Committees", value: summary.total_committees, dotClass: "vs-live-dot-success" },
        { label: "Consultants", value: summary.total_consultants, dotClass: "vs-live-dot-warning" },
        { label: "Mapped Spend", value: money(summary.total_amount), dotClass: "vs-live-dot" },
      ]}
    >
      {error ? <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Committees" value={summary.total_committees} subtext="Visible committee records" />
        <StatCard label="Mapped Spend" value={money(summary.total_amount)} subtext="FEC-linked disbursements" />
        <StatCard label="Consultant Links" value={summary.total_consultants} subtext="Vendor relationships" />
        <StatCard label="Candidate Links" value={summary.total_candidates} subtext="Mapped candidate relationships" />
      </div>

      <SectionCard
        title="Committee Intelligence Controls"
        subtitle="Filter committee spend intelligence by state, party, committee, candidate, consultant, or minimum spend."
        right={<div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button type="button" className="vs-button vs-button-secondary" onClick={loadData} disabled={loading}>{loading ? "Loading..." : "Reload"}</button><button type="button" className="vs-button" onClick={runScore} disabled={scoring}>{scoring ? "Refreshing..." : "Refresh Scores"}</button></div>}
      >
        <div className="vs-grid-4">
          <input className="vs-input" value={filters.search} onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))} placeholder="Search committee, consultant, or candidate..." />
          <select className="vs-input" value={filters.state} onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))}><option value="">All states</option>{stateOptions.map((state) => <option key={state} value={state}>{state}</option>)}</select>
          <select className="vs-input" value={filters.party} onChange={(e) => setFilters((prev) => ({ ...prev, party: e.target.value }))}><option value="">All parties</option>{partyOptions.map((party) => <option key={party} value={party}>{party}</option>)}</select>
          <select className="vs-input" value={filters.minAmount} onChange={(e) => setFilters((prev) => ({ ...prev, minAmount: e.target.value }))}><option value="">Any spend</option><option value="10000">$10K+</option><option value="50000">$50K+</option><option value="100000">$100K+</option><option value="500000">$500K+</option></select>
        </div>
        <div className="vs-banner" style={{ marginTop: 12 }}>Committee intelligence is currently derived from consultant-candidate relationship records imported from FEC Schedule B disbursements.</div>
      </SectionCard>

      {loading ? <EmptyState text="Loading committee intelligence..." /> : (
        <div className="vs-stack">
          <div className="vs-grid-2" style={{ alignItems: "start" }}>
            <HeatmapPanel rows={filteredCommittees} />
            <ConcentrationPanel rows={filteredCommittees} />
          </div>

          <SectionCard title="Committee Directory" subtitle="Expandable committee cards showing consultant/vendor relationships and candidate spend links." right={<Badge tone="info">{filteredCommittees.length} committees shown</Badge>}>
            <div className="vs-stack">
              {filteredCommittees.length ? filteredCommittees.map((committee) => {
                const key = getCommitteeKey(committee);
                return <CommitteeCard key={key} committee={committee} expanded={String(expandedKey) === String(key)} onToggle={() => setExpandedKey((prev) => String(prev) === String(key) ? "" : key)} onOpenGraph={() => navigate(`/relationship-graph?committee=${encodeURIComponent(getCommitteeName(committee))}`)} />;
              }) : <EmptyState text="No committee intelligence records match the active filters." />}
            </div>
          </SectionCard>
        </div>
      )}
    </PageShell>
  );
}

