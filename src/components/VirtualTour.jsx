
import { useEffect, useMemo, useRef, useState } from "react";

import { createPortal } from "react-dom";

import { useLocation, useNavigate } from "react-router-dom";

 

import { nextTourSessionMode } from "../lib/tourSessionMode";
import { getUnifiedTourPages } from "../config/unifiedPlatformTour";
import { collectVisiblePageSegments, sectionNarration, splitNarration, playUnifiedPage } from "../lib/unifiedTourPlayback";

import "./VirtualTour.css";

 

const RAW_API_BASE =
  String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "") ||
  "https://voterspheres-backend-2pap.onrender.com";

const API_ROOT = RAW_API_BASE.replace(/\/api$/i, "");

 

const ROUTE_SETTLE_MS = 850;

const TARGET_TIMEOUT_MS = 8500;

const TARGET_POLL_MS = 125;

const CENTER_SETTLE_MS = 650;

const BETWEEN_STEPS_MS = 650;

 

function sleep(ms) {

  return new Promise((resolve) => window.setTimeout(resolve, ms));

}

 

function normalizeText(value = "", max = 1700) {

  const next = String(value || "").replace(/\s+/g, " ").trim();

  return next.length > max ? `${next.slice(0, max - 1)}…` : next;

}

 

function getTourMode(search = "") {

  const params = new URLSearchParams(search);

  const mode = params.get("tour");

 

  if (mode === "admin") return "admin";

  if (["platform", "public", "demo"].includes(mode)) return "platform";

  return "";

}

 

function removeTourQuery(search = "") {

  const params = new URLSearchParams(search);

  params.delete("tour");

  const query = params.toString();

  return query ? `?${query}` : "";

}

 

function getToken() {

  try {

    return (

      window.localStorage.getItem("token") ||

      window.localStorage.getItem("authToken") ||

      window.localStorage.getItem("vs_token") ||

      ""

    );

  } catch {

    return "";

  }

}

 

function completionKey(mode) {

  return `vs_${mode}_tour_completed`;

}

 

function storeCompletion(mode) {

  try {

    window.localStorage.setItem(completionKey(mode), new Date().toISOString());

  } catch {

    // Ignore storage failures.

  }

}

 

async function fetchMarinSpeech(text, signal) {
  const token = getToken();

 

  const response = await fetch(`${API_ROOT}/api/tour/voice`, {

    method: "POST",
    signal,

    headers: {

      "Content-Type": "application/json",

      ...(token ? { Authorization: `Bearer ${token}` } : {}),

    },

    body: JSON.stringify({

      text: normalizeText(text),

      voice: "marin",
      model: "gpt-4o-mini-tts",

      style:

        "Speak as a warm, natural, confident female enterprise product specialist. Use lifelike conversational American pacing, subtle emotional warmth, natural sentence rhythm, and short pauses between ideas. Sound polished and human, never robotic, rushed, theatrical, or excessively enthusiastic.",

    }),

  });

 

  if (!response.ok) {

    const detail = await response.text().catch(() => "");

    throw new Error(`Tour voice request failed (${response.status}).`);
  }

 

  return URL.createObjectURL(await response.blob());

}

 

function getFallbackVoice() {

  if (!window.speechSynthesis) return null;

 

  const voices = window.speechSynthesis.getVoices?.() || [];

 

  return (

    voices.find((voice) =>

      /Microsoft Ava|Microsoft Aria|Microsoft Jenny|Google US English|Samantha|Victoria|Karen|Moira|Serena|Tessa|Zira|Ava/i.test(

        `${voice.name} ${voice.lang}`

      )

    ) ||

    voices.find((voice) => /^en[-_]/i.test(voice.lang)) ||

    voices[0] ||

    null

  );

}

 

function playBrowserSpeech(text, signal) {

  return new Promise((resolve, reject) => {

    if (!window.speechSynthesis) {

      throw new Error("Browser speech is unavailable.");

    }

 

    window.speechSynthesis.cancel();

 

    const utterance = new SpeechSynthesisUtterance(text);

    const voice = getFallbackVoice();

 

    if (voice) utterance.voice = voice;

 

    utterance.rate = 0.9;

    utterance.pitch = 1;

    utterance.volume = 1;

    const finish = () => { signal?.removeEventListener("abort", abort); resolve(); };
    const abort = () => { window.speechSynthesis.cancel(); finish(); };
    utterance.onend = finish;
    utterance.onerror = () => { signal?.removeEventListener("abort", abort); reject(new Error("Browser narration failed.")); };
    if (signal?.aborted) { finish(); return; }
    signal?.addEventListener("abort", abort, { once: true });

 

    window.speechSynthesis.speak(utterance);

  });

}

 

function playAudioUrl(url, audioRef, signal) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audioRef.current = audio;
    let settled = false;
    function finish(error) {
      if (settled) return;
      settled = true;
      audio.onended = null;
      audio.onerror = null;
      signal?.removeEventListener("abort", abort);
      if (audioRef.current === audio) audioRef.current = null;
      if (error) { audio.pause(); reject(error); } else resolve();
    }
    function abort() { finish(new DOMException("Tour playback cancelled", "AbortError")); }
    audio.onended = () => finish();
    audio.onerror = () => finish(new Error("Tour audio playback failed."));
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener("abort", abort, { once: true });
    audio.play().catch(finish);
  });
}

function isVisible(element) {

  if (!element || !(element instanceof Element)) return false;

 

  const rect = element.getBoundingClientRect();

  const style = window.getComputedStyle(element);

 

  return (

    rect.width > 12 &&

    rect.height > 12 &&

    style.display !== "none" &&

    style.visibility !== "hidden" &&

    style.opacity !== "0"

  );

}

 

function nearestTourContainer(element) {

  if (!element) return null;

 

  return (

    element.closest("[data-tour]") ||

    element.closest(".vs-section-card") ||

    element.closest(".vs-card") ||

    element.closest(".vs-card-muted") ||

    element.closest(".workspace-module-card") ||

    element.closest(".workspace-command-card") ||

    element.closest("section") ||

    element.closest("article") ||

    element.closest("main") ||

    element

  );

}

 

function queryFirstVisible(selector) {

  if (!selector) return null;

 

  const selectors = String(selector)

    .split(",")

    .map((item) => item.trim())

    .filter(Boolean);

 

  for (const item of selectors) {

    try {

      const matches = Array.from(document.querySelectorAll(item));

 

      for (const match of matches) {

        const container = nearestTourContainer(match);

 

        if (

          container &&

          isVisible(container) &&

          !container.closest(".vs-tour-dock")

        ) {

          return container;

        }

      }

    } catch {

      // Ignore malformed fallback selectors.

    }

  }

 

  return null;

}

 

function containsAnyText(element, terms = []) {

  const body = String(element?.textContent || "")

    .replace(/\s+/g, " ")

    .toLowerCase();

 

  return terms.some((term) => body.includes(String(term).toLowerCase()));

}

 

function findByHeadingText(terms = []) {

  if (!terms.length) return null;

 

  const headings = Array.from(

    document.querySelectorAll(

      "h1,h2,h3,h4,.vs-section-title,.vs-stat-label,.vs-row-title,.vs-kicker,strong,button,a,label"

    )

  );

 

  for (const heading of headings) {

    if (!isVisible(heading) || !containsAnyText(heading, terms)) continue;

 

    const container = nearestTourContainer(heading);

    if (container && isVisible(container)) return container;

  }

 

  return null;

}

 

async function waitForTarget(step) {

  const startedAt = Date.now();

 

  while (Date.now() - startedAt < (step.sectionDetail ? 2000 : TARGET_TIMEOUT_MS)) {

    const dataTour = step.target?.dataTour;

 

    if (dataTour) {

      const match = queryFirstVisible(`[data-tour="${dataTour}"]`);

      if (match) return match;

    }

 

    const headingMatch = step.target?.exactSection
      ? Array.from(document.querySelectorAll("main h1, main h2, main h3, main h4, main .vs-section-title"))
          .find((node) => isVisible(node) && (step.target.headingText || []).some(
            (text) => node.textContent.trim().replace(/\s+/g, " ").toLowerCase() === text.trim().replace(/\s+/g, " ").toLowerCase()
          ))
      : findByHeadingText(step.target?.headingText || []);

    if (headingMatch) return step.target?.exactSection ? nearestTourContainer(headingMatch) : headingMatch;

 

    const selectorMatch = queryFirstVisible(step.target?.selector);

    if (selectorMatch) return selectorMatch;

 

    await sleep(TARGET_POLL_MS);

  }

 

  return step.sectionDetail ? null : queryFirstVisible("main") || document.body;

}

 

function getSpotlightRect(element) {

  if (!element || !(element instanceof Element)) return null;

 

  const rect = element.getBoundingClientRect();

  const pad = window.innerWidth <= 720 ? 8 : 12;

  const viewportPad = window.innerWidth <= 720 ? 8 : 12;

 

  const top = Math.max(viewportPad, rect.top - pad);

  const left = Math.max(viewportPad, rect.left - pad);

  const right = Math.min(window.innerWidth - viewportPad, rect.right + pad);

  const bottom = Math.min(window.innerHeight - viewportPad, rect.bottom + pad);

 

  return {

    top,

    left,

    width: Math.max(40, right - left),

    height: Math.max(40, bottom - top),

  };

}

 

function buildNarration(step) {

  return [

    step.page,

    step.section,

    step.heading,

    step.narration,

    step.value ? `${step.label}: ${step.value}` : "",

  ]

    .filter(Boolean)

    .join(". ");

}

 

export default function VirtualTour() {

  const navigate = useNavigate();

  const location = useLocation();

 

  const queryMode = getTourMode(location.search);
  const [mode, setMode] = useState(queryMode);
  useEffect(() => {
    setMode(current => nextTourSessionMode(current, queryMode));
    // A fresh launch after Exit can reuse the same mode without a mode change.
    if (queryMode && !running) {
      setRunning(true);
      setStepIndex(0);
      setPaused(false);
      setDockHidden(false);
      setActivePart(null);
      resumeSectionRef.current = null;
    }
  }, [queryMode]);

  const steps = useMemo(() => getUnifiedTourPages(mode || "platform"), [mode]);

 

  const [running, setRunning] = useState(Boolean(mode));

  const [stepIndex, setStepIndex] = useState(0);

  const [autoAdvance, setAutoAdvance] = useState(true);

  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const [browserFallback, setBrowserFallback] = useState(false);

  const [paused, setPaused] = useState(false);

  const [voiceStatus, setVoiceStatus] = useState("Ready");

  const [spotlightRect, setSpotlightRect] = useState(null);

  const [replayNonce, setReplayNonce] = useState(0);

  const [targetMissing, setTargetMissing] = useState(false);

  const [transcriptOpen, setTranscriptOpen] = useState(true);
  const [dockHidden, setDockHidden] = useState(false);

  const [expandedControls, setExpandedControls] = useState(false);
  const [activePart, setActivePart] = useState(null);
  const resumeSectionRef = useRef(null);
  const autoAdvanceRef = useRef(autoAdvance);
  autoAdvanceRef.current = autoAdvance;

 

  const audioRef = useRef(null);

  const objectUrlRef = useRef("");

  const cancelledRef = useRef(false);

  const runIdRef = useRef(0);

  const targetRef = useRef(null);

 

  const step = running ? steps[stepIndex] : null;

 

  useEffect(() => {

    if (!mode) return;

 

    setRunning(true);

    setStepIndex(0);

    setPaused(false);

    setTargetMissing(false);

    setTranscriptOpen(true);
    setDockHidden(false);

    setExpandedControls(false);

    setSpotlightRect(null);

    targetRef.current = null;

    cancelledRef.current = false;

  }, [mode]);

 

  useEffect(() => {

    function updateSpotlight() {

      if (!targetRef.current) return;

      setSpotlightRect(getSpotlightRect(targetRef.current));

    }

 

    window.addEventListener("resize", updateSpotlight);

    window.addEventListener("scroll", updateSpotlight, true);

 

    return () => {

      window.removeEventListener("resize", updateSpotlight);

      window.removeEventListener("scroll", updateSpotlight, true);

    };

  }, []);

 

  useEffect(() => {

    return () => {

      cancelledRef.current = true;

      window.speechSynthesis?.cancel?.();

 

      if (audioRef.current) audioRef.current.pause();

      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);

    };

  }, []);

 

  function stopAudio() {

    window.speechSynthesis?.cancel?.();

 

    if (audioRef.current) {

      audioRef.current.pause();

      audioRef.current = null;

    }

  }

 

  function cleanObjectUrl() {

    if (!objectUrlRef.current) return;

    URL.revokeObjectURL(objectUrlRef.current);

    objectUrlRef.current = "";

  }

 

  function stopTour({ completed = false } = {}) {

    cancelledRef.current = true;

    setRunning(false);

    setPaused(false);

    setSpotlightRect(null);

    setTargetMissing(false);

    targetRef.current = null;

    stopAudio();

    cleanObjectUrl();

 

    if (completed && mode) storeCompletion(mode);

 

    navigate(

      {

        pathname: location.pathname,

        search: removeTourQuery(location.search),

        hash: location.hash,

      },

      { replace: true }

    );

  }

 

  function moveToNext() {

    if (stepIndex < steps.length - 1) {

      setStepIndex((value) => value + 1);

      return;

    }

 

    stopTour({ completed: true });

  }

 

  useEffect(() => {

    if (!running || !step || paused) return undefined;

 

    const runId = runIdRef.current + 1;

    runIdRef.current = runId;

    cancelledRef.current = false;

 

    const controller = new AbortController();
    const isCurrent = () => !controller.signal.aborted && !cancelledRef.current && runIdRef.current === runId;

    async function runStep() {
      try {
        stopAudio();
        cleanObjectUrl();
        setSpotlightRect(null);
        setTargetMissing(false);
        setActivePart(null);
        targetRef.current = null;
        if (location.pathname !== step.route) {
          setVoiceStatus("Opening page");
          navigate({ pathname: step.route, search: `?tour=${mode || "platform"}` });
          return; // The route change starts one fresh playback run on the destination.
        }
        setVoiceStatus("Preparing page overview");
        await sleep(ROUTE_SETTLE_MS);
        if (!isCurrent()) return;
        const overviewTarget = await waitForTarget(step.segments[0]);
        if (!isCurrent()) return;
        const resolveTarget = part => {
          if (!part.sectionDetail) return overviewTarget;
          if (part.target?.selector) return queryFirstVisible(part.target.selector);
          const normalize = value => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
          const match = Array.from(document.querySelectorAll("main h1, main h2, main h3, main h4, main .vs-section-title"))
            .find(node => isVisible(node) && (part.target?.headingText || []).some(text => normalize(node.textContent) === normalize(text)));
          return match ? nearestTourContainer(match) : null;
        };
        const visible = collectVisiblePageSegments(step, resolveTarget, (a, b) => {
          const position = a.compareDocumentPosition(b);
          return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
        });
        if (!visible.length) { setTargetMissing(true); setVoiceStatus("Page unavailable. Use Next page to continue."); return; }
        const playlist = visible.flatMap((part, index) => {
          const narration = sectionNarration(part, index, visible.length, step.value);
          return splitNarration(narration).map(text => ({ ...part, text, ordinal: index, total: visible.length }));
        });
        const start = resumeSectionRef.current?.pageId === step.id
          ? Math.min(resumeSectionRef.current.index, playlist.length - 1) : 0;
        const completed = await playUnifiedPage({
          segments: playlist, start, isCurrent,
          prepare: async part => {
            if (!voiceEnabled) return { kind: "text" };
            try {
              const url = await fetchMarinSpeech(part.text, controller.signal);
              if (!isCurrent()) { URL.revokeObjectURL(url); throw new DOMException("Cancelled", "AbortError"); }
              return { kind: "audio", url };
            } catch (error) {
              if (!isCurrent()) throw error;
              if (browserFallback) return { kind: "browser", text: part.text };
              throw error;
            }
          },
          present: async (part, index) => {
            if (!isCurrent()) return;
            resumeSectionRef.current = { pageId: step.id, index };
            setActivePart({ pageId: step.id, segment: { ...part, narration: part.text, value: "" } });
            targetRef.current = part.element;
            part.element.scrollIntoView?.({ behavior: "smooth", block: "center", inline: "nearest" });
            setSpotlightRect(getSpotlightRect(part.element));
          },
          play: async (resource, part) => {
            if (!isCurrent()) return;
            if (resource.kind === "audio") {
              setVoiceStatus("Guided page overview");
              await playAudioUrl(resource.url, audioRef, controller.signal);
            } else if (resource.kind === "browser") {
              setVoiceStatus("Guided overview · browser voice");
              await playBrowserSpeech(resource.text, controller.signal);
            } else {
              setVoiceStatus("Reading page overview · voice off");
              await sleep(Math.min(30000, Math.max(6000, part.text.split(/\s+/).length * 430)));
            }
          },
          dispose: resource => { if (resource?.url) URL.revokeObjectURL(resource.url); },
        });
        if (!completed || !isCurrent()) return;
        resumeSectionRef.current = null;
        setVoiceStatus("Page overview complete");
        if (autoAdvanceRef.current) {
          await sleep(BETWEEN_STEPS_MS);
          if (isCurrent()) moveToNext();
        }
      } catch (error) {
        if (!isCurrent()) return;
        controller.abort();
        console.warn("[virtual-tour] page overview interrupted:", error?.name || "PlaybackError");
        setVoiceStatus("Narration unavailable. Use Replay, enable Fallback, or choose Next page.");
      }
    }
    runStep();
    return () => { controller.abort(); stopAudio(); };

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [

    browserFallback,

    location.pathname,

    mode,

    navigate,

    paused,

    replayNonce,

    running,

    stepIndex,

    voiceEnabled,

  ]);

 

  if (!running || !step || !steps.length) return null;

 

  const displayStep = activePart?.pageId === step.id ? activePart.segment : step;
  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

 

  function goBack() {
    resumeSectionRef.current = null;

    cancelledRef.current = true;

    stopAudio();

 

    if (stepIndex > 0) setStepIndex((value) => value - 1);

 

    setPaused(false);

  }

 

  function goNext() {
    resumeSectionRef.current = null;

    cancelledRef.current = true;

    stopAudio();

    moveToNext();

    setPaused(false);

  }

 

  function jumpToStep(value) {
    resumeSectionRef.current = null;
    const nextIndex = Number(value);
    if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= steps.length) return;
    cancelledRef.current = true;
    stopAudio();
    setStepIndex(nextIndex);
    setReplayNonce((value) => value + 1);
    setPaused(false);
  }

  function replayStep() {
    resumeSectionRef.current = null;

    cancelledRef.current = true;

    stopAudio();

    setReplayNonce((value) => value + 1);

    setPaused(false);

  }

 

  function togglePause() {

    if (paused) {

      cancelledRef.current = false;

      setPaused(false);

      setVoiceStatus("Resuming");

      setReplayNonce((value) => value + 1);

      return;

    }

 

    cancelledRef.current = true;

    stopAudio();

    setPaused(true);

    setVoiceStatus("Paused");

  }

 

  const tourDock = (

    <>

      {spotlightRect ? (

        <div

          className="vs-tour-spotlight-box"

          style={{

            top: spotlightRect.top,

            left: spotlightRect.left,

            width: spotlightRect.width,

            height: spotlightRect.height,

          }}

        />

      ) : null}

 

      {!dockHidden && <aside
        id="vs-tour-narration-panel"
        className={`vs-tour-dock ${transcriptOpen ? "is-transcript-open" : ""}`}

        aria-live="polite"

      >

        <div className="vs-tour-dock-progress" aria-hidden="true">

          <span style={{ width: `${progress}%` }} />

        </div>

 

        <div className="vs-tour-dock-main">

          <div className="vs-tour-dock-copy">

            <div className="vs-tour-dock-topline">

              <span className="vs-tour-dock-mode">

                {mode === "admin" ? "Admin Tour" : "Platform Tour"}

              </span>

              <span className="vs-tour-dock-count">

                {stepIndex + 1}/{steps.length} pages

              </span>

            </div>

 

            <strong className="vs-tour-dock-title">{step.page}</strong>

 

            <div className="vs-tour-dock-status">

              <span

                className={`vs-tour-status-dot ${

                  paused ? "is-paused" : voiceStatus.startsWith("Guided") ? "is-speaking" : ""

                }`}

              />

              <span>{paused ? "Tour paused" : voiceStatus}</span>

            </div>

          </div>

 

          <button

            type="button"

            className="vs-tour-primary-control"

            onClick={togglePause}

          >

            {paused ? "Resume" : "Pause"}

          </button>

        </div>

 

        {targetMissing ? (

          <div className="vs-tour-dock-note">

            {step.sectionDetail ? "This section is not currently visible. Open its panel or use Next to continue." : "Showing the page because the exact section marker was not found."}

          </div>

        ) : null}

 

        {transcriptOpen ? (

          <div className="vs-tour-transcript">

            <span>{displayStep.heading}</span>

            <p>{displayStep.narration}</p>

            {displayStep.value ? (

              <div>

                <strong>{displayStep.label}:</strong> {displayStep.value}

              </div>

            ) : null}

          </div>

        ) : null}

 

        <div className="vs-tour-page-picker" style={{ padding: "8px 14px" }}>
          <label htmlFor="vs-tour-page-select" style={{ display: "block", fontSize: 12, marginBottom: 4 }}>Jump to a page</label>
          <select
            id="vs-tour-page-select"
            value={String(steps.findIndex((entry) => !entry.sectionDetail && entry.page === step.page && entry.route === step.route))}
            onChange={(event) => jumpToStep(event.target.value)}
            style={{ width: "100%", padding: "8px", borderRadius: 8, background: "#101b2d", color: "#eef4ff", border: "1px solid rgba(148,163,184,.3)" }}
          >
            {steps.map((entry, index) => !entry.sectionDetail && !entry.id.endsWith("-chapter") ? (
              <option key={entry.id} value={String(index)}>{entry.section} — {entry.page}</option>
            ) : null)}
            {step.id.endsWith("-chapter") ? <option value={String(stepIndex)}>{step.page}</option> : null}
          </select>
        </div>
        <div style={{ padding: "0 14px 8px", fontSize: 12, color: "#cbd5e1" }}>
          {activePart?.pageId === step.id ? `${activePart.segment.ordinal === 0 ? "Page introduction" : `Section ${activePart.segment.ordinal} of ${activePart.segment.total - 1}`} · ${step.page}` : step.page}
        </div>
        <div className="vs-tour-dock-actions">
          <button type="button" onClick={() => setDockHidden(true)} aria-controls="vs-tour-narration-panel" aria-expanded="true">
            Hide narration
          </button>

          <button type="button" onClick={goBack} disabled={stepIndex === 0}>

            Previous page

          </button>

 

          <button

            type="button"

            onClick={() => setTranscriptOpen((value) => !value)}

          >

            {transcriptOpen ? "Hide Text" : "Transcript"}

          </button>

 

          <button

            type="button"

            onClick={() => setExpandedControls((value) => !value)}

          >

            {expandedControls ? "Less" : "More"}

          </button>

 

          <button type="button" onClick={goNext}>

            {stepIndex === steps.length - 1 ? "Finish" : "Next page"}

          </button>

        </div>

 

        {expandedControls ? (

          <div className="vs-tour-dock-secondary">

            <button type="button" onClick={replayStep}>

              Replay

            </button>

 

            <button

              type="button"

              onClick={() => setVoiceEnabled((value) => !value)}

            >

              Voice {voiceEnabled ? "On" : "Off"}

            </button>

 

            <button

              type="button"

              onClick={() => setAutoAdvance((value) => !value)}

            >

              Auto {autoAdvance ? "On" : "Off"}

            </button>

 

            <button

              type="button"

              onClick={() => setBrowserFallback((value) => !value)}

            >

              Fallback {browserFallback ? "On" : "Off"}

            </button>

 

            <button type="button" className="is-danger" onClick={() => stopTour()}>

              Exit Tour

            </button>

          </div>

        ) : null}

      </aside>}

      {dockHidden && (
        <div
          role="toolbar"
          aria-label="Tour playback controls"
          style={{ position: "fixed", bottom: 12, right: 12, zIndex: 2147483647,
            display: "flex", flexWrap: "wrap", gap: 6, maxWidth: "calc(100vw - 24px)",
            padding: 8, borderRadius: 12, background: "#101b2d", color: "#eef4ff",
            border: "1px solid rgba(148,163,184,.3)", boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}
        >
          <button type="button" onClick={() => setDockHidden(false)} aria-controls="vs-tour-narration-panel" aria-expanded="false"
            style={{ borderRadius: 8, padding: "7px 10px", cursor: "pointer" }}>
            Show narration · {stepIndex + 1}/{steps.length}
          </button>
          <button type="button" onClick={togglePause} style={{ borderRadius: 8, padding: "7px 10px", cursor: "pointer" }}>
            {paused ? "Resume" : "Pause"}
          </button>
          <button type="button" onClick={() => stopTour()} style={{ borderRadius: 8, padding: "7px 10px", cursor: "pointer" }}>
            Exit tour
          </button>
        </div>
      )}

    </>

  );

 

  return createPortal(tourDock, document.body);

}
