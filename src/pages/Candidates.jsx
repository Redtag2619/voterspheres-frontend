import { useEffect, useMemo, useState } from "react";
import api from "../api";

export default function Candidates() {
  const [rows, setRows] = useState([]);
  const [states, setStates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filters, setFilters] = useState({
    q: "",
    state: "",
    office: "",
    party: "",
    page: 1,
    limit: 12
  });

  useEffect(() => {
    let active = true;

    async function loadFilters() {
      try {
        const [stateData, officeData, partyData] = await Promise.all([
          api.candidateStates(),
          api.candidateOffices(),
          api.candidateParties()
        ]);

        if (!active) return;
        setStates(stateData || []);
        setOffices(officeData || []);
        setParties(partyData || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load filters");
      }
    }

    loadFilters();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCandidates() {
      setLoading(true);
      setError("");

      try {
        const data = await api.candidates(filters);
        if (!active) return;
        setRows(data?.results || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load candidates");
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCandidates();
    return () => {
      active = false;
    };
  }, [filters]);

  const pageTitle = useMemo(() => "Candidates", []);

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
        <div className="mb-4 flex flex-col gap-2">
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
          <p className="text-sm text-slate-400">
            Live candidate intelligence wired to the VoterSpheres backend.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none"
            placeholder="Search candidates"
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

          <select
            className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none"
            value={filters.office}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, office: e.target.value, page: 1 }))
            }
          >
            <option value="">All offices</option>
            {offices.map((item) => (
              <option key={item.id ?? item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none"
            value={filters.party}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, party: e.target.value, page: 1 }))
            }
          >
            <option value="">All parties</option>
            {parties.map((item) => (
              <option key={item.id ?? item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
        {loading ? (
          <div className="text-sm text-slate-400">Loading candidates...</div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-slate-400">No candidates found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((candidate) => (
              <div
                key={candidate.id}
                className="rounded-2xl border border-white/10 bg-[#111827] p-5"
              >
                <div className="mb-2 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">{candidate.name}</h3>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      {candidate.party || "Unknown party"}
                    </p>
                  </div>
                  <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                    {candidate.state || "National"}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-300">
                  <p>
                    <span className="text-slate-500">Election:</span>{" "}
                    {candidate.election || "N/A"}
                  </p>
                  <p>
                    <span className="text-slate-500">Updated:</span>{" "}
                    {candidate.updated_at
                      ? new Date(candidate.updated_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p className="line-clamp-4 text-slate-400">
                    {candidate.bio || "No biography available yet."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
