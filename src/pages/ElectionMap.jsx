import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography
} from "react-simple-maps";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const stateNameToCode = {
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
  Wyoming: "WY"
};

function colorForTier(tier, selected) {
  const t = String(tier || "").toLowerCase();
  if (selected) return "#fbbf24";
  if (t === "critical") return "#ef4444";
  if (t === "watch") return "#f59e0b";
  if (t === "priority") return "#38bdf8";
  return "#334155";
}

function BattlegroundRow({ item, onSelect, selected }) {
  return (
    <div onClick={() => onSelect(item)} style={{ cursor: "pointer" }}>
      <ResponsiveRow
        title={`${item.state} • ${item.office}`}
        subtitle="Overlay score and intelligence priority for this battleground."
        meta={[
          { label: "Overlay Score", value: item.overlayScore },
          { label: "Tier", value: item.overlayTier }
        ]}
        alert={
          String(item.overlayTier || "").toLowerCase() === "critical"
            ? "vs-live-dot"
            : String(item.overlayTier || "").toLowerCase() === "watch"
            ? "vs-live-dot-warning"
            : "vs-live-dot-success"
        }
        right={
          <Badge
            tone={
              selected
                ? "accent"
                : String(item.overlayTier || "").toLowerCase() === "critical"
                ? "danger"
                : String(item.overlayTier || "").toLowerCase() === "watch"
                ? "demo"
                : "info"
            }
          >
            {selected ? "Selected" : item.overlayTier}
          </Badge>
        }
      />
    </div>
  );
}

const fallbackData = {
  summary: {
    trackedStates: 8,
    overlays: 8
  },
  battlegrounds: [
    {
      state: "Georgia",
      office: "Senate",
      overlayScore: 82,
      overlayTier: "critical"
    },
    {
      state: "Pennsylvania",
      office: "Governor",
      overlayScore: 74,
      overlayTier: "watch"
    },
    {
      state: "Arizona",
      office: "Senate",
      overlayScore: 71,
      overlayTier: "watch"
    },
    {
      state: "Michigan",
      office: "House",
      overlayScore: 66,
      overlayTier: "priority"
    }
  ]
};

export default function ElectionMap() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mapData, setMapData] = useState(fallbackData);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useEffect(() => {
    let active = true;

    async function loadMap() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/intelligence/map", {
          timeout: 6000
        });

        if (!active) return;

        const payload = response?.data || fallbackData;

        setMapData({
          summary: payload.summary || fallbackData.summary,
          battlegrounds: payload.battlegrounds?.length
            ? payload.battlegrounds
            : fallbackData.battlegrounds
        });
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load election map"
        );
        setMapData(fallbackData);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMap();

    return () => {
      active = false;
    };
  }, []);

  const battlegrounds = useMemo(
    () => mapData.battlegrounds || [],
    [mapData.battlegrounds]
  );

  const battlegroundByCode = useMemo(() => {
    const map = {};
    battlegrounds.forEach((item) => {
      const code = stateNameToCode[item.state];
      if (code) map[code] = item;
    });
    return map;
  }, [battlegrounds]);

  const selectedState =
    selected || hovered || battlegrounds[0] || null;

  return (
    <PageShell
      eyebrow="Election Map"
      title="See where the map is moving."
      description="Visualize battleground states, overlay pressure, and race intensity across the modeled campaign landscape."
      demo={demoMode}
      demoText="Demo map mode is active. Battleground overlays and state pressure are preloaded for presentation."
      tickerItems={[
        { label: "Tracked States", value: `${mapData.summary?.trackedStates || 0}`, dotClass: "vs-live-dot-success" },
        { label: "Critical", value: `${battlegrounds.filter((b) => String(b.overlayTier).toLowerCase() === "critical").length}`, dotClass: "vs-live-dot" },
        { label: "Watch", value: `${battlegrounds.filter((b) => String(b.overlayTier).toLowerCase() === "watch").length}`, dotClass: "vs-live-dot-warning" }
      ]}
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard
          label="Tracked States"
          value={mapData.summary?.trackedStates || 0}
          subtext="States in the overlay layer"
        />
        <StatCard
          label="Overlay Zones"
          value={mapData.summary?.overlays || 0}
          subtext="Priority map signals"
        />
        <StatCard
          label="Critical Battlegrounds"
          value={battlegrounds.filter((b) => String(b.overlayTier).toLowerCase() === "critical").length}
          subtext="Highest-pressure states"
        />
        <StatCard
          label="Watch States"
          value={battlegrounds.filter((b) => String(b.overlayTier).toLowerCase() === "watch").length}
          subtext="Emerging movement"
        />
      </div>

      <div className="vs-grid-2">
        <SectionCard
          title="Interactive United States Map"
          subtitle="Hover a state to inspect it. Click a battleground to pin its details."
          right={<Badge tone="info">Interactive</Badge>}
        >
          {loading ? (
            <EmptyState text="Loading map overlays..." />
          ) : (
            <div className="vs-card-muted" style={{ padding: "12px" }}>
              <ComposableMap
                projection="geoAlbersUsa"
                style={{ width: "100%", height: "auto" }}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const stateName = geo.properties.name;
                      const code = stateNameToCode[stateName];
                      const item = battlegroundByCode[code];
                      const isSelected =
                        selectedState && selectedState.state === stateName;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => {
                            if (item) setHovered(item);
                          }}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => {
                            if (item) setSelected(item);
                          }}
                          style={{
                            default: {
                              fill: colorForTier(item?.overlayTier, isSelected),
                              outline: "none",
                              stroke: "#0a0d12",
                              strokeWidth: 0.8
                            },
                            hover: {
                              fill: "#fbbf24",
                              outline: "none",
                              stroke: "#0a0d12",
                              strokeWidth: 0.8
                            },
                            pressed: {
                              fill: "#f59e0b",
                              outline: "none",
                              stroke: "#0a0d12",
                              strokeWidth: 0.8
                            }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>

              <div style={{ marginTop: "12px" }}>
                {selectedState ? (
                  <ResponsiveRow
                    title={`${selectedState.state} • ${selectedState.office}`}
                    subtitle="Live selected state from the national map."
                    meta={[
                      { label: "Overlay Score", value: selectedState.overlayScore },
                      { label: "Tier", value: selectedState.overlayTier }
                    ]}
                    alert={
                      String(selectedState.overlayTier || "").toLowerCase() === "critical"
                        ? "vs-live-dot"
                        : String(selectedState.overlayTier || "").toLowerCase() === "watch"
                        ? "vs-live-dot-warning"
                        : "vs-live-dot-success"
                    }
                    right={<Badge tone="accent">Selected</Badge>}
                  />
                ) : (
                  <EmptyState text="Hover or click a battleground state on the map." />
                )}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard
          title="Battleground State Board"
          subtitle="States and races requiring immediate strategic visibility."
          right={<Badge tone="accent">{battlegrounds.length} active</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading battleground states..." />
            ) : !battlegrounds.length ? (
              <EmptyState text="No battleground states available." />
            ) : (
              battlegrounds.map((item) => (
                <BattlegroundRow
                  key={`${item.state}-${item.office}`}
                  item={item}
                  onSelect={setSelected}
                  selected={selected?.state === item.state}
                />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
