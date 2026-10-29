import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ExecutiveFiltersContext = createContext(null);

const DEFAULT_FILTERS = {
  state: "",
  office: "",
  risk: ""
};

export function ExecutiveFiltersProvider({ children }) {
  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem("vs_executive_filters");
      return saved ? JSON.parse(saved) : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("vs_executive_filters", JSON.stringify(filters));
    } catch {
      // ignore storage issues
    }
  }, [filters]);

  const updateFilters = useCallback((next) => {
    setFilters((prev) => {
      const merged = { ...prev, ...next };
      const keys = Object.keys(merged);
      if (keys.length === Object.keys(prev).length &&
          keys.every((key) => Object.prototype.hasOwnProperty.call(prev, key) &&
            Object.is(prev[key], merged[key]))) return prev;
      return merged;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters((prev) => {
      const keys = Object.keys(DEFAULT_FILTERS);
      return Object.keys(prev).length === keys.length &&
        keys.every((key) => Object.is(prev[key], DEFAULT_FILTERS[key]))
        ? prev : DEFAULT_FILTERS;
    });
  }, []);

  const value = useMemo(
    () => ({
      filters,
      setFilters: updateFilters,
      clearFilters
    }),
    [filters, updateFilters, clearFilters]
  );

  return (
    <ExecutiveFiltersContext.Provider value={value}>
      {children}
    </ExecutiveFiltersContext.Provider>
  );
}

export function useExecutiveFilters() {
  const context = useContext(ExecutiveFiltersContext);

  if (!context) {
    throw new Error("useExecutiveFilters must be used within ExecutiveFiltersProvider");
  }

  return context;
}
