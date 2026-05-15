import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const US_TOPO_JSON = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const STATE_NAME_TO_ABBR = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
  "District of Columbia": "DC",
};

const STATE_CENTROIDS = {
  AL: [-86.8, 32.8],
  AK: [-152.4, 64.2],
  AZ: [-111.7, 34.3],
  AR: [-92.4, 34.9],
  CA: [-119.5, 37.2],
  CO: [-105.5, 39.0],
  CT: [-72.7, 41.6],
  DE: [-75.5, 39.0],
  FL: [-81.7, 27.8],
  GA: [-83.4, 32.7],
  HI: [-157.5, 20.9],
  ID: [-114.1, 44.2],
  IL: [-89.2, 40.0],
  IN: [-86.1, 40.0],
  IA: [-93.5, 42.1],
  KS: [-98.3, 38.5],
  KY: [-84.8, 37.8],
  LA: [-91.9, 31.2],
  ME: [-69.0, 45.3],
  MD: [-76.7, 39.0],
  MA: [-71.8, 42.3],
  MI: [-84.6, 44.3],
  MN: [-94.2, 46.3],
  MS: [-89.7, 32.7],
  MO: [-92.6, 38.5],
  MT: [-110.0, 46.9],
  NE: [-99.8, 41.5],
  NV: [-116.6, 39.3],
  NH: [-71.6, 43.7],
  NJ: [-74.7, 40.1],
  NM: [-106.1, 34.4],
  NY: [-75.0, 43.0],
  NC: [-79.4, 35.5],
  ND: [-100.5, 47.5],
  OH: [-82.8, 40.4],
  OK: [-97.5, 35.6],
  OR: [-120.5, 44.0],
  PA: [-77.7, 40.9],
  RI: [-71.5, 41.7],
  SC: [-80.9, 33.8],
  SD: [-100.2, 44.4],
  TN: [-86.4, 35.8],
  TX: [-99.3, 31.5],
  UT: [-111.7, 39.3],
  VT: [-72.7, 44.1],
  VA: [-78.7, 37.5],
  WA: [-120.7, 47.4],
  WV: [-80.6, 38.6],
  WI: [-89.6, 44.6],
  WY: [-107.6, 43.0],
  DC: [-77.0, 38.9],
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
  if (value === "low") return "info";
  if (value === "active") return "active";
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

function stateNameFromAbbr(abbr) {
  const code = String(abbr || "").toUpperCase();
  const found = Object.entries(STATE_NAME_TO_ABBR).find(([, value]) => value === code);
  return found?.[0] || code;
}

function priorityFromBand(band) {
  const value = String(band || "").toLowerCase();
  if (value === "urgent" || value === "high") return "high";
  if (value === "medium") return "medium";
  return "low";
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildBriefing(stateItem, opportunities = []) {
  const state = stateItem?.state || "NA";
  const top = opportunities[0] || {};
  const urgent = Number(stateItem?.urgent_count || 0);
  const high = Number(stateItem?.high_count || 0);
  const avg = Number(stateItem?.avg_score || 0);

  const posture =
    urgent > 0
      ? "Immediate action recommended"
      : high > 0
        ? "High-value opportunity state"
        : avg >= 40
          ? "Monitor and develop pipeline"
          : "Low-current signal";

  const summary =
    urgent > 0
      ? `${state} is showing urgent consultant demand. Prioritize campaign outreach, contact verification, and consultant matching.`
      : high > 0
        ? `${state} has multiple high-probability consultant targets. Build a ranked pipeline and assign outreach.`
        : avg >= 40
          ? `${state} has developing campaign opportunity signals. Monitor gaps and prepare consultant recommendations.`
          : `${state} is currently lower intensity, but should remain in the national monitoring layer.`;

  return {
    posture,
    summary,
    weakness: [
      "Campaign contact coverage gaps",
      "Digital footprint and website weakness",
      "Missing staff or press infrastructure",
      "Potential consultant/vendor matching need",
    ],
    recommendedActions: [
      {
        title: `Create ${state} consultant opportunity task force`,
        owner: "Consultant Intelligence",
        priority: urgent || high ? "high" : "medium",
        detail: `Build a ranked opportunity list for ${state} and assign outreach ownership.`,
      },
      {
        title: `Generate campaign outreach plan${top?.candidate_name ? ` for ${top.candidate_name}` : ""}`,
        owner: "Growth / BD",
        priority: priorityFromBand(top?.opportunity_band),
        detail: top?.recommended_pitch || `Draft consultant outreach messaging for top ${state} campaign opportunities.`,
      },
      {
        title: `Run ${state} campaign weakness audit`,
        owner: "Campaign Intelligence",
        priority: avg >= 60 ? "high" : "medium",
        detail: "Review contact gaps, website quality, staffing gaps, fundraising needs, and vendor opportunities.",
      },
    ],
  };
}

function CampaignOpportunityCard({ row, onCreateTask }) {
  const reasons = asArray(row.reasons);
  const services = asArray(row.recommended_services);

  return (
    <div className="vs-card-muted" style={{ padding: 16 }}>
      <ResponsiveRow
        title={`${row.candidate_name || "Candidate"} — ${row.office || "Office"}`}
        subtitle={row.recommended_pitch || "Opportunity signal detected."}
        meta={[
          { label: "Score", value: row.opportunity_score || 0 },
          { label: "Band", value: row.opportunity_band || "N/A" },
          { label: "Party", value: row.party || "N/A" },
          {
            label: "Confidence",
            value: `${Math.round(Number(row.contact_confidence || 0) * 100)}%`,
          },
        ]}
        right={
          <div className="vs-inline-actions">
            <Badge tone={heatTone(row.opportunity_band)}>
              {row.opportunity_band || "opportunity"}
            </Badge>
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() =>
                onCreateTask({
                  title: `Review consultant opportunity: ${row.candidate_name}`,
                  owner: "Consultant Intelligence",
                  priority: priorityFromBand(row.opportunity_band),
                  detail:
                    row.recommended_pitch ||
                    "Review campaign opportunity and assign outreach.",
                  candidate_id: row.candidate_id,
                  candidate_name: row.candidate_name,
                })
              }
            >
              Task
            </button>
          </div>
        }
      />

      <div className="vs-grid-2" style={{ marginTop: 14 }}>
        <div>
          <div className="vs-stat-label">Opportunity Reasons</div>
          <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
            {reasons.length ? (
              reasons.slice(0, 5).map((reason) => (
                <div key={reason} style={{ color: "var(--vs-text-muted)", fontSize: 13 }}>
                  • {reason}
                </div>
              ))
            ) : (
              <div style={{ color: "var(--vs-text-muted)", fontSize: 13 }}>
                No reason details returned yet.
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Recommended Services</div>
          <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {services.length ? (
              services.slice(0, 6).map((service) => (
                <Badge key={service} tone="info">
                  {service}
                </Badge>
              ))
            ) : (
              <Badge tone="default">No services returned</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="vs-grid-4" style={{ marginTop: 14 }}>
        <StatCard label="Website" value={row.website ? "Yes" : "No"} subtext={row.website || "Missing"} />
        <StatCard label="Email" value={row.email ? "Yes" : "No"} subtext={row.email || "Missing"} />
        <StatCard label="Phone" value={row.phone ? "Yes" : "No"} subtext={row.phone || "Missing"} />
        <StatCard label="Last Scrape" value={formatDate(row.last_scraped_at)} subtext="Contact enrichment" />
      </div>
    </div>
  );
}

function DrilldownPanel({
  selectedState,
  selectedStateItem,
  opportunities,
  onClose,
  onCreateTask,
  onGoCommand,
  taskMessage,
}) {
  const stateCode = selectedStateItem?.state || selectedState;
  const stateName = stateNameFromAbbr(stateCode);

  const stateOpps = opportunities.filter(
    (item) => String(item.state || "").toUpperCase() === String(stateCode || "").toUpperCase()
  );

  const visibleOpps = stateOpps.length ? stateOpps : opportunities.slice(0, 8);
  const briefing = buildBriefing(selectedStateItem, visibleOpps);

  if (!stateCode) return null;

  return (
    <SectionCard
      title={`${stateCode} AI Briefing + Command Integration`}
      subtitle={`${stateName} opportunity intelligence, campaign weaknesses, contact gaps, and execution-ready actions.`}
      right={
        <div className="vs-inline-actions">
          <Badge tone={heatTone(selectedStateItem?.heat_level)}>
            {selectedStateItem?.heat_level || "selected"}
          </Badge>
          <button type="button" className="vs-button vs-button-secondary" onClick={onGoCommand}>
            Open Command Center
          </button>
          <button type="button" className="vs-button vs-button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      {taskMessage ? <div className="vs-banner">{taskMessage}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Campaigns" value={selectedStateItem?.total_campaigns || 0} subtext="Scored campaigns" />
        <StatCard label="Urgent" value={selectedStateItem?.urgent_count || 0} subtext="Immediate action" />
        <StatCard label="High" value={selectedStateItem?.high_count || 0} subtext="Strong targets" />
        <StatCard label="Avg Score" value={selectedStateItem?.avg_score || 0} subtext={briefing.posture} />
      </div>

      <div className="vs-grid-2" style={{ marginTop: 16 }}>
        <div className="vs-stack">
          <div className="vs-card-muted" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, color: "var(--vs-text)" }}>
              AI Strategic Briefing
            </div>
            <div style={{ marginTop: 8, color: "var(--vs-text-muted)", lineHeight: 1.55 }}>
              {briefing.summary}
            </div>
            <div style={{ marginTop: 12 }}>
              <Badge tone={heatTone(selectedStateItem?.heat_level)}>
                {briefing.posture}
              </Badge>
            </div>
          </div>

          <div className="vs-card-muted" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, color: "var(--vs-text)" }}>
              Likely Campaign Weaknesses
            </div>
            <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
              {briefing.weakness.map((item) => (
                <div key={item} style={{ color: "var(--vs-text-muted)", fontSize: 13 }}>
                  • {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="vs-stack">
          {briefing.recommendedActions.map((action) => (
            <div key={action.title} className="vs-card-muted" style={{ padding: 16 }}>
              <ResponsiveRow
                title={action.title}
                subtitle={action.detail}
                meta={[
                  { label: "Owner", value: action.owner },
                  { label: "Priority", value: action.priority },
                  { label: "State", value: stateCode },
                  { label: "Destination", value: "Command Center" },
                ]}
                right={
                  <button type="button" className="vs-button" onClick={() => onCreateTask(action)}>
                    Create Command Task
                  </button>
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <SectionCard
          title={`${stateCode} Campaign Intelligence`}
          subtitle="Expanded opportunity details, recommended services, contact availability, and enrichment signals."
          right={<Badge tone="info">{visibleOpps.length} shown</Badge>}
        >
          <div className="vs-stack">
            {!visibleOpps.length ? (
              <EmptyState text="No campaign opportunities available for this state yet." />
            ) : (
              visibleOpps.map((row) => (
                <CampaignOpportunityCard
                  key={row.candidate_id || row.id}
                  row={row}
                  onCreateTask={onCreateTask}
                />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </SectionCard>
  );
}

export default function CampaignOpportunityHeatmap() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState("");
  const [taskMessage, setTaskMessage] = useState("");
  const [data, setData] = useState({
    summary: {},
    states: [],
    top_opportunities: [],
  });
  const [selectedState, setSelectedState] = useState("");
  const [drilldownOpen, setDrilldownOpen] = useState(false);

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

  async function createCommandTask(action) {
    try {
      setTaskMessage("");

      const payload = {
        title: action.title,
        description: action.detail,
        source: "campaign_opportunity_heatmap",
        state: selectedState || action.state || "National",
        office: "Statewide",
        priority: action.priority || "medium",
        status: "open",
        assigned_to: action.owner || "Consultant Intelligence",
        due_label: action.priority === "high" ? "Now" : "Today",
        metadata: {
          source_page: "campaign_opportunity_heatmap",
          command_center_ready: true,
          candidate_id: action.candidate_id || null,
          candidate_name: action.candidate_name || null,
          action,
        },
      };

      const response = await api.createTask?.(payload);

      setTaskMessage(
        response?.duplicate
          ? "Command task already exists for this opportunity."
          : "Command task created. Open Command Center to manage execution."
      );
    } catch (err) {
      setTaskMessage(
        err?.response?.data?.error ||
          err?.message ||
          "Task could not be created, but the briefing remains available."
      );
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

  const selectedStateItem = useMemo(() => {
    if (!selectedState) return null;
    return stateByAbbr[String(selectedState).toUpperCase()] || null;
  }, [selectedState, stateByAbbr]);

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

  function selectState(code) {
    if (!code) return;
    setSelectedState(String(code).toUpperCase());
    setDrilldownOpen(true);
    setTaskMessage("");
  }

  function goCommandCenter() {
    const params = selectedState
      ? `?state=${encodeURIComponent(selectedState)}&source=opportunity-heatmap`
      : "?source=opportunity-heatmap";

    navigate(`/command-center${params}`);
  }

  return (
    <PageShell
      eyebrow="Consultant Intelligence"
      title="Campaign Opportunity Heatmap"
      description="Identify states and campaigns with consultant demand signals, generate AI briefings, review contact gaps, and move actions into Command Center."
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
        subtitle="Score opportunities, open AI briefing, and push actions into Command Center."
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
            onChange={(event) => {
              setSelectedState(event.target.value.toUpperCase());
              setDrilldownOpen(Boolean(event.target.value));
            }}
            placeholder="Filter by state, e.g. AZ"
            maxLength={2}
          />

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => {
              setSelectedState("");
              setDrilldownOpen(false);
              setTaskMessage("");
            }}
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
          subtitle="Click any highlighted state to open AI briefing and command actions."
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
                      const isSelected = selectedState === abbr;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => {
                            if (abbr) selectState(abbr);
                          }}
                          style={{
                            default: {
                              fill: item ? getStateFill(item) : "#111827",
                              stroke: isSelected ? "#f8fafc" : "#374151",
                              strokeWidth: isSelected ? 1.5 : 0.75,
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
                        r={selectedState === item.state ? 10 : 8}
                        fill="#f8fafc"
                        stroke="#111827"
                        strokeWidth={2}
                        onClick={() => selectState(item.state)}
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
                    onClick={() => selectState(item.state)}
                    style={{
                      textAlign: "left",
                      padding: "14px",
                      cursor: "pointer",
                      color: "var(--vs-text)",
                      border:
                        selectedState === item.state
                          ? "1px solid rgba(96, 165, 250, 0.48)"
                          : undefined,
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
                      {
                        label: "Confidence",
                        value: `${Math.round(Number(row.contact_confidence || 0) * 100)}%`,
                      },
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

      {drilldownOpen && selectedState ? (
        <DrilldownPanel
          selectedState={selectedState}
          selectedStateItem={selectedStateItem}
          opportunities={data.top_opportunities || []}
          onClose={() => setDrilldownOpen(false)}
          onCreateTask={createCommandTask}
          onGoCommand={goCommandCenter}
          taskMessage={taskMessage}
        />
      ) : null}
    </PageShell>
  );
}
