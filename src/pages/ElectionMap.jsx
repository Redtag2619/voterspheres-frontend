import { useEffect, useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { intelligenceApi, statesApi } from "../services/api";

function MetricCard({ label, value, delta }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-cyan-300">{delta}</div>
    </div>
  );
}

function DetailCard({ row }) {
  if (!row) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 text-sm text-slate-400">
        Select a battleground state on the map.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{row.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
            {row.state}
          </p>
        </div>

        <span
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: `${row.fill || "#334155"}22`,
            color: row.stroke || "#cbd5e1",
            border: `1px solid ${row.stroke || "#475569"}`,
          }}
        >
          {row.overlayTier || row.raceRating || "watch"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        <p>
          <span className="text-slate-500">Win Probability:</span>{" "}
          {row.winProb ?? row.winProbability ?? 0}%
        </p>
        <p>
          <span className="text-slate-500">Overlay Score:</span>{" "}
          {row.overlayScore ?? "N/A"}
        </p>
        <p>
          <span className="text-slate-500">Urgency:</span>{" "}
          {row.risk || row.urgency || "Monitor"}
        </p>
        <p>
          <span className="text-slate-500">Finance Weight:</span>{" "}
          {row.financeWeight ?? "N/A"}
        </p>
        <p>
          <span className="text-slate-500">Competition Weight:</span>{" "}
          {row.competitionWeight ?? "N/A"}
        </p>
        <p>
          <span className="text-slate-500">Modeled Funds:</span>{" "}
          {row.funds || "N/A"}
        </p>
        <p>
          <span className="text-slate-500">Momentum:</span>{" "}
          {row.momentum || "N/A"}
        </p>
        <p className="text-slate-400">{row.note}</p>
      </div>
    </div>
  );
}

function getFillForState(name, battlegroundMap, selectedState) {
  const row = battlegroundMap[name];

  if (selectedState === name) return "#22d3ee";
  if (!row) return "#1f2937";

  return row.fill || "#334155";
}

function getStrokeForState(name, battlegroundMap, selectedState) {
  const row = battlegroundMap[name];

  if (selectedState === name) return "#ecfeff";
  if (!row) return "#0f172a";

  return row.stroke || "#94a3b8";
}

export default function ElectionMap() {
  const [data, setData] = useState({ metrics: [], battlegrounds: [] });
  const [geoJson, setGeoJson] = useState(null);
  const [selectedState, setSelectedState] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadMap() {
      try {
        setLoading(true);
        setError("");

        const [mapData, geo] = await Promise.all([
          intelligenceApi.map(),
          statesApi.geoJson(),
        ]);

        if (!active) return;

        const battlegrounds = mapData?.battlegrounds || mapData?.mapBattlegrounds || [];

        setData({
          metrics: mapData?.metrics || [],
          battlegrounds,
        });

        setGeoJson(geo);

        if (battlegrounds.length > 0) {
          setSelectedState(battlegrounds[0].state);
        }
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load election map");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMap();

    return () => {
      active = false;
    };
  }, []);

  const battlegroundMap = useMemo(() => {
    return data.battlegrounds.reduce((acc, row) => {
      acc[row.state] = row;
      return acc;
    }, {});
  }, [data.battlegrounds]);

  const selectedRow = battlegroundMap[selectedState] || null;

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            VoterSpheres National Map
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Election Map</h1>
          <p className="mt-2 text-sm text-slate-400">
            Live state overlays driven by backend forecast and fundraising data.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
            Loading election map...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-300">
            {error}
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {data.metrics.map((metric) => (
                <MetricCard
                  key={metric.label}
                  label={metric.label}
                  value={metric.value}
                  delta={metric.delta}
                />
              ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.35fr,0.65fr]">
              <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
                <h2 className="mb-4 text-xl font-semibold">Overlay Map</h2>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#08111d] p-4">
                  {geoJson ? (
                    <ComposableMap
                      projection="geoAlbersUsa"
                      projectionConfig={{ scale: 1100 }}
                      width={980}
                      height={580}
                      style={{ width: "100%", height: "auto" }}
                    >
                      <Geographies geography={geoJson}>
                        {({ geographies }) =>
                          geographies.map((geo) => {
                            const stateName = geo.properties.name;

                            return (
                              <Geography
                                key={geo.rsmKey}
                                geography={geo}
                                onClick={() => setSelectedState(stateName)}
                                style={{
                                  default: {
                                    fill: getFillForState(
                                      stateName,
                                      battlegroundMap,
                                      selectedState
                                    ),
                                    stroke: getStrokeForState(
                                      stateName,
                                      battlegroundMap,
                                      selectedState
                                    ),
                                    strokeWidth: 1.1,
                                    outline: "none",
                                    cursor: "pointer",
                                  },
                                  hover: {
                                    fill: "#38bdf8",
                                    stroke: "#e0f2fe",
                                    strokeWidth: 1.2,
                                    outline: "none",
                                    cursor: "pointer",
                                  },
                                  pressed: {
                                    fill: "#06b6d4",
                                    stroke: "#ecfeff",
                                    strokeWidth: 1.2,
                                    outline: "none",
                                  },
                                }}
                              />
                            );
                          })
                        }
                      </Geographies>

                      {data.battlegrounds.map((row) =>
                        Array.isArray(row.center) ? (
                          <Marker
                            key={row.name}
                            coordinates={[row.center[1], row.center[0]]}
                          >
                            <circle
                              r={5}
                              fill={row.fill || "#f8fafc"}
                              stroke={row.stroke || "#22d3ee"}
                              strokeWidth={2}
                            />
                          </Marker>
                        ) : null
                      )}
                    </ComposableMap>
                  ) : (
                    <div className="p-8 text-sm text-slate-400">
                      GeoJSON layer unavailable.
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-300">
                  <span className="rounded-full bg-[#ef4444] px-3 py-1 text-white">
                    Critical
                  </span>
                  <span className="rounded-full bg-[#f59e0b] px-3 py-1 text-black">
                    High
                  </span>
                  <span className="rounded-full bg-[#0ea5e9] px-3 py-1 text-white">
                    Elevated
                  </span>
                  <span className="rounded-full bg-[#334155] px-3 py-1 text-white">
                    Watch
                  </span>
                  <span className="rounded-full bg-[#22d3ee] px-3 py-1 text-black">
                    Selected
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <DetailCard row={selectedRow} />

                <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
                  <h3 className="text-lg font-semibold text-white">
                    Overlay States
                  </h3>

                  <div className="mt-4 space-y-2">
                    {data.battlegrounds.map((row) => (
                      <button
                        key={row.name}
                        type="button"
                        onClick={() => setSelectedState(row.state)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                          selectedState === row.state
                            ? "border-cyan-400 bg-cyan-500/10 text-cyan-300"
                            : "border-white/10 bg-[#0b1220] text-slate-300 hover:border-cyan-400/40"
                        }`}
                      >
                        <span>{row.state}</span>
                        <span>{row.overlayScore ?? row.winProb ?? 0}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
