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
import ExecutivePageNav from "../components/ui/ExecutivePageNav";
import CollapsibleSection from "../components/ui/CollapsibleSection";
import BackToTopButton from "../components/ui/BackToTopButton";
import ShowMoreList from "../components/ui/ShowMoreList";

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
  "District of Columbia": "DC",
};

const STATE_ABBR_TO_NAME = Object.entries(STATE_NAME_TO_ABBR).reduce(
  (acc, [name, abbr]) => {
    acc[abbr] = name;
    return acc;
  },
  {}
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
  DC: [-77.0, 38.9],
};

function formatMoney(value) {
  return "$" + Number(value || 0).toLocaleString();
}

function formatMoneyShort(value) {
  const num = Number(value || 0);
  if (num >= 1_000_000_000) return "$" + (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return "$" + (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return "$" + (num / 1_000).toFixed(1) + "K";
  return "$" + num.toLocaleString();
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

function displaySource(value) {
  if (value === "fec_schedule_a") return "FEC Schedule A";
  if (value === "manual_live_seed") return "Seeded Donor Data";
  if (value === "manual") return "Manual Donor Data";
  return value || "FEC";
}

function getInfluenceScore(donor) {
  const amount = Number(donor.amount || donor.total_amount || 0);
  const count = Number(donor.contribution_count || donor.count || 1);

  const amountScore = Math.min(60, Math.round(amount / 25000));
  const countScore = Math.min(25, count * 5);
  const relationshipScore =
    String(donor.relationship_strength || "").toLowerCase() === "high"
      ? 15
      : String(donor.relationship_strength || "").toLowerCase() === "medium"
      ? 10
      : 5;

  return Math.min(100, amountScore + countScore + relationshipScore);
}

function getStateFill(item) {
  const tier = String(item?.overlayTier || "").toLowerCase();
  if (tier === "critical") return "#7f1d1d";
  if (tier === "elevated") return "#7c3aed";
  if (tier === "watch") return "#92400e";
  if (tier === "monitor") return "#1e3a8a";
  return "#111827";
}

async function loadDonorIntel(params) {
  if (typeof api.donorNetwork === "function") {
    return api.donorNetwork(params);
  }

  const response = await api.get("/donors/network", {
    timeout: 8000,
    params,
  });

  return response?.data || response;
}

function CandidateCard({ candidate, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(candidate)}
      className="vs-card-muted"
      style={{
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        textAlign: "left",
        cursor: "pointer",
        color: "var(--vs-text)",
        border: isSelected ? "1px solid rgba(99, 102, 241, 0.55)" : undefined,
        boxShadow: isSelected ? "0 0 0 1px rgba(99, 102, 241, 0.18)" : undefined,
      }}
    >
      <div>
        <div style={{ fontSize: "15px", fontWeight: 800, lineHeight: 1.15, color: "var(--vs-text)" }}>
          {candidate.name}
        </div>
        <div style={{ marginTop: "6px", fontSize: "12px", lineHeight: 1.45, color: "var(--vs-text-muted)" }}>
          {candidate.party || "N/A"} | Rank #{candidate.rank || "—"}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px 16px",
        }}
      >
        <div>
          <div className="vs-stat-label">Receipts</div>
          <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 800, color: "var(--vs-text)" }}>
            {formatMoney(candidate.receipts || 0)}
          </div>
        </div>
        <div>
          <div className="vs-stat-label">Cash</div>
          <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 800, color: "var(--vs-text)" }}>
            {formatMoney(candidate.cash_on_hand || 0)}
          </div>
        </div>
      </div>
    </button>
  );
}

function DonorCard({ donor }) {
  const influence = getInfluenceScore(donor);
  const location = [donor.city, donor.state, donor.postal_code]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="vs-card-muted"
      style={{
        padding: "14px",
        display: "grid",
        gap: "10px",
        color: "var(--vs-text)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 800, color: "var(--vs-text)" }}>
            {donor.donor_name || donor.name || "Unknown Donor"}
          </div>
          <div style={{ marginTop: 4, fontSize: "12px", color: "var(--vs-text-muted)" }}>
            {donor.donor_type || "Donor"} | {donor.committee_name || "Committee unavailable"}
          </div>
        </div>
        <Badge tone={influence >= 80 ? "danger" : influence >= 50 ? "demo" : "info"}>
          {influence}/100
        </Badge>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
        <div>
          <div className="vs-stat-label">Amount</div>
          <div style={{ marginTop: 4, fontSize: 14, fontWeight: 800 }}>
            {formatMoney(donor.amount || 0)}
          </div>
        </div>
        <div>
          <div className="vs-stat-label">Relationship</div>
          <div style={{ marginTop: 4, fontSize: 14, fontWeight: 800 }}>
            {donor.relationship_strength || "N/A"}
          </div>
        </div>
      </div>

      <div style={{ fontSize: "12px", color: "var(--vs-text-muted)", lineHeight: 1.45 }}>
        Source: {displaySource(donor.source)} | Contributions: {donor.contribution_count || 1}
      </div>

      <div style={{ fontSize: "12px", color: "var(--vs-text-muted)", lineHeight: 1.45 }}>
        {location || "Location unavailable"}
        {donor.employer || donor.occupation ? (
          <>
            <br />
            {[donor.employer, donor.occupation].filter(Boolean).join(" | ")}
          </>
        ) : null}
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
        cursor: "pointer",
        color: "var(--vs-text)",
        border: isActive ? "1px solid rgba(99, 102, 241, 0.55)" : undefined,
        boxShadow: isActive ? "0 0 0 1px rgba(99, 102, 241, 0.18)" : undefined,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--vs-text)" }}>
            {item.state}
          </div>
          <Badge tone={officeTone(item.office)}>{item.office}</Badge>
        </div>
        <div style={{ marginTop: "6px", fontSize: "12px", lineHeight: 1.45, color: "var(--vs-text-muted)" }}>
          {item.candidates?.length || 0} candidate signals | Top 5 shown
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "12px 18px",
          alignContent: "start",
          minHeight: "94px",
        }}
      >
        <div>
          <div className="vs-stat-label">Overlay Score</div>
          <div style={{ marginTop: "4px", fontSize: "18px", fontWeight: 800, color: "var(--vs-text)" }}>
            {item.overlayScore}
          </div>
        </div>
        <div>
          <div className="vs-stat-label">Tier</div>
          <div style={{ marginTop: "4px", fontSize: "13px", fontWeight: 700, color: "var(--vs-text)" }}>
            {item.overlayTier}
          </div>
        </div>
        <div>
          <div className="vs-stat-label">Total Receipts</div>
          <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 800, color: "var(--vs-text)" }}>
            {formatMoneyShort(item.totalReceipts || 0)}
          </div>
        </div>
        <div>
          <div className="vs-stat-label">Total Cash</div>
          <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: 800, color: "var(--vs-text)" }}>
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

function OfficeChip({ item, isActive, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="vs-card-muted"
      style={{
        padding: "10px 12px",
        textAlign: "left",
        cursor: "pointer",
        color: "var(--vs-text)",
        border: isActive ? "1px solid rgba(99, 102, 241, 0.55)" : undefined,
        boxShadow: isActive ? "0 0 0 1px rgba(99, 102, 241, 0.18)" : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--vs-text)" }}>
          {item.office}
        </div>
        <Badge tone={overlayTone(item.overlayTier)}>{item.overlayTier}</Badge>
      </div>
      <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--vs-text-muted)" }}>
        Score {item.overlayScore} | {formatMoneyShort(item.totalReceipts || 0)}
      </div>
    </button>
  );
}

function MapTooltip({ tooltip, onSelectOffice }) {
  if (!tooltip?.visible || !tooltip?.stateGroup?.state) return null;

  const { x, y, stateGroup } = tooltip;
  const overlays = stateGroup.overlays || [];

  return (
    <div
      style={{
        position: "fixed",
        left: x + 14,
        top: y + 14,
        zIndex: 60,
        width: 290,
        padding: "12px 14px",
        borderRadius: 16,
        background: "rgba(10, 14, 22, 0.97)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        boxShadow: "0 18px 40px rgba(0, 0, 0, 0.35)",
        color: "var(--vs-text)",
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: 800, lineHeight: 1.2 }}>
        {stateGroup.state}
      </div>
      <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--vs-text-muted)" }}>
        Top {Math.min(3, overlays.length)} office overlays
      </div>

      <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
        {overlays.slice(0, 3).map((item) => (
          <button
            key={item.state + "-" + item.office}
            type="button"
            onClick={() => onSelectOffice(item)}
            style={{
              pointerEvents: "auto",
              textAlign: "left",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              color: "var(--vs-text)",
              borderRadius: 12,
              padding: "10px 12px",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontSize: "13px", fontWeight: 800 }}>{item.office}</div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 7px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.08)",
                  textTransform: "capitalize",
                }}
              >
                {item.overlayTier}
              </span>
            </div>
            <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--vs-text-muted)" }}>
              Score {item.overlayScore} | {formatMoneyShort(item.totalReceipts || 0)}
            </div>
            <div style={{ marginTop: "6px", fontSize: "12px", color: "var(--vs-text-muted)" }}>
              Top signal:{" "}
              <span style={{ color: "var(--vs-text)", fontWeight: 700 }}>
                {item.candidates?.[0]?.name || "N/A"}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ElectionMapExecutiveHeader({
  mapData,
  filteredOverlays,
  overlaysByState,
  selectedOverlay,
  selectedCandidate,
  donorIntel,
  donorLoading,
  loading,
}) {
  const critical = filteredOverlays.filter((item) => String(item.overlayTier || "").toLowerCase() === "critical").length;
  const elevated = filteredOverlays.filter((item) => String(item.overlayTier || "").toLowerCase() === "elevated").length;
  const readinessScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        62 +
          Math.min(18, overlaysByState.length) +
          Math.min(12, filteredOverlays.length / 2) -
          Math.min(22, critical * 3)
      )
    )
  );

  return (
    <div className="election-exec-ribbon" id="election-overview">
      <div className="election-exec-copy">
        <span>Election Finance Overlay Readiness</span>
        <strong>{readinessScore}% Ready</strong>
        <p>
          Executive election map layer for live fundraising overlays, office-level pressure,
          candidate finance posture, donor intelligence, and state-by-state campaign intensity.
        </p>

        <div className="election-exec-badges">
          <Badge tone="active">{mapData.summary?.trackedStates || overlaysByState.length || 0} Tracked States</Badge>
          <Badge tone="accent">{filteredOverlays.length} Office Overlays</Badge>
          <Badge tone={critical ? "danger" : "active"}>{critical} Critical</Badge>
          <Badge tone={elevated ? "demo" : "active"}>{elevated} Elevated</Badge>
          <Badge tone={donorIntel.locked ? "demo" : "active"}>{donorIntel.source || "FEC Schedule A"}</Badge>
        </div>
      </div>

      <div className="election-exec-grid">
        <div>
          <span>Selected State</span>
          <strong>{selectedOverlay?.state || "None"}</strong>
        </div>
        <div>
          <span>Selected Office</span>
          <strong>{selectedOverlay?.office || "None"}</strong>
        </div>
        <div>
          <span>Selected Candidate</span>
          <strong>{selectedCandidate?.name || "None"}</strong>
        </div>
        <div>
          <span>Donor Intelligence</span>
          <strong>{donorLoading ? "Loading" : `${donorIntel.donors?.length || 0} Donors`}</strong>
        </div>
      </div>

      <div className="election-exec-actions">
        <button type="button" onClick={() => document.getElementById("election-map-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          Open Map
        </button>
        <button type="button" onClick={() => document.getElementById("election-overlay-detail")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          Overlay Detail
        </button>
        <button type="button" onClick={() => document.getElementById("election-donors-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}>
          Donor Intelligence
        </button>
        <button type="button" disabled={loading} onClick={() => window.location.reload()}>
          {loading ? "Loading Map..." : "Refresh Map"}
        </button>
      </div>
    </div>
  );
}

export default function ElectionMap() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mapData, setMapData] = useState({
    summary: {
      trackedStates: 0,
      overlays: 0,
      last_synced_at: null,
    },
    battlegrounds: [],
  });
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [donorIntel, setDonorIntel] = useState({
    donors: [],
    summary: {},
    stateBreakdown: [],
    committeeBreakdown: [],
    locked: false,
    source: "FEC Schedule A",
    error: "",
  });
  const [donorLoading, setDonorLoading] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [selectedOffice, setSelectedOffice] = useState("");
  const [selectedStateGroupKey, setSelectedStateGroupKey] = useState("");
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    stateGroup: null,
  });

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
            last_synced_at: null,
          },
          battlegrounds: [],
        };

        setMapData(payload);

        if (payload?.battlegrounds?.length) {
          setSelectedOverlay(payload.battlegrounds[0]);
          setSelectedStateGroupKey(payload.battlegrounds[0].state);
          setSelectedCandidate(payload.battlegrounds[0].candidates?.[0] || null);
        }
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load election map");
        setMapData({
          summary: {
            trackedStates: 0,
            overlays: 0,
            last_synced_at: null,
          },
          battlegrounds: [],
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
    return Array.from(new Set((mapData.battlegrounds || []).map((item) => item.state).filter(Boolean))).sort();
  }, [mapData.battlegrounds]);

  const officeOptions = useMemo(() => {
    return Array.from(new Set((mapData.battlegrounds || []).map((item) => item.office).filter(Boolean))).sort();
  }, [mapData.battlegrounds]);

  const filteredOverlays = useMemo(() => {
    return (mapData.battlegrounds || []).filter((item) => {
      if (selectedState && item.state !== selectedState) return false;
      if (selectedOffice && item.office !== selectedOffice) return false;
      return true;
    });
  }, [mapData.battlegrounds, selectedState, selectedOffice]);

  const overlaysByState = useMemo(() => {
    const grouped = new Map();
    for (const item of filteredOverlays) {
      if (!grouped.has(item.state)) grouped.set(item.state, []);
      grouped.get(item.state).push(item);
    }

    return Array.from(grouped.entries())
      .map(([state, overlays]) => {
        const sorted = [...overlays].sort((a, b) => b.overlayScore - a.overlayScore);
        return { state, overlays: sorted, strongest: sorted[0] };
      })
      .sort((a, b) => (b.strongest?.overlayScore || 0) - (a.strongest?.overlayScore || 0));
  }, [filteredOverlays]);

  const stateGroupByAbbr = useMemo(() => {
    const map = {};
    for (const group of overlaysByState) {
      const abbr = STATE_NAME_TO_ABBR[group.state] || group.state;
      map[abbr] = group;
    }
    return map;
  }, [overlaysByState]);

  const selectedStateGroup = useMemo(() => {
    if (!selectedStateGroupKey) return null;
    return overlaysByState.find((group) => group.state === selectedStateGroupKey) || null;
  }, [overlaysByState, selectedStateGroupKey]);

  useEffect(() => {
    if (!filteredOverlays.length) {
      setSelectedOverlay(null);
      setSelectedCandidate(null);
      setSelectedStateGroupKey("");
      return;
    }

    if (!selectedStateGroupKey || !overlaysByState.some((group) => group.state === selectedStateGroupKey)) {
      setSelectedStateGroupKey(overlaysByState[0]?.state || "");
    }
  }, [filteredOverlays, overlaysByState, selectedStateGroupKey]);

  useEffect(() => {
    if (!selectedStateGroup?.overlays?.length) {
      setSelectedOverlay(null);
      setSelectedCandidate(null);
      return;
    }

    const stillExists = selectedStateGroup.overlays.some(
      (item) =>
        item.state === selectedOverlay?.state &&
        item.office === selectedOverlay?.office
    );

    const nextOverlay = stillExists ? selectedOverlay : selectedStateGroup.overlays[0];
    setSelectedOverlay(nextOverlay || null);
  }, [selectedStateGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedOverlay?.candidates?.length) {
      setSelectedCandidate(null);
      return;
    }

    const stillExists = selectedOverlay.candidates.some(
      (candidate) => candidate.candidate_id === selectedCandidate?.candidate_id
    );

    setSelectedCandidate(stillExists ? selectedCandidate : selectedOverlay.candidates[0]);
  }, [selectedOverlay]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let active = true;

    async function loadDonors() {
      if (!selectedOverlay?.state) {
        setDonorIntel({
          donors: [],
          summary: {},
          stateBreakdown: [],
          committeeBreakdown: [],
          locked: false,
          source: "FEC Schedule A",
          error: "",
        });
        return;
      }

      try {
        setDonorLoading(true);

        const stateAbbr =
          STATE_NAME_TO_ABBR[selectedOverlay.state] ||
          selectedOverlay.state ||
          "";

        const candidateName = selectedCandidate?.name || "";
        const donorSearch =
          candidateName && candidateName.length >= 4 ? candidateName : "";

        const data = await loadDonorIntel({
          state: stateAbbr,
          cycle: "2026",
          limit: 25,
          live: 1,
          search: donorSearch,
          candidate_id: selectedCandidate?.candidate_id || "",
        });

        if (!active) return;

        const directResults = Array.isArray(data?.results) ? data.results : [];

        if (directResults.length || donorSearch === "") {
          setDonorIntel({
            donors: directResults.slice(0, 10),
            summary: data?.summary || {},
            stateBreakdown: data?.stateBreakdown || [],
            committeeBreakdown: data?.committeeBreakdown || [],
            locked: false,
            source: data?.summary?.source || "FEC Schedule A",
            error: "",
          });
          return;
        }

        const fallbackData = await loadDonorIntel({
          state: stateAbbr,
          cycle: "2026",
          limit: 25,
          live: 1,
        });

        if (!active) return;

        setDonorIntel({
          donors: Array.isArray(fallbackData?.results)
            ? fallbackData.results.slice(0, 10)
            : [],
          summary: fallbackData?.summary || {},
          stateBreakdown: fallbackData?.stateBreakdown || [],
          committeeBreakdown: fallbackData?.committeeBreakdown || [],
          locked: false,
          source: fallbackData?.summary?.source || "FEC Schedule A",
          error: "",
        });
      } catch (err) {
        if (!active) return;

        const status = err?.response?.status;

        setDonorIntel({
          donors: [],
          summary: {},
          stateBreakdown: [],
          committeeBreakdown: [],
          locked: status === 401 || status === 402,
          source: status === 401 || status === 402 ? "Enterprise required" : "Unavailable",
          error:
            err?.response?.data?.error ||
            err?.message ||
            "Failed to load donor intelligence",
        });
      } finally {
        if (active) setDonorLoading(false);
      }
    }

    loadDonors();

    return () => {
      active = false;
    };
  }, [
    selectedCandidate?.candidate_id,
    selectedCandidate?.name,
    selectedOverlay?.state,
  ]);

  const topOverlay = filteredOverlays[0] || null;

  const showTooltip = (event, stateGroup) => {
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      stateGroup,
    });
  };

  const moveTooltip = (event, stateGroup) => {
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      stateGroup,
    });
  };

  const hideTooltip = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  const selectStateGroup = (stateGroup) => {
    if (!stateGroup) return;
    setSelectedStateGroupKey(stateGroup.state);
    setSelectedOverlay(stateGroup.overlays?.[0] || null);
    setSelectedCandidate(stateGroup.overlays?.[0]?.candidates?.[0] || null);
  };

  const selectOfficeOverlay = (item) => {
    if (!item) return;
    setSelectedStateGroupKey(item.state);
    setSelectedOverlay(item);
    setSelectedCandidate(item.candidates?.[0] || null);
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  const navSections = [
    { id: "election-overview", label: "Overview" },
    { id: "election-filters", label: "Filters" },
    { id: "election-metrics", label: "Metrics" },
    { id: "election-map-section", label: "Map", badge: overlaysByState.length },
    { id: "election-candidates-section", label: "Candidates", badge: selectedOverlay?.candidates?.length || 0 },
    { id: "election-donors-section", label: "Donors", badge: donorIntel.donors?.length || 0 },
    { id: "election-overlay-detail", label: "Overlay Detail" },
    { id: "election-overlay-stack", label: "Overlay Stack", badge: filteredOverlays.length },
  ];

  return (
    <PageShell
      eyebrow="Election Map"
      title="Live fundraising overlays by state and office."
      description="Use finance intensity to see which states and offices are carrying the strongest live candidate signals."
      tickerItems={[
        { label: "Tracked States", value: String(mapData.summary?.trackedStates || 0), dotClass: "vs-live-dot" },
        { label: "Overlays", value: String(mapData.summary?.overlays || 0), dotClass: "vs-live-dot-warning" },
        { label: "Donor Source", value: donorIntel.source || "FEC Schedule A", dotClass: donorIntel.locked ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Last Sync", value: formatDateTime(mapData.summary?.last_synced_at), dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .election-exec-ribbon {
          display: grid;
          grid-template-columns: minmax(300px, 0.95fr) minmax(0, 1.15fr);
          gap: 18px;
          align-items: stretch;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.18), transparent 34%),
            radial-gradient(circle at bottom left, rgba(251, 146, 60, 0.12), transparent 30%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.86));
          box-shadow: 0 28px 80px rgba(2, 6, 23, 0.32);
          padding: 20px;
          min-width: 0;
          overflow: hidden;
        }

        .election-exec-copy {
          min-width: 0;
        }

        .election-exec-copy span,
        .election-exec-grid span {
          display: block;
          color: rgba(147, 197, 253, 0.86);
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .election-exec-copy strong {
          display: block;
          margin-top: 8px;
          color: white;
          font-size: clamp(30px, 4vw, 50px);
          line-height: 1;
          font-weight: 950;
          letter-spacing: -0.07em;
        }

        .election-exec-copy p {
          margin: 12px 0 0;
          color: rgba(226, 232, 240, 0.78);
          line-height: 1.6;
          max-width: 820px;
        }

        .election-exec-badges,
        .election-exec-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .election-exec-badges {
          margin-top: 14px;
        }

        .election-exec-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          min-width: 0;
        }

        .election-exec-grid div {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.34);
          padding: 14px;
          min-width: 0;
        }

        .election-exec-grid strong {
          display: block;
          margin-top: 7px;
          color: white;
          font-size: 20px;
          font-weight: 950;
          overflow-wrap: anywhere;
        }

        .election-exec-actions {
          grid-column: 1 / -1;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          padding-top: 14px;
        }

        .election-exec-actions button {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: rgba(226, 232, 240, 0.92);
          border-radius: 15px;
          padding: 11px 12px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }

        .election-exec-actions button:hover {
          border-color: rgba(251, 146, 60, 0.48);
          background: rgba(251, 146, 60, 0.14);
          color: white;
        }

        .election-exec-actions button:disabled {
          opacity: 0.62;
          cursor: not-allowed;
        }

        .election-exec-stack {
          display: grid;
          gap: 18px;
          min-width: 0;
        }

        .election-map-layout {
          display: grid;
          gap: 16px;
          grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr);
          align-items: start;
        }

        .election-left-stack {
          display: grid;
          gap: 16px;
          min-width: 0;
        }

        @media (max-width: 1200px) {
          .election-exec-ribbon,
          .election-map-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 760px) {
          .election-exec-grid {
            grid-template-columns: 1fr;
          }

          .election-exec-actions {
            align-items: stretch;
          }

          .election-exec-actions button {
            width: 100%;
          }
        }
      `}</style>

      <div className="election-exec-stack">
        <ElectionMapExecutiveHeader
          mapData={mapData}
          filteredOverlays={filteredOverlays}
          overlaysByState={overlaysByState}
          selectedOverlay={selectedOverlay}
          selectedCandidate={selectedCandidate}
          donorIntel={donorIntel}
          donorLoading={donorLoading}
          loading={loading}
        />

        <ExecutivePageNav sections={navSections} />
      </div>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <MapTooltip tooltip={tooltip} onSelectOffice={selectOfficeOverlay} />

      <div id="election-filters" data-tour="map-filters">
        <SectionCard
          title="Map Filters"
          subtitle="Filter by state and office to narrow the live overlay stack."
        >
          <div className="vs-grid-3">
            <select className="vs-select" value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
              <option value="">All states</option>
              {stateOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>

            <select className="vs-select" value={selectedOffice} onChange={(e) => setSelectedOffice(e.target.value)}>
              <option value="">All offices</option>
              {officeOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
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
      </div>

      <CollapsibleSection
        id="election-metrics"
        title="Election Finance Overlay Metrics"
        subtitle="Current state, overlay, donor, and FEC sync status."
        defaultOpen
        right={<Badge tone="active">{filteredOverlays.length || 0} Overlays</Badge>}
      >
        <div className="vs-grid-4">
          <StatCard label="Tracked States" value={String(mapData.summary?.trackedStates || 0)} delta="States with live finance overlays" tone="up" />
          <StatCard label="Overlay Count" value={String(filteredOverlays.length || 0)} delta="State-office combinations" tone="up" />
          <StatCard label="State Donors" value={String(donorIntel.donors?.length || 0)} delta={donorIntel.locked ? "Enterprise donor access required" : "Loaded from donor intelligence"} tone="up" />
          <StatCard label="Last Sync" value={formatDateTime(mapData.summary?.last_synced_at)} delta="Latest FEC finance ingestion" tone="up" />
        </div>
      </CollapsibleSection>

      <div className="election-map-layout">
        <div className="election-left-stack">
          <div id="election-map-section" data-tour="election-map-us">
            <SectionCard
              title="U.S. Finance Overlay Map"
              subtitle="Hover any highlighted state to preview its top 3 office overlays. Click to lock the state on the right."
              right={<Badge tone="info">{filteredOverlays.length} overlays</Badge>}
            >
              <div
                className="vs-card"
                style={{
                  padding: "12px",
                  height: "420px",
                  minHeight: "420px",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {loading ? (
                  <EmptyState text="Loading live map..." />
                ) : !overlaysByState.length ? (
                  <EmptyState text="No live overlays match the selected filters." />
                ) : (
                  <ComposableMap
                    projection="geoAlbersUsa"
                    projectionConfig={{ scale: 1040 }}
                    style={{
                      width: "100%",
                      maxWidth: "980px",
                      height: "390px",
                    }}
                  >
                    <Geographies geography={US_TOPO_JSON}>
                      {({ geographies }) =>
                        geographies.map((geo) => {
                          const stateName = geo.properties?.name;
                          const abbr = STATE_NAME_TO_ABBR[stateName];
                          const stateGroup = abbr ? stateGroupByAbbr[abbr] : null;
                          const strongest = stateGroup?.strongest || null;
                          const isActive = stateGroup?.state === selectedStateGroupKey;

                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              onMouseEnter={(event) => {
                                if (stateGroup) showTooltip(event, stateGroup);
                              }}
                              onMouseMove={(event) => {
                                if (stateGroup) moveTooltip(event, stateGroup);
                              }}
                              onMouseLeave={hideTooltip}
                              onClick={() => {
                                if (stateGroup) selectStateGroup(stateGroup);
                              }}
                              style={{
                                default: {
                                  fill: strongest ? getStateFill(strongest) : "#111827",
                                  stroke: "#374151",
                                  strokeWidth: isActive ? 1.5 : 0.75,
                                  outline: "none",
                                  cursor: stateGroup ? "pointer" : "default",
                                },
                                hover: {
                                  fill: strongest ? getStateFill(strongest) : "#1f2937",
                                  stroke: "#cbd5e1",
                                  strokeWidth: 1.4,
                                  outline: "none",
                                  cursor: stateGroup ? "pointer" : "default",
                                },
                                pressed: {
                                  fill: strongest ? getStateFill(strongest) : "#1f2937",
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

                    {overlaysByState.map((group) => {
                      const abbr = STATE_NAME_TO_ABBR[group.state];
                      const coords = abbr ? STATE_CENTROIDS[abbr] : null;
                      if (!coords) return null;

                      const isActive = selectedStateGroupKey === group.state;

                      return (
                        <Marker key={group.state} coordinates={coords}>
                          <circle
                            r={isActive ? 9 : 7}
                            fill="#f8fafc"
                            stroke="#111827"
                            strokeWidth={2}
                            style={{ cursor: "pointer" }}
                            onMouseEnter={(event) => showTooltip(event, group)}
                            onMouseMove={(event) => moveTooltip(event, group)}
                            onMouseLeave={hideTooltip}
                            onClick={() => selectStateGroup(group)}
                          />
                          <text
                            textAnchor="middle"
                            y={-12}
                            style={{
                              fontFamily: "inherit",
                              fill: "#e5e7eb",
                              fontSize: 10,
                              fontWeight: 700,
                              pointerEvents: "none",
                            }}
                          >
                            {STATE_NAME_TO_ABBR[group.state] || group.state}
                          </text>
                        </Marker>
                      );
                    })}
                  </ComposableMap>
                )}
              </div>
            </SectionCard>
          </div>

          <div id="election-candidates-section" data-tour="election-map-candidates">
            <SectionCard
              title="Candidates"
              subtitle={
                selectedOverlay
                  ? selectedOverlay.state + " | " + selectedOverlay.office + " candidate field"
                  : "Select an office overlay to inspect candidates."
              }
              right={
                selectedOverlay ? (
                  <Badge tone={overlayTone(selectedOverlay.overlayTier)}>
                    {selectedOverlay.overlayTier}
                  </Badge>
                ) : null
              }
            >
              {!selectedOverlay ? (
                <EmptyState text="Select an office overlay to view candidates." />
              ) : !(selectedOverlay.candidates || []).length ? (
                <EmptyState text="No candidates available for this overlay." />
              ) : (
                <ShowMoreList
                  items={selectedOverlay.candidates || []}
                  initialCount={8}
                  showAllLabel={(count) => `Show All ${count} Candidates`}
                  className="vs-stack"
                  renderItem={(candidate) => (
                    <CandidateCard
                      candidate={candidate}
                      isSelected={selectedCandidate?.candidate_id === candidate.candidate_id}
                      onSelect={setSelectedCandidate}
                    />
                  )}
                />
              )}
            </SectionCard>
          </div>

          <div id="election-donors-section" data-tour="election-map-donors">
            <SectionCard
              title={
                selectedCandidate
                  ? "Donor Intelligence | " + selectedCandidate.name
                  : "Donor Intelligence"
              }
              subtitle={
                selectedCandidate
                  ? "Showing protected donor intelligence for this candidate/state context."
                  : "Select a candidate to inspect donor records."
              }
              right={<Badge tone={donorIntel.locked ? "demo" : "active"}>{donorIntel.source}</Badge>}
            >
              {donorLoading ? (
                <EmptyState text="Loading donor intelligence..." />
              ) : donorIntel.locked ? (
                <EmptyState text="Donor Intelligence is available with an Enterprise subscription." />
              ) : !selectedCandidate ? (
                <EmptyState text="Select a candidate to load donor data." />
              ) : donorIntel.error ? (
                <EmptyState text={donorIntel.error} />
              ) : !donorIntel.donors.length ? (
                <EmptyState text="No donor intelligence available for this state/candidate yet." />
              ) : (
                <ShowMoreList
                  items={donorIntel.donors}
                  initialCount={8}
                  showAllLabel={(count) => `Show All ${count} Donors`}
                  className="vs-stack"
                  renderItem={(donor) => <DonorCard donor={donor} />}
                />
              )}
            </SectionCard>
          </div>
        </div>

        <div className="vs-stack">
          <div id="election-overlay-detail" data-tour="election-map-overlay-detail">
            <SectionCard
              title={
                selectedStateGroup
                  ? selectedStateGroup.state + " | Office Overlays"
                  : "Overlay Detail"
              }
              subtitle={
                selectedStateGroup
                  ? selectedStateGroup.overlays.length +
                    " office overlay" +
                    (selectedStateGroup.overlays.length === 1 ? "" : "s") +
                    " | Last synced " +
                    formatDateTime(mapData.summary?.last_synced_at)
                  : "Select a state to inspect all office overlays."
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
                {!selectedStateGroup ? (
                  <EmptyState text="Select a highlighted state to see all live office overlays." />
                ) : (
                  <>
                    <div className="vs-grid-3">
                      <StatCard
                        label="State Overlays"
                        value={String(selectedStateGroup.overlays?.length || 0)}
                        delta="Office overlays in state"
                        tone="up"
                      />
                      <StatCard
                        label="Top Receipts"
                        value={formatMoneyShort(selectedStateGroup.strongest?.totalReceipts || 0)}
                        delta={"Strongest office: " + (selectedStateGroup.strongest?.office || "N/A")}
                        tone="up"
                      />
                      <StatCard
                        label="Top Tier"
                        value={selectedStateGroup.strongest?.overlayTier || "N/A"}
                        delta={"Score " + (selectedStateGroup.strongest?.overlayScore || 0)}
                        tone="up"
                      />
                    </div>

                    <div style={{ display: "grid", gap: "10px" }}>
                      {(selectedStateGroup.overlays || []).map((item) => (
                        <OfficeChip
                          key={item.state + "-" + item.office}
                          item={item}
                          isActive={
                            selectedOverlay?.state === item.state &&
                            selectedOverlay?.office === item.office
                          }
                          onSelect={selectOfficeOverlay}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </SectionCard>
          </div>

          <div id="election-overlay-stack">
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
                <ShowMoreList
                  items={filteredOverlays}
                  initialCount={8}
                  showAllLabel={(count) => `Show All ${count} Overlays`}
                  className="vs-stack"
                  renderItem={(item) => (
                    <OverlayCard
                      item={item}
                      isActive={
                        selectedOverlay?.state === item.state &&
                        selectedOverlay?.office === item.office
                      }
                      onSelect={selectOfficeOverlay}
                    />
                  )}
                />
              )}
            </div>
          </SectionCard>
          </div>
        </div>
      </div>

      <BackToTopButton />
    </PageShell>
  );
}
