import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function money(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
  return `$${Math.round(amount).toLocaleString()}`;
}

function tone(score) {
  const value = Number(score || 0);
  if (value >= 75) return "danger";
  if (value >= 50) return "warning";
  if (value >= 25) return "info";
  return "default";
}

function riskTone(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("high") || text.includes("exposure")) return "danger";
  if (text.includes("watch") || text.includes("elevated")) return "warning";
  if (text.includes("strategic") || text.includes("asset")) return "active";
  return "default";
}

function safeText(value, fallback = "N/A") {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value);
}

function safeUrl(value) {
  if (!value) return "";
  const next = String(value).trim();
  if (!next) return "";
  if (next.startsWith("http://") || next.startsWith("https://")) return next;
  return `https://${next}`;
}

function joinText(values = []) {
  return values.filter(Boolean).map(String).join(" - ");
}

function BarRow({ label, value, amount, max }) {
  const width = max > 0 ? Math.max(4, Math.round((Number(amount || 0) / max) * 100)) : 0;

  return (
    <div className="vs-card-muted" style={{ padding: 12, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <strong style={{ color: "var(--vs-text)" }}>{label}</strong>
        <Badge tone="info">{value}</Badge>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "rgba(148, 163, 184, 0.18)", overflow: "hidden" }}>
        <div style={{ width: `${width}%`, height: "100%", borderRadius: 999, background: "var(--vs-accent, #6366f1)" }} />
      </div>
    </div>
  );
}

function ContactCard({ consultant }) {
  const website = safeUrl(consultant?.website);
  const email = consultant?.email || consultant?.contact_email || "";
  const phone = consultant?.phone || "";

  return (
    <SectionCard title="Consultant Contact" subtitle="Available contact details from the consultant record.">
      <div className="vs-grid-4">
        <div className="vs-card-muted" style={{ padding: 12, display: "grid", gap: 6 }}>
          <div className="vs-stat-label">Website</div>
          {website ? (
            <a href={website} target="_blank" rel="noreferrer" style={{ color: "var(--vs-text)", fontWeight: 800, textDecoration: "none", wordBreak: "break-word" }}>
              {website}
            </a>
          ) : (
            <strong style={{ color: "var(--vs-text)" }}>N/A</strong>
          )}
        </div>

        <div className="vs-card-muted" style={{ padding: 12, display: "grid", gap: 6 }}>
          <div className="vs-stat-label">Email</div>
          {email ? (
            <a href={`mailto:${email}`} style={{ color: "var(--vs-text)", fontWeight: 800, textDecoration: "none", wordBreak: "break-word" }}>
              {email}
            </a>
          ) : (
            <strong style={{ color: "var(--vs-text)" }}>N/A</strong>
          )}
        </div>

        <div className="vs-card-muted" style={{ padding: 12, display: "grid", gap: 6 }}>
          <div className="vs-stat-label">Phone</div>
          {phone ? (
            <a href={`tel:${phone}`} style={{ color: "var(--vs-text)", fontWeight: 800, textDecoration: "none" }}>
              {phone}
            </a>
          ) : (
            <strong style={{ color: "var(--vs-text)" }}>N/A</strong>
          )}
        </div>

        <div className="vs-card-muted" style={{ padding: 12, display: "grid", gap: 6 }}>
          <div className="vs-stat-label">Source</div>
          <strong style={{ color: "var(--vs-text)" }}>{consultant?.source || "FEC / internal"}</strong>
        </div>
      </div>

      {!website && !email && !phone ? (
        <div className="vs-banner" style={{ marginTop: 12 }}>
          FEC spending records usually identify payees and purposes, but they do not reliably include website, email, or phone. This record is ready for consultant contact enrichment.
        </div>
      ) : null}
    </SectionCard>
  );
}

function RelationshipRow({ row }) {
  return (
    <div className="vs-card-muted" style={{ padding: 14, display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <strong style={{ color: "var(--vs-text)" }}>
            {row.candidate_name || row.candidate_full_name || row.candidate_record_name || "Candidate"}
          </strong>
          <div style={{ color: "var(--vs-text-muted)", fontSize: 13, marginTop: 4 }}>
            {joinText([row.candidate_state || "State N/A", row.candidate_office || "Office N/A", row.candidate_party || "Party N/A"])}
          </div>
        </div>
        <Badge tone={tone(row.total_amount)}>{money(row.total_amount)}</Badge>
      </div>

      <div className="vs-chip-row">
        <Badge tone="info">{row.category || "Consulting"}</Badge>
        <Badge tone="accent">{row.transaction_count || 0} transactions</Badge>
        <Badge tone="warning">Confidence {row.confidence || 0}</Badge>
        {row.committee_name ? <Badge tone="default">{row.committee_name}</Badge> : null}
      </div>

      {row.purpose ? (
        <div style={{ color: "var(--vs-text-muted)", fontSize: 12, lineHeight: 1.45 }}>
          {row.purpose}
        </div>
      ) : null}
    </div>
  );
}

function RiskFlags({ flags = [] }) {
  return (
    <SectionCard title="Risk Flags" subtitle="Potential analyst-review signals generated from relationship patterns.">
      <div className="vs-stack">
        {flags.length ? flags.map((flag, index) => (
          <div key={`${flag.label}-${index}`} className="vs-card-muted" style={{ padding: 14, display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <strong style={{ color: "var(--vs-text)" }}>{flag.label}</strong>
              <Badge tone={riskTone(flag.level)}>{flag.level || "Signal"}</Badge>
            </div>
            <div style={{ color: "var(--vs-text-muted)", fontSize: 13 }}>{flag.detail}</div>
          </div>
        )) : <EmptyState text="No elevated consultant risk flags detected." />}
      </div>
    </SectionCard>
  );
}

function MixPanel({ title, subtitle, rows = [], labelKey, amountKey = "total_amount", countKey = "candidate_count" }) {
  const max = Math.max(...rows.map((row) => Number(row[amountKey] || 0)), 0);

  return (
    <SectionCard title={title} subtitle={subtitle}>
      <div className="vs-stack">
        {rows.length ? rows.slice(0, 8).map((row) => (
          <BarRow
            key={row[labelKey] || JSON.stringify(row)}
            label={row[labelKey] || "Unknown"}
            value={`${money(row[amountKey])} - ${row[countKey] || 0} candidates`}
            amount={row[amountKey]}
            max={max}
          />
        )) : <EmptyState text="No records available." />}
      </div>
    </SectionCard>
  );
}

function SharedNetworkPanel({ rows = [] }) {
  return (
    <SectionCard title="Shared Consultant Network" subtitle="Other consultants working on the same candidate relationships.">
      <div className="vs-stack">
        {rows.length ? rows.slice(0, 10).map((row) => (
          <div key={row.consultant_id} className="vs-card-muted" style={{ padding: 14, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <strong style={{ color: "var(--vs-text)" }}>{row.consultant_name}</strong>
              <Badge tone={tone(row.exposure_score)}>Exposure {row.exposure_score || 0}</Badge>
            </div>
            <div className="vs-chip-row">
              <Badge tone="info">{row.shared_candidate_count || 0} shared candidates</Badge>
              <Badge tone="accent">{money(row.shared_amount)}</Badge>
              <Badge tone="warning">Influence {row.influence_score || 0}</Badge>
            </div>
            <div style={{ color: "var(--vs-text-muted)", fontSize: 12 }}>
              {joinText([...(row.states || []), ...(row.parties || [])]) || "No shared state or party details available."}
            </div>
          </div>
        )) : <EmptyState text="No shared consultant network detected yet." />}
      </div>
    </SectionCard>
  );
}

function TimelinePanel({ snapshots = [] }) {
  return (
    <SectionCard title="Influence Timeline" subtitle="Recent consultant risk scoring snapshots.">
      <div className="vs-stack">
        {snapshots.length ? snapshots.slice(0, 10).map((row) => (
          <div key={row.id} className="vs-card-muted" style={{ padding: 14, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
              <strong style={{ color: "var(--vs-text)" }}>{String(row.created_at || "").slice(0, 10) || "Snapshot"}</strong>
              <Badge tone={riskTone(row.risk_label)}>{row.risk_label || "Signal"}</Badge>
            </div>
            <div className="vs-chip-row">
              <Badge tone="info">Influence {row.influence_score || 0}</Badge>
              <Badge tone="warning">Battleground {row.battleground_score || 0}</Badge>
              <Badge tone="accent">Overlap {row.overlap_score || 0}</Badge>
              <Badge tone="danger">Exposure {row.exposure_score || 0}</Badge>
            </div>
            {row.risk_summary ? <div style={{ color: "var(--vs-text-muted)", fontSize: 12 }}>{row.risk_summary}</div> : null}
          </div>
        )) : <EmptyState text="No influence snapshots available yet. Run consultant risk scoring to generate history." />}
      </div>
    </SectionCard>
  );
}

export default function ConsultantProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const result = await api
        .get(`/consultants/deep-intel/profile/${id}`)
        .then((response) => response.data);

      setProfile(result || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load consultant deep intelligence.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, [id]);

  const consultant = profile?.consultant || null;
  const relationships = profile?.relationships || [];
  const summary = profile?.summary || {};

  const topRelationships = useMemo(() => {
    return [...relationships]
      .sort((a, b) => Number(b.total_amount || 0) - Number(a.total_amount || 0))
      .slice(0, 50);
  }, [relationships]);

  return (
    <PageShell
      eyebrow="Consultant Deep Intelligence"
      title={consultant?.name || consultant?.firm_name || "Consultant intelligence profile"}
      description="Influence score, candidate relationships, PAC and committee footprint, service mix, state heatmap, shared networks, and AI risk narrative."
    >
      {error ? (
        <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>
          {error}
        </div>
      ) : null}

      {loading ? (
        <EmptyState text="Loading consultant deep intelligence..." />
      ) : !consultant ? (
        <EmptyState text="Consultant not found." />
      ) : (
        <div className="vs-stack">
          <SectionCard
            title={consultant.name || consultant.firm_name}
            subtitle={joinText([consultant.category || "Political Consulting", consultant.state || "National", consultant.source || "FEC / internal"])}
            right={
              <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="vs-button vs-button-secondary" onClick={() => navigate("/consultant-intel")}>Back to Consultant Intel</button>
                <Link className="vs-button" to={`/relationship-graph?consultant=${encodeURIComponent(consultant.name || consultant.firm_name || "")}`}>Open Graph</Link>
              </div>
            }
          >
            <div className="vs-grid-4">
              <StatCard label="Influence" value={consultant.influence_score || 0} subtext={consultant.risk_label || "Network score"} />
              <StatCard label="Battleground" value={consultant.battleground_score || 0} subtext="State pressure" />
              <StatCard label="Overlap" value={consultant.overlap_score || 0} subtext="Shared network" />
              <StatCard label="Exposure" value={consultant.exposure_score || 0} subtext="Opposition risk" />
            </div>

            <div className="vs-banner" style={{ marginTop: 14 }}>
              <strong>AI Risk Narrative:</strong> {profile.narrative || consultant.risk_summary || "No risk narrative generated yet."}
            </div>
          </SectionCard>

          <div className="vs-grid-4">
            <StatCard label="Candidates" value={summary.candidate_count || 0} subtext="Mapped candidate links" />
            <StatCard label="Committees" value={summary.committee_count || 0} subtext={summary.top_committee || "Committee footprint"} />
            <StatCard label="States" value={summary.state_count || 0} subtext={(summary.states || []).join(", ") || "N/A"} />
            <StatCard label="Total Spend" value={money(summary.total_amount || consultant.total_fec_disbursements)} subtext={`${summary.transaction_count || 0} transactions`} />
          </div>

          <ContactCard consultant={consultant} />

          <RiskFlags flags={profile.risk_flags || []} />

          <div className="vs-grid-2" style={{ alignItems: "start" }}>
            <MixPanel
              title="State Heatmap"
              subtitle="Where this consultant has the strongest mapped candidate footprint."
              rows={profile.state_heatmap || []}
              labelKey="state"
            />

            <MixPanel
              title="Service Mix"
              subtitle="Consultant service categories inferred from disbursement purpose and payee data."
              rows={profile.service_mix || []}
              labelKey="category"
            />
          </div>

          <div className="vs-grid-2" style={{ alignItems: "start" }}>
            <MixPanel
              title="Committee and PAC Footprint"
              subtitle="Committees linked to this consultant through FEC disbursements."
              rows={profile.committee_relationships || []}
              labelKey="committee_name"
            />

            <MixPanel
              title="Party Mix"
              subtitle="Party labels represented in mapped candidate relationships."
              rows={profile.party_mix || []}
              labelKey="party"
            />
          </div>

          <SharedNetworkPanel rows={profile.shared_network || []} />

          <TimelinePanel snapshots={profile.influence_timeline || []} />

          <SectionCard title="Candidate Relationship History" subtitle="FEC-derived consultant-to-candidate relationships and payment footprint.">
            <div className="vs-stack">
              {topRelationships.length ? topRelationships.map((row) => (
                <RelationshipRow key={row.id || `${row.candidate_id}-${row.committee_id}-${row.category}`} row={row} />
              )) : <EmptyState text="No relationships mapped for this consultant yet." />}
            </div>
          </SectionCard>
        </div>
      )}
    </PageShell>
  );
}
