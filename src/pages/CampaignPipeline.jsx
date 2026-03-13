import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

const PIPELINE_STAGES = [
  "Lead",
  "Prospect",
  "Proposal",
  "Contracted",
  "Active Campaign",
  "Post-Election"
];

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

function StageColumn({ stage, campaigns }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-300">
          {stage}
        </h3>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
          {campaigns.length}
        </span>
      </div>

      <div className="space-y-3">
        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#0b1220] p-4 text-sm text-slate-500">
            No campaigns
          </div>
        ) : (
          campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              to={`/campaigns/${campaign.id}`}
              className="block rounded-xl border border-white/10 bg-[#0b1220] p-4 transition hover:border-cyan-400/40"
            >
              <div className="text-sm font-semibold text-white">
                {campaign.campaign_name}
              </div>
              <div className="mt-1 text-sm text-slate-400">
                {campaign.candidate_name}
              </div>

              <div className="mt-3 grid gap-2 text-xs text-slate-400">
                <div>
                  <span className="text-slate-500">Office:</span>{" "}
                  {campaign.office || "N/A"}
                </div>
                <div>
                  <span className="text-slate-500">State:</span>{" "}
                  {campaign.state || "N/A"}
                </div>
                <div>
                  <span className="text-slate-500">Party:</span>{" "}
                  {campaign.party || "N/A"}
                </div>
                <div>
                  <span className="text-slate-500">Contract:</span> $
                  {Number(campaign.contract_value || 0).toLocaleString()}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function CampaignPipeline() {
  const [campaigns, setCampaigns] = useState([]);
  const [firms, setFirms] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({
    stage: "",
    state: "",
    search: ""
  });

  const [form, setForm] = useState({
    firm_id: "",
    owner_user_id: "",
    candidate_name: "",
    campaign_name: "",
    office: "",
    state: "",
    county: "",
    party: "",
    election_year: "2026",
    stage: "Lead",
    status: "Open",
    incumbent_status: "",
    website: "",
    contract_value: "",
    budget_total: "",
    notes: ""
  });

  async function loadReferenceData() {
    const [firmsData, usersData] = await Promise.all([
      apiRequest("/api/crm/firms"),
      apiRequest("/api/crm/users")
    ]);

    setFirms(firmsData.results || []);
    setUsers(usersData.results || []);
  }

  async function loadCampaigns() {
    const params = new URLSearchParams();

    if (filters.stage) params.set("stage", filters.stage);
    if (filters.state) params.set("state", filters.state);
    if (filters.search) params.set("search", filters.search);

    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiRequest(`/api/crm/campaigns${query}`);
    setCampaigns(data.results || []);
  }

  async function bootstrap() {
    try {
      setLoading(true);
      setError("");
      await Promise.all([loadReferenceData(), loadCampaigns()]);
    } catch (err) {
      setError(err.message || "Failed to load campaign pipeline");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    try {
      setLoading(true);
      await loadCampaigns();
    } catch (err) {
      setError(err.message || "Failed to search campaigns");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCampaign(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await apiRequest("/api/crm/campaigns", {
        method: "POST",
        body: JSON.stringify({
          firm_id: form.firm_id ? Number(form.firm_id) : null,
          owner_user_id: form.owner_user_id ? Number(form.owner_user_id) : null,
          candidate_name: form.candidate_name,
          campaign_name: form.campaign_name,
          office: form.office || null,
          state: form.state || null,
          county: form.county || null,
          party: form.party || null,
          election_year: form.election_year ? Number(form.election_year) : null,
          stage: form.stage,
          status: form.status,
          incumbent_status: form.incumbent_status || null,
          website: form.website || null,
          contract_value: form.contract_value ? Number(form.contract_value) : 0,
          budget_total: form.budget_total ? Number(form.budget_total) : 0,
          notes: form.notes || null
        })
      });

      setForm({
        firm_id: "",
        owner_user_id: "",
        candidate_name: "",
        campaign_name: "",
        office: "",
        state: "",
        county: "",
        party: "",
        election_year: "2026",
        stage: "Lead",
        status: "Open",
        incumbent_status: "",
        website: "",
        contract_value: "",
        budget_total: "",
        notes: ""
      });

      setSuccess("Campaign workspace created.");
      await loadCampaigns();
    } catch (err) {
      setError(err.message || "Failed to create campaign");
    } finally {
      setSaving(false);
    }
  }

  const grouped = useMemo(() => {
    return PIPELINE_STAGES.reduce((acc, stage) => {
      acc[stage] = campaigns.filter((campaign) => campaign.stage === stage);
      return acc;
    }, {});
  }, [campaigns]);

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            VoterSpheres CRM
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Campaign Pipeline</h1>
          <p className="mt-2 text-sm text-slate-400">
            Track campaign opportunities from lead to post-election engagement.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr,1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">
              Create Campaign Workspace
            </h2>

            <form className="mt-5 space-y-4" onSubmit={handleCreateCampaign}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-400">Firm</label>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                    value={form.firm_id}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, firm_id: e.target.value }))
                    }
                  >
                    <option value="">Select firm</option>
                    {firms.map((firm) => (
                      <option key={firm.id} value={firm.id}>
                        {firm.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-400">
                    Owner User
                  </label>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                    value={form.owner_user_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        owner_user_id: e.target.value
                      }))
                    }
                  >
                    <option value="">Select owner</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={form.candidate_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      candidate_name: e.target.value
                    }))
                  }
                  placeholder="Candidate name"
                  required
                />
                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={form.campaign_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      campaign_name: e.target.value
                    }))
                  }
                  placeholder="Campaign name"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={form.office}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, office: e.target.value }))
                  }
                  placeholder="Office"
                />
                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={form.state}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, state: e.target.value }))
                  }
                  placeholder="State"
                />
                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={form.party}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, party: e.target.value }))
                  }
                  placeholder="Party"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={form.election_year}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      election_year: e.target.value
                    }))
                  }
                  placeholder="Election year"
                />

                <select
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={form.stage}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, stage: e.target.value }))
                  }
                >
                  {PIPELINE_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>

                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={form.contract_value}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      contract_value: e.target.value
                    }))
                  }
                  placeholder="Contract value"
                />

                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={form.budget_total}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      budget_total: e.target.value
                    }))
                  }
                  placeholder="Budget total"
                />
              </div>

              <textarea
                className="min-h-[100px] w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Notes..."
              />

              {error ? (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create Campaign"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Pipeline Board</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {campaigns.length} campaigns loaded
                </p>
              </div>

              <form
                onSubmit={handleSearch}
                className="grid gap-3 md:grid-cols-4 xl:w-[780px]"
              >
                <select
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  value={filters.stage}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, stage: e.target.value }))
                  }
                >
                  <option value="">All stages</option>
                  {PIPELINE_STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>

                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  value={filters.state}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, state: e.target.value }))
                  }
                  placeholder="Filter by state"
                />

                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  placeholder="Search campaigns"
                />

                <button
                  type="submit"
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400"
                >
                  Apply
                </button>
              </form>
            </div>

            <div className="mt-6 overflow-x-auto">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 text-sm text-slate-400">
                  Loading pipeline...
                </div>
              ) : (
                <div className="grid min-w-[1200px] gap-4 xl:grid-cols-6">
                  {PIPELINE_STAGES.map((stage) => (
                    <StageColumn
                      key={stage}
                      stage={stage}
                      campaigns={grouped[stage] || []}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
