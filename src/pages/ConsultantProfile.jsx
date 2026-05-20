import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
      const result = await api.get(`/consultants/risk/profile/${id}`).then((r) => r.data);
      setProfile(result || null);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load consultant profile.");
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
    return [...relationships].sort((a, b) => Number(b.total_amount || 0) - Number(a.total_amount || 0)).slice(0, 25);
  }, [relationships]);

  return (
    <PageShell
      eyebrow="Consultant Profile"
      title={consultant?.name || "Consultant intelligence profile"}
      description="Influence score, battleground footprint, candidate relationships, overlap risk, and FEC disbursement history."
    >
      {error ? <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>{error}</div> : null}

      {loading ? (
        <EmptyState text="Loading consultant profile..." />
      ) : !consultant ? (
        <EmptyState text="Consultant not found." />
      ) : (
        <div className="vs-stack">
          <SectionCard
            title={consultant.name || consultant.firm_name}
            subtitle={`${consultant.category || "Political Consulting"} • ${consultant.state || "National"}`}
            right={<button type="button" className="vs-button vs-button-secondary" onClick={() => navigate("/consultant-intel")}>Back to Consultant Intel</button>}
          >
            <div className="vs-grid-4">
              <StatCard label="Influence" value={consultant.influence_score || 0} subtext={consultant.risk_label || "Network score"} />
              <StatCard label="Battleground" value={consultant.battleground_score || 0} subtext="State pressure" />
              <StatCard label="Overlap" value={consultant.overlap_score || 0} subtext="Shared network" />
              <StatCard label="Exposure" value={consultant.exposure_score || 0} subtext="Opposition risk" />
            </div>

            <div className="vs-banner" style={{ marginTop: 14 }}>
              <strong>AI Risk Summary:</strong> {consultant.risk_summary || "No risk summary generated yet."}
            </div>
          </SectionCard>

          <div className="vs-grid-4">
            <StatCard label="Relationships" value={summary.relationship_count || 0} subtext="Mapped candidate links" />
            <StatCard label="Total Amount" value={money(summary.total_amount || consultant.total_fec_disbursements)} subtext="FEC disbursement footprint" />
            <StatCard label="States" value={(summary.states || []).length} subtext={(summary.states || []).join(", ") || "N/A"} />
            <StatCard label="Cross Party" value={summary.has_cross_party_overlap ? "Yes" : "No"} subtext="Overlap detection" />
          </div>

          <SectionCard title="Candidate Relationship History" subtitle="FEC-derived consultant-to-candidate relationships.">
            <div className="vs-stack">
              {topRelationships.length ? topRelationships.map((row) => (
                <div key={row.id} className="vs-card-muted" style={{ padding: 14, display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <strong style={{ color: "var(--vs-text)" }}>{row.candidate_name}</strong>
                    <Badge tone={tone(row.total_amount)}>{money(row.total_amount)}</Badge>
                  </div>
                  <div style={{ color: "var(--vs-text-muted)", fontSize: 13 }}>
                    {row.candidate_state || "State N/A"} • {row.candidate_office || "Office N/A"} • {row.candidate_party || "Party N/A"}
                  </div>
                  <div className="vs-chip-row">
                    <Badge tone="info">{row.category || "Consulting"}</Badge>
                    <Badge tone="accent">{row.transaction_count || 0} transactions</Badge>
                    <Badge tone="warning">Confidence {row.confidence || 0}</Badge>
                  </div>
                </div>
              )) : <EmptyState text="No relationships mapped for this consultant yet." />}
            </div>
          </SectionCard>
        </div>
      )}
    </PageShell>
  );
}
