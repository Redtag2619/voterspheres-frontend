import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const WorkspaceContext = createContext(null);

const ACTIVE_WORKSPACE_KEY = "vs_active_workspace";

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
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.workspaces)) return data.workspaces;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

export function WorkspaceProvider({ children }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() => getStoredWorkspaceId());
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [workspaceError, setWorkspaceError] = useState("");

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

      if (preferred) {
        setActiveWorkspaceIdState(String(preferred.id));
        setActiveWorkspace(preferred);
        setStoredWorkspaceId(preferred.id);
        api.setActiveWorkspaceId?.(preferred.id);
      } else {
        setActiveWorkspaceIdState("");
        setActiveWorkspace(null);
        setStoredWorkspaceId("");
        api.setActiveWorkspaceId?.("");
      }

      return rows;
    } catch (error) {
      setWorkspaceError(error?.response?.data?.error || error?.message || "Failed to load workspaces.");
      setWorkspaces([]);
      setActiveWorkspace(null);
      return [];
    } finally {
      setLoadingWorkspaces(false);
    }
  }, []);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const setActiveWorkspaceId = useCallback(
    (workspaceId) => {
      const nextId = String(workspaceId || "");
      const workspace =
        workspaces.find((item) => String(item.id) === nextId) ||
        activeWorkspace ||
        null;

      setActiveWorkspaceIdState(nextId);
      setActiveWorkspace(workspace && String(workspace.id) === nextId ? workspace : null);
      setStoredWorkspaceId(nextId);
      api.setActiveWorkspaceId?.(nextId);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("voterspheres:workspace-changed", {
            detail: { workspace_id: nextId }
          })
        );
      }
    },
    [activeWorkspace, workspaces]
  );

  const createWorkspace = useCallback(
    async (payload) => {
      const response = await api.createWorkspace(payload);
      const workspace = response?.workspace || response;

      await refreshWorkspaces();

      if (workspace?.id) {
        setActiveWorkspaceId(workspace.id);
      }

      return workspace;
    },
    [refreshWorkspaces, setActiveWorkspaceId]
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
