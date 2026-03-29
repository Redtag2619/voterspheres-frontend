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
    let changed = false;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;
        if (item.completed) return item;

        changed = true;
        return {
          ...item,
          completed: true,
          completedAt: new Date().toISOString(),
        };
      })
    );

    return changed;
  }

  function markManyComplete(itemIds = []) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      return [];
    }

    const changedItems = [];

    setItems((prev) =>
      prev.map((item) => {
        if (!itemIds.includes(item.id)) return item;
        if (item.completed) return item;

        const updated = {
          ...item,
          completed: true,
          completedAt: new Date().toISOString(),
        };

        changedItems.push(updated);
        return updated;
      })
    );

    return changedItems;
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
    markManyComplete,
    markIncomplete,
    toggleComplete,
    resetChecklist,
  };
}
