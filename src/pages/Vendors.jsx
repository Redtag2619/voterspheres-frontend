import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function VendorRow({ vendor }) {
  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "grid",
          gap: "1rem",
          gridTemplateColumns: "1.5fr 1fr 1fr 1fr auto",
          alignItems: "start"
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: "var(--vs-text)" }}>
            {vendor.vendor_name}
          </div>
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.9rem",
              color: "var(--vs-text-muted)"
            }}
          >
            {vendor.category || "Vendor"} • {vendor.campaign_name || "Campaign N/A"}
          </div>
          <div
            style={{
              marginTop: "0.5rem",
              fontSize: "0.78rem",
              color: "var(--vs-text-muted)"
            }}
          >
            Candidate: {vendor.candidate_name || "N/A"} • Firm: {vendor.firm_name || "N/A"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">State</div>
          <div style={{ marginTop: "0.35rem", fontSize: "0.92rem", color: "var(--vs-text)" }}>
            {vendor.state || "N/A"}
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Status</div>
          <div style={{ marginTop: "0.35rem" }}>
            <Badge tone={String(vendor.status || "").toLowerCase() === "active" ? "active" : "default"}>
              {vendor.status || "prospect"}
            </Badge>
          </div>
        </div>

        <div>
          <div className="vs-stat-label">Contract</div>
          <div style={{ marginTop: "0.35rem", fontSize: "0.95rem", fontWeight: 700 }}>
            {formatMoney(vendor.contract_value || 0)}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Badge tone="accent">{vendor.category || "General"}</Badge>
        </div>
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

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  async function loadDropdowns() {
    try {
      const [categoriesResponse, statusesResponse] = await Promise.allSettled([
        api.get("/vendors/dropdowns/categories", { timeout: 4000 }),
        api.get("/vendors/dropdowns/statuses", { timeout: 4000 })
      ]);

      if (categoriesResponse.status === "fulfilled") {
        const nextCategories = categoriesResponse.value?.data?.results || [];
        setCategoryOptions(nextCategories.length ? nextCategories : FALLBACK_CATEGORIES);
      } else {
        setCategoryOptions(FALLBACK_CATEGORIES);
      }

      if (statusesResponse.status === "fulfilled") {
        const nextStatuses = statusesResponse.value?.data?.results || [];
        setStatusOptions(nextStatuses.length ? nextStatuses : FALLBACK_STATUSES);
      } else {
        setStatusOptions(FALLBACK_STATUSES);
      }

      if (
        categoriesResponse.status === "rejected" ||
        statusesResponse.status === "rejected"
      ) {
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
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load vendor directory"
      );
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
    <PageShell
      eyebrow="VoterSpheres Directory"
      title="Vendors"
      description="Search campaign vendors by category, status, state, campaign, and firm."
      demo={demoMode}
      demoText="Demo campaign vendor relationships are active. The directory is preloaded for presentation and testing."
    >
      {error ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}
        >
          {error}
        </div>
      ) : null}

      {dropdownWarning ? (
        <div className="vs-banner vs-banner-demo">{dropdownWarning}</div>
      ) : null}

      <div className="vs-grid-4">
        <StatCard
          label="Visible Vendors"
          value={summary.total_vendors || 0}
          subtext="Filtered vendor records"
        />
        <StatCard
          label="Active Vendors"
          value={summary.active_vendors || 0}
          subtext="Current active relationships"
        />
        <StatCard
          label="Prospects"
          value={summary.prospect_vendors || 0}
          subtext="Pipeline vendor opportunities"
        />
        <StatCard
          label="Contract Value"
          value={formatMoney(summary.total_contract_value || 0)}
          subtext="Tracked vendor spend"
        />
      </div>

      <SectionCard
        title="Vendor Filters"
        subtitle="Filter vendors across your CRM and campaign workspaces."
      >
        <div className="vs-grid-4">
          <input
            className="vs-input"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            placeholder="Search vendors, campaigns, firms..."
          />

          <select
            className="vs-select"
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
            className="vs-select"
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

          <input
            className="vs-input"
            value={filters.state}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, state: e.target.value }))
            }
            placeholder="Filter by state"
          />
        </div>

        <div
          style={{
            marginTop: "1rem",
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap"
          }}
        >
          <button
            type="button"
            className="vs-button vs-button-primary"
            onClick={loadVendors}
          >
            Refresh Results
          </button>

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => {
              setFilters({
                search: "",
                category: "",
                status: "",
                state: ""
              });
            }}
          >
            Clear Form
          </button>

          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={loadDropdowns}
          >
            Reload Filters
          </button>
        </div>
      </SectionCard>

      <SectionCard
        title="Vendor Directory"
        subtitle="Campaign vendor relationships across firms and workspaces."
      >
        <div className="vs-stack">
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
      </SectionCard>
    </PageShell>
  );
}
