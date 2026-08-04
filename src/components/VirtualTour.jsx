import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

import { getTourSteps } from "../config/platformTourSteps";
import "./VirtualTour.css";

const API_BASE =
  String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "") ||
  "https://voterspheres-backend-2pap.onrender.com";

const ROUTE_SETTLE_MS = 1400;
const TARGET_TIMEOUT_MS = 12000;
const TARGET_POLL_MS = 150;
const CENTER_SETTLE_MS = 1100;
const BETWEEN_STEPS_MS = 2500;

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

async function fetchNovaSpeech(text) {
  const token = getToken();

  const response = await fetch(
    `${API_BASE}/api/tour/voice`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        ...(token
          ? {
              Authorization:
                `Bearer ${token}`,
            }
          : {}),
      },

      body: JSON.stringify({
        text:
          normalizeText(text),

        voice:
          "marin",

        model:
          "gpt-4o-mini-tts",

        instructions:
          "Speak like a warm, polished human product specialist. " +
          "Use a natural conversational American delivery. " +
          "Speak calmly and confidently with short pauses between ideas. " +
          "Apply subtle emphasis to important business outcomes. " +
          "Avoid robotic cadence, announcer-style delivery, exaggerated enthusiasm, and rushed speech. " +
          "Pronounce VoterSpheres as Voter Spheres.",
      }),
    }
  );

  if (!response.ok) {
    const detail = await response
      .text()
      .catch(() => "");

    throw new Error(
      `Natural tour voice failed ${response.status}: ${detail}`
    );
  }

  const blob = await response.blob();

  if (!blob.size) {
    throw new Error(
      "The tour voice response was empty."
    );
  }

  return URL.createObjectURL(blob);
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

function playBrowserSpeech(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getFallbackVoice();

    if (voice) utterance.voice = voice;

    utterance.rate = 0.88;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onend = resolve;
    utterance.onerror = resolve;

    window.speechSynthesis.speak(utterance);
  });
}

function playAudioUrl(url, audioRef) {
  return new Promise((resolve, reject) => {
    const audio = audioRef.current || new Audio();

    audioRef.current = audio;
    audio.onended = resolve;
    audio.onerror = reject;
    audio.muted = false;
    audio.src = url;
    audio.load();

    audio.play().catch(reject);
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

    if (container && isVisible(container)) {
      return container;
    }
  }

  return null;
}

async function waitForTarget(step) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < TARGET_TIMEOUT_MS) {
    const dataTour = step.target?.dataTour;

    if (dataTour) {
      const match = queryFirstVisible(`[data-tour="${dataTour}"]`);
      if (match) return match;
    }

    const headingMatch = findByHeadingText(step.target?.headingText || []);
    if (headingMatch) return headingMatch;

    const selectorMatch = queryFirstVisible(step.target?.selector);
    if (selectorMatch) return selectorMatch;

    await sleep(TARGET_POLL_MS);
  }

  return queryFirstVisible("main") || document.body;
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

  const mode = getTourMode(location.search);
  const steps = useMemo(() => getTourSteps(mode || "platform"), [mode]);

  const [running, setRunning] = useState(Boolean(mode));
  const [stepIndex, setStepIndex] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [browserFallback, setBrowserFallback] = useState(true);
  const [paused, setPaused] = useState(false);
  const [tourStarted, setTourStarted] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Ready to begin");
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [replayNonce, setReplayNonce] = useState(0);
  const [targetMissing, setTargetMissing] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [expandedControls, setExpandedControls] = useState(false);

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
    setTourStarted(false);
    setVoiceStatus("Ready to begin");
    setTargetMissing(false);
    setTranscriptOpen(false);
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

      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
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
    setTourStarted(false);
    setSpotlightRect(null);
    setTargetMissing(false);

    targetRef.current = null;

    stopAudio();
    cleanObjectUrl();

    if (completed && mode) {
      storeCompletion(mode);
    }

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

  function startGuidedTour() {
    cancelledRef.current = false;
    setPaused(false);
    setTourStarted(true);
    setVoiceStatus("Starting guided tour");

    try {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();

        const unlock = new SpeechSynthesisUtterance("Tour starting");
        unlock.volume = 0;
        unlock.rate = 1;
        window.speechSynthesis.speak(unlock);
      }

      const silentWav =
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
      const audio = audioRef.current || new Audio();

      audioRef.current = audio;
      audio.muted = true;
      audio.src = silentWav;
      audio.load();

      const unlockPromise = audio.play();

      if (unlockPromise?.catch) {
        unlockPromise.catch(() => {});
      }

      window.setTimeout(() => {
        try {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        } catch {
          // The generated narration can still use browser speech fallback.
        }
      }, 120);
    } catch {
      // Browser speech fallback remains available.
    }

    setReplayNonce((value) => value + 1);
  }

  useEffect(() => {
    if (!running || !step || paused || !tourStarted) {
      return undefined;
    }

    const runId = runIdRef.current + 1;

    runIdRef.current = runId;
    cancelledRef.current = false;

    async function runStep() {
      try {
        stopAudio();
        cleanObjectUrl();

        setSpotlightRect(null);
        setTargetMissing(false);

        targetRef.current = null;

        const alreadyOnRoute = location.pathname === step.route;

        setVoiceStatus(alreadyOnRoute ? "Finding section" : "Opening page");

        if (!alreadyOnRoute) {
          navigate(step.route);
          await sleep(ROUTE_SETTLE_MS);
        } else {
          await sleep(350);
        }

        if (cancelledRef.current || runIdRef.current !== runId) return;

        setVoiceStatus("Locating section");

        const target = await waitForTarget(step);

        targetRef.current = target;

        const fellBackToPage =
          target === document.body ||
          target?.tagName?.toLowerCase() === "main";

        setTargetMissing(fellBackToPage);

        target?.scrollIntoView?.({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });

        await sleep(CENTER_SETTLE_MS);

        if (cancelledRef.current || runIdRef.current !== runId) return;

        setSpotlightRect(getSpotlightRect(target));

        await sleep(500);

        if (cancelledRef.current || runIdRef.current !== runId) return;

        const narration = buildNarration(step);

        if (!voiceEnabled) {
          setVoiceStatus("Voice off");
        } else {
          try {
            setVoiceStatus("Generating natural voice");

            const url = await fetchNovaSpeech(narration);

            objectUrlRef.current = url;

            if (cancelledRef.current || runIdRef.current !== runId) return;

            setVoiceStatus("Speaking");

            await playAudioUrl(url, audioRef);
          } catch (error) {
            console.warn(
              "[virtual-tour] Natural voice unavailable:",
              error?.message
            );

            if (browserFallback) {
              setVoiceStatus("Using browser voice");
              await playBrowserSpeech(narration);
            } else {
              setVoiceStatus("Voice unavailable");
            }
          }
        }

        if (cancelledRef.current || runIdRef.current !== runId) return;

        setVoiceStatus("Ready");

        if (autoAdvance) {
          setVoiceStatus("Moving to next section");

          await sleep(BETWEEN_STEPS_MS);

          if (!cancelledRef.current && runIdRef.current === runId) {
            moveToNext();
          }
        }
      } catch (error) {
        console.warn("[virtual-tour] Step failed:", error?.message);

        setVoiceStatus("Step unavailable. Use Skip to continue.");
      }
    }

    runStep();

    return () => {
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoAdvance,
    browserFallback,
    location.pathname,
    navigate,
    paused,
    replayNonce,
    running,
    stepIndex,
    tourStarted,
    voiceEnabled,
  ]);

  if (!running || !step || !steps.length) {
    return null;
  }

  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  function goBack() {
    cancelledRef.current = true;

    stopAudio();

    if (stepIndex > 0) {
      setStepIndex((value) => value - 1);
    }

    setPaused(false);
    setReplayNonce((value) => value + 1);
  }

  function goNext() {
    cancelledRef.current = true;

    stopAudio();
    moveToNext();

    setPaused(false);
  }

  function replayStep() {
    cancelledRef.current = true;

    stopAudio();

    setPaused(false);
    setReplayNonce((value) => value + 1);
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

  const dockClassName = [
    "vs-tour-dock",
    transcriptOpen ? "is-transcript-open" : "",
    tourStarted ? "is-started" : "",
  ]
    .filter(Boolean)
    .join(" ");

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

      <aside className={dockClassName} aria-live="polite">
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
                {stepIndex + 1}/{steps.length}
              </span>
            </div>

            <strong className="vs-tour-dock-title">{step.page}</strong>

            <div className="vs-tour-dock-status">
              <span
                className={[
                  "vs-tour-status-dot",
                  paused ? "is-paused" : "",
                  voiceStatus === "Speaking" ? "is-speaking" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />

              <span>
                {!tourStarted
                  ? "Ready to begin"
                  : paused
                    ? "Tour paused"
                    : voiceStatus}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="vs-tour-primary-control"
            onClick={tourStarted ? togglePause : startGuidedTour}
          >
            {!tourStarted ? "Start Tour" : paused ? "Resume" : "Pause"}
          </button>
        </div>

        {targetMissing ? (
          <div className="vs-tour-dock-note">
            Showing the page because the exact section marker was not found.
          </div>
        ) : null}

        {transcriptOpen ? (
          <div className="vs-tour-transcript">
            <span>{step.heading}</span>

            <p>{step.narration}</p>

            {step.value ? (
              <div>
                <strong>{step.label}:</strong> {step.value}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="vs-tour-dock-actions">
          <button
            type="button"
            onClick={goBack}
            disabled={!tourStarted || stepIndex === 0}
          >
            Previous
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

          <button
            type="button"
            onClick={goNext}
            disabled={!tourStarted}
          >
            {stepIndex === steps.length - 1 ? "Finish" : "Skip"}
          </button>
        </div>

        {expandedControls ? (
          <div className="vs-tour-dock-secondary">
            <button
              type="button"
              onClick={replayStep}
              disabled={!tourStarted}
            >
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

            <button
              type="button"
              className="is-danger"
              onClick={() => stopTour()}
            >
              Exit Tour
            </button>
          </div>
        ) : null}
      </aside>
    </>
  );

  return createPortal(tourDock, document.body);
}
