import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { api } from "../services/api";
import useRealtimeStream from "../hooks/useRealtimeStream";

function toneForStatus(status) {
  if (status === "sent") return "active";
  if (status === "failed") return "danger";
  if (status === "pending") return "demo";
  return "default";
}

function toneForSeverity(value) {
  const v = String(value || "").toLowerCase();
  if (v === "critical" || v === "high") return "danger";
  if (v === "medium") return "demo";
  return "info";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function eventLabel(type = "") {
  return String(type || "alert.signal")
    .replaceAll(".", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getPayload(item) {
  return item?.payload || item?.event || item || {};
}

function signalFamily(payload = {}) {
  const type = String(payload.event_type || payload.type || "").toLowerCase();
  const source = String(payload.source || "").toLowerCase();

  if (type.includes("mail") || source.includes("mail")) return "MailOps";
  if (type.includes("fundraising") || source.includes("fec")) return "Finance";
  if (type.includes("vendor")) return "Vendor";
  if (type.includes("polling")) return "Polling";
  if (type.includes("news")) return "News";
  return "Intelligence";
}

function DeliveryCard({ item, live = false }) {
  const payload = getPayload(item);
  const family = signalFamily(payload);

  return (
    <div
      className="vs-card"
      style={{
        padding: 16,
        display: "grid",
        gap: 12,
        borderLeft:
          item.status === "failed"
            ? "4px solid #f87171"
            : String(payload.severity || "").toLowerCase() === "high"
            ? "4px solid #fb7185"
            : "4px solid #4ade80",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 850 }}>
            {payload.event_title || payload.title || item.title || "Alert delivery"}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--vs-text-muted)" }}>
            {eventLabel(payload.event_type || payload.type)} • {payload.source || "VoterSpheres"} • {payload.state || "National"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
          {live ? <Badge tone="active">Live</Badge> : null}
          <Badge tone={toneForStatus(item.status)}>{item.status || "stream"}</Badge>
          <Badge tone={toneForSeverity(payload.severity)}>{payload.severity || "Medium"}</Badge>
          <Badge tone="info">{family}</Badge>
          {item.channel ? <Badge tone="default">{item.channel}</Badge> : null}
        </div>
      </div>

      <div className="vs-grid-4">
        <div>
          <div className="vs-stat-label">Office</div>
          <div style={{ marginTop: 4, fontWeight: 800 }}>{payload.office || "—"}</div>
        </div>
        <div>
          <div className="vs-stat-label">Risk</div>
          <div style={{ marginTop: 4, fontWeight: 800 }}>{payload.risk || "—"}</div>
        </div>
        <div>
          <div className="vs-stat-label">Candidate</div>
          <div style={{ marginTop: 4, fontWeight: 800 }}>{payload.candidate_name || "—"}</div>
        </div>
        <div>
          <div className="vs-stat-label">Time</div>
          <div style={{ marginTop: 4, fontWeight: 800 }}>
            {formatDate(item.sent_at || item.created_at || item.timestamp)}
          </div>
        </div>
      </div>

      {payload.detail || payload.description || payload.note ? (
        <div style={{ fontSize: 13, color: "var(--vs-text-muted)", lineHeight: 1.6 }}>
          {payload.detail || payload.description || payload.note}
        </div>
      ) : null}

      {item.error ? (
        <div className="vs-banner vs-banner-danger" style={{ marginTop: 4 }}>
          {item.error}
        </div>
      ) : null}
    </div>
  );
}

function RuleCard({ rule, onToggle }) {
  return (
    <div className="vs-card" style={{ padding: 16, display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 850 }}>{rule.name}</div>
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--vs-text-muted)" }}>
            {rule.channel} → {rule.destination}
          </div>
        </div>
        <Badge tone={rule.is_active ? "active" : "default"}>
          {rule.is_active ? "Active" : "Paused"}
        </Badge>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(rule.event_types || []).map((type) => (
          <Badge key={type} tone="info">{eventLabel(type)}</Badge>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 12, color: "var(--vs-text-muted)" }}>
          Min severity: <strong>{rule.min_severity || "Medium"}</strong>
        </div>
        <button type="button" className="vs-button vs-button-secondary" onClick={() => onToggle(rule)}>
          {rule.is_active ? "Pause" : "Activate"}
        </button>
      </div>
    </div>
  );
}

export default function AdminAlerts() {
  const [rules, setRules] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [liveSignals, setLiveSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState("");
  const [familyFilter, setFamilyFilter] = useState("All");

  useRealtimeStream(null, (event) => {
    if (!event?.type) return;

    const payload = event.payload?.alert || event.payload?.event || event.payload || {};

    setLiveSignals((prev) => [
      {
        id: event.id || `live-${Date.now()}`,
        status: "stream",
        channel: "realtime",
        timestamp: event.timestamp || new Date().toISOString(),
        payload: {
          ...payload,
          type: event.type,
          event_type: payload.event_type || event.type,
        },
      },
      ...prev,
    ].slice(0, 30));
  });

  async function loadAlerts() {
    const [rulesRes, deliveriesRes] = await Promise.all([
      api.get("/alerts/rules"),
      api.get("/alerts/deliveries?limit=100"),
    ]);

    setRules(rulesRes?.data?.results || []);
    setDeliveries(deliveriesRes?.data?.results || []);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");
        await loadAlerts();
      } catch (err) {
        if (!active) return;
        setError(err?.response?.data?.error || err?.message || "Failed to load alerts");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  async function dispatchNow() {
    try {
      setDispatching(true);
      setError("");
      await api.post("/alerts/dispatch", { limit: 25 });
      await loadAlerts();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to dispatch alerts");
    } finally {
      setDispatching(false);
    }
  }

  async function toggleRule(rule) {
    try {
      await api.put(`/alerts/rules/${rule.id}`, { is_active: !rule.is_active });
      await loadAlerts();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to update rule");
    }
  }

  const filteredDeliveries = useMemo(() => {
    if (familyFilter === "All") return deliveries;
    return deliveries.filter((item) => signalFamily(getPayload(item)) === familyFilter);
  }, [deliveries, familyFilter]);

  const filteredLiveSignals = useMemo(() => {
    if (familyFilter === "All") return liveSignals;
    return liveSignals.filter((item) => signalFamily(getPayload(item)) === familyFilter);
  }, [liveSignals, familyFilter]);

  const grouped = useMemo(() => {
    return {
      critical: filteredDeliveries.filter((d) => String(d.payload?.severity || "").toLowerCase() === "critical"),
      high: filteredDeliveries.filter((d) => String(d.payload?.severity || "").toLowerCase() === "high"),
      medium: filteredDeliveries.filter((d) => String(d.payload?.severity || "").toLowerCase() === "medium"),
      failed: filteredDeliveries.filter((d) => d.status === "failed"),
      sent: filteredDeliveries.filter((d) => d.status === "sent"),
    };
  }, [filteredDeliveries]);

  const metrics = [
    {
      label: "Active Rules",
      value: String(rules.filter((r) => r.is_active).length),
      delta: `${rules.length} total rules`,
      tone: "up",
    },
    {
      label: "Live Stream",
      value: String(liveSignals.length),
      delta: "Realtime session signals",
      tone: "up",
    },
    {
      label: "Failed Alerts",
      value: String(grouped.failed.length),
      delta: grouped.failed.length ? "Needs attention" : "Clean",
      tone: grouped.failed.length ? "down" : "up",
    },
    {
      label: "High Priority",
      value: String(grouped.high.length + grouped.critical.length),
      delta: "Executive-level signals",
      tone: grouped.high.length || grouped.critical.length ? "down" : "up",
    },
  ];

  const families = ["All", "MailOps", "Finance", "Vendor", "Polling", "News", "Intelligence"];

  return (
    <PageShell
      eyebrow="Admin"
      title="Live Alert Terminal"
      description="Bloomberg-style grouped alert monitoring for email, Slack, MailOps, finance, vendor gaps, polling, news, and executive feed signals."
      tickerItems={[
        { label: "Live", value: `${liveSignals.length}`, dotClass: "vs-live-dot-success" },
        { label: "High", value: `${grouped.high.length + grouped.critical.length}`, dotClass: "vs-live-dot" },
        { label: "Failed", value: `${grouped.failed.length}`, dotClass: grouped.failed.length ? "vs-live-dot" : "vs-live-dot-success" },
      ]}
    >
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {families.map((family) => (
            <button
              key={family}
              type="button"
              className={familyFilter === family ? "vs-button" : "vs-button vs-button-secondary"}
              onClick={() => setFamilyFilter(family)}
            >
              {family}
            </button>
          ))}
        </div>

        <button className="vs-button" onClick={dispatchNow} disabled={dispatching}>
          {dispatching ? "Dispatching..." : "Dispatch Alerts Now"}
        </button>
      </div>

      <div className="vs-grid-4">
        {metrics.map((m) => <StatCard key={m.label} {...m} />)}
      </div>

      <SectionCard title="Realtime Stream" subtitle="Signals arriving through the live SSE intelligence bus." right={<Badge tone="active">{filteredLiveSignals.length} live</Badge>}>
        <div className="vs-stack">
          {!filteredLiveSignals.length ? (
            <EmptyState text="No realtime alerts received in this browser session yet." />
          ) : (
            filteredLiveSignals.slice(0, 8).map((item) => (
              <DeliveryCard key={item.id} item={item} live />
            ))
          )}
        </div>
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
        <SectionCard title="Critical / High" subtitle="Top-priority executive alerts." right={<Badge tone="danger">{grouped.critical.length + grouped.high.length}</Badge>}>
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading priority alerts..." /> : [...grouped.critical, ...grouped.high].length ? (
              [...grouped.critical, ...grouped.high].slice(0, 8).map((item) => <DeliveryCard key={item.id} item={item} />)
            ) : (
              <EmptyState text="No critical or high alerts." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Medium" subtitle="Monitor-level alerts and watch items." right={<Badge tone="demo">{grouped.medium.length}</Badge>}>
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading medium alerts..." /> : grouped.medium.length ? (
              grouped.medium.slice(0, 8).map((item) => <DeliveryCard key={item.id} item={item} />)
            ) : (
              <EmptyState text="No medium alerts." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Failures" subtitle="Delivery attempts needing attention." right={<Badge tone={grouped.failed.length ? "danger" : "active"}>{grouped.failed.length}</Badge>}>
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading failures..." /> : grouped.failed.length ? (
              grouped.failed.slice(0, 8).map((item) => <DeliveryCard key={item.id} item={item} />)
            ) : (
              <EmptyState text="No failed deliveries." />
            )}
          </div>
        </SectionCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: 16 }}>
        <SectionCard title="Alert Rules" subtitle="Control what channels receive each signal type.">
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading rules..." /> : !rules.length ? (
              <EmptyState text="No alert rules configured yet." />
            ) : (
              rules.map((rule) => <RuleCard key={rule.id} rule={rule} onToggle={toggleRule} />)
            )}
          </div>
        </SectionCard>

        <SectionCard title="Delivery Tape" subtitle="Most recent delivery attempts across the filtered terminal." right={<Badge tone="info">{filteredDeliveries.length} recent</Badge>}>
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading delivery tape..." /> : !filteredDeliveries.length ? (
              <EmptyState text="No deliveries yet." />
            ) : (
              filteredDeliveries.slice(0, 20).map((item) => <DeliveryCard key={item.id} item={item} />)
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
