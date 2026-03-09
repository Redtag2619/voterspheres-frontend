import React, { useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { api } from "../services/api";
import "leaflet/dist/leaflet.css";

const fallbackData = {
  metrics: [
    { label: "Battleground States", value: "12", delta: "+2", tone: "up" },
    { label: "Competitive Districts", value: "29", delta: "+4", tone: "up" },
    { label: "High-Risk Zones", value: "8", delta: "+1", tone: "down" },
    { label: "Momentum Leaders", value: "5", delta: "+3", tone: "up" }
  ],
  battlegrounds: [
    {
      name: "Pennsylvania Senate",
      state: "Pennsylvania",
      center: [40.2732, -76.8867],
      raceRating: "Lean",
      winProb: 54,
      momentum: "+2.1",
      funds: "$19.2M",
      risk: "Medium",
      note: "Suburban turnout and affordability message discipline are driving gains."
    },
    {
      name: "Georgia Senate",
      state: "Georgia",
      center: [33.749, -84.388],
      raceRating: "Lean",
      winProb: 57,
      momentum: "+2.9",
      funds: "$17.8M",
      risk: "Medium",
      note: "Turnout machine is strengthening."
    }
  ],
  alerts: [
    {
      severity: "High",
      title: "Media-sensitive pressure rising in upper Midwest battlegrounds",
      note: "Narrative instability is clustering around two top-tier contests."
    }
  ]
};

function toneClass(v) {
  return String(v).startsWith("-") ? "down" : "up";
}

function severityClass(value) {
  const v = value.toLowerCase();
  if (v === "high") return "high";
  if (v === "medium") return "medium";
  return "low";
}

function markerColor(winProb) {
  if (winProb >= 56) return "#22c55e";
  if (winProb >= 51) return "#38bdf8";
  if (winProb >= 48) return "#f59e0b";
  return "#ef4444";
}

function markerRadius(winProb) {
  return Math.max(12, Math.round(winProb / 3));
}

const ElectionMap = () => {
  const fetcher = useCallback(() => api.electionMap(), []);
  const { data, loading, error } = useApiResource(fetcher, fallbackData);

  return (
    <TerminalPage
      eyebrow="Election Map Terminal"
      title="See where the political map is moving, where pressure is building, and where the next gains can be made."
      description="Track battleground geography, race pressure, regional strength, and strategic risk on a live political command map."
      metrics={data?.metrics || []}
    >
      <Panel title="Battleground Command Map" subtitle="Marker size reflects race confidence and color reflects competitive temperature" large>
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <>
            <div className="vs-map-legend">
              <div className="vs-map-legend-item"><span className="vs-map-dot strong" /><span>Strong</span></div>
              <div className="vs-map-legend-item"><span className="vs-map-dot lean" /><span>Lean</span></div>
              <div className="vs-map-legend-item"><span className="vs-map-dot tossup" /><span>Toss-up</span></div>
              <div className="vs-map-legend-item"><span className="vs-map-dot risk" /><span>Risk</span></div>
            </div>

            <div className="vs-map-canvas">
              <MapContainer center={[39.8283, -98.5795]} zoom={4} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {data.battlegrounds.map((race) => (
                  <CircleMarker
                    key={race.name}
                    center={race.center}
                    radius={markerRadius(race.winProb)}
                    pathOptions={{
                      color: markerColor(race.winProb),
                      fillColor: markerColor(race.winProb),
                      fillOpacity: 0.55,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="vs-map-popup">
                        <div className="vs-map-popup-title">{race.name}</div>
                        <div className="vs-map-popup-row"><strong>State:</strong> {race.state}</div>
                        <div className="vs-map-popup-row"><strong>Rating:</strong> {race.raceRating}</div>
                        <div className="vs-map-popup-row"><strong>Win Probability:</strong> {race.winProb}%</div>
                        <div className="vs-map-popup-row"><strong>Momentum:</strong> {race.momentum}</div>
                        <div className="vs-map-popup-row"><strong>Funds:</strong> {race.funds}</div>
                        <div className="vs-map-popup-row"><strong>Risk:</strong> {race.risk}</div>
                        <div className="vs-map-popup-note">{race.note}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </>
        )}
      </Panel>

      <Panel title="Race Map Board" subtitle="Top battlegrounds and current map conditions">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-table">
            <div className="vs-table-head">
              <span>Race</span>
              <span>Win Prob.</span>
              <span>Momentum</span>
              <span>Funds</span>
              <span>Risk</span>
            </div>
            {data.battlegrounds.map((row) => (
              <div key={row.name} className="vs-table-row vs-table-row-five">
                <span>{row.name}</span>
                <span>{row.winProb}%</span>
                <span className={toneClass(row.momentum)}>{row.momentum}</span>
                <span>{row.funds}</span>
                <span>{row.risk}</span>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Map Alert Feed" subtitle="Geographic signals shaping the current battlefield">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-map-alert-list">
            {data.alerts.map((item) => (
              <div key={item.title} className="vs-map-alert-item">
                <div className={`vs-map-alert-severity ${severityClass(item.severity)}`}>{item.severity}</div>
                <div className="vs-map-alert-body">
                  <div className="vs-map-alert-title">{item.title}</div>
                  <div className="vs-map-alert-note">{item.note}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </TerminalPage>
  );
};

export default ElectionMap;
