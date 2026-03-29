import { useEffect, useMemo, useRef, useState } from "react";
import {
  getChecklistProgress,
  loadCelebrationState,
  loadChecklistState,
  saveCelebrationState,
  saveChecklistState,
} from "../lib/onboardingChecklist";

export function useOnboardingChecklist({ userId, firmId, planTier }) {
  const [items, setItems] = useState(() =>
    loadChecklistState({ userId, firmId, planTier }).items
  );

  const [celebration, setCelebration] = useState(() =>
    loadCelebrationState({ userId, firmId })
  );

  const prevPercentRef = useRef(0);

  useEffect(() => {
    setItems(loadChecklistState({ userId, firmId, planTier }).items);
    setCelebration(loadCelebrationState({ userId, firmId }));
  }, [userId, firmId, planTier]);

  useEffect(() => {
    saveChecklistState({ userId, firmId, items });
  }, [userId, firmId, items]);

  useEffect(() => {
    saveCelebrationState({ userId, firmId, state: celebration });
  }, [userId, firmId, celebration]);

  const progress = useMemo(() => getChecklistProgress(items), [items]);

  useEffect(() => {
    const prevPercent = prevPercentRef.current;

    if (progress.percent === 100 && prevPercent < 100) {
      setCelebration((prev) => ({
        ...prev,
        completedOnce: true,
        dismissed: false,
        lastShownAt: new Date().toISOString(),
      }));
    }

    prevPercentRef.current = progress.percent;
  }, [progress.percent]);

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

    setCelebration({
      lastShownAt: null,
      dismissed: false,
      completedOnce: false,
    });
  }

  function dismissCelebration() {
    setCelebration((prev) => ({
      ...prev,
      dismissed: true,
    }));
  }

  const shouldShowCelebration =
    progress.percent === 100 &&
    celebration.completedOnce &&
    !celebration.dismissed;

  return {
    items,
    progress,
    celebration,
    shouldShowCelebration,
    dismissCelebration,
    markComplete,
    markManyComplete,
    markIncomplete,
    toggleComplete,
    resetChecklist,
  };
}
