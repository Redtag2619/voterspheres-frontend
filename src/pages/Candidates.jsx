import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

const fallbackListData = {
  total: 3,
  results: [
    {
      id: 1,
      full_name: "Jane Thompson",
      first_name: "Jane",
      last_name: "Thompson",
      state: "Georgia",
      office: "Senate",
      party: "Democratic",
      incumbent: false,
      website: "https://example.com",
      status: "active",
      election_name: "2026 Georgia Senate"
    },
    {
      id: 2,
      full_name: "Michael Carter",
      first_name: "Michael",
      last_name: "Carter",
      state: "Pennsylvania",
      office: "Governor",
      party: "Republican",
      incumbent: true,
      website: "https://example.com",
      status: "active",
      election_name: "2026 Pennsylvania Governor"
    },
    {
      id: 3,
      full_name: "Alicia Brooks",
      first_name: "Alicia",
      last_name: "Brooks",
      state: "Arizona",
      office: "Senate",
      party: "Independent",
      incumbent: false,
      website: "https://example.com",
      status: "watch",
      election_name: "2026 Arizona Senate"
    }
  ]
};

const fallbackDetail = {
  candidate: {
    id: 1,
    full_name: "Jane Thompson",
    first_name: "Jane",
    last_name: "Thompson",
    state: "Georgia",
    office: "Senate",
    party: "Democratic",
    incumbent: false,
    website: "https://example.com",
    status: "active",
    election_name: "2026 Georgia Senate"
  },
  profile: {
    campaign_website: "https://example.com",
    official_website: "",
    office_address: "101 Capitol Ave, Atlanta, GA",
    campaign_address: "450 Peachtree St NE, Atlanta, GA",
    phone: "(404) 555-0142",
    email: "info@example.com",
    chief_of_staff_name: "Marcus Hill",
    campaign_manager_name: "Ava Reynolds",
    finance_director_name: "Daniel Price",
    political_director_name: "Sonia Ellis",
    press_contact_name: "Taylor Brooks",
    press_contact_email: "press@example.com",
    source_label: "manual_enrichment",
    updated_at: null
  }
};

function normalizeCandidateName(candidate) {
  return (
    candidate?.full_name ||
    [candidate?.first_name, candidate?.last_name].filter(Boolean).join(" ") ||
    "Candidate"
  );
}

function getPartyTone(party) {
  const value = String(party || "").toLowerCase();
  if (value === "democratic") return "accent";
  if (value === "republican") return "danger";
  return "default";
}

function getStatusTone(status) {
  const value = String(status || "").toLowerCase();
  if (["active", "live", "confirmed"].includes(value)) return "active";
  if (["watch", "pending"].includes(value)) return "warning";
  if (["inactive", "ended", "closed"].includes(value)) return "default";
  return "default";
}

function safeUrl(value) {
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
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

function normalizeDetailPayload(payload, selectedCandidate, fallbackProfile) {
  if (!payload || typeof payload !== "object") {
    return {
      candidate: selectedCandidate || null,
      profile: fallbackProfile || {}
    };
  }

  if (payload.candidate || payload.profile) {
    return {
      candidate: payload.candidate || selectedCandidate || null,
      profile: payload.profile || fallbackProfile || {}
    };
  }

  return {
    candidate: payload,
    profile: payload.profile || fallbackProfile || {}
  };
}

function DetailField({ label, value, href }) {
  return (
    <div
      className="vs-card-muted"
      style={{
        padding: "12px 14px",
        display: "grid",
        gap: "6px"
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
            wordBreak: "break-word"
          }}
        >
          {value || "N/A"}
        </a>
      ) : (
        <div
          style={{
            color: "var(--vs-text)",
            fontWeight: 700,
            wordBreak: "break-word"
          }}
        >
          {value || "N/A"}
        </div>
      )}
    </div>
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
        padding: "14px 16px",
        textAlign: "left",
        display: "grid",
        gap: "10px",
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
        <div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 800,
              color: "var(--vs-text)"
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
        <div
          style={{
            fontSize: "12px",
            color: "var(--vs-text-muted)"
          }}
        >
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
  const [listError, setListError] = useState("");
  const [detailError, setDetailError] = useState("");
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
          timeout: 6000
        });

        if (!active) return;

        const payload = response?.data || fallbackListData;
        const results = Array.isArray(payload.results) ? payload.results : [];
        const total = Number(payload.total || results.length || 0);

        setData({
          total,
          results
        });

        if (results.length) {
          setSelectedCandidateId((prev) => {
            const exists = results.some((item) => String(item.id) === String(prev));
            return exists ? prev : results[0].id;
          });
        } else {
          setSelectedCandidateId(null);
          setSelectedDetail({
            candidate: null,
            profile: null
          });
        }
      } catch (err) {
        if (!active) return;

        setListError(
          err?.response?.data?.error || err?.message || "Failed to load candidates"
        );

        setData(fallbackListData);
        setSelectedCandidateId(fallbackListData.results[0]?.id || null);
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

        const response = await api.get(`/candidates/${selectedCandidateId}`, {
          timeout: 6000
        });

        if (!active) return;

        const selectedCandidate =
          data.results.find((item) => String(item.id) === String(selectedCandidateId)) ||
          fallbackListData.results[0] ||
          null;

        const normalized = normalizeDetailPayload(
          response?.data,
          selectedCandidate,
          fallbackDetail.profile
        );

        setSelectedDetail(normalized);
      } catch (err) {
        if (!active) return;

        setDetailError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load candidate profile"
        );

        const fallbackCandidate =
          data.results.find((item) => String(item.id) === String(selectedCandidateId)) ||
          fallbackListData.results[0] ||
          null;

        setSelectedDetail({
          candidate: fallbackCandidate,
          profile: fallbackDetail.profile
        });
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
        (c) => String(c.party || "").toLowerCase() === "democratic"
      ).length,
      republican_candidates: items.filter(
        (c) => String(c.party || "").toLowerCase() === "republican"
      ).length,
      other_candidates: items.filter((c) => {
        const p = String(c.party || "").toLowerCase();
        return p !== "democratic" && p !== "republican";
      }).length
    };
  }, [candidates, data.total]);

  const detailCandidate = selectedDetail?.candidate || null;
  const profile = selectedDetail?.profile || {};
  const selectedName = normalizeCandidateName(detailCandidate);

  return (
    <PageShell
      eyebrow="Candidate Directory"
      title="Track candidates with live profiles and campaign enrichment."
      description="Search live candidate records and inspect campaign contact, office contact, and key staff details in a premium two-panel layout."
      demo={demoMode}
      demoText="Demo candidate data is active. Candidate records are preloaded for presentation and testing."
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
        <StatCard
          label="Visible Candidates"
          value={summary.total_candidates || 0}
          subtext="Current filtered records"
        />
        <StatCard
          label="Democratic"
          value={summary.democratic_candidates || 0}
          subtext="Democratic candidates"
        />
        <StatCard
          label="Republican"
          value={summary.republican_candidates || 0}
          subtext="Republican candidates"
        />
        <StatCard
          label="Other"
          value={summary.other_candidates || 0}
          subtext="Independent and other parties"
        />
      </div>

      <SectionCard
        title="Candidate Filters"
        subtitle="Search and narrow candidate records by state, office, and party."
      >
        <div className="vs-grid-4">
          <input
            className="vs-input"
            value={filters.q}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                q: e.target.value
              }))
            }
            placeholder="Search candidates..."
          />

          <select
            className="vs-input"
            value={filters.state}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                state: e.target.value
              }))
            }
          >
            <option value="">All states</option>
            {states.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.office}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                office: e.target.value
              }))
            }
          >
            <option value="">All offices</option>
            {offices.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            className="vs-input"
            value={filters.party}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                party: e.target.value
              }))
            }
          >
            <option value="">All parties</option>
            {parties.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="vs-inline-actions" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="vs-button vs-button-secondary"
            onClick={() =>
              setFilters({
                q: "",
                state: "",
                office: "",
                party: ""
              })
            }
          >
            Clear Filters
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
                <div className="vs-chip-row">
                  <Badge tone={getPartyTone(detailCandidate.party)}>
                    {detailCandidate.party || "Unknown"}
                  </Badge>
                  <Badge tone={detailCandidate.incumbent ? "active" : "default"}>
                    {detailCandidate.incumbent ? "Incumbent" : "Challenger"}
                  </Badge>
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

                <div className="vs-grid-4">
                  <StatCard
                    label="State"
                    value={detailCandidate.state || "N/A"}
                    subtext="Candidate state"
                  />
                  <StatCard
                    label="Office"
                    value={detailCandidate.office || "N/A"}
                    subtext="Office sought"
                  />
                  <StatCard
                    label="Status"
                    value={detailCandidate.status || "active"}
                    subtext="Campaign status"
                  />
                  <StatCard
                    label="Election"
                    value={detailCandidate.election_name || "N/A"}
                    subtext="Election record"
                  />
                </div>

                <SectionCard
                  title="Overview"
                  subtitle="Core candidate and campaign profile fields."
                >
                  <div className="vs-grid-2">
                    <DetailField
                      label="Campaign Website"
                      value={profile.campaign_website || detailCandidate.website || "N/A"}
                      href={safeUrl(profile.campaign_website || detailCandidate.website || "")}
                    />
                    <DetailField
                      label="Official Website"
                      value={profile.official_website || "N/A"}
                      href={safeUrl(profile.official_website || "")}
                    />
                    <DetailField
                      label="Phone"
                      value={profile.phone || "N/A"}
                    />
                    <DetailField
                      label="Email"
                      value={profile.email || "N/A"}
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Contact"
                  subtitle="Campaign and office contact details."
                >
                  <div className="vs-grid-2">
                    <DetailField
                      label="Office Address"
                      value={profile.office_address || "N/A"}
                    />
                    <DetailField
                      label="Campaign Address"
                      value={profile.campaign_address || "N/A"}
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Campaign Team"
                  subtitle="Enrichment-ready staff and leadership fields."
                >
                  <div className="vs-grid-2">
                    <DetailField
                      label="Chief of Staff"
                      value={profile.chief_of_staff_name || "N/A"}
                    />
                    <DetailField
                      label="Campaign Manager"
                      value={profile.campaign_manager_name || "N/A"}
                    />
                    <DetailField
                      label="Finance Director"
                      value={profile.finance_director_name || "N/A"}
                    />
                    <DetailField
                      label="Political Director"
                      value={profile.political_director_name || "N/A"}
                    />
                    <DetailField
                      label="Press Contact"
                      value={profile.press_contact_name || "N/A"}
                    />
                    <DetailField
                      label="Press Contact Email"
                      value={profile.press_contact_email || "N/A"}
                    />
                  </div>
                </SectionCard>

                <SectionCard
                  title="Profile Metadata"
                  subtitle="Source and freshness of enrichment records."
                >
                  <div className="vs-grid-2">
                    <DetailField
                      label="Source Label"
                      value={profile.source_label || "live_candidate_feed"}
                    />
                    <DetailField
                      label="Updated At"
                      value={formatDateTime(profile.updated_at)}
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
