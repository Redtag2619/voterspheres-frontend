import { createContext, useContext, useEffect, useMemo, useState } from "react";

const DemoModeContext = createContext(null);

const STORAGE_KEY = "vs_demo_mode";

function readStoredDemoMode() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function DemoModeProvider({ children }) {
  const [demoMode, setDemoMode] = useState(readStoredDemoMode);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, demoMode ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }, [demoMode]);

  const value = useMemo(
    () => ({
      demoMode,
      enableDemoMode: () => setDemoMode(true),
      disableDemoMode: () => setDemoMode(false),
      toggleDemoMode: () => setDemoMode((prev) => !prev),
    }),
    [demoMode]
  );

  return <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>;
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);

  if (!ctx) {
    throw new Error("useDemoMode must be used within DemoModeProvider");
  }

  return ctx;
}
