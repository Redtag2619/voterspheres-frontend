import { useEffect, useState } from "react";
import api from "../api";

export default function ConsultantMarketplace() {
  const [rows, setRows] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    q: "",
    state: "",
    page: 1,
    limit: 12
  });

  useEffect(() => {
    let active = true;

    async function loadStates() {
      try {
        const data = await api.consultantStates();
        if (!active) return;
        setStates(data || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load consultant filters");
      }
    }

    loadStates();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadConsultants() {
      setLoading(true);
      setError("");

      try {
        const data = await api.consultants(filters);
        if (!active) return;
        setRows(data?.results || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load consultants");
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadConsultants();
    return () => {
      active = false;
    };
  }, [filters]);

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
        <h1 className="mb-2 text-3xl font-bold">Consultant Marketplace</h1>
        <p className="mb-4 text-sm text-slate-400">
          Live consultant discovery for campaigns, PACs, and advocacy operations.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none"
            placeholder="Search consultants"
            value={filters.q}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, q: e.target.value, page: 1 }))
            }
          />

          <select
            className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none"
            value={filters.state}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, state: e.target.value, page: 1 }))
            }
          >
            <option value="">All states</option>
            {states.map((item) => (
              <option key={item.id ?? item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
        {loading ? (
          <div className="text-sm text-slate-400">Loading consultants...</div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-slate-400">No consultants found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((consultant, index) => (
              <div
                key={consultant.id ?? `${consultant.name}-${index}`}
                className="rounded-2xl border border-white/10 bg-[#111827] p-5"
              >
                <h3 className="text-lg font-semibold">
                  {consultant.name || consultant.firm_name || "Unnamed Consultant"}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {consultant.state || "Unknown state"}
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {consultant.specialty ||
                    consultant.services ||
                    consultant.category ||
                    "Political consulting services"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
