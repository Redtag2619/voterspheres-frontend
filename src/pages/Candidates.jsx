import { useEffect, useState } from "react";
import { api } from "../services/api";

function CandidateCard({ candidate }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{candidate.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
            {candidate.party || "Unknown Party"}
          </p>
        </div>

        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs text-cyan-300">
          {candidate.state || "Unknown State"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-300">
        <p>
          <span className="text-slate-500">Election:</span>{" "}
          {candidate.election || "N/A"}
        </p>
        <p>
          <span className="text-slate-500">Slug:</span> {candidate.slug || "N/A"}
        </p>
        <p className="line-clamp-4 text-slate-400">
          {candidate.bio || "No biography available yet."}
        </p>
      </div>
    </div>
  );
}

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

    async function loadDropdowns() {
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
        setError(err.message || "Failed to load candidate filters");
      }
    }

    loadDropdowns();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCandidates() {
      try {
        setLoading(true);
        setError("");

        const result = await api.candidates(filters);

        if (!active) return;

        setRows(result?.results || []);
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

  return (
    <div className="min-h-screen bg-[#060b14] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#0b1220] p-6 shadow-2xl">
          <div className="flex flex-col gap-2">
            <div className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              VoterSpheres Directory
            </div>
            <h1 className="text-3xl font-semibold">Candidates</h1>
            <p className="text-sm text-slate-400">
              Live candidate search powered by your backend API.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <input
              className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Search candidates"
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

            <select
              className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none"
              value={filters.office}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  office: e.target.value,
                  page: 1
                }))
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
              className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm text-white outline-none"
              value={filters.party}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  party: e.target.value,
                  page: 1
                }))
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

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
            Loading candidates...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-sm text-rose-300">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 text-sm text-slate-400">
            No candidates found.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
