import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function MetricCard({ label, value, delta, tone }) {
  const toneClass =
    tone === "up"
      ? "text-emerald-600"
      : tone === "down"
      ? "text-amber-600"
      : "text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-semibold text-slate-900">{value}</div>
      <div className={`mt-2 text-xs font-medium ${toneClass}`}>{delta}</div>
    </div>
  );
}

function StatusBadge({ value }) {
  const normalized = String(value || "").toLowerCase();

  let classes =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ";

  if (normalized.includes("track")) {
    classes += "bg-emerald-100 text-emerald-700";
  } else if (normalized.includes("elevated")) {
    classes += "bg-rose-100 text-rose-700";
  } else if (normalized.includes("watch")) {
    classes += "bg-amber-100 text-amber-700";
  } else if (normalized.includes("pending")) {
    classes += "bg-slate-100 text-slate-700";
  } else {
    classes += "bg-blue-100 text-blue-700";
  }

  return <span className={classes}>{value || "Unknown"}</span>;
}

function SeverityBadge({ value }) {
  const normalized = String(value || "").toLowerCase();

  let classes =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ";

  if (normalized === "high") {
    classes += "bg-rose-100 text-rose-700";
  } else if (normalized === "medium") {
    classes += "bg-amber-100 text-amber-700";
  } else if (normalized === "low") {
    classes += "bg-emerald-100 text-emerald-700";
  } else {
    classes += "bg-slate-100 text-slate-700";
  }

  return <span className={classes}>{value || "Unknown"}</span>;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EmptyState({ title, body }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <div className="text-sm font-semibold text-slate-700">{title}</div>
      <div className="mt-1 text-sm text-slate-500">{body}</div>
    </div>
  );
}

const initialForm = {
  campaign: "",
  state: "",
  office: "",
  location: "",
};

export default function MailOpsDashboard() {
  const [dashboard, setDashboard] = useState({
    metrics: [],
    drops: [],
    alerts: [],
    demo: false,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState(initialForm);

  const metrics = dashboard?.metrics || [];
  const drops = dashboard?.drops || [];
  const alerts = dashboard?.alerts || [];
  const isDemo = Boolean(dashboard?.demo || dashboard?._demo);

  async function loadDashboard({ silent = false } = {}) {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const data = await api.mailOpsDashboard();

      setDashboard({
        metrics: Array.isArray(data?.metrics) ? data.metrics : [],
        drops: Array.isArray(data?.drops) ? data.drops : [],
        alerts: Array.isArray(data?.alerts) ? data.alerts : [],
        demo: Boolean(data?.demo || data?._demo),
      });
    } catch (err) {
      console.error("Failed to load MailOps dashboard:", err);
      setError(
        err?.response?.data?.error ||
          "Failed to load MailOps dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!successMessage) return;

    const timer = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [successMessage]);

  function updateFormField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleCreateEvent(event) {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        campaign: form.campaign.trim(),
        state: form.state.trim(),
        office: form.office.trim(),
        location: form.location.trim(),
      };

      await api.createMailOpsEvent(payload);

      setForm(initialForm);
      setSuccessMessage("Mail event created successfully.");
      await loadDashboard({ silent: true });
    } catch (err) {
      console.error("Failed to create MailOps event:", err);
      setError(
        err?.response?.data?.error ||
          "Failed to create MailOps event."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const sortedDrops = useMemo(() => {
    return [...drops].sort((a, b) => {
      const aTime = a?.in_home ? new Date(a.in_home).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b?.in_home ? new Date(b.in_home).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [drops]);

  const sortedAlerts = useMemo(() => {
    const severityWeight = {
      high: 3,
      medium: 2,
      low: 1,
    };

    return [...alerts].sort((a, b) => {
      const aWeight = severityWeight[String(a?.severity || "").toLowerCase()] || 0;
      const bWeight = severityWeight[String(b?.severity || "").toLowerCase()] || 0;

      if (aWeight !== bWeight) return bWeight - aWeight;
      return (b?.id || 0) - (a?.id || 0);
    });
  }, [alerts]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">MailOps Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Loading live postal operations data...
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
            />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 xl:col-span-1" />
          <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 xl:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-slate-900">MailOps Dashboard</h1>

            {isDemo ? (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Demo data
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                Live data
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Monitor campaign mail drops, postal alerts, and delivery risk in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard({ silent: true })}
          disabled={refreshing}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.length ? (
          metrics.map((metric, index) => (
            <MetricCard
              key={`${metric.label}-${index}`}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
              tone={metric.tone}
            />
          ))
        ) : (
          <>
            <MetricCard label="Mail Drops" value="0" delta="No live drops" tone="neutral" />
            <MetricCard label="Delivery Risk" value="0" delta="No elevated risks" tone="neutral" />
            <MetricCard label="Postal Alerts" value="0" delta="No current alerts" tone="neutral" />
            <MetricCard label="On-Time Rate" value="—" delta="No recent performance data" tone="neutral" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Create Mail Event</h2>
            <p className="mt-1 text-sm text-slate-500">
              Add a live MailOps event to track campaign delivery activity.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleCreateEvent}>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Campaign
              </label>
              <input
                type="text"
                value={form.campaign}
                onChange={(e) => updateFormField("campaign", e.target.value)}
                placeholder="Louisiana Senate Push"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  State
                </label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => updateFormField("state", e.target.value)}
                  placeholder="LA"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Office
                </label>
                <input
                  type="text"
                  value={form.office}
                  onChange={(e) => updateFormField("office", e.target.value)}
                  placeholder="U.S. Senate"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => updateFormField("location", e.target.value)}
                placeholder="Statewide"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Event"}
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Active Mail Drops</h2>
              <p className="mt-1 text-sm text-slate-500">
                Live campaign mail activity and in-home timing.
              </p>
            </div>

            <div className="text-sm font-medium text-slate-500">
              {sortedDrops.length} total
            </div>
          </div>

          {sortedDrops.length ? (
            <div className="space-y-4">
              {sortedDrops.map((drop) => (
                <div
                  key={drop.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-900">
                        {drop.campaign || "Untitled campaign"}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {[drop.state, drop.office, drop.location]
                          .filter(Boolean)
                          .join(" • ") || "No route details"}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={drop.status || drop.risk || "Pending"} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-3">
                    <div>
                      <div className="font-medium text-slate-800">Risk</div>
                      <div>{drop.risk || "—"}</div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">In-home</div>
                      <div>{formatDate(drop.in_home)}</div>
                    </div>
                    <div>
                      <div className="font-medium text-slate-800">Note</div>
                      <div>{drop.note || "—"}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No live mail drops yet"
              body="Create a MailOps event to start tracking campaign delivery activity."
            />
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Postal Alerts</h2>
            <p className="mt-1 text-sm text-slate-500">
              Risk signals and delivery warnings from current mail activity.
            </p>
          </div>

          <div className="text-sm font-medium text-slate-500">
            {sortedAlerts.length} total
          </div>
        </div>

        {sortedAlerts.length ? (
          <div className="space-y-4">
            {sortedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-base font-semibold text-slate-900">
                      {alert.title || "MailOps Alert"}
                    </div>
                    <div className="mt-1 text-sm text-slate-600">
                      {alert.source || "MailOps"}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge value={alert.severity} />
                    {alert.risk ? <StatusBadge value={alert.risk} /> : null}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <div className="font-medium text-slate-800">Detail</div>
                    <div>{alert.detail || "—"}</div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">State</div>
                    <div>{alert.state || "—"}</div>
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">Office</div>
                    <div>{alert.office || "—"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No current postal alerts"
            body="When risk signals are generated, they’ll appear here."
          />
        )}
      </div>
    </div>
  );
}
