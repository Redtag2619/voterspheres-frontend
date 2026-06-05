import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

import PageShell from "../components/ui/PageShell";
import SectionCard from "../components/ui/SectionCard";
import StatCard from "../components/ui/StatCard";
import Badge from "../components/ui/Badge";
import EmptyState from "../components/ui/EmptyState";

function arr(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.threads)) return value.threads;
  if (Array.isArray(value?.messages)) return value.messages;
  return [];
}

function clean(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function fmtDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

const quickPrompts = [
  "What should we do in the next 24 hours?",
  "What are the biggest threats right now?",
  "What tasks need owners?",
  "What CRM follow-ups should we prioritize?",
  "What should we do in PA this week?",
  "What report should I generate for a client?",
];

export default function AICampaignCopilot() {
  const [threads, setThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [threadId, setThreadId] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const loadThreads = useCallback(async () => {
    try {
      setLoadingThreads(true);
      setError("");

      const result = await api.aiCampaignCopilotThreads();
      const rows = arr(result);
      setThreads(rows);

      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to load Co-Pilot threads."
      );
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  async function openThread(id) {
    try {
      setError("");
      const result = await api.aiCampaignCopilotThread(id);
      setThreadId(result?.thread?.id || id);
      setMessages(arr(result?.messages));
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Failed to open thread.");
    }
  }

  async function ask(nextPrompt = prompt) {
    const value = clean(nextPrompt);
    if (!value) return;

    const optimisticUser = {
      id: `local-user-${Date.now()}`,
      role: "user",
      content: value,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUser]);
    setPrompt("");
    setAsking(true);
    setError("");
    setMessage("");

    try {
      const result = await api.askAiCampaignCopilot({
        prompt: value,
        thread_id: threadId || null,
      });

      setThreadId(result?.thread_id || threadId);

      const assistantMessage = result?.message || {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result?.answer || "No answer returned.",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setMessage("Co-Pilot answered using live VoterSpheres intelligence.");
      await loadThreads();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to ask Co-Pilot."
      );
    } finally {
      setAsking(false);
    }
  }

  function startNewThread() {
    setThreadId(null);
    setMessages([]);
    setPrompt("");
    setMessage("Started a new Co-Pilot conversation.");
  }

  async function copyLastAnswer() {
    const lastAssistant = [...messages].reverse().find((item) => item.role === "assistant");
    if (!lastAssistant?.content) return;

    await navigator.clipboard.writeText(lastAssistant.content);
    setMessage("Last answer copied.");
  }

  const stats = useMemo(() => {
    return {
      threads: threads.length,
      messages: messages.length,
      assistant: messages.filter((item) => item.role === "assistant").length,
      user: messages.filter((item) => item.role === "user").length,
    };
  }, [threads, messages]);

  return (
    <PageShell
      eyebrow="AI Campaign Co-Pilot"
      title="AI Campaign Co-Pilot"
      description="Ask strategic campaign questions and get answers grounded in Mission Control, War Room, Strategic Advisor, reports, CRM, tasks, signals, and workspaces."
      tickerItems={[
        { label: "Threads", value: `${stats.threads}`, dotClass: "vs-live-dot-success" },
        { label: "Messages", value: `${stats.messages}`, dotClass: "vs-live-dot-success" },
        { label: "Mode", value: asking ? "Thinking" : "Ready", dotClass: asking ? "vs-live-dot-warning" : "vs-live-dot-success" },
        { label: "Updated", value: lastUpdated || "Ready", dotClass: "vs-live-dot-success" },
      ]}
    >
      <style>{`
        .copilot-grid {
          display: grid;
          grid-template-columns: minmax(320px, 0.36fr) minmax(0, 1fr);
          gap: 18px;
          align-items: start;
        }

        .copilot-stack {
          display: grid;
          gap: 14px;
        }

        .copilot-thread {
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(15, 23, 42, 0.58);
          padding: 12px;
          cursor: pointer;
        }

        .copilot-thread strong {
          display: block;
          color: white;
          font-size: 13px;
          line-height: 1.35;
        }

        .copilot-thread span {
          display: block;
          margin-top: 5px;
          color: rgba(203, 213, 225, 0.62);
          font-size: 11px;
        }

        .copilot-chat {
          min-height: 560px;
          display: grid;
          grid-template-rows: minmax(0, 1fr) auto;
          gap: 14px;
        }

        .copilot-messages {
          display: grid;
          gap: 12px;
          align-content: start;
          max-height: 620px;
          overflow: auto;
          padding-right: 4px;
        }

        .copilot-bubble {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          padding: 14px;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          font-size: 13px;
          line-height: 1.6;
        }

        .copilot-bubble.user {
          background: rgba(37, 99, 235, 0.18);
          color: rgba(239, 246, 255, 0.95);
          margin-left: 48px;
        }

        .copilot-bubble.assistant {
          background:
            radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 34%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.86), rgba(2, 6, 23, 0.62));
          color: rgba(226, 232, 240, 0.95);
          margin-right: 48px;
        }

        .copilot-bubble small {
          display: block;
          margin-bottom: 8px;
          color: rgba(203, 213, 225, 0.56);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 900;
        }

        .copilot-input {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 10px;
        }

        .copilot-input textarea {
          width: 100%;
          min-height: 78px;
          border-radius: 18px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.74);
          color: white;
          padding: 12px;
          outline: none;
          resize: vertical;
        }

        .copilot-quick {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .copilot-quick button {
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.62);
          color: rgba(226, 232, 240, 0.9);
          border-radius: 999px;
          padding: 8px 10px;
          cursor: pointer;
          font-size: 12px;
        }

        .copilot-message {
          border-radius: 16px;
          border: 1px solid rgba(96, 165, 250, 0.24);
          background: rgba(37, 99, 235, 0.14);
          color: rgba(226, 232, 240, 0.92);
          padding: 12px;
        }

        @media (max-width: 1100px) {
          .copilot-grid,
          .copilot-input {
            grid-template-columns: 1fr;
          }

          .copilot-bubble.user,
          .copilot-bubble.assistant {
            margin-left: 0;
            margin-right: 0;
          }
        }
      `}</style>

      {error ? <div className="vs-banner vs-banner-danger">{error}</div> : null}
      {message ? <div className="copilot-message">{message}</div> : null}

      <div className="vs-grid-4">
        <StatCard label="Threads" value={stats.threads} delta="Saved conversations" tone="up" />
        <StatCard label="Messages" value={stats.messages} delta="Current thread" tone="neutral" />
        <StatCard label="Answers" value={stats.assistant} delta="Co-Pilot responses" tone="up" />
        <StatCard label="Status" value={asking ? "Thinking" : "Ready"} delta="Live intelligence context" tone={asking ? "neutral" : "up"} />
      </div>

      <div className="copilot-grid">
        <div className="copilot-stack">
          <SectionCard
            title="Conversations"
            subtitle="Saved Co-Pilot threads."
            right={<Badge tone="accent">{threads.length}</Badge>}
          >
            <div className="copilot-stack">
              <button className="vs-button" onClick={startNewThread}>
                New Conversation
              </button>

              {loadingThreads ? (
                <EmptyState text="Loading conversations..." />
              ) : !threads.length ? (
                <EmptyState text="No Co-Pilot conversations yet." />
              ) : (
                threads.map((thread) => (
                  <div key={thread.id} className="copilot-thread" onClick={() => openThread(thread.id)}>
                    <strong>{thread.title || "Campaign Co-Pilot Conversation"}</strong>
                    <span>{fmtDate(thread.updated_at)}</span>
                  </div>
                ))
              )}
            </div>
          </SectionCard>

          <SectionCard title="Quick Prompts" subtitle="Start with one click.">
            <div className="copilot-quick">
              {quickPrompts.map((item) => (
                <button key={item} type="button" onClick={() => ask(item)} disabled={asking}>
                  {item}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Operating Links" subtitle="Jump to source systems.">
            <div className="copilot-stack">
              <Link className="vs-button vs-button-secondary" to="/war-room">Election War Room</Link>
              <Link className="vs-button vs-button-secondary" to="/mission-control">Mission Control</Link>
              <Link className="vs-button vs-button-secondary" to="/strategic-advisor">Strategic Advisor</Link>
              <Link className="vs-button vs-button-secondary" to="/intelligence-reports">Reports</Link>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="Campaign Co-Pilot"
          subtitle="Ask what to do next, where pressure is rising, which tasks need owners, or what to tell a client."
          right={<Badge tone={asking ? "demo" : "active"}>{asking ? "Thinking" : "Ready"}</Badge>}
        >
          <div className="copilot-chat">
            <div className="copilot-messages">
              {!messages.length ? (
                <EmptyState text="Ask the Co-Pilot a campaign strategy question." />
              ) : (
                messages.map((item) => (
                  <div key={item.id || `${item.role}-${item.created_at}`} className={`copilot-bubble ${item.role}`}>
                    <small>{item.role === "assistant" ? "AI Campaign Co-Pilot" : "You"} • {fmtDate(item.created_at)}</small>
                    {item.content}
                  </div>
                ))
              )}
            </div>

            <div className="copilot-stack">
              <div className="copilot-input">
                <textarea
                  placeholder="Ask: What should we do in Pennsylvania this week?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                      ask();
                    }
                  }}
                />

                <button className="vs-button" onClick={() => ask()} disabled={asking || !prompt.trim()}>
                  {asking ? "Thinking..." : "Ask"}
                </button>
              </div>

              <button className="vs-button vs-button-secondary" onClick={copyLastAnswer} disabled={!messages.some((item) => item.role === "assistant")}>
                Copy Last Answer
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}
