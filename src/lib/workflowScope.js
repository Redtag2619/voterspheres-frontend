export const SCOPE_KEYS = ["cycle", "state", "office", "party", "candidate_id", "task_scope"];
export function cleanScope(input = {}) {
  const out = {};
  if (["workspace", "firm"].includes(input.task_scope)) out.task_scope = input.task_scope;
  const cycle = Number(input.cycle);
  if (Number.isInteger(cycle) && cycle >= 2000 && cycle <= 2200 && cycle % 2 === 0) out.cycle = String(cycle);
  if (/^[A-Z]{2}$/.test(String(input.state || "").toUpperCase())) out.state = String(input.state).toUpperCase();
  if (/^[HSP][A-Z0-9]{8}$/i.test(String(input.candidate_id || ""))) out.candidate_id = String(input.candidate_id).toUpperCase();
  for (const key of ["office", "party"]) {
    const value = String(input[key] || "").trim();
    if (value && value.length <= 100 && /^[\w .'-]+$/.test(value)) out[key] = value;
  }
  return out;
}
export function scopeFromSearch(search) { return cleanScope(Object.fromEntries(new URLSearchParams(search))); }
export function workflowHref(path, scope, workspaceId) {
  const [route, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set("workflow", "1");
  for (const key of SCOPE_KEYS) params.set(key, cleanScope(scope)[key] || "");
  if (workspaceId) params.set("workspace_id", String(workspaceId));
  return route + "?" + params.toString();
}
export function scopeIdentity(user, workspaceId) {
  return [user?.firm_id || user?.firm?.id || "", user?.id || "", workspaceId || ""].map(encodeURIComponent).join(":");
}
export function resolveScope(search, remembered = {}) {
  const query = new URLSearchParams(search);
  // Complete workflow URLs are history snapshots: an empty field clears it.
  return query.get("workflow") === "1" ? scopeFromSearch(search) : {...cleanScope(remembered), ...scopeFromSearch(search)};
}
export function patchScope(scope, patch) { return cleanScope({...scope, ...patch}); }

export function taskMatchesWorkflow(task, scope, workspaceId) {
  if (workspaceId && scope.task_scope !== "firm" && String(task.workspace_id || "") !== String(workspaceId)) return false;
  const metadata = task.metadata && typeof task.metadata === "object" ? task.metadata : {};
  return !scope.state || String(task.state || task.state_code || metadata.state || "").toUpperCase() === scope.state;
}
