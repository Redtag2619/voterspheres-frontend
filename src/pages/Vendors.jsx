import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function fmtMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function normalizeList(data, keys = []) {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return data?.results || data?.vendors || data?.rows || [];
}

function Stat({ label, value, detail }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
      {detail ? <div className="mt-1 text-xs text-slate-400">{detail}</div> : null}
    </div>
  );
}

function VendorCard({ vendor }) {
  const name = vendor.name || vendor.vendor_name || "Unnamed Vendor";
  const services = vendor.services || vendor.capabilities || vendor.description || "Campaign operations and political services";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-5 shadow-lg transition hover:border-cyan-400/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{name}</h3>
          <p className="mt-1 text-sm text-slate-400">
            {[vendor.city, vendor.state].filter(Boolean).join(", ") || vendor.coverage_area || "Unknown market"}
          </p>
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
          {vendor.status || "active"}
        </span>
      </div>

      <div className="mt-4 space-y-3 text-sm text-slate-300">
        <p>{vendor.category || "Campaign Vendor"}</p>
        <p className="text-slate-400">{services}</p>

        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
          <div>
            <span className="block text-slate-500">Coverage</span>
            {vendor.coverage_area || vendor.state || "—"}
          </div>
          <div>
            <span className="block text-slate-500">Contract</span>
            {fmtMoney(vendor.contract_value)}
          </div>
        </div>

        {vendor.website ? (
          <a
            href={vendor.website}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-cyan-300 hover:text-cyan-200"
          >
            Visit website
          </a>
        ) : null}
      </div>
    </div>
  );
}

function RiskRow({ item }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-white">{item.title}</div>
          <div className="mt-1 text-sm text-slate-400">{item.detail}</div>
        </div>

        <span className={`rounded-full px-3 py-1 text-xs ${
          item.severity === "High"
            ? "bg-red-500/15 text-red-300"
            : "bg-yellow-500/15 text-yellow-300"
        }`}>
          {item.severity}
        </span>
      </div>
    </div>
  );
}

export default function Vendors() {
  const [rows, setRows] = useState([]);
  const [states, setStates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [intel, setIntel] = useState(null);

  const [loading, setLoading] = useState(true);
  const [intelLoading, setIntelLoading] = useState(true);
  const [error, setError] = useState("");
  const [dispatchMessage, setDispatchMessage] = useState("");

  const [filters, setFilters] = useState({
    q: "",
    state: "",
    category: "",
    status: "",
    page: 1,
    limit: 12
  });

  useEffect(() => {
    let active = true;

    async function loadFilters() {
      try {
        const [stateData, categoryData, statusData] = await Promise.all([
          api.vendorStates?.(),
          api.vendorCategories?.(),
          api.vendorStatuses?.()
        ]);

        if (!active) return;

        setStates(normalizeList(stateData, ["states", "results"]));
        setCategories(normalizeList(categoryData, ["categories", "results"]));
        setStatuses(normalizeList(statusData, ["statuses", "results"]));
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load vendor filters");
      }
    }

    loadFilters();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadVendors() {
      try {
        setLoading(true);
        setError("");

        const data = await api.vendors(filters);

        if (!active) return;
        setRows(normalizeList(data, ["results", "vendors", "rows"]));
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load vendors");
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

  useEffect(() => {
    let active = true;

    async function loadIntel() {
      try {
        setIntelLoading(true);
        const data = await api.vendorScoring?.();
        if (!active) return;
        setIntel(data || null);
      } catch {
        if (!active) return;
        setIntel(null);
      } finally {
        if (active) setIntelLoading(false);
      }
    }

    loadIntel();

    return () => {
      active = false;
    };
  }, []);

  async function dispatchVendorAlerts() {
    try {
      setDispatchMessage("Dispatching vendor alerts...");
      const result = await api.dispatchVendorAlerts?.();
      setDispatchMessage(`Dispatched ${result?.dispatched || 0} vendor intelligence alerts.`);
    } catch (err) {
      setDispatchMessage(err?.message || "Failed to dispatch vendor alerts.");
    }
  }

  const summary = useMemo(() => {
    return intel?.summary || {
      total_vendors: rows.length,
      active_vendors: rows.filter((row) => String(row.status || "").toLowerCase() === "active").length,
      states_covered: new Set(rows.map((row) => row.state).filter(Boolean)).size,
      categories_covered: new Set(rows.map((row) => row.category).filter(Boolean)).size,
      high_gap_states: 0,
      medium_gap_states: 0
    };
  }, [intel, rows]);

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-300">
              Vendor Intelligence
            </div>
            <h1 className="mt-2 text-3xl font-bold">Vendor Network</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-400">
              Live operations vendor discovery, coverage scoring, risk detection, and alert dispatch for campaign infrastructure.
            </p>
          </div>

          <button
            type="button"
            onClick={dispatchVendorAlerts}
            className="rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300"
          >
            Dispatch Vendor Alerts
          </button>
        </div>

        {dispatchMessage ? (
          <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200">
            {dispatchMessage}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="Total Vendors" value={summary.total_vendors || 0} detail="Live vendor records" />
          <Stat label="Active" value={summary.active_vendors || 0} detail="Ready vendors" />
          <Stat label="States" value={summary.states_covered || 0} detail="Covered markets" />
          <Stat label="Categories" value={summary.categories_covered || 0} detail="Service lanes" />
          <Stat
            label="Gap States"
            value={(summary.high_gap_states || 0) + (summary.medium_gap_states || 0)}
            detail="Coverage pressure"
          />
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-4">
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
            {states.map((item, index) => {
              const value = item.name || item.state || item;
              return <option key={`${value}-${index}`} value={value}>{value}</option>;
            })}
          </select>

          <select
            className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none"
            value={filters.category}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, category: e.target.value, page: 1 }))
            }
          >
            <option value="">All categories</option>
            {categories.map((item, index) => {
              const value = item.name || item.category || item;
              return <option key={`${value}-${index}`} value={value}>{value}</option>;
            })}
          </select>

          <select
            className="rounded-xl border border-white/10 bg-[#111827] px-4 py-3 text-sm outline-none"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
            }
          >
            <option value="">All statuses</option>
            {statuses.map((item, index) => {
              const value = item.name || item.status || item;
              return <option key={`${value}-${index}`} value={value}>{value}</option>;
            })}
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Live Vendor Directory</h2>
              <p className="mt-1 text-sm text-slate-400">Database-backed vendor network.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              {rows.length} shown
            </span>
          </div>

          {loading ? (
            <div className="text-sm text-slate-400">Loading vendors...</div>
          ) : error ? (
            <div className="text-sm text-red-400">{error}</div>
          ) : rows.length === 0 ? (
            <div className="text-sm text-slate-400">No vendors found.</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rows.map((vendor, index) => (
                <VendorCard
                  key={vendor.id ?? vendor.vendor_id ?? `${vendor.name || vendor.vendor_name}-${index}`}
                  vendor={vendor}
                />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
            <h2 className="text-xl font-bold">Coverage Gaps</h2>
            <p className="mt-1 text-sm text-slate-400">States where vendor bench strength is thin.</p>

            <div className="mt-4 space-y-3">
              {intelLoading ? (
                <div className="text-sm text-slate-400">Loading vendor intelligence...</div>
              ) : !intel?.gaps?.length ? (
                <div className="text-sm text-slate-400">No vendor coverage gaps detected.</div>
              ) : (
                intel.gaps.slice(0, 6).map((gap, index) => (
                  <RiskRow key={`${gap.state}-${index}`} item={gap} />
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 shadow-xl">
            <h2 className="text-xl font-bold">Recommended Actions</h2>
            <p className="mt-1 text-sm text-slate-400">Actions generated by vendor scoring.</p>

            <div className="mt-4 space-y-3">
              {!intel?.recommended_actions?.length ? (
                <div className="text-sm text-slate-400">No recommended vendor actions.</div>
              ) : (
                intel.recommended_actions.slice(0, 6).map((item, index) => (
                  <RiskRow
                    key={item.id || `${item.title}-${index}`}
                    item={{
                      title: item.title,
                      detail: item.detail,
                      severity: item.priority || "Medium"
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
