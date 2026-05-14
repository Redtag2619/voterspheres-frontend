import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard"; 
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const US_TOPO_JSON = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_NAME_TO_ABBR = {
  Alabama: "AL", Alaska: "AK", Arizona: "AZ", Arkansas: "AR", California: "CA",
  Colorado: "CO", Connecticut: "CT", Delaware: "DE", Florida: "FL", Georgia: "GA",
  Hawaii: "HI", Idaho: "ID", Illinois: "IL", Indiana: "IN", Iowa: "IA",
  Kansas: "KS", Kentucky: "KY", Louisiana: "LA", Maine: "ME", Maryland: "MD",
  Massachusetts: "MA", Michigan: "MI", Minnesota: "MN", Mississippi: "MS",
  Missouri: "MO", Montana: "MT", Nebraska: "NE", Nevada: "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM",
  "New York": "NY", "North Carolina": "NC", "North Dakota": "ND",
  Ohio: "OH", Oklahoma: "OK", Oregon: "OR", Pennsylvania: "PA",
  "Rhode Island": "RI", "South Carolina": "SC", "South Dakota": "SD",
  Tennessee: "TN", Texas: "TX", Utah: "UT", Vermont: "VT", Virginia: "VA",
  Washington: "WA", "West Virginia": "WV", Wisconsin: "WI", Wyoming: "WY",
  "District of Columbia": "DC",
};

const STATE_CENTROIDS = {
  AZ: [-111.7, 34.3], GA: [-83.4, 32.7], PA: [-77.7, 40.9], MI: [-84.6, 44.3],
  WI: [-89.6, 44.6], NV: [-116.6, 39.3], NC: [-79.4, 35.5], OH: [-82.8, 40.4],
  FL: [-81.7, 27.8], TX: [-99.3, 31.5], CA: [-119.5, 37.2], NY: [-75.0, 43.0],
  VA: [-78.7, 37.5], CO: [-105.5, 39.0], MN: [-94.2, 46.3], LA: [-91.9, 31.2],
};

function formatDate(value) {
  if (!value) return "Not scored yet";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not scored yet" : date.toLocaleString();
}

function heatTone(level) {
  const value = String(level || "").toLowerCase();
  if (value === "urgent") return "danger";
  if (value === "high") return "demo";
  if (value === "medium") return "accent";
  return "default";
}

function getStateFill(item) {
  const level = String(item?.heat_level || "").toLowerCase();
  if (level === "urgent") return "#7f1d1d";
  if (level === "high") return "#92400e";
  if (level === "medium") return "#7c3aed";
  if (level === "low") return "#1e3a8a";
  return "#111827";
}

export default function CampaignOpportunityHeatmap() {
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState({
    summary: {},
    states: [],
    top_opportunities: [],
  });
  const [selectedState, setSelectedState] = useState("");

  async function loadHeatmap(refresh = false) {
    try {
      setLoading(true);
      setError("");

      const result = await api.campaignOpportunityHeatmap({
        refresh,
        state: selectedState || undefined,
        limit: 500,
      });

      setData({
        summary: result?.summary || {},
        states: result?.states || [],
        top_opportunities: result?.top_opportunities || [],
      });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load campaign opportunity heatmap."
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
        limit: 500,
        state: selectedState || null,
      });

      await loadHeatmap(false);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to score campaign opportunities."
      );
    } finally {
      setScoring(false);
    }
  }

  useEffect(() => {
    loadHeatmap(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedState]);

  const stateByAbbr = useMemo(() => {
    const map = {};
    for (const item of data.states || []) {
      map[String(item.state || "").toUpperCase()] = item;
    }
    return map;
  }, [data.states]);

  const metrics = [
    {
      label: "Scored States",
      value: data.summary?.states || 0,
      subtext: "States with opportunity scores",
    },
    {
      label: "Campaigns",
      value: data.summary?.total_campaigns || 0,
      subtext: "Scored campaign records",
    },
    {
      label: "Urgent",
      value: data.summary?.urgent_count || 0,
      subtext: "Highest opportunity band",
    },
    {
      label: "Avg Score",
      value: data.summary?.avg_score || 0,
      subtext: `Last scored ${formatDate(data.summary?.last_scored_at)}`,
    },
  ];

  return (
    <PageShell
      eyebrow="Consultant Intelligence"
      title="Campaign Opportunity Heatmap"
      description="Identify states and campaigns with the clearest consultant demand signals based on contact gaps, digital footprint, staffing gaps, and campaign infrastructure."
      tickerItems={[
        {
          label: "States",
          value: String(data.summary?.states || 0),
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Urgent",
          value: String(data.summary?.urgent_count || 0),
          dotClass: "vs-live-dot-warning",
        },
        {
          label: "Avg Score",
          value: String(data.summary?.avg_score || 0),
          dotClass: "vs-live-dot",
        },
      ]}
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        {metrics.map((metric) => (
          <StatCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            subtext={metric.subtext}
          />
        ))}
      </div>

      <SectionCard
        title="Heatmap Controls"
        subtitle="Score opportunities and narrow the map by state."
        right={
          <div className="vs-inline-actions">
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => loadHeatmap(true)}
              disabled={loading}
            >
              Refresh Heatmap
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
        <div className="vs-grid-2">
          <input
            className="vs-input"
            value={selectedState}
            onChange={(event) => setSelectedState(event.target.value.toUpperCase())}
            placeholder="Filter by state, e.g. AZ"
            maxLength={2}
          />

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => setSelectedState("")}
          >
            Clear State
          </button>
        </div>
      </SectionCard>

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(360px, 0.8fr)",
          alignItems: "start",
        }}
      >
        <SectionCard
          title="National Opportunity Heatmap"
          subtitle="Darker states indicate stronger campaign consulting opportunity signals."
          right={<Badge tone="info">{data.states?.length || 0} states</Badge>}
        >
          <div className="vs-card" style={{ padding: "12px", minHeight: "520px" }}>
            {loading ? (
              <EmptyState text="Loading opportunity heatmap..." />
            ) : !(data.states || []).length ? (
              <EmptyState text="No opportunity scores yet. Click Score Opportunities." />
            ) : (
              <ComposableMap
                projection="geoAlbersUsa"
                projectionConfig={{ scale: 1200 }}
                style={{ width: "100%", height: "auto" }}
              >
                <Geographies geography={US_TOPO_JSON}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const stateName = geo.properties?.name;
                      const abbr = STATE_NAME_TO_ABBR[stateName];
                      const item = abbr ? stateByAbbr[abbr] : null;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => {
                            if (abbr) setSelectedState(abbr);
                          }}
                          style={{
                            default: {
                              fill: item ? getStateFill(item) : "#111827",
                              stroke: "#374151",
                              strokeWidth: 0.75,
                              outline: "none",
                              cursor: item ? "pointer" : "default",
                            },
                            hover: {
                              fill: item ? getStateFill(item) : "#1f2937",
                              stroke: "#cbd5e1",
                              strokeWidth: 1.2,
                              outline: "none",
                              cursor: item ? "pointer" : "default",
                            },
                            pressed: {
                              fill: item ? getStateFill(item) : "#1f2937",
                              stroke: "#cbd5e1",
                              strokeWidth: 1.2,
                              outline: "none",
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>

                {(data.states || []).map((item) => {
                  const coords = STATE_CENTROIDS[item.state];
                  if (!coords) return null;

                  return (
                    <Marker key={item.state} coordinates={coords}>
                      <circle
                        r={8}
                        fill="#f8fafc"
                        stroke="#111827"
                        strokeWidth={2}
                        onClick={() => setSelectedState(item.state)}
                        style={{ cursor: "pointer" }}
                      />
                      <text
                        textAnchor="middle"
                        y={-12}
                        style={{
                          fontFamily: "inherit",
                          fill: "#e5e7eb",
                          fontSize: 10,
                          fontWeight: 800,
                          pointerEvents: "none",
                        }}
                      >
                        {item.state}
                      </text>
                    </Marker>
                  );
                })}
              </ComposableMap>
            )}
          </div>
        </SectionCard>

        <div className="vs-stack">
          <SectionCard
            title="State Opportunity Stack"
            subtitle="Ranked by average opportunity score."
          >
            <div className="vs-stack">
              {!(data.states || []).length ? (
                <EmptyState text="No state opportunity data available yet." />
              ) : (
                (data.states || []).slice(0, 12).map((item) => (
                  <button
                    key={item.state}
                    type="button"
                    className="vs-card-muted"
                    onClick={() => setSelectedState(item.state)}
                    style={{
                      textAlign: "left",
                      padding: "14px",
                      cursor: "pointer",
                      color: "var(--vs-text)",
                    }}
                  >
                    <div className="vs-inline-actions" style={{ justifyContent: "space-between" }}>
                      <strong>{item.state}</strong>
                      <Badge tone={heatTone(item.heat_level)}>{item.heat_level}</Badge>
                    </div>
                    <div style={{ marginTop: 8, color: "var(--vs-text-muted)", fontSize: 13 }}>
                      Avg score {item.avg_score} • {item.total_campaigns} campaigns • {item.urgent_count} urgent
                    </div>
                  </button>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard
            title="Top Campaign Opportunities"
            subtitle="Highest opportunity scores across the current filter."
          >
            <div className="vs-stack">
              {!(data.top_opportunities || []).length ? (
                <EmptyState text="No campaign opportunities available yet." />
              ) : (
                (data.top_opportunities || []).map((row) => (
                  <ResponsiveRow
                    key={row.candidate_id}
                    title={`${row.candidate_name} — ${row.state || "NA"} ${row.office || ""}`}
                    subtitle={row.recommended_pitch || "Opportunity signal detected."}
                    meta={[
                      { label: "Score", value: row.opportunity_score },
                      { label: "Band", value: row.opportunity_band },
                      { label: "Party", value: row.party || "N/A" },
                      { label: "Confidence", value: `${Math.round(Number(row.contact_confidence || 0) * 100)}%` },
                    ]}
                    right={
                      <Badge tone={heatTone(row.opportunity_band)}>
                        {row.opportunity_band}
                      </Badge>
                    }
                  />
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
