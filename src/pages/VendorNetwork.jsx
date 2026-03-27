import { useEffect, useState } from "react";
import api from "../api";

export default function Vendors() {
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
        const data = await api.vendorStates();
        if (!active) return;
        setStates(data || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load vendor filters");
      }
    }

    loadStates();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadVendors() {
      setLoading(true);
      setError("");

      try {
        const data = await api.vendors(filters);
        if (!active) return;
        setRows(data?.results || []);
      } catch (err) {
        if (!active) return;
        setError(err.message || "Failed to load vendors");
        setRows([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadVendors();
    return () => {
      active = false;
    };
  }, [filters]);

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
        <h1 className="mb-2 text-3xl font-bold">Vendor Network</h1>
        <p className="mb-4 text-sm text-slate-400">
          Live operations vendor discovery for modern campaigns.
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none"
            placeholder="Search vendors"
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
          <div className="text-sm text-slate-400">Loading vendors...</div>
        ) : error ? (
          <div className="text-sm text-red-400">{error}</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-slate-400">No vendors found.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map((vendor, index) => (
              <div
                key={vendor.id ?? `${vendor.name}-${index}`}
                className="rounded-2xl border border-white/10 bg-[#111827] p-5"
              >
                <h3 className="text-lg font-semibold">
                  {vendor.name || "Unnamed Vendor"}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {vendor.state || "Unknown state"}
                </p>
                <p className="mt-3 text-sm text-slate-300">
                  {vendor.category ||
                    vendor.services ||
                    vendor.description ||
                    "Campaign operations and political services"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
