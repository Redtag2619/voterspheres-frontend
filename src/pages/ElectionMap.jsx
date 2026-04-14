import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from "react-simple-maps";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const US_TOPO_JSON =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

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
  "District of Columbia": "DC"
};

const STATE_ABBR_TO_NAME = Object.fromEntries(
  Object.entries(STATE_NAME_TO_ABBR).map(([name, abbr]) => [abbr, name])
);

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
  DC: [-77.0, 38.9]
};

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function formatMoneyShort(value) {
  const num = Number(value || 0);
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toLocaleString()}`;
}

function formatDateTime(value) {
  if (!value) return "Not synced yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not synced yet";
  return date.toLocaleString();
}

function overlayTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "critical") return "danger";
  if (v === "elevated") return "accent";
  if (v === "watch") return "demo";
  if (v === "monitor") return "info";
  return "default";
}

function officeTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "senate") return "danger";
  if (v === "house") return "info";
  if (v === "president") return "accent";
  return "default";
}

function getStateFill(item) {
  const tier = String(item?.overlayTier || "").toLowerCase();
  if (tier === "critical") return "#7f1d1d";
  if (tier === "elevated") return "#7c3aed";
  if (tier === "watch") return "#92400e";
  if (tier === "monitor") return "#1e3a8a";
  return "#1f2937";
}

function CandidateCard({ candidate }) {
  return (
    <div
      className="vs-card-muted"
      style={{
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}
    >
      <div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 800,
            lineHeight: 1.15,
            color: "var(--vs-text)"
          }}
        >
          {candidate.name}
        </div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            lineHeight: 1.45,
            color: "var(--vs-text-muted)"
          }}
        >
          {candidate.party || "N/A"} • Rank #{candidate.rank || "—"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px 16px"
        }}
      >
        <div>
          <div className="vs-stat-label">Receipts</div>
          <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 800 }}>
            {formatMoney(candidate.receipts || 0)}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Cash</div>
          <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 800 }}>
            {formatMoney(candidate.cash_on_hand || 0)}
          </div>
        </div>
      </div>
    </div>
  );
}

function OverlayCard({ item, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="vs-card"
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        minHeight: "220px",
        textAlign: "left",
        border: isActive ? "1px solid rgba(99, 102, 241, 0.55)" : undefined,
        boxShadow: isActive ? "0 0 0 1px rgba(99, 102, 241, 0.18)" : undefined,
        cursor: "pointer"
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap"
          }}
        >
          <div
            style={{
              fontSize: "16px",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--vs-text)"
            }}
          >
            {item.state}
          </div>
          <Badge tone={officeTone(item.office)}>{item.office}</Badge>
        </div>

        <div
          style={{
            marginTop: "6px",
            fontSize: "12px",
            lineHeight: 1.45,
            color: "var(--vs-text-muted)"
          }}
        >
          {item.candidates?.length || 0} candidate signals • Top 5 shown
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px 18px",
          alignContent: "start",
          minHeight: "94px"
        }}
      >
        <div>
          <div className="vs-stat-label">Overlay Score</div>
          <div style={{ marginTop: "4px", fontSize: "18px", fontWeight: 800 }}>
            {item.overlayScore}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Tier</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700 }}>
            {item.overlayTier}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Total Receipts</div>
          <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 800 }}>
            {formatMoneyShort(item.totalReceipts || 0)}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Total Cash</div>
          <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 800 }}>
            {formatMoneyShort(item.totalCashOnHand || 0)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-start" }}>
        <Badge tone={overlayTone(item.overlayTier)}>{item.overlayTier}</Badge>
      </div>
    </button>
  );
}

export default function ElectionMap() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mapData, setMapData] = useState({
    summary: {
      trackedStates: 0,
      overlays: 0,
      last_synced_at: null
    },
    battlegrounds: []
  });
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [selectedState, setSelectedState] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMap() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/intelligence/map", { timeout: 8000 });
        if (!active) return;

        const payload = response?.data || {
          summary: {
            trackedStates: 0,
            overlays: 0,
            last_synced_at: null
          },
          battlegrounds: []
        };

        setMapData(payload);

        if (payload?.battlegrounds?.length) {
          setSelectedOverlay(payload.battlegrounds[0]);
        }
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load election map");
        setMapData({
          summary: {
            trackedStates: 0,
            overlays: 0,
            last_synced_at: null
          },
          battlegrounds: []
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMap();

    return () => {
      active = false;
    };
  }, []);

  const stateOptions = useMemo(() => {
    return Array.from(
      new Set((mapData.battlegrounds || []).map((item) => item.state).filter(Boolean))
    ).sort();
  }, [mapData.battlegrounds]);

  const officeOptions = useMemo(() => {
    return Array.from(
      new Set((mapData.battlegrounds || []).map((item) => item.office).filter(Boolean))
    ).sort();
  }, [mapData.battlegrounds]);

  const filteredOverlays = useMemo(() => {
    return (mapData.battlegrounds || []).filter((item) => {
      if (selectedState && item.state !== selectedState) return false;
      if (selectedOffice && item.office !== selectedOffice) return false;
      return true;
    });
  }, [mapData.battlegrounds, selectedState, selectedOffice]);

  const overlayByAbbr = useMemo(() => {
    const map = {};
    for (const item of filteredOverlays) {
      const abbr = STATE_NAME_TO_ABBR[item.state] || item.state;
      if (!map[abbr] || Number(item.overlayScore || 0) > Number(map[abbr].overlayScore || 0)) {
        map[abbr] = item;
      }
    }
    return map;
  }, [filteredOverlays]);

  useEffect(() => {
    if (!filteredOverlays.length) {
      setSelectedOverlay(null);
      return;
    }

    const stillExists = filteredOverlays.some(
      (item) =>
        item.state === selectedOverlay?.state &&
        item.office === selectedOverlay?.office
    );

    if (!stillExists) {
      setSelectedOverlay(filteredOverlays[0]);
    }
  }, [filteredOverlays, selectedOverlay]);

  const topOverlay = filteredOverlays[0] || null;

  return (
    <PageShell
      eyebrow="Election Map"
      title="Live fundraising overlays by state and office."
      description="Use finance intensity to see which states and offices are carrying the strongest live candidate signals."
      tickerItems={[
        {
          label: "Tracked States",
          value: String(mapData.summary?.trackedStates || 0),
          dotClass: "vs-live-dot"
        },
        {
          label: "Overlays",
          value: String(mapData.summary?.overlays || 0),
          dotClass: "vs-live-dot-warning"
        },
        {
          label: "Last Sync",
          value: formatDateTime(mapData.summary?.last_synced_at),
          dotClass: "vs-live-dot-success"
        }
      ]}
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <SectionCard
        title="Map Filters"
        subtitle="Filter by state and office to narrow the live overlay stack."
      >
        <div className="vs-grid-3">
          <select
            className="vs-select"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            <option value="">All states</option>
            {stateOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            className="vs-select"
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
          >
            <option value="">All offices</option>
            {officeOptions.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => {
              setSelectedState("");
              setSelectedOffice("");
            }}
          >
            Clear Filters
          </button>
        </div>
      </SectionCard>

      <div className="vs-grid-4">
        <StatCard
          label="Tracked States"
          value={String(mapData.summary?.trackedStates || 0)}
          delta="States with live finance overlays"
          tone="up"
        />
        <StatCard
          label="Overlay Count"
          value={String(filteredOverlays.length || 0)}
          delta="State-office combinations"
          tone="up"
        />
        <StatCard
          label="Top Overlay"
          value={topOverlay ? `${topOverlay.state}` : "N/A"}
          delta={topOverlay ? `${topOverlay.office} • ${topOverlay.overlayTier}` : "No overlays match"}
          tone="up"
        />
        <StatCard
          label="Last Sync"
          value={formatDateTime(mapData.summary?.last_synced_at)}
          delta="Latest FEC finance ingestion"
          tone="up"
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(360px, 0.8fr)"
        }}
      >
        <SectionCard
          title="U.S. Finance Overlay Map"
          subtitle="States are shaded by the strongest state-office finance overlay in the current filter set."
          right={<Badge tone="info">{filteredOverlays.length} overlays</Badge>}
        >
          <div className="vs-card" style={{ padding: "12px", minHeight: "520px" }}>
            {loading ? (
              <EmptyState text="Loading live map..." />
            ) : !filteredOverlays.length ? (
              <EmptyState text="No live overlays match the selected filters." />
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
                      const overlay = abbr ? overlayByAbbr[abbr] : null;
                      const isActive =
                        overlay &&
                        selectedOverlay &&
                        overlay.state === selectedOverlay.state &&
                        overlay.office === selectedOverlay.office;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => {
                            if (overlay) setSelectedOverlay(overlay);
                          }}
                          style={{
                            default: {
                              fill: overlay ? getStateFill(overlay) : "#111827",
                              stroke: "#374151",
                              strokeWidth: isActive ? 1.5 : 0.75,
                              outline: "none",
                              cursor: overlay ? "pointer" : "default"
                            },
                            hover: {
                              fill: overlay ? getStateFill(overlay) : "#1f2937",
                              stroke: "#9ca3af",
                              strokeWidth: 1.2,
                              outline: "none",
                              cursor: overlay ? "pointer" : "default"
                            },
                            pressed: {
                              fill: overlay ? getStateFill(overlay) : "#1f2937",
                              stroke: "#9ca3af",
                              strokeWidth: 1.2,
                              outline: "none"
                            }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>

                {filteredOverlays.map((item) => {
                  const abbr = STATE_NAME_TO_ABBR[item.state];
                  const coords = abbr ? STATE_CENTROIDS[abbr] : null;
                  if (!coords) return null;

                  const isActive =
                    selectedOverlay?.state === item.state &&
                    selectedOverlay?.office === item.office;

                  return (
                    <Marker
                      key={`${item.state}-${item.office}`}
                      coordinates={coords}
                      onClick={() => setSelectedOverlay(item)}
                    >
                      <circle
                        r={isActive ? 8 : 6}
                        fill="#f8fafc"
                        stroke="#111827"
                        strokeWidth={2}
                        style={{ cursor: "pointer" }}
                      />
                      <text
                        textAnchor="middle"
                        y={-12}
                        style={{
                          fontFamily: "inherit",
                          fill: "#e5e7eb",
                          fontSize: 10,
                          fontWeight: 700,
                          pointerEvents: "none"
                        }}
                      >
                        {STATE_NAME_TO_ABBR[item.state] || item.state}
                      </text>
                    </Marker>
                  );
                })}
              </ComposableMap>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title={
            selectedOverlay
              ? `${selectedOverlay.state} • ${selectedOverlay.office}`
              : "Overlay Detail"
          }
          subtitle={
            selectedOverlay
              ? `Overlay score ${selectedOverlay.overlayScore} • Tier ${selectedOverlay.overlayTier} • Last synced ${formatDateTime(mapData.summary?.last_synced_at)}`
              : "Select a state overlay to inspect live candidate finance detail."
          }
          right={
            selectedOverlay ? (
              <Badge tone={overlayTone(selectedOverlay.overlayTier)}>
                {selectedOverlay.overlayTier}
              </Badge>
            ) : null
          }
        >
          <div className="vs-stack">
            {!selectedOverlay ? (
              <EmptyState text="Select a state-office overlay to see candidate details." />
            ) : (
              <>
                <div className="vs-grid-3">
                  <StatCard
                    label="Candidates"
                    value={String(selectedOverlay.candidates?.length || 0)}
                    delta="Top candidates shown"
                    tone="up"
                  />
                  <StatCard
                    label="Total Receipts"
                    value={formatMoneyShort(selectedOverlay.totalReceipts || 0)}
                    delta="Combined finance pressure"
                    tone="up"
                  />
                  <StatCard
                    label="Total Cash"
                    value={formatMoneyShort(selectedOverlay.totalCashOnHand || 0)}
                    delta="Combined reserve strength"
                    tone="up"
                  />
                </div>

                <div className="vs-stack">
                  {(selectedOverlay.candidates || []).map((candidate) => (
                    <CandidateCard
                      key={candidate.candidate_id}
                      candidate={candidate}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Overlay Stack"
        subtitle="A ranked list of the current live state-office overlays."
        right={<Badge tone="info">{filteredOverlays.length} ranked</Badge>}
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading overlay stack..." />
          ) : !filteredOverlays.length ? (
            <EmptyState text="No overlays match the selected filters." />
          ) : (
            filteredOverlays.map((item) => (
              <OverlayCard
                key={`${item.state}-${item.office}`}
                item={item}
                isActive={
                  selectedOverlay?.state === item.state &&
                  selectedOverlay?.office === item.office
                }
                onSelect={setSelectedOverlay}
              />
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
