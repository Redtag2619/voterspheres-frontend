import { useEffect, useMemo, useState } from "react";

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
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[1.4fr,1fr,1fr,auto]">
      <div>
        <div className="font-semibold text-slate-900">{vendor.vendor_name}</div>
        <div className="mt-1 text-sm text-slate-500">
          {vendor.category || "Vendor"} • {vendor.campaign_name || "Campaign N/A"}
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Candidate: {vendor.candidate_name || "N/A"}
        </div>
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

export default function Vendors() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [crmDashboard, setCrmDashboard] = useState({
    vendor_activity: [],
    active_campaigns: [],
    recent_activity: []
  });

  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: ""
  });

  async function loadVendors() {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/api/crm-dashboard/summary");
      setCrmDashboard(data || {});
    } catch (err) {
      setError(err.message || "Failed to load vendor activity");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendors();
  }, []);

  const vendors = useMemo(() => {
    const rows = crmDashboard.vendor_activity || [];

    return rows.filter((vendor) => {
      const matchesSearch =
        !filters.search ||
        [
          vendor.vendor_name,
          vendor.category,
          vendor.campaign_name,
          vendor.candidate_name
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(filters.search.toLowerCase())
          );

      const matchesCategory =
        !filters.category ||
        String(vendor.category || "").toLowerCase() ===
          filters.category.toLowerCase();

      const matchesStatus =
        !filters.status ||
        String(vendor.status || "").toLowerCase() ===
          filters.status.toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [crmDashboard.vendor_activity, filters]);

  const categoryOptions = useMemo(() => {
    const unique = new Set(
      (crmDashboard.vendor_activity || [])
        .map((vendor) => vendor.category)
        .filter(Boolean)
    );
    return Array.from(unique).sort();
  }, [crmDashboard.vendor_activity]);

  const statusOptions = useMemo(() => {
    const unique = new Set(
      (crmDashboard.vendor_activity || [])
        .map((vendor) => vendor.status)
        .filter(Boolean)
    );
    return Array.from(unique).sort();
  }, [crmDashboard.vendor_activity]);

  const totalContractValue = useMemo(() => {
    return vendors.reduce(
      (sum, vendor) => sum + Number(vendor.contract_value || 0),
      0
    );
  }, [vendors]);

  const activeVendors = useMemo(() => {
    return vendors.filter(
      (vendor) => String(vendor.status || "").toLowerCase() === "active"
    ).length;
  }, [vendors]);

  const prospectVendors = useMemo(() => {
    return vendors.filter(
      (vendor) => String(vendor.status || "").toLowerCase() === "prospect"
    ).length;
  }, [vendors]);

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
            VoterSpheres Directory
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Vendors</h1>
          <p className="mt-2 text-sm text-slate-500">
            Track active campaign vendors, categories, contract value, and vendor
            footprint across your political operations.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Visible Vendors"
            value={vendors.length}
            subtext="Filtered vendor records"
          />
          <StatCard
            label="Active Vendors"
            value={activeVendors}
            subtext="Currently active relationships"
          />
          <StatCard
            label="Prospects"
            value={prospectVendors}
            subtext="Pipeline vendor opportunities"
          />
          <StatCard
            label="Contract Value"
            value={formatMoney(totalContractValue)}
            subtext="Tracked vendor spend"
          />
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Vendor Filters</h2>
            <p className="mt-1 text-sm text-slate-500">
              Search across vendor name, category, campaign, and candidate.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <input
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Search vendors, campaigns, candidates..."
            />

            <select
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
              value={filters.category}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, category: e.target.value }))
              }
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
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
            >
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Vendor Activity</h2>
              <p className="mt-1 text-sm text-slate-500">
                Recent vendor relationships across campaign workspaces.
              </p>
            </div>

            <button
              type="button"
              onClick={loadVendors}
              className="rounded-xl bg-[#0176D3] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <EmptyState text="Loading vendor activity..." />
            ) : vendors.length === 0 ? (
              <EmptyState text="No vendor records found for the current filters." />
            ) : (
              vendors.map((vendor) => (
                <VendorRow
                  key={`${vendor.id}-${vendor.campaign_id}-${vendor.vendor_name}`}
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
