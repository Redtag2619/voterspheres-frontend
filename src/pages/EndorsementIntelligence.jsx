import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard"; 
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";
import PoliticalGraphContextPanel from "../components/graph/PoliticalGraphContextPanel";
import RelatedIntelligencePanel from "../components/intelligence/RelatedIntelligencePanel";

const DEFAULT_FORM = {
  endorser_name: "",
  endorser_type: "Organization",
  candidate_name: "",
  candidate_party: "",
  state: "",
  office: "",
  party: "Nonpartisan",
  influence_score: 70,
  reach_score: 65,
  network_score: 65,
  financial_signal_score: 40,
  status: "Confirmed",
  source: "manual",
  source_url: "",
  summary: "",
};

const FALLBACK_OPTIONS = {
  states: [
    "AK", "AL", "AR", "AZ", "CA", "CO", "CT", "DC", "DE", "FL", "GA", "HI",
    "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA", "MD", "ME", "MI", "MN",
    "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM", "NV", "NY", "OH",
    "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VA", "VT", "WA",
    "WI", "WV", "WY",
  ],
  offices: ["President", "Senate", "House", "Governor", "Statewide", "Local"],
  types: [
    "Elected Official",
    "Labor",
    "PAC",
    "Organization",
    "Newspaper",
    "Community Leader",
    "Business Group",
    "Advocacy Group",
    "Party Committee",
    "Coalition",
  ],
  statuses: ["Confirmed", "Watch", "Modeled", "Pending"],
};

function number(value, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function scoreTone(value) {
  const score = number(value);
  if (score >= 85) return "danger";
  if (score >= 70) return "demo";
  if (score >= 50) return "info";
  return "default";
}

function statusTone(value) {
  const next = String(value || "").toLowerCase();
  if (next.includes("confirmed")) return "active";
  if (next.includes("watch")) return "danger";
  if (next.includes("modeled")) return "demo";
  return "default";
}

function typeTone(value) {
  const next = String(value || "").toLowerCase();
  if (next.includes("labor")) return "danger";
  if (next.includes("pac")) return "demo";
  if (next.includes("elected")) return "accent";
  if (next.includes("party")) return "info";
  return "default";
}

function sourceLabel(value) {
  if (value === "modeled_baseline") return "Modeled Baseline";
  if (value === "state_modeled_baseline") return "State Modeled";
  if (value === "candidate_modeled") return "Candidate Modeled";
  if (value === "manual") return "Manual";
  return value || "Manual";
}

function normalizeList(value, key) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.[key])) return value[key];
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

function formatDate(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString();
}

function buildTaskFromEndorsement(item) {
  const score = number(item.endorsement_score);

  return {
    title: `${item.state || "National"} endorsement review: ${
      item.endorser_name || "Endorser"
    }`,
    description:
      item.summary ||
      `${item.endorser_name || "Endorser"} endorsed ${
        item.candidate_name || "a candidate"
      }. Review coalition impact, donor proximity, and campaign response.`,
    source: "endorsement_intelligence",
    state: item.state || "National",
    office: item.office || "Statewide",
    priority: score >= 85 ? "high" : score >= 70 ? "medium" : "normal",
    status: "open",
    assigned_to: "Political Intelligence",
    due_label: score >= 85 ? "Today" : "This Week",
    metadata: {
      endorsement_id: item.id,
      endorser_name: item.endorser_name,
      endorser_type: item.endorser_type,
      candidate_name: item.candidate_name,
      endorsement_score: item.endorsement_score,
      risk_label: item.risk_label,
      source: "endorsement_intelligence",
    },
  };
}

async function loadEndorsements(params) {
  if (typeof api.endorsements === "function") {
    return api.endorsements(params);
  }

  const response = await api.get("/endorsements", { params });
  return response?.data || response;
}

async function loadSummary(params) {
  if (typeof api.endorsementSummary === "function") {
    return api.endorsementSummary(params);
  }

  const response = await api.get("/endorsements/summary", { params });
  return response?.data || response;
}

async function loadOptions() {
  if (typeof api.endorsementOptions === "function") {
    return api.endorsementOptions();
  }

  const response = await api.get("/endorsements/options");
  return response?.data || response;
}

async function createEndorsement(payload) {
  if (typeof api.createEndorsement === "function") {
    return api.createEndorsement(payload);
  }

  const response = await api.post("/endorsements", payload);
  return response?.data || response;
}

async function syncModeledEndorsements(payload) {
  if (typeof api.syncModeledEndorsements === "function") {
    return api.syncModeledEndorsements(payload);
  }

  const response = await api.post("/endorsements/sync-modeled", payload);
  return response?.data || response;
}

function EndorsementRow({ item, selected, onSelect, onCreateTask }) {
  return (
    <div className={`endorsement-row ${selected ? "is-selected" : ""}`}>
      <ResponsiveRow
        title={item.endorser_name || "Unnamed Endorser"}
        subtitle={`${item.endorser_type || "Organization"} | ${
          item.state || "National"
        } | ${item.office || "Office"} | ${sourceLabel(item.source)}`}
        meta={[
          { label: "Candidate", value: item.candidate_name || "Unassigned" },
          { label: "Score", value: item.endorsement_score || 0 },
          { label: "Tier", value: item.endorsement_tier || "Monitor" },
          { label: "Status", value: item.status || "Confirmed" },
          { label: "Announced", value: formatDate(item.announced_at) },
        ]}
        right={
          <div className="endorsement-actions">
            <Badge tone={scoreTone(item.endorsement_score)}>
              {item.endorsement_score || 0}/100
            </Badge>
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => onSelect(item)}
            >
              Inspect
            </button>
            <button
              type="button"
              className="vs-button"
              onClick={() => onCreateTask(item)}
            >
              Create Task
            </button>
          </div>
        }
      />
    </div>
  );
}

function TypeCard({ item }) {
  return (
    <div className="endorsement-type-card">
      <div>
        <strong>{item.endorser_type || "Organization"}</strong>
        <span>{item.total || 0} endorsements</span>
      </div>
      <Badge tone={typeTone(item.endorser_type)}>
        Avg {Math.round(number(item.avg_score))}
      </Badge>
    </div>
  );
}

function StateCard({ item, onSelectState }) {
  return (
    <button
      type="button"
      className="endorsement-state-card"
      onClick={() => onSelectState(item.state)}
    >
      <div>
        <strong>{item.state || "National"}</strong>
        <span>{item.total || 0} endorsements</span>
      </div>
      <div>
        <b>{Math.round(number(item.top_score))}</b>
        <small>Top Score</small>
      </div>
    </button>
  );
}

function AddEndorsementForm({ form, setForm, options, saving, onSubmit }) {
  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="endorsement-form">
      <div className="vs-grid-3">
        <input
          className="vs-input"
          value={form.endorser_name}
          onChange={(event) => update("endorser_name", event.target.value)}
          placeholder="Endorser name"
        />

        <select
          className="vs-input"
          value={form.endorser_type}
          onChange={(event) => update("endorser_type", event.target.value)}
        >
          {(options.types || FALLBACK_OPTIONS.types).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <select
          className="vs-input"
          value={form.status}
          onChange={(event) => update("status", event.target.value)}
        >
          {(options.statuses || FALLBACK_OPTIONS.statuses).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="vs-grid-4">
        <input
          className="vs-input"
          value={form.candidate_name}
          onChange={(event) => update("candidate_name", event.target.value)}
          placeholder="Candidate name"
        />

        <input
          className="vs-input"
          value={form.candidate_party}
          onChange={(event) => update("candidate_party", event.target.value)}
          placeholder="Candidate party"
        />

        <select
          className="vs-input"
          value={form.state}
          onChange={(event) => update("state", event.target.value)}
        >
          <option value="">State</option>
          {(options.states || FALLBACK_OPTIONS.states).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <select
          className="vs-input"
          value={form.office}
          onChange={(event) => update("office", event.target.value)}
        >
          <option value="">Office</option>
          {(options.offices || FALLBACK_OPTIONS.offices).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="vs-grid-4">
        {[
          ["influence_score", "Influence"],
          ["reach_score", "Reach"],
          ["network_score", "Network"],
          ["financial_signal_score", "Finance"],
        ].map(([key, label]) => (
          <label key={key} className="endorsement-range">
            <span>
              {label}: {form[key]}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={form[key]}
              onChange={(event) => update(key, Number(event.target.value))}
            />
          </label>
        ))}
      </div>

      <textarea
        className="vs-input"
        value={form.summary}
        onChange={(event) => update("summary", event.target.value)}
        placeholder="Summary, coalition impact, donor proximity, or political context..."
        rows={4}
      />

      <div className="vs-grid-2">
        <input
          className="vs-input"
          value={form.source_url}
          onChange={(event) => update("source_url", event.target.value)}
          placeholder="Source URL"
        />

        <button
          type="button"
          className="vs-button"
          disabled={saving}
          onClick={onSubmit}
        >
          {saving ? "Saving..." : "Add Endorsement"}
        </button>
      </div>
    </div>
  );
}

export default function EndorsementIntelligence() {
  const [filters, setFilters] = useState({
    search: "",
    state: "",
    type: "",
    status: "",
    limit: 100,
  });

  const [rows, setRows] = useState([]);
  const [summaryData, setSummaryData] = useState({
    summary: {},
    by_type: [],
    by_state: [],
    top_endorsements: [],
  });

  const [options, setOptions] = useState(FALLBACK_OPTIONS);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAll() {
    try {
      setLoading(true);
      setSummaryLoading(true);
      setError("");

      const [listPayload, summaryPayload, optionPayload] = await Promise.all([
        loadEndorsements(filters),
        loadSummary(filters),
        loadOptions(),
      ]);

      const nextRows = normalizeList(listPayload, "results");

      setRows(nextRows);

      setSummaryData(
        summaryPayload || {
          summary: {},
          by_type: [],
          by_state: [],
          top_endorsements: [],
        }
      );

      setOptions({
        states: optionPayload?.states?.length
          ? optionPayload.states
          : FALLBACK_OPTIONS.states,
        offices: optionPayload?.offices?.length
          ? optionPayload.offices
          : FALLBACK_OPTIONS.offices,
        types: optionPayload?.types?.length
          ? optionPayload.types
          : optionPayload?.default_types || FALLBACK_OPTIONS.types,
        statuses: optionPayload?.statuses?.length
          ? optionPayload.statuses
          : FALLBACK_OPTIONS.statuses,
      });

      setSelected((current) => {
        if (current && nextRows.some((row) => row.id === current.id)) {
          return current;
        }

        return nextRows[0] || null;
      });
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load endorsement intelligence."
      );
      setRows([]);
    } finally {
      setLoading(false);
      setSummaryLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.state, filters.type, filters.status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAll();
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  async function handleCreateEndorsement() {
    if (!form.endorser_name.trim()) {
      setMessage("Add an endorser name before saving.");
      return;
    }

    try {
      setSaving(true);
      setMessage("Saving endorsement...");

      const payload = await createEndorsement(form);

      setMessage(
        `Saved endorsement: ${
          payload?.endorsement?.endorser_name || form.endorser_name
        }`
      );

      setForm(DEFAULT_FORM);
      await loadAll();
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to save endorsement."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSyncModeled() {
    try {
      setSyncing(true);
      setMessage("Syncing modeled candidate endorsements...");

      const result = await syncModeledEndorsements({
        limit: 50,
      });

      setMessage(
        `Modeled endorsement sync complete. Inserted ${
          result?.inserted || result?.all_state_inserted || 0
        }.`
      );

      await loadAll();
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to sync modeled endorsements."
      );
    } finally {
      setSyncing(false);
    }
  }

  async function handleCreateTask(item) {
    try {
      setMessage(`Creating Command Center task for ${item.endorser_name}...`);

      const taskPayload = buildTaskFromEndorsement(item);

      if (typeof api.createTask === "function") {
        await api.createTask(taskPayload);
        setMessage(`Task created: ${taskPayload.title}`);
      } else {
        setMessage("Task payload is ready, but api.createTask is not available.");
      }
    } catch (err) {
      setMessage(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to create endorsement task."
      );
    }
  }

  const summary = summaryData.summary || {};

  const highImpactCount = rows.filter(
    (row) => number(row.endorsement_score) >= 85
  ).length;

  const watchedCount = rows.filter((row) =>
    String(row.status || "").toLowerCase().includes("watch")
  ).length;

  const filteredTop = useMemo(() => {
    return [...rows]
      .sort(
        (a, b) =>
          number(b.endorsement_score) - number(a.endorsement_score)
      )
      .slice(0, 8);
  }, [rows]);

  return (
    <PageShell
      eyebrow="Endorsement Intelligence"
      title="Endorsement Intelligence Command Center"
      description="Track candidate endorsements, coalition influence, state impact, political reach, and endorsement-driven Command Center actions."
      tickerItems={[
        {
          label: "Endorsements",
          value: `${summary.total_endorsements || rows.length || 0}`,
          dotClass: "vs-live-dot-success",
        },
        {
          label: "Tier 1",
          value: `${summary.tier_one || highImpactCount}`,
          dotClass: "vs-live-dot",
        },
        {
          label: "States",
          value: `${summary.states_covered || 0}`,
          dotClass: "vs-live-dot-warning",
        },
        {
          label: "Watch",
          value: `${summary.watch_items || watchedCount}`,
          dotClass: watchedCount
            ? "vs-live-dot"
            : "vs-live-dot-success",
        },
      ]}
    >
      <style>{`
        .endorsement-row,
        .endorsement-type-card,
        .endorsement-state-card,
        .endorsement-insight-card {
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          background: linear-gradient(
            135deg,
            rgba(15, 23, 42, 0.82),
            rgba(15, 23, 42, 0.48)
          );
          box-shadow: 0 14px 34px rgba(2, 6, 23, 0.18);
          overflow: hidden;
        }

        .endorsement-row.is-selected {
          border-color: rgba(99, 102, 241, 0.65);
          box-shadow:
            0 0 0 1px rgba(99, 102, 241, 0.22),
            0 18px 42px rgba(2, 6, 23, 0.24);
        }

        .endorsement-row .vs-responsive-row {
          border: 0;
          background: transparent;
        }

        .endorsement-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .endorsement-type-card,
        .endorsement-state-card {
          color: var(--vs-text);
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .endorsement-state-card {
          cursor: pointer;
        }

        .endorsement-type-card strong,
        .endorsement-state-card strong {
          display: block;
          font-size: 15px;
          font-weight: 900;
          color: var(--vs-text);
        }

        .endorsement-type-card span,
        .endorsement-state-card span,
        .endorsement-state-card small {
          display: block;
          margin-top: 4px;
          color: var(--vs-text-muted);
          font-size: 12px;
        }

        .endorsement-state-card b {
          display: block;
          color: var(--vs-text);
          font-size: 24px;
          font-weight: 950;
          text-align: right;
        }

        .endorsement-form {
          display: grid;
          gap: 14px;
        }

        .endorsement-range {
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 14px;
          padding: 12px;
          background: rgba(15, 23, 42, 0.5);
          display: grid;
          gap: 10px;
        }

        .endorsement-range span {
          color: var(--vs-text);
          font-size: 12px;
          font-weight: 800;
        }

        .endorsement-range input {
          width: 100%;
        }

        .endorsement-detail-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
          gap: 16px;
          align-items: start;
        }

        .endorsement-insight-card {
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .endorsement-insight-card h3 {
          color: var(--vs-text);
          font-size: 18px;
          margin: 0;
        }

        .endorsement-insight-card p {
          color: var(--vs-text-muted);
          line-height: 1.55;
          margin: 0;
        }

        .endorsement-intelligence-panel-wrap {
          display: grid;
          gap: 16px;
        }

        @media (max-width: 1100px) {
          .endorsement-detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {error ? (
        <div className="vs-banner vs-banner-danger">{error}</div>
      ) : null}

      {message ? (
        <div className="vs-banner vs-live-banner-pulse">{message}</div>
      ) : null}

      <div className="vs-grid-4" data-tour="endorsement-kpis">
        <StatCard
          label="Total Endorsements"
          value={summary.total_endorsements || rows.length || 0}
          subtext="Verified, manual, and modeled"
          tone="up"
        />
        <StatCard
          label="Average Score"
          value={summary.avg_score || 0}
          subtext="Composite endorsement influence"
          tone="up"
        />
        <StatCard
          label="Tier 1 Endorsements"
          value={summary.tier_one || highImpactCount}
          subtext="High-impact endorsements"
          tone={highImpactCount ? "down" : "up"}
        />
        <StatCard
          label="Candidates Touched"
          value={summary.candidates_touched || 0}
          subtext="Candidate endorsement coverage"
          tone="up"
        />
      </div>

      <SectionCard
        title="Endorsement Filters"
        subtitle="Search by candidate, endorser, state, office, source, type, or status."
        right={
          <div className="endorsement-actions">
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={loadAll}
            >
              Refresh
            </button>
            <button
              type="button"
              className="vs-button"
              disabled={syncing}
              onClick={handleSyncModeled}
            >
              {syncing ? "Syncing..." : "Sync Modeled"}
            </button>
          </div>
        }
      >
        <div className="vs-grid-4">
          <input
            className="vs-input"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                search: event.target.value,
              }))
            }
            placeholder="Search endorsements..."
          />

          <select
            className="vs-input"
            value={filters.state}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                state: event.target.value,
              }))
            }
          >
            <option value="">All states</option>
            {(options.states || FALLBACK_OPTIONS.states).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.type}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                type: event.target.value,
              }))
            }
          >
            <option value="">All types</option>
            {(options.types || FALLBACK_OPTIONS.types).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.status}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value,
              }))
            }
          >
            <option value="">All statuses</option>
            {(options.statuses || FALLBACK_OPTIONS.statuses).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      <div className="endorsement-detail-grid">
        <SectionCard
          title="Endorsement Board"
          subtitle="Ranked endorsements by composite influence, reach, network, and finance signals."
          right={<Badge tone="accent">{rows.length} visible</Badge>}
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading endorsement intelligence..." />
            ) : !rows.length ? (
              <EmptyState text="No endorsements match the selected filters." />
            ) : (
              rows.map((item) => (
                <EndorsementRow
                  key={item.id}
                  item={item}
                  selected={selected?.id === item.id}
                  onSelect={setSelected}
                  onCreateTask={handleCreateTask}
                />
              ))
            )}
          </div>
        </SectionCard>

        <div className="vs-stack">
          <SectionCard
            title="Selected Endorsement"
            subtitle="Inspect endorsement impact and launch operational follow-up."
            right={
              selected ? (
                <Badge tone={scoreTone(selected.endorsement_score)}>
                  {selected.endorsement_tier || "Monitor"}
                </Badge>
              ) : null
            }
          >
            {!selected ? (
              <EmptyState text="Select an endorsement to inspect." />
            ) : (
              <div className="vs-stack">
                <div className="endorsement-insight-card">
                  <div
                    className="endorsement-actions"
                    style={{ justifyContent: "space-between" }}
                  >
                    <Badge tone={typeTone(selected.endorser_type)}>
                      {selected.endorser_type}
                    </Badge>
                    <Badge tone={statusTone(selected.status)}>
                      {selected.status}
                    </Badge>
                  </div>

                  <h3>{selected.endorser_name}</h3>

                  <p>
                    {selected.summary ||
                      `${selected.endorser_name} is mapped to ${
                        selected.candidate_name || "a candidate"
                      } in ${
                        selected.state || "a target geography"
                      }.`}
                  </p>
                </div>

                <div className="vs-grid-2">
                  <StatCard
                    label="Score"
                    value={selected.endorsement_score || 0}
                    subtext="Composite impact"
                  />
                  <StatCard
                    label="Influence"
                    value={selected.influence_score || 0}
                    subtext="Political authority"
                  />
                  <StatCard
                    label="Reach"
                    value={selected.reach_score || 0}
                    subtext="Audience impact"
                  />
                  <StatCard
                    label="Network"
                    value={selected.network_score || 0}
                    subtext="Coalition links"
                  />
                </div>

                <ResponsiveRow
                  title={selected.candidate_name || "Unassigned Candidate"}
                  subtitle={`${selected.state || "National"} | ${
                    selected.office || "Office"
                  } | ${selected.candidate_party || "Party unknown"}`}
                  meta={[
                    { label: "Risk", value: selected.risk_label || "Watch" },
                    { label: "Finance", value: selected.financial_signal_score || 0 },
                    { label: "Source", value: sourceLabel(selected.source) },
                    { label: "Updated", value: formatDate(selected.updated_at) },
                  ]}
                  right={
                    <Badge tone={scoreTone(selected.endorsement_score)}>
                      {selected.endorsement_score || 0}
                    </Badge>
                  }
                />

                <div className="vs-grid-2">
                  <button
                    type="button"
                    className="vs-button"
                    onClick={() => handleCreateTask(selected)}
                  >
                    Create Command Task
                  </button>

                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={() => {
                      const params = new URLSearchParams();

                      if (selected.state) {
                        params.set("state", selected.state);
                      }

                      if (selected.candidate_name) {
                        params.set("candidate", selected.candidate_name);
                      }

                      params.set("source", "endorsements");

                      window.location.href = `/candidates?${params.toString()}`;
                    }}
                  >
                    Open Candidate
                  </button>
                </div>

                {selected.source_url ? (
                  <a
                    href={selected.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="vs-button vs-button-secondary"
                    style={{
                      textAlign: "center",
                      textDecoration: "none",
                    }}
                  >
                    Open Source
                  </a>
                ) : null}
              </div>
            )}
          </SectionCard>

          {selected ? (
            <div className="endorsement-intelligence-panel-wrap">
              <RelatedIntelligencePanel
                entityType="endorsement"
                entityId={selected.id}
                entityName={selected.endorser_name}
                state={selected.state}
                title="Connected Platform Intelligence"
                subtitle="Related candidates, donors, vendors, states, tasks, and endorsement-driven actions."
                compact
                limit={120}
              />
            </div>
          ) : null}

          {selected ? (
            <PoliticalGraphContextPanel
              entityType="endorsement"
              entityId={selected.id}
              entityName={selected.endorser_name}
              state={selected.state}
              title="Political Graph Context"
              subtitle="Relationship graph context for this endorsement."
              compact
            />
         ) : null}

          <SectionCard
            title="Endorsement Types"
            subtitle="Coalition mix by type."
            right={
              <Badge tone="info">
                {summary.endorser_types ||
                  summaryData.by_type?.length ||
                  0}{" "}
                types
              </Badge>
            }
          >
            <div className="vs-stack">
              {summaryLoading ? (
                <EmptyState text="Loading endorsement type mix..." />
              ) : !summaryData.by_type?.length ? (
                <EmptyState text="No endorsement type data yet." />
              ) : (
                summaryData.by_type.map((item) => (
                  <TypeCard key={item.endorser_type} item={item} />
                ))
              )}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="vs-grid-2">
        <SectionCard
          title="State Influence"
          subtitle="States with the strongest endorsement activity and coalition impact."
          right={
            <Badge tone="demo">
              {summary.states_covered || 0} states
            </Badge>
          }
        >
          <div className="vs-grid-2">
            {!summaryData.by_state?.length ? (
              <EmptyState text="No state endorsement data loaded yet." />
            ) : (
              summaryData.by_state.slice(0, 10).map((item) => (
                <StateCard
                  key={item.state}
                  item={item}
                  onSelectState={(state) =>
                    setFilters((prev) => ({
                      ...prev,
                      state,
                    }))
                  }
                />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Top Endorsement Signals"
          subtitle="Highest-impact endorsements currently visible."
          right={<Badge tone="danger">{filteredTop.length} ranked</Badge>}
        >
          <div className="vs-stack">
            {!filteredTop.length ? (
              <EmptyState text="No endorsement signals loaded yet." />
            ) : (
              filteredTop.map((item) => (
                <ResponsiveRow
                  key={`top-${item.id}`}
                  title={item.endorser_name}
                  subtitle={`${item.candidate_name || "Candidate"} | ${
                    item.state || "National"
                  }`}
                  meta={[
                    { label: "Type", value: item.endorser_type || "Organization" },
                    { label: "Score", value: item.endorsement_score || 0 },
                    { label: "Risk", value: item.risk_label || "Watch" },
                  ]}
                  right={
                    <Badge tone={scoreTone(item.endorsement_score)}>
                      {item.endorsement_tier || "Tier"}
                    </Badge>
                  }
                />
              ))
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Add Endorsement"
        subtitle="Manually add verified endorsement intelligence. Modeled data can be replaced as real endorsements are confirmed."
        right={<Badge tone="active">Manual Entry</Badge>}
      >
        <AddEndorsementForm
          form={form}
          setForm={setForm}
          options={options}
          saving={saving}
          onSubmit={handleCreateEndorsement}
        />
      </SectionCard>
    </PageShell>
  );
}
