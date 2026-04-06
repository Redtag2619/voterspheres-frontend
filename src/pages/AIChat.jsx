import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
      {text}
    </div>
  );
}

function StatCard({ label, value, delta, tone = "neutral" }) {
  const toneClass =
    tone === "up"
      ? "text-emerald-600"
      : tone === "down"
      ? "text-rose-600"
      : "text-slate-500";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{value}</div>
      <div className={`mt-2 text-sm ${toneClass}`}>{delta}</div>
    </div>
  );
}

function PromptChip({ text, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(text)}
      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-[#0176D3] hover:text-[#0176D3]"
    >
      {text}
    </button>
  );
}

function MessageBubble({ item }) {
  const isAssistant = item.role === "assistant";

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        isAssistant
          ? "border-slate-200 bg-white"
          : "border-[#0176D3]/20 bg-[#0176D3]/5"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div
          className={`text-xs font-semibold uppercase tracking-[0.16em] ${
            isAssistant ? "text-[#0176D3]" : "text-slate-500"
          }`}
        >
          {isAssistant ? "AI Analyst" : "You"}
        </div>

        {item.title ? (
          <div className="text-xs text-slate-400">{item.title}</div>
        ) : null}
      </div>

      <div className="text-sm leading-6 text-slate-700">{item.text}</div>
    </div>
  );
}

function OutputCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-[#0176D3]">
            {item.type || "Output"}
          </div>
          <div className="mt-2 font-semibold text-slate-900">{item.title}</div>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
          Generated
        </span>
      </div>

      <div className="mt-3 text-sm text-slate-600">{item.note}</div>
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
          quickPrompts: payload.quickPrompts?.length
            ? payload.quickPrompts
            : fallbackData.quickPrompts,
          conversation: payload.conversation?.length
            ? payload.conversation
            : fallbackData.conversation,
          outputs: payload.outputs?.length ? payload.outputs : fallbackData.outputs
        });
      } catch (err) {
        if (!active) return;
        setError(
          err?.response?.data?.error || err?.message || "Failed to load AI workspace"
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
        err?.response?.data?.error || err?.message || "Failed to run AI prompt"
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

  const conversation = useMemo(
    () => chatData.conversation || [],
    [chatData.conversation]
  );

  const outputs = useMemo(() => chatData.outputs || [], [chatData.outputs]);

  return (
    <div className="min-h-screen bg-[#f3f6f9] p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs uppercase tracking-[0.22em] text-[#0176D3]">
              AI Strategy Workspace
            </div>

            {demoMode ? (
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Demo Mode
              </span>
            ) : null}
          </div>

          <h1 className="mt-3 text-3xl font-semibold text-slate-900">
            Ask the campaign brain what to do next.
          </h1>

          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            Generate strategic briefs, summarize threats, surface battleground movement, and turn campaign intelligence into clear action.
          </p>

          {demoMode ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Demo AI mode is active. Prompts and outputs are simulated for presentation, while still following your live AI workspace flow.
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">AI Console</h2>
              <p className="mt-1 text-sm text-slate-500">
                Ask strategic questions and generate campaign-ready outputs.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <textarea
                className="min-h-[120px] w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0176D3]"
                placeholder="Ask VoterSpheres AI what matters most right now..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => sendPrompt(prompt)}
                  disabled={sending || !String(prompt || "").trim()}
                  className="rounded-xl bg-[#0176D3] px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Running AI..." : "Run Analysis"}
                </button>

                <button
                  type="button"
                  onClick={() => setPrompt("")}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-[#0176D3]"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-3 text-sm font-semibold text-slate-900">
                Suggested Prompts
              </div>

              <div className="flex flex-wrap gap-3">
                {(chatData.quickPrompts || []).map((item) => (
                  <PromptChip key={item} text={item} onClick={setPrompt} />
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-4">
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
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900">Generated Outputs</h2>
              <p className="mt-1 text-sm text-slate-500">
                Recent strategic artifacts created by the AI workspace.
              </p>
            </div>

            <div className="space-y-4">
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
          </section>
        </div>
      </div>
    </div>
  );
}
