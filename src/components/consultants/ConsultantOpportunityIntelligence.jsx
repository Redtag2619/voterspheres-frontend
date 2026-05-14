import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import PageShell from "../ui/PageShell";
import SectionCard from "../ui/SectionCard";
import StatCard from "../ui/StatCard";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import ResponsiveRow from "../ui/ResponsiveRow";

function bandTone(band) {
  const value = String(band || "").toLowerCase();
  if (value === "urgent") return "danger";
  if (value === "high") return "demo";
  if (value === "medium") return "default";
  return "active";
}

function formatDate(value) {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString();
}

export default function ConsultantOpportunityIntelligence() {
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");
  const [band, setBand] = useState("all");
  const [state, setState] = useState("");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({});

  async function loadData(refresh = false) {
    try {
      setLoading(true);
      setError("");

      const data = await api.consultantOpportunities({
        band,
        state,
        q,
        limit: 100,
        refresh,
      });

      setRows(data?.results || []);
      setSummary(data?.summary || {});
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load consultant opportunities."
      );
    } finally {
      setLoading(false);
    }
  }

  async function scoreNow() {
    try {
      setScoring(true);
      setError("");

      await api.scoreConsultantOpportunities({
        limit: 250,
        state: state || null,
      });

      await loadData(false);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to score consultant opportunities."
      );
    } finally {
      setScoring(false);
    }
  }

  useEffect(() => {
    loadData(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [band, state]);

  const metrics = useMemo(
    () => [
      {
        label: "Total Opportunities",
        value: summary.total || 0,
        subtext: "Scored candidate campaigns",
        tone: "neutral",
      },
      {
        label: "Urgent",
        value: summary.urgent_count || 0,
        subtext: "Highest consultant need",
        tone: summary.urgent_count ? "down" : "neutral",
      },
      {
        label: "High",
        value: summary.high_count || 0,
        subtext: "Strong pitch targets",
        tone: summary.high_count ? "neutral" : "neutral",
      },
      {
        label: "Avg Score",
        value: summary.avg_score || 0,
        subtext: `Last scored ${formatDate(summary.last_scored_at)}`,
        tone: "up",
      },
    ],
    [summary]
  );

  const filteredRows = useMemo(() => {
    if (!q) return rows;

    const needle = q.toLowerCase();

    return rows.filter((row) =>
      [
        row.candidate_name,
        row.state,
        row.office,
        row.party,
        row.recommended_pitch,
        ...(row.reasons || []),
        ...(row.recommended_services || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [rows, q]);

  return (
    <PageShell
      eyebrow="Consultant Intelligence"
      title="Consultant Opportunity Intelligence"
      description="Find campaigns with weak contact infrastructure, poor digital footprint, missing staff signals, and strong consultant/vendor pitch opportunities."
    >
      {error ? (
        <div className="vs-banner vs-banner-danger">{error}</div>
      ) : null}

      <div className="vs-grid-4">
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            subtext={metric.subtext}
            tone={metric.tone}
          />
        ))}
      </div>

      <SectionCard
        title="Opportunity Controls"
        subtitle="Score, filter, and prioritize campaigns most likely to need consulting services."
        right={
          <div className="vs-inline-actions">
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => loadData(true)}
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              className="vs-button"
              onClick={scoreNow}
              disabled={scoring}
            >
              {scoring ? "Scoring..." : "Score Opportunities"}
            </button>
          </div>
        }
      >
        <div className="vs-grid-3">
          <label className="vs-field">
            <span>Band</span>
            <select value={band} onChange={(event) => setBand(event.target.value)}>
              <option value="all">All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>

          <label className="vs-field">
            <span>State</span>
            <input
              value={state}
              onChange={(event) => setState(event.target.value.toUpperCase())}
              placeholder="PA"
              maxLength={2}
            />
          </label>

          <label className="vs-field">
            <span>Search</span>
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Candidate, office, reason, service..."
            />
          </label>
        </div>
      </SectionCard>

      <SectionCard
        title="Pitch Targets"
        subtitle="Campaigns with the clearest consultant opportunity signals."
        right={<Badge tone="accent">{filteredRows.length} targets</Badge>}
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading consultant opportunities..." />
          ) : !filteredRows.length ? (
            <EmptyState text="No consultant opportunities found. Click Score Opportunities to create the first scoring batch." />
          ) : (
            filteredRows.map((row) => (
              <ResponsiveRow
                key={row.candidate_id}
                title={`${row.candidate_name} â€” ${row.state || "NA"} ${row.office || ""}`}
                subtitle={row.recommended_pitch || "Consultant opportunity identified."}
                meta={[
                  { label: "Score", value: row.opportunity_score },
                  { label: "Band", value: row.opportunity_band },
                  { label: "Party", value: row.party || "N/A" },
                  { label: "Confidence", value: `${Math.round(Number(row.contact_confidence || 0) * 100)}%` },
                  { label: "Last scraped", value: formatDate(row.last_scraped_at) },
                ]}
                right={
                  <div className="vs-inline-actions">
                    <Badge tone={bandTone(row.opportunity_band)}>
                      {row.opportunity_band}
                    </Badge>
                    {row.website ? (
                      <a
                        className="vs-button vs-button-secondary"
                        href={row.website}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Website
                      </a>
                    ) : null}
                  </div>
                }
              >
                <div className="vs-stack" style={{ marginTop: "0.75rem" }}>
                  <div>
                    {(row.reasons || []).slice(0, 5).map((reason) => (
                      <Badge key={reason} tone="default">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                  <div>
                    {(row.recommended_services || []).slice(0, 6).map((service) => (
                      <Badge key={service} tone="active">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              </ResponsiveRow>
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}

