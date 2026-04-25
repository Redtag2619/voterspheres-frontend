import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import DemoBanner from "../components/ui/DemoBanner";
import { useDemoMode } from "../context/DemoModeContext.jsx";
import { useExecutiveFilters } from "../context/ExecutiveFiltersContext.jsx";
import useRealtimeStream from "../hooks/useRealtimeStream";

function toneForStatus(value) {
  const v = String(value || "").toLowerCase();
  if (v === "elevated" || v === "delayed") return "danger";
  if (v === "on track" || v === "delivered" || v === "resolved") return "active";
  if (v === "scheduled" || v === "in transit") return "info";
  if (v === "pending") return "demo";
  return "default";
}

function toneForSeverity(value) {
  const v = String(value || "").toLowerCase();
  if (v === "high") return "danger";
  if (v === "medium") return "demo";
  if (v === "low") return "info";
  return "default";
}

function DropRow({ row }) {
  return (
    <ResponsiveRow
      title={row.campaign}
      subtitle={`${row.location} • In-home ${row.in_home || "TBD"}`}
      meta={[
        { label: "Status", value: row.status },
        { label: "Location", value: row.location },
      ]}
      alert={
        String(row.status || "").toLowerCase() === "elevated"
          ? "vs-live-dot"
          : "vs-live-dot-success"
      }
      right={<Badge tone={toneForStatus(row.status)}>{row.status}</Badge>}
    />
  );
}

function AlertRow({ row }) {
  return (
    <ResponsiveRow
      title={row.title}
      subtitle={`${row.source} • ${row.detail}`}
      meta={[
        { label: "Severity", value: row.severity },
        { label: "Source", value: row.source },
      ]}
      alert={
        String(row.severity || "").toLowerCase() === "high"
          ? "vs-live-dot"
          : "vs-live-dot-warning"
      }
      right={<Badge tone={toneForSeverity(row.severity)}>{row.severity}</Badge>}
    />
  );
}

function EventRow({ row, draft, onDraftChange, onSave, saving }) {
  return (
    <div className="vs-card-muted">
      <div className="vs-responsive-row" style={{ gap: "12px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span
              className={
                String(row.severity || "").toLowerCase() === "high"
                  ? "vs-live-dot"
                  : "vs-live-dot-warning"
              }
            />
            <div style={{ fontSize: "14px", fontWeight: 800, lineHeight: 1.35, color: "var(--vs-text)" }}>
              {row.campaign}
            </div>
            <Badge tone={toneForSeverity(row.severity)}>{row.severity}</Badge>
            <Badge tone={toneForStatus(row.status)}>{row.status}</Badge>
          </div>

          <div style={{ marginTop: "6px", fontSize: "13px", lineHeight: 1.6, color: "var(--vs-text-muted)" }}>
            {row.location} • {row.state} • {row.office} • {row.event_type}
          </div>

          <div style={{ marginTop: "8px", fontSize: "12px", lineHeight: 1.6, color: "var(--vs-text-muted)" }}>
            {row.note || "No note yet."}
          </div>
        </div>

        <div style={{ display: "grid", gap: "10px", minWidth: 0 }}>
          <div className="vs-grid-2">
            <select
              className="vs-select"
              value={draft.status}
              onChange={(e) => onDraftChange(row.id, { ...draft, status: e.target.value })}
            >
              <option value="Pending">Pending</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Transit">In Transit</option>
              <option value="On Track">On Track</option>
              <option value="Elevated">Elevated</option>
              <option value="Delivered">Delivered</option>
              <option value="Delayed">Delayed</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              className="vs-select"
              value={draft.severity}
              onChange={(e) => onDraftChange(row.id, { ...draft, severity: e.target.value })}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <textarea
            className="vs-textarea"
            rows={3}
            value={draft.note}
            onChange={(e) => onDraftChange(row.id, { ...draft, note: e.target.value })}
            placeholder="Update operational note..."
          />

          <div className="vs-inline-actions">
            <button
              type="button"
              className="vs-button vs-button-primary"
              onClick={() => onSave(row.id)}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const fallbackData = {
  metrics: [
    { label: "Mail Drops", value: "18", delta: "4 active today", tone: "up" },
    { label: "Delivery Risk", value: "3", delta: "2 elevated", tone: "down" },
    { label: "Postal Alerts", value: "7", delta: "Live monitoring", tone: "up" },
    { label: "On-Time Rate", value: "94%", delta: "+2.1%", tone: "up" },
  ],
  drops: [],
  alerts: [],
  _demo: true,
};

const fallbackEvents = {
  results: [],
  _demo: true,
};

export default function MailOpsDashboard() {
  const { demoMode } = useDemoMode();
  const { filters } = useExecutiveFilters();

  const [loading, setLoading] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [error, setError] = useState("");
  const [eventError, setEventError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [data, setData] = useState(fallbackData);
  const [eventsData, setEventsData] = useState(fallbackEvents);
  const [isDemoData, setIsDemoData] = useState(Boolean(fallbackData._demo));
  const [isDemoEvents, setIsDemoEvents] = useState(Boolean(fallbackEvents._demo));
  const [savingEventId, setSavingEventId] = useState(null);
  const [creatingEvent, setCreatingEvent] = useState(false);

  const [composer, setComposer] = useState({
    campaign: "",
    state: filters.state || "",
    office: filters.office || "",
    risk: filters.risk || "",
    location: "",
    vendor_name: "",
    event_type: "mail_update",
    status: "Pending",
    severity: "Medium",
    event_time: "",
    in_home: "",
    note: "",
  });

  const [eventDrafts, setEventDrafts] = useState({});

  useRealtimeStream("intelligence:mailops", (event) => {
    const payload = event?.payload || {};
    const liveEvent = payload.event || null;
    const liveAlert = payload.alert || null;

    if (liveEvent) {
      setEventsData((prev) => {
        const existing = prev?.results || [];
        const withoutDuplicate = existing.filter((row) => row.id !== liveEvent.id);

        return {
          ...(prev || {}),
          results: [liveEvent, ...withoutDuplicate].slice(0, 100),
          _demo: false,
          demo: false,
        };
      });

      setData((prev) => {
        const existingDrops = prev?.drops || [];
        const withoutDuplicateDrops = existingDrops.filter((row) => row.id !== liveEvent.id);

        return {
          ...(prev || fallbackData),
          drops: [liveEvent, ...withoutDuplicateDrops].slice(0, 10),
          _demo: false,
          demo: false,
        };
      });

      setIsDemoEvents(false);
      setIsDemoData(false);
      setSuccessMessage(`Live MailOps update received: ${liveEvent.campaign || "New event"}`);
    }

    if (liveAlert) {
      setData((prev) => {
        const existingAlerts = prev?.alerts || [];
        const withoutDuplicateAlerts = existingAlerts.filter((row) => row.id !== liveAlert.id);

        return {
          ...(prev || fallbackData),
          alerts: [liveAlert, ...withoutDuplicateAlerts].slice(0, 10),
          _demo: false,
          demo: false,
        };
      });

      setIsDemoData(false);
    }
  });

  useEffect(() => {
    setComposer((prev) => ({
      ...prev,
      state: filters.state || prev.state || "",
      office: filters.office || prev.office || "",
      risk: filters.risk || prev.risk || "",
    }));
  }, [filters.state, filters.office, filters.risk]);

  useEffect(() => {
    let active = true;

    async function loadMailOps() {
      try {
        setLoading(true);
        setError("");

        const response = await api.mailOpsDashboard();

        if (!active) return;

        setData(response || fallbackData);
        setIsDemoData(Boolean(response?._demo || response?.demo));
      } catch (err) {
        if (!active) return;

        setError(err?.response?.data?.error || err?.message || "Failed to load MailOps dashboard");
        setData(fallbackData);
        setIsDemoData(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadMailOps();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadEvents() {
      try {
        setLoadingEvents(true);
        setEventError("");

        const params = {};
        if (filters.state) params.state = filters.state;
        if (filters.office) params.office = filters.office;
        if (filters.risk) params.risk = filters.risk;

        const response = api.mailOpsEvents
          ? await api.mailOpsEvents(params)
          : (await api.get("/mailops/events", { params })).data;

        if (!active) return;

        setEventsData(response || fallbackEvents);
        setIsDemoEvents(Boolean(response?._demo || response?.demo));
      } catch (err) {
        if (!active) return;

        setEventError(err?.response?.data?.error || err?.message || "Failed to load MailOps events");
        setEventsData(fallbackEvents);
        setIsDemoEvents(true);
      } finally {
        if (active) setLoadingEvents(false);
      }
    }

    loadEvents();

    return () => {
      active = false;
    };
  }, [filters.state, filters.office, filters.risk]);

  const drops = useMemo(() => data?.drops || [], [data]);
  const alerts = useMemo(() => data?.alerts || [], [data]);
  const events = useMemo(() => eventsData?.results || [], [eventsData]);

  useEffect(() => {
    const nextDrafts = {};
    events.forEach((event) => {
      nextDrafts[event.id] = {
        status: event.status || "Pending",
        severity: event.severity || "Medium",
        note: event.note || "",
      };
    });
    setEventDrafts(nextDrafts);
  }, [events]);

  const elevatedDrops = drops.filter((row) => String(row.status || "").toLowerCase() === "elevated").length;
  const highAlerts = alerts.filter((row) => String(row.severity || "").toLowerCase() === "high").length;

  async function refreshEvents() {
    const params = {};
    if (filters.state) params.state = filters.state;
    if (filters.office) params.office = filters.office;
    if (filters.risk) params.risk = filters.risk;

    const response = api.mailOpsEvents
      ? await api.mailOpsEvents(params)
      : (await api.get("/mailops/events", { params })).data;

    setEventsData(response || fallbackEvents);
    setIsDemoEvents(Boolean(response?._demo || response?.demo));
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    setEventError("");
    setSuccessMessage("");
    setCreatingEvent(true);

    try {
      const payload = {
        ...composer,
        event_time: composer.event_time || null,
        in_home: composer.in_home || null,
      };

      if (api.createMailOpsEvent) {
        await api.createMailOpsEvent(payload);
      } else {
        await api.post("/mailops/events", payload);
      }

      setSuccessMessage("MailOps event created successfully.");
      setComposer({
        campaign: "",
        state: filters.state || "",
        office: filters.office || "",
        risk: filters.risk || "",
        location: "",
        vendor_name: "",
        event_type: "mail_update",
        status: "Pending",
        severity: "Medium",
        event_time: "",
        in_home: "",
        note: "",
      });

      await refreshEvents();
    } catch (err) {
      setEventError(err?.response?.data?.error || err?.message || "Failed to create MailOps event");
    } finally {
      setCreatingEvent(false);
    }
  }

  function handleDraftChange(eventId, nextDraft) {
    setEventDrafts((prev) => ({
      ...prev,
      [eventId]: nextDraft,
    }));
  }

  async function handleSaveEvent(eventId) {
    setEventError("");
    setSuccessMessage("");
    setSavingEventId(eventId);

    try {
      const draft = eventDrafts[eventId];
      if (!draft) return;

      if (api.updateMailOpsEvent) {
        await api.updateMailOpsEvent(eventId, draft);
      } else {
        await api.patch(`/mailops/events/${eventId}`, draft);
      }

      setSuccessMessage(`MailOps event #${eventId} updated successfully.`);
      await refreshEvents();
    } catch (err) {
      setEventError(err?.response?.data?.error || err?.message || "Failed to update MailOps event");
    } finally {
      setSavingEventId(null);
    }
  }

  return (
    <PageShell
      eyebrow="MailOps Dashboard"
      title="Track mail execution, delivery risk, and postal disruption."
      description="Monitor drop performance, scan stability, in-home timing, and operational alerts from one executive mail view."
      demo={demoMode}
      demoText="Global Demo Mode is active. This module can render fallback MailOps data when live endpoints are unavailable."
      tickerItems={[
        { label: "Drops", value: `${drops.length}`, dotClass: "vs-live-dot-success" },
        { label: "Elevated", value: `${elevatedDrops}`, dotClass: "vs-live-dot" },
        { label: "Alerts", value: `${highAlerts} high`, dotClass: "vs-live-dot-warning" },
      ]}
    >
      <DemoBanner active={isDemoData || isDemoEvents} text="Demo MailOps data is active for part of this module." />

      {filters.state || filters.office || filters.risk ? (
        <div className="vs-banner">
          Executive filters are active for this session:
          {filters.state ? ` state: ${filters.state};` : ""}
          {filters.office ? ` office: ${filters.office};` : ""}
          {filters.risk ? ` risk: ${filters.risk};` : ""}
        </div>
      ) : null}

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {eventError ? <div className="vs-banner vs-banner-danger">{eventError}</div> : null}
      {successMessage ? <div className="vs-banner">{successMessage}</div> : null}

      <div className="vs-grid-4">
        {(data?.metrics || []).map((metric, index) => (
          <StatCard
            key={`${metric.label}-${index}`}
            label={metric.label}
            value={metric.value}
            delta={metric.delta}
            tone={metric.tone}
          />
        ))}
      </div>

      <SectionCard
        title="Operational Composer"
        subtitle="Create live MailOps events directly from the dashboard."
        right={<Badge tone={isDemoEvents ? "demo" : "active"}>{isDemoEvents ? "Demo Event Layer" : "Live Event Layer"}</Badge>}
      >
        <form onSubmit={handleCreateEvent} className="vs-stack">
          <div className="vs-grid-2">
            <input className="vs-input" placeholder="Campaign" value={composer.campaign} onChange={(e) => setComposer((prev) => ({ ...prev, campaign: e.target.value }))} required />
            <input className="vs-input" placeholder="Location" value={composer.location} onChange={(e) => setComposer((prev) => ({ ...prev, location: e.target.value }))} required />
          </div>

          <div className="vs-grid-3">
            <input className="vs-input" placeholder="State" value={composer.state} onChange={(e) => setComposer((prev) => ({ ...prev, state: e.target.value }))} required />
            <input className="vs-input" placeholder="Office" value={composer.office} onChange={(e) => setComposer((prev) => ({ ...prev, office: e.target.value }))} required />
            <input className="vs-input" placeholder="Risk" value={composer.risk} onChange={(e) => setComposer((prev) => ({ ...prev, risk: e.target.value }))} />
          </div>

          <div className="vs-grid-3">
            <input className="vs-input" placeholder="Vendor Name" value={composer.vendor_name} onChange={(e) => setComposer((prev) => ({ ...prev, vendor_name: e.target.value }))} />

            <select className="vs-select" value={composer.event_type} onChange={(e) => setComposer((prev) => ({ ...prev, event_type: e.target.value }))}>
              <option value="mail_update">mail_update</option>
              <option value="drop_created">drop_created</option>
              <option value="scan_update">scan_update</option>
              <option value="delay_alert">delay_alert</option>
              <option value="delivery_update">delivery_update</option>
              <option value="vendor_update">vendor_update</option>
              <option value="issue_opened">issue_opened</option>
              <option value="issue_resolved">issue_resolved</option>
            </select>

            <select className="vs-select" value={composer.status} onChange={(e) => setComposer((prev) => ({ ...prev, status: e.target.value }))}>
              <option value="Pending">Pending</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Transit">In Transit</option>
              <option value="On Track">On Track</option>
              <option value="Elevated">Elevated</option>
              <option value="Delivered">Delivered</option>
              <option value="Delayed">Delayed</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div className="vs-grid-3">
            <select className="vs-select" value={composer.severity} onChange={(e) => setComposer((prev) => ({ ...prev, severity: e.target.value }))}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <input className="vs-input" type="datetime-local" value={composer.event_time} onChange={(e) => setComposer((prev) => ({ ...prev, event_time: e.target.value }))} />
            <input className="vs-input" type="date" value={composer.in_home} onChange={(e) => setComposer((prev) => ({ ...prev, in_home: e.target.value }))} />
          </div>

          <textarea className="vs-textarea" rows={4} placeholder="Operational note" value={composer.note} onChange={(e) => setComposer((prev) => ({ ...prev, note: e.target.value }))} />

          <div className="vs-inline-actions">
            <button type="submit" className="vs-button vs-button-primary" disabled={creatingEvent}>
              {creatingEvent ? "Creating..." : "Create Mail Event"}
            </button>
          </div>
        </form>
      </SectionCard>

      <div className="vs-grid-2">
        <SectionCard
          title="Active Mail Drops"
          subtitle="Live campaigns and in-home delivery posture."
          right={<Badge tone={isDemoData ? "demo" : "active"}>{isDemoData ? "Demo Data" : "Live Data"}</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading mail drops..." />
            ) : !drops.length ? (
              <EmptyState text="No active mail drops available." />
            ) : (
              drops.map((row) => <DropRow key={row.id || row.campaign} row={row} />)
            )}
          </div>
        </SectionCard>

        <SectionCard title="Postal Alerts" subtitle="Risk signals that may affect delivery or in-home timing.">
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading postal alerts..." />
            ) : !alerts.length ? (
              <EmptyState text="No postal alerts available." />
            ) : (
              alerts.map((row) => <AlertRow key={row.id || row.title} row={row} />)
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Operational Event Queue"
        subtitle="Update live MailOps events directly from the control surface."
        right={<Badge tone={isDemoEvents ? "demo" : "active"}>{isDemoEvents ? "Demo Events" : "Live Events"}</Badge>}
      >
        <div className="vs-stack">
          {loadingEvents ? (
            <EmptyState text="Loading MailOps events..." />
          ) : !events.length ? (
            <EmptyState text="No MailOps events available." />
          ) : (
            events.map((row) => (
              <EventRow
                key={row.id}
                row={row}
                draft={eventDrafts[row.id] || {
                  status: row.status || "Pending",
                  severity: row.severity || "Medium",
                  note: row.note || "",
                }}
                onDraftChange={handleDraftChange}
                onSave={handleSaveEvent}
                saving={savingEventId === row.id}
              />
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
