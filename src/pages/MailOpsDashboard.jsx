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

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
      {text}
    </div>
  );
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

function Section({ title, subtitle, right, children }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function MailOpsDashboard() {
  const [loading, setLoading] = useState(true);
  const [savingProgram, setSavingProgram] = useState(false);
  const [savingDrop, setSavingDrop] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [dashboard, setDashboard] = useState({
    metrics: [],
    summary: {},
    recent_drops: [],
    recent_programs: []
  });

  const [campaigns, setCampaigns] = useState([]);
  const [programs, setPrograms] = useState([]);

  const [programForm, setProgramForm] = useState({
    campaign_id: "",
    name: "",
    vendor_name: "",
    mail_type: "",
    target_universe: "",
    quantity: "",
    budget: "",
    status: "draft",
    in_home_start: "",
    in_home_end: "",
    notes: ""
  });

  const [dropForm, setDropForm] = useState({
    program_id: "",
    campaign_id: "",
    drop_name: "",
    drop_date: "",
    entered_at: "",
    usps_entry_facility: "",
    region: "",
    quantity: "",
    expected_delivery_start: "",
    expected_delivery_end: "",
    actual_delivery_date: "",
    status: "planned",
    tracking_status: "",
    notes: ""
  });

  async function loadMailOps() {
    try {
      setLoading(true);
      setError("");

      const [dashboardData, campaignsData, programsData] = await Promise.all([
        apiRequest("/api/mail/dashboard"),
        apiRequest("/api/crm/campaigns"),
        apiRequest("/api/mail/programs")
      ]);

      setDashboard(dashboardData || {});
      setCampaigns(campaignsData.results || []);
      setPrograms(programsData.results || []);
    } catch (err) {
      setError(err.message || "Failed to load MailOps dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMailOps();
  }, []);

  const selectedProgramCampaignId = useMemo(() => {
    const program = programs.find(
      (item) => String(item.id) === String(dropForm.program_id)
    );
    return program?.campaign_id ? String(program.campaign_id) : "";
  }, [dropForm.program_id, programs]);

  useEffect(() => {
    if (selectedProgramCampaignId) {
      setDropForm((prev) => ({
        ...prev,
        campaign_id: selectedProgramCampaignId
      }));
    }
  }, [selectedProgramCampaignId]);

  async function handleCreateProgram(e) {
    e.preventDefault();

    try {
      setSavingProgram(true);
      setError("");
      setSuccess("");

      await apiRequest("/api/mail/programs", {
        method: "POST",
        body: JSON.stringify({
          campaign_id: Number(programForm.campaign_id),
          name: programForm.name,
          vendor_name: programForm.vendor_name || null,
          mail_type: programForm.mail_type || null,
          target_universe: programForm.target_universe || null,
          quantity: Number(programForm.quantity || 0),
          budget: Number(programForm.budget || 0),
          status: programForm.status || "draft",
          in_home_start: programForm.in_home_start || null,
          in_home_end: programForm.in_home_end || null,
          notes: programForm.notes || null
        })
      });

      setProgramForm({
        campaign_id: "",
        name: "",
        vendor_name: "",
        mail_type: "",
        target_universe: "",
        quantity: "",
        budget: "",
        status: "draft",
        in_home_start: "",
        in_home_end: "",
        notes: ""
      });

      setSuccess("Mail program created.");
      await loadMailOps();
    } catch (err) {
      setError(err.message || "Failed to create mail program");
    } finally {
      setSavingProgram(false);
    }
  }

  async function handleCreateDrop(e) {
    e.preventDefault();

    try {
      setSavingDrop(true);
      setError("");
      setSuccess("");

      await apiRequest("/api/mail/drops", {
        method: "POST",
        body: JSON.stringify({
          program_id: Number(dropForm.program_id),
          campaign_id: Number(dropForm.campaign_id),
          drop_name: dropForm.drop_name,
          drop_date: dropForm.drop_date || null,
          entered_at: dropForm.entered_at || null,
          usps_entry_facility: dropForm.usps_entry_facility || null,
          region: dropForm.region || null,
          quantity: Number(dropForm.quantity || 0),
          expected_delivery_start: dropForm.expected_delivery_start || null,
          expected_delivery_end: dropForm.expected_delivery_end || null,
          actual_delivery_date: dropForm.actual_delivery_date || null,
          status: dropForm.status || "planned",
          tracking_status: dropForm.tracking_status || null,
          notes: dropForm.notes || null
        })
      });

      setDropForm({
        program_id: "",
        campaign_id: "",
        drop_name: "",
        drop_date: "",
        entered_at: "",
        usps_entry_facility: "",
        region: "",
        quantity: "",
        expected_delivery_start: "",
        expected_delivery_end: "",
        actual_delivery_date: "",
        status: "planned",
        tracking_status: "",
        notes: ""
      });

      setSuccess("Mail drop created.");
      await loadMailOps();
    } catch (err) {
      setError(err.message || "Failed to create mail drop");
    } finally {
      setSavingDrop(false);
    }
  }

  const summary = dashboard.summary || {};
  const recentPrograms = dashboard.recent_programs || [];
  const recentDrops = dashboard.recent_drops || [];

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
            VoterSpheres MailOps
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            Mail Operations Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track mail programs, drops, USPS entry, delivery windows, and campaign mail execution.
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
            subtext="Tracked programs"
          />
          <StatCard
            label="Mail Drops"
            value={summary.drops || 0}
            subtext="Tracked drops"
          />
          <StatCard
            label="In Transit"
            value={summary.in_transit || 0}
            subtext="USPS movement"
          />
          <StatCard
            label="Delivered"
            value={summary.delivered || 0}
            subtext="Completed delivery"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          <StatCard
            label="Total Quantity"
            value={Number(summary.total_quantity || 0).toLocaleString()}
            subtext="Pieces across drops"
          />
          <StatCard
            label="Total Budget"
            value={formatMoney(summary.total_budget || 0)}
            subtext="Program budget tracked"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Create Mail Program" subtitle="Define campaign mail strategy">
            <form className="space-y-3" onSubmit={handleCreateProgram}>
              <select
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                value={programForm.campaign_id}
                onChange={(e) =>
                  setProgramForm((prev) => ({
                    ...prev,
                    campaign_id: e.target.value
                  }))
                }
                required
              >
                <option value="">Select campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.campaign_name} • {campaign.candidate_name}
                  </option>
                ))}
              </select>

              <input
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                placeholder="Program name"
                value={programForm.name}
                onChange={(e) =>
                  setProgramForm((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />

              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                  placeholder="Vendor name"
                  value={programForm.vendor_name}
                  onChange={(e) =>
                   
