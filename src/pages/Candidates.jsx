import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const fallbackListData = { total: 0, results: [] };
const fallbackDetail = { candidate: null, profile: null };

const fallbackCoverage = {
  total_candidates: 0,
  total: 0,
  with_email: 0,
  with_phone: 0,
  with_website: 0,
  with_address: 0,
  with_social: 0,
  verified: 0,
  discovery_failed: 0,
  fec_committee: 0,
  avg_confidence: 0,
  missing_email: 0,
  missing_phone: 0,
  missing_website: 0,
  missing_address: 0,
  enrichment_running: false,
  last_sync_at: null,
};

const LOCKABLE_FIELDS = [
  { key: "campaign_website", label: "Campaign Website" },
  { key: "official_website", label: "Official Website" },
  { key: "office_address", label: "Office Address" },
  { key: "campaign_address", label: "Campaign Address" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "press_contact_name", label: "Press Contact" },
  { key: "press_contact_email", label: "Press Email" },
  { key: "chief_of_staff_name", label: "Chief of Staff" },
  { key: "campaign_manager_name", label: "Campaign Manager" },
  { key: "finance_director_name", label: "Finance Director" },
  { key: "political_director_name", label: "Political Director" },
];

const OVERVIEW_FIELDS = [
  { key: "campaign_website", label: "Campaign Website", type: "url" },
  { key: "official_website", label: "Official Website", type: "url" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "email", label: "Email", type: "email" },
];

const CONTACT_FIELDS = [
  { key: "office_address", label: "Office Address", type: "textarea" },
  { key: "campaign_address", label: "Campaign Address", type: "textarea" },
  { key: "press_contact_name", label: "Press Contact", type: "text" },
  { key: "press_contact_email", label: "Press Contact Email", type: "email" },
];

function listFromPayload(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.[key])) return payload[key];
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function normalizeCandidateName(candidate) {
  return (
    candidate?.full_name ||
    candidate?.name ||
    [candidate?.first_name, candidate?.last_name].filter(Boolean).join(" ") ||
    "Candidate"
  );
}

function getContactValue(profile, candidate, profileKey, candidateKeys = []) {
  if (profile?.[profileKey]) return profile[profileKey];

  for (const key of candidateKeys) {
    if (candidate?.[key]) return candidate[key];
  }

  return "";
}

function getAddressValue(profile, candidate, profileKey, candidateKeys = []) {
  const direct = getContactValue(profile, candidate, profileKey, candidateKeys);

  if (direct) return direct;

  const address = [
    candidate?.address_line1,
    candidate?.address_line2,
    candidate?.city,
    candidate?.state_code || candidate?.state,
    candidate?.postal_code,
  ]
    .filter(Boolean)
    .join(", ");

  return address || "";
}

function normalizeCoveragePayload(payload) {
  const status = payload?.status || payload?.coverage || payload || {};
  const total = Number(status.total_candidates || status.total || 0);
  const withEmail = Number(status.with_email || 0);
  const withPhone = Number(status.with_phone || 0);
  const withWebsite = Number(status.with_website || 0);
  const withAddress = Number(status.with_address || 0);

  return {
    ...fallbackCoverage,
    ...status,
    total_candidates: total,
    total,
    with_email: withEmail,
    with_phone: withPhone,
    with_website: withWebsite,
    with_address: withAddress,
    with_social: Number(status.with_social || 0),
    verified: Number(status.verified || 0),
    discovery_failed: Number(status.discovery_failed || 0),
    fec_committee: Number(status.fec_committee || 0),
    avg_confidence: status.avg_confidence || 0,
    missing_email: Number(status.missing_email ?? Math.max(total - withEmail, 0)),
    missing_phone: Number(status.missing_phone ?? Math.max(total - withPhone, 0)),
    missing_website: Number(status.missing_website ?? Math.max(total - withWebsite, 0)),
    missing_address: Number(status.missing_address ?? Math.max(total - withAddress, 0)),
    enrichment_running: Boolean(status.enrichment_running),
    last_sync_at: status.last_sync_at || status.updated_at || null,
  };
}

function getPartyTone(party) {
  const value = String(party || "").toLowerCase();
  if (value.includes("democratic")) return "accent";
  if (value.includes("republican")) return "danger";
  return "default";
}

function getStatusTone(status) {
  const value = String(status || "").toLowerCase();
  if (["active", "live", "confirmed"].includes(value)) return "active";
  if (["watch", "pending"].includes(value)) return "warning";
  return "default";
}

function getFreshnessTone(updatedAt) {
  if (!updatedAt) return "default";
  const time = new Date(updatedAt).getTime();
  if (Number.isNaN(time)) return "default";
  const ageHours = (Date.now() - time) / (1000 * 60 * 60);
  if (ageHours <= 24) return "active";
  if (ageHours <= 168) return "warning";
  return "default";
}

function getConfidenceTone(value) {
  const score = Number(value || 0);
  if (score >= 0.7) return "active";
  if (score >= 0.35) return "warning";
  return "default";
}

function getRiskTone(health) {
  if (health.completed >= 5) return "active";
  if (health.completed >= 3) return "warning";
  return "danger";
}

function getCandidateRiskTone(risk) {
  const value = String(risk || "").toLowerCase();
  if (value === "elevated") return "danger";
  if (value === "watch" || value === "incomplete") return "warning";
  if (value === "strong") return "active";
  return "default";
}

function getTierTone(tier) {
  const value = String(tier || "").toLowerCase();
  if (value.includes("tier 1")) return "danger";
  if (value.includes("tier 2")) return "warning";
  return "default";
}

function formatConfidence(value) {
  const score = Number(value);
  if (Number.isNaN(score)) return "N/A";
  return `${Math.round(score * 100)}%`;
}

function formatPercent(numerator, denominator) {
  const top = Number(numerator || 0);
  const bottom = Number(denominator || 0);
  if (!bottom) return "0%";
  return `${Math.round((top / bottom) * 100)}%`;
}

function safeUrl(value) {
  if (!value) return "";
  if (String(value).startsWith("http://") || String(value).startsWith("https://")) {
    return value;
  }
  return `https://${value}`;
}

function formatDateTime(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function normalizeDetailPayload(payload, selectedCandidate) {
  if (!payload || typeof payload !== "object") {
    return { candidate: selectedCandidate || null, profile: null };
  }

  const candidate = {
    ...(selectedCandidate || {}),
    ...(payload.candidate || (payload.profile ? {} : payload) || {}),
  };

  return {
    candidate: Object.keys(candidate).length ? candidate : null,
    profile: payload.profile || null,
  };
}

function getProfileHealth(profile = {}, candidate = null) {
  const hasCampaignWebsite = Boolean(
    getContactValue(profile, candidate, "campaign_website", ["website", "campaign_website"])
  );
  const hasOfficialWebsite = Boolean(
    getContactValue(profile, candidate, "official_website", ["official_website"])
  );
  const hasEmail = Boolean(
    getContactValue(profile, candidate, "email", ["contact_email", "email", "press_email"])
  );
  const hasPressEmail = Boolean(
    getContactValue(profile, candidate, "press_contact_email", ["press_email", "contact_email"])
  );
  const hasPhone = Boolean(getContactValue(profile, candidate, "phone", ["phone"]));
  const hasAddress = Boolean(
    getAddressValue(profile, candidate, "office_address", ["office_address", "campaign_address", "address_line1"]) ||
      getAddressValue(profile, candidate, "campaign_address", ["campaign_address", "office_address", "address_line1"])
  );
  const hasStaff = Boolean(
    profile?.chief_of_staff_name ||
      profile?.campaign_manager_name ||
      profile?.finance_director_name ||
      profile?.political_director_name ||
      profile?.press_contact_name
  );

  const completed = [
    hasCampaignWebsite || hasOfficialWebsite,
    hasEmail,
    hasPressEmail,
    hasPhone,
    hasAddress,
    hasStaff,
  ].filter(Boolean).length;

  return {
    hasCampaignWebsite,
    hasOfficialWebsite,
    hasEmail,
    hasPressEmail,
    hasPhone,
    hasAddress,
    hasStaff,
    completed,
    total: 6,
  };
}

function buildCommandSummary(candidate, profile, health) {
  const parts = [];
  if (candidate?.state) parts.push(candidate.state);
  if (candidate?.office) parts.push(candidate.office);
  if (candidate?.party) parts.push(candidate.party);

  const summary = parts.join(" • ");
  const signals = `${health.completed}/${health.total} intelligence signals`;

  if (profile?.source_label) return `${summary} • ${signals} • Source: ${profile.source_label}`;
  return `${summary} • ${signals}`;
}

function DetailField({ label, value, href, monospace = false }) {
  return (
    <div className="vs-card-muted" style={{ padding: "12px 14px", display: "grid", gap: "6px", minHeight: "84px", alignContent: "start" }}>
      <div className="vs-stat-label">{label}</div>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" style={{ color: "var(--vs-text)", fontWeight: 700, textDecoration: "none", wordBreak: "break-word", fontFamily: monospace ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined }}>
          {value || "N/A"}
        </a>
      ) : (
        <div style={{ color: "var(--vs-text)", fontWeight: 700, wordBreak: "break-word", fontFamily: monospace ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined }}>
          {value || "N/A"}
        </div>
      )}
    </div>
  );
}

function EditField({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div className="vs-card-muted" style={{ padding: "12px 14px", display: "grid", gap: "6px", minHeight: "84px", alignContent: "start" }}>
      <div className="vs-stat-label">{label}</div>
      {type === "textarea" ? (
        <textarea className="vs-input" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || ""} rows={4} style={{ resize: "vertical", minHeight: "88px" }} />
      ) : (
        <input className="vs-input" type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || ""} />
      )}
    </div>
  );
}

function MetricChip({ label, active }) {
  return (
    <div className="vs-card-muted" style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
      <span style={{ color: "var(--vs-text)", fontWeight: 600, fontSize: "12px" }}>{label}</span>
      <Badge tone={active ? "active" : "default"}>{active ? "Ready" : "Missing"}</Badge>
    </div>
  );
}

function CoverageBar({ label, value, total, tone = "active" }) {
  const percent = total ? Math.min(100, Math.round((Number(value || 0) / Number(total || 1)) * 100)) : 0;

  const color =
    tone === "danger"
      ? "#dc2626"
      : tone === "warning"
        ? "#d97706"
        : tone === "info"
          ? "#2563eb"
          : "#16a34a";

  return (
    <div className="vs-card-muted" style={{ padding: "12px 14px", display: "grid", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <strong style={{ color: "var(--vs-text)", fontSize: 13 }}>{label}</strong>
        <Badge tone={tone}>{percent}%</Badge>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "rgba(148, 163, 184, 0.18)", overflow: "hidden" }}>
        <div style={{ width: `${percent}%`, height: "100%", borderRadius: 999, background: color }} />
      </div>
      <div style={{ color: "var(--vs-text-muted)", fontSize: 12 }}>
        {Number(value || 0).toLocaleString()} of {Number(total || 0).toLocaleString()} candidates
      </div>
    </div>
  );
}

function LockToggle({ label, checked, onChange, disabled }) {
  return (
    <label className="vs-card-muted" style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", minHeight: "56px" }}>
      <span style={{ color: "var(--vs-text)", fontWeight: 600, fontSize: "13px" }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} style={{ width: 18, height: 18 }} />
    </label>
  );
}

function CandidateListRow({ candidate, isActive, onSelect, targetMatch, verified, intel }) {
  const name = normalizeCandidateName(candidate);
  const hasContact = Boolean(
    intel?.has_contact ||
      candidate?.has_contact ||
      candidate?.contact_email ||
      candidate?.press_email ||
      candidate?.email ||
      candidate?.phone ||
      candidate?.contact?.campaign_email ||
      candidate?.contact?.phone
  );
  const score = Number(intel?.intelligence_score || 0);

  return (
    <button
      type="button"
      onClick={() => onSelect(candidate)}
      className="vs-card"
      style={{
        width: "100%",
        padding: "16px",
        textAlign: "left",
        display: "grid",
        gap: "12px",
        border: isActive ? "1px solid rgba(99, 102, 241, 0.55)" : targetMatch ? "1px solid rgba(251, 191, 36, 0.55)" : undefined,
        boxShadow: isActive ? "0 0 0 1px rgba(99, 102, 241, 0.18)" : targetMatch ? "0 0 0 1px rgba(251, 191, 36, 0.16)" : undefined,
        cursor: "pointer",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--vs-text)", lineHeight: 1.3 }}>{name}</div>
          <div style={{ marginTop: "4px", fontSize: "12px", color: "var(--vs-text-muted)" }}>
            {candidate.office || "Office"} • {candidate.state || "State"}
          </div>
        </div>

        <div className="vs-chip-row">
          <Badge tone={getTierTone(intel?.priority_tier)}>{intel?.priority_tier || "Tier 3"}</Badge>
          <Badge tone={getCandidateRiskTone(intel?.risk)}>{intel?.risk || "Monitor"}</Badge>
          {verified || intel?.is_verified ? <Badge tone="active">Verified</Badge> : null}
        </div>
      </div>

      <div className="vs-grid-3">
        <MetricChip label={`Score ${score}`} active={score >= 5} />
        <MetricChip label="Contact" active={hasContact} />
        <MetricChip
          label="Website"
          active={Boolean(
            intel?.has_website ||
              candidate?.has_website ||
              candidate?.website ||
              candidate?.campaign_website ||
              candidate?.official_website
          )}
        />
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>{candidate.election_name || candidate.election_year || "Election not specified"}</div>
        <div className="vs-chip-row">
          <Badge tone={getPartyTone(candidate.party)}>{candidate.party || "Unknown"}</Badge>
          <Badge tone={getStatusTone(candidate.status)}>{candidate.status || "active"}</Badge>
        </div>
      </div>
    </button>
  );
}

export default function Candidates() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilters = {
    q: searchParams.get("q") || "",
    state: searchParams.get("state") || "",
    office: searchParams.get("office") || "",
    party: searchParams.get("party") || "",
  };

  const targetCandidateName = searchParams.get("candidate") || "";
  const battlegroundContext = searchParams.get("context") || "";

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingIntel, setLoadingIntel] = useState(true);
  const [loadingCoverage, setLoadingCoverage] = useState(true);

  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [syncingFec, setSyncingFec] = useState(false);

  const [savingLocks, setSavingLocks] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingVerification, setSavingVerification] = useState(false);
  const [editingOverview, setEditingOverview] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [lockEditedFieldsOnSave, setLockEditedFieldsOnSave] = useState(true);

  const [listError, setListError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [coverageError, setCoverageError] = useState("");
  const [coverageMessage, setCoverageMessage] = useState("");
  const [lockMessage, setLockMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");

  const [data, setData] = useState(fallbackListData);
  const [coverage, setCoverage] = useState(fallbackCoverage);
  const [candidateIntel, setCandidateIntel] = useState({ summary: {}, results: [], heat_map: {} });
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(fallbackDetail);

  const [states, setStates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [parties, setParties] = useState([]);
  const [filters, setFilters] = useState(initialFilters);

  const [lockDraft, setLockDraft] = useState({ admin_locked: false, locked_fields: {} });
  const [editDraft, setEditDraft] = useState({});
  const [verificationDraft, setVerificationDraft] = useState({ is_verified: false, verified_by: "", internal_notes: "" });

  const demoMode = typeof window !== "undefined" && localStorage.getItem("vs_demo_mode") === "1";

  async function loadCoverage() {
    try {
      setLoadingCoverage(true);
      setCoverageError("");

      const payload = api.candidateEnrichmentStatus
        ? await api.candidateEnrichmentStatus(filters)
        : api.candidateContactCoverage
          ? await api.candidateContactCoverage(filters)
          : await api.get("/candidates/enrichment-status", { params: filters }).then((r) => r.data);

      setCoverage(normalizeCoveragePayload(payload));
    } catch (err) {
      setCoverageError(err?.response?.data?.error || err?.message || "Failed to load candidate coverage.");
      setCoverage(fallbackCoverage);
    } finally {
      setLoadingCoverage(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function loadFilterOptions() {
      try {
        const [statesRes, officesRes, partiesRes] = await Promise.all([
          api.candidateStates ? api.candidateStates() : api.get("/candidates/states").then((r) => r.data),
          api.candidateOffices ? api.candidateOffices() : api.get("/candidates/offices").then((r) => r.data),
          api.candidateParties ? api.candidateParties() : api.get("/candidates/parties").then((r) => r.data),
        ]);

        if (!active) return;
        setStates(listFromPayload(statesRes, "states"));
        setOffices(listFromPayload(officesRes, "offices"));
        setParties(listFromPayload(partiesRes, "parties"));
      } catch {
        if (!active) return;
        setStates([]);
        setOffices([]);
        setParties([]);
      }
    }

    loadFilterOptions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    loadCoverage();
  }, [filters]);

  useEffect(() => {
    let active = true;

    async function loadCandidateIntel() {
      try {
        setLoadingIntel(true);
        const result = api.candidateScoring
          ? await api.candidateScoring(filters)
          : await api.get("/candidates/intelligence/scoring", { params: filters }).then((r) => r.data);

        if (!active) return;
        setCandidateIntel(result || { summary: {}, results: [], heat_map: {} });
      } catch {
        if (!active) return;
        setCandidateIntel({ summary: {}, results: [], heat_map: {} });
      } finally {
        if (active) setLoadingIntel(false);
      }
    }

    loadCandidateIntel();

    return () => {
      active = false;
    };
  }, [filters]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.q) next.set("q", filters.q);
    if (filters.state) next.set("state", filters.state);
    if (filters.office) next.set("office", filters.office);
    if (filters.party) next.set("party", filters.party);
    if (targetCandidateName) next.set("candidate", targetCandidateName);
    if (battlegroundContext) next.set("context", battlegroundContext);
    setSearchParams(next, { replace: true });
  }, [filters, targetCandidateName, battlegroundContext, setSearchParams]);

  useEffect(() => {
    let active = true;

    async function loadCandidates() {
      try {
        setLoadingList(true);
        setListError("");

        const payload = api.candidates
          ? await api.candidates({ ...filters, page: 1, limit: 24 })
          : await api.get("/candidates", { params: { ...filters, page: 1, limit: 24 }, timeout: 10000 }).then((r) => r.data);

        if (!active) return;

        const results = Array.isArray(payload?.results) ? payload.results : [];
        const total = Number(payload?.total || results.length || 0);

        setData({ total, results });

        if (results.length) {
          const preferred =
            results.find((item) =>
              targetCandidateName
                ? normalizeCandidateName(item).toLowerCase().includes(targetCandidateName.toLowerCase())
                : false
            ) || results[0];

          setSelectedCandidateId((prev) => {
            const exists = results.some((item) => String(item.id) === String(prev));
            return exists ? prev : preferred.id;
          });
        } else {
          setSelectedCandidateId(null);
          setSelectedDetail(fallbackDetail);
        }
      } catch (err) {
        if (!active) return;
        setListError(err?.response?.data?.error || err?.message || "Failed to load candidates");
        setData({ total: 0, results: [] });
        setSelectedCandidateId(null);
        setSelectedDetail(fallbackDetail);
      } finally {
        if (active) setLoadingList(false);
      }
    }

    loadCandidates();

    return () => {
      active = false;
    };
  }, [filters, targetCandidateName]);

  useEffect(() => {
    let active = true;

    async function loadCandidateDetail() {
      if (!selectedCandidateId) return;

      try {
        setLoadingDetail(true);
        setDetailError("");
        setLockMessage("");
        setProfileMessage("");
        setVerificationMessage("");
        setEditingOverview(false);
        setEditingContact(false);

        const response = await api.get(`/candidates/${selectedCandidateId}`, { timeout: 10000 });

        if (!active) return;

        const selectedCandidate = data.results.find((item) => String(item.id) === String(selectedCandidateId)) || null;
        const normalized = normalizeDetailPayload(response?.data, selectedCandidate);
        setSelectedDetail(normalized);

        const profile = normalized?.profile || {};
        setLockDraft({
          admin_locked: Boolean(profile.admin_locked),
          locked_fields: profile.locked_fields && typeof profile.locked_fields === "object" ? profile.locked_fields : {},
        });

        setEditDraft({
          campaign_website: getContactValue(profile, normalized.candidate, "campaign_website", ["website", "campaign_website"]) || "",
          official_website: getContactValue(profile, normalized.candidate, "official_website", ["official_website"]) || "",
          phone: getContactValue(profile, normalized.candidate, "phone", ["phone"]) || "",
          email: getContactValue(profile, normalized.candidate, "email", ["contact_email", "email", "press_email"]) || "",
          office_address: getAddressValue(profile, normalized.candidate, "office_address", ["office_address", "campaign_address", "address_line1"]) || "",
          campaign_address: getAddressValue(profile, normalized.candidate, "campaign_address", ["campaign_address", "office_address", "address_line1"]) || "",
          press_contact_name: getContactValue(profile, normalized.candidate, "press_contact_name", ["press_contact_name"]) || "",
          press_contact_email: getContactValue(profile, normalized.candidate, "press_contact_email", ["press_email", "contact_email"]) || "",
        });

        setVerificationDraft({
          is_verified: Boolean(profile?.is_verified),
          verified_by: profile?.verified_by || "",
          internal_notes: profile?.internal_notes || "",
        });
      } catch (err) {
        if (!active) return;
        const selectedCandidate = data.results.find((item) => String(item.id) === String(selectedCandidateId)) || null;
        setDetailError(err?.response?.data?.error || err?.message || "Failed to load candidate profile");
        setSelectedDetail({ candidate: selectedCandidate, profile: null });
        setLockDraft({ admin_locked: false, locked_fields: {} });
        setEditDraft({});
        setVerificationDraft({ is_verified: false, verified_by: "", internal_notes: "" });
      } finally {
        if (active) setLoadingDetail(false);
      }
    }

    loadCandidateDetail();

    return () => {
      active = false;
    };
  }, [selectedCandidateId, data.results]);

  const candidates = useMemo(() => data.results || [], [data.results]);

  const intelById = useMemo(() => {
    const map = new Map();
    for (const row of candidateIntel?.results || []) {
      map.set(String(row.id), row);
    }
    return map;
  }, [candidateIntel]);

  const selectedIntel = selectedCandidateId ? intelById.get(String(selectedCandidateId)) : null;

  const summary = useMemo(() => {
    const items = candidates;
    return {
      total_candidates: Number(data.total || items.length || 0),
      democratic_candidates: items.filter((c) => String(c.party || "").toLowerCase().includes("democratic")).length,
      republican_candidates: items.filter((c) => String(c.party || "").toLowerCase().includes("republican")).length,
      other_candidates: items.filter((c) => {
        const p = String(c.party || "").toLowerCase();
        return !p.includes("democratic") && !p.includes("republican");
      }).length,
    };
  }, [candidates, data.total]);

  const detailCandidate = selectedDetail?.candidate || null;
  const profile = selectedDetail?.profile || {};
  const selectedName = normalizeCandidateName(detailCandidate);
  const scrapedPageCount = Array.isArray(profile?.scraped_pages) ? profile.scraped_pages.length : 0;
  const health = getProfileHealth(profile, detailCandidate);
  const commandSummary = buildCommandSummary(detailCandidate, profile, health);

  async function reloadListAndDetail() {
    const payload = api.candidates
      ? await api.candidates({ ...filters, page: 1, limit: 24 })
      : await api.get("/candidates", { params: { ...filters, page: 1, limit: 24 }, timeout: 10000 }).then((r) => r.data);

    const results = Array.isArray(payload?.results) ? payload.results : [];
    const total = Number(payload?.total || results.length || 0);
    setData({ total, results });

    const intel = api.candidateScoring
      ? await api.candidateScoring(filters)
      : await api.get("/candidates/intelligence/scoring", { params: filters }).then((r) => r.data);
    setCandidateIntel(intel || { summary: {}, results: [], heat_map: {} });

    await loadCoverage();

    if (selectedCandidateId) {
      const detailResponse = await api.get(`/candidates/${selectedCandidateId}`, { timeout: 10000 });
      const selectedCandidate = results.find((item) => String(item.id) === String(selectedCandidateId)) || detailCandidate || null;
      const normalized = normalizeDetailPayload(detailResponse?.data, selectedCandidate);
      setSelectedDetail(normalized);
    }
  }

  async function handleRefreshProfile() {
    if (!selectedCandidateId) return;

    try {
      setRefreshingProfile(true);
      setDetailError("");
      setLockMessage("");
      setProfileMessage("");
      setVerificationMessage("");

      const payload = api.enrichCandidateProfile
        ? await api.enrichCandidateProfile(selectedCandidateId)
        : await api.post(`/candidates/${selectedCandidateId}/refresh-profile`, {}, { timeout: 45000 }).then((r) => r.data);

      const nextProfile = payload.profile || null;

      setSelectedDetail({
        candidate: payload.candidate || detailCandidate || null,
        profile: nextProfile,
      });

      setLockDraft({
        admin_locked: Boolean(nextProfile?.admin_locked),
        locked_fields: nextProfile?.locked_fields && typeof nextProfile.locked_fields === "object" ? nextProfile.locked_fields : {},
      });

      setEditDraft({
        campaign_website: nextProfile?.campaign_website || payload?.candidate?.website || "",
        official_website: nextProfile?.official_website || "",
        phone: nextProfile?.phone || "",
        email: nextProfile?.email || "",
        office_address: nextProfile?.office_address || "",
        campaign_address: nextProfile?.campaign_address || "",
        press_contact_name: nextProfile?.press_contact_name || "",
        press_contact_email: nextProfile?.press_contact_email || "",
      });

      setVerificationDraft({
        is_verified: Boolean(nextProfile?.is_verified),
        verified_by: nextProfile?.verified_by || "",
        internal_notes: nextProfile?.internal_notes || "",
      });

      setEditingOverview(false);
      setEditingContact(false);
      setProfileMessage("Profile refreshed.");
      await reloadListAndDetail();
    } catch (err) {
      setDetailError(err?.response?.data?.error || err?.message || "Failed to refresh candidate profile");
    } finally {
      setRefreshingProfile(false);
    }
  }

  async function handleRefreshAllProfiles() {
    try {
      setRefreshingAll(true);
      setListError("");
      setCoverageMessage("");

      if (api.refreshCandidateProfiles) {
        await api.refreshCandidateProfiles({
          limit: 100,
          only_missing: true,
          use_fec: true,
          state: filters.state || null,
          office: filters.office || null,
        });
      } else {
        await api.post(
          "/candidates/refresh-profiles",
          {
            limit: 100,
            only_missing: true,
            use_fec: true,
            state: filters.state || null,
            office: filters.office || null,
          },
          { timeout: 90000 }
        );
      }

      setCoverageMessage("Missing candidate profiles refreshed.");
      await reloadListAndDetail();
    } catch (err) {
      setListError(err?.response?.data?.error || err?.message || "Failed to refresh live candidate feeds");
    } finally {
      setRefreshingAll(false);
    }
  }

  async function handleSyncFecCommitteeContacts() {
    try {
      setSyncingFec(true);
      setCoverageError("");
      setCoverageMessage("");

      if (api.syncFecCommitteeContacts) {
        await api.syncFecCommitteeContacts({
          limit: 500,
          offset: 0,
          state: filters.state || null,
          office: filters.office || null,
        });
      } else {
        await api.post(
          "/candidates/sync-fec-committee-contacts",
          {
            limit: 500,
            offset: 0,
            state: filters.state || null,
            office: filters.office || null,
          },
          { timeout: 120000 }
        );
      }

      setCoverageMessage("FEC committee contact sync completed.");
      await reloadListAndDetail();
    } catch (err) {
      setCoverageError(err?.response?.data?.error || err?.message || "Failed to sync FEC committee contacts.");
    } finally {
      setSyncingFec(false);
    }
  }

  function toggleLockedField(fieldKey) {
    setLockDraft((prev) => ({
      ...prev,
      locked_fields: {
        ...prev.locked_fields,
        [fieldKey]: !prev.locked_fields?.[fieldKey],
      },
    }));
  }

  async function handleSaveLocks() {
    if (!selectedCandidateId) return;

    try {
      setSavingLocks(true);
      setDetailError("");
      setLockMessage("");

      const response = await api.patch(
        `/candidates/${selectedCandidateId}/profile-locks`,
        {
          admin_locked: lockDraft.admin_locked,
          locked_fields: lockDraft.locked_fields,
        },
        { timeout: 15000 }
      );

      const nextProfile = response?.data?.profile || response?.data || null;
      setSelectedDetail((prev) => ({ candidate: prev.candidate, profile: nextProfile }));
      setLockMessage("Lock settings saved.");
    } catch (err) {
      setDetailError(err?.response?.data?.error || err?.message || "Failed to save profile locks");
    } finally {
      setSavingLocks(false);
    }
  }

  function resetOverviewDraft() {
    setEditDraft((prev) => ({
      ...prev,
      campaign_website: getContactValue(profile, detailCandidate, "campaign_website", ["website", "campaign_website"]) || "",
      official_website: getContactValue(profile, detailCandidate, "official_website", ["official_website"]) || "",
      phone: getContactValue(profile, detailCandidate, "phone", ["phone"]) || "",
      email: getContactValue(profile, detailCandidate, "email", ["contact_email", "email", "press_email"]) || "",
    }));
  }

  function resetContactDraft() {
    setEditDraft((prev) => ({
      ...prev,
      office_address: getAddressValue(profile, detailCandidate, "office_address", ["office_address", "campaign_address", "address_line1"]) || "",
      campaign_address: getAddressValue(profile, detailCandidate, "campaign_address", ["campaign_address", "office_address", "address_line1"]) || "",
      press_contact_name: getContactValue(profile, detailCandidate, "press_contact_name", ["press_contact_name"]) || "",
      press_contact_email: getContactValue(profile, detailCandidate, "press_contact_email", ["press_email", "contact_email"]) || "",
    }));
  }

  async function handleSaveProfile(fields) {
    if (!selectedCandidateId) return;

    try {
      setSavingProfile(true);
      setDetailError("");
      setProfileMessage("");

      const body = { lock_edited_fields: lockEditedFieldsOnSave };
      fields.forEach((field) => {
        body[field] = editDraft[field] ?? "";
      });

      const response = await api.post(`/candidates/${selectedCandidateId}/manual-profile`, body, { timeout: 15000 });
      const payload = response?.data || {};
      const nextProfile = payload.profile || null;

      setSelectedDetail({
        candidate: payload.candidate || detailCandidate || null,
        profile: nextProfile,
      });

      setProfileMessage(lockEditedFieldsOnSave ? "Profile changes saved and edited fields locked." : "Profile changes saved.");
      setEditingOverview(false);
      setEditingContact(false);
      await reloadListAndDetail();
    } catch (err) {
      setDetailError(err?.response?.data?.error || err?.message || "Failed to save profile changes");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveVerification() {
    if (!selectedCandidateId) return;

    try {
      setSavingVerification(true);
      setDetailError("");
      setVerificationMessage("");

      const response = await api.patch(
        `/candidates/${selectedCandidateId}/verification`,
        {
          is_verified: verificationDraft.is_verified,
          verified_by: verificationDraft.verified_by,
          internal_notes: verificationDraft.internal_notes,
        },
        { timeout: 15000 }
      );

      const nextProfile = response?.data?.profile || response?.data || null;
      setSelectedDetail((prev) => ({ candidate: prev.candidate || detailCandidate, profile: nextProfile }));
      setVerificationMessage(nextProfile?.is_verified ? "Verification and analyst notes saved." : "Verification removed and notes saved.");
      await reloadListAndDetail();
    } catch (err) {
      setDetailError(err?.response?.data?.error || err?.message || "Failed to save verification");
    } finally {
      setSavingVerification(false);
    }
  }

  function clearBattlegroundContext() {
    const next = new URLSearchParams(searchParams);
    next.delete("candidate");
    next.delete("context");
    setSearchParams(next, { replace: true });
  }

  const totalCoverage = Number(coverage.total_candidates || coverage.total || 0);

  return (
    <PageShell
      eyebrow="Candidate Intelligence"
      title="Operate a premium candidate command center."
      description="Search, enrich, verify, protect, and manage campaign intelligence across live candidate profiles."
      demo={demoMode}
      demoText="Demo candidate data is active."
    >
      {battlegroundContext ? (
        <div className="vs-banner" style={{ borderColor: "#c7d2fe", background: "linear-gradient(90deg, #eef2ff 0%, #f8fafc 100%)", color: "#3730a3", display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div><strong>Top Battlegrounds context active.</strong> {targetCandidateName ? `Focused on ${targetCandidateName}. ` : ""}Filters were preloaded from the dashboard.</div>
          <button type="button" className="vs-button vs-button-secondary" onClick={clearBattlegroundContext}>Clear Battleground Context</button>
        </div>
      ) : null}

      {listError ? <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>{listError}</div> : null}
      {coverageError ? <div className="vs-banner" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>{coverageError}</div> : null}
      {coverageMessage ? <div className="vs-banner" style={{ borderColor: "#bbf7d0", background: "#f0fdf4", color: "#166534" }}>{coverageMessage}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Visible Candidates" value={summary.total_candidates || 0} subtext="Current filtered records" />
        <StatCard label="Tier 1 Intel" value={candidateIntel?.summary?.tier1 || 0} subtext="Highest intelligence readiness" />
        <StatCard label="Elevated Risk" value={candidateIntel?.summary?.elevated || 0} subtext="Missing or incomplete records" />
        <StatCard label="Verified" value={candidateIntel?.summary?.verified || coverage.verified || 0} subtext="Analyst-reviewed profiles" />
      </div>

      <SectionCard
        title="Candidate Coverage Dashboard"
        subtitle="Track imported contact intelligence, FEC committee coverage, discovery gaps, and refresh controls."
        right={
          <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge tone={loadingCoverage ? "warning" : "active"}>
              {loadingCoverage ? "Loading Coverage" : "Coverage Live"}
            </Badge>
            <button type="button" className="vs-button vs-button-secondary" onClick={loadCoverage} disabled={loadingCoverage}>
              Refresh Coverage
            </button>
            <button type="button" className="vs-button vs-button-secondary" onClick={handleSyncFecCommitteeContacts} disabled={syncingFec}>
              {syncingFec ? "Syncing FEC..." : "FEC Committee Sync"}
            </button>
            <button type="button" className="vs-button" onClick={handleRefreshAllProfiles} disabled={refreshingAll}>
              {refreshingAll ? "Refreshing Missing..." : "Refresh Missing Contacts"}
            </button>
          </div>
        }
      >
        <div className="vs-grid-4">
          <StatCard label="Total Candidates" value={totalCoverage || summary.total_candidates || 0} subtext="Coverage universe" />
          <StatCard label="FEC Committee" value={coverage.fec_committee || 0} subtext={`${formatPercent(coverage.fec_committee, totalCoverage)} source coverage`} />
          <StatCard label="Discovery Failed" value={coverage.discovery_failed || 0} subtext="Needs fallback source" />
          <StatCard label="Avg Confidence" value={formatConfidence(coverage.avg_confidence)} subtext={`Last sync ${formatDateTime(coverage.last_sync_at)}`} />
        </div>

        <div className="vs-grid-4" style={{ marginTop: 14 }}>
          <CoverageBar label="Email Coverage" value={coverage.with_email} total={totalCoverage} tone="active" />
          <CoverageBar label="Phone Coverage" value={coverage.with_phone} total={totalCoverage} tone="info" />
          <CoverageBar label="Website Coverage" value={coverage.with_website} total={totalCoverage} tone="warning" />
          <CoverageBar label="Address Coverage" value={coverage.with_address} total={totalCoverage} tone="active" />
        </div>

        <div className="vs-grid-4" style={{ marginTop: 14 }}>
          <StatCard label="Missing Email" value={coverage.missing_email || 0} subtext="Needs enrichment" />
          <StatCard label="Missing Phone" value={coverage.missing_phone || 0} subtext="Needs enrichment" />
          <StatCard label="Missing Website" value={coverage.missing_website || 0} subtext="Needs discovery" />
          <StatCard label="Missing Address" value={coverage.missing_address || 0} subtext="Needs committee/contact source" />
        </div>
      </SectionCard>

      <SectionCard title="Command Filters" subtitle="Drive candidate intelligence by state, office, party, or direct search.">
        <div className="vs-grid-4">
          <input className="vs-input" value={filters.q} onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))} placeholder="Search candidates, race names, or offices..." />

          <select className="vs-input" value={filters.state} onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))}>
            <option value="">All states</option>
            {states.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select className="vs-input" value={filters.office} onChange={(e) => setFilters((prev) => ({ ...prev, office: e.target.value }))}>
            <option value="">All offices</option>
            {offices.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>

          <select className="vs-input" value={filters.party} onChange={(e) => setFilters((prev) => ({ ...prev, party: e.target.value }))}>
            <option value="">All parties</option>
            {parties.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>

        <div className="vs-inline-actions" style={{ marginTop: "1rem", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button type="button" className="vs-button vs-button-secondary" onClick={() => { setFilters({ q: "", state: "", office: "", party: "" }); navigate("/candidates"); }}>
            Reset Command Filters
          </button>

          <button type="button" className="vs-button" onClick={handleRefreshAllProfiles} disabled={refreshingAll}>
            {refreshingAll ? "Refreshing Live Feed..." : "Refresh Live Feed"}
          </button>
        </div>
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(360px, 0.95fr) minmax(0, 1.25fr)", gap: "16px", alignItems: "start" }}>
        <SectionCard title="Candidate Queue" subtitle="Select a record to inspect and operate candidate intelligence." right={<Badge tone="accent">{candidates.length} loaded</Badge>}>
          <div className="vs-stack">
            {loadingList || loadingIntel ? (
              <EmptyState text="Loading candidates and intelligence scores..." />
            ) : !candidates.length ? (
              <EmptyState text="No candidates found for the current filters." />
            ) : (
              candidates.map((candidate) => {
                const intel = intelById.get(String(candidate.id));
                const rowVerified = String(candidate.id) === String(selectedCandidateId) ? Boolean(profile?.is_verified) : Boolean(intel?.is_verified);

                return (
                  <CandidateListRow
                    key={candidate.id || normalizeCandidateName(candidate)}
                    candidate={candidate}
                    intel={intel}
                    verified={rowVerified}
                    isActive={String(selectedCandidateId) === String(candidate.id)}
                    targetMatch={targetCandidateName ? normalizeCandidateName(candidate).toLowerCase().includes(targetCandidateName.toLowerCase()) : false}
                    onSelect={(item) => setSelectedCandidateId(item.id)}
                  />
                );
              })
            )}
          </div>
        </SectionCard>

        <div className="vs-stack">
          <SectionCard
            title={detailCandidate ? selectedName : "Candidate Command Card"}
            subtitle={detailCandidate ? commandSummary : "Select a candidate to view command-level profile details."}
            right={
              detailCandidate ? (
                <div className="vs-chip-row" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <Badge tone={getTierTone(selectedIntel?.priority_tier)}>{selectedIntel?.priority_tier || "Tier 3"}</Badge>
                  <Badge tone={getCandidateRiskTone(selectedIntel?.risk)}>{selectedIntel?.risk || "Monitor"}</Badge>
                  <Badge tone="info">Score {selectedIntel?.intelligence_score || 0}</Badge>
                  {profile?.is_verified ? <Badge tone="active">Verified Intelligence</Badge> : null}
                  <Badge tone={getPartyTone(detailCandidate.party)}>{detailCandidate.party || "Unknown"}</Badge>
                  <Badge tone={getFreshnessTone(profile?.updated_at)}>{profile?.updated_at ? "Live" : "Unenriched"}</Badge>
                  <Badge tone={getConfidenceTone(profile?.contact_confidence)}>
                    {profile?.contact_confidence !== undefined ? `Confidence ${formatConfidence(profile.contact_confidence)}` : "Confidence N/A"}
                  </Badge>
                  <Badge tone={getRiskTone(health)}>
                    {health.completed >= 5 ? "Operationally Ready" : health.completed >= 3 ? "Needs Review" : "Action Required"}
                  </Badge>
                  {profile?.admin_locked ? <Badge tone="warning">Admin Locked</Badge> : null}
                  <button type="button" className="vs-button vs-button-secondary" onClick={handleRefreshProfile} disabled={refreshingProfile}>
                    {refreshingProfile ? "Refreshing..." : "Refresh Profile"}
                  </button>
                </div>
              ) : null
            }
          >
            {loadingDetail ? (
              <EmptyState text="Loading candidate profile..." />
            ) : !detailCandidate ? (
              <EmptyState text="Select a candidate from the queue." />
            ) : (
              <div className="vs-stack">
                {detailError ? <div className="vs-banner" style={{ borderColor: "#fde68a", background: "#fffbeb", color: "#92400e" }}>{detailError}</div> : null}
                {lockMessage ? <div className="vs-banner" style={{ borderColor: "#bbf7d0", background: "#f0fdf4", color: "#166534" }}>{lockMessage}</div> : null}
                {profileMessage ? <div className="vs-banner" style={{ borderColor: "#bfdbfe", background: "#eff6ff", color: "#1d4ed8" }}>{profileMessage}</div> : null}
                {verificationMessage ? <div className="vs-banner" style={{ borderColor: "#86efac", background: "#f0fdf4", color: "#166534" }}>{verificationMessage}</div> : null}

                <div className="vs-grid-4">
                  <StatCard label="State" value={detailCandidate.state || "N/A"} subtext="Candidate state" />
                  <StatCard label="Office" value={detailCandidate.office || "N/A"} subtext="Office sought" />
                  <StatCard label="Intel Score" value={selectedIntel?.intelligence_score || 0} subtext={selectedIntel?.priority_tier || "Tier 3"} />
                  <StatCard label="Contact Ready" value={selectedIntel?.has_contact ? "Yes" : "No"} subtext={selectedIntel?.risk || "Monitor"} />
                </div>

                <SectionCard title="Intelligence Health" subtitle="Operational readiness for campaign contact intelligence." right={<Badge tone={health.completed >= 4 ? "active" : "warning"}>{health.completed}/{health.total} signals</Badge>}>
                  <div className="vs-grid-3">
                    <MetricChip label="Website" active={health.hasCampaignWebsite || health.hasOfficialWebsite} />
                    <MetricChip label="Primary Email" active={health.hasEmail} />
                    <MetricChip label="Press Email" active={health.hasPressEmail} />
                    <MetricChip label="Phone" active={health.hasPhone} />
                    <MetricChip label="Address" active={health.hasAddress} />
                    <MetricChip label="Staff" active={health.hasStaff} />
                  </div>

                  {selectedIntel?.recommended_actions?.length ? (
                    <div className="vs-stack" style={{ marginTop: 12 }}>
                      {selectedIntel.recommended_actions.map((action, index) => (
                        <div key={`${action}-${index}`} className="vs-banner" style={{ margin: 0 }}>
                          {action}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </SectionCard>

                <SectionCard
                  title="Overview"
                  subtitle="Command fields for direct campaign communication."
                  right={
                    editingOverview ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <button type="button" className="vs-button vs-button-secondary" onClick={() => { resetOverviewDraft(); setEditingOverview(false); }} disabled={savingProfile}>Cancel</button>
                        <button type="button" className="vs-button" onClick={() => handleSaveProfile(OVERVIEW_FIELDS.map((f) => f.key))} disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Overview"}</button>
                      </div>
                    ) : (
                      <button type="button" className="vs-button vs-button-secondary" onClick={() => setEditingOverview(true)}>Edit Overview</button>
                    )
                  }
                >
                  <div className="vs-grid-2">
                    {editingOverview ? (
                      OVERVIEW_FIELDS.map((field) => (
                        <EditField key={field.key} label={field.label} type={field.type} value={editDraft[field.key] || ""} onChange={(value) => setEditDraft((prev) => ({ ...prev, [field.key]: value }))} />
                      ))
                    ) : (
                      <>
                        <DetailField
                          label="Campaign Website"
                          value={getContactValue(profile, detailCandidate, "campaign_website", ["website", "campaign_website"]) || "N/A"}
                          href={safeUrl(getContactValue(profile, detailCandidate, "campaign_website", ["website", "campaign_website"]))}
                        />
                        <DetailField
                          label="Official Website"
                          value={getContactValue(profile, detailCandidate, "official_website", ["official_website"]) || "N/A"}
                          href={safeUrl(getContactValue(profile, detailCandidate, "official_website", ["official_website"]))}
                        />
                        <DetailField label="Phone" value={getContactValue(profile, detailCandidate, "phone", ["phone"]) || "N/A"} />
                        <DetailField label="Email" value={getContactValue(profile, detailCandidate, "email", ["contact_email", "email", "press_email"]) || "N/A"} />
                      </>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Contact"
                  subtitle="Press and location intelligence for direct outreach."
                  right={
                    editingContact ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <button type="button" className="vs-button vs-button-secondary" onClick={() => { resetContactDraft(); setEditingContact(false); }} disabled={savingProfile}>Cancel</button>
                        <button type="button" className="vs-button" onClick={() => handleSaveProfile(CONTACT_FIELDS.map((f) => f.key))} disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Contact"}</button>
                      </div>
                    ) : (
                      <button type="button" className="vs-button vs-button-secondary" onClick={() => setEditingContact(true)}>Edit Contact</button>
                    )
                  }
                >
                  <div className="vs-grid-2">
                    {editingContact ? (
                      CONTACT_FIELDS.map((field) => (
                        <EditField key={field.key} label={field.label} type={field.type} value={editDraft[field.key] || ""} onChange={(value) => setEditDraft((prev) => ({ ...prev, [field.key]: value }))} />
                      ))
                    ) : (
                      <>
                        <DetailField label="Office Address" value={getAddressValue(profile, detailCandidate, "office_address", ["office_address", "campaign_address", "address_line1"]) || "N/A"} />
                        <DetailField label="Campaign Address" value={getAddressValue(profile, detailCandidate, "campaign_address", ["campaign_address", "office_address", "address_line1"]) || "N/A"} />
                        <DetailField label="Press Contact" value={getContactValue(profile, detailCandidate, "press_contact_name", ["press_contact_name"]) || "N/A"} />
                        <DetailField label="Press Contact Email" value={getContactValue(profile, detailCandidate, "press_contact_email", ["press_email", "contact_email"]) || "N/A"} />
                      </>
                    )}
                  </div>

                  {(editingOverview || editingContact) ? (
                    <div className="vs-card-muted" style={{ marginTop: "12px", padding: "12px 14px", display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ color: "var(--vs-text-muted)", fontSize: "12px" }}>Save manual intelligence back to the profile. Protect edited fields from future refresh overwrites.</div>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--vs-text)", fontWeight: 600, fontSize: "13px" }}>
                        <input type="checkbox" checked={lockEditedFieldsOnSave} onChange={(e) => setLockEditedFieldsOnSave(e.target.checked)} />
                        Lock edited fields on save
                      </label>
                    </div>
                  ) : null}
                </SectionCard>

                <SectionCard title="Verified Intelligence" subtitle="Mark records as analyst-reviewed and capture internal notes." right={<button type="button" className="vs-button" onClick={handleSaveVerification} disabled={savingVerification}>{savingVerification ? "Saving..." : "Save Verification"}</button>}>
                  <div className="vs-grid-2">
                    <div className="vs-card-muted" style={{ padding: "12px 14px", display: "grid", gap: "8px", minHeight: "84px" }}>
                      <div className="vs-stat-label">Verification Status</div>
                      <label style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--vs-text)", fontWeight: 700 }}>
                        <input type="checkbox" checked={Boolean(verificationDraft.is_verified)} onChange={(e) => setVerificationDraft((prev) => ({ ...prev, is_verified: e.target.checked }))} />
                        Mark as verified intelligence
                      </label>
                    </div>

                    <EditField label="Verified By" type="text" value={verificationDraft.verified_by || ""} onChange={(value) => setVerificationDraft((prev) => ({ ...prev, verified_by: value }))} placeholder="Analyst name" />
                    <EditField label="Internal Notes" type="textarea" value={verificationDraft.internal_notes || ""} onChange={(value) => setVerificationDraft((prev) => ({ ...prev, internal_notes: value }))} placeholder="Analyst notes, validation context, source quality, follow-up items..." />
                    <DetailField label="Verified At" value={formatDateTime(profile?.verified_at)} />
                  </div>
                </SectionCard>

                <SectionCard title="Campaign Team" subtitle="Enriched staff and leadership signals.">
                  <div className="vs-grid-2">
                    <DetailField label="Chief of Staff" value={profile?.chief_of_staff_name || "N/A"} />
                    <DetailField label="Campaign Manager" value={profile?.campaign_manager_name || "N/A"} />
                    <DetailField label="Finance Director" value={profile?.finance_director_name || "N/A"} />
                    <DetailField label="Political Director" value={profile?.political_director_name || "N/A"} />
                  </div>
                </SectionCard>

                <SectionCard title="Protection Controls" subtitle="Protect manually curated fields from future live refreshes." right={<button type="button" className="vs-button" onClick={handleSaveLocks} disabled={savingLocks || !detailCandidate}>{savingLocks ? "Saving Locks..." : "Save Lock Settings"}</button>}>
                  <div className="vs-stack">
                    <LockToggle label="Lock Entire Profile" checked={Boolean(lockDraft.admin_locked)} onChange={() => setLockDraft((prev) => ({ ...prev, admin_locked: !prev.admin_locked }))} disabled={!detailCandidate} />
                    <div className="vs-grid-2">
                      {LOCKABLE_FIELDS.map((field) => (
                        <LockToggle key={field.key} label={field.label} checked={Boolean(lockDraft.locked_fields?.[field.key])} onChange={() => toggleLockedField(field.key)} disabled={!detailCandidate} />
                      ))}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Profile Metadata" subtitle="Source, confidence, lock state, and crawl footprint.">
                  <div className="vs-grid-2">
                    <DetailField label="Source Label" value={profile?.source_label || "live_candidate_feed"} />
                    <DetailField label="Updated At" value={formatDateTime(profile?.updated_at)} />
                    <DetailField label="Admin Locked" value={profile?.admin_locked ? "Yes" : "No"} />
                    <DetailField label="Contact Confidence" value={profile?.contact_confidence !== undefined ? formatConfidence(profile.contact_confidence) : "N/A"} />
                    <DetailField label="Scraped Pages" value={String(scrapedPageCount || 0)} />
                    <DetailField label="Verified By" value={profile?.verified_by || "N/A"} />
                    <DetailField label="Locked Fields" value={profile?.locked_fields ? JSON.stringify(profile.locked_fields) : "{}"} monospace />
                  </div>
                </SectionCard>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </PageShell>
  );
}
