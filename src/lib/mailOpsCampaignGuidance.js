export const MANIFEST_TEMPLATE = "imb,sequence\r\n";
export function campaignLabel(campaign, campaigns = []) {
  const id=String(campaign.id ?? "");
  const short=id.slice(0,8);
  const collision=campaigns.some(c=>String(c.id)!==id && String(c.id).slice(0,8)===short);
  const date=/^\d{4}-\d{2}-\d{2}$/.test(campaign.mailing_date ?? "") ? campaign.mailing_date : "Date unavailable";
  return `${campaign.name} · ${date} · ${campaign.source_mode === "cat" ? "Test" : campaign.source_mode === "production" ? "Production" : "Mode unavailable"} · Ref ${collision ? id : short || "unavailable"}`;
}
const CSV_ERRORS = {
  UNSUPPORTED_CSV_HEADERS: 'Upload a tracking manifest with the header "imb" and optional "sequence". Remove address, recipient-name, MID and other columns. Headers are case-sensitive.',
  EMPTY_CSV: "The CSV has no mailpieces. Add at least one real full numeric IMb beneath the template header, then preview again.",
  INVALID_OR_OVERSIZED_CSV: "Choose a nonempty UTF-8 CSV no larger than 1 MB, with no more than 5,000 mailpieces.",
  CSV_ROW_LIMIT: "This import exceeds 5,000 mailpieces. Split it into smaller manifests before receiving the first feed.",
  DUPLICATE_CSV_HEADER: "Each CSV column needs a unique header. Use imb and, optionally, sequence once each.",
  CSV_COLUMN_MISMATCH: "Some CSV rows have a different number of columns than the header. Check commas and quoted fields, then preview again.",
  MALFORMED_CSV: "The CSV contains malformed quoting. Export it again as a CSV with correctly quoted fields.",
  INVALID_IMB: "Use the full numeric IMb as text: 20, 25, 29 or 31 digits. Preserve leading zeros; do not use a MID alone, barcode symbols or scientific notation.",
  DUPLICATE_MANIFEST_IMB: "The same IMb appears more than once in this file. Remove duplicate rows, then preview again.",
  INVALID_SEQUENCE: "Sequence labels must be no longer than 80 characters. Keep the full IMb in its own column.",
  MANIFEST_SEQUENCE_CONFLICT: "An existing barcode has a different sequence label. Keep its original label or review the selected mailing before continuing.",
  MANIFEST_FROZEN_AFTER_FEED: "This mailing already received a feed, so its manifest is locked. Select the correct mailing or create a separate mailing for a new manifest.",
  MANIFEST_PLAN_CHANGED: "The manifest changed after preview. Preview the current file again before applying it.",
  MANIFEST_REQUIRED: "Import and apply a barcode manifest before creating a relay token.",
};
export function campaignErrorMessage(err) {
  const code=err?.response?.data?.error;
  if(Object.hasOwn(CSV_ERRORS,code)) return CSV_ERRORS[code];
  if(err?.response?.status===401) return "Your session has expired. Sign in again before continuing.";
  if(err?.response?.status===403) return "Your account does not have permission for this mailing action.";
  return "Campaign tracking could not complete this operation. Try again or ask your administrator to review access and service availability. No successful import was assumed.";
}
