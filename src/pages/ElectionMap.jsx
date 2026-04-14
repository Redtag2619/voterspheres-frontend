import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

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
        <div style={{ fontSize: "15px", fontWeight: 800, lineHeight: 1.15, color: "var(--vs-text)" }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "16px", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", color: "var(--vs-text)" }}>
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
          summary: { trackedStates: 0, overlays: 0, last_synced_at: null },
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

  useEffect(() => {
    if (!filteredOverlays.length) {
      setSelectedOverlay(null);
      return;
    }

    const stillExists = filteredOverlays.some(
      (item) => item.state === selectedOverlay?.state && item.office === selectedOverlay?.office
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
        { label: "Tracked States", value: String(mapData.summary?.trackedStates || 0), dotClass: "vs-live-dot" },
        { label: "Overlays", value: String(mapData.summary?.overlays || 0), dotClass: "vs-live-dot-warning" },
        { label: "Last Sync", value: formatDateTime(mapData.summary?.last_synced_at), dotClass: "vs-live-dot-success" }
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
              <option key={value} value={value}>{value}</option>
            ))}
          </select>

          <select
            className="vs-select"
            value={selectedOffice}
            onChange={(e) => setSelectedOffice(e.target.value)}
          >
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

      <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "minmax(0, 1.1fr) minmax(360px, 0.9fr)" }}>
        <SectionCard
          title="Live Overlay Stack"
          subtitle="Ranked state-office finance signals from the current live table."
          right={<Badge tone="info">{filteredOverlays.length} overlays</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading map overlays..." />
            ) : !filteredOverlays.length ? (
              <EmptyState text="No live overlays match the selected filters." />
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

        <SectionCard
          title={selectedOverlay ? `${selectedOverlay.state} • ${selectedOverlay.office}` : "Overlay Detail"}
          subtitle={
            selectedOverlay
              ? `Overlay score ${selectedOverlay.overlayScore} • Tier ${selectedOverlay.overlayTier} • Last synced ${formatDateTime(mapData.summary?.last_synced_at)}`
              : "Select an overlay to inspect live candidate finance detail."
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
    </PageShell>
  );
}
