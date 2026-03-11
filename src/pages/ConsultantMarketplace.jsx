import { useEffect, useState } from "react";
import api from "../api";

function ConsultantCard({ consultant }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {consultant.name || consultant.firm_name || "Unnamed Consultant"}
          </h3>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
            {consultant.state || "Unknown State"}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        <p>
          <span className="text-slate-500">Specialty:</span>{" "}
          {consultant.specialty ||
            consultant.services ||
            consultant.category ||
            "Political consulting"}
        </p>
        <p className="line-clamp-4 text-slate-400">
          {consultant.description ||
            consultant.bio ||
            "Campaign strategy, communications, data, and field operations support."}
        </p>
      </div>
    </div>
  );
}

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
        const stateData = await api.consultantStates();

        if (!active) return;
        setStates(stateData || []);
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
      try {
        setLoading(true);
        setError("");

        const result = await api.consultants(filters);

        if (!active) return;

        setRows(result?.results || []);
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
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="flex flex-col gap-2">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              VoterSpheres Marketplace
            </div>
            <h1 className="text-3xl font-semibold">Consultant Marketplace</h1>
            <p className="text-sm text-slate-400">
              Live consultant discovery for campaigns, PACs, and advocacy teams.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <input
              className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Search consultants"
              value={filters.q}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  q: e.target.value,
                  page: 1
                }))
              }
            />

            <select
              className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none"
              value={filters.state}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  state: e.target.value,
                  page: 1
                }))
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

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
            Loading consultants...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-300">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
            No consultants found.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((consultant, index) => (
              <ConsultantCard
                key={consultant.id ?? `${consultant.name}-${index}`}
                consultant={consultant}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
