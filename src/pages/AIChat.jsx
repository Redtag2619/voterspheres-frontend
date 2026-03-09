import React from "react";

const topMetrics = [
  { label: "AI Queries Today", value: "184", delta: "+26%", tone: "up" },
  { label: "Briefs Generated", value: "39", delta: "+11", tone: "up" },
  { label: "Strategic Alerts Referenced", value: "72", delta: "+8", tone: "up" },
  { label: "Response Confidence", value: "91%", delta: "+2.4", tone: "up" }
];

const quickPrompts = [
  "Which battlegrounds moved most in the last 72 hours?",
  "Summarize fundraising risk across top senate races.",
  "What is the fastest path to improve win probability in Arizona?",
  "Generate a morning brief for the finance team.",
  "Which donor networks are softening after press volatility?",
  "Write a rapid-response memo for cost-of-living attacks."
];

const conversationFeed = [
  {
    role: "user",
    title: "Morning strategy brief",
    text: "Give me a national summary of race movement, donor signals, and top war room threats before 9 AM."
  },
  {
    role: "assistant",
    title: "AI Analyst Brief",
    text: "National control probability improved modestly overnight, driven by suburban persuasion gains in Pennsylvania and Arizona. Donor confidence remains strongest in digital small-dollar channels, while Mountain West business networks show softening. Highest-priority war room threat is the affordability attack cluster spreading in suburban paid media."
  },
  {
    role: "user",
    title: "Fundraising pressure check",
    text: "Which campaigns have the highest finance risk if press conditions worsen this week?"
  },
  {
    role: "assistant",
    title: "AI Risk View",
    text: "Wisconsin and Michigan profiles remain most exposed. Both are more sensitive to confidence shocks in bundler and business-donor segments if local press turns negative."
  }
];

const capabilities = [
  {
    title: "Executive Briefs",
    detail: "Generate morning memos, race summaries, finance briefs, and campaign snapshots in seconds."
  },
  {
    title: "Cross-Page Intelligence",
    detail: "Pull insights from forecast, war room, donors, rankings, fundraising, and map signals into one answer."
  },
  {
    title: "Rapid Response Drafting",
    detail: "Create statements, surrogates notes, rebuttals, digital copy, and campaign memos from live threat context."
  },
  {
    title: "Scenario Explanation",
    detail: "Ask why a race moved, what variable matters most, and which actions change the path to victory."
  }
];

const suggestedOutputs = [
  {
    type: "Executive Memo",
    title: "National battleground briefing",
    note: "Combines map movement, donor confidence, and war room pressure into one leadership brief."
  },
  {
    type: "Finance Brief",
    title: "Donor network risk update",
    note: "Summarizes donor softness, bundler strength, and capital-flow shifts by region."
  },
  {
    type: "Rapid Response",
    title: "Affordability rebuttal package",
    note: "Drafts talking points, press statement, and digital response structure."
  },
  {
    type: "Scenario Note",
    title: "Path-to-win analysis",
    note: "Explains the highest-leverage changes that would improve race probability."
  }
];

const aiGuardrails = [
  {
    title: "Grounded in platform signals",
    detail: "Responses should reflect current forecast, fundraising, donor, and war room context."
  },
  {
    title: "Decision-focused output",
    detail: "Every answer should help a strategist decide what matters, what changed, and what to do next."
  },
  {
    title: "Brief-friendly formatting",
    detail: "Outputs should be easy to paste into memos, decks, and rapid-response workflows."
  }
];

function AIChat() {
  return (
    <div className="vs-aichat-page">
      <section className="vs-aichat-hero vs-card">
        <div>
          <div className="vs-section-eyebrow">AI Analyst Terminal</div>
          <h1 className="vs-aichat-title">
            Ask the platform what matters, why it changed, and what to do next.
          </h1>
          <p className="vs-aichat-copy">
            AI Chat turns VoterSpheres into a conversational political terminal for strategy, forecasting, donor intelligence, fundraising, and rapid-response decisions.
          </p>
        </div>

        <div className="vs-aichat-hero-grid">
          {topMetrics.map((item) => (
            <div key={item.label} className="vs-aichat-stat-card">
              <div className="vs-aichat-stat-label">{item.label}</div>
              <div className="vs-aichat-stat-value">{item.value}</div>
              <div className={`vs-aichat-stat-delta ${item.tone}`}>{item.delta}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="vs-aichat-grid">
        <div className="vs-card vs-aichat-panel vs-aichat-panel-large">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">AI Conversation Workspace</div>
              <div className="vs-card-subtitle">
                Strategy dialogue, briefing generation, and cross-terminal analysis
              </div>
            </div>
            <button className="vs-card-link">Open full console</button>
          </div>

          <div className="vs-aichat-console">
            <div className="vs-aichat-messages">
              {conversationFeed.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`vs-aichat-message ${item.role === "assistant" ? "assistant" : "user"}`}
                >
                  <div className="vs-aichat-message-role">
                    {item.role === "assistant" ? "AI" : "You"}
                  </div>
                  <div className="vs-aichat-message-body">
                    <div className="vs-aichat-message-title">{item.title}</div>
                    <div className="vs-aichat-message-text">{item.text}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="vs-aichat-input-wrap">
              <div className="vs-aichat-input">
                Ask VoterSpheres AI about race movement, donor risk, media threats, or path-to-win strategy...
              </div>
              <div className="vs-aichat-actions">
                <button className="vs-btn vs-btn-secondary">Attach context</button>
                <button className="vs-btn vs-btn-primary">Run analysis</button>
              </div>
            </div>
          </div>
        </div>

        <div className="vs-card vs-aichat-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Quick Prompts</div>
              <div className="vs-card-subtitle">
                One-click questions for strategists and operators
              </div>
            </div>
          </div>

          <div className="vs-aichat-prompt-list">
            {quickPrompts.map((item) => (
              <div key={item} className="vs-aichat-prompt-item">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-aichat-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Capabilities</div>
              <div className="vs-card-subtitle">
                What the AI layer should do inside the terminal
              </div>
            </div>
          </div>

          <div className="vs-aichat-capability-list">
            {capabilities.map((item) => (
              <div key={item.title} className="vs-aichat-capability-item">
                <div className="vs-aichat-capability-title">{item.title}</div>
                <div className="vs-aichat-capability-detail">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-aichat-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">Suggested Outputs</div>
              <div className="vs-card-subtitle">
                High-value deliverables the AI can generate
              </div>
            </div>
          </div>

          <div className="vs-aichat-output-list">
            {suggestedOutputs.map((item) => (
              <div key={item.title} className="vs-aichat-output-item">
                <div className="vs-aichat-output-type">{item.type}</div>
                <div className="vs-aichat-output-title">{item.title}</div>
                <div className="vs-aichat-output-note">{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="vs-card vs-aichat-panel">
          <div className="vs-card-header">
            <div>
              <div className="vs-card-title">AI Guardrails</div>
              <div className="vs-card-subtitle">
                Principles for high-trust, decision-grade responses
              </div>
            </div>
          </div>

          <div className="vs-aichat-guardrail-list">
            {aiGuardrails.map((item) => (
              <div key={item.title} className="vs-aichat-guardrail-item">
                <div className="vs-aichat-guardrail-title">{item.title}</div>
                <div className="vs-aichat-guardrail-detail">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default AIChat;
