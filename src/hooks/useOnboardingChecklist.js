import { useEffect, useMemo, useState } from "react";
import {
  getChecklistProgress,
  loadChecklistState,
  saveChecklistState,
} from "../lib/onboardingChecklist";

export function useOnboardingChecklist({ userId, firmId, planTier }) {
  const [items, setItems] = useState(() =>
    loadChecklistState({ userId, firmId, planTier }).items
  );

  useEffect(() => {
    setItems(loadChecklistState({ userId, firmId, planTier }).items);
  }, [userId, firmId, planTier]);

  useEffect(() => {
    saveChecklistState({ userId, firmId, items });
  }, [userId, firmId, items]);

  function markComplete(itemId) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: true,
              completedAt: item.completedAt || new Date().toISOString(),
            }
          : item
      )
    );
  }

  function markIncomplete(itemId) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: false,
              completedAt: null,
            }
          : item
      )
    );
  }

  function toggleComplete(itemId) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
              completedAt: !item.completed ? new Date().toISOString() : null,
            }
          : item
      )
    );
  }

  function resetChecklist() {
    setItems(
      loadChecklistState({
        userId,
        firmId,
        planTier,
      }).items.map((item) => ({
        ...item,
        completed: false,
        completedAt: null,
      }))
    );
  }

  const progress = useMemo(() => getChecklistProgress(items), [items]);

  return {
    items,
    progress,
    markComplete,
    markIncomplete,
    toggleComplete,
    resetChecklist,
  };
}
