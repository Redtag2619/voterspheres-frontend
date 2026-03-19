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

function StatCard({ label, value, delta }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{delta}</div>
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

function ProgramCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-slate-900">{item.program_name}</div>
          <div className="mt-1 text-sm text-slate-500">
            {item.campaign_name} • {item.candidate_name}
          </div>
        </div>
        <span className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
          {item.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
        <div>Type: {item.mail_type || "N/A"}</div>
        <div>Vendor: {item.vendor_name || "N/A"}</div>
        <div>Quantity: {Number(item.quantity || 0).toLocaleString()}</div>
        <div>Budget: {formatMoney(item.budget || 0)}</div>
        <div>Drop Date: {item.drop_date || "N/A"}</div>
        <div>State: {item.state || "N/A"}</div>
      </div>
    </div>
  );
}

function EventCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-slate-900">{item.event_type}</div>
          <div className="mt-1 text-sm text-slate-500">
            {item.program_name} • {item.campaign_name}
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {item.event_timestamp
            ? new Date(item.event_timestamp).toLocaleString()
            : "N/A"}
        </div>
      </div>
      <div className="mt-2 text-sm text-slate-700">
        {item.location_name || "Location N/A"}
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {item.description || "No description"}
      </div>
    </div>
  );
}

export default function MailOpsDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dashboard, setDashboard] = useState({
    metrics: [],
    summary: {},
    recent_programs: [],
    recent_events: []
  });

  const [filters, setFilters] = useState({
    search: "",
    status: "",
    state: ""
  });

  const [programsData, setProgramsData] = useState({
    results: []
  });

  const [programForm, setProgramForm] = useState({
    campaign_id: "",
    program_name: "",
    mail_type: "",
    vendor_name: "",
    audience_name: "",
    quantity: "",
    budget: "",
    expected_in_home_start: "",
    expected_in_home_end: "",
    drop_date: "",
    status: "planned",
    notes: ""
  });

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const [dash, programs] = await Promise.all([
        apiRequest("/api/mail/dashboard"),
        apiRequest("/api/mail/programs")
      ]);

      setDashboard(dash || {});
      setProgramsData(programs || { results: [] });
    } catch (err) {
      setError(err.message || "Failed to load MailOps dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  async function handleCreateProgram(e) {
    e.preventDefault();

    try {
      setSuccess("");
      setError("");

      await apiRequest("/api/mail/programs", {
        method: "POST",
        body: JSON.stringify({
          ...programForm,
          campaign_id: Number(programForm.campaign_id),
          quantity: Number(programForm.quantity || 0),
          budget: Number(programForm.budget || 0)
        })
      });

      setProgramForm({
        campaign_id: "",
        program_name: "",
        mail_type: "",
        vendor_name: "",
        audience_name: "",
        quantity: "",
        budget: "",
        expected_in_home_start: "",
        expected_in_home_end: "",
        drop_date: "",
        status: "planned",
        notes: ""
      });

      setSuccess("Mail program created.");
      await loadDashboard();
    } catch (err) {
      setError(err.message || "Failed to create mail program");
    }
  }

  async function handleApplyFilters() {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.state) params.set("state", filters.state);

      const query = params.toString() ? `?${params.toString()}` : "";
      const programs = await apiRequest(`/api/mail/programs${query}`);
      setProgramsData(programs || { results: [] });
    } catch (err) {
      setError(err.message || "Failed to filter mail programs");
    } finally {
      setLoading(false);
    }
  }

  const visiblePrograms = useMemo(
    () => programsData.results || [],
    [programsData.results]
  );

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
            Track political mail programs, USPS movement, in-home windows, and delivery risk.
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
          {(dashboard.metrics || []).map((metric, index) => (
            <StatCard
              key={`${metric.label}-${index}`}
              label={metric.label}
              value={metric.value}
              delta={metric.delta}
            />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">Create Mail Program</h2>
              <p className="mt-1 text-sm text-slate-500">
                Attach a mail program to a campaign workspace.
              </p>
            </div>

            <form className="space-y-3" onSubmit={handleCreateProgram}>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                  placeholder="Campaign ID"
                  value={programForm.campaign_id}
                  onChange={(e) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      campaign_id: e.target.value
                    }))
                  }
                  required
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                  placeholder="Program name"
                  value={programForm.program_name}
                  onChange={(e) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      program_name: e.target.value
                    }))
                  }
                  required
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                  placeholder="Mail type"
                  value={programForm.mail_type}
                  onChange={(e) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      mail_type: e.target.value
                    }))
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                  placeholder="Vendor name"
                  value={programForm.vendor_name}
                  onChange={(e) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      vendor_name: e.target.value
                    }))
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                  placeholder="Audience"
                  value={programForm.audience_name}
                  onChange={(e) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      audience_name: e.target.value
                    }))
                  }
                />
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                  placeholder="Quantity"
                  value={programForm.quantity}
                  onChange={(e) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      quantity: e.target.value
                    }))
                  }
                />
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                  placeholder="Budget"
                  value={programForm.budget}
                  onChange={(e) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      budget: e.target.value
                    }))
                  }
                />
                <input
                  type="date"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                  value={programForm.drop_date}
                  onChange={(e) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      drop_date: e.target.value
                    }))
                  }
                />
                <select
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                  value={programForm.status}
                  onChange={(e) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      status: e.target.value
                    }))
                  }
                >
                  <option value="planned">planned</option>
                  <option value="entered_usps">entered_usps</option>
                  <option value="in_transit">in_transit</option>
                  <option value="out_for_delivery">out_for_delivery</option>
                  <option value="delivered">delivered</option>
                  <option value="issue">issue</option>
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="date"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                  value={programForm.expected_in_home_start}
                  onChange={(e) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      expected_in_home_start: e.target.value
                    }))
                  }
                />
                <input
                  type="date"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                  value={programForm.expected_in_home_end}
                  onChange={(e) =>
                    setProgramForm((prev) => ({
                      ...prev,
                      expected_in_home_end: e.target.value
                    }))
                  }
                />
              </div>

              <textarea
                className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                placeholder="Notes"
                value={programForm.notes}
                onChange={(e) =>
                  setProgramForm((prev) => ({
                    ...prev,
                    notes: e.target.value
                  }))
                }
              />

              <button
                type="submit"
                className="rounded-xl bg-[#0176D3] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Create Mail Program
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">Mail Filters</h2>
              <p className="mt-1 text-sm text-slate-500">
                Filter visible mail programs.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <input
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                placeholder="Search programs"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
              <input
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                placeholder="Status"
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
              />
              <input
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                placeholder="State"
                value={filters.state}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, state: e.target.value }))
                }
              />
            </div>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="rounded-xl bg-[#0176D3] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Apply Filters
              </button>

              <button
                type="button"
                onClick={loadDashboard}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#0176D3]"
              >
                Refresh
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {(dashboard.recent_events || []).length === 0 ? (
                <EmptyState text="No recent mail tracking events yet." />
              ) : (
                dashboard.recent_events.slice(0, 6).map((item) => (
                  <EventCard key={`${item.id}-${item.mail_program_id}`} item={item} />
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Mail Programs</h2>
            <p className="mt-1 text-sm text-slate-500">
              Live program tracking across campaigns.
            </p>
          </div>

          <div className="space-y-4">
            {loading ? (
              <EmptyState text="Loading mail programs..." />
            ) : visiblePrograms.length === 0 ? (
              <EmptyState text="No mail programs found." />
            ) : (
              visiblePrograms.map((item) => (
                <ProgramCard key={`${item.id}-${item.campaign_id}`} item={item} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
