import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
      {text}
    </div>
  );
}

function StatCard({ label, value, subtext }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{subtext}</div>
    </div>
  );
}

function VendorRow({ vendor }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.5fr,1fr,1fr,1fr,auto]">
      <div>
        <div className="font-semibold text-slate-900">
          {vendor.vendor_name || vendor.name}
        </div>
        <div className="mt-1 text-sm text-slate-500">
          {(vendor.category || "Vendor")} •{" "}
          {vendor.campaign_name || "Campaign N/A"}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Candidate: {vendor.candidate_name || "N/A"} • Firm:{" "}
          {vendor.firm_name || "N/A"}
        </div>
      </div>

      <div className="text-sm text-slate-700">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          State
        </div>
        <div className="mt-1">{vendor.state || "N/A"}</div>
      </div>

      <div className="text-sm text-slate-700">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Status
        </div>
        <div className="mt-1">{vendor.status || "prospect"}</div>
      </div>

      <div className="text-sm text-slate-700">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">
          Contract
        </div>
        <div className="mt-1">
          {formatMoney(vendor.contract_value || vendor.contractValue || 0)}
        </div>
      </div>

      <div className="flex items-start justify-start lg:justify-end">
        <span className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
          {vendor.category || "General"}
        </span>
      </div>
    </div>
  );
}

export default function Vendors() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [vendorsData, setVendorsData] = useState({
    results: [],
    summary: {}
  });

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    state: ""
  });

  async function loadDropdowns() {
    try {
      const [categories, statuses] = await Promise.all([
        api.get("/vendors/dropdowns/categories").then(r => r.data),
        api.get("/vendors/dropdowns/statuses").then(r => r.data)
      ]);

      setCategoryOptions(categories?.results || []);
      setStatusOptions(statuses?.results || []);
    } catch (err) {
      console.warn("Dropdown load failed:", err.message);
    }
  }

  async function loadVendors() {
    try {
      setLoading(true);
      setError("");

      const data = await api.vendors({
        search: filters.search,
        category: filters.category,
        status: filters.status,
        state: filters.state
      });

      setVendorsData(
        data || {
          results: [],
          summary: {}
        }
      );
    } catch (err) {
      setError(err.message || "Failed to load vendor directory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([loadDropdowns(), loadVendors()]).catch((err) => {
      setError(err.message || "Failed to initialize vendors page");
      setLoading(false);
    });
  }, []);

  async function handleApplyFilters() {
    await loadVendors();
  }

  const vendors = useMemo(() => vendorsData.results || [], [vendorsData]);
  const summary = vendorsData.summary || {};

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
            VoterSpheres Directory
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Vendors</h1>
          <p className="mt-2 text-sm text-slate-500">
            Campaign vendor intelligence across firms and operations.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* STATS */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Vendors" value={summary.total_vendors || 0} subtext="Visible records" />
          <StatCard label="Active" value={summary.active_vendors || 0} subtext="Live engagements" />
          <StatCard label="Pipeline" value={summary.prospect_vendors || 0} subtext="Prospects" />
          <StatCard label="Contract Value" value={formatMoney(summary.total_contract_value)} subtext="Tracked spend" />
        </div>

        {/* FILTERS */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <input
              className="input"
              value={filters.search}
              onChange={(e) =>
                setFilters((p) => ({ ...p, search: e.target.value }))
              }
              placeholder="Search vendors..."
            />

            <select
              value={filters.category}
              onChange={(e) =>
                setFilters((p) => ({ ...p, category: e.target.value }))
              }
            >
              <option value="">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((p) => ({ ...p, status: e.target.value }))
              }
            >
              <option value="">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <input
              value={filters.state}
              onChange={(e) =>
                setFilters((p) => ({ ...p, state: e.target.value }))
              }
              placeholder="State"
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button onClick={handleApplyFilters} className="btn-primary">
              Apply
            </button>

            <button
              onClick={() =>
                setFilters({
                  search: "",
                  category: "",
                  status: "",
                  state: ""
                })
              }
            >
              Clear
            </button>
          </div>
        </section>

        {/* LIST */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {loading ? (
              <EmptyState text="Loading vendors..." />
            ) : vendors.length === 0 ? (
              <EmptyState text="No vendors found." />
            ) : (
              vendors.map((v, i) => (
                <VendorRow key={v.id || i} vendor={v} />
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
