import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function toneFromScore(score) {
  const value = number(score);
  if (value >= 85) return "danger";
  if (value >= 70) return "danger";
  if (value >= 50) return "warning";
  if (value >= 30) return "info";
  return "default";
}

function toneFromSeverity(value) {
  const next = String(value || "").toLowerCase();
  if (["critical", "high"].includes(next)) return "danger";
  if (["medium", "watch"].includes(next)) return "warning";
  if (["low", "stable"].includes(next)) return "active";
  return "default";
}

function joinText(values = []) {
  return values.filter(Boolean).map(String).join(" - ");
}

function ExposureRow({ item, onOpenProfile }) {
  return (
    <div className="vs-card-muted" style={{ padding: 14, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "var(--vs-text)", fontWeight: 900, fontSize: 16, lineHeight: 1.25 }}>
            {item.committee_name || item.committee_id || "Unknown Committee"}
          </div>
          <div style={{ color: "var(--vs-text-muted)", fontSize: 12, marginTop: 4 }}>
            {joinText([
              item.committee_id || "Committee ID N/A",
              normalizeArray(item.states).slice(0, 5).join(", ") || "National",
              normalizeArray(item.parties).slice(0, 4).join(", ") || "Party N/A",
            ])}
          </div>
        </div>

        <div className="vs-chip-row">
          <Badge tone={toneFromScore(item.exposure_score)}>Exposure {item.exposure_score || 0}</Badge>
          <Badge tone={toneFromSeverity(item.severity)}>{item.exposure_tier || "Signal"}</Badge>
          <Badge tone="info">{money(item.total_amount)}</Badge>
        </div>
      </div>

      <div className="vs-grid-4">
        <StatCard label="Consultants" value={item.consultant_count || 0} subtext="Vendor links" />
        <StatCard label="Candidates" value={item.candidate_count || 0} subtext="Candidate links" />
        <StatCard label="States" value={item.state_count || 0} subtext="State footprint" />
        <StatCard label="Battleground" value={money(item.battleground_amount)} subtext={`${item.battleground_candidate_count || 0} candidates`} />
      </div>

      <div className="vs-banner" style={{ margin: 0 }}>
        <strong>Readout:</strong> {item.narrative || "No narrative available."}
      </div>

      <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="vs-button vs-button-secondary" onClick={() => onOpenProfile(item)}>
          Open Exposure Profile
        </button>
        <Link
          className="vs-button vs-button-secondary"
          to={`/relationship-graph?committee=${encodeURIComponent(item.committee_name || item.committee_id || "")}`}
        >
          Open Graph
        </Link>
        <Link
          className="vs-button"
          to={`/committee-intel?committee=${encodeURIComponent(item.committee_name || item.committee_id || "")}`}
        >
          Committee Intel
        </Link>
      </div>
    </div>
  );
}

function ClusterPanel({ title, subtitle, rows = [], type = "cluster" }) {
  return (
    <SectionCard title={title} subtitle={subtitle}>
      <div className="vs-stack">
        {rows.length ? (
          rows.slice(0, 10).map((row, index) => (
            <div key={row.consultant_id || row.state || row.candidate_id || index} className="vs-card-muted" style={{ padding: 12, display: "grid", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <strong style={{ color: "var(--vs-text)" }}>
                  {row.consultant_name || row.candidate_name || row.state || "Exposure Signal"}
                </strong>
                <Badge tone={toneFromScore(row.cluster_score || row.exposure_score || row.pressure_score)}>
                  {row.cluster_score || row.exposure_score || row.pressure_score || 0}
                </Badge>
              </div>

              <div className="vs-chip-row">
                <Badge tone="info">{money(row.total_amount)}</Badge>
                {type !== "state" ? <Badge tone="accent">{row.committee_count || 0} committees</Badge> : null}
                <Badge tone="warning">{row.candidate_count || 0} candidates</Badge>
                <Badge tone="default">{row.state_count || row.consultant_count || 0} {type === "state" ? "consultants" : "states"}</Badge>
                {row.party_count ? <Badge tone="danger">{row.party_count} parties</Badge> : null}
              </div>
            </div>
          ))
        ) : (
          <EmptyState text="No exposure signals available for this panel." />
        )}
      </div>
    </SectionCard>
  );
}

function ProfileModal({ profile, onClose }) {
  if (!profile) return null;

  const relationships = normalizeArray(profile.relationships);
  const summary = profile.summary || {};

  return (
    <div className="vs-modal-backdrop">
      <div className="vs-modal-card" style={{ width: "min(980px, 100%)", maxHeight: "88vh", overflow: "auto" }}>
        <div className="vs-modal-head">
          <div>
            <div className="vs-modal-eyebrow">Dark Money Exposure Profile</div>
            <h3 className="vs-modal-title">{profile.committee_id}</h3>
            <p className="vs-modal-subtitle">Committee relationship detail, consultant links, and candidate exposure paths.</p>
          </div>
          <button type="button" className="vs-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="vs-grid-4">
          <StatCard label="Exposure" value={summary.exposure_score || 0} subtext={summary.exposure_tier || "Signal"} />
          <StatCard label="Spend" value={money(summary.total_amount)} subtext="Mapped flow" />
          <StatCard label="Consultants" value={summary.consultant_count || 0} subtext="Vendor links" />
          <StatCard label="Candidates" value={summary.candidate_count || 0} subtext="Candidate links" />
        </div>

        <div className="vs-stack" style={{ marginTop: 14 }}>
          {relationships.length ? (
            relationships.slice(0, 50).map((row) => (
              <div key={row.id || `${row.consultant_id}-${row.candidate_id}-${row.committee_id}`} className="vs-card-muted" style={{ padding: 12, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <strong style={{ color: "var(--vs-text)" }}>
                    {joinText([row.consultant_name || row.firm_name || "Consultant", row.candidate_name || "Candidate"])}
                  </strong>
                  <Badge tone="info">{money(row.total_amount)}</Badge>
                </div>
                <div className="vs-chip-row">
                  <Badge tone="accent">{row.category || row.consultant_category || "Consulting"}</Badge>
                  <Badge tone="warning">{row.candidate_state || "State N/A"}</Badge>
                  <Badge tone="default">{row.candidate_party || "Party N/A"}</Badge>
                  <Badge tone="info">{row.transaction_count || 0} transactions</Badge>
                </div>
              </div>
            ))
          ) : (
            <EmptyState text="No profile relationships available." />
          )}
        </div>
      </div>
    </div>
  );
}

export default function DarkMoneyExposure() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    summary: {},
    results: [],
    top_exposure: [],
    consultant_clusters: [],
    cross_party_exposure: [],
    state_chains: [],
    candidate_exposure: [],
    briefing: [],
  });
  const [profile, setProfile] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    state: "",
    party: "",
    minAmount: "",
  });

  const demoMode = typeof window !== "undefined" && localStorage.getItem("vs_demo_mode") === "1";

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const result = await api
        .get("/dark-money-exposure", {
          params: {
            limit: 100,
            search: filters.search || undefined,
            state: filters.state || undefined,
            party: filters.party || undefined,
            minAmount: filters.minAmount || undefined,
          },
        })
        .then((response) => response.data);

      setData(result || {});
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load dark money exposure intelligence.");
      setData({
        summary: {},
        results: [],
        top_exposure: [],
        consultant_clusters: [],
        cross_party_exposure: [],
        state_chains: [],
        candidate_exposure: [],
        briefing: [],
      });
    } finally {
      setLoading(false);
    }
  }

  async function openProfile(item) {
    const id = item.committee_id;
    if (!id) return;

    try {
      setProfileLoading(true);
      const result = await api
        .get(`/dark-money-exposure/profile/${encodeURIComponent(id)}`)
        .then((response) => response.data);
      setProfile(result);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load exposure profile.");
    } finally {
      setProfileLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summary = data.summary || {};
  const results = normalizeArray(data.results);
  const briefing = normalizeArray(data.briefing);

  const stateOptions = useMemo(() => {
    const values = new Set();
    for (const row of results) normalizeArray(row.states).forEach((state) => values.add(state));
    return [...values].filter(Boolean).sort();
  }, [results]);

  return (
    <PageShell
      eyebrow="Dark Money Exposure"
      title="Trace hidden political money and influence networks."
      description="Detect committee concentration, shared consultant clusters, cross-party exposure, multi-state influence chains, and candidate risk paths."
      demo={demoMode}
      demoText="Demo dark money exposure mode is active."
      tickerItems={[
        { label: "Committees", value: summary.total_committees || 0, dotClass: "vs-live-dot-success" },
        { label: "High Exposure", value: summary.high_exposure || 0, dotClass: "vs-live-dot-warning" },
        { label: "Mapped Flow", value: money(summary.total_amount), dotClass: "vs-live-dot" },
      ]}
    >
      {error ? (
        <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>
          {error}
        </div>
      ) : null}

      <div className="vs-grid-4">
        <StatCard label="Tracked Committees" value={summary.total_committees || 0} subtext="Exposure model coverage" />
        <StatCard label="Critical Exposure" value={summary.critical_exposure || 0} subtext="Immediate review" />
        <StatCard label="High Exposure" value={summary.high_exposure || 0} subtext="High-risk clusters" />
        <StatCard label="Mapped Flow" value={money(summary.total_amount)} subtext="Consultant-related spend" />
      </div>

      <SectionCard
        title="Exposure Controls"
        subtitle="Filter by state, party, committee, consultant, candidate, purpose, or minimum spend."
        right={
          <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="vs-button vs-button-secondary" onClick={() => navigate("/relationship-graph")}>Open Graph</button>
            <button type="button" className="vs-button" onClick={loadData} disabled={loading}>{loading ? "Loading..." : "Apply / Reload"}</button>
          </div>
        }
      >
        <div className="vs-grid-4">
          <input
            className="vs-input"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search committees, vendors, candidates..."
          />

          <select
            className="vs-input"
            value={filters.state}
            onChange={(event) => setFilters((prev) => ({ ...prev, state: event.target.value }))}
          >
            <option value="">All states</option>
            {stateOptions.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.party}
            onChange={(event) => setFilters((prev) => ({ ...prev, party: event.target.value }))}
          >
            <option value="">All parties</option>
            <option value="DEM">Democratic</option>
            <option value="REP">Republican</option>
            <option value="IND">Independent</option>
            <option value="Democratic">Democratic Text</option>
            <option value="Republican">Republican Text</option>
          </select>

          <select
            className="vs-input"
            value={filters.minAmount}
            onChange={(event) => setFilters((prev) => ({ ...prev, minAmount: event.target.value }))}
          >
            <option value="">Any spend</option>
            <option value="10000">$10K+</option>
            <option value="50000">$50K+</option>
            <option value="100000">$100K+</option>
            <option value="500000">$500K+</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard title="AI Exposure Briefing" subtitle="Generated from committee, consultant, candidate, state, party, and money-flow signals.">
        <div className="vs-stack">
          {briefing.length ? briefing.map((line) => <div key={line} className="vs-banner">{line}</div>) : <EmptyState text="No briefing available yet." />}
        </div>
      </SectionCard>

      {loading ? (
        <EmptyState text="Loading dark money exposure intelligence..." />
      ) : (
        <div className="vs-stack">
          <SectionCard
            title="Highest Exposure Committees"
            subtitle="Committees with concentrated consultant/vendor networks, broad candidate links, multi-state activity, or cross-party signals."
            right={<Badge tone={results.length ? "danger" : "default"}>{results.length} committees</Badge>}
          >
            <div className="vs-stack">
              {results.length ? (
                results.map((item) => (
                  <ExposureRow key={item.committee_id || item.committee_name} item={item} onOpenProfile={openProfile} />
                ))
              ) : (
                <EmptyState text="No dark money exposure records match the current filters." />
              )}
            </div>
          </SectionCard>

          <div className="vs-grid-2" style={{ alignItems: "start" }}>
            <ClusterPanel
              title="Shared Consultant / Vendor Clusters"
              subtitle="Consultants and vendors appearing across multiple committees, candidates, or states."
              rows={normalizeArray(data.consultant_clusters)}
            />
            <ClusterPanel
              title="Cross-Party Exposure"
              subtitle="Consultants or vendors appearing across multiple party environments."
              rows={normalizeArray(data.cross_party_exposure)}
            />
          </div>

          <div className="vs-grid-2" style={{ alignItems: "start" }}>
            <ClusterPanel
              title="State Influence Chains"
              subtitle="States with concentrated committee, consultant, and candidate pressure."
              rows={normalizeArray(data.state_chains)}
              type="state"
            />
            <ClusterPanel
              title="Candidate Exposure Paths"
              subtitle="Candidates receiving pressure from multiple committees, consultants, and spend categories."
              rows={normalizeArray(data.candidate_exposure)}
              type="candidate"
            />
          </div>
        </div>
      )}

      {profileLoading ? <div className="vs-banner">Loading exposure profile...</div> : null}
      <ProfileModal profile={profile} onClose={() => setProfile(null)} />
    </PageShell>
  );
}
