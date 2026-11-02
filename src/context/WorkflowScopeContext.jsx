import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {useAuth} from "./AuthContext.jsx";
import {useWorkspace} from "./WorkspaceContext.jsx";
import {cleanScope, patchScope, resolveScope, scopeIdentity, workflowHref} from "../lib/workflowScope.js";
const Context = createContext(null);
function read(key) { try { return cleanScope(JSON.parse(sessionStorage.getItem(key) || "{}")); } catch { return {}; } }
export function WorkflowScopeProvider({children}) {
  const {user} = useAuth();
  const {activeWorkspaceId, activeWorkspace} = useWorkspace();
  return <WorkflowScopeState user={user} activeWorkspaceId={activeWorkspaceId} activeWorkspace={activeWorkspace}>{children}</WorkflowScopeState>;
}
export function WorkflowScopeState({children, user, activeWorkspaceId, activeWorkspace}) {
  const location = useLocation();
  const navigate = useNavigate();
  const identity = scopeIdentity(user, activeWorkspaceId);
  const storageKey = "vs-workflow:" + identity;
  const [record, setRecord] = useState(() => ({identity, scope: read(storageKey)}));
  const remembered = record.identity === identity ? record.scope : read(storageKey);
  const previousWorkspace = useRef(activeWorkspaceId);
  // A workspace switch never imports context from the previous workspace URL.
  const switched = Boolean(previousWorkspace.current && String(previousWorkspace.current) !== String(activeWorkspaceId || ""));
  const queryWorkspace = new URLSearchParams(location.search).get("workspace_id");
  const foreignQuery = Boolean(activeWorkspaceId && queryWorkspace && queryWorkspace !== String(activeWorkspaceId));
  const pathState = /^\/state-operations\/([a-z]{2})$/i.exec(location.pathname)?.[1]?.toUpperCase();
  const scope = useMemo(() => {
    const resolved = switched || foreignQuery ? cleanScope(remembered) : resolveScope(location.search, remembered);
    return pathState ? {...resolved, state: pathState} : resolved;
  }, [switched, foreignQuery, location.search, remembered, pathState]);
  const scopeRef = useRef(scope); scopeRef.current = scope;
  useEffect(() => {
    if (switched || foreignQuery) {
      const params = new URLSearchParams(location.search);
      for (const key of ["workflow", "cycle", "state", "office", "party", "candidate_id", "task_scope", "workspace_id"]) params.delete(key);
      navigate({pathname: location.pathname, search: params.toString(), hash: location.hash}, {replace: true});
    }
    if (activeWorkspaceId) previousWorkspace.current = activeWorkspaceId;
  }, [identity, switched, foreignQuery, location.pathname, location.search, location.hash, navigate]);
  const signature = JSON.stringify(scope);
  useEffect(() => {
    const next = JSON.parse(signature);
    setRecord(prev => prev.identity === identity && JSON.stringify(prev.scope) === signature ? prev : {identity, scope: next});
    try { sessionStorage.setItem(storageKey, signature); } catch { /* storage may be disabled */ }
  }, [identity, storageKey, signature]);
  const updateScope = useCallback(patch => {
    const next = patchScope(scopeRef.current, patch);
    scopeRef.current = next;
    setRecord({identity, scope: next});
    const href = workflowHref(location.pathname + location.search, next, activeWorkspaceId) + location.hash;
    navigate(href, {replace: true});
  }, [identity, location.pathname, location.search, location.hash, activeWorkspaceId, navigate]);
  const href = useCallback(path => workflowHref(path, scope, activeWorkspaceId), [signature, activeWorkspaceId]);
  return <Context.Provider value={{scope, updateScope, href, activeWorkspaceId, activeWorkspace}}>{children}</Context.Provider>;
}
export function useWorkflowScope() { const value = useContext(Context); if (!value) throw new Error("WorkflowScopeProvider is required"); return value; }
export function useOptionalWorkflowScope() { return useContext(Context); }
export function useWorkflowFilters(defaults) {
  const {scope, updateScope} = useWorkflowScope();
  const [local, setLocal] = useState(defaults);
  const keys = useRef(["state", "office", "party", "cycle"].filter(key => key in defaults));
  const filters = useMemo(() => {
    const next = {...local};
    for (const key of keys.current) next[key] = scope[key] || (key === "cycle" ? local.cycle : "");
    return next;
  }, [local, scope]);
  const latest = useRef(filters); latest.current = filters;
  const setFilters = useCallback(next => {
    const value = typeof next === "function" ? next(latest.current) : next;
    setLocal(value);
    const patch = {};
    for (const key of keys.current) patch[key] = value[key] || "";
    updateScope(patch);
  }, [updateScope]);
  return [filters, setFilters];
}

export function useWorkflowField(key) {
  const {scope, updateScope} = useWorkflowScope();
  const value = scope[key] || "";
  const latest = useRef(value); latest.current = value;
  const update = useCallback(next => updateScope({[key]: typeof next === "function" ? next(latest.current) : next}), [key, updateScope]);
  return [value, update];
}
