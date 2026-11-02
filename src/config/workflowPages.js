export const workflowPages = {
  "/candidates": {purpose: "Research candidate profiles, then continue to finance or fundraising with the selected FEC identity.", next: ["/campaign-finance-intelligence", "/fundraising"]},
  "/executive-workspace": {purpose: "Start here: review today's priorities, then open the evidence or assigned work.", next: ["/executive-intelligence", "/command-center"]},
  "/executive-intelligence": {purpose: "Understand the evidence across workspaces before choosing a response.", next: ["/executive-decision-intelligence", "/executive-workspace"]},
  "/executive-ai-command-platform": {purpose: "Ask Executive AI for analysis and develop mission packages for leadership review.", next: ["/executive-decision-intelligence", "/mission-control"]},
  "/mission-control": {purpose: "Monitor urgent interventions and mission exceptions; manage assigned work in Command Center.", next: ["/command-center", "/executive-ai-command-platform"]},
  "/executive-decision-intelligence": {purpose: "Compare options, confidence, and consequences before moving a decision into execution.", next: ["/command-center", "/executive-intelligence"]},
  "/national-command": {purpose: "Review the national portfolio; use Executive Workspace for daily priorities.", next: ["/executive-workspace", "/state-operations"]},
  "/dashboard": {purpose: "Legacy operating snapshot. Start in Executive Workspace for the current daily workflow.", next: ["/executive-workspace"]},
  "/political-intelligence": {purpose: "Primary graph: investigate entities, their connections, and the evidence behind them.", next: ["/dark-money-exposure", "/command-center"]},
  "/relationship-graph": {purpose: "Specialist relationship view. Use Political Intelligence Graph as your main network entry point.", next: ["/political-intelligence"]},
  "/political-graph": {purpose: "Specialist political network analysis. Return to the primary graph for the broader intelligence picture.", next: ["/political-intelligence"]},
  "/platform-intelligence": {purpose: "Inspect graph coverage and sources; explore connected entities in the primary graph.", next: ["/political-intelligence"]},
  "/state-operations": {purpose: "Primary operations entry: choose a state, inspect county or parish conditions, and route work to Command Center.", next: ["/command-center", "/vendors"]},
  "/state-operations-map": {purpose: "Specialist map view of state execution. Use State Operations for the state-to-county workflow.", next: ["/state-operations", "/command-center"]},
  "/operations-map": {purpose: "Review executive geographic posture; open State Operations to investigate local execution.", next: ["/state-operations"]},
  "/map": {purpose: "Explore election geography and races. Use State Operations for delivery and execution.", next: ["/candidates", "/state-operations"]},
  "/campaign-finance-intelligence": {purpose: "Assess financial position, disclosures, reserves, and committee support. Continue to Fundraising Intelligence for performance comparisons.", next: ["/fundraising", "/donors"]},
  "/fundraising": {purpose: "Compare fundraising performance and funding sources. Return to Campaign Finance for the broader disclosure picture.", next: ["/campaign-finance-intelligence", "/donors"]},
  "/command-center": {purpose: "Execute approved work: manage tasks, deadlines, and exceptions. Open Task Ownership to balance assignments.", next: ["/task-ownership", "/state-operations"]},
  "/task-ownership": {purpose: "Assign owners and balance team workload. Return to Command Center for the full execution board.", next: ["/command-center"]}
};
export function workflowPage(pathname) { return workflowPages[pathname] || (pathname.startsWith("/state-operations/") ? {purpose: "Review county and parish conditions, then continue into execution.", next: ["/state-operations", "/command-center"]} : null); }
