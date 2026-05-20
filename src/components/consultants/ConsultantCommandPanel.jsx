import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import SectionCard from "../ui/SectionCard";
import StatCard from "../ui/StatCard";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";

function money(value) {
  const amount = Number(value || 0);
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
  return `$${Math.round(amount).toLocaleString()}`;
}

export default function ConsultantCommandPanel({ candidateId, compact = false }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [relationships, setRelationships] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!candidateId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const result = await api.get(`/consultants/import/candidate/${candidateId}`).then((r) => r.data);
        if (!active) return;
        setRelationships(result?.results || []);
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load consultant relationships.");
        setRelationships([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [candidateId]);

  const totalAmount = relationships.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const top = relationships.slice(0, compact ? 3 : 8);

  return (
    <SectionCard
      title="Consultant Intelligence"
      subtitle="FEC-derived consultant relationships, spend footprint, and strategic exposure signals."
      right={<button type="button" className="vs-button vs-button-secondary" onClick={() => navigate("/consultant-intel")}>Open Consultant Intel</button>}
    >
      {error ? <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>{error}</div> : null}
      {loading ? (
        <EmptyState text="Loading consultant relationships..." />
      ) : relationships.length ? (
        <div className="vs-stack">
          <div className="vs-grid-3">
            <StatCard label="Consultants" value={relationships.length} subtext="Mapped relationships" />
            <StatCard label="Spend Footprint" value={money(totalAmount)} subtext="FEC disbursement total" />
            <StatCard label="Top Score" value={relationships[0]?.influence_score || 0} subtext="Consultant influence" />
          </div>

          {top.map((row) => (
            <div key={row.id} className="vs-card-muted" style={{ padding: 12, display: "grid", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <strong style={{ color: "var(--vs-text)" }}>{row.consultant_name}</strong>
                <Badge tone="info">{money(row.total_amount)}</Badge>
              </div>
              <div style={{ color: "var(--vs-text-muted)", fontSize: 12 }}>
                {row.consultant_category || row.category || "Political Consulting"} • {row.transaction_count || 0} transactions
              </div>
              <div className="vs-chip-row">
                <Badge tone="accent">Influence {row.influence_score || 0}</Badge>
                <Badge tone="warning">Exposure {row.exposure_score || 0}</Badge>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="No consultant relationships mapped for this candidate yet." />
      )}
    </SectionCard>
  );
}
