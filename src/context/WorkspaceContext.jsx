import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api } from "../services/api";

 

const WorkspaceContext = createContext(null);

 

const ACTIVE_WORKSPACE_KEY = "vs_active_workspace";

const INACTIVE_WORKSPACE_STATUSES = new Set([

  "archived",

  "inactive",

  "disabled",

]);

 

function getStoredWorkspaceId() {

  if (typeof window === "undefined") return "";

  return localStorage.getItem(ACTIVE_WORKSPACE_KEY) || "";

}

 

function setStoredWorkspaceId(workspaceId = "") {

  if (typeof window === "undefined") return;

 

  if (workspaceId) {

    localStorage.setItem(ACTIVE_WORKSPACE_KEY, String(workspaceId));

  } else {

    localStorage.removeItem(ACTIVE_WORKSPACE_KEY);

  }

}

 

function normalizeWorkspaces(data = {}) {

  const rows = Array.isArray(data)

    ? data

    : Array.isArray(data.results)

      ? data.results

      : Array.isArray(data.workspaces)

        ? data.workspaces

        : Array.isArray(data.items)

          ? data.items

          : [];

 

  return rows.filter(isSelectableWorkspace);

}

 

function isSelectableWorkspace(workspace = {}) {

  if (!workspace?.id) return false;

 

  const status = String(workspace.status || "active")

    .trim()

    .toLowerCase();

 

  return !INACTIVE_WORKSPACE_STATUSES.has(status);

}

 

function dispatchWorkspaceChanged(workspaceId = "") {

  if (typeof window === "undefined") return;

 

  window.dispatchEvent(

    new CustomEvent("voterspheres:workspace-changed", {

      detail: { workspace_id: String(workspaceId || "") }

    })

  );

}

 

export function WorkspaceProvider({ children }) {

  const [workspaces, setWorkspaces] = useState([]);

  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() => getStoredWorkspaceId());

  const [activeWorkspace, setActiveWorkspace] = useState(null);

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  const [workspaceError, setWorkspaceError] = useState("");

 

  const applyActiveWorkspace = useCallback((workspace) => {

    if (workspace && isSelectableWorkspace(workspace)) {

      const nextId = String(workspace.id);

 

      setActiveWorkspaceIdState(nextId);

      setActiveWorkspace(workspace);

      setStoredWorkspaceId(nextId);

      api.setActiveWorkspaceId?.(nextId);

      dispatchWorkspaceChanged(nextId);

 

      return nextId;

    }

 

    setActiveWorkspaceIdState("");

    setActiveWorkspace(null);

    setStoredWorkspaceId("");

    api.setActiveWorkspaceId?.("");

    dispatchWorkspaceChanged("");

 

    return "";

  }, []);

 

  const refreshWorkspaces = useCallback(async () => {

    try {

      setLoadingWorkspaces(true);

      setWorkspaceError("");

 

      const data = await api.workspaces();

      const rows = normalizeWorkspaces(data);

 

      setWorkspaces(rows);

 

      const storedId = getStoredWorkspaceId();

      const preferred =

        rows.find((workspace) => String(workspace.id) === String(storedId)) ||

        rows[0] ||

        null;

 

      applyActiveWorkspace(preferred);

 

      return rows;

    } catch (error) {

      setWorkspaceError(error?.response?.data?.error || error?.message || "Failed to load workspaces.");

      setWorkspaces([]);

      setActiveWorkspace(null);

      return [];

    } finally {

      setLoadingWorkspaces(false);

    }

  }, [applyActiveWorkspace]);

 

  useEffect(() => {

    refreshWorkspaces();

  }, [refreshWorkspaces]);

 

  const setActiveWorkspaceId = useCallback(

    (workspaceId) => {

      const nextId = String(workspaceId || "").trim();

 

      if (!nextId) {

        applyActiveWorkspace(null);

        return "";

      }

 

      const workspace = workspaces.find(

        (item) => String(item.id) === nextId && isSelectableWorkspace(item)

      );

 

      if (!workspace) {

        applyActiveWorkspace(null);

        return "";

      }

 

      return applyActiveWorkspace(workspace);

    },

    [applyActiveWorkspace, workspaces]

  );

 

  const createWorkspace = useCallback(

    async (payload) => {

      const response = await api.createWorkspace(payload);

      const workspace = response?.workspace || response;

 

      const rows = await refreshWorkspaces();

 

      const createdWorkspace = workspace?.id

        ? rows.find((item) => String(item.id) === String(workspace.id))

        : null;

 

      if (createdWorkspace) {

        applyActiveWorkspace(createdWorkspace);

      }

 

      return workspace;

    },

    [applyActiveWorkspace, refreshWorkspaces]

  );

 

  const value = useMemo(

    () => ({

      workspaces,

      activeWorkspace,

      activeWorkspaceId,

      loadingWorkspaces,

      workspaceError,

      refreshWorkspaces,

      setActiveWorkspaceId,

      createWorkspace,

      hasWorkspaces: workspaces.length > 0

    }),

    [

      workspaces,

      activeWorkspace,

      activeWorkspaceId,

      loadingWorkspaces,

      workspaceError,

      refreshWorkspaces,

      setActiveWorkspaceId,

      createWorkspace

    ]

  );

 

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;

}

 

export function useWorkspace() {

  const context = useContext(WorkspaceContext);

 

  if (!context) {

    throw new Error("useWorkspace must be used within WorkspaceProvider");

  }

 

  return context;

}

