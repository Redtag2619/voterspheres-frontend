import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import DemoBanner from "../components/ui/DemoBanner";
import { useDemoMode } from "../context/DemoModeContext.jsx";

const fallbackData = {
  results: [
    { id: 1, name: "Red Tag Strategies", category: "General Consulting", state: "Louisiana", website: "https://example.com", email: "info@example.com", phone: "", status: "active", contact_status: "partial", contact_confidence: 70 },
    { id: 2, name: "Capitol Campaign Group", category: "Media + Strategy", state: "Georgia", website: "https://example.com", email: "", phone: "", status: "active", contact_status: "partial", contact_confidence: 35 },
    { id: 3, name: "Keystone Field Partners", category: "Field Operations", state: "Pennsylvania", website: "https://example.com", email: "", phone: "", status: "active", contact_status: "partial", contact_confidence: 35 },
  ],
  _demo: true,
};

function statusTone(value) {
  const v = String(value || "").toLowerCase();
  if (v === "active") return "active";
  if (v === "featured") return "accent";
  if (v === "watch") return "demo";
  if (v === "complete") return "active";
  if (v === "partial") return "warning";
  if (v === "missing") return "danger";
  return "default";
}

function confidenceTone(value) {
  const score = Number(value || 0);
  if (score >= 80) return "active";
  if (score >= 50) return "warning";
  if (score > 0) return "info";
  return "danger";
}

function normalizeRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function normalizeState(value) {
  return String(value || "").trim();
}

function safeUrl(value) {
  if (!value) return "";
  const next = String(value).trim();
  if (!next) return "";
  if (next.startsWith("http://") || next.startsWith("https://")) return next;
  return `https://${next}`;
}

function ConsultantRow({ consultant, onEnrich, enriching }) {
  const contactStatus = consultant.contact_status || "missing";
  const contactConfidence = Number(consultant.contact_confidence || 0);
  const website = safeUrl(consultant.website);
  const email = consultant.email || "";
  const phone = consultant.phone || "";

  return (
    <div className="vs-card-muted" style={{ padding: 14, display: "grid", gap: 12 }}>
      <ResponsiveRow
        title={consultant.name || consultant.firm_name || "Unnamed Consultant"}
        subtitle={[consultant.state || "Unknown state", consultant.category || "Uncategorized"].filter(Boolean).join(" - ")}
        meta={[
          { label: "Category", value: consultant.category || "N/A" },
          { label: "State", value: consultant.state || "N/A" },
          { label: "Website", value: website || "N/A" },
          { label: "Email", value: email || "N/A" },
          { label: "Phone", value: phone || "N/A" },
          { label: "Contact", value: contactStatus },
          { label: "Confidence", value: `${contactConfidence}%` },
          { label: "Influence", value: consultant.influence_score || 0 },
        ]}
        alert={String(consultant.status || "").toLowerCase() === "active" ? "vs-live-dot-success" : "vs-live-dot-warning"}
        right={
          <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <Badge tone={statusTone(consultant.status)}>{consultant.status || "active"}</Badge>
            <Badge tone={statusTone(contactStatus)}>Contact {contactStatus}</Badge>
            <Badge tone={confidenceTone(contactConfidence)}>{contactConfidence}%</Badge>
            <button type="button" className="vs-button vs-button-secondary" onClick={() => onEnrich(consultant)} disabled={enriching}>{enriching ? "Enriching..." : "Enrich Contact"}</button>
          </div>
        }
      />

      <div className="vs-chip-row">
        {website ? <a className="vs-button vs-button-secondary" href={website} target="_blank" rel="noreferrer">Website</a> : null}
        {email ? <a className="vs-button vs-button-secondary" href={`mailto:${email}`}>Email</a> : null}
        {phone ? <a className="vs-button vs-button-secondary" href={`tel:${phone}`}>Call</a> : null}
        {consultant.linkedin_url ? <a className="vs-button vs-button-secondary" href={safeUrl(consultant.linkedin_url)} target="_blank" rel="noreferrer">LinkedIn</a> : null}
      </div>

      {consultant.contact_source || consultant.contact_enriched_at ? (
        <div style={{ color: "var(--vs-text-muted)", fontSize: 12, lineHeight: 1.45 }}>
          Source: {consultant.contact_source || "N/A"}{consultant.contact_enriched_at ? ` - Updated ${String(consultant.contact_enriched_at).slice(0, 10)}` : ""}
        </div>
      ) : null}
    </div>
  );
}

export default function ConsultantMarketplace() {
  const { demoMode } = useDemoMode();
  const [loading, setLoading] = useState(true);
  const [enrichingAll, setEnrichingAll] = useState(false);
  const [enrichingById, setEnrichingById] = useState({});
  const [error, setError] = useState("");
  const [consultantData, setConsultantData] = useState(fallbackData);
  const [contactStatus, setContactStatus] = useState(null);
  const [isDemoData, setIsDemoData] = useState(Boolean(fallbackData._demo));
  const [localFilters, setLocalFilters] = useState({ search: "", state: "", category: "", status: "", contact_status: "" });

  async function loadContactStatus() {
    try {
      const result = await api.get("/consultants/contact-enrichment/status").then((r) => r.data);
      setContactStatus(result || null);
    } catch {
      setContactStatus(null);
    }
  }

  async function loadConsultants() {
    try {
      setLoading(true);
      setError("");
      const params = { limit: 250 };
      if (localFilters.state) params.state = localFilters.state;
      if (localFilters.search.trim()) params.search = localFilters.search.trim();
      if (localFilters.category.trim()) params.category = localFilters.category.trim();
      if (localFilters.status.trim()) params.status = localFilters.status.trim();
      const data = api.consultants ? await api.consultants(params) : await api.get("/consultants", { params }).then((r) => r.data);
      setConsultantData(data || fallbackData);
      setIsDemoData(Boolean(data?._demo || data?.demo));
      await loadContactStatus();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to load consultants");
      setConsultantData(fallbackData);
      setIsDemoData(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadConsultants(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [localFilters.search, localFilters.state, localFilters.category, localFilters.status]);

  async function enrichOne(consultant) {
    const id = consultant?.id;
    if (!id) return;
    try {
      setEnrichingById((prev) => ({ ...prev, [id]: true }));
      await api.post(`/consultants/contact-enrichment/${id}`, {});
      await loadConsultants();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to enrich consultant contact.");
    } finally {
      setEnrichingById((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function enrichVisible() {
    try {
      setEnrichingAll(true);
      await api.post("/consultants/contact-enrichment/run", { limit: 100, state: localFilters.state || "" });
      await loadConsultants();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to run contact enrichment.");
    } finally {
      setEnrichingAll(false);
    }
  }

  const allRows = useMemo(() => normalizeRows(consultantData), [consultantData]);
  const filteredResults = useMemo(() => {
    let rows = allRows;
    if (localFilters.state) rows = rows.filter((row) => normalizeState(row.state).toLowerCase() === normalizeState(localFilters.state).toLowerCase());
    if (localFilters.search.trim()) {
      const q = localFilters.search.trim().toLowerCase();
      rows = rows.filter((row) => String(row.name || "").toLowerCase().includes(q) || String(row.firm_name || "").toLowerCase().includes(q) || String(row.category || "").toLowerCase().includes(q) || String(row.state || "").toLowerCase().includes(q) || String(row.email || "").toLowerCase().includes(q) || String(row.website || "").toLowerCase().includes(q));
    }
    if (localFilters.category.trim()) rows = rows.filter((row) => String(row.category || "").toLowerCase() === localFilters.category.trim().toLowerCase());
    if (localFilters.status.trim()) rows = rows.filter((row) => String(row.status || "").toLowerCase() === localFilters.status.trim().toLowerCase());
    if (localFilters.contact_status.trim()) rows = rows.filter((row) => String(row.contact_status || "missing").toLowerCase() === localFilters.contact_status.trim().toLowerCase());
    return rows;
  }, [allRows, localFilters]);

  const summary = useMemo(() => {
    const categories = new Set(filteredResults.map((row) => row.category).filter(Boolean));
    const states = new Set(filteredResults.map((row) => row.state).filter(Boolean));
    const activeCount = filteredResults.filter((row) => String(row.status || "").toLowerCase() === "active").length;
    const completeContacts = filteredResults.filter((row) => String(row.contact_status || "").toLowerCase() === "complete").length;
    const partialContacts = filteredResults.filter((row) => String(row.contact_status || "").toLowerCase() === "partial").length;
    const missingContacts = filteredResults.filter((row) => !row.contact_status || String(row.contact_status || "").toLowerCase() === "missing").length;
    return { total: filteredResults.length, categories: categories.size, states: states.size, active: activeCount, completeContacts, partialContacts, missingContacts };
  }, [filteredResults]);

  const stateOptions = useMemo(() => Array.from(new Set(allRows.map((row) => row.state).filter(Boolean))).sort(), [allRows]);
  const categoryOptions = useMemo(() => Array.from(new Set(allRows.map((row) => row.category).filter(Boolean))).sort(), [allRows]);
  const statusOptions = useMemo(() => Array.from(new Set(allRows.map((row) => row.status || "active").filter(Boolean))).sort(), [allRows]);
  const contactSummary = contactStatus?.summary || {};

  return (
    <PageShell
      eyebrow="Consultant Marketplace"
      title="Find the consulting partners behind campaign execution."
      description="Browse consulting firms, campaign specialists, strategic operators, and enriched consultant contact records."
      demo={demoMode}
      demoText="Global Demo Mode is active. This module can render fallback consultant data when live endpoints are unavailable."
      tickerItems={[{ label: "Consultants", value: `${summary.total}`, dotClass: "vs-live-dot-success" }, { label: "States", value: `${summary.states}`, dotClass: "vs-live-dot-warning" }, { label: "Complete Contacts", value: `${summary.completeContacts}`, dotClass: "vs-live-dot" }]}
    >
      <DemoBanner active={isDemoData} text="Demo consultant marketplace data is active for this module." />
      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Visible Consultants" value={summary.total} subtext="Results in current view" />
        <StatCard label="Complete Contacts" value={summary.completeContacts} subtext={`${summary.partialContacts} partial`} />
        <StatCard label="Missing Contacts" value={summary.missingContacts} subtext="Needs enrichment" />
        <StatCard label="Avg Confidence" value={`${contactSummary.avg_contact_confidence || 0}%`} subtext="All consultant contacts" />
      </div>

      <SectionCard
        title="Marketplace Filters"
        subtitle="Search and filter consultants across all imported states and contact enrichment status."
        right={
          <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="vs-button vs-button-secondary" onClick={() => setLocalFilters({ search: "", state: "", category: "", status: "", contact_status: "" })}>Clear Filters</button>
            <button type="button" className="vs-button" onClick={enrichVisible} disabled={enrichingAll}>{enrichingAll ? "Enriching..." : "Enrich Visible"}</button>
          </div>
        }
      >
        <div className="vs-grid-2">
          <input className="vs-input" value={localFilters.search} onChange={(e) => setLocalFilters((prev) => ({ ...prev, search: e.target.value }))} placeholder="Search consultant, email, website, category, or state..." />
          <select className="vs-select" value={localFilters.state} onChange={(e) => setLocalFilters((prev) => ({ ...prev, state: e.target.value }))}>
            <option value="">All states</option>
            {stateOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>

        <div className="vs-grid-3" style={{ marginTop: "12px" }}>
          <select className="vs-select" value={localFilters.category} onChange={(e) => setLocalFilters((prev) => ({ ...prev, category: e.target.value }))}>
            <option value="">All categories</option>
            {categoryOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select className="vs-select" value={localFilters.status} onChange={(e) => setLocalFilters((prev) => ({ ...prev, status: e.target.value }))}>
            <option value="">All statuses</option>
            {statusOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select className="vs-select" value={localFilters.contact_status} onChange={(e) => setLocalFilters((prev) => ({ ...prev, contact_status: e.target.value }))}>
            <option value="">All contact statuses</option>
            <option value="complete">Complete</option>
            <option value="partial">Partial</option>
            <option value="missing">Missing</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard title="Consultant Directory" subtitle="Campaign consulting firms and specialists across the selected marketplace filters." right={<Badge tone={isDemoData ? "demo" : "active"}>{isDemoData ? "Demo Data" : "Live Data"}</Badge>}>
        <div className="vs-stack">
          {loading ? <EmptyState text="Loading consultant marketplace..." /> : !filteredResults.length ? <EmptyState text="No consultants match the active filters." /> : filteredResults.map((consultant) => <ConsultantRow key={consultant.id || consultant.name} consultant={consultant} onEnrich={enrichOne} enriching={Boolean(enrichingById[consultant.id])} />)}
        </div>
      </SectionCard>
    </PageShell>
  );
}

