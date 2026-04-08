import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

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

  function updateFilters(next) {
    setFilters((prev) => ({
      ...prev,
      ...next
    }));
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
  }

  const value = useMemo(
    () => ({
      filters,
      setFilters: updateFilters,
      clearFilters
    }),
    [filters]
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
