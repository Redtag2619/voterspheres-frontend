import React from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const battlegrounds = [
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
    note: "Turnout machine is strengthening, but media volatility remains a watch item."
  },
  {
    name: "Arizona 01",
    state: "Arizona",
    center: [33.4484, -112.074],
    raceRating: "Toss-up",
    winProb: 51,
    momentum: "+1.4",
    funds: "$8.9M",
    risk: "Medium",
    note: "Independent crossover lane is widening in key suburban zones."
  },
  {
    name: "Michigan 07",
    state: "Michigan",
    center: [42.7336, -84.5553],
    raceRating: "Toss-up",
    winProb: 49,
    momentum: "-0.8",
    funds: "$7.2M",
    risk: "High",
    note: "Momentum is fragile and highly sensitive to local media shifts."
  },
  {
    name: "Nevada 03",
    state: "Nevada",
    center: [36.1699, -115.1398],
    raceRating: "Lean",
    winProb: 53,
    momentum: "+0.7",
    funds: "$10.1M",
    risk: "Low",
    note: "Stable but highly dependent on donor retention and turnout consistency."
  },
  {
    name: "Wisconsin Senate",
    state: "Wisconsin",
    center: [43.0731, -89.4012],
    raceRating: "Tilt",
    winProb: 48,
    momentum: "-1.6",
    funds: "$11.3M",
    risk: "High",
    note: "Narrative drag and local skepticism are raising downside pressure."
  }
];

const mapMetrics = [
  { label: "Battleground States", value: "12", delta: "+2", tone: "up" },
  { label: "Competitive Districts", value: "29", delta: "+4", tone: "up" },
  { label: "High-Risk Zones", value: "8", delta: "+1", tone: "down" },
  { label: "Momentum Leaders", value: "5", delta: "+3", tone: "up" }
];

const regionalBoard = [
  { region: "Midwest", score: "72", shift: "+4.2", outlook: "Advantage" },
  { region: "Sun Belt", score: "58", shift: "+1.1", outlook: "Competitive" },
  { region: "Mountain West", score: "49", shift: "-1.4", outlook: "Pressure" },
  { region: "Northeast", score: "67", shift: "+0.8", outlook: "Stable" }
];

const mapAlerts = [
  {
    severity: "High",
    title: "Media-sensitive pressure rising in upper Midwest battlegrounds",
    note: "Narrative instability is clustering around two top-tier senate contests."
  },
  {
    severity: "Medium",
    title: "Sun Belt suburban persuasion trend improving",
    note: "Affordability framing is raising conversion efficiency in key districts."
  },
  {
    severity: "Medium",
    title: "Mountain West donor hesitation affecting paid media flexibility",
    note: "Cash-flow pressure may narrow air-cover options late in cycle."
  },
  {
    severity: "Low",
    title: "Northeast event and bundler pipeline remains stable",
    note: "Capital support is helping preserve message volume and confidence."
  }
];

function toneClass(value) {
  return String(value).startsWith("-") ? "down" : "up";
}

function severityClass(value) {
  const normalized = value.toLowerCase();
  if (normalized === "high") return "high";
  if (normalized === "medium") return "medium";
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

function ElectionMap() {
  return (
    <div className="vs-map-page">
      <section className="vs-map-hero vs-card">
        <div>
          <div className="vs-section-eyebrow">Election Map Terminal</div>
          <h1 className="vs-map-title">
            See where the political map is moving, where pressure is building, and where the next gains can be made.
          </h1>
          <p className="vs-map-copy">
            Track battleground geography, race pressure, regional strength, and strategic risk on a live political command map.
          </p>
        </div>

        <div className="vs-map-hero-grid">
          {mapMetrics.map((item) => (
            <div key={item.label} className="vs-map-stat-card">
              <div className="vs-map-stat-label">{item.label}</div>
              <div className="vs-map-stat-value">{item.value}</div>
              <div className={`vs-map-stat-delta ${item.tone}`}>{item.delta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="vs-map-grid">
        <div className="vs-card vs-map-panel vs-map-panel-large">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Battleground Command Map</div>
              <div className="vs-card-subtitle">
                Marker size reflects race confidence and marker color reflects competitive temperature
              </div>
            </div>
            <button className="vs-card-link">Open full forecast</button>
          </div>

          <div className="vs-map-legend">
            <div className="vs-map-legend-item">
              <span className="vs-map-dot strong" />
              <span>Strong</span>
            </div>
            <div className="vs-map-legend-item">
              <span className="vs-map-dot lean" />
              <span>Lean</span>
            </div>
            <div className="vs-map-legend-item">
              <span className="vs-map-dot tossup" />
              <span>Toss-up</span>
            </div>
            <div className="vs-map-legend-item">
              <span className="vs-map-dot risk" />
              <span>Risk</span>
            </div>
          </div>

          <div className="vs-map-canvas">
            <MapContainer
              center={[39.8283, -98.5795]}
              zoom={4}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {battlegrounds.map((race) => (
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
                      <div className="vs-map-popup-row">
                        <strong>State:</strong> {race.state}
                      </div>
                      <div className="vs-map-popup-row">
                        <strong>Rating:</strong> {race.raceRating}
                      </div>
                      <div className="vs-map-popup-row">
                        <strong>Win Probability:</strong> {race.winProb}%
                      </div>
                      <div className="vs-map-popup-row">
                        <strong>Momentum:</strong> {race.momentum}
                      </div>
                      <div className="vs-map-popup-row">
                        <strong>Funds:</strong> {race.funds}
                      </div>
                      <div className="vs-map-popup-row">
                        <strong>Risk:</strong> {race.risk}
                      </div>
                      <div className="vs-map-popup-note">{race.note}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="vs-card vs-map-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Regional Pressure Board</div>
              <div className="vs-card-subtitle">
                Relative map strength by region
              </div>
            </div>
          </div>

          <div className="vs-region-board">
            {regionalBoard.map((item) => (
              <div key={item.region} className="vs-region-card">
                <div className="vs-region-name">{item.region}</div>
                <div className="vs-region-score">{item.score}</div>
                <div className={`vs-region-trend ${toneClass(item.shift)}`}>
                  {item.shift}
                </div>
                <div className="vs-region-status">{item.outlook}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-map-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Race Map Board</div>
              <div className="vs-card-subtitle">
                Top battlegrounds and current map conditions
              </div>
            </div>
          </div>

          <div className="vs-table">
            <div className="vs-table-head">
              <span>Race</span>
              <span>Win Prob.</span>
              <span>Momentum</span>
              <span>Funds</span>
              <span>Risk</span>
            </div>

            {battlegrounds.map((row) => (
              <div key={row.name} className="vs-table-row vs-table-row-five">
                <span>{row.name}</span>
                <span>{row.winProb}%</span>
                <span className={toneClass(row.momentum)}>{row.momentum}</span>
                <span>{row.funds}</span>
                <span>{row.risk}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-map-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Map Alert Feed</div>
              <div className="vs-card-subtitle">
                Geographic signals shaping the current battlefield
              </div>
            </div>
          </div>

          <div className="vs-map-alert-list">
            {mapAlerts.map((item) => (
              <div key={item.title} className="vs-map-alert-item">
                <div className={`vs-map-alert-severity ${severityClass(item.severity)}`}>
                  {item.severity}
                </div>
                <div className="vs-map-alert-body">
                  <div className="vs-map-alert-title">{item.title}</div>
                  <div className="vs-map-alert-note">{item.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ElectionMap;
