import { useEffect, useMemo, useState } from "react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }

  return data;
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function StatCard({ label, value, subtext }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{subtext}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
      {text}
    </div>
  );
}

function TimelineEventCard({ event }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-900">
            {event.event_type || "tracking_event"}
          </div>
          <div className="mt-1 text-sm text-slate-500">
            {event.campaign_name || "Campaign N/A"} • {event.drop_name || "Drop N/A"}
          </div>
        </div>
        <span className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
          {event.status || event.event_type || "pending"}
        </span>
      </div>

      <div className="mt-3 grid gap-1 text-xs text-slate-500 md:grid-cols-2">
        <div>Location: {event.location_name || "N/A"}</div>
        <div>Facility: {event.facility_type || "N/A"}</div>
        <div>Source: {event.source || "manual"}</div>
        <div>
          Event Time:{" "}
          {event.event_time ? new Date(event.event_time).toLocaleString() : "N/A"}
        </div>
      </div>

      <div className="mt-2 text-xs text-slate-500">
        Notes: {event.notes || "No notes"}
      </div>
    </div>
  );
}

export default function MailOpsDashboard() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dashboard, setDashboard] = useState({
    summary: {},
    programs: [],
    drops: [],
    timeline: []
  });

  const [drops, setDrops] = useState([]);
  const [eventForm, setEventForm] = useState({
    campaign_id: "",
    mail_drop_id: "",
    event_type: "entered_usps",
    status: "entered_usps",
    location_name: "",
    facility_type: "",
    event_time: "",
    notes: "",
    source: "manual"
  });

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [dashboardRes, dropsRes] = await Promise.all([
        apiRequest("/api/mail/dashboard"),
        apiRequest("/api/mail/drops")
      ]);

      setDashboard(
        dashboardRes || {
          summary: {},
          programs: [],
          drops: [],
          timeline: []
        }
      );
      setDrops(dropsRes?.results || []);
    } catch (err) {
      setError(err.message || "Failed to load MailOps dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const summary = dashboard.summary || {};
  const programs = dashboard.programs || [];
  const recentDrops = dashboard.drops || [];
  const timeline = dashboard.timeline || [];

  const selectedDrop = useMemo(() => {
    return drops.find((drop) => String(drop.id) === String(eventForm.mail_drop_id)) || null;
  }, [drops, eventForm.mail_drop_id]);

  async function handleCreateEvent(e) {
    e.preventDefault();

    try {
      setBusy(true);
      setError("");
      setSuccess("");

      await apiRequest("/api/mail/tracking-events", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: eventForm.campaign_id
            ? Number(eventForm.campaign_id)
            : Number(selectedDrop?.campaign_id),
          mail_drop_id: Number(eventForm.mail_drop_id),
          event_type: eventForm.event_type,
          status: eventForm.status,
          location_name: eventForm.location_name || null,
          facility_type: eventForm.facility_type || null,
          event_time: eventForm.event_time || null,
          notes: eventForm.notes || null,
          source: eventForm.source || "manual"
        })
      });

      setEventForm({
        campaign_id: "",
        mail_drop_id: "",
        event_type: "entered_usps",
        status: "entered_usps",
        location_name: "",
        facility_type: "",
        event_time: "",
        notes: "",
        source: "manual"
      });

      setSuccess("Tracking event added.");
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Failed to add tracking event");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
            VoterSpheres MailOps
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            MailOps Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage political mail programs, track drops, and monitor delivery movement through event timelines.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Mail Programs"
            value={summary.programs || 0}
            subtext="Active and draft programs"
          />
          <StatCard
            label="Mail Drops"
            value={summary.drops || 0}
            subtext="Tracked execution records"
          />
          <StatCard
            label="Mail Budget"
            value={formatMoney(summary.total_budget || 0)}
            subtext="Budget across programs"
          />
          <StatCard
            label="Pieces Planned"
            value={Number(summary.total_quantity || 0).toLocaleString()}
            subtext="Total mail quantity"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">
                Add Tracking Event
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Record USPS entry, transit, delivery, or operational movement.
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleCreateEvent}>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#0176D3]"
                value={eventForm.mail_drop_id}
                onChange={(e) =>
                  setEventForm((prev) => ({
                    ...prev,
                    mail_drop_id: e.target.value,
                    campaign_id:
                      drops.find((d) => String(d.id) === String(e.target.value))
                        ?.campaign_id || ""
                  }))
                }
                required
              >
                <option value="">Select mail drop</option>
                {drops.map((drop) => (
                  <option key={drop.id} value={drop.id}>
                    {drop.drop_name || `Drop #${drop.id}`} — {drop.campaign_name || "Campaign"}
                  </option>
                ))}
              </select>

              <div className="grid gap-3 md:grid-cols-2">
                <select
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#0176D3]"
                  value={eventForm.event_type}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      event_type: e.target.value
                    }))
                  }
                >
                  <option value="entered_usps">entered_usps</option>
                  <option value="in_transit">in_transit</option>
                  <option value="out_for_delivery">out_for_delivery</option>
                  <option value="delivered">delivered</option>
                  <option value="delayed">delayed</option>
                  <option value="returned">returned</option>
                </select>

                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#0176D3]"
                  placeholder="Status"
                  value={eventForm.status}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      status: e.target.value
                    }))
                  }
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#0176D3]"
                  placeholder="Location name"
                  value={eventForm.location_name}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      location_name: e.target.value
                    }))
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#0176D3]"
                  placeholder="Facility type"
                  value={eventForm.facility_type}
                  onChange={(e) =>
                    setEventForm((prev) => ({
                      ...prev,
                      facility_type: e.target.value
                    }))
                  }
                />
              </div>

              <input
                type="datetime-local"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#0176D3]"
                value={eventForm.event_time}
                onChange={(e) =>
                  setEventForm((prev) => ({
                    ...prev,
                    event_time: e.target.value
                  }))
                }
              />

              <textarea
                className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-[#0176D3]"
                placeholder="Notes"
                value={eventForm.notes}
                onChange={(e) =>
                  setEventForm((prev) => ({
                    ...prev,
                    notes: e.target.value
                  }))
                }
              />

              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-[#0176D3] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add Tracking Event
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">Programs</h2>
              <p className="mt-1 text-sm text-slate-500">
                Current campaign mail programs
              </p>
            </div>

            <div className="space-y-3">
              {loading ? (
                <EmptyState text="Loading mail programs..." />
              ) : programs.length === 0 ? (
                <EmptyState text="No mail programs yet." />
              ) : (
                programs.map((program) => (
                  <div
                    key={program.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">
                          {program.name || program.program_name}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">
                          {program.campaign_name || "Campaign N/A"} •{" "}
                          {program.mail_type || "Mail Program"}
                        </div>
                      </div>
                      <span className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
                        {program.status || "draft"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Tracking Timeline
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Platform-wide recent mail movement events
              </p>
            </div>

            <button
              type="button"
              onClick={loadDashboard}
              className="rounded-xl bg-[#0176D3] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <EmptyState text="Loading tracking timeline..." />
            ) : timeline.length === 0 ? (
              <EmptyState text="No tracking events yet." />
            ) : (
              timeline.map((event) => (
                <TimelineEventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Recent Drops</h2>
            <p className="mt-1 text-sm text-slate-500">
              Operational timeline for recent mail execution
            </p>
          </div>

          <div className="space-y-3">
            {loading ? (
              <EmptyState text="Loading mail drops..." />
            ) : recentDrops.length === 0 ? (
              <EmptyState text="No mail drops yet." />
            ) : (
              recentDrops.map((drop) => (
                <div
                  key={drop.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {drop.drop_name || `Drop #${drop.id}`}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {drop.campaign_name || "Campaign N/A"} •{" "}
                        {drop.vendor_name || "Vendor N/A"}
                      </div>
                    </div>
                    <span className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
                      {drop.tracking_status || drop.status || "pending"}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-1 text-xs text-slate-500 md:grid-cols-4">
                    <div>Quantity: {Number(drop.quantity || 0).toLocaleString()}</div>
                    <div>Region: {drop.region || "N/A"}</div>
                    <div>Drop Date: {drop.drop_date || "N/A"}</div>
                    <div>Delivery: {drop.expected_delivery_window || "N/A"}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
