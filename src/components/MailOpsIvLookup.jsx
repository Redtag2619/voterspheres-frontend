import { useEffect, useRef, useState } from "react";
import { http } from "../services/api";
import SectionCard from "./ui/SectionCard";
import { parseScannedImb } from "../lib/mailOpsImbScan.js";

const API_OPTIONS = { skipWorkspaceInjection: true, timeout: 25000 };
const SAFE_ERRORS = new Set([
  "INVALID_IV_BARCODE", "IV_MID_MISMATCH", "INVALID_IV_CREDENTIALS",
  "IV_SIGN_IN_REJECTED", "IV_ACCESS_DENIED", "IV_RATE_LIMITED",
  "IV_AUTH_UNAVAILABLE", "IV_TRACKING_UNAVAILABLE", "IV_UNEXPECTED_RESPONSE",
  "IV_NOT_CONFIGURED",
]);
const EVENT_LABELS = {
  A: "Actual scan",
  ACTUAL: "Actual scan",
  "ASSUMED ACTUAL": "Assumed event",
  "ASSUMED LOGICAL": "Assumed logical event",
  LOGICAL: "Logical event",
};

export default function MailOpsIvLookup() {
  const [availability, setAvailability] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(undefined);
  const activeLookup = useRef(null);
  const midField = useRef(null);
  const barcodeField = useRef(null);
  const awaitingScan = useRef(false);
  const [scanMessage, setScanMessage] = useState("");

  function startScan() {
    const field = barcodeField.current;
    if (!field) return;
    awaitingScan.current = true;
    setScanMessage("Scan now. Use a scanner that supports USPS Intelligent Mail and outputs digits.");
    field.focus();
    field.select();
  }

  function finishScan() {
    if (!awaitingScan.current) return;
    awaitingScan.current = false;
    const field = barcodeField.current;
    const scan = parseScannedImb(field?.value);
    if (!scan || !midField.current) {
      setScanMessage("No valid numeric IMb received. Check the scanner setting or enter the barcode manually.");
      return;
    }
    field.value = scan.imb;
    midField.current.value = scan.mid;
    setScanMessage("Barcode and Mailer ID filled in. Review them, then select Look up mailpiece.");
  }

  function barcodeKey(event) {
    if (event.key === "Enter") {
      // Keyboard-wedge scanners commonly send Enter after the decoded value.
      // Do not turn that suffix into a USPS lookup.
      event.preventDefault();
      finishScan();
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    http.get("/mailops/iv/status", { ...API_OPTIONS, signal: controller.signal })
      .then(({ data }) => {
        if (!controller.signal.aborted) setAvailability(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAvailability({ enabled: false, unavailable: true });
      });
    return () => {
      controller.abort();
      activeLookup.current?.abort();
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (!availability?.enabled || activeLookup.current) return;
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form));
    form.elements.namedItem("password").value = "";
    const controller = new AbortController();
    activeLookup.current = controller;
    setBusy(true);
    setError("");
    setResult(undefined);
    try {
      const request = http.post("/mailops/iv/lookup", payload, {
        ...API_OPTIONS, signal: controller.signal,
      });
      const { data } = await request;
      if (data?.ok !== true) throw new Error("Invalid lookup response");
      if (!controller.signal.aborted) setResult(data.piece);
    } catch (err) {
      const data = err?.response?.data;
      if (!controller.signal.aborted) {
        setError(SAFE_ERRORS.has(data?.error)
          ? data.message
          : "The lookup could not be completed. Check your VoterSpheres session and try again.");
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
      if (activeLookup.current === controller) activeLookup.current = null;
    }
  }

  if (availability?.hidden) return null;

  return (
    <SectionCard
      title="USPS Intelligent Mail tracking"
      subtitle="Look up one mailpiece using your authorized USPS Informed Visibility account."
    >
      {!availability && <p role="status">Checking USPS tracking availability…</p>}
      {availability?.enabled === false && (
        <p role="status">{availability.unavailable
          ? "USPS tracking is unavailable from this session."
          : "USPS tracking has not been enabled on this deployment."}</p>
      )}
      {availability?.enabled && (
        <>
          {availability.test_mode && <p role="status">USPS test environment. Use your USPS test account and test barcode.</p>}
          <p>
            Use the Mailer ID embedded in the barcode and your own USPS Business Customer Gateway
            account with IV-MTR access. VoterSpheres uses your credentials for this lookup only
            and does not save them.
          </p>
          <form onSubmit={submit}>
            <fieldset disabled={busy} style={{ display: "grid", gap: 12, maxWidth: "36rem" }}>
              <legend>Look up an IMb</legend>
              <button className="vs-button" type="button" onClick={startScan}>Scan barcode with a scanner</button>
              <p role="status">{scanMessage}</p>
              <label>Mailer ID (MID)
                <input className="vs-input" name="mid" ref={midField} inputMode="numeric" pattern="[0-9]{6}|[0-9]{9}" maxLength={9} required />
              </label>
              <label>Full numeric Intelligent Mail barcode (IMb)
                <input className="vs-input" name="imb" ref={barcodeField} inputMode="numeric" pattern="[0-9]{20}|[0-9]{25}|[0-9]{29}|[0-9]{31}" onKeyDown={barcodeKey} onBlur={finishScan} required />
              </label>
              <label>USPS Business Customer Gateway username
                <input className="vs-input" name="username" autoComplete="off" maxLength={256} required />
              </label>
              <label>USPS Business Customer Gateway password
                <input className="vs-input" name="password" type="password" autoComplete="off" maxLength={512} required />
              </label>
              <button className="vs-button" type="submit">{busy ? "Checking USPS…" : "Look up mailpiece"}</button>
            </fieldset>
          </form>
        </>
      )}
      {busy && <p role="status">Waiting for USPS.</p>}
      {error && <p role="alert">{error}</p>}
      {result === null && <p role="status">USPS returned no matching mailpiece for this barcode.</p>}
      {result && (
        <div aria-live="polite">
          <h3>USPS scan history</h3>
          <p>{[result.mail_class, result.mail_shape].filter(Boolean).join(" · ")}</p>
          {result.estimated_delivery_date && <p>USPS estimated delivery: {result.estimated_delivery_date}</p>}
          <p>USPS events can lag processing. Assumed and logical events are not physical scans of this mailpiece.</p>
          {!result.scans.length && <p>USPS found the mailpiece but has not returned any scans.</p>}
          {result.total_scans > result.scans.length && <p>Showing the latest {result.scans.length} of {result.total_scans} events.</p>}
          <ol>
            {result.scans.map((scan, index) => (
              <li key={`${scan.time}-${scan.code}-${index}`}>
                <strong>{EVENT_LABELS[scan.type?.toUpperCase()] ?? "USPS handling event"}</strong>
                {" · "}{scan.time}{" · Event "}{scan.code}
                {scan.phase && <>{" · "}{scan.phase}</>}
                {[scan.facility, scan.city, scan.state].filter(Boolean).map(value => ` · ${value}`).join("")}
              </li>
            ))}
          </ol>
        </div>
      )}
    </SectionCard>
  );
}
