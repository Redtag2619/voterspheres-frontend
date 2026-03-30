import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { crmApi } from "../services/api";

function StatCard({ label, value, subtitle }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      {subtitle ? <div className="mt-2 text-sm text-slate-500">{subtitle}</div> : null}
    </div>
  );
}

function stageBadge(stage) {
  const value = String(stage || "active").toLowerCase();

  if (value === "lead") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (value === "won" || value === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value === "lost" || value === "closed") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function statusBadge(status) {
  const value = String(status || "open").toLowerCase();

  if (value === "open" || value === "active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value === "at_risk" || value === "delayed") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (value === "closed" || value === "lost") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none";

function CreateCampaignModal({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  creating,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[#0176D3]">
              New Campaign
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Create Campaign
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Launch a new campaign record and route directly into its live workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Close
          </button>
        </div>

        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <Field label="Campaign Name">
            <input
              className={inputClass}
              value={form.campaign_name}
              onChange={(e) =>
                setForm((s) => ({ ...s, campaign_name: e.target.value }))
              }
              placeholder="Louisiana Governor 2027"
            />
          </Field>

          <Field label="Candidate Name">
            <input
              className={inputClass}
              value={form.candidate_name}
              onChange={(e) =>
                setForm((s) => ({ ...s, candidate_name: e.target.value }))
              }
              placeholder="John Example"
            />
          </Field>

          <Field label="Office">
            <input
              className={inputClass}
              value={form.office}
              onChange={(e) =>
                setForm((s) => ({ ...s, office: e.target.value }))
              }
              placeholder="Governor"
            />
          </Field>

          <Field label="State">
            <input
              className={inputClass}
              value={form.state}
              onChange={(e) =>
                setForm((s) => ({ ...s, state: e.target.value }))
              }
              placeholder="Louisiana"
            />
          </Field>

          <Field label="Party">
            <input
              className={inputClass}
              value={form.party}
              onChange={(e) =>
                setForm((s) => ({ ...s, party: e.target.value }))
              }
              placeholder="Republican / Democrat / Independent"
            />
          </Field>

          <Field label="Stage">
            <select
              className={inputClass}
              value={form.stage}
              onChange={(e) =>
                setForm((s) => ({ ...s, stage: e.target.value }))
              }
            >
              <option value="lead">lead</option>
              <option value="active">active</option>
              <option value="won">won</option>
              <option value="lost">lost</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) =>
                setForm((s) => ({ ...s, status: e.target.value }))
              }
            >
              <option value="open">open</option>
              <option value="active">active</option>
              <option value="closed">closed</option>
              <option value="at_risk">at_risk</option>
            </select>
          </Field>

          <Field label="Contract Value">
            <input
              className={inputClass}
              type="number"
              value={form.contract_value}
              onChange={(e) =>
                setForm((s) => ({ ...s, contract_value: e.target.value }))
              }
              placeholder="125000"
            />
          </Field>

          <Field label="Budget Total">
            <input
              className={inputClass}
              type="number"
              value={form.budget_total}
              onChange={(e) =>
                setForm((s) => ({ ...s, budget_total: e.target.value }))
              }
              placeholder="500000"
            />
          </Field>

          <Field label="County">
            <input
              className={inputClass}
              value={form.county}
              onChange={(e) =>
                setForm((s) => ({ ...s, county: e.target.value }))
              }
              placeholder="Optional"
            />
          </Field>

          <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-2xl bg-[#0176D3] px-5 py-3 text-sm font-semibold text-white"
            >
              {creating ? "Creating..." : "Create Campaign & Open Workspace"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CampaignPipeline() {
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    campaign_name: "",
    candidate_name: "",
    office: "",
    state: "",
    county: "",
    party: "",
    stage: "active",
    status: "open",
    budget_total: "",
    contract_value: "",
  });

  async function loadCampaigns() {
    try {
      setLoading(true);
      setError("");

      const result = await crmApi.campaigns();
      setCampaigns(Array.isArray(result) ? result : result?.campaigns || []);
    } catch (err) {
      setError(err?.message || "Failed to load campaign pipeline");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function handleCreateCampaign(e) {
    e.preventDefault();

    try {
      setCreating(true);
      setError("");

      const payload = {
        campaign_name: createForm.campaign_name,
        candidate_name: createForm.candidate_name,
        office: createForm.office,
        state: createForm.state,
        county: createForm.county || null,
        party: createForm.party || null,
        stage: createForm.stage,
        status: createForm.status,
        budget_total: Number(createForm.budget_total || 0),
        contract_value: Number(createForm.contract_value || 0),
      };

      const created = await crmApi.createCampaign(payload);

      const newId = created?.id;
      if (!newId) {
        throw new Error("Campaign created but no id was returned");
      }

      setShowCreateModal(false);
      setCreateForm({
        campaign_name: "",
        candidate_name: "",
        office: "",
        state: "",
        county: "",
        party: "",
        stage: "active",
        status: "open",
        budget_total: "",
        contract_value: "",
      });

      await loadCampaigns();
      navigate(`/campaigns/${newId}`);
    } catch (err) {
      setError(err?.message || "Failed to create campaign");
    } finally {
      setCreating(false);
    }
  }

  const filteredCampaigns = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return campaigns;

    return campaigns.filter((campaign) => {
      return [
        campaign.campaign_name,
        campaign.candidate_name,
        campaign.office,
        campaign.state,
        campaign.party,
        campaign.stage,
        campaign.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [campaigns, search]);

  const metrics = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c) =>
      ["active", "open"].includes(String(c.status || "").toLowerCase())
    ).length;
    const lead = campaigns.filter((c) =>
      ["lead"].includes(String(c.stage || "").toLowerCase())
    ).length;
    const totalValue = campaigns.reduce(
      (sum, c) => sum + Number(c.contract_value || 0),
      0
    );

    return {
      total,
      active,
      lead,
      totalValue,
    };
  }, [campaigns]);

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] border border-[#d8dde6] bg-gradient-to-r from-[#0176D3] to-[#0b5cab] p-8 text-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-blue-100">
                Campaign Pipeline
              </div>
              <h1 className="mt-2 text-3xl font-semibold">
                Campaign Pipeline + Workspace Launcher
              </h1>
              <p className="mt-3 max-w-3xl text-sm text-blue-50">
                Track every campaign in the system and jump directly into the live campaign cockpit.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#0176D3] shadow-sm"
            >
              + Create Campaign
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard label="Total Campaigns" value={metrics.total} />
          <StatCard label="Active" value={metrics.active} />
          <StatCard label="Lead Stage" value={metrics.lead} />
          <StatCard
            label="Pipeline Value"
            value={`$${metrics.totalValue.toLocaleString()}`}
          />
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-slate-900">
              Campaigns
            </h2>

            <input
              className="w-full max-w-sm rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
              placeholder="Search campaigns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Loading campaign pipeline...
              </div>
            ) : filteredCampaigns.length ? (
              filteredCampaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  to={`/campaigns/${campaign.id}`}
                  className="block rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-[#0176D3]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-slate-900">
                        {campaign.campaign_name}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {campaign.candidate_name} · {campaign.office} · {campaign.state}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${stageBadge(
                          campaign.stage
                        )}`}
                      >
                        {campaign.stage}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No campaigns found.
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateCampaignModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCampaign}
        form={createForm}
        setForm={setCreateForm}
        creating={creating}
      />
    </div>
  );
}
