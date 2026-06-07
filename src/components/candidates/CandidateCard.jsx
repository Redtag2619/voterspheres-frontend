import { Link } from "react-router-dom";
import { getPartyBadgeClass } from "../../lib/partyColors";

function getContactStatus(candidate) {
  const contact = candidate?.contact || {};
  const hasCore =
    contact.campaign_email ||
    contact.press_email ||
    contact.phone ||
    contact.address?.line1;

  if (contact.verified) {
    return { label: "Verified", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
  }

  if (hasCore) {
    return { label: "Partial", tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
  }

  return { label: "Missing", tone: "bg-slate-500/15 text-slate-300 border-slate-500/30" };
}

export default function CandidateCard({ candidate }) {
  const status = getContactStatus(candidate);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <div className="flex items-start gap-4">
        <img
          src={
            candidate.photo_url ||
            "https://via.placeholder.com/96x96.png?text=VS"
          }
          alt={candidate.full_name}
          className="h-20 w-20 rounded-2xl object-cover border border-white/10 bg-slate-800"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              {candidate.full_name}
            </h3>
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${status.tone}`}
            >
              {status.label}
            </span>
          </div>

          <p className="mt-1 text-sm text-slate-300">
            {candidate.office || "Office TBD"}
            {candidate.state ? ` • ${candidate.state}` : ""}
            {candidate.district ? ` • ${candidate.district}` : ""}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {candidate.party ? (
              <span className={getPartyBadgeClass(candidate.party)}>
                {candidate.party}
              </span>
            ) : null}
            {candidate.election_year && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                {candidate.election_year}
              </span>
            )}
            {candidate.election_type && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 capitalize">
                {candidate.election_type}
              </span>
            )}
            {candidate.incumbent ? (
              <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs text-blue-300">
                Incumbent
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {candidate.bio ? (
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-300">
          {candidate.bio}
        </p>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-400">
          No biography has been added yet.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          to={`/candidates/${candidate.slug}`}
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:opacity-90"
        >
          View Profile
        </Link>

        {candidate.website ? (
          <a
            href={candidate.website}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Campaign Site
          </a>
        ) : null}
      </div>
    </div>
  );
}