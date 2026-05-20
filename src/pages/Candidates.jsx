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
  { key: "political_director_name", label: "Political Director" }
];

const OVERVIEW_FIELDS = [
  { key: "campaign_website", label: "Campaign Website", type: "url" },
  { key: "official_website", label: "Official Website", type: "url" },
  { key: "phone", label: "Phone", type: "text" },
  { key: "email", label: "Email", type: "email" }
];

const CONTACT_FIELDS = [
  { key: "office_address", label: "Office Address", type: "textarea" },
  { key: "campaign_address", label: "Campaign Address", type: "textarea" },
  { key: "press_contact_name", label: "Press Contact", type: "text" },
  { key: "press_contact_email", label: "Press Contact Email", type: "email" }
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
    .join(", " );

  return address || "";
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
    minute: "2-digit"
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
    hasStaff
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
    total: 6
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
        position: "relative"
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


function normalizeRelationshipGraphPayload(payload) {
  const graph = payload?.graph || payload || {};
  const insights = graph.insights || {};

  return {
    nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
    links: Array.isArray(graph.links) ? graph.links : [],
    counts: graph.counts || {},
    insights: {
      summary: Array.isArray(insights.summary) ? insights.summary : [],
      topInfluencers: Array.isArray(insights.topInfluencers)
        ? insights.topInfluencers
        : Array.isArray(insights.top_influencers)
          ? insights.top_influencers
          : [],
      highStrengthLinks: Array.isArray(insights.highStrengthLinks)
        ? insights.highStrengthLinks
        : Array.isArray(insights.strongest_links)
          ? insights.strongest_links
          : [],
      orphanCandidates: Array.isArray(insights.orphanCandidates)
        ? insights.orphanCandidates
        : Array.isArray(insights.orphan_candidates)
          ? insights.orphan_candidates
          : [],
    },
  };
}

function normalizeGraphName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getLinkEndpointId(endpoint) {
  if (!endpoint) return "";
  if (typeof endpoint === "string") return endpoint;
  return endpoint.id || "";
}

function getRelationshipNodeMatch(candidate, graph) {
  if (!candidate || !graph?.nodes?.length) return null;

  const candidateId = String(candidate.id || "");
  const fecId = String(candidate.fec_candidate_id || "").toLowerCase();
  const candidateName = normalizeGraphName(normalizeCandidateName(candidate));

  return (
    graph.nodes.find((node) => {
      if (node.type !== "candidate") return false;
      const raw = node.raw || {};
      return (
        String(node.source_id || "") === candidateId ||
        String(raw.id || "") === candidateId ||
        String(raw.fec_candidate_id || "").toLowerCase() === fecId ||
        normalizeGraphName(node.label) === candidateName ||
        normalizeGraphName(raw.full_name || raw.name) === candidateName
      );
    }) || null
  );
}

function getRelationshipConnections(node, graph) {
  if (!node?.id || !graph?.links?.length) return [];

  const nodesById = new Map((graph.nodes || []).map((item) => [item.id, item]));

  return graph.links
    .filter((link) => {
      const source = getLinkEndpointId(link.source);
      const target = getLinkEndpointId(link.target);
      return source === node.id || target === node.id;
    })
    .map((link) => {
      const source = getLinkEndpointId(link.source);
      const target = getLinkEndpointId(link.target);
      const otherId = source === node.id ? target : source;
      const otherNode = nodesById.get(otherId);

      return {
        ...link,
        otherId,
        otherNode,
      };
    })
    .sort((a, b) => Number(b.strength || 0) - Number(a.strength || 0));
}

function relationshipTypeTone(type) {
  if (type === "consultant") return "active";
  if (type === "donor") return "warning";
  if (type === "candidate") return "accent";
  return "default";
}

function RelationshipIntelligenceCard({ candidate, graph, loading, onOpenGraph, onOpenConsultants }) {
  const matchedNode = useMemo(() => getRelationshipNodeMatch(candidate, graph), [candidate, graph]);
  const connections = useMemo(() => getRelationshipConnections(matchedNode, graph), [matchedNode, graph]);

  const consultantConnections = connections.filter((item) => item.otherNode?.type === "consultant");
  const donorConnections = connections.filter((item) => item.otherNode?.type === "donor");
  const topConnections = connections.slice(0, 6);
  const influence = Number(matchedNode?.influence || 0);

  return (
    <SectionCard
      title="Relationship Intelligence"
      subtitle="Candidate-level donor, consultant, and influence-path intelligence from the live relationship graph."
      right={
        <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Badge tone={matchedNode ? getConfidenceTone(influence / 100) : "default"}>
            {loading ? "Loading Graph" : matchedNode ? "Graph Matched" : "No Match Yet"}
          </Badge>
          <button type="button" className="vs-button vs-button-secondary" onClick={onOpenGraph}>
            Open Relationship Graph
          </button>
        </div>
      }
    >
      {loading ? (
        <EmptyState text="Loading relationship intelligence for this candidate..." />
      ) : !matchedNode ? (
        <div className="vs-stack">
          <EmptyState text="No relationship graph node matched this candidate yet. Run the relationship graph after candidate/contact enrichment to expand coverage." />
          <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="vs-button" onClick={onOpenGraph}>
              Analyze Full Network
            </button>
            <button type="button" className="vs-button vs-button-secondary" onClick={onOpenConsultants}>
              Find Consultant Matches
            </button>
          </div>
        </div>
      ) : (
        <div className="vs-stack">
          <div className="vs-grid-4">
            <StatCard label="Influence Score" value={influence} subtext="Graph priority" />
            <StatCard label="Connections" value={connections.length} subtext="Weighted paths" />
            <StatCard label="Consultants" value={consultantConnections.length} subtext="Strategist links" />
            <StatCard label="Donors" value={donorConnections.length} subtext="Funding links" />
          </div>

          <div className="vs-card-muted" style={{ padding: 16, display: "grid", gap: 10 }}>
            <div className="vs-stat-label">Strategic Influence Summary</div>
            <div style={{ color: "var(--vs-text)", fontWeight: 700, lineHeight: 1.55 }}>
              {connections.length
                ? `${normalizeCandidateName(candidate)} has ${connections.length} mapped relationship path${connections.length === 1 ? "" : "s"}, including ${consultantConnections.length} consultant connection${consultantConnections.length === 1 ? "" : "s"} and ${donorConnections.length} donor connection${donorConnections.length === 1 ? "" : "s"}. Use this profile as an anchor for consultant matching, donor outreach, and coalition analysis.`
                : `${normalizeCandidateName(candidate)} is matched in the relationship graph, but no strong consultant or donor paths were detected yet. Prioritize enrichment and consultant discovery.`}
            </div>
          </div>

          {topConnections.length ? (
            <div className="vs-grid-2">
              {topConnections.map((connection, index) => (
                <div key={`${connection.otherId}-${index}`} className="vs-card-muted" style={{ padding: 14, display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ color: "var(--vs-text)", lineHeight: 1.3 }}>
                      {connection.otherNode?.label || connection.otherId || "Relationship Node"}
                    </strong>
                    <Badge tone={relationshipTypeTone(connection.otherNode?.type)}>
                      {connection.otherNode?.type || "Connection"}
                    </Badge>
                  </div>

                  <div style={{ color: "var(--vs-text-muted)", fontSize: 13, lineHeight: 1.45 }}>
                    {connection.otherNode?.subtitle || connection.label || "Strategic relationship identified in graph intelligence."}
                  </div>

                  <div className="vs-chip-row">
                    <Badge tone="info">{connection.label || "Relationship"}</Badge>
                    <Badge tone={getConfidenceTone(Number(connection.strength || 0) / 100)}>
                      Strength {connection.strength || 0}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="vs-inline-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="vs-button" onClick={onOpenGraph}>
              Analyze Full Network
            </button>
            <button type="button" className="vs-button vs-button-secondary" onClick={onOpenConsultants}>
              Find Consultant Matches
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

export default function Candidates() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilters = {
    q: searchParams.get("q") || "",
    state: searchParams.get("state") || "",
    office: searchParams.get("office") || "",
    party: searchParams.get("party") || ""
  };

  const targetCandidateName = searchParams.get("candidate") || "";
  const battlegroundContext = searchParams.get("context") || "";

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingIntel, setLoadingIntel] = useState(true);
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [savingLocks, setSavingLocks] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingVerification, setSavingVerification] = useState(false);
  const [editingOverview, setEditingOverview] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [lockEditedFieldsOnSave, setLockEditedFieldsOnSave] = useState(true);

  const [listError, setListError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [lockMessage, setLockMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");

  const [data, setData] = useState(fallbackListData);
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

  useEffect(() => {
    let active = true;

    async function loadFilterOptions() {
      try {
        const [statesRes, officesRes, partiesRes] = await Promise.all([
          api.candidateStates ? api.candidateStates() : api.get("/candidates/states").then((r) => r.data),
          api.candidateOffices ? api.candidateOffices() : api.get("/candidates/offices").then((r) => r.data),
          api.candidateParties ? api.candidateParties() : api.get("/candidates/parties").then((r) => r.data)
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
    let active = true;

    async function loadRelationshipGraph() {
      if (demoMode) {
        setRelationshipGraph({ nodes: [], links: [], insights: {}, counts: {} });
        setLoadingRelationshipGraph(false);
        return;
      }

      try {
        setLoadingRelationshipGraph(true);

        const params = {
          state: filters.state || undefined,
          party: filters.party || undefined,
          office: filters.office || undefined,
          limit: 120,
        };

        const payload = api.relationshipGraph
          ? await api.relationshipGraph(params)
          : await api.get("/relationships/graph", { params }).then((response) => response.data);

        if (!active) return;
        setRelationshipGraph(normalizeRelationshipGraphPayload(payload));
      } catch {
        if (!active) return;
        setRelationshipGraph({ nodes: [], links: [], insights: {}, counts: {} });
      } finally {
        if (active) setLoadingRelationshipGraph(false);
      }
    }

    loadRelationshipGraph();

    return () => {
      active = false;
    };
  }, [demoMode, filters.state, filters.party, filters.office]);

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
          locked_fields: profile.locked_fields && typeof profile.locked_fields === "object" ? profile.locked_fields : {}
        });

        setEditDraft({
          campaign_website:
            getContactValue(profile, normalized.candidate, "campaign_website", ["website", "campaign_website"]) || "",
          official_website:
            getContactValue(profile, normalized.candidate, "official_website", ["official_website"]) || "",
          phone: getContactValue(profile, normalized.candidate, "phone", ["phone"]) || "",
          email:
            getContactValue(profile, normalized.candidate, "email", ["contact_email", "email", "press_email"]) || "",
          office_address:
            getAddressValue(profile, normalized.candidate, "office_address", ["office_address", "campaign_address", "address_line1"]) || "",
          campaign_address:
            getAddressValue(profile, normalized.candidate, "campaign_address", ["campaign_address", "office_address", "address_line1"]) || "",
          press_contact_name:
            getContactValue(profile, normalized.candidate, "press_contact_name", ["press_contact_name"]) || "",
          press_contact_email:
            getContactValue(profile, normalized.candidate, "press_contact_email", ["press_email", "contact_email"]) || "",
        });

        setVerificationDraft({
          is_verified: Boolean(profile?.is_verified),
          verified_by: profile?.verified_by || "",
          internal_notes: profile?.internal_notes || ""
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
      }).length
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
        profile: nextProfile
      });

      setLockDraft({
        admin_locked: Boolean(nextProfile?.admin_locked),
        locked_fields: nextProfile?.locked_fields && typeof nextProfile.locked_fields === "object" ? nextProfile.locked_fields : {}
      });

      setEditDraft({
        campaign_website: nextProfile?.campaign_website || payload?.candidate?.website || "",
        official_website: nextProfile?.official_website || "",
        phone: nextProfile?.phone || "",
        email: nextProfile?.email || "",
        office_address: nextProfile?.office_address || "",
        campaign_address: nextProfile?.campaign_address || "",
        press_contact_name: nextProfile?.press_contact_name || "",
        press_contact_email: nextProfile?.press_contact_email || ""
      });

      setVerificationDraft({
        is_verified: Boolean(nextProfile?.is_verified),
        verified_by: nextProfile?.verified_by || "",
        internal_notes: nextProfile?.internal_notes || ""
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
      if (api.refreshCandidateProfiles) {
        await api.refreshCandidateProfiles({ limit: 100 });
      } else {
        await api.post("/candidates/refresh-profiles", { limit: 100 }, { timeout: 90000 });
      }
      await reloadListAndDetail();
    } catch (err) {
      setListError(err?.response?.data?.error || err?.message || "Failed to refresh live candidate feeds");
    } finally {
      setRefreshingAll(false);
    }
  }

  function toggleLockedField(fieldKey) {
    setLockDraft((prev) => ({
      ...prev,
      locked_fields: {
        ...prev.locked_fields,
        [fieldKey]: !prev.locked_fields?.[fieldKey]
      }
    }));
  }

  async function handleSaveLocks() {
    if (!selectedCandidateId) return;

    try {
      setSavingLocks(true);
      setDetailError("");
      setLockMessage("");

      const response = await api.patch(`/candidates/${selectedCandidateId}/profile-locks`, {
        admin_locked: lockDraft.admin_locked,
        locked_fields: lockDraft.locked_fields
      }, { timeout: 15000 });

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
      campaign_website:
        getContactValue(profile, detailCandidate, "campaign_website", ["website", "campaign_website"]) || "",
      official_website:
        getContactValue(profile, detailCandidate, "official_website", ["official_website"]) || "",
      phone: getContactValue(profile, detailCandidate, "phone", ["phone"]) || "",
      email:
        getContactValue(profile, detailCandidate, "email", ["contact_email", "email", "press_email"]) || ""
    }));
  }

  function resetContactDraft() {
    setEditDraft((prev) => ({
      ...prev,
      office_address:
        getAddressValue(profile, detailCandidate, "office_address", ["office_address", "campaign_address", "address_line1"]) || "",
      campaign_address:
        getAddressValue(profile, detailCandidate, "campaign_address", ["campaign_address", "office_address", "address_line1"]) || "",
      press_contact_name:
        getContactValue(profile, detailCandidate, "press_contact_name", ["press_contact_name"]) || "",
      press_contact_email:
        getContactValue(profile, detailCandidate, "press_contact_email", ["press_email", "contact_email"]) || ""
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
        profile: nextProfile
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

      const response = await api.patch(`/candidates/${selectedCandidateId}/verification`, {
        is_verified: verificationDraft.is_verified,
        verified_by: verificationDraft.verified_by,
        internal_notes: verificationDraft.internal_notes
      }, { timeout: 15000 });

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

      <div className="vs-grid-4">
        <StatCard label="Visible Candidates" value={summary.total_candidates || 0} subtext="Current filtered records" />
        <StatCard label="Tier 1 Intel" value={candidateIntel?.summary?.tier1 || 0} subtext="Highest intelligence readiness" />
        <StatCard label="Elevated Risk" value={candidateIntel?.summary?.elevated || 0} subtext="Missing or incomplete records" />
        <StatCard label="Verified" value={candidateIntel?.summary?.verified || 0} subtext="Analyst-reviewed profiles" />
      </div>

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


                <RelationshipIntelligenceCard
                  candidate={detailCandidate}
                  graph={relationshipGraph}
                  loading={loadingRelationshipGraph}
                  onOpenGraph={() =>
                    navigate(`/relationship-graph?candidate=${encodeURIComponent(selectedName || "")}`)
                  }
                  onOpenConsultants={() =>
                    navigate(`/consultants?state=${encodeURIComponent(detailCandidate?.state || "")}`)
                  }
                />

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
                          value={
                            getContactValue(profile, detailCandidate, "campaign_website", ["website", "campaign_website"]) ||
                            "N/A"
                          }
                          href={safeUrl(
                            getContactValue(profile, detailCandidate, "campaign_website", ["website", "campaign_website"])
                          )}
                        />
                        <DetailField
                          label="Official Website"
                          value={
                            getContactValue(profile, detailCandidate, "official_website", ["official_website"]) ||
                            "N/A"
                          }
                          href={safeUrl(
                            getContactValue(profile, detailCandidate, "official_website", ["official_website"])
                          )}
                        />
                        <DetailField
                          label="Phone"
                          value={getContactValue(profile, detailCandidate, "phone", ["phone"]) || "N/A"}
                        />
                        <DetailField
                          label="Email"
                          value={
                            getContactValue(profile, detailCandidate, "email", [
                              "contact_email",
                              "email",
                              "press_email",
                            ]) || "N/A"
                          }
                        />
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
                        <DetailField
                          label="Office Address"
                          value={
                            getAddressValue(profile, detailCandidate, "office_address", [
                              "office_address",
                              "campaign_address",
                              "address_line1",
                            ]) || "N/A"
                          }
                        />
                        <DetailField
                          label="Campaign Address"
                          value={
                            getAddressValue(profile, detailCandidate, "campaign_address", [
                              "campaign_address",
                              "office_address",
                              "address_line1",
                            ]) || "N/A"
                          }
                        />
                        <DetailField
                          label="Press Contact"
                          value={
                            getContactValue(profile, detailCandidate, "press_contact_name", [
                              "press_contact_name",
                            ]) || "N/A"
                          }
                        />
                        <DetailField
                          label="Press Contact Email"
                          value={
                            getContactValue(profile, detailCandidate, "press_contact_email", [
                              "press_email",
                              "contact_email",
                            ]) || "N/A"
                          }
                        />
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
