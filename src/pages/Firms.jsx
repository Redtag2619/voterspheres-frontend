import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

function FirmCard({ firm }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <h3 className="text-lg font-semibold text-white">{firm.name}</h3>
      <p className="text-sm text-slate-400">{firm.slug}</p>

      <div className="mt-3 text-sm text-slate-300">
        {firm.primary_state || "N/A"}
      </div>

      <Link
        to={`/firms/${firm.id}`}
        className="mt-4 inline-block text-cyan-300"
      >
        Open Workspace →
      </Link>
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

      const data = await api.firms(search);
      setFirms(data.results || data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFirms();
  }, []);

  async function handleCreateFirm(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await api.createFirm(form);

      setSuccess("Firm created");
      setForm({
        name: "",
        website: "",
        firm_type: "",
        primary_state: "",
        description: ""
      });

      loadFirms();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const countLabel = useMemo(
    () => `${firms.length} firm${firms.length !== 1 ? "s" : ""}`,
    [firms]
  );

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="max-w-7xl mx-auto space-y-6">

        <h1 className="text-3xl font-semibold">Firms</h1>

        <form onSubmit={handleCreateFirm} className="space-y-3">
          <input
            placeholder="Firm name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="w-full p-3 bg-[#111827]"
          />

          <button disabled={saving}>
            {saving ? "Creating..." : "Create Firm"}
          </button>
        </form>

        {error && <div>{error}</div>}
        {success && <div>{success}</div>}

        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search firms"
          />
          <button onClick={loadFirms}>Search</button>
        </div>

        <div>{countLabel}</div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          firms.map((f) => <FirmCard key={f.id} firm={f} />)
        )}
      </div>
    </div>
  );
}
