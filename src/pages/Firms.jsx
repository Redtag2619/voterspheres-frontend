import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

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

function FirmCard({ firm }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg transition hover:border-cyan-400/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{firm.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{firm.slug}</p>
        </div>

        <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
          {firm.firm_type || "Firm"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        <p>
          <span className="text-slate-500">State:</span>{" "}
          {firm.primary_state || "N/A"}
        </p>
        <p>
          <span className="text-slate-500">Website:</span>{" "}
          {firm.website ? (
            <a
              href={firm.website}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 hover:text-cyan-200"
              onClick={(e) => e.stopPropagation()}
            >
              {firm.website}
            </a>
          ) : (
            "N/A"
          )}
        </p>
        <p>
          <span className="text-slate-500">Description:</span>{" "}
          {firm.description || "No description yet"}
        </p>
      </div>

      <div className="mt-5">
        <Link
          to={`/firms/${firm.id}`}
          className="inline-flex rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
        >
          Open Firm Workspace
        </Link>
      </div>
    </div>
  );
}

export default function Firms() {
  const [firms, setFirms] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    website: "",
    firm_type: "",
    primary_state: "",
    description: ""
  });

  async function loadFirms() {
    try {
      setLoading(true);
      setError("");
      const data = await apiRequest(
        `/api/crm/firms${search ? `?search=${encodeURIComponent(search)}` : ""}`
      );
      setFirms(data.results || []);
    } catch (err) {
      setError(err.message || "Failed to load firms");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFirms();
  }, []);

  const filteredCountLabel = useMemo(() => {
    return `${firms.length} firm${firms.length === 1 ? "" : "s"}`;
  }, [firms.length]);

  async function handleCreateFirm(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await apiRequest("/api/crm/firms", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          website: form.website || null,
          firm_type: form.firm_type || null,
          primary_state: form.primary_state || null,
          description: form.description || null
        })
      });

      setForm({
        name: "",
        website: "",
        firm_type: "",
        primary_state: "",
        description: ""
      });

      setSuccess("Firm created successfully.");
      await loadFirms();
    } catch (err) {
      setError(err.message || "Failed to create firm");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
            VoterSpheres CRM
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Firms</h1>
          <p className="mt-2 text-sm text-slate-400">
            Manage consulting firms, operating groups, campaign clients, and
            firm workspaces.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
          <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white">Create Firm</h2>

            <form className="mt-5 space-y-4" onSubmit={handleCreateFirm}>
              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Firm Name
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Red Tag Strategies"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Website
                </label>
                <input
                  className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={form.website}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, website: e.target.value }))
                  }
                  placeholder="https://example.com"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-400">
                    Firm Type
                  </label>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                    value={form.firm_type}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, firm_type: e.target.value }))
                    }
                    placeholder="Consulting Firm"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-400">
                    Primary State
                  </label>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                    value={form.primary_state}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        primary_state: e.target.value
                      }))
                    }
                    placeholder="Texas"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Description
                </label>
                <textarea
                  className="min-h-[120px] w-full rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-white outline-none focus:border-cyan-400"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Political consulting, media, direct mail, digital, fundraising, and strategy."
                />
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

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Creating..." : "Create Firm"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Firm Directory</h2>
                <p className="mt-1 text-sm text-slate-400">{filteredCountLabel}</p>
              </div>

              <div className="flex gap-3">
                <input
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search firms..."
                />
                <button
                  onClick={loadFirms}
                  className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-400"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 text-sm text-slate-400">
                  Loading firms...
                </div>
              ) : firms.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 text-sm text-slate-400">
                  No firms found yet.
                </div>
              ) : (
                firms.map((firm) => <FirmCard key={firm.id} firm={firm} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
