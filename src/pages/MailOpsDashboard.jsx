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

const USPS_POLITICAL_MAIL_ALERT_URL = "https://tools.usps.com/political-mail-alert.htm";
const USPS_POLITICAL_MAIL_ISSUE_URL = "https://tools.usps.com/political-mail-issue.htm";

function toneForStatus(value) {
  const v = String(value || "").toLowerCase();
  if (["elevated", "delayed", "issue opened"].includes(v)) return "danger";
  if (["on track", "delivered", "resolved", "arrived scf"].includes(v)) return "active";
  if (["scheduled", "in transit", "entered usps", "at printer", "at mailshop"].includes(v)) return "info";
  if (v === "pending") return "demo";
  return "default";
}

function toneForSeverity(value) {
  const v = String(value || "").toLowerCase();
  if (["high", "critical"].includes(v)) return "danger";
  if (v === "medium") return "demo";
  if (v === "low") return "info";
  return "default";
}

function formatDate(value) {
  if (!value) return "TBD";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "TBD" : date.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "TBD";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "TBD" : date.toLocaleString();
}

function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function pct(numerator, denominator) {
  const total = number(denominator);
  if (!total) return "0%";
  return `${Math.round((number(numerator) / total) * 100)}%`;
}

function getRisk(row = {}) {
  return row.delivery_risk || row.risk || "Monitor";
}

function Field({ label, value }) {
  return (
    <div>
      <div className="vs-stat-label">{label}</div>
      <div style={{ marginTop: 4, fontWeight: 800, color: "var(--vs-text)" }}>
        {value || "—"}
      </div>
    </div>
  );
}

function DropRow({ row }) {
  return (
    <ResponsiveRow
      title={row.campaign || row.job_number || "Mail job"}
      subtitle={`${row.location || row.scf || "Location TBD"} • In-home ${formatDate(row.actual_in_home_date || row.estimated_in_home_date || row.in_home)}`}
      meta={[
        { label: "Job #", value: row.job_number || "N/A" },
        { label: "Assigned", value: row.assigned_to || "Unassigned" },
        { label: "SCF", value: row.scf || "TBD" },
        { label: "Risk", value: getRisk(row) },
      ]}
      alert={
        ["elevated", "delayed", "high"].includes(String(getRisk(row)).toLowerCase())
          ? "vs-live-dot"
          : "vs-live-dot-success"
      }
      right={<Badge tone={toneForStatus(row.status)}>{row.status || "Pending"}</Badge>}
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
        { label: "Job #", value: row.job_number || "N/A" },
        { label: "Vendor", value: row.print_vendor || "N/A" },
        { label: "Risk", value: row.risk || "Monitor" },
      ]}
      alert={
        ["high", "critical"].includes(String(row.severity || "").toLowerCase())
          ? "vs-live-dot"
          : "vs-live-dot-warning"
      }
      right={<Badge tone={toneForSeverity(row.severity)}>{row.severity}</Badge>}
    />
  );
}

function EventRow({ row, draft, onDraftChange, onSave, saving }) {
  return (
    <div className="vs-card-muted" style={{ padding: 16 }}>
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <span
                className={
                  ["high", "critical"].includes(String(row.severity || "").toLowerCase())
                    ? "vs-live-dot"
                    : "vs-live-dot-warning"
                }
              />
              <div style={{ fontSize: 15, fontWeight: 900, color: "var(--vs-text)" }}>
                {row.campaign || "MailOps Job"}
              </div>
              <Badge tone="info">{row.job_number || "No Job #"}</Badge>
              <Badge tone={toneForSeverity(row.severity)}>{row.severity || "Medium"}</Badge>
              <Badge tone={toneForStatus(row.status)}>{row.status || "Pending"}</Badge>
            </div>

            <div style={{ marginTop: 6, fontSize: 13, color: "var(--vs-text-muted)" }}>
              {row.state || "State"} • {row.office || "Office"} • {row.location || row.scf || "Location TBD"}
            </div>
          </div>

          <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a className="vs-button vs-button-secondary" href={USPS_POLITICAL_MAIL_ALERT_URL} target="_blank" rel="noreferrer">
              USPS Political Mail Alert
            </a>
            <a className="vs-button vs-button-secondary" href={USPS_POLITICAL_MAIL_ISSUE_URL} target="_blank" rel="noreferrer">
              USPS Mail Issue
            </a>
          </div>
        </div>

        <div className="vs-grid-4">
          <Field label="Assigned To" value={row.assigned_to} />
          <Field label="Date Submitted" value={formatDate(row.date_submitted)} />
          <Field label="SCF Arrival" value={formatDate(row.actual_scf_arrival_date || row.expected_scf_arrival_date)} />
          <Field label="Print Vendor" value={row.print_vendor || row.vendor_name} />
        </div>

        <div className="vs-grid-4">
          <Field label="Quantity" value={(row.quantity || row.pieces_mailed || 0).toLocaleString?.() || row.quantity || row.pieces_mailed} />
          <Field label="Mail Class" value={row.mail_class} />
          <Field label="Format" value={row.mail_format} />
          <Field label="Tracking Source" value={row.tracking_source || "manual"} />
        </div>

        <div className="vs-grid-4">
          <Field label="USPS Status" value={row.usps_status} />
          <Field label="Last Scan" value={formatDateTime(row.usps_last_scan_date)} />
          <Field label="Facility" value={row.usps_last_scan_facility} />
          <Field label="IMb / MID" value={row.imb_mid || row.mid} />
        </div>

        <div style={{ fontSize: 13, color: "var(--vs-text-muted)", lineHeight: 1.6 }}>
          {row.note || row.notes || "No notes yet."}
        </div>

        <div className="vs-grid-3">
          <select
            className="vs-select"
            value={draft.status}
            onChange={(e) => onDraftChange(row.id, { ...draft, status: e.target.value })}
          >
            {[
              "Pending",
              "Scheduled",
              "At Printer",
              "At Mailshop",
              "Entered USPS",
              "In Transit",
              "Arrived SCF",
              "On Track",
              "Elevated",
              "Delivered",
              "Delayed",
              "Issue Opened",
              "Resolved",
            ].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            className="vs-select"
            value={draft.severity}
            onChange={(e) => onDraftChange(row.id, { ...draft, severity: e.target.value })}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <input
            className="vs-input"
            placeholder="Actual SCF arrival"
            type="date"
            value={draft.actual_scf_arrival_date || ""}
            onChange={(e) => onDraftChange(row.id, { ...draft, actual_scf_arrival_date: e.target.value })}
          />
        </div>

        <textarea
          className="vs-textarea"
          rows={3}
          value={draft.note}
          onChange={(e) => onDraftChange(row.id, { ...draft, note: e.target.value })}
          placeholder="Update operational note..."
        />

        <div className="vs-inline-actions">
          <button type="button" className="vs-button vs-button-primary" onClick={() => onSave(row.id)} disabled={saving}>
            {saving ? "Saving..." : "Save MailOps Update"}
          </button>
        </div>
      </div>
    </div>
  );
}

const fallbackData = {
  metrics: [
    { label: "Mail Jobs", value: "0", delta: "No live jobs", tone: "up" },
    { label: "Delivery Risk", value: "0", delta: "No elevated risk", tone: "up" },
    { label: "SCF Pending", value: "0", delta: "Awaiting SCF arrival", tone: "neutral" },
    { label: "On-Time Rate", value: "0%", delta: "No on-track drops yet", tone: "up" },
  ],
  drops: [],
  alerts: [],
  intelligence: {},
  _demo: true,
};

const fallbackEvents = {
  results: [],
  _demo: true,
};

const emptyComposer = {
  campaign: "",
  state: "",
  office: "",
  risk: "",
  location: "",
  vendor_name: "",
  event_type: "mail_update",
  status: "Pending",
  severity: "Medium",
  event_time: "",
  in_home: "",
  note: "",

  job_number: "",
  assigned_to: "",
  date_submitted: "",
  print_vendor: "",
  mail_class: "Marketing Mail",
  mail_format: "Letter",
  quantity: "",
  pieces_mailed: "",
  postage_statement_id: "",
  permit_number: "",
  crid: "",
  mid: "",
  imb_mid: "",
  imb_serial_range: "",
  usps_job_id: "",
  usps_status: "",
  usps_last_scan_date: "",
  usps_last_scan_facility: "",
  usps_last_scan_city: "",
  usps_last_scan_state: "",
  expected_scf_arrival_date: "",
  actual_scf_arrival_date: "",
  scf: "",
  ndc: "",
  estimated_in_home_date: "",
  actual_in_home_date: "",
  delivery_risk: "Watch",
  snailworks_job_id: "",
  snailworks_campaign_id: "",
  snailworks_status: "",
  tracking_source: "manual",
  issue_status: "",
  issue_notes: "",
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
  const [composerOpen, setComposerOpen] = useState(true);
  const [composer, setComposer] = useState({
    ...emptyComposer,
    state: filters.state || "",
    office: filters.office || "",
    risk: filters.risk || "",
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
        return { ...(prev || {}), results: [liveEvent, ...withoutDuplicate].slice(0, 150), _demo: false, demo: false };
      });

      setData((prev) => {
        const existingDrops = prev?.drops || [];
        const withoutDuplicateDrops = existingDrops.filter((row) => row.id !== liveEvent.id);
        return { ...(prev || fallbackData), drops: [liveEvent, ...withoutDuplicateDrops].slice(0, 20), _demo: false, demo: false };
      });

      setIsDemoEvents(false);
      setIsDemoData(false);
      setSuccessMessage(`Live MailOps update received: ${liveEvent.campaign || "New event"}`);
    }

    if (liveAlert) {
      setData((prev) => {
        const existingAlerts = prev?.alerts || [];
        const withoutDuplicateAlerts = existingAlerts.filter((row) => row.id !== liveAlert.id);
        return { ...(prev || fallbackData), alerts: [liveAlert, ...withoutDuplicateAlerts].slice(0, 20), _demo: false, demo: false };
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

  async function loadDashboard() {
    const response = await api.mailOpsDashboard();
    setData(response || fallbackData);
    setIsDemoData(Boolean(response?._demo || response?.demo));
  }

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

  useEffect(() => {
    let active = true;

    async function load() {
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

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoadingEvents(true);
        setEventError("");
        await refreshEvents();
      } catch (err) {
        if (!active) return;
        setEventError(err?.response?.data?.error || err?.message || "Failed to load MailOps events");
        setEventsData(fallbackEvents);
        setIsDemoEvents(true);
      } finally {
        if (active) setLoadingEvents(false);
      }
    }

    load();
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
        actual_scf_arrival_date: event.actual_scf_arrival_date || "",
      };
    });
    setEventDrafts(nextDrafts);
  }, [events]);

  const elevatedDrops = drops.filter((row) => ["elevated", "delayed", "high"].includes(String(getRisk(row)).toLowerCase())).length;
  const highAlerts = alerts.filter((row) => ["high", "critical"].includes(String(row.severity || "").toLowerCase())).length;
  const totalPieces = events.reduce((sum, row) => sum + number(row.quantity || row.pieces_mailed), 0);
  const scfArrived = events.filter((row) => row.actual_scf_arrival_date).length;

  async function handleCreateEvent(e) {
    e.preventDefault();
    setEventError("");
    setSuccessMessage("");
    setCreatingEvent(true);

    try {
      const payload = {
        ...composer,
        event_time: composer.event_time || null,
        in_home: composer.in_home || composer.estimated_in_home_date || null,
      };

      if (api.createMailOpsEvent) {
        await api.createMailOpsEvent(payload);
      } else {
        await api.post("/mailops/events", payload);
      }

      setSuccessMessage("MailOps job created successfully.");
      setComposer({
        ...emptyComposer,
        state: filters.state || "",
        office: filters.office || "",
        risk: filters.risk || "",
      });

      await Promise.all([refreshEvents(), loadDashboard()]);
    } catch (err) {
      setEventError(err?.response?.data?.error || err?.message || "Failed to create MailOps event");
    } finally {
      setCreatingEvent(false);
    }
  }

  function handleDraftChange(eventId, nextDraft) {
    setEventDrafts((prev) => ({ ...prev, [eventId]: nextDraft }));
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

      setSuccessMessage(`MailOps job #${eventId} updated successfully.`);
      await Promise.all([refreshEvents(), loadDashboard()]);
    } catch (err) {
      setEventError(err?.response?.data?.error || err?.message || "Failed to update MailOps event");
    } finally {
      setSavingEventId(null);
    }
  }

  return (
    <PageShell
      eyebrow="MailOps Intelligence"
      title="Track political mail execution, USPS risk, SCF movement, and vendor performance."
      description="A full mail operations terminal for job tracking, USPS political mail escalation, IV-MTR readiness, SCF arrivals, SnailWorks-style ingestion, and delivery risk monitoring."
      demo={demoMode}
      demoText="Global Demo Mode is active. This module can render fallback MailOps data when live endpoints are unavailable."
      tickerItems={[
        { label: "Jobs", value: `${events.length}`, dotClass: "vs-live-dot-success" },
        { label: "Pieces", value: `${totalPieces.toLocaleString()}`, dotClass: "vs-live-dot-success" },
        { label: "Elevated", value: `${elevatedDrops}`, dotClass: elevatedDrops ? "vs-live-dot" : "vs-live-dot-success" },
        { label: "SCF Arrived", value: `${scfArrived}/${events.length}`, dotClass: "vs-live-dot-warning" },
      ]}
    >
      <DemoBanner active={isDemoData || isDemoEvents} text="Demo MailOps data is active for part of this module." />

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {eventError ? <div className="vs-banner vs-banner-danger">{eventError}</div> : null}
      {successMessage ? <div className="vs-banner">{successMessage}</div> : null}

      <SectionCard
        title="USPS Political Mail Actions"
        subtitle="Fast links for official USPS political mail notices, issue reporting, and future IV-MTR tracking integration."
        right={<Badge tone="info">USPS / IV-MTR Ready</Badge>}
      >
        <div className="vs-inline-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a className="vs-button" href={USPS_POLITICAL_MAIL_ALERT_URL} target="_blank" rel="noreferrer">
            Submit USPS Political Mail Alert
          </a>
          <a className="vs-button vs-button-secondary" href={USPS_POLITICAL_MAIL_ISSUE_URL} target="_blank" rel="noreferrer">
            Report USPS Mailing Problem
          </a>
          <button type="button" className="vs-button vs-button-secondary" onClick={() => Promise.all([refreshEvents(), loadDashboard()])}>
            Refresh Mail Tracking
          </button>
        </div>

        <div className="vs-grid-3" style={{ marginTop: 14 }}>
          <div className="vs-banner" style={{ margin: 0 }}>
            <strong>USPS IV-MTR:</strong> Store IMb/MID, CRID, permit, postage statement, scan facility, SCF, and last scan values now. API ingestion can be attached later.
          </div>
          <div className="vs-banner" style={{ margin: 0 }}>
            <strong>SnailWorks-style ingestion:</strong> Ready for CSV, SFTP, API webhook, job status, SCF rollups, and delivery-percent import.
          </div>
          <div className="vs-banner" style={{ margin: 0 }}>
            <strong>Escalation workflow:</strong> Use USPS alert/issue buttons when jobs miss expected SCF arrival or in-home timing.
          </div>
        </div>
      </SectionCard>

      <div className="vs-grid-4">
        {(data?.metrics || []).map((metric, index) => (
          <StatCard key={`${metric.label}-${index}`} label={metric.label} value={metric.value} delta={metric.delta} tone={metric.tone} />
        ))}
      </div>

      <SectionCard
        title="Mail Job Composer"
        subtitle="Create a full political mail job with USPS, SCF, vendor, and SnailWorks-ready tracking fields."
        right={
          <div className="vs-inline-actions">
            <Badge tone={isDemoEvents ? "demo" : "active"}>{isDemoEvents ? "Demo Event Layer" : "Live Event Layer"}</Badge>
            <button type="button" className="vs-button vs-button-secondary" onClick={() => setComposerOpen((v) => !v)}>
              {composerOpen ? "Collapse" : "Open Composer"}
            </button>
          </div>
        }
      >
        {composerOpen ? (
          <form onSubmit={handleCreateEvent} className="vs-stack">
            <div className="vs-grid-4">
              <input className="vs-input" placeholder="Job Number" value={composer.job_number} onChange={(e) => setComposer((p) => ({ ...p, job_number: e.target.value }))} />
              <input className="vs-input" placeholder="Campaign" value={composer.campaign} onChange={(e) => setComposer((p) => ({ ...p, campaign: e.target.value }))} required />
              <input className="vs-input" placeholder="Assigned To" value={composer.assigned_to} onChange={(e) => setComposer((p) => ({ ...p, assigned_to: e.target.value }))} />
              <input className="vs-input" type="date" value={composer.date_submitted} onChange={(e) => setComposer((p) => ({ ...p, date_submitted: e.target.value }))} />
            </div>

            <div className="vs-grid-4">
              <input className="vs-input" placeholder="State" value={composer.state} onChange={(e) => setComposer((p) => ({ ...p, state: e.target.value }))} required />
              <input className="vs-input" placeholder="Office" value={composer.office} onChange={(e) => setComposer((p) => ({ ...p, office: e.target.value }))} required />
              <input className="vs-input" placeholder="Location / Facility" value={composer.location} onChange={(e) => setComposer((p) => ({ ...p, location: e.target.value }))} required />
              <input className="vs-input" placeholder="Print Vendor" value={composer.print_vendor} onChange={(e) => setComposer((p) => ({ ...p, print_vendor: e.target.value, vendor_name: e.target.value }))} />
            </div>

            <div className="vs-grid-4">
              <select className="vs-select" value={composer.event_type} onChange={(e) => setComposer((p) => ({ ...p, event_type: e.target.value }))}>
                {["mail_update", "job_created", "drop_created", "print_vendor_update", "entered_usps", "scan_update", "scf_arrival", "delay_alert", "delivery_update", "vendor_update", "issue_opened", "issue_resolved", "snailworks_import", "usps_ivmtr_import"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>

              <select className="vs-select" value={composer.status} onChange={(e) => setComposer((p) => ({ ...p, status: e.target.value }))}>
                {["Pending", "Scheduled", "At Printer", "At Mailshop", "Entered USPS", "In Transit", "Arrived SCF", "On Track", "Elevated", "Delivered", "Delayed", "Issue Opened", "Resolved"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>

              <select className="vs-select" value={composer.severity} onChange={(e) => setComposer((p) => ({ ...p, severity: e.target.value }))}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>

              <select className="vs-select" value={composer.delivery_risk} onChange={(e) => setComposer((p) => ({ ...p, delivery_risk: e.target.value, risk: e.target.value }))}>
                <option value="Stable">Stable</option>
                <option value="Watch">Watch</option>
                <option value="Elevated">Elevated</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="vs-grid-4">
              <input className="vs-input" placeholder="SCF" value={composer.scf} onChange={(e) => setComposer((p) => ({ ...p, scf: e.target.value }))} />
              <input className="vs-input" placeholder="NDC" value={composer.ndc} onChange={(e) => setComposer((p) => ({ ...p, ndc: e.target.value }))} />
              <input className="vs-input" type="date" title="Expected SCF Arrival" value={composer.expected_scf_arrival_date} onChange={(e) => setComposer((p) => ({ ...p, expected_scf_arrival_date: e.target.value }))} />
              <input className="vs-input" type="date" title="Estimated In Home" value={composer.estimated_in_home_date} onChange={(e) => setComposer((p) => ({ ...p, estimated_in_home_date: e.target.value, in_home: e.target.value }))} />
            </div>

            <div className="vs-grid-4">
              <input className="vs-input" placeholder="Mail Class" value={composer.mail_class} onChange={(e) => setComposer((p) => ({ ...p, mail_class: e.target.value }))} />
              <input className="vs-input" placeholder="Format" value={composer.mail_format} onChange={(e) => setComposer((p) => ({ ...p, mail_format: e.target.value }))} />
              <input className="vs-input" placeholder="Quantity" type="number" value={composer.quantity} onChange={(e) => setComposer((p) => ({ ...p, quantity: e.target.value, pieces_mailed: e.target.value }))} />
              <input className="vs-input" placeholder="Postage Statement ID" value={composer.postage_statement_id} onChange={(e) => setComposer((p) => ({ ...p, postage_statement_id: e.target.value }))} />
            </div>

            <div className="vs-grid-4">
              <input className="vs-input" placeholder="Permit Number" value={composer.permit_number} onChange={(e) => setComposer((p) => ({ ...p, permit_number: e.target.value }))} />
              <input className="vs-input" placeholder="CRID" value={composer.crid} onChange={(e) => setComposer((p) => ({ ...p, crid: e.target.value }))} />
              <input className="vs-input" placeholder="MID / IMb MID" value={composer.imb_mid} onChange={(e) => setComposer((p) => ({ ...p, imb_mid: e.target.value, mid: e.target.value }))} />
              <input className="vs-input" placeholder="IMb Serial Range" value={composer.imb_serial_range} onChange={(e) => setComposer((p) => ({ ...p, imb_serial_range: e.target.value }))} />
            </div>

            <div className="vs-grid-4">
              <input className="vs-input" placeholder="USPS Status" value={composer.usps_status} onChange={(e) => setComposer((p) => ({ ...p, usps_status: e.target.value }))} />
              <input className="vs-input" type="datetime-local" title="USPS Last Scan" value={composer.usps_last_scan_date} onChange={(e) => setComposer((p) => ({ ...p, usps_last_scan_date: e.target.value }))} />
              <input className="vs-input" placeholder="Last Scan Facility" value={composer.usps_last_scan_facility} onChange={(e) => setComposer((p) => ({ ...p, usps_last_scan_facility: e.target.value }))} />
              <input className="vs-input" placeholder="SnailWorks Job ID" value={composer.snailworks_job_id} onChange={(e) => setComposer((p) => ({ ...p, snailworks_job_id: e.target.value }))} />
            </div>

            <textarea className="vs-textarea" rows={4} placeholder="Operational notes" value={composer.note} onChange={(e) => setComposer((p) => ({ ...p, note: e.target.value }))} />

            <div className="vs-inline-actions">
              <button type="submit" className="vs-button vs-button-primary" disabled={creatingEvent}>
                {creatingEvent ? "Creating..." : "Create Mail Job"}
              </button>
            </div>
          </form>
        ) : null}
      </SectionCard>

      <div className="vs-grid-2">
        <SectionCard title="Active Mail Jobs" subtitle="Live campaign mail jobs, SCF posture, and in-home timing." right={<Badge tone={isDemoData ? "demo" : "active"}>{isDemoData ? "Demo Data" : "Live Data"}</Badge>}>
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading mail jobs..." /> : !drops.length ? <EmptyState text="No active mail jobs available." /> : drops.map((row) => <DropRow key={row.id || row.job_number || row.campaign} row={row} />)}
          </div>
        </SectionCard>

        <SectionCard title="Postal Intelligence Alerts" subtitle="Risk signals that may affect SCF arrival or in-home timing.">
          <div className="vs-stack">
            {loading ? <EmptyState text="Loading postal alerts..." /> : !alerts.length ? <EmptyState text="No postal alerts available." /> : alerts.map((row) => <AlertRow key={row.id || row.title} row={row} />)}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Vendor / SCF Intelligence" subtitle="SnailWorks-style operational rollups from currently tracked jobs.">
        <div className="vs-grid-4">
          <StatCard label="Total Pieces" value={totalPieces.toLocaleString()} delta="Tracked quantity" tone="up" />
          <StatCard label="SCF Arrival Rate" value={pct(scfArrived, events.length)} delta={`${scfArrived} arrived`} tone="up" />
          <StatCard label="High Alerts" value={highAlerts} delta="Postal risk signals" tone={highAlerts ? "down" : "up"} />
          <StatCard label="Print Vendors" value={new Set(events.map((e) => e.print_vendor || e.vendor_name).filter(Boolean)).size} delta="Vendor coverage" tone="up" />
        </div>
      </SectionCard>

      <SectionCard title="MailOps Job Queue" subtitle="Update job status, severity, actual SCF arrival, and operational notes.">
        <div className="vs-stack">
          {loadingEvents ? (
            <EmptyState text="Loading MailOps jobs..." />
          ) : !events.length ? (
            <EmptyState text="No MailOps jobs available." />
          ) : (
            events.map((row) => (
              <EventRow
                key={row.id}
                row={row}
                draft={eventDrafts[row.id] || {
                  status: row.status || "Pending",
                  severity: row.severity || "Medium",
                  note: row.note || "",
                  actual_scf_arrival_date: row.actual_scf_arrival_date || "",
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
