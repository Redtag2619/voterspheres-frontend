import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useWorkspace } from "./WorkspaceContext";
import { useExecutiveFilters } from "./ExecutiveFiltersContext";
import {
  createUnifiedExecutiveAction,
  fetchUnifiedExecutiveIntelligence,
  refreshUnifiedExecutiveIntelligence,
} from "../services/unifiedExecutiveIntelligenceApi";

const UnifiedExecutiveIntelligenceContext = createContext(null);

const EMPTY_DATA = {
  health: {},
  briefing: {},
  kpis: {},
  summary: {},
  workspaces: [],
  urgent_workspaces: [],
  tasks: [],
  signals: [],
  alerts: [],
  recommendations: [],
  missions: [],
  activity: [],
  source_status: [],
};

export function UnifiedExecutiveIntelligenceProvider({
  children,
  refreshIntervalMs = 30000,
}) {
  const { activeWorkspaceId, loadingWorkspaces } = useWorkspace();
  const { filters } = useExecutiveFilters();

  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const mountedRef = useRef(true);

  const requestFilters = useMemo(
    () => ({
      workspace_id: activeWorkspaceId || "",
      state: filters?.state || "",
      office: filters?.office || "",
      risk: filters?.risk || "",
    }),
    [
      activeWorkspaceId,
      filters?.state,
      filters?.office,
      filters?.risk,
    ]
  );

  const load = useCallback(
    async ({ quiet = false, force = false } = {}) => {
      try {
        if (quiet) setRefreshing(true);
        else setLoading(true);

        setError("");

        const result = force
          ? await refreshUnifiedExecutiveIntelligence(requestFilters)
          : await fetchUnifiedExecutiveIntelligence(requestFilters);

        if (!mountedRef.current) return result;

        setData({
          ...EMPTY_DATA,
          ...(result || {}),
          health: result?.health || {},
          briefing: result?.briefing || {},
          kpis: result?.kpis || {},
          summary: result?.summary || {},
          workspaces: Array.isArray(result?.workspaces) ? result.workspaces : [],
          urgent_workspaces: Array.isArray(result?.urgent_workspaces)
            ? result.urgent_workspaces
            : [],
          tasks: Array.isArray(result?.tasks) ? result.tasks : [],
          signals: Array.isArray(result?.signals) ? result.signals : [],
          alerts: Array.isArray(result?.alerts) ? result.alerts : [],
          recommendations: Array.isArray(result?.recommendations)
            ? result.recommendations
            : [],
          missions: Array.isArray(result?.missions) ? result.missions : [],
          activity: Array.isArray(result?.activity) ? result.activity : [],
          source_status: Array.isArray(result?.source_status)
            ? result.source_status
            : [],
        });

        setLastUpdated(result?.generated_at || new Date().toISOString());
        return result;
      } catch (loadError) {
        if (!mountedRef.current) return null;

        setError(
          loadError?.response?.data?.error ||
            loadError?.response?.data?.detail ||
            loadError?.message ||
            "Failed to load Unified Executive Intelligence."
        );

        return null;
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [requestFilters]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!loadingWorkspaces) load();
  }, [load, loadingWorkspaces]);

  useEffect(() => {
    if (!refreshIntervalMs || refreshIntervalMs < 10000) return undefined;

    const timer = window.setInterval(() => {
      load({ quiet: true });
    }, refreshIntervalMs);

    return () => window.clearInterval(timer);
  }, [load, refreshIntervalMs]);

  useEffect(() => {
    function handleWorkspaceChange() {
      load({ quiet: true });
    }

    window.addEventListener("voterspheres:workspace-changed", handleWorkspaceChange);

    return () => {
      window.removeEventListener(
        "voterspheres:workspace-changed",
        handleWorkspaceChange
      );
    };
  }, [load]);

  const createAction = useCallback(
    async (payload) => {
      const result = await createUnifiedExecutiveAction({
        workspace_id: payload?.workspace_id || activeWorkspaceId || null,
        ...payload,
      });

      await load({ quiet: true });
      return result;
    },
    [activeWorkspaceId, load]
  );

  const value = useMemo(
    () => ({
      data,
      overview: data,
      health: data.health || {},
      briefing: data.briefing || {},
      kpis: data.kpis || {},
      summary: data.summary || {},
      workspaces: data.workspaces || [],
      urgentWorkspaces: data.urgent_workspaces || [],
      tasks: data.tasks || [],
      signals: data.signals || [],
      alerts: data.alerts || [],
      recommendations: data.recommendations || [],
      missions: data.missions || [],
      activity: data.activity || [],
      sourceStatus: data.source_status || [],
      loading,
      refreshing,
      error,
      lastUpdated,
      filters: requestFilters,
      refresh: () => load({ quiet: true, force: true }),
      reload: () => load(),
      createAction,
    }),
    [
      data,
      loading,
      refreshing,
      error,
      lastUpdated,
      requestFilters,
      load,
      createAction,
    ]
  );

  return (
    <UnifiedExecutiveIntelligenceContext.Provider value={value}>
      {children}
    </UnifiedExecutiveIntelligenceContext.Provider>
  );
}

export function useUnifiedExecutiveIntelligence() {
  const context = useContext(UnifiedExecutiveIntelligenceContext);

  if (!context) {
    throw new Error(
      "useUnifiedExecutiveIntelligence must be used within UnifiedExecutiveIntelligenceProvider"
    );
  }

  return context;
}

