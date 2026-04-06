import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function PromptChip({ text, onClick }) {
  return (
    <button
      type="button"
      className="vs-button vs-button-secondary"
      onClick={() => onClick(text)}
      style={{ borderRadius: "9999px", padding: "0.6rem 1rem" }}
    >
      {text}
    </button>
  );
}

function MessageBubble({ item }) {
  const isAssistant = item.role === "assistant";

  return (
    <div
      className="vs-card-muted"
      style={{
        background: isAssistant ? "var(--vs-surface)" : "var(--vs-accent-soft)",
        borderColor: isAssistant ? "var(--vs-border)" : "rgba(1, 118, 211, 0.18)"
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "0.75rem"
        }}
      >
        <div
          className="vs-eyebrow"
          style={{ marginTop: 0, color: isAssistant ? "var(--vs-accent)" : "var(--vs-text-muted)" }}
        >
          {isAssistant ? "AI Analyst" : "You"}
        </div>

        {item.title ? (
          <div style={{ fontSize: "0.75rem", color: "var(--vs-text-muted)" }}>
            {item.title}
          </div>
        ) : null}
      </div>

      <div
        style={{
          fontSize: "0.94rem",
          lineHeight: 1.75,
          color: "var(--vs-text)"
        }}
      >
        {item.text}
      </div>
    </div>
  );
}

function OutputCard({ item }) {
  return (
    <div className="vs-card-muted">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "1rem",
          alignItems: "flex-start"
        }}
      >
        <div>
          <div className="vs-eyebrow" style={{ marginTop: 0 }}>
            {item.type || "Output"}
          </div>
          <div style={{ marginTop: "0.5rem", fontWeight: 700, color: "var(--vs-text)" }}>
            {item.title}
          </div>
        </div>

        <Badge tone="accent">Generated</Badge>
      </div>

      <div
        style={{
          marginTop: "0.85rem",
          fontSize: "0.92rem",
          lineHeight: 1.7,
          color: "var(--vs-text-muted)"
        }}
      >
        {item.note}
      </div>
    </div>
  );
}

const fallbackData = {
  metrics: [
    { label: "AI Queries Today", value: "184", delta: "+26%", tone: "up" },
    { label: "Briefs Generated", value: "39", delta: "+11", tone: "up" },
    { label: "Strategic Alerts Referenced", value: "72", delta: "+8", tone: "up" },
    { label: "Response Confidence", value: "91%", delta: "+2.4", tone: "up" }
  ],
  quickPrompts: [
    "Which battlegrounds moved most in the last 72 hours?",
    "Summarize fundraising risk across top senate races.",
    "What is the fastest path to improve win probability in Georgia?",
    "Draft an executive memo on affordability message pressure."
  ],
  conversation: [
    {
      role: "assistant",
      title: "AI Analyst Brief",
      text: "National control probability improved modestly overnight, driven by suburban persuasion gains and stronger fundraising posture in Georgia and Pennsylvania."
    }
  ],
  outputs: [
    {
      type: "Executive Memo",
      title: "National battleground briefing",
      note: "Combines map movement, donor confidence, and war room pressure into one brief."
    },
    {
      type: "Rapid Response",
      title: "Affordability rebuttal framework",
      note: "Turnkey response structure for cost-of-living attacks across paid and earned media."
    }
  ]
};

export default function AIChat() {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [prompt, setPrompt] = useState("");
  const [chatData, setChatData] = useState(fallbackData);

  const demoMode =
    typeof window !== "undefined" &&
    localStorage.getItem("vs_demo_mode") === "1";

  useEffect(() => {
    let active = true;

    async function loadAIChat() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/platform/ai-chat", {
          timeout: 6000
        });

        if (!active) return;

        const payload = response?.data || fallbackData;

        setChatData({
          metrics: payload.metrics?.length ? payload.metrics : fallbackData.metrics,
          quickPrompts: payload.quickPrompts?.length ? payload.quickPrompts : fallbackData.quickPrompts,
          conversation: payload.conversation?.length ? payload.conversation : fallbackData.conversation,
          outputs: payload.outputs?.length ? payload.outputs : fallbackData.outputs
        });
      } catch (err) {
        if (!active) return;

        setError(
          err?.response?.data?.error ||
            err?.message ||
            "Failed to load AI workspace"
        );

        setChatData(fallbackData);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAIChat();

    return () => {
      active = false;
    };
  }, []);

  async function sendPrompt(textToSend) {
    const trimmed = String(textToSend || "").trim();
    if (!trimmed) return;

    const userMessage = {
      role: "user",
      title: "Prompt",
      text: trimmed
    };

    setChatData((prev) => ({
      ...(prev || fallbackData),
      conversation: [...(prev?.conversation || []), userMessage]
    }));

    setPrompt("");
    setSending(true);
    setError("");

    try {
      const response = await api.post(
        "/platform/ai-chat",
        { prompt: trimmed },
        { timeout: 10000 }
      );

      const answerText =
        response?.data?.answer ||
        "VoterSpheres AI completed the analysis request.";

      const assistantMessage = {
        role: "assistant",
        title: "AI Response",
        text: answerText
      };

      setChatData((prev) => ({
        ...(prev || fallbackData),
        conversation: [...(prev?.conversation || []), assistantMessage],
        outputs: [
          {
            type: "AI Output",
            title: "Fresh strategic response",
            note: answerText
          },
          ...(prev?.outputs || [])
        ].slice(0, 6)
      }));
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to run AI prompt"
      );

      const assistantMessage = {
        role: "assistant",
        title: "AI Response",
        text:
          "The live AI route did not respond, so the demo workspace stayed active with fallback intelligence."
      };

      setChatData((prev) => ({
        ...(prev || fallbackData),
        conversation: [...(prev?.conversation || []), assistantMessage]
      }));
    } finally {
      setSending(false);
    }
  }

  const conversation = useMemo(() => chatData.conversation || [], [chatData.conversation]);
  const outputs = useMemo(() => chatData.outputs || [], [chatData.outputs]);

  return (
    <PageShell
      eyebrow="AI Strategy Workspace"
      title="Ask the campaign brain what to do next."
      description="Generate strategic briefs, summarize threats, surface battleground movement, and turn campaign intelligence into clear action."
      demo={demoMode}
      demoText="Demo AI mode is active. Prompts and outputs are simulated for presentation, while still following your live AI workspace flow."
    >
      {error ? (
        <div
          className="vs-banner"
          style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}
        >
          {error}
        </div>
      ) : null}

      <div className="vs-grid-4">
        {(chatData.metrics || []).map((metric, index) => (
          <StatCard
            key={`${metric.label}-${index}`}
            label={metric.label}
            value={metric.value}
            delta={metric.delta}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="vs-grid-2">
        <SectionCard
          title="AI Console"
          subtitle="Ask strategic questions and generate campaign-ready outputs."
        >
          <div className="vs-card-muted">
            <textarea
              className="vs-textarea"
              style={{ minHeight: "120px", resize: "none", background: "var(--vs-surface)" }}
              placeholder="Ask VoterSpheres AI what matters most right now..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap"
              }}
            >
              <button
                type="button"
                className="vs-button vs-button-primary"
                onClick={() => sendPrompt(prompt)}
                disabled={sending || !String(prompt || "").trim()}
              >
                {sending ? "Running AI..." : "Run Analysis"}
              </button>

              <button
                type="button"
                className="vs-button vs-button-secondary"
                onClick={() => setPrompt("")}
              >
                Clear
              </button>
            </div>
          </div>

          <div style={{ marginTop: "1.25rem" }}>
            <div className="vs-section-subtitle" style={{ marginTop: 0, marginBottom: "0.75rem" }}>
              Suggested Prompts
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              {(chatData.quickPrompts || []).map((item) => (
                <PromptChip key={item} text={item} onClick={setPrompt} />
              ))}
            </div>
          </div>

          <div className="vs-stack" style={{ marginTop: "1.5rem" }}>
            {loading ? (
              <EmptyState text="Loading AI conversation..." />
            ) : !conversation.length ? (
              <EmptyState text="No AI conversation yet." />
            ) : (
              conversation.map((item, index) => (
                <MessageBubble key={`${item.role}-${index}-${item.title || "msg"}`} item={item} />
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Generated Outputs"
          subtitle="Recent strategic artifacts created by the AI workspace."
        >
          <div className="vs-stack">
            {loading ? (
              <EmptyState text="Loading generated outputs..." />
            ) : !outputs.length ? (
              <EmptyState text="No generated outputs available." />
            ) : (
              outputs.map((item, index) => (
                <OutputCard key={`${item.type}-${index}-${item.title}`} item={item} />
              ))
            )}
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
