import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function toneFromTier(value) {
  const v = String(value || "").toLowerCase();
  if (v === "critical") return "danger";
  if (v === "watch") return "demo";
  return "accent";
}

function BattlegroundRow({ item }) {
  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "1.5fr 1fr 1fr auto",
          alignItems: "start"
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>
            {item.state} • {item.office}
          </div>
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.85rem",
              color: "var(--vs-text-muted)"
            }}
          >
            Overlay score and intelligence priority for this battleground.
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Overlay Score</div>
          <div style={{ marginTop: "0.35rem", fontWeight: 700 }}>
            {item.overlayScore}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Tier</div>
          <div style={{ marginTop: "0.35rem" }}>
            <Badge tone={toneFromTier(item.overlayTier)}>{item.overlayTier}</Badge>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div
            style={{
              width: "90px",
              height: "10px",
              borderRadius: "9999px",
              background: "#e5e7eb",
              overflow: "hidden",
              marginTop: "0.4rem"
            }}
          >
            <div
              style={{
                width: `${Math.min(Number(item.overlayScore || 0), 100)}%`,
                height: "100%",
                borderRadius: "9999px",
                background: "var(--vs-accent)"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MapPanel({ items }) {
  return (
    <div
      className="vs-card-muted"
      style={{
        minHeight: "420px",
        display: "grid",
        placeItems: "center",
        position: "relative"
      }}
    >
      <div style={{ width: "100%", maxWidth: "620px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "0.85rem"
          }}
        >
          {[
            "WA","OR","CA","NV",
            "AZ","UT","CO","NM",
            "TX","OK","KS","NE",
            "SD","ND","MN","IA",
            "MO","AR","LA","WI",
            "IL","MI","IN","OH",
            "KY","TN","MS","AL",
            "GA","FL","SC","NC",
            "VA","WV","PA","NY"
          ].map((stateCode, index) => {
            const live = (items || []).find((x) =>
              String(x.state || "").toLowerCase().startsWith(stateCode.toLowerCase())
            );

            const tone =
              String(live?.overlayTier || "").toLowerCase() === "critical"
                ? "#dc2626"
                : String(live?.overlayTier || "").toLowerCase() === "watch"
                ? "#d97706"
                : live
                ? "#0176d3"
                : "#cbd5e1";

            return (
              <div
                key={`${stateCode}-${index}`}
                style={{
                  border: "1px solid var(--vs-border)",
                  borderRadius: "1rem",
                  background: "white",
                  padding: "0.75rem",
                  minHeight: "64px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "var(--vs-shadow)"
                }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--vs-text)" }}>
                  {stateCode}
                </div>
                <div
                  style={{
                    marginTop: "0.4rem",
                    height: "8px",
                    borderRadius: "9999px",
                    background: "#e5e7eb",
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      width: live ? `${Math.min(Number(live.overlayScore || 0), 100)}%` : "18%",
                      height: "100%",
                      borderRadius: "9999px",
                      background: tone
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
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

  return (
    <PageShell
      eyebrow="Election Map"
      title="See where the map is moving."
      description="Visualize battleground states, overlay pressure, and race intensity across the modeled campaign landscape."
      demo={demoMode}
      demoText="Demo map mode is active. Battleground overlays and state pressure are preloaded for presentation."
    >
      {error ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}
        >
          {error}
        </div>
      ) : null}

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
          title="National Overlay Grid"
          subtitle="Visual pressure map for battleground monitoring."
        >
          {loading ? (
            <EmptyState text="Loading map overlays..." />
          ) : (
            <MapPanel items={battlegrounds} />
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
                />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
