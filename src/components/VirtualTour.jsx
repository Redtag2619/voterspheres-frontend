import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";

import { getTourSteps } from "../config/platformTourSteps";
import "./VirtualTour.css";

const API_BASE =
  String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "") || 
  "https://voterspheres-backend-2pap.onrender.com";

const ROUTE_SETTLE_MS = 850;
const TARGET_TIMEOUT_MS = 8500;
const TARGET_POLL_MS = 125;
const CENTER_SETTLE_MS = 650;
const BETWEEN_STEPS_MS = 500;

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
    // Storage may be unavailable in restricted browser contexts.
  }
}

async function fetchNovaSpeech(text) {
  const token = getToken();

  const response = await fetch(`${API_BASE}/api/tour/voice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      text: normalizeText(text),
      voice: "nova",
      model: "gpt-4o-mini-tts",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Nova voice failed ${response.status}: ${detail}`);
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
    utterance.pitch = 1.02;
    utterance.volume = 1;
    utterance.onend = resolve;
    utterance.onerror = resolve;

    window.speechSynthesis.speak(utterance);
  });
}

function playAudioUrl(url, audioRef) {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = resolve;
    audio.onerror = reject;
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
          !container.closest(".vs-tour-card")
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
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [browserFallback, setBrowserFallback] = useState(true);
  const [paused, setPaused] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("Ready");
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [replayNonce, setReplayNonce] = useState(0);
  const [targetMissing, setTargetMissing] = useState(false);

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
          await sleep(220);
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
        await sleep(250);

        if (cancelledRef.current || runIdRef.current !== runId) return;

        const narration = buildNarration(step);

        if (!voiceEnabled) {
          setVoiceStatus("Voice off");
        } else {
          try {
            setVoiceStatus("Generating Nova voice");
            const url = await fetchNovaSpeech(narration);
            objectUrlRef.current = url;

            if (cancelledRef.current || runIdRef.current !== runId) return;

            setVoiceStatus("Speaking");
            await playAudioUrl(url, audioRef);
          } catch (error) {
            console.warn("[virtual-tour] Nova voice unavailable:", error?.message);

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
          await sleep(BETWEEN_STEPS_MS);

          if (!cancelledRef.current && runIdRef.current === runId) {
            moveToNext();
          }
        }
      } catch (error) {
        console.warn("[virtual-tour] step failed:", error?.message);
        setVoiceStatus("Tour step unavailable. Use Next to continue.");
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
    voiceEnabled,
  ]);

  if (!running || !step || !steps.length) return null;

  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);
  const chapterSteps = steps.filter((item) => item.chapter === step.chapter);
  const chapterStepIndex = chapterSteps.findIndex((item) => item.id === step.id);

  function goBack() {
    cancelledRef.current = true;
    stopAudio();

    if (stepIndex > 0) setStepIndex((value) => value - 1);

    setPaused(false);
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
    setReplayNonce((value) => value + 1);
    setPaused(false);
  }

  function togglePause() {
    if (paused) {
      cancelledRef.current = false;
      setPaused(false);
      setVoiceStatus("Resuming");
      return;
    }

    cancelledRef.current = true;
    stopAudio();
    setPaused(true);
    setVoiceStatus("Paused");
  }

  const tourCard = (
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

      <div className="vs-tour-screen-dim" />

      <div className="vs-tour-backdrop">
        <section
          className="vs-tour-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vs-tour-title"
        >
          <div className="vs-tour-progress" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>

          <div className="vs-tour-header">
            <div>
              <div className="vs-tour-mode">
                {mode === "admin" ? "Administrator Tour" : "Platform Tour"}
              </div>
              <p className="vs-kicker">
                {step.chapter} · {step.section}
              </p>
              <h2 id="vs-tour-title">{step.page}</h2>
            </div>

            <button
              type="button"
              className="vs-tour-close"
              onClick={() => stopTour()}
              aria-label="Close tour"
            >
              ×
            </button>
          </div>

          <div className="vs-tour-section-label">{step.heading}</div>

          <p className="vs-tour-body">{step.narration}</p>

          {step.value ? (
            <div className="vs-tour-benefits">
              <div className="vs-tour-benefit">
                <strong>{step.label}:</strong> {step.value}
              </div>
            </div>
          ) : null}

          {targetMissing ? (
            <div className="vs-tour-warning">
              The exact section marker was not found, so the page was highlighted.
              The tour can continue normally.
            </div>
          ) : null}

          <div className="vs-tour-status">
            <span>{voiceStatus}</span>
            <span>
              Chapter {chapterStepIndex + 1} of {chapterSteps.length}
            </span>
          </div>

          <div className="vs-tour-meta">
            Step {stepIndex + 1} of {steps.length} · {progress}% complete
          </div>

          <div className="vs-tour-actions">
            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={goBack}
              disabled={stepIndex === 0}
            >
              Back
            </button>

            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={togglePause}
            >
              {paused ? "Resume" : "Pause"}
            </button>

            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={replayStep}
            >
              Replay
            </button>

            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => setVoiceEnabled((value) => !value)}
            >
              Voice {voiceEnabled ? "On" : "Off"}
            </button>

            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => setBrowserFallback((value) => !value)}
            >
              Fallback {browserFallback ? "On" : "Off"}
            </button>

            <button
              type="button"
              className="vs-button vs-button-secondary"
              onClick={() => setAutoAdvance((value) => !value)}
            >
              Auto {autoAdvance ? "On" : "Off"}
            </button>

            <button type="button" className="vs-button" onClick={goNext}>
              {stepIndex === steps.length - 1 ? "Finish Tour" : "Next"}
            </button>
          </div>
        </section>
      </div>
    </>
  );

  return createPortal(tourCard, document.body);
}
