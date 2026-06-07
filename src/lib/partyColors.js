export const PARTY_COLORS = {
  D: "#2563eb",
  DEM: "#2563eb",
  DEMOCRAT: "#2563eb",
  DEMOCRATIC: "#2563eb",

  R: "#dc2626",
  REP: "#dc2626",
  GOP: "#dc2626",
  REPUBLICAN: "#dc2626",

  I: "#f59e0b",
  IND: "#f59e0b",
  INDEPENDENT: "#f59e0b",

  OTHER: "#94a3b8",
  UNKNOWN: "#94a3b8",
};

export function normalizeParty(party = "") {
  return String(party || "")
    .trim()
    .toUpperCase();
}

export function getPartyColor(party = "") {
  return PARTY_COLORS[normalizeParty(party)] || PARTY_COLORS.UNKNOWN;
}

export function getPartyClass(party = "") {
  const key = normalizeParty(party);

  if (["D", "DEM", "DEMOCRAT", "DEMOCRATIC"].includes(key)) {
    return "party-democrat";
  }

  if (["R", "REP", "GOP", "REPUBLICAN"].includes(key)) {
    return "party-republican";
  }

  if (["I", "IND", "INDEPENDENT"].includes(key)) {
    return "party-independent";
  }

  return "party-other";
}

export function getPartyBadgeClass(party = "") {
  return `party-badge ${getPartyClass(party)}`;
}