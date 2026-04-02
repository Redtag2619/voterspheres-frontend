import React, { useCallback, useState } from "react";
import TerminalPage from "../components/ui/TerminalPage";
import Panel from "../components/ui/Panel";
import LoadingState from "../components/ui/LoadingState";
import ErrorState from "../components/ui/ErrorState";
import { useApiResource } from "../hooks/useApiResource";
import { api } from "../services/api";

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
    "What is the fastest path to improve win probability in Arizona?"
  ],
  conversation: [
    {
      role: "assistant",
      title: "AI Analyst Brief",
      text: "National control probability improved modestly overnight, driven by suburban persuasion gains."
    }
  ],
  outputs: [
    {
      type: "Executive Memo",
      title: "National battleground briefing",
      note: "Combines map movement, donor confidence, and war room pressure into one brief."
    }
  ]
};

const AIChat = () => {
  const fetcher = useCallback(() => api.aiChat(), []);
  const { data, loading, error, setData } = useApiResource(fetcher, fallbackData);
  const [prompt, setPrompt] = useState("");

  async function handleRunPrompt() {
    if (!prompt.trim()) return;

    const optimistic = {
      role: "user",
      title: "Custom Prompt",
      text: prompt
    };

    setData((prev) => ({
      ...(prev || fallbackData),
      conversation: [...((prev?.conversation) || []), optimistic]
    }));

    try {
      const result = await api.postAiPrompt({
        prompt,
        context: { page: "ai-chat" }
      });

      setData((prev) => ({
        ...(prev || fallbackData),
        conversation: [
          ...(((prev?.conversation) || [])),
          {
            role: "assistant",
            title: "AI Response",
            text: result.answer || "No response returned."
          }
        ]
      }));
    } catch (err) {
      setData((prev) => ({
        ...(prev || fallbackData),
        conversation: [
          ...(((prev?.conversation) || [])),
          {
            role: "assistant",
            title: "AI Error",
            text: err.message || "Unable to run AI analysis."
          }
        ]
      }));
    }

    setPrompt("");
  }

  return (
    <TerminalPage
      eyebrow="AI Analyst Terminal"
      title="Ask the platform what matters, why it changed, and what to do next."
      description="AI Chat turns VoterSpheres into a conversational political terminal for strategy, forecasting, donor intelligence, fundraising, and rapid-response decisions."
      metrics={data?.metrics || []}
    >
      <Panel
        title="AI Conversation Workspace"
        subtitle="Strategy dialogue, briefing generation, and cross-terminal analysis"
        action="Open full console"
        large
      >
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-aichat-console">
            <div className="vs-aichat-messages">
              {(data?.conversation || []).map(...)}
                <div key={`${item.role}-${index}`} className={`vs-aichat-message ${item.role === "assistant" ? "assistant" : "user"}`}>
                  <div className="vs-aichat-message-role">{item.role === "assistant" ? "AI" : "You"}</div>
                  <div className="vs-aichat-message-body">
                    <div className="vs-aichat-message-title">{item.title}</div>
                    <div className="vs-aichat-message-text">{item.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="vs-aichat-input-wrap">
              <textarea
                className="vs-aichat-input"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask VoterSpheres AI about race movement, donor risk, media threats, or path-to-win strategy..."
              />
              <div className="vs-aichat-actions">
                <button className="vs-btn vs-btn-primary" onClick={handleRunPrompt}>
                  Run analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Quick Prompts" subtitle="One-click questions for strategists and operators">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-aichat-prompt-list">
            {(data?.quickPrompts || []).map(...)}
              <button
                key={item}
                className="vs-aichat-prompt-item"
                onClick={() => setPrompt(item)}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Suggested Outputs" subtitle="High-value deliverables the AI can generate">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="vs-aichat-output-list">
            {(data?.outputs || []).map(...)}
              <div key={item.title} className="vs-aichat-output-item">
                <div className="vs-aichat-output-type">{item.type}</div>
                <div className="vs-aichat-output-title">{item.title}</div>
                <div className="vs-aichat-output-note">{item.note}</div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </TerminalPage>
  );
};

export default AIChat;
