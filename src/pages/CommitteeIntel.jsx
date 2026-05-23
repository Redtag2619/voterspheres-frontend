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
  if (text.includes("high") || text.includes("critical") || text.includes("exposure")) return "danger";
  if (text.includes("watch") || text.includes("elevated")) return "warning";
  if (text.includes("active") || text.includes("stable")) return "active";
  return "default";
}

function getCommitteeKey(row = {}) {
  return row.committee_id || row.committee_name || row.id || "unknown";
}

function getCommitteeName(row = {}) {
  return row.committee_name || row.name || "Unknown Committee";
}

function CommitteeCard({ committee, expanded, onToggle, onOpenGraph }) {
  const consultants = normalizeArray(committee.top_consultants);
  const candidates = normalizeArray(committee.top_candidates);
  const states = normalizeArray(committee.states);
  const parties = normalizeArray(committee.parties);

  return (
    <div className="vs-card-muted" style={{ padding: 14, display: "grid", gap: 12 }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          appearance: "none",
          border: 0,
          background: "transparent",
          padding: 0,
          textAlign: "left",
          cursor: "pointer",
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--vs-text)", fontWeight: 900, fontSize: 16, lineHeight: 1.25 }}>
              {getCommitteeName(committee)}
            </div>
            <div style={{ color: "var(--vs-text-muted)", fontSize: 12, marginTop: 4 }}>
              {joinText([
                committee.committee_id || "Committee ID N/A",
                states.slice(0, 4).join(", ") || "National",
                parties.slice(0, 3).join(", ") || "Party N/A",
              ])}
            </div>
          </div>

          <div className="vs-chip-row">
            <Badge tone={toneForScore(committee.concentration_score)}>
              Concentration {committee.concentration_score || 0}
            </Badge>
            <Badge tone={riskTone(committee.risk_label)}>{committee.risk_label || "Signal"}</Badge>
            <Badge tone="info">{money(committee.total_amount)}</Badge>
            <Badge tone="default">{expanded ? "Hide Details" : "Show Details"}</Badge>
          </div>
        </div>

        <div className="vs-chip-row">
          <Badge tone="accent">{committee.consultant_count || 0} consultants</Badge>
          <Badge tone="info">{committee.candidate_count || 0} candidates</Badge>
          <Badge tone="warning">{committee.state_count || states.length || 0} states</Badge>
          <Badge tone="default">{committee.transaction_count || 0} transactions</Badge>
          {committee.last_activity ? <Badge tone="active">Last {String(committee.last_activity).slice(0, 10)}</Badge> : null}
        </div>
      </button>

      {expanded ? (
        <div className="vs-stack">
          <SectionCard
            title="Committee Intelligence Summary"
            subtitle="Spend concentration, state footprint, and relationship coverage for this committee."
            right={
              <button type="button" className="vs-button vs-button-secondary" onClick={onOpenGraph}>
                Open Graph
              </button>
            }
          >
            <div className="vs-grid-4">
              <StatCard label="Total Spend" value={money(committee.total_amount)} subtext="Mapped disbursements" />
              <StatCard label="Consultants" value={committee.consultant_count || 0} subtext="Vendor relationships" />
              <StatCard label="Candidates" value={committee.candidate_count || 0} subtext="Candidate links" />
              <StatCard
                label="Battleground"
                value={money(committee.battleground_amount)}
                subtext={`${committee.battleground_candidate_count || 0} candidates`}
              />
            </div>

            <div className="vs-banner" style={{ marginTop: 12 }}>
              <strong>Readout:</strong> {committee.narrative || "Committee narrative unavailable."}
            </div>
          </SectionCard>

          <div className="vs-grid-2" style={{ alignItems: "start" }}>
            <SectionCard title="Consultant / Vendor Relationships" subtitle="Top consultants or vendors paid by this committee.">
              <div className="vs-stack">
                {consultants.length ? (
                  consultants.map((consultant) => (
                    <div
                      key={consultant.consultant_id || consultant.consultant_name}
                      className="vs-card-muted"
                      style={{ padding: 12, display: "grid", gap: 8 }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <strong style={{ color: "var(--vs-text)" }}>
                          {consultant.consultant_name || consultant.firm_name || "Consultant"}
                        </strong>
                        <Badge tone={toneForScore(consultant.influence_score)}>
                          Influence {consultant.influence_score || 0}
                        </Badge>
                      </div>
                      <div className="vs-chip-row">
                        <Badge tone="info">{money(consultant.total_amount)}</Badge>
                        <Badge tone="accent">{consultant.transaction_count || 0} transactions</Badge>
                        <Badge tone={riskTone(consultant.risk_label)}>{consultant.risk_label || "Signal"}</Badge>
                        <Badge tone="default">{consultant.category || "Political Consulting"}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState text="No consultant relationships mapped for this committee." />
                )}
              </div>
            </SectionCard>

            <SectionCard title="Candidate Relationships" subtitle="Candidates connected to this committee through disbursement intelligence.">
              <div className="vs-stack">
                {candidates.length ? (
                  candidates.map((candidate) => (
                    <div
                      key={candidate.candidate_id || candidate.candidate_name}
                      className="vs-card-muted"
                      style={{ padding: 12, display: "grid", gap: 8 }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <strong style={{ color: "var(--vs-text)" }}>{candidate.candidate_name || "Candidate"}</strong>
                        <Badge tone="info">{money(candidate.total_amount)}</Badge>
                      </div>
                      <div className="vs-chip-row">
                        <Badge tone="accent">{candidate.candidate_state || "State N/A"}</Badge>
                        <Badge tone="default">{candidate.candidate_office || "Office N/A"}</Badge>
                        <Badge tone="warning">{candidate.candidate_party || "Party N/A"}</Badge>
                        <Badge tone="info">{candidate.transaction_count || 0} transactions</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState text="No candidate relationships mapped for this committee." />
                )}
              </div>
            </SectionCard>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HeatmapPanel({ rows = [] }) {
  return (
    <SectionCard title="Committee State Heatmap" subtitle="State-level spend and committee relationship pressure.">
      <div className="vs-stack">
        {rows.length ? (
          rows.slice(0, 12).map((row) => (
            <div key={row.state} className="vs-card-muted" style={{ padding: 12, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <strong style={{ color: "var(--vs-text)" }}>{row.state || "Unknown"}</strong>
                <Badge tone="info">{money(row.total_amount)}</Badge>
              </div>
              <div className="vs-chip-row">
                <Badge tone="accent">{row.committee_count || 0} committees</Badge>
                <Badge tone="warning">{row.consultant_count || 0} consultant links</Badge>
                <Badge tone="default">{row.candidate_count || 0} candidate links</Badge>
              </div>
            </div>
          ))
        ) : (
          <EmptyState text="No state heatmap data available yet." />
        )}
      </div>
    </SectionCard>
  );
}

function ConcentrationPanel({ rows = [] }) {
  return (
    <SectionCard title="Consultant Concentration Risk" subtitle="Committees with the highest concentration of consultant/vendor relationships.">
      <div className="vs-stack">
        {rows.length ? (
          rows.slice(0, 8).map((row) => (
            <div
              key={row.committee_id || row.committee_name}
              className="vs-card-muted"
              style={{ padding: 12, display: "grid", gap: 8 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <strong style={{ color: "var(--vs-text)" }}>{getCommitteeName(row)}</strong>
                <Badge tone={toneForScore(row.concentration_score)}>Score {row.concentration_score}</Badge>
              </div>
              <div className="vs-chip-row">
                <Badge tone="info">{money(row.total_amount)}</Badge>
                <Badge tone="accent">{row.consultant_count || 0} consultants</Badge>
                <Badge tone="warning">{row.candidate_count || 0} candidates</Badge>
                <Badge tone="default">{row.party_count || 0} parties</Badge>
              </div>
            </div>
          ))
        ) : (
          <EmptyState text="No concentration risk records available." />
        )}
      </div>
    </SectionCard>
  );
}

export default function CommitteeIntel() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    summary: {},
    results: [],
    heatmap: [],
    concentration_risks: [],
    total: 0,
  });
  const [expandedKey, setExpandedKey] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    state: "",
    party: "",
    minAmount: "",
  });

  const demoMode =
    typeof window !== "undefined" && localStorage.getItem("vs_demo_mode") === "1";

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const result = await api
        .get("/committees/intel", {
          params: {
            limit: 500,
            search: filters.search || undefined,
            state: filters.state || undefined,
            party: filters.party || undefined,
            minAmount: filters.minAmount || undefined,
          },
        })
        .then((response) => response.data);

      setData(
        result || {
          summary: {},
          results: [],
          heatmap: [],
          concentration_risks: [],
          total: 0,
        }
      );
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load committee intelligence.");
      setData({
        summary: {},
        results: [],
        heatmap: [],
        concentration_risks: [],
        total: 0,
      });
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

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const committees = normalizeArray(data.results);
  const heatmap = normalizeArray(data.heatmap);
  const concentrationRisks = normalizeArray(data.concentration_risks);
  const summary = data.summary || {};

  const stateOptions = useMemo(() => {
    return [...new Set(committees.flatMap((row) => normalizeArray(row.states)))].sort();
  }, [committees]);

  const partyOptions = useMemo(() => {
    return [...new Set(committees.flatMap((row) => normalizeArray(row.parties)))].sort();
  }, [committees]);

  return (
    <PageShell
      eyebrow="PAC / Committee Intelligence"
      title="Committee spend and influence network."
      description="Track committee spend, consultant concentration, PAC/vendor relationships, candidate links, and battleground committee pressure."
      demo={demoMode}
      demoText="Demo committee intelligence mode is active."
      tickerItems={[
        {
          label: "Committees",
          value: summary.total_committees || data.total || 0,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Consultants",
          value: summary.total_consultants || 0,
          dotClass: "vs-live-dot-warning",
        },
        {
          label: "Mapped Spend",
          value: money(summary.total_amount),
          dotClass: "vs-live-dot",
        },
      ]}
    >
      {error ? (
        <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>
          {error}
        </div>
      ) : null}

      <div className="vs-grid-4">
        <StatCard label="Committees" value={summary.total_committees || data.total || 0} subtext="Visible committee records" />
        <StatCard label="Mapped Spend" value={money(summary.total_amount)} subtext="FEC-linked disbursements" />
        <StatCard label="Consultant Links" value={summary.total_consultants || 0} subtext="Vendor relationships" />
        <StatCard label="Candidate Links" value={summary.total_candidates || 0} subtext="Mapped candidate relationships" />
      </div>

      <SectionCard
        title="Committee Intelligence Controls"
        subtitle="Filter committee spend intelligence by state, party, committee, candidate, consultant, or minimum spend."
        right={
          <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="vs-button vs-button-secondary" onClick={loadData} disabled={loading}>
              {loading ? "Loading..." : "Apply / Reload"}
            </button>
            <button type="button" className="vs-button" onClick={runScore} disabled={scoring}>
              {scoring ? "Refreshing..." : "Refresh Scores"}
            </button>
          </div>
        }
      >
        <div className="vs-grid-4">
          <input
            className="vs-input"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                search: event.target.value,
              }))
            }
            placeholder="Search committee, consultant, or candidate..."
          />

          <select
            className="vs-input"
            value={filters.state}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                state: event.target.value,
              }))
            }
          >
            <option value="">All states</option>
            {stateOptions.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.party}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                party: event.target.value,
              }))
            }
          >
            <option value="">All parties</option>
            {partyOptions.map((party) => (
              <option key={party} value={party}>{party}</option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.minAmount}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                minAmount: event.target.value,
              }))
            }
          >
            <option value="">Any spend</option>
            <option value="10000">$10K+</option>
            <option value="50000">$50K+</option>
            <option value="100000">$100K+</option>
            <option value="500000">$500K+</option>
          </select>
        </div>

        <div className="vs-banner" style={{ marginTop: 12 }}>
          Committee intelligence now uses the full backend committee endpoint instead of the sampled consultant dashboard feed.
        </div>
      </SectionCard>

      {loading ? (
        <EmptyState text="Loading committee intelligence..." />
      ) : (
        <div className="vs-stack">
          <div className="vs-grid-2" style={{ alignItems: "start" }}>
            <HeatmapPanel rows={heatmap} />
            <ConcentrationPanel rows={concentrationRisks} />
          </div>

          <SectionCard
            title="Committee Directory"
            subtitle="Expandable committee cards showing consultant/vendor relationships and candidate spend links."
            right={<Badge tone="info">{committees.length} committees shown</Badge>}
          >
            <div className="vs-stack">
              {committees.length ? (
                committees.map((committee) => {
                  const key = getCommitteeKey(committee);

                  return (
                    <CommitteeCard
                      key={key}
                      committee={committee}
                      expanded={String(expandedKey) === String(key)}
                      onToggle={() =>
                        setExpandedKey((prev) => (String(prev) === String(key) ? "" : key))
                      }
                      onOpenGraph={() =>
                        navigate(`/relationship-graph?committee=${encodeURIComponent(getCommitteeName(committee))}`)
                      }
                    />
                  );
                })
              ) : (
                <EmptyState text="No committee intelligence records match the active filters." />
              )}
            </div>
          </SectionCard>
        </div>
      )}
    </PageShell>
  );
}

