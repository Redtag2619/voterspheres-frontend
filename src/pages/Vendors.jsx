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
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{subtext}</div>
    </div>
  );
}

function VendorRow({ vendor }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.5fr,1fr,1fr,1fr,auto]">
      <div>
        <div className="font-semibold text-slate-900">{vendor.vendor_name}</div>
        <div className="mt-1 text-sm text-slate-500">
          {vendor.category || "Vendor"} • {vendor.campaign_name || "Campaign N/A"}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Candidate: {vendor.candidate_name || "N/A"} • Firm: {vendor.firm_name || "N/A"}
        </div>
      </div>

      <div className="text-sm text-slate-700">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">State</div>
        <div className="mt-1">{vendor.state || "N/A"}</div>
      </div>

      <div className="text-sm text-slate-700">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Status</div>
        <div className="mt-1">{vendor.status || "prospect"}</div>
      </div>

      <div className="text-sm text-slate-700">
        <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Contract</div>
        <div className="mt-1">{formatMoney(vendor.contract_value || 0)}</div>
      </div>

      <div className="flex items-start justify-start lg:justify-end">
        <span className="rounded-full border border-[#0176D3]/20 bg-[#0176D3]/10 px-3 py-1 text-xs text-[#0176D3]">
          {vendor.category || "General"}
        </span>
      </div>
    </div>
  );
}

const FALLBACK_CATEGORIES = ["Direct Mail", "Digital"];
const FALLBACK_STATUSES = ["active", "prospect"];

export default function Vendors() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropdownWarning, setDropdownWarning] = useState("");

  const [vendorsData, setVendorsData] = useState({
    results: [],
    summary: {
      total_vendors: 0,
      active_vendors: 0,
      prospect_vendors: 0,
      total_contract_value: 0
    }
  });

  const [categoryOptions, setCategoryOptions] = useState(FALLBACK_CATEGORIES);
  const [statusOptions, setStatusOptions] = useState(FALLBACK_STATUSES);

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
    state: ""
  });

  async function loadDropdowns() {
    try {
      const [categories, statuses] = await Promise.allSettled([
        api.get("/vendors/dropdowns/categories", { timeout: 4000 }),
        api.get("/vendors/dropdowns/statuses", { timeout: 4000 })
      ]);

      if (categories.status === "fulfilled") {
        const next = categories.value?.data?.results || [];
        if (next.length) setCategoryOptions(next);
      }

      if (statuses.status === "fulfilled") {
        const next = statuses.value?.data?.results || [];
        if (next.length) setStatusOptions(next);
      }

      const anyRejected =
        categories.status === "rejected" || statuses.status === "rejected";

      if (anyRejected) {
        setDropdownWarning("Using fallback filter options while vendor filters warm up.");
      } else {
        setDropdownWarning("");
      }
    } catch {
      setCategoryOptions(FALLBACK_CATEGORIES);
      setStatusOptions(FALLBACK_STATUSES);
      setDropdownWarning("Using fallback filter options while vendor filters warm up.");
    }
  }

  async function loadVendors() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.category) params.set("category", filters.category);
      if (filters.status) params.set("status", filters.status);
      if (filters.state) params.set("state", filters.state);

      const query = params.toString() ? `?${params.toString()}` : "";
      const response = await api.get(`/vendors${query}`, { timeout: 6000 });
      const data = response.data;

      setVendorsData(
        data || {
          results: [],
          summary: {
            total_vendors: 0,
            active_vendors: 0,
            prospect_vendors: 0,
            total_contract_value: 0
          }
        }
      );
    } catch (err) {
      setError(err?.message || "Failed to load vendor directory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    loadVendors();
  }, [filters]);

  const vendors = useMemo(() => vendorsData.results || [], [vendorsData.results]);
  const summary = vendorsData.summary || {};

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
            VoterSpheres Directory
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Vendors</h1>
          <p className="mt-2 text-sm text-slate-500">
            Search campaign vendors by category, status, state, campaign, and firm.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {dropdownWarning ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {dropdownWarning}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Visible Vendors" value={summary.total_vendors || 0} subtext="Filtered vendor records" />
          <StatCard label="Active Vendors" value={summary.active_vendors || 0} subtext="Current active relationships" />
          <StatCard label="Prospects" value={summary.prospect_vendors || 0} subtext="Pipeline vendor opportunities" />
          <StatCard label="Contract Value" value={formatMoney(summary.total_contract_value || 0)} subtext="Tracked vendor spend" />
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Vendor Filters</h2>
            <p className="mt-1 text-sm text-slate-500">
              Filter vendors across your CRM and campaign workspaces.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <input
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              placeholder="Search vendors, campaigns, firms..."
            />

            <select
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
            >
              <option value="">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <input
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
              value={filters.state}
              onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))}
              placeholder="Filter by state"
            />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={loadVendors}
              className="rounded-xl bg-[#0176D3] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Refresh Results
            </button>

            <button
              type="button"
              onClick={() => {
                setFilters({
                  search: "",
                  category: "",
                  status: "",
                  state: ""
                });
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#0176D3]"
            >
              Clear Form
            </button>

            <button
              type="button"
              onClick={loadDropdowns}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#0176D3]"
            >
              Reload Filters
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Vendor Directory</h2>
            <p className="mt-1 text-sm text-slate-500">
              Campaign vendor relationships across firms and workspaces.
            </p>
          </div>

          <div className="space-y-4">
            {loading ? (
              <EmptyState text="Loading vendor directory..." />
            ) : vendors.length === 0 ? (
              <EmptyState text="No vendor records found for the current filters." />
            ) : (
              vendors.map((vendor) => (
                <VendorRow
                  key={`${vendor.id}-${vendor.campaign_id || "none"}-${vendor.vendor_name}`}
                  vendor={vendor}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
