import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:10000";

const TABS = [
  "Overview",
  "Contacts",
  "Vendors",
  "Tasks",
  "Documents",
  "Fundraising",
  "Forecast"
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

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function formatMoneyCompact(value) {
  const n = Number(value || 0);
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function Section({ title, subtitle, right, children }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
          ) : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
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

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 text-sm text-slate-500">
      {text}
    </div>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-4 py-2 text-sm font-medium transition",
        active
          ? "bg-cyan-500 text-slate-950"
          : "border border-white/10 bg-[#111827] text-slate-300 hover:border-cyan-400"
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function ContactCard({ contact }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="font-semibold text-white">{contact.full_name}</div>
      <div className="mt-1 text-sm text-slate-400">{contact.role || "No role"}</div>
      <div className="mt-3 grid gap-1 text-xs text-slate-400">
        <div>Email: {contact.email || "N/A"}</div>
        <div>Phone: {contact.phone || "N/A"}</div>
        <div>Organization: {contact.organization || "N/A"}</div>
        <div>Notes: {contact.notes || "N/A"}</div>
      </div>
    </div>
  );
}

function VendorCard({ vendor }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-white">{vendor.vendor_name}</div>
          <div className="mt-1 text-sm text-slate-400">
            {vendor.category || "Vendor"}
          </div>
        </div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
          {vendor.status || "prospect"}
        </span>
      </div>

      <div className="mt-3 text-xs text-slate-400">
        Contract: {formatMoney(vendor.contract_value || 0)}
      </div>
      <div className="mt-1 text-xs text-slate-500">{vendor.notes || "No notes"}</div>
    </div>
  );
}

function TaskCard({ task }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-white">{task.title}</div>
          <div className="mt-1 text-sm text-slate-400">
            {task.description || "No description"}
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs ${
            task.priority === "high"
              ? "border border-amber-400/20 bg-amber-500/10 text-amber-300"
              : "border border-white/10 bg-[#0b1220] text-slate-300"
          }`}
        >
          {task.priority || "medium"}
        </span>
      </div>

      <div className="mt-3 grid gap-1 text-xs text-slate-400">
        <div>Status: {task.status || "todo"}</div>
        <div>Due: {task.due_date || "No due date"}</div>
        <div>
          Assigned:{" "}
          {`${task.assigned_first_name || ""} ${task.assigned_last_name || ""}`.trim() ||
            "Unassigned"}
        </div>
      </div>
    </div>
  );
}

function DocumentCard({ doc }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="font-semibold text-white">{doc.name}</div>
      <div className="mt-1 text-sm text-slate-400">
        {doc.document_type || "Document"}
      </div>
      <div className="mt-3 text-xs text-slate-400">
        Uploaded: {doc.created_at ? new Date(doc.created_at).toLocaleString() : "N/A"}
      </div>
      <div className="mt-2">
        {doc.file_url ? (
          <a
            href={doc.file_url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-cyan-300 hover:text-cyan-200"
          >
            Open file
          </a>
        ) : (
          <span className="text-xs text-slate-500">No file URL</span>
        )}
      </div>
    </div>
  );
}

function ActivityCard({ item }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="font-medium text-white">{item.summary}</div>
      <div className="mt-1 text-xs uppercase tracking-[0.14em] text-cyan-300">
        {item.activity_type}
      </div>
      <div className="mt-2 text-xs text-slate-500">
        {item.created_at ? new Date(item.created_at).toLocaleString() : "N/A"}
      </div>
    </div>
  );
}

export default function CampaignWorkspace() {
  const { id } = useParams();

  const [activeTab, setActiveTab] = useState("Overview");
  const [workspace, setWorkspace] = useState(null);
  const [fundraisingData, setFundraisingData] = useState([]);
  const [forecastData, setForecastData] = useState(null);

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

  const [documentForm, setDocumentForm] = useState({
    name: "",
    document_type: "",
    file_url: "",
    uploaded_by_user_id: ""
  });

  async function loadWorkspace() {
    const data = await apiRequest(`/api/crm/campaigns/${id}`);
    setWorkspace(data);
    return data;
  }

  async function loadFundraising(campaignData) {
    try {
      const response = await apiRequest("/api/intelligence/fundraising/leaderboard");
      const rows = response?.leaderboard || response?.results || [];
      const state = campaignData?.campaign?.state;
      const candidateName = campaignData?.campaign?.candidate_name;

      const filtered = rows.filter((row) => {
        const nameMatch =
          candidateName &&
          String(row.name || "")
            .toLowerCase()
            .includes(String(candidateName).toLowerCase());

        const stateMatch =
          state &&
          String(row.state || "").toLowerCase() === String(state).toLowerCase();

        return nameMatch || stateMatch;
      });

      setFundraisingData(filtered);
    } catch {
      setFundraisingData([]);
    }
  }

  async function loadForecast(campaignData) {
    try {
      const response = await apiRequest("/api/forecast/published");
      const races = response?.races || [];
      const state = campaignData?.campaign?.state;
      const office = campaignData?.campaign?.office;

      const matchedRace =
        races.find((race) => {
          const stateMatch =
            state &&
            String(race.state || "").toLowerCase() === String(state).toLowerCase();
          const officeMatch =
            office &&
            String(race.office || "").toLowerCase().includes(String(office).toLowerCase());
          return stateMatch && officeMatch;
        }) ||
        races.find((race) => {
          const stateMatch =
            state &&
            String(race.state || "").toLowerCase() === String(state).toLowerCase();
          return stateMatch;
        }) ||
        null;

      setForecastData(matchedRace);
    } catch {
      setForecastData(null);
    }
  }

  async function bootstrap() {
    try {
      setLoading(true);
      setError("");

      const campaignData = await loadWorkspace();
      await Promise.all([loadFundraising(campaignData), loadForecast(campaignData)]);
    } catch (err) {
      setError(err.message || "Failed to load campaign workspace");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      bootstrap();
    }
  }, [id]);

  const campaign = workspace?.campaign;
  const summary = workspace?.workspace_summary;

  const ownerName = useMemo(() => {
    if (!campaign) return "Unassigned";
    const full = `${campaign.owner_first_name || ""} ${campaign.owner_last_name || ""}`.trim();
    return full || "Unassigned";
  }, [campaign]);

  const fundraisingTotals = useMemo(() => {
    const receipts = fundraisingData.reduce(
      (sum, row) => sum + Number(row.receipts || 0),
      0
    );
    const cash = fundraisingData.reduce(
      (sum, row) => sum + Number(row.cash_on_hand || row.cash_on_hand_end_period || 0),
      0
    );
    return { receipts, cash };
  }, [fundraisingData]);

  async function refreshAll() {
    setSuccess("");
    setError("");
    await bootstrap();
  }

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
      await refreshAll();
      setActiveTab("Contacts");
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
      await refreshAll();
      setActiveTab("Vendors");
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
      await refreshAll();
      setActiveTab("Tasks");
    } catch (err) {
      setError(err.message || "Failed to add task");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddDocument(e) {
    e.preventDefault();
    try {
      setBusy(true);
      setError("");
      setSuccess("");

      await apiRequest(`/api/crm/campaigns/${id}/documents`, {
        method: "POST",
        body: JSON.stringify({
          ...documentForm,
          uploaded_by_user_id: documentForm.uploaded_by_user_id
            ? Number(documentForm.uploaded_by_user_id)
            : null
        })
      });

      setDocumentForm({
        name: "",
        document_type: "",
        file_url: "",
        uploaded_by_user_id: ""
      });

      setSuccess("Document added.");
      await refreshAll();
      setActiveTab("Documents");
    } catch (err) {
      setError(err.message || "Failed to add document");
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

          <div className="mt-6 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <TabButton
                key={tab}
                active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </TabButton>
            ))}
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

        {activeTab === "Overview" && (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Contacts"
                value={summary?.contacts ?? 0}
                subtext="Campaign relationships"
              />
              <StatCard
                label="Vendors"
                value={summary?.vendors ?? 0}
                subtext="Partners and prospects"
              />
              <StatCard
                label="Open Tasks"
                value={summary?.tasks_open ?? 0}
                subtext="Needs attention"
              />
              <StatCard
                label="Documents"
                value={summary?.documents ?? 0}
                subtext="Workspace assets"
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Section title="Campaign Overview" subtitle="Core campaign profile">
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
                        <span className="text-slate-500">Contract Value:</span>{" "}
                        {formatMoney(campaign?.contract_value || 0)}
                      </p>
                      <p>
                        <span className="text-slate-500">Budget Total:</span>{" "}
                        {formatMoney(campaign?.budget_total || 0)}
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

              <Section title="Recent Activity" subtitle="Latest workspace events">
                <div className="space-y-3">
                  {campaign?.activity?.length ? (
                    campaign.activity.map((item) => (
                      <ActivityCard key={item.id} item={item} />
                    ))
                  ) : (
                    <EmptyState text="No activity yet." />
                  )}
                </div>
              </Section>
            </div>
          </>
        )}

        {activeTab === "Contacts" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="Add Contact" subtitle="Campaign staff and stakeholders">
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

            <Section title="Contacts" subtitle="People in this campaign workspace">
              <div className="space-y-3">
                {campaign?.contacts?.length ? (
                  campaign.contacts.map((contact) => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))
                ) : (
                  <EmptyState text="No contacts yet." />
                )}
              </div>
            </Section>
          </div>
        )}

        {activeTab === "Vendors" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="Add Vendor" subtitle="Campaign partners and service providers">
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

            <Section title="Vendors" subtitle="Assigned and prospect vendors">
              <div className="space-y-3">
                {campaign?.vendors?.length ? (
                  campaign.vendors.map((vendor) => (
                    <VendorCard key={vendor.id} vendor={vendor} />
                  ))
                ) : (
                  <EmptyState text="No vendors yet." />
                )}
              </div>
            </Section>
          </div>
        )}

        {activeTab === "Tasks" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="Add Task" subtitle="Operational work tracking">
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

            <Section title="Tasks" subtitle="Open and completed work">
              <div className="space-y-3">
                {campaign?.tasks?.length ? (
                  campaign.tasks.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                ) : (
                  <EmptyState text="No tasks yet." />
                )}
              </div>
            </Section>
          </div>
        )}

        {activeTab === "Documents" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="Add Document" subtitle="Workspace documents and links">
              <form className="space-y-3" onSubmit={handleAddDocument}>
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  placeholder="Document name"
                  value={documentForm.name}
                  onChange={(e) =>
                    setDocumentForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                    placeholder="Document type"
                    value={documentForm.document_type}
                    onChange={(e) =>
                      setDocumentForm((prev) => ({
                        ...prev,
                        document_type: e.target.value
                      }))
                    }
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                    placeholder="File URL"
                    value={documentForm.file_url}
                    onChange={(e) =>
                      setDocumentForm((prev) => ({
                        ...prev,
                        file_url: e.target.value
                      }))
                    }
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Add Document
                </button>
              </form>
            </Section>

            <Section title="Documents" subtitle="Files and reference links">
              <div className="space-y-3">
                {campaign?.documents?.length ? (
                  campaign.documents.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} />
                  ))
                ) : (
                  <EmptyState text="No documents yet." />
                )}
              </div>
            </Section>
          </div>
        )}

        {activeTab === "Fundraising" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="Fundraising Summary" subtitle="Matched live fundraising intelligence">
              <div className="grid gap-4 md:grid-cols-2">
                <StatCard
                  label="Matched Records"
                  value={fundraisingData.length}
                  subtext="Candidate or state matched"
                />
                <StatCard
                  label="Receipts"
                  value={formatMoneyCompact(fundraisingTotals.receipts)}
                  subtext="Summed from matched rows"
                />
                <StatCard
                  label="Cash on Hand"
                  value={formatMoneyCompact(fundraisingTotals.cash)}
                  subtext="Current available funds"
                />
                <StatCard
                  label="Campaign Contract"
                  value={formatMoneyCompact(campaign?.contract_value || 0)}
                  subtext="CRM pipeline value"
                />
              </div>
            </Section>

            <Section title="Fundraising Records" subtitle="Live fundraising matches">
              <div className="space-y-3">
                {fundraisingData.length ? (
                  fundraisingData.map((row, index) => (
                    <div
                      key={`${row.candidate_id || index}-${index}`}
                      className="rounded-2xl border border-white/10 bg-[#111827] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">
                            {row.name || "Unknown Candidate"}
                          </div>
                          <div className="mt-1 text-sm text-slate-400">
                            {row.office || "Office N/A"} • {row.state || "State N/A"}
                          </div>
                        </div>
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                          {row.party || "N/A"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                        <div>Receipts: {formatMoney(row.receipts || 0)}</div>
                        <div>Cash on Hand: {formatMoney(row.cash_on_hand || 0)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState text="No fundraising records matched this workspace yet." />
                )}
              </div>
            </Section>
          </div>
        )}

        {activeTab === "Forecast" && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Section title="Forecast Summary" subtitle="Published forecast match">
              {forecastData ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <StatCard
                    label="Win Probability"
                    value={`${forecastData.winProbability || 50}%`}
                    subtext="Published snapshot"
                  />
                  <StatCard
                    label="Confidence"
                    value={`${forecastData.confidence || 50}%`}
                    subtext="Forecast confidence"
                  />
                  <StatCard
                    label="Rating"
                    value={forecastData.rating || "Toss-up"}
                    subtext="Modeled race rating"
                  />
                  <StatCard
                    label="Overlay Tier"
                    value={forecastData.overlayTier || "watch"}
                    subtext="Map intensity"
                  />
                </div>
              ) : (
                <EmptyState text="No published forecast matched this workspace yet." />
              )}
            </Section>

            <Section title="Forecast Detail" subtitle="Race model detail">
              {forecastData ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
                    <div className="font-semibold text-white">
                      {forecastData.state || "State N/A"} • {forecastData.office || "Office N/A"}
                    </div>
                    <div className="mt-2 text-sm text-slate-400">
                      Race key: {forecastData.raceKey || "N/A"}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        Leader
                      </div>
                      <div className="mt-2 font-semibold text-white">
                        {forecastData.leader?.name || "N/A"}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        Receipts: {formatMoney(forecastData.leader?.receipts || 0)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
                        Runner Up
                      </div>
                      <div className="mt-2 font-semibold text-white">
                        {forecastData.runnerUp?.name || "N/A"}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        Receipts: {formatMoney(forecastData.runnerUp?.receipts || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-300">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>Total Receipts: {formatMoney(forecastData.totalReceipts || 0)}</div>
                      <div>Total Cash: {formatMoney(forecastData.totalCash || 0)}</div>
                      <div>Receipts Gap: {formatMoney(forecastData.receiptsGap || 0)}</div>
                      <div>Cash Gap: {formatMoney(forecastData.cashGap || 0)}</div>
                      <div>Volatility: {forecastData.volatility || 50}</div>
                      <div>Overlay Score: {forecastData.overlayScore || 0}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState text="No forecast details available yet." />
              )}
            </Section>
          </div>
        )}

        <div className="flex justify-between gap-3">
          <Link
            to="/campaigns"
            className="rounded-xl border border-white/10 bg-[#111827] px-5 py-3 text-sm text-slate-200 transition hover:border-cyan-400"
          >
            Back to Campaign Pipeline
          </Link>

          <button
            type="button"
            onClick={refreshAll}
            className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Refresh Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
