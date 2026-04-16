import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const fallbackListData = {
  total: 0,
  results: []
};

const fallbackDetail = {
  candidate: null,
  profile: null
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

function normalizeCandidateName(candidate) {
  return (
    candidate?.full_name ||
    [candidate?.first_name, candidate?.last_name].filter(Boolean).join(" ") ||
    "Candidate"
  );
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
    return {
      candidate: selectedCandidate || null,
      profile: null
    };
  }

  return {
    candidate: payload.candidate || selectedCandidate || null,
    profile: payload.profile || null
  };
}

function getProfileHealth(profile = {}, candidate = null) {
  const hasCampaignWebsite = Boolean(profile?.campaign_website || candidate?.website);
  const hasOfficialWebsite = Boolean(profile?.official_website);
  const hasEmail = Boolean(profile?.email);
  const hasPressEmail = Boolean(profile?.press_contact_email);
  const hasPhone = Boolean(profile?.phone);
  const hasAddress = Boolean(profile?.office_address || profile?.campaign_address);
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

function DetailField({ label, value, href, monospace = false }) {
  return (
    <div
      className="vs-card-muted"
      style={{
        padding: "12px 14px",
        display: "grid",
        gap: "6px",
        minHeight: "84px",
        alignContent: "start"
      }}
    >
      <div className="vs-stat-label">{label}</div>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "var(--vs-text)",
            fontWeight: 700,
            textDecoration: "none",
            wordBreak: "break-word",
            fontFamily: monospace ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined
          }}
        >
          {value || "N/A"}
        </a>
      ) : (
        <div
          style={{
            color: "var(--vs-text)",
            fontWeight: 700,
            wordBreak: "break-word",
            fontFamily: monospace ? "ui-monospace, SFMono-Regular, Menlo, monospace" : undefined
          }}
        >
          {value || "N/A"}
        </div>
      )}
    </div>
  );
}

function EditField({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div
      className="vs-card-muted"
      style={{
        padding: "12px 14px",
        display: "grid",
        gap: "6px",
        minHeight: "84px",
        alignContent: "start"
      }}
    >
      <div className="vs-stat-label">{label}</div>
      {type === "textarea" ? (
        <textarea
          className="vs-input"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || ""}
          rows={3}
          style={{ resize: "vertical", minHeight: "76px" }}
        />
      ) : (
        <input
          className="vs-input"
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || ""}
        />
      )}
    </div>
  );
}

function MetricChip({ label, active }) {
  return (
    <div
      className="vs-card-muted"
      style={{
        padding: "10px 12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "10px"
      }}
    >
      <span style={{ color: "var(--vs-text)", fontWeight: 600, fontSize: "12px" }}>
        {label}
      </span>
      <Badge tone={active ? "active" : "default"}>{active ? "Ready" : "Missing"}</Badge>
    </div>
  );
}

function LockToggle({ label, checked, onChange, disabled }) {
  return (
    <label
      className="vs-card-muted"
      style={{
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        minHeight: "56px"
      }}
    >
      <span style={{ color: "var(--vs-text)", fontWeight: 600, fontSize: "13px" }}>
        {label}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        style={{ width: 18, height: 18 }}
      />
    </label>
  );
}

function CandidateListRow({ candidate, isActive, onSelect }) {
  const name = normalizeCandidateName(candidate);

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
        border: isActive ? "1px solid rgba(99, 102, 241, 0.55)" : undefined,
        boxShadow: isActive ? "0 0 0 1px rgba(99, 102, 241, 0.18)" : undefined,
        cursor: "pointer"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          alignItems: "flex-start",
          flexWrap: "wrap"
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: "var(--vs-text)",
              lineHeight: 1.3
            }}
          >
            {name}
          </div>
          <div
            style={{
              marginTop: "4px",
              fontSize: "12px",
              color: "var(--vs-text-muted)"
            }}
          >
            {candidate.office || "Office"} • {candidate.state || "State"}
          </div>
        </div>

        <div className="vs-chip-row">
          <Badge tone={getPartyTone(candidate.party)}>
            {candidate.party || "Unknown"}
          </Badge>
          <Badge tone={candidate.incumbent ? "active" : "default"}>
            {candidate.incumbent ? "Incumbent" : "Challenger"}
          </Badge>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <div style={{ fontSize: "12px", color: "var(--vs-text-muted)" }}>
          {candidate.election_name || "Election not specified"}
        </div>
        <Badge tone={getStatusTone(candidate.status)}>
          {candidate.status || "active"}
        </Badge>
      </div>
    </button>
  );
}

export default function Candidates() {
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refreshingProfile, setRefreshingProfile] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [savingLocks, setSavingLocks] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingOverview, setEditingOverview] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [lockEditedFieldsOnSave, setLockEditedFieldsOnSave] = useState(true);
  const [listError, setListError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [lockMessage, setLockMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [data, setData] = useState(fallbackListData);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(fallbackDetail);
  const [states, setStates] = useState([]);
  const [offices, setOffices] = useState([]);
  const [parties, setParties] = useState([]);
  const [filters, setFilters] = useState({
    q: "",
    state: "",
    office: "",
    party: ""
  });
  const [lockDraft, setLockDraft] = useState({
    admin_locked: false,
    locked_fields: {}
  });
  const [editDraft, setEditDraft] = useState({});

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useEffect(() => {
    let active = true;

    async function loadFilterOptions() {
      try {
        const [statesRes, officesRes, partiesRes] = await Promise.all([
          api.get("/candidates/states", { timeout: 6000 }),
          api.get("/candidates/offices", { timeout: 6000 }),
          api.get("/candidates/parties", { timeout: 6000 })
        ]);

        if (!active) return;
        setStates(Array.isArray(statesRes?.data) ? statesRes.data : []);
        setOffices(Array.isArray(officesRes?.data) ? officesRes.data : []);
        setParties(Array.isArray(partiesRes?.data) ? partiesRes.data : []);
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

    async function loadCandidates() {
      try {
        setLoadingList(true);
        setListError("");

        const params = new URLSearchParams();
        params.set("q", filters.q || "");
        params.set("state", filters.state || "");
        params.set("office", filters.office || "");
        params.set("party", filters.party || "");
        params.set("page", "1");
        params.set("limit", "24");

        const response = await api.get(`/candidates?${params.toString()}`, {
          timeout: 10000
        });

        if (!active) return;

        const payload = response?.data || { total: 0, results: [] };
        const results = Array.isArray(payload.results) ? payload.results : [];
        const total = Number(payload.total || results.length || 0);

        setData({ total, results });

        if (results.length) {
          setSelectedCandidateId((prev) => {
            const exists = results.some((item) => String(item.id) === String(prev));
            return exists ? prev : results[0].id;
          });
        } else {
          setSelectedCandidateId(null);
          setSelectedDetail(fallbackDetail);
        }
      } catch (err) {
        if (!active) return;
        setListError(
          err?.response?.data?.error || err?.message || "Failed to load candidates"
        );
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
  }, [filters]);

  useEffect(() => {
    let active = true;

    async function loadCandidateDetail() {
      if (!selectedCandidateId) return;

      try {
        setLoadingDetail(true);
        setDetailError("");
        setLockMessage("");
        setProfileMessage("");
        setEditingOverview(false);
        setEditingContact(false);

        const response = await api.get(`/candidates/${selectedCandidateId}`, {
          timeout: 10000
        });

        if (!active) return;

        const selectedCandidate =
          data.results.find((item) => String(item.id) === String(selectedCandidateId)) ||
          null;

        const normalized = normalizeDetailPayload(response?.data, selectedCandidate);
        setSelectedDetail(normalized);

        const profile = normalized?.profile || {};
        setLockDraft({
          admin_locked: Boolean(profile.admin_locked),
          locked_fields:
            profile.locked_fields && typeof profile.locked_fields === "object"
              ? profile.locked_fields
              : {}
        });

        setEditDraft({
          campaign_website: profile?.campaign_website || selectedCandidate?.website || "",
          official_website: profile?.official_website || "",
          phone: profile?.phone || "",
          email: profile?.email || "",
          office_address: profile?.office_address || "",
          campaign_address: profile?.campaign_address || "",
          press_contact_name: profile?.press_contact_name || "",
          press_contact_email: profile?.press_contact_email || ""
        });
      } catch (err) {
        if (!active) return;

        const selectedCandidate =
          data.results.find((item) => String(item.id) === String(selectedCandidateId)) ||
          null;

        setDetailError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load candidate profile"
        );

        setSelectedDetail({
          candidate: selectedCandidate,
          profile: null
        });

        setLockDraft({
          admin_locked: false,
          locked_fields: {}
        });

        setEditDraft({});
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

  const summary = useMemo(() => {
    const items = candidates;
    return {
      total_candidates: Number(data.total || items.length || 0),
      democratic_candidates: items.filter(
        (c) => String(c.party || "").toLowerCase().includes("democratic")
      ).length,
      republican_candidates: items.filter(
        (c) => String(c.party || "").toLowerCase().includes("republican")
      ).length,
      other_candidates: items.filter((c) => {
        const p = String(c.party || "").toLowerCase();
        return !p.includes("democratic") && !p.includes("republican");
      }).length
    };
  }, [candidates, data.total]);

  const detailCandidate = selectedDetail?.candidate || null;
  const profile = selectedDetail?.profile || {};
  const selectedName = normalizeCandidateName(detailCandidate);
  const scrapedPageCount = Array.isArray(profile?.scraped_pages)
    ? profile.scraped_pages.length
    : 0;
  const health = getProfileHealth(profile, detailCandidate);

  async function reloadListAndDetail() {
    const params = new URLSearchParams();
    params.set("q", filters.q || "");
    params.set("state", filters.state || "");
    params.set("office", filters.office || "");
    params.set("party", filters.party || "");
    params.set("page", "1");
    params.set("limit", "24");

    const response = await api.get(`/candidates?${params.toString()}`, {
      timeout: 10000
    });

    const payload = response?.data || { total: 0, results: [] };
    const results = Array.isArray(payload.results) ? payload.results : [];
    const total = Number(payload.total || results.length || 0);

    setData({ total, results });

    if (selectedCandidateId) {
      const detailResponse = await api.get(`/candidates/${selectedCandidateId}`, {
        timeout: 10000
      });

      const selectedCandidate =
        results.find((item) => String(item.id) === String(selectedCandidateId)) ||
        detailCandidate ||
        null;

      const normalized = normalizeDetailPayload(detailResponse?.data, selectedCandidate);
      setSelectedDetail(normalized);

      const updatedProfile = normalized?.profile || {};
      setLockDraft({
        admin_locked: Boolean(updatedProfile.admin_locked),
        locked_fields:
          updatedProfile.locked_fields && typeof updatedProfile.locked_fields === "object"
            ? updatedProfile.locked_fields
            : {}
      });

      setEditDraft({
        campaign_website: updatedProfile?.campaign_website || selectedCandidate?.website || "",
        official_website: updatedProfile?.official_website || "",
        phone: updatedProfile?.phone || "",
        email: updatedProfile?.email || "",
        office_address: updatedProfile?.office_address || "",
        campaign_address: updatedProfile?.campaign_address || "",
        press_contact_name: updatedProfile?.press_contact_name || "",
        press_contact_email: updatedProfile?.press_contact_email || ""
      });
    }
  }

  async function handleRefreshProfile() {
    if (!selectedCandidateId) return;

    try {
      setRefreshingProfile(true);
      setDetailError("");
      setLockMessage("");
      setProfileMessage("");

      const response = await api.post(
        `/candidates/${selectedCandidateId}/refresh-profile`,
        {},
        { timeout: 45000 }
      );

      const payload = response?.data || {};
      const nextProfile = payload.profile || null;

      setSelectedDetail({
        candidate: payload.candidate || detailCandidate || null,
        profile: nextProfile
      });

      setLockDraft({
        admin_locked: Boolean(nextProfile?.admin_locked),
        locked_fields:
          nextProfile?.locked_fields && typeof nextProfile.locked_fields === "object"
            ? nextProfile.locked_fields
            : {}
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

      setEditingOverview(false);
      setEditingContact(false);
      setProfileMessage("Profile refreshed.");
    } catch (err) {
      setDetailError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to refresh candidate profile"
      );
    } finally {
      setRefreshingProfile(false);
    }
  }

  async function handleRefreshAllProfiles() {
    try {
      setRefreshingAll(true);
      setListError("");

      await api.post(
        "/candidates/refresh-profiles",
        { limit: 100 },
        { timeout: 90000 }
      );

      await reloadListAndDetail();
    } catch (err) {
      setListError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to refresh live candidate feeds"
      );
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

      const response = await api.patch(
        `/candidates/${selectedCandidateId}/profile-locks`,
        {
          admin_locked: lockDraft.admin_locked,
          locked_fields: lockDraft.locked_fields
        },
        { timeout: 15000 }
      );

      const nextProfile = response?.data?.profile || null;
      setSelectedDetail((prev) => ({
        candidate: prev.candidate,
        profile: nextProfile
      }));

      setLockDraft({
        admin_locked: Boolean(nextProfile?.admin_locked),
        locked_fields:
          nextProfile?.locked_fields && typeof nextProfile.locked_fields === "object"
            ? nextProfile.locked_fields
            : {}
      });

      setLockMessage("Lock settings saved.");
    } catch (err) {
      setDetailError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to save profile locks"
      );
    } finally {
      setSavingLocks(false);
    }
  }

  function resetOverviewDraft() {
    setEditDraft((prev) => ({
      ...prev,
      campaign_website: profile?.campaign_website || detailCandidate?.website || "",
      official_website: profile?.official_website || "",
      phone: profile?.phone || "",
      email: profile?.email || ""
    }));
  }

  function resetContactDraft() {
    setEditDraft((prev) => ({
      ...prev,
      office_address: profile?.office_address || "",
      campaign_address: profile?.campaign_address || "",
      press_contact_name: profile?.press_contact_name || "",
      press_contact_email: profile?.press_contact_email || ""
    }));
  }

  async function handleSaveProfile(fields) {
    if (!selectedCandidateId) return;

    try {
      setSavingProfile(true);
      setDetailError("");
      setProfileMessage("");

      const body = {
        lock_edited_fields: lockEditedFieldsOnSave
      };

      fields.forEach((field) => {
        body[field] = editDraft[field] ?? "";
      });

      const response = await api.patch(
        `/candidates/${selectedCandidateId}/profile`,
        body,
        { timeout: 15000 }
      );

      const payload = response?.data || {};
      const nextProfile = payload.profile || null;

      setSelectedDetail({
        candidate: payload.candidate || detailCandidate || null,
        profile: nextProfile
      });

      setLockDraft({
        admin_locked: Boolean(nextProfile?.admin_locked),
        locked_fields:
          nextProfile?.locked_fields && typeof nextProfile.locked_fields === "object"
            ? nextProfile.locked_fields
            : {}
      });

      setEditDraft((prev) => ({
        ...prev,
        campaign_website: nextProfile?.campaign_website || payload?.candidate?.website || "",
        official_website: nextProfile?.official_website || "",
        phone: nextProfile?.phone || "",
        email: nextProfile?.email || "",
        office_address: nextProfile?.office_address || "",
        campaign_address: nextProfile?.campaign_address || "",
        press_contact_name: nextProfile?.press_contact_name || "",
        press_contact_email: nextProfile?.press_contact_email || ""
      }));

      setProfileMessage(
        lockEditedFieldsOnSave
          ? "Profile changes saved and edited fields locked."
          : "Profile changes saved."
      );
    } catch (err) {
      setDetailError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to save profile changes"
      );
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <PageShell
      eyebrow="Candidate Directory"
      title="Track candidates with live profiles and campaign enrichment."
      description="Search live candidate records and manage campaign contact intelligence, discovery confidence, and protected fields."
      demo={demoMode}
      demoText="Demo candidate data is active."
    >
      {listError ? (
        <div
          className="vs-banner"
          style={{
            borderColor: "#fecaca",
            background: "#fef2f2",
            color: "#b91c1c"
          }}
        >
          {listError}
        </div>
      ) : null}

      <div className="vs-grid-4">
        <StatCard label="Visible Candidates" value={summary.total_candidates || 0} subtext="Current filtered records" />
        <StatCard label="Democratic" value={summary.democratic_candidates || 0} subtext="Directory count" />
        <StatCard label="Republican" value={summary.republican_candidates || 0} subtext="Directory count" />
        <StatCard label="Other" value={summary.other_candidates || 0} subtext="Independent and other parties" />
      </div>

      <SectionCard
        title="Candidate Filters"
        subtitle="Search and narrow candidate records by state, office, and party."
      >
        <div className="vs-grid-4">
          <input
            className="vs-input"
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
            placeholder="Search candidates..."
          />

          <select
            className="vs-input"
            value={filters.state}
            onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))}
          >
            <option value="">All states</option>
            {states.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.office}
            onChange={(e) => setFilters((prev) => ({ ...prev, office: e.target.value }))}
          >
            <option value="">All offices</option>
            {offices.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.party}
            onChange={(e) => setFilters((prev) => ({ ...prev, party: e.target.value }))}
          >
            <option value="">All parties</option>
            {parties.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>

        <div
          className="vs-inline-actions"
          style={{ marginTop: "1rem", display: "flex", gap: "10px", flexWrap: "wrap" }}
        >
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() => setFilters({ q: "", state: "", office: "", party: "" })}
          >
            Clear Filters
          </button>

          <button
            type="button"
            className="vs-button"
            onClick={handleRefreshAllProfiles}
            disabled={refreshingAll}
          >
            {refreshingAll ? "Refreshing Live Feed..." : "Refresh Live Feed"}
          </button>
        </div>
      </SectionCard>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(360px, 0.95fr) minmax(0, 1.25fr)",
          gap: "16px",
          alignItems: "start"
        }}
      >
        <SectionCard
          title="Candidate Directory"
          subtitle="Live candidate records across states and offices."
          right={<Badge tone="accent">{candidates.length} loaded</Badge>}
        >
          <div className="vs-stack">
            {loadingList ? (
              <EmptyState text="Loading candidates..." />
            ) : !candidates.length ? (
              <EmptyState text="No candidates found for the current filters." />
            ) : (
              candidates.map((candidate) => (
                <CandidateListRow
                  key={candidate.id || normalizeCandidateName(candidate)}
                  candidate={candidate}
                  isActive={String(selectedCandidateId) === String(candidate.id)}
                  onSelect={(item) => setSelectedCandidateId(item.id)}
                />
              ))
            )}
          </div>
        </SectionCard>

        <div className="vs-stack">
          <SectionCard
            title={detailCandidate ? selectedName : "Candidate Profile"}
            subtitle={
              detailCandidate
                ? `${detailCandidate.office || "Office"} • ${detailCandidate.state || "State"}`
                : "Select a candidate to view profile details."
            }
            right={
              detailCandidate ? (
                <div
                  className="vs-chip-row"
                  style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}
                >
                  <Badge tone={getPartyTone(detailCandidate.party)}>
                    {detailCandidate.party || "Unknown"}
                  </Badge>
                  <Badge tone={detailCandidate.incumbent ? "active" : "default"}>
                    {detailCandidate.incumbent ? "Incumbent" : "Challenger"}
                  </Badge>
                  <Badge tone={getFreshnessTone(profile?.updated_at)}>
                    {profile?.updated_at ? "Live" : "Unenriched"}
                  </Badge>
                  <Badge tone={getConfidenceTone(profile?.contact_confidence)}>
                    {typeof profile?.contact_confidence === "number"
                      ? `Confidence ${formatConfidence(profile.contact_confidence)}`
                      : "Confidence N/A"}
                  </Badge>
                  {profile?.admin_locked ? <Badge tone="warning">Admin Locked</Badge> : null}
                  <button
                    type="button"
                    className="vs-button vs-button-secondary"
                    onClick={handleRefreshProfile}
                    disabled={refreshingProfile}
                  >
                    {refreshingProfile ? "Refreshing..." : "Refresh Profile"}
                  </button>
                </div>
              ) : null
            }
          >
            {loadingDetail ? (
              <EmptyState text="Loading candidate profile..." />
            ) : !detailCandidate ? (
              <EmptyState text="Select a candidate from the directory." />
            ) : (
              <div className="vs-stack">
                {detailError ? (
                  <div
                    className="vs-banner"
                    style={{
                      borderColor: "#fde68a",
                      background: "#fffbeb",
                      color: "#92400e"
                    }}
                  >
                    {detailError}
                  </div>
                ) : null}

                {lockMessage ? (
                  <div
                    className="vs-banner"
                    style={{
                      borderColor: "#bbf7d0",
                      background: "#f0fdf4",
                      color: "#166534"
                    }}
                  >
                    {lockMessage}
                  </div>
                ) : null}

                {profileMessage ? (
                  <div
                    className="vs-banner"
                    style={{
                      borderColor: "#bfdbfe",
                      background: "#eff6ff",
                      color: "#1d4ed8"
                    }}
                  >
                    {profileMessage}
                  </div>
                ) : null}

                <div className="vs-grid-4">
                  <StatCard label="State" value={detailCandidate.state || "N/A"} subtext="Candidate state" />
                  <StatCard label="Office" value={detailCandidate.office || "N/A"} subtext="Office sought" />
                  <StatCard label="Status" value={detailCandidate.status || "active"} subtext="Campaign status" />
                  <StatCard label="Election" value={detailCandidate.election_name || "N/A"} subtext="Election record" />
                </div>

                <SectionCard
                  title="Profile Health"
                  subtitle="Quick readiness check for premium contact intelligence."
                  right={
                    <Badge tone={health.completed >= 4 ? "active" : "warning"}>
                      {health.completed}/{health.total} signals
                    </Badge>
                  }
                >
                  <div className="vs-grid-3">
                    <MetricChip label="Website" active={health.hasCampaignWebsite || health.hasOfficialWebsite} />
                    <MetricChip label="Primary Email" active={health.hasEmail} />
                    <MetricChip label="Press Email" active={health.hasPressEmail} />
                    <MetricChip label="Phone" active={health.hasPhone} />
                    <MetricChip label="Address" active={health.hasAddress} />
                    <MetricChip label="Staff" active={health.hasStaff} />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Overview"
                  subtitle="Core candidate and campaign profile fields."
                  right={
                    editingOverview ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="vs-button vs-button-secondary"
                          onClick={() => {
                            resetOverviewDraft();
                            setEditingOverview(false);
                          }}
                          disabled={savingProfile}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="vs-button"
                          onClick={() => handleSaveProfile(OVERVIEW_FIELDS.map((f) => f.key))}
                          disabled={savingProfile}
                        >
                          {savingProfile ? "Saving..." : "Save Overview"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="vs-button vs-button-secondary"
                        onClick={() => setEditingOverview(true)}
                      >
                        Edit Overview
                      </button>
                    )
                  }
                >
                  <div className="vs-grid-2">
                    {editingOverview
                      ? OVERVIEW_FIELDS.map((field) => (
                          <EditField
                            key={field.key}
                            label={field.label}
                            type={field.type}
                            value={editDraft[field.key] || ""}
                            onChange={(value) =>
                              setEditDraft((prev) => ({ ...prev, [field.key]: value }))
                            }
                          />
                        ))
                      : (
                        <>
                          <DetailField
                            label="Campaign Website"
                            value={profile?.campaign_website || detailCandidate.website || "N/A"}
                            href={safeUrl(profile?.campaign_website || detailCandidate.website || "")}
                          />
                          <DetailField
                            label="Official Website"
                            value={profile?.official_website || "N/A"}
                            href={safeUrl(profile?.official_website || "")}
                          />
                          <DetailField label="Phone" value={profile?.phone || "N/A"} />
                          <DetailField label="Email" value={profile?.email || "N/A"} />
                        </>
                      )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Contact"
                  subtitle="Campaign and office contact details."
                  right={
                    editingContact ? (
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          type="button"
                          className="vs-button vs-button-secondary"
                          onClick={() => {
                            resetContactDraft();
                            setEditingContact(false);
                          }}
                          disabled={savingProfile}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="vs-button"
                          onClick={() => handleSaveProfile(CONTACT_FIELDS.map((f) => f.key))}
                          disabled={savingProfile}
                        >
                          {savingProfile ? "Saving..." : "Save Contact"}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="vs-button vs-button-secondary"
                        onClick={() => setEditingContact(true)}
                      >
                        Edit Contact
                      </button>
                    )
                  }
                >
                  <div className="vs-grid-2">
                    {editingContact
                      ? CONTACT_FIELDS.map((field) => (
                          <EditField
                            key={field.key}
                            label={field.label}
                            type={field.type}
                            value={editDraft[field.key] || ""}
                            onChange={(value) =>
                              setEditDraft((prev) => ({ ...prev, [field.key]: value }))
                            }
                          />
                        ))
                      : (
                        <>
                          <DetailField label="Office Address" value={profile?.office_address || "N/A"} />
                          <DetailField label="Campaign Address" value={profile?.campaign_address || "N/A"} />
                          <DetailField label="Press Contact" value={profile?.press_contact_name || "N/A"} />
                          <DetailField label="Press Contact Email" value={profile?.press_contact_email || "N/A"} />
                        </>
                      )}
                  </div>

                  {(editingOverview || editingContact) ? (
                    <div
                      className="vs-card-muted"
                      style={{
                        marginTop: "12px",
                        padding: "12px 14px",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "12px",
                        alignItems: "center",
                        flexWrap: "wrap"
                      }}
                    >
                      <div style={{ color: "var(--vs-text-muted)", fontSize: "12px" }}>
                        Save edits as manual profile values. Optionally protect edited fields from refresh overwrites.
                      </div>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          color: "var(--vs-text)",
                          fontWeight: 600,
                          fontSize: "13px"
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={lockEditedFieldsOnSave}
                          onChange={(e) => setLockEditedFieldsOnSave(e.target.checked)}
                        />
                        Lock edited fields on save
                      </label>
                    </div>
                  ) : null}
                </SectionCard>

                <SectionCard title="Campaign Team" subtitle="Live-enriched staff and leadership fields.">
                  <div className="vs-grid-2">
                    <DetailField label="Chief of Staff" value={profile?.chief_of_staff_name || "N/A"} />
                    <DetailField label="Campaign Manager" value={profile?.campaign_manager_name || "N/A"} />
                    <DetailField label="Finance Director" value={profile?.finance_director_name || "N/A"} />
                    <DetailField label="Political Director" value={profile?.political_director_name || "N/A"} />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Protection Controls"
                  subtitle="Protect manually curated fields from future live refreshes."
                  right={
                    <button
                      type="button"
                      className="vs-button"
                      onClick={handleSaveLocks}
                      disabled={savingLocks || !detailCandidate}
                    >
                      {savingLocks ? "Saving Locks..." : "Save Lock Settings"}
                    </button>
                  }
                >
                  <div className="vs-stack">
                    <LockToggle
                      label="Lock Entire Profile"
                      checked={Boolean(lockDraft.admin_locked)}
                      onChange={() =>
                        setLockDraft((prev) => ({
                          ...prev,
                          admin_locked: !prev.admin_locked
                        }))
                      }
                      disabled={!detailCandidate}
                    />

                    <div className="vs-grid-2">
                      {LOCKABLE_FIELDS.map((field) => (
                        <LockToggle
                          key={field.key}
                          label={field.label}
                          checked={Boolean(lockDraft.locked_fields?.[field.key])}
                          onChange={() => toggleLockedField(field.key)}
                          disabled={!detailCandidate}
                        />
                      ))}
                    </div>
                  </div>
                </SectionCard>

                <SectionCard title="Profile Metadata" subtitle="Source, confidence, lock state, and crawl footprint.">
                  <div className="vs-grid-2">
                    <DetailField label="Source Label" value={profile?.source_label || "live_candidate_feed"} />
                    <DetailField label="Updated At" value={formatDateTime(profile?.updated_at)} />
                    <DetailField label="Admin Locked" value={profile?.admin_locked ? "Yes" : "No"} />
                    <DetailField
                      label="Contact Confidence"
                      value={
                        typeof profile?.contact_confidence === "number"
                          ? formatConfidence(profile.contact_confidence)
                          : "N/A"
                      }
                    />
                    <DetailField
                      label="Scraped Pages"
                      value={String(scrapedPageCount || 0)}
                    />
                    <DetailField
                      label="Locked Fields"
                      value={
                        profile?.locked_fields
                          ? JSON.stringify(profile.locked_fields)
                          : "{}"
                      }
                      monospace
                    />
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
