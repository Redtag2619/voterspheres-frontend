import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import { api } from "../services/api";
import useRealtimeStream from "../hooks/useRealtimeStream";

function toneForStatus(status) {
  const value = String(status || "").toLowerCase();
  if (value === "sent") return "active";
  if (value === "failed") return "danger";
  if (value === "pending") return "demo";
  if (value === "acknowledged") return "info";
  if (value === "escalated") return "danger";
  if (value === "resolved") return "active";
  if (value === "dismissed") return "default";
  return "default";
}

function toneForSeverity(value) {
  const v = String(value || "").toLowerCase();
  if (v === "critical" || v === "high") return "danger";
  if (v === "medium" || v === "watch") return "demo";
  if (v === "low") return "info";
  return "default";
}

function severityRank(value) {
  const v = String(value || "").toLowerCase();
  if (v === "critical") return 4;
  if (v === "high") return 3;
  if (v === "medium") return 2;
  if (v === "low") return 1;
  return 0;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function eventLabel(type = "") {
  return String(type || "alert.signal")
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getPayload(item) {
  return item?.payload || item?.event || item?.metadata || item || {};
}

function signalFamily(payload = {}) {
  const type = String(payload.event_type || payload.type || "").toLowerCase();
  const source = String(payload.source || "").toLowerCase();

  if (type.includes("dark") || source.includes("dark")) return "Dark Money";
  if (type.includes("consultant") || source.includes("consultant")) return "Consultant";
  if (type.includes("relationship") || source.includes("relationship")) return "Relationship";
  if (type.includes("mail") || source.includes("mail")) return "MailOps";
  if (type.includes("fundraising") || source.includes("fec") || source.includes("finance")) return "Finance";
  if (type.includes("vendor")) return "Vendor";
  if (type.includes("polling")) return "Polling";
  if (type.includes("news")) return "News";
  return "Intelligence";
}

function normalizeExecutiveAlert(alert = {}) {
  return {
    id: alert.id || `${alert.type || "alert"}-${alert.title || Date.now()}`,
    status: alert.status || alert.action_status || "open",
    channel: alert.channel || "executive",
    sent_at: alert.sent_at || alert.created_at || alert.generated_at || new Date().toISOString(),
    payload: {
      ...alert.metadata,
      ...alert,
      event_type: alert.type || alert.event_type || "executive.alert",
      title: alert.title || "Executive alert",
      severity: alert.severity || "medium",
      source: alert.source || "Executive Alert Engine",
      state: alert.state || "National",
      office: alert.office || "N/A",
      risk: alert.risk || alert.risk_label || "Monitor",
      detail: alert.recommendation || alert.message || alert.detail || "Review and assign owner.",
    },
  };
}

function buildActionPayload(item, status, notes = "") {
  const payload = getPayload(item);
  return {
    alert_key: item.alert_key || item.id || payload.id || `${payload.event_type || payload.type}-${payload.title}`,
    alert_type: payload.event_type || payload.type || item.type || "executive_alert",
    campaign_id: item.campaign_id || payload.campaign_id || null,
    entity_id: item.entity_id || payload.entity_id || null,
    notes,
    status,
  };
}

function DeliveryCard({
  item,
  live = false,
  onAcknowledge,
  onEscalate,
  onResolve,
  onDismiss,
}) {
  const payload = getPayload(item);
  const family = signalFamily(payload);
  const severity = String(payload.severity || item.severity || "medium").toLowerCase();
  const status = item.local_status || item.status || "open";

  return (
    <div
      className="vs-card"
      style={{
        padding: 16,
        display: "grid",
        gap: 12,
        borderLeft:
          status === "escalated" || severity === "critical"
            ? "4px solid #ef4444"
            : severity === "high"
            ? "4px solid #fb7185"
            : status === "acknowledged"
            ? "4px solid #60a5fa"
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
          <Badge tone={toneForStatus(status)}>{status}</Badge>
          <Badge tone={toneForSeverity(severity)}>{payload.severity || "Medium"}</Badge>
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="vs-button vs-button-secondary" onClick={() => onAcknowledge(item)}>
          Acknowledge
        </button>
        <button type="button" className="vs-button" onClick={() => onEscalate(item)}>
          Escalate
        </button>
        <button type="button" className="vs-button vs-button-secondary" onClick={() => onResolve(item)}>
          Resolve
        </button>
        <button type="button" className="vs-button vs-button-secondary" onClick={() => onDismiss(item)}>
          Dismiss
        </button>
      </div>

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
          <Badge key={type} tone="info">
            {eventLabel(type)}
          </Badge>
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
  const [executiveAlerts, setExecutiveAlerts] = useState([]);
  const [liveSignals, setLiveSignals] = useState([]);
  const [localStatuses, setLocalStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState("");
  const [familyFilter, setFamilyFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  useRealtimeStream(null, (event) => {
    if (!event?.type) return;

    const payload = event.payload?.alert || event.payload?.event || event.payload || {};

    setLiveSignals((prev) =>
      [
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
      ].slice(0, 30)
    );
  });

  function applyLocalStatus(item) {
    const id = item.id || item.alert_key || item.payload?.id;
    if (!id || !localStatuses[id]) return item;
    return {
      ...item,
      local_status: localStatuses[id],
    };
  }

  async function loadAlerts() {
    const [rulesRes, deliveriesRes, executiveRes] = await Promise.all([
      api.get("/alerts/rules"),
      api.get("/alerts/deliveries?limit=100"),
      api.executiveAlerts
        ? api.executiveAlerts({ limit: 100 })
        : api.get("/executive-alerts", { params: { limit: 100 } }).then((r) => r.data),
    ]);

    setRules(rulesRes?.data?.results || []);
    setDeliveries(deliveriesRes?.data?.results || []);
    setExecutiveAlerts((executiveRes?.alerts || []).map(normalizeExecutiveAlert));
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

  function markLocal(item, status) {
    const id = item.id || item.alert_key || item.payload?.id;
    if (!id) return;

    setLocalStatuses((prev) => ({
      ...prev,
      [id]: status,
    }));
  }

  function acknowledgeAlert(item) {
    markLocal(item, "acknowledged");
  }

  async function escalateAlert(item) {
    try {
      markLocal(item, "escalated");
      await api.post("/alerts/dispatch", {
        ...buildActionPayload(item, "escalated", "Escalated from Executive Alert Terminal"),
        escalation: true,
      });
      await loadAlerts();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to escalate alert");
    }
  }

  async function resolveAlert(item) {
    try {
      markLocal(item, "resolved");
      await api.post("/alerts/resolve", buildActionPayload(item, "resolved", "Resolved from Executive Alert Terminal"));
      await loadAlerts();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to resolve alert");
    }
  }

  async function dismissAlert(item) {
    try {
      markLocal(item, "dismissed");
      await api.post("/alerts/dismiss", buildActionPayload(item, "dismissed", "Dismissed from Executive Alert Terminal"));
      await loadAlerts();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to dismiss alert");
    }
  }

  const allTerminalItems = useMemo(() => {
    return [...executiveAlerts, ...deliveries, ...liveSignals]
      .map(applyLocalStatus)
      .sort((a, b) => {
        const ap = getPayload(a);
        const bp = getPayload(b);

        const severityDiff =
          severityRank(bp.severity || b.severity) - severityRank(ap.severity || a.severity);

        if (severityDiff !== 0) return severityDiff;

        return (
          new Date(b.sent_at || b.created_at || b.timestamp || 0).getTime() -
          new Date(a.sent_at || a.created_at || a.timestamp || 0).getTime()
        );
      });
  }, [executiveAlerts, deliveries, liveSignals, localStatuses]);

  const filteredItems = useMemo(() => {
    return allTerminalItems.filter((item) => {
      const payload = getPayload(item);
      const family = signalFamily(payload);
      const severity = String(payload.severity || item.severity || "").toLowerCase();
      const status = String(item.local_status || item.status || "open").toLowerCase();

      const familyOk = familyFilter === "All" || family === familyFilter;
      const severityOk = severityFilter === "All" || severity === severityFilter.toLowerCase();
      const statusOk = statusFilter === "All" || status === statusFilter.toLowerCase();

      return familyOk && severityOk && statusOk;
    });
  }, [allTerminalItems, familyFilter, severityFilter, statusFilter]);

  const grouped = useMemo(() => {
    return {
      critical: filteredItems.filter((d) => String(getPayload(d).severity || "").toLowerCase() === "critical"),
      high: filteredItems.filter((d) => String(getPayload(d).severity || "").toLowerCase() === "high"),
      medium: filteredItems.filter((d) => String(getPayload(d).severity || "").toLowerCase() === "medium"),
      failed: filteredItems.filter((d) => String(d.status || "").toLowerCase() === "failed"),
      escalated: filteredItems.filter((d) => String(d.local_status || d.status || "").toLowerCase() === "escalated"),
      acknowledged: filteredItems.filter((d) => String(d.local_status || d.status || "").toLowerCase() === "acknowledged"),
    };
  }, [filteredItems]);

  const metrics = [
    {
      label: "Executive Alerts",
      value: String(executiveAlerts.length),
      delta: "Generated by alert engine",
      tone: executiveAlerts.length ? "down" : "up",
    },
    {
      label: "Critical / High",
      value: String(grouped.critical.length + grouped.high.length),
      delta: "Needs executive review",
      tone: grouped.critical.length || grouped.high.length ? "down" : "up",
    },
    {
      label: "Escalated",
      value: String(grouped.escalated.length),
      delta: "Manually escalated",
      tone: grouped.escalated.length ? "down" : "up",
    },
    {
      label: "Live Stream",
      value: String(liveSignals.length),
      delta: "Realtime session signals",
      tone: "up",
    },
  ];

  const families = [
    "All",
    "Dark Money",
    "Consultant",
    "Relationship",
    "MailOps",
    "Finance",
    "Vendor",
    "Polling",
    "News",
    "Intelligence",
  ];

  const severities = ["All", "critical", "high", "medium", "low"];
  const statuses = ["All", "open", "sent", "stream", "acknowledged", "escalated", "resolved", "dismissed", "failed"];

  return (
    <PageShell
      eyebrow="Admin"
      title="Executive Alert Terminal"
      description="Manage, filter, acknowledge, resolve, dismiss, and escalate executive alerts from consultant exposure, dark money, relationship graph, MailOps, finance, vendor gaps, polling, and news signals."
      tickerItems={[
        { label: "Executive", value: `${executiveAlerts.length}`, dotClass: "vs-live-dot-success" },
        { label: "Critical/High", value: `${grouped.critical.length + grouped.high.length}`, dotClass: "vs-live-dot" },
        { label: "Escalated", value: `${grouped.escalated.length}`, dotClass: grouped.escalated.length ? "vs-live-dot" : "vs-live-dot-success" },
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

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {severities.map((severity) => (
          <button
            key={severity}
            type="button"
            className={severityFilter === severity ? "vs-button" : "vs-button vs-button-secondary"}
            onClick={() => setSeverityFilter(severity)}
          >
            {severity === "All" ? "All Severities" : eventLabel(severity)}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {statuses.map((status) => (
          <button
            key={status}
            type="button"
            className={statusFilter === status ? "vs-button" : "vs-button vs-button-secondary"}
            onClick={() => setStatusFilter(status)}
          >
            {status === "All" ? "All Statuses" : eventLabel(status)}
          </button>
        ))}
      </div>

      <div className="vs-grid-4">
        {metrics.map((m) => (
          <StatCard key={m.label} {...m} />
        ))}
      </div>

      <SectionCard
        title="Executive Alert Queue"
        subtitle="Highest-priority actionable alerts from the Executive Alert Engine and live delivery system."
        right={<Badge tone={filteredItems.length ? "danger" : "active"}>{filteredItems.length} visible</Badge>}
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading executive alert terminal..." />
          ) : filteredItems.length ? (
            filteredItems.slice(0, 25).map((item) => (
              <DeliveryCard
                key={item.id || item.alert_key}
                item={item}
                live={String(item.status || "").toLowerCase() === "stream"}
                onAcknowledge={acknowledgeAlert}
                onEscalate={escalateAlert}
                onResolve={resolveAlert}
                onDismiss={dismissAlert}
              />
            ))
          ) : (
            <EmptyState text="No alerts match the current filters." />
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Realtime Stream"
        subtitle="Signals arriving through the live SSE intelligence bus."
        right={<Badge tone="active">{liveSignals.length} live</Badge>}
      >
        <div className="vs-stack">
          {!liveSignals.length ? (
            <EmptyState text="No realtime alerts received in this browser session yet." />
          ) : (
            liveSignals.slice(0, 8).map((item) => (
              <DeliveryCard
                key={item.id}
                item={applyLocalStatus(item)}
                live
                onAcknowledge={acknowledgeAlert}
                onEscalate={escalateAlert}
                onResolve={resolveAlert}
                onDismiss={dismissAlert}
              />
            ))
          )}
        </div>
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
        <SectionCard title="Critical / High" subtitle="Top-priority executive alerts." right={<Badge tone="danger">{grouped.critical.length + grouped.high.length}</Badge>}>
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading priority alerts..." />
            ) : [...grouped.critical, ...grouped.high].length ? (
              [...grouped.critical, ...grouped.high].slice(0, 8).map((item) => (
                <DeliveryCard
                  key={item.id}
                  item={item}
                  onAcknowledge={acknowledgeAlert}
                  onEscalate={escalateAlert}
                  onResolve={resolveAlert}
                  onDismiss={dismissAlert}
                />
              ))
            ) : (
              <EmptyState text="No critical or high alerts." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Acknowledged / Escalated" subtitle="Manually triaged alerts." right={<Badge tone="info">{grouped.acknowledged.length + grouped.escalated.length}</Badge>}>
          <div className="vs-stack">
            {[...grouped.escalated, ...grouped.acknowledged].length ? (
              [...grouped.escalated, ...grouped.acknowledged].slice(0, 8).map((item) => (
                <DeliveryCard
                  key={item.id}
                  item={item}
                  onAcknowledge={acknowledgeAlert}
                  onEscalate={escalateAlert}
                  onResolve={resolveAlert}
                  onDismiss={dismissAlert}
                />
              ))
            ) : (
              <EmptyState text="No acknowledged or escalated alerts yet." />
            )}
          </div>
        </SectionCard>

        <SectionCard title="Failures" subtitle="Delivery attempts needing attention." right={<Badge tone={grouped.failed.length ? "danger" : "active"}>{grouped.failed.length}</Badge>}>
          <div className="vs-stack">
            {grouped.failed.length ? (
              grouped.failed.slice(0, 8).map((item) => (
                <DeliveryCard
                  key={item.id}
                  item={item}
                  onAcknowledge={acknowledgeAlert}
                  onEscalate={escalateAlert}
                  onResolve={resolveAlert}
                  onDismiss={dismissAlert}
                />
              ))
            ) : (
              <EmptyState text="No failed deliveries." />
            )}
          </div>
        </SectionCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.1fr)", gap: 16 }}>
        <SectionCard title="Alert Rules" subtitle="Control what channels receive each signal type.">
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading rules..." />
            ) : !rules.length ? (
              <EmptyState text="No alert rules configured yet." />
            ) : (
              rules.map((rule) => <RuleCard key={rule.id} rule={rule} onToggle={toggleRule} />)
            )}
          </div>
        </SectionCard>

        <SectionCard title="Delivery Tape" subtitle="Most recent delivery attempts across the filtered terminal." right={<Badge tone="info">{deliveries.length} recent</Badge>}>
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading delivery tape..." />
            ) : !deliveries.length ? (
              <EmptyState text="No deliveries yet." />
            ) : (
              deliveries.slice(0, 20).map((item) => (
                <DeliveryCard
                  key={item.id}
                  item={applyLocalStatus(item)}
                  onAcknowledge={acknowledgeAlert}
                  onEscalate={escalateAlert}
                  onResolve={resolveAlert}
                  onDismiss={dismissAlert}
                />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
