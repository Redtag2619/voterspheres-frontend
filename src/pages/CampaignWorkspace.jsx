import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

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

function StatCard({ label, value, subtext }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
      <div className="mt-2 text-sm text-slate-400">{subtext}</div>
    </div>
  );
}

function Section({ title, children, right }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function CampaignWorkspace() {
  const { id } = useParams();

  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [contactForm, setContactForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "",
    organization: "",
    notes: ""
  });

  const [vendorForm, setVendorForm] = useState({
    vendor_name: "",
    category: "",
    status: "prospect",
    contract_value: "",
    notes: ""
  });

  const [taskForm, setTaskForm] = useState({
    assigned_user_id: "",
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    due_date: ""
  });

  async function loadWorkspace() {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest(`/api/crm/campaigns/${id}`);
      setWorkspace(data);
    } catch (err) {
      setError(err.message || "Failed to load campaign workspace");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) loadWorkspace();
  }, [id]);

  const campaign = workspace?.campaign;
  const summary = workspace?.workspace_summary;

  const ownerName = useMemo(() => {
    if (!campaign) return "Unassigned";
    const full = `${campaign.owner_first_name || ""} ${
      campaign.owner_last_name || ""
    }`.trim();
    return full || "Unassigned";
  }, [campaign]);

  async function handleAddContact(e) {
    e.preventDefault();

    try {
      setBusy(true);
      setError("");
      setSuccess("");

      await apiRequest(`/api/crm/campaigns/${id}/contacts`, {
        method: "POST",
        body: JSON.stringify(contactForm)
      });

      setContactForm({
        full_name: "",
        email: "",
        phone: "",
        role: "",
        organization: "",
        notes: ""
      });

      setSuccess("Contact added.");
      await loadWorkspace();
    } catch (err) {
      setError(err.message || "Failed to add contact");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddVendor(e) {
    e.preventDefault();

    try {
      setBusy(true);
      setError("");
      setSuccess("");

      await apiRequest(`/api/crm/campaigns/${id}/vendors`, {
        method: "POST",
        body: JSON.stringify({
          ...vendorForm,
          contract_value: vendorForm.contract_value
            ? Number(vendorForm.contract_value)
            : 0
        })
      });

      setVendorForm({
        vendor_name: "",
        category: "",
        status: "prospect",
        contract_value: "",
        notes: ""
      });

      setSuccess("Vendor added.");
      await loadWorkspace();
    } catch (err) {
      setError(err.message || "Failed to add vendor");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddTask(e) {
    e.preventDefault();

    try {
      setBusy(true);
      setError("");
      setSuccess("");

      await apiRequest(`/api/crm/campaigns/${id}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          ...taskForm,
          assigned_user_id: taskForm.assigned_user_id
            ? Number(taskForm.assigned_user_id)
            : null
        })
      });

      setTaskForm({
        assigned_user_id: "",
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        due_date: ""
      });

      setSuccess("Task added.");
      await loadWorkspace();
    } catch (err) {
      setError(err.message || "Failed to add task");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060b14] p-6 text-white">
        <div className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
          Loading campaign workspace...
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    return (
      <div className="min-h-screen bg-[#060b14] p-6 text-white">
        <div className="mx-auto max-w-7xl rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
                Campaign Workspace
              </div>
              <h1 className="mt-2 text-3xl font-semibold">
                {campaign?.campaign_name}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {campaign?.candidate_name} • {campaign?.office || "Office N/A"} •{" "}
                {campaign?.state || "State N/A"}
              </p>
            </div>

            <div className="grid gap-2 text-sm text-slate-300">
              <div>
                <span className="text-slate-500">Firm:</span>{" "}
                {campaign?.firm_name || "Unassigned"}
              </div>
              <div>
                <span className="text-slate-500">Owner:</span> {ownerName}
              </div>
              <div>
                <span className="text-slate-500">Stage:</span>{" "}
                {campaign?.stage || "N/A"}
              </div>
              <div>
                <span className="text-slate-500">Status:</span>{" "}
                {campaign?.status || "N/A"}
              </div>
            </div>
          </div>
        </div>

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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Contacts"
            value={summary?.contacts ?? 0}
            subtext="Campaign relationships"
          />
          <StatCard
            label="Vendors"
            value={summary?.vendors ?? 0}
            subtext="Active and prospect partners"
          />
          <StatCard
            label="Open Tasks"
            value={summary?.tasks_open ?? 0}
            subtext="Needs action"
          />
          <StatCard
            label="Documents"
            value={summary?.documents ?? 0}
            subtext="Workspace assets"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Campaign Overview">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-300">
                <div className="space-y-2">
                  <p>
                    <span className="text-slate-500">Party:</span>{" "}
                    {campaign?.party || "N/A"}
                  </p>
                  <p>
                    <span className="text-slate-500">County:</span>{" "}
                    {campaign?.county || "N/A"}
                  </p>
                  <p>
                    <span className="text-slate-500">Election Year:</span>{" "}
                    {campaign?.election_year || "N/A"}
                  </p>
                  <p>
                    <span className="text-slate-500">Incumbent Status:</span>{" "}
                    {campaign?.incumbent_status || "N/A"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-300">
                <div className="space-y-2">
                  <p>
                    <span className="text-slate-500">Contract Value:</span> $
                    {Number(campaign?.contract_value || 0).toLocaleString()}
                  </p>
                  <p>
                    <span className="text-slate-500">Budget Total:</span> $
                    {Number(campaign?.budget_total || 0).toLocaleString()}
                  </p>
                  <p>
                    <span className="text-slate-500">Website:</span>{" "}
                    {campaign?.website ? (
                      <a
                        href={campaign.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-300 hover:text-cyan-200"
                      >
                        {campaign.website}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-300">
              <div className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                Notes
              </div>
              {campaign?.notes || "No notes yet."}
            </div>
          </Section>

          <Section title="Add Contact">
            <form className="space-y-3" onSubmit={handleAddContact}>
              <input
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                placeholder="Full name"
                value={contactForm.full_name}
                onChange={(e) =>
                  setContactForm((prev) => ({
                    ...prev,
                    full_name: e.target.value
                  }))
                }
                required
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Email"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      email: e.target.value
                    }))
                  }
                />
                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Phone"
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      phone: e.target.value
                    }))
                  }
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Role"
                  value={contactForm.role}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      role: e.target.value
                    }))
                  }
                />
                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Organization"
                  value={contactForm.organization}
                  onChange={(e) =>
                    setContactForm((prev) => ({
                      ...prev,
                      organization: e.target.value
                    }))
                  }
                />
              </div>
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                placeholder="Notes"
                value={contactForm.notes}
                onChange={(e) =>
                  setContactForm((prev) => ({
                    ...prev,
                    notes: e.target.value
                  }))
                }
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add Contact
              </button>
            </form>
          </Section>

          <Section title="Add Vendor">
            <form className="space-y-3" onSubmit={handleAddVendor}>
              <input
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                placeholder="Vendor name"
                value={vendorForm.vendor_name}
                onChange={(e) =>
                  setVendorForm((prev) => ({
                    ...prev,
                    vendor_name: e.target.value
                  }))
                }
                required
              />
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Category"
                  value={vendorForm.category}
                  onChange={(e) =>
                    setVendorForm((prev) => ({
                      ...prev,
                      category: e.target.value
                    }))
                  }
                />
                <select
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={vendorForm.status}
                  onChange={(e) =>
                    setVendorForm((prev) => ({
                      ...prev,
                      status: e.target.value
                    }))
                  }
                >
                  <option value="prospect">prospect</option>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="closed">closed</option>
                </select>
                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Contract value"
                  value={vendorForm.contract_value}
                  onChange={(e) =>
                    setVendorForm((prev) => ({
                      ...prev,
                      contract_value: e.target.value
                    }))
                  }
                />
              </div>
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                placeholder="Notes"
                value={vendorForm.notes}
                onChange={(e) =>
                  setVendorForm((prev) => ({
                    ...prev,
                    notes: e.target.value
                  }))
                }
              />
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add Vendor
              </button>
            </form>
          </Section>

          <Section title="Add Task">
            <form className="space-y-3" onSubmit={handleAddTask}>
              <input
                className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                placeholder="Task title"
                value={taskForm.title}
                onChange={(e) =>
                  setTaskForm((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
              <textarea
                className="min-h-[100px] w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                placeholder="Task description"
                value={taskForm.description}
                onChange={(e) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    description: e.target.value
                  }))
                }
              />
              <div className="grid gap-3 md:grid-cols-3">
                <select
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={taskForm.status}
                  onChange={(e) =>
                    setTaskForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                >
                  <option value="todo">todo</option>
                  <option value="in_progress">in_progress</option>
                  <option value="done">done</option>
                </select>
                <select
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={taskForm.priority}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      priority: e.target.value
                    }))
                  }
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
                <input
                  type="date"
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={taskForm.due_date}
                  onChange={(e) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      due_date: e.target.value
                    }))
                  }
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add Task
              </button>
            </form>
          </Section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <Section title="Contacts">
            <div className="space-y-3">
              {campaign?.contacts?.length ? (
                campaign.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-300"
                  >
                    <div className="font-semibold text-white">
                      {contact.full_name}
                    </div>
                    <div className="mt-1 text-slate-400">
                      {contact.role || "No role"}
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-slate-400">
                      <div>Email: {contact.email || "N/A"}</div>
                      <div>Phone: {contact.phone || "N/A"}</div>
                      <div>Organization: {contact.organization || "N/A"}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-500">
                  No contacts yet.
                </div>
              )}
            </div>
          </Section>

          <Section title="Vendors">
            <div className="space-y-3">
              {campaign?.vendors?.length ? (
                campaign.vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-300"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white">
                        {vendor.vendor_name}
                      </div>
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300">
                        {vendor.status}
                      </span>
                    </div>
                    <div className="mt-2 text-slate-400">
                      {vendor.category || "No category"}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      Contract: $
                      {Number(vendor.contract_value || 0).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-500">
                  No vendors yet.
                </div>
              )}
            </div>
          </Section>

          <Section title="Tasks">
            <div className="space-y-3">
              {campaign?.tasks?.length ? (
                campaign.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-300"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white">{task.title}</div>
                      <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-300">
                        {task.status}
                      </span>
                    </div>
                    <div className="mt-2 text-slate-400">
                      {task.description || "No description"}
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-slate-400">
                      <div>Priority: {task.priority}</div>
                      <div>Due: {task.due_date || "N/A"}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-500">
                  No tasks yet.
                </div>
              )}
            </div>
          </Section>

          <Section title="Recent Activity">
            <div className="space-y-3">
              {campaign?.activity?.length ? (
                campaign.activity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-300"
                  >
                    <div className="font-medium text-white">{item.summary}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.14em] text-cyan-300">
                      {item.activity_type}
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "N/A"}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-500">
                  No activity yet.
                </div>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
