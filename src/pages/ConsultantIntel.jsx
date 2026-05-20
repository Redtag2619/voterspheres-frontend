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

function ConsultantRow({ consultant, onOpen }) {
  return (
    <button
      type="button"
      className="vs-card-muted"
      onClick={() => onOpen(consultant)}
      style={{
        width: "100%",
        padding: 14,
        display: "grid",
        gap: 8,
        textAlign: "left",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "var(--vs-text)", fontWeight: 900 }}>{consultant.name || consultant.firm_name || "Consultant"}</div>
          <div style={{ color: "var(--vs-text-muted)", fontSize: 12, marginTop: 4 }}>
            {consultant.category || "Political Consulting"} • {consultant.state || "National"}
          </div>
        </div>
        <Badge tone={toneForScore(consultant.influence_score)}>{consultant.influence_score || 0}</Badge>
      </div>

      <div className="vs-chip-row">
        <Badge tone="info">{money(consultant.total_fec_disbursements)}</Badge>
        <Badge tone="accent">{consultant.clients_count || consultant.mapped_candidates || 0} clients</Badge>
        <Badge tone={toneForScore(consultant.exposure_score)}>{consultant.risk_label || "Signal"}</Badge>
      </div>

      {consultant.risk_summary ? (
        <div style={{ color: "var(--vs-text-muted)", fontSize: 12, lineHeight: 1.5 }}>
          {consultant.risk_summary}
        </div>
      ) : null}
    </button>
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

  const demoMode = typeof window !== "undefined" && localStorage.getItem("vs_demo_mode") === "1";

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [riskDash, ranks, bg, ov, exp] = await Promise.all([
        api.get("/consultants/risk/dashboard", { params: { limit: 20 } }).then((r) => r.data),
        api.get("/consultants/import/rankings", { params: { limit: 20 } }).then((r) => r.data),
        api.get("/consultants/import/battleground-rankings", { params: { limit: 20 } }).then((r) => r.data),
        api.get("/consultants/import/overlaps", { params: { limit: 20 } }).then((r) => r.data),
        api.get("/consultants/import/opposition-exposure", { params: { limit: 20 } }).then((r) => r.data),
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

  useEffect(() => {
    loadData();
  }, []);

  const summary = dashboard?.summary || {};

  const highRiskCount = useMemo(() => {
    return Number(summary.high_exposure || 0) + Number(summary.watch_closely || 0);
  }, [summary]);

  return (
    <PageShell
      eyebrow="Consultant Intelligence"
      title="National consultant power map."
      description="Track live FEC consultant relationships, battleground rankings, overlap risks, and opposition exposure signals."
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
        <div className="vs-grid-2" style={{ alignItems: "start" }}>
          <SectionCard title="Top National Consultants" subtitle="Highest influence consultants across the current cycle.">
            <div className="vs-stack">
              {rankings.length ? rankings.map((item) => (
                <ConsultantRow key={item.id} consultant={item} onOpen={(consultant) => navigate(`/consultants/${consultant.id}`)} />
              )) : <EmptyState text="No consultant rankings found." />}
            </div>
          </SectionCard>

          <SectionCard title="Battleground Rankings" subtitle="Consultants with meaningful battleground footprint.">
            <div className="vs-stack">
              {battlegrounds.length ? battlegrounds.map((item) => (
                <ConsultantRow key={item.id} consultant={item} onOpen={(consultant) => navigate(`/consultants/${consultant.id}`)} />
              )) : <EmptyState text="No battleground consultant rankings found yet." />}
            </div>
          </SectionCard>

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

          <SectionCard title="Opposition Exposure" subtitle="Consultant/candidate relationships outside selected party filters.">
            <div className="vs-stack">
              {exposure.length ? exposure.map((item, index) => (
                <div key={`${item.consultant_id}-${item.candidate_id}-${index}`} className="vs-card-muted" style={{ padding: 14, display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <strong style={{ color: "var(--vs-text)" }}>{item.consultant_name}</strong>
                    <Badge tone="danger">Exposure</Badge>
                  </div>
                  <div style={{ color: "var(--vs-text-muted)", fontSize: 13 }}>
                    {item.candidate_name} • {item.candidate_party || "Party N/A"} • {item.candidate_state || "State N/A"}
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
        </div>
      )}
    </PageShell>
  );
}
