const LABELS = {
  manifest_required: "Manifest required",
  relay_token_disabled: "Relay token disabled",
  awaiting_first_receipt: "Awaiting first feed receipt",
  receipt_time_needs_review: "Receipt timestamp needs review",
  receipt_needs_review: "Feed receipt age needs review",
  recent_receipt: "Recent feed receipt recorded",
};
export default function MailOpsFeedHealth({health}) {
  if (!health) return <p role="status">Feed health is unavailable from this backend version. No healthy status was assumed.</p>;
  const exceptions=health.exceptions;
  return <section aria-label="Feed health and campaign exceptions" style={{minWidth:0}}>
    <h4>Feed health</h4>
    <p role="status">{LABELS[health.status] || "Feed health needs review"}</p>
    <p>Checked: {health.checked_at}. Last successful file receipt: {health.last_received_at || "None recorded"}.</p>
    <p>The {health.review_after_hours}-hour receipt review threshold is an operational reminder, not a USPS delivery standard. File receipts do not establish that the relay is connected now.</p>
    <dl>
      <dt>Accepted file receipts</dt><dd>{health.receipt_count}</dd>
      <dt>Rows in accepted files</dt><dd>{health.input_rows}</dd>
      <dt>New events saved</dt><dd>{health.inserted_events}</dd>
      <dt>Unmatched rows across accepted files</dt><dd>{health.unmatched_rows}</dd>
    </dl>
    <h4>Campaign exceptions</h4>
    <dl>
      <dt>Manifest pieces without any reported event</dt><dd>{exceptions.no_reported_event_pieces}</dd>
      <dt>Manifest pieces without a physical scan</dt><dd>{exceptions.pieces_without_physical_scan}</dd>
      <dt>Unmatched rows in the latest file</dt><dd>{exceptions.latest_file_unmatched_rows}</dd>
    </dl>
    <p>These counts overlap. Unmatched rows are feed rows, not unique mailpieces. Missing events do not prove a delay or non-delivery.</p>
    <p>Rejected files: not reported by the relay; inspect the relay output and receiving folder. Accepted receipts alone cannot identify rejected files.</p>
    <p>Documented acceptance: not collected for this tracked campaign. Estimated arrival: not configured. Composer information is not automatically linked to this campaign.</p>
    <p>Physical scans, logical/assumed events, documented acceptance and estimated arrival remain separate; none is presented as a delivered percentage.</p>
    <h4>Pieces without reported events</h4>
    <p>Up to {exceptions.sample_limit} pieces, ordered by sequence and barcode. This is a sample, not a complete exception export.</p>
    {exceptions.no_event_sample.length ? <ul>{exceptions.no_event_sample.map(piece=><li key={piece.imb} style={{overflowWrap:"anywhere"}}>{piece.sequence || "No sequence label"} — {piece.imb}</li>)}</ul> : <p>No pieces without reported events in this snapshot.</p>}
  </section>;
}
