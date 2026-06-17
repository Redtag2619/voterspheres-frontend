import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { publicTourSteps, adminTourSteps } from "../data/platformTour";

function getPreferredVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;

  const voices = window.speechSynthesis.getVoices?.() || [];

  return (
    voices.find((voice) =>
      /neutral|nonbinary|non-binary|alex|samantha|google us english/i.test(
        `${voice.name} ${voice.lang}`
      )
    ) ||
    voices.find((voice) => /en-US|en_GB|en/i.test(voice.lang)) ||
    voices[0] ||
    null
  );
}

function speak(text, enabled) {
  if (!enabled) return;
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = getPreferredVoice();

  if (voice) utterance.voice = voice;

  utterance.rate = 0.92;
  utterance.pitch = 1;
  utterance.volume = 0.95;

  window.speechSynthesis.speak(utterance);
}

export default function VirtualTour({ mode = "public" }) {
  const navigate = useNavigate();
  const steps = useMemo(
    () => (mode === "admin" ? adminTourSteps : publicTourSteps),
    [mode]
  );

  const [index, setIndex] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [running, setRunning] = useState(true);

  const step = steps[index];

  useEffect(() => {
    if (!running || !step) return;

    navigate(step.route);
    speak(`${step.title}. ${step.body}`, voiceEnabled);

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [index, running, step, navigate, voiceEnabled]);

  if (!running || !step) return null;

  const progress = Math.round(((index + 1) / steps.length) * 100);

  function next() {
    if (index >= steps.length - 1) {
      setRunning(false);
      window.speechSynthesis?.cancel?.();
      return;
    }

    setIndex((value) => value + 1);
  }

  function back() {
    setIndex((value) => Math.max(0, value - 1));
  }

  function stop() {
    setRunning(false);
    window.speechSynthesis?.cancel?.();
  }

  function replay() {
    speak(`${step.title}. ${step.body}`, voiceEnabled);
  }

  return (
    <div className="vs-tour-backdrop">
      <section className="vs-tour-card" role="dialog" aria-modal="true">
        <div className="vs-tour-progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="vs-tour-header">
          <div>
            <p className="vs-kicker">
              {mode === "admin" ? "Admin Tour" : "Platform Tour"}
            </p>
            <h2>{step.title}</h2>
          </div>

          <button className="vs-tour-close" onClick={stop} aria-label="Close tour">
            ×
          </button>
        </div>

        <p className="vs-tour-body">{step.body}</p>

        <div className="vs-tour-meta">
          Step {index + 1} of {steps.length} • {progress}%
        </div>

        <div className="vs-tour-actions">
          <button
            className="vs-button vs-button-secondary"
            onClick={back}
            disabled={index === 0}
          >
            Back
          </button>

          <button
            className="vs-button vs-button-secondary"
            onClick={() => setVoiceEnabled((value) => !value)}
          >
            Voice {voiceEnabled ? "On" : "Off"}
          </button>

          <button className="vs-button vs-button-secondary" onClick={replay}>
            Replay
          </button>

          <button className="vs-button" onClick={next}>
            {index >= steps.length - 1 ? "Finish Tour" : "Next"}
          </button>
        </div>
      </section>
    </div>
  );
}