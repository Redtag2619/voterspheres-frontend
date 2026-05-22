import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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

function toneForScore(score) {
  const value = Number(score || 0);
  if (value >= 75) return "danger";
  if (value >= 50) return "warning";
  if (value >= 25) return "info";
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

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getConsultantId(consultant) {
  return consultant?.id || consultant?.consultant_id || consultant?.source_id;
}

function getConsultantName(consultant) {
  return consultant?.name || consultant?.firm_name || consultant?.consultant_name || "Consultant";
}

function mergeConsultantLists(...lists) {
  const map = new Map();

  for (const list of lists) {
    for (const item of normalizeArray(list)) {
      const id = getConsultantId(item);
      const name = getConsultantName(item);
      const key = id ? `id:${id}` : `name:${String(name).toLowerCase()}`;

      const existing = map.get(key) || {};
      map.set(key, {
        ...existing,
        ...item,
        id: id || existing.id,
        name: name || existing.name,
      });
    }
  }

  return [...map.values()].sort((a, b) => {
    const aScore = Number(a.influence_score || a.battleground_score || 0);
    const bScore = Number(b.influence_score || b.battleground_score || 0);
    return bScore - aScore;
  });
}

function ContactField({ label, value, href }) {
  return (
    <div
      className="vs-card-muted"
      style={{
        padding: "10px 12px",
        display: "grid",
        gap: 4,
        minHeight: 74,
      }}
    >
      <div className="vs-stat-label">{label}</div>
      {href ? (
        <a
          href={href}
          target={href.startsWith("mailto:") || href.startsWith("tel:") ? undefined : "_blank"}
          rel="noreferrer"
          style={{
            color: "var(--vs-text)",
            fontWeight: 800,
            textDecoration: "none",
            wordBreak: "break-word",
          }}
        >
          {value || "N/A"}
        </a>
      ) : (
        <div
          style={{
            color: "var(--vs-text)",
            fontWeight: 800,
            wordBreak: "break-word",
          }}
        >
          {value || "N/A"}
        </div>
      )}
    </div>
  );
}

function CandidateRelationshipRow({ row }) {
  return (
    <div
      className="vs-card-muted"
      style={{
        padding: 12,
        display: "grid",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ color: "var(--vs-text)", fontWeight: 900 }}>
            {row.candidate_name || "Candidate"}
          </div>
          <div style={{ color: "var(--vs-text-muted)", fontSize: 12, marginTop: 4 }}>
            {joinText([
              row.candidate_state || "State N/A",
              row.candidate_office || "Office N/A",
              row.candidate_party || "Party N/A",
            ])}
          </div>
        </div>

        <Badge tone="info">{money(row.total_amount)}</Badge>
      </div>

      <div className="vs-chip-row">
        <Badge tone="accent">{row.category || "Consulting"}</Badge>
        <Badge tone="info">{row.transaction_count || 0} transactions</Badge>
        <Badge tone="warning">Confidence {row.confidence || 0}</Badge>
        {row.last_disbursement_date ? (
          <Badge tone="default">Last {String(row.last_disbursement_date).slice(0, 10)}</Badge>
        ) : null}
      </div>

      {row.purpose ? (
        <div style={{ color: "var(--vs-text-muted)", fontSize: 12, lineHeight: 1.45 }}>
          {row.purpose}
        </div>
      ) : null}
    </div>
  );
}

function ConsultantCard({
  consultant,
  expanded,
  loadingProfile,
  profile,
  onToggle,
  onOpenProfile,
  onOpenGraph,
}) {
  const name = getConsultantName(consultant);
  const mergedConsultant = {
    ...(consultant || {}),
    ...(profile?.consultant || {}),
  };

  const website = safeUrl(mergedConsultant.website);
  const email = mergedConsultant.email || mergedConsultant.contact_email || "";
  const phone = mergedConsultant.phone || "";
  const relationships = normalizeArray(profile?.relationships);
  const summary = profile?.summary || {};

  return (
    <div
      className="vs-card-muted"
      style={{
        padding: 14,
        display: "grid",
        gap: 12,
      }}
    >
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--vs-text)", fontWeight: 900, fontSize: 16 }}>
              {name}
            </div>
            <div style={{ color: "var(--vs-text-muted)", fontSize: 12, marginTop: 4 }}>
              {joinText([
                mergedConsultant.category || "Political Consulting",
                mergedConsultant.state || "National",
              ])}
            </div>
          </div>

          <div className="vs-chip-row">
            <Badge tone={toneForScore(mergedConsultant.influence_score)}>
              Influence {mergedConsultant.influence_score || 0}
            </Badge>
            <Badge tone={toneForScore(mergedConsultant.exposure_score)}>
              {mergedConsultant.risk_label || "Signal"}
            </Badge>
            <Badge tone="default">{expanded ? "Hide Candidates" : "Show Candidates"}</Badge>
          </div>
        </div>

        <div className="vs-chip-row">
          <Badge tone="info">{money(mergedConsultant.total_fec_disbursements || summary.total_amount)}</Badge>
          <Badge tone="accent">
            {mergedConsultant.clients_count || mergedConsultant.mapped_candidates || summary.relationship_count || 0} clients
          </Badge>
          <Badge tone="warning">Battleground {mergedConsultant.battleground_score || 0}</Badge>
          <Badge tone="info">Overlap {mergedConsultant.overlap_score || 0}</Badge>
        </div>

        {mergedConsultant.risk_summary ? (
          <div style={{ color: "var(--vs-text-muted)", fontSize: 12, lineHeight: 1.5 }}>
            {mergedConsultant.risk_summary}
          </div>
        ) : null}
      </button>

      {expanded ? (
        <div className="vs-stack">
          <SectionCard title="Consultant Contact" subtitle="Available contact information from the consultant record.">
            <div className="vs-grid-4">
              <ContactField label="Website" value={website || "N/A"} href={website || undefined} />
              <ContactField label="Email" value={email || "N/A"} href={email ? `mailto:${email}` : undefined} />
              <ContactField label="Phone" value={phone || "N/A"} href={phone ? `tel:${phone}` : undefined} />
              <ContactField label="Source" value={mergedConsultant.source || "FEC / internal"} />
              
            <div className="vs-grid-4" style={{ marginTop: 12 }}>
              <StatCard label="Contact Status" value={mergedConsultant.contact_status || "missing"} subtext="Enrichment state" />
              <StatCard label="Confidence" value={`${mergedConsultant.contact_confidence || 0}%`} subtext="Contact confidence" />
              <StatCard label="Verified" value={mergedConsultant.contact_verified_at ? "Yes" : "No"} subtext={mergedConsultant.contact_verified_at ? String(mergedConsultant.contact_verified_at).slice(0, 10) : "Not verified"} />
              <StatCard label="Last Enriched" value={mergedConsultant.contact_enriched_at ? String(mergedConsultant.contact_enriched_at).slice(0, 10) : "N/A"} subtext={mergedConsultant.contact_source || "No source"} />
            </div>


            {!website && !email && !phone ? (
              <div className="vs-banner" style={{ marginTop: 12 }}>
                Contact details are not always included in FEC disbursement data. This consultant is ready for the next enrichment pass to find website, phone, and email.
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Candidates This Consultant Is Working With"
            subtitle="Candidate relationships mapped from FEC disbursement records."
            right={
              <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="vs-button vs-button-secondary" onClick={onOpenGraph}>
                  Open Graph
                </button>
                <button type="button" className="vs-button" onClick={onOpenProfile}>
                  Open Profile
                </button>
                <button type="button" className="vs-button vs-button-secondary" onClick={onEnrichContact}>
                  Enrich Contact
                </button>
              </div>
            }
          >
            {loadingProfile ? (
              <EmptyState text="Loading candidate relationships..." />
            ) : relationships.length ? (
              <div className="vs-stack">
                <div className="vs-grid-4">
                  <StatCard
                    label="Relationships"
                    value={summary.relationship_count || relationships.length}
                    subtext="Mapped candidates"
                  />
                  <StatCard
                    label="Total Spend"
                    value={money(summary.total_amount)}
                    subtext="FEC disbursements"
                  />
                  <StatCard
                    label="States"
                    value={(summary.states || []).length}
                    subtext={(summary.states || []).join(", ") || "N/A"}
                  />
                  <StatCard
                    label="Cross Party"
                    value={summary.has_cross_party_overlap ? "Yes" : "No"}
                    subtext="Overlap signal"
                  />
                </div>

                {relationships.map((row) => (
                  <CandidateRelationshipRow key={row.id || `${row.candidate_id}-${row.committee_id}-${row.category}`} row={row} />
                ))}
              </div>
            ) : (
              <EmptyState text="No candidate relationships mapped for this consultant yet." />
            )}
          </SectionCard>
        </div>
      ) : null}
    </div>
  );
}

function OverlapPanel({ overlaps = [] }) {
  return (
    <SectionCard title="Consultant Overlap Detection" subtitle="Shared consultant networks and cross-party exposure signals.">
      <div className="vs-stack">
        {overlaps.length ? overlaps.map((item) => (
          <div key={item.consultant_id} className="vs-card-muted" style={{ padding: 14, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <strong style={{ color: "var(--vs-text)" }}>{item.consultant_name}</strong>
              <Badge tone={item.overlap_type === "cross_party_exposure" ? "danger" : "warning"}>{item.risk_label}</Badge>
            </div>
            <div className="vs-chip-row">
              <Badge tone="info">{item.candidate_count} candidates</Badge>
              <Badge tone="accent">{item.state_count} states</Badge>
              <Badge tone="warning">{item.party_count} parties</Badge>
              <Badge tone="info">{money(item.total_amount)}</Badge>
            </div>
          </div>
        )) : <EmptyState text="No overlap risks detected yet." />}
      </div>
    </SectionCard>
  );
}

function ExposurePanel({ exposure = [] }) {
  return (
    <SectionCard title="Opposition Exposure" subtitle="Consultant and candidate relationships outside selected party filters.">
      <div className="vs-stack">
        {exposure.length ? exposure.map((item, index) => (
          <div key={`${item.consultant_id}-${item.candidate_id}-${index}`} className="vs-card-muted" style={{ padding: 14, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <strong style={{ color: "var(--vs-text)" }}>{item.consultant_name}</strong>
              <Badge tone="danger">Exposure</Badge>
            </div>
            <div style={{ color: "var(--vs-text-muted)", fontSize: 13 }}>
              {joinText([item.candidate_name, item.candidate_party || "Party N/A", item.candidate_state || "State N/A"])}
            </div>
            <div className="vs-chip-row">
              <Badge tone="info">{money(item.total_amount)}</Badge>
              <Badge tone="accent">{item.transaction_count || 0} transactions</Badge>
              <Badge tone="warning">Confidence {item.confidence || 0}</Badge>
            </div>
          </div>
        )) : <EmptyState text="No opposition exposure records available." />}
      </div>
    </SectionCard>
  );
}

export default function ConsultantIntel() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [battlegrounds, setBattlegrounds] = useState([]);
  const [overlaps, setOverlaps] = useState([]);
  const [exposure, setExposure] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [profilesById, setProfilesById] = useState({});
  const [profileLoadingById, setProfileLoadingById] = useState({});

  const demoMode = typeof window !== "undefined" && localStorage.getItem("vs_demo_mode") === "1";

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [riskDash, ranks, bg, ov, exp] = await Promise.all([
        api.get("/consultants/risk/dashboard", { params: { limit: 50 } }).then((r) => r.data),
        api.get("/consultants/import/rankings", { params: { limit: 50 } }).then((r) => r.data),
        api.get("/consultants/import/battleground-rankings", { params: { limit: 50 } }).then((r) => r.data),
        api.get("/consultants/import/overlaps", { params: { limit: 25 } }).then((r) => r.data),
        api.get("/consultants/import/opposition-exposure", { params: { limit: 25 } }).then((r) => r.data),
      ]);

      setDashboard(riskDash || null);
      setRankings(ranks?.results || []);
      setBattlegrounds(bg?.results || []);
      setOverlaps(ov?.results || []);
      setExposure(exp?.results || []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load consultant intelligence.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile(consultant) {
    const id = getConsultantId(consultant);
    if (!id) return;
    if (profilesById[id]) return;

    try {
      setProfileLoadingById((prev) => ({ ...prev, [id]: true }));
      const result = await api.get(`/consultants/risk/profile/${id}`).then((r) => r.data);
      setProfilesById((prev) => ({ ...prev, [id]: result || null }));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load consultant profile.");
      setProfilesById((prev) => ({ ...prev, [id]: null }));
    } finally {
      setProfileLoadingById((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function toggleConsultant(consultant) {
    const id = getConsultantId(consultant);
    if (!id) return;

    if (String(expandedId) === String(id)) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);
    await loadProfile(consultant);
  }

  async function runScore() {
    try {
      setScoring(true);
      await api.post("/consultants/risk/score", {});
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to score consultant risk.");
    } finally {
      setScoring(false);
    }
  }

  async function enrichContactForConsultant(consultant) {
    const id = getConsultantId(consultant);
    if (!id) return;
    try {
      await api.post(`/consultants/contact-enrichment/${id}`, {});
      setProfilesById((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    await loadProfile(consultant);
  } catch (err) {
    setError(err?.response?.data?.error || err?.message || "Failed to enrich consultant contact.");
  }
}

  useEffect(() => {
    loadData();
  }, []);

  const summary = dashboard?.summary || {};

  const highRiskCount = useMemo(() => {
    return Number(summary.high_exposure || 0) + Number(summary.watch_closely || 0);
  }, [summary]);

  const consultants = useMemo(() => {
    return mergeConsultantLists(
      rankings,
      battlegrounds,
      dashboard?.top_influence,
      dashboard?.top_exposure
    );
  }, [rankings, battlegrounds, dashboard]);

  return (
    <PageShell
      eyebrow="Consultant Intelligence"
      title="National consultant power map."
      description="Track live FEC consultant relationships, candidate relationships, battleground rankings, overlap risks, and opposition exposure signals."
      demo={demoMode}
      demoText="Demo consultant intelligence mode is active."
    >
      {error ? (
        <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>
          {error}
        </div>
      ) : null}

      <div className="vs-grid-4">
        <StatCard label="FEC Consultants" value={summary.fec_consultants || 0} subtext="Imported from disbursements" />
        <StatCard label="Avg Influence" value={summary.avg_influence || 0} subtext="Network scoring" />
        <StatCard label="Avg Exposure" value={summary.avg_exposure || 0} subtext="Opposition risk" />
        <StatCard label="Risk Watch" value={highRiskCount} subtext="High or watch closely" />
      </div>

      <SectionCard
        title="Consultant Intelligence Controls"
        subtitle="Refresh scoring after imports or reload all consultant intelligence panels."
        right={
          <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="vs-button vs-button-secondary" onClick={loadData} disabled={loading}>
              {loading ? "Loading..." : "Reload"}
            </button>
            <button type="button" className="vs-button" onClick={runScore} disabled={scoring}>
              {scoring ? "Scoring..." : "Run AI Risk Score"}
            </button>
          </div>
        }
      >
        <div className="vs-banner">
          Consultant intelligence is powered by FEC Schedule B disbursements, consultant-candidate mappings, relationship density, battleground footprint, and overlap detection.
        </div>
      </SectionCard>

      {loading ? (
        <EmptyState text="Loading consultant intelligence..." />
      ) : (
        <div className="vs-stack">
          <SectionCard
            title="Consultant Network"
            subtitle="One card per consultant. Expand a consultant to see contact details and candidate relationships."
            right={<Badge tone="info">{consultants.length} consultants shown</Badge>}
          >
            <div className="vs-stack">
              {consultants.length ? (
                consultants.map((consultant) => {
                  const id = getConsultantId(consultant);
                  return (
                    <ConsultantCard
                      key={id || getConsultantName(consultant)}
                      consultant={consultant}
                      expanded={String(expandedId) === String(id)}
                      loadingProfile={Boolean(profileLoadingById[id])}
                      profile={profilesById[id]}
                      onToggle={() => toggleConsultant(consultant)}
                      onOpenProfile={() => navigate(`/consultants/${id}`)}
                      onOpenGraph={() => navigate(`/relationship-graph?consultant=${encodeURIComponent(getConsultantName(consultant))}`)}
                    />
                  );
                })
              ) : (
                <EmptyState text="No consultant records found." />
              )}
            </div>
          </SectionCard>

          <div className="vs-grid-2" style={{ alignItems: "start" }}>
            <OverlapPanel overlaps={overlaps} />
            <ExposurePanel exposure={exposure} />
          </div>
        </div>
      )}
    </PageShell>
  );
}
