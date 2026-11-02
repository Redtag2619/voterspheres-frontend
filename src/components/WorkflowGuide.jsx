import {Link, useLocation} from "react-router-dom";
import {useAuth} from "../context/AuthContext.jsx";
import {useWorkflowScope} from "../context/WorkflowScopeContext.jsx";
import {workflowPage} from "../config/workflowPages.js";
import {flattenedNavigation} from "../config/navigation.js";
import {canAccessRoute} from "../lib/entitlements.js";
import {hasAllPermissions, PERMISSIONS} from "../lib/permissions.js";
import {cycleOptions, initialCycle} from "../lib/electionCycleOptions.js";
import "./WorkflowGuide.css";
const commandRoutes = new Set(["/executive-intelligence", "/executive-ai-command-platform", "/mission-control", "/executive-decision-intelligence", "/political-intelligence", "/dark-money-exposure", "/state-operations", "/command-center", "/task-ownership", "/vendors", "/operations-map"]);
const permissions = {"/campaign-finance-intelligence": PERMISSIONS.VIEW_FUNDRAISING, "/fundraising": PERMISSIONS.VIEW_FUNDRAISING, "/donors": PERMISSIONS.VIEW_DONORS, "/candidates": PERMISSIONS.VIEW_CANDIDATES, "/vendors": PERMISSIONS.VIEW_VENDORS};
export default function WorkflowGuide() {
  const {pathname} = useLocation();
  const auth = useAuth();
  const {scope, updateScope, href, activeWorkspace, activeWorkspaceId} = useWorkflowScope();
  const page = workflowPage(pathname);
  if (!page) return null;
  const links = page.next.filter(path => canAccessRoute({...auth, pathname: path}) && hasAllPermissions(auth.user, [permissions[path] || (commandRoutes.has(path) ? PERMISSIONS.VIEW_COMMAND_CENTER : null)].filter(Boolean)));
  const finance = ["/campaign-finance-intelligence", "/fundraising"].includes(pathname);
  return <aside className="vs-workflow-guide" aria-label="Page purpose and next steps">
    <p>{page.purpose}</p>
    <div className="vs-workflow-context">
      {activeWorkspace?.name && <span>Workspace: {activeWorkspace.name}</span>}
      {scope.state && <span>State: {scope.state}</span>}
      {scope.candidate_id && <span>Selected candidate: {scope.candidate_id}</span>}
      {["/command-center", "/task-ownership"].includes(pathname) && activeWorkspaceId && <label>Task list <select value={scope.task_scope || "workspace"} onChange={e => updateScope({task_scope: e.target.value})}><option value="workspace">Active workspace</option><option value="firm">All firm workspaces</option></select></label>}
      {finance && <label>Election cycle <select value={scope.cycle || initialCycle("CampaignFinanceIntelligencePlatform", {historical: true})} onChange={e => updateScope({cycle: e.target.value, candidate_id: ""})}><option value="" disabled>Select cycle</option>{cycleOptions({historical: true, selected: scope.cycle}).map(year => <option key={year} value={year}>{year}</option>)}</select></label>}
      {!finance && scope.cycle && <span>Carried election cycle: {scope.cycle}</span>}
    </div>
    {(scope.state || scope.candidate_id || scope.office || scope.party) && !pathname.startsWith("/state-operations/") && <button type="button" onClick={() => updateScope({state: "", office: "", party: "", candidate_id: ""})}>Clear carried filters</button>}
    {finance && scope.candidate_id && <small>The selected FEC identity is retained. If it is outside the returned results, clear carried filters or select another candidate.</small>}
    {links.length > 0 && <nav aria-label="Continue this workflow">{links.map(path => <Link key={path} to={href(path)}>{flattenedNavigation.find(item => item.to === path)?.label || path}</Link>)}</nav>}
    {["/command-center", "/task-ownership"].includes(pathname) && <small>The task list follows the workspace view selected above{scope.state ? ` and state ${scope.state}` : ""}. Overview and workload summaries keep their original scope.</small>}
    {!finance && (scope.cycle || scope.candidate_id) && <small>Context follows your links; this page applies its own available filters.</small>}
  </aside>;
}
