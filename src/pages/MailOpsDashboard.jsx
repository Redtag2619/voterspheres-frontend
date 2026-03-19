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

export default function MailOpsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState({
    summary: {},
    programs: [],
    drops: []
  });

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest("/api/mail/dashboard");
      setDashboard(
        data || {
          summary: {},
          programs: [],
          drops: []
        }
      );
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
  const drops = dashboard.drops || [];

  const recentDrops = useMemo(() => drops.slice(0, 12), [drops]);

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
            Manage political mail programs, track drops, monitor delivery windows,
            and operationalize direct mail execution.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
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

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Programs</h2>
              <p className="mt-1 text-sm text-slate-500">
                Current campaign mail programs
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
