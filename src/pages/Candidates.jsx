import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";
import ResponsiveRow from "../components/ui/ResponsiveRow";

const fallbackData = {
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
      status: "active"
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
      status: "active"
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
      status: "watch"
    }
  ],
  summary: {
    total_candidates: 3,
    democratic_candidates: 1,
    republican_candidates: 1,
    other_candidates: 1
  }
};

function CandidateRow({ candidate }) {
  const partyTone =
    String(candidate.party || "").toLowerCase() === "democratic"
      ? "accent"
      : String(candidate.party || "").toLowerCase() === "republican"
      ? "danger"
      : "default";

  return (
    <ResponsiveRow
      title={candidate.full_name || `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() || "Candidate"}
      subtitle={`${candidate.office || "Office"} • ${candidate.state || "State"}`}
      meta={[
        { label: "Party", value: candidate.party || "N/A" },
        { label: "Incumbent", value: candidate.incumbent ? "Yes" : "No" },
        { label: "Status", value: candidate.status || "active" },
        { label: "Website", value: candidate.website || "N/A" }
      ]}
      right={
        <div className="vs-chip-row">
          <Badge tone={partyTone}>{candidate.party || "Unknown"}</Badge>
          <Badge tone={candidate.incumbent ? "active" : "default"}>
            {candidate.incumbent ? "Incumbent" : "Challenger"}
          </Badge>
        </div>
      }
    />
  );
}

export default function Candidates() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(fallbackData);
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

    async function loadCandidates() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        params.set("q", filters.q || "");
        params.set("state", filters.state || "");
        params.set("office", filters.office || "");
        params.set("party", filters.party || "");
        params.set("page", "1");
        params.set("limit", "12");

        const response = await api.get(`/candidates?${params.toString()}`, {
          timeout: 6000
        });

        if (!active) return;

        const payload = response?.data || fallbackData;
        const results = payload.results || fallbackData.results;

        const summary = payload.summary || {
          total_candidates: results.length,
          democratic_candidates: results.filter(
            (c) => String(c.party || "").toLowerCase() === "democratic"
          ).length,
          republican_candidates: results.filter(
            (c) => String(c.party || "").toLowerCase() === "republican"
          ).length,
          other_candidates: results.filter((c) => {
            const p = String(c.party || "").toLowerCase();
            return p !== "democratic" && p !== "republican";
          }).length
        };

        setData({ results, summary });
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load candidates"
        );
        setData(fallbackData);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCandidates();

    return () => {
      active = false;
    };
  }, [filters]);

  const candidates = useMemo(() => data.results || [], [data.results]);
  const summary = data.summary || fallbackData.summary;

  return (
    <PageShell
      eyebrow="Candidate Directory"
      title="Track candidates across the map."
      description="Search candidates by state, office, and party using the same professional VoterSpheres layout as the rest of the platform."
      demo={demoMode}
      demoText="Demo candidate data is active. Candidate records are preloaded for presentation and testing."
    >
      {error ? (
        <div
          className="vs-banner"
          style={{
            borderColor: "#fecaca",
            background: "#fef2f2",
            color: "#b91c1c"
          }}
        >
          {error}
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
              setFilters((prev) => ({ ...prev, q: e.target.value }))
            }
            placeholder="Search candidates..."
          />

          <input
            className="vs-input"
            value={filters.state}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, state: e.target.value }))
            }
            placeholder="Filter by state"
          />

          <input
            className="vs-input"
            value={filters.office}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, office: e.target.value }))
            }
            placeholder="Filter by office"
          />

          <input
            className="vs-input"
            value={filters.party}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, party: e.target.value }))
            }
            placeholder="Filter by party"
          />
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

      <SectionCard
        title="Candidate Directory"
        subtitle="Candidate records across states and offices."
        right={<Badge tone="accent">{candidates.length} loaded</Badge>}
      >
        <div className="vs-stack">
          {loading ? (
            <EmptyState text="Loading candidates..." />
          ) : !candidates.length ? (
            <EmptyState text="No candidates found for the current filters." />
          ) : (
            candidates.map((candidate) => (
              <CandidateRow
                key={candidate.id || candidate.full_name}
                candidate={candidate}
              />
            ))
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
