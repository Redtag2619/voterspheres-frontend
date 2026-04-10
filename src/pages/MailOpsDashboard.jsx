import { useEffect, useState } from "react";
import api from "../services/api";

export default function MailOpsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    campaign: "",
    state: "",
    office: "",
    location: "",
  });

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/mailops/dashboard");
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load MailOps dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    try {
      await api.post("/api/mailops/events", form);

      setForm({
        campaign: "",
        state: "",
        office: "",
        location: "",
      });

      await loadDashboard();
    } catch (err) {
      console.error(err);
      alert("Failed to create mail event");
    }
  };

  if (loading) return <div className="p-6">Loading MailOps...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">MailOps Dashboard</h1>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.metrics.map((m, i) => (
          <div key={i} className="p-4 bg-white shadow rounded">
            <div className="text-sm text-gray-500">{m.label}</div>
            <div className="text-xl font-bold">{m.value}</div>
            <div className="text-xs text-gray-400">{m.delta}</div>
          </div>
        ))}
      </div>

      {/* Create Event */}
      <div className="p-4 bg-white shadow rounded">
        <h2 className="font-semibold mb-3">Create Mail Event</h2>

        <form onSubmit={handleCreateEvent} className="grid grid-cols-2 gap-3">
          <input
            placeholder="Campaign"
            value={form.campaign}
            onChange={(e) => setForm({ ...form, campaign: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            placeholder="State"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            placeholder="Office"
            value={form.office}
            onChange={(e) => setForm({ ...form, office: e.target.value })}
            className="border p-2 rounded"
            required
          />
          <input
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="border p-2 rounded"
            required
          />

          <button className="col-span-2 bg-blue-600 text-white p-2 rounded">
            Create Event
          </button>
        </form>
      </div>

      {/* Drops */}
      <div className="p-4 bg-white shadow rounded">
        <h2 className="font-semibold mb-3">Active Mail Drops</h2>

        {data.drops.map((d) => (
          <div key={d.id} className="border-b py-2">
            <div className="font-medium">
              {d.campaign} ({d.state})
            </div>
            <div className="text-sm text-gray-500">
              {d.office} • {d.location}
            </div>
            <div className="text-sm">
              Status: {d.status} | Risk: {d.risk}
            </div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      <div className="p-4 bg-white shadow rounded">
        <h2 className="font-semibold mb-3">Postal Alerts</h2>

        {data.alerts.map((a) => (
          <div key={a.id} className="border-b py-2">
            <div className="font-medium">{a.title}</div>
            <div className="text-sm text-gray-500">{a.detail}</div>
            <div className="text-xs">
              Severity: {a.severity} | Risk: {a.risk}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
