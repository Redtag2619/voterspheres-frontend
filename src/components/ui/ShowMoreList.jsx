import React, { useMemo, useState } from "react";

export default function ShowMoreList({ items = [], initialCount = 10, increment = null, renderItem, empty = null, className = "", itemClassName = "", buttonClassName = "", showAllLabel, showLessLabel = "Show Less", mode = "all" }) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeInitialCount = Math.max(1, Number(initialCount || 10));
  const safeIncrement = Math.max(1, Number(increment || safeInitialCount));
  const [visibleCount, setVisibleCount] = useState(safeInitialCount);
  const [showAll, setShowAll] = useState(false);

  const visibleItems = useMemo(() => {
    if (showAll) return safeItems;
    return safeItems.slice(0, visibleCount);
  }, [safeItems, showAll, visibleCount]);

  const canShowMore = visibleItems.length < safeItems.length;
  const canShowLess = showAll || visibleCount > safeInitialCount;

  function handleShowMore() {
    if (mode === "incremental") {
      setVisibleCount((current) => Math.min(current + safeIncrement, safeItems.length));
      return;
    }
    setShowAll(true);
  }

  function handleShowLess() {
    setShowAll(false);
    setVisibleCount(safeInitialCount);
  }

  const showAllText = typeof showAllLabel === "function" ? showAllLabel(safeItems.length) : showAllLabel || `Show All ${safeItems.length}`;
  if (!safeItems.length) return empty || null;

  return (
    <div className={["vs-show-more-list", className].filter(Boolean).join(" ")}>
      <style>{`
        .vs-show-more-list{display:grid;gap:12px;min-width:0}.vs-show-more-list-item{min-width:0}.vs-show-more-list-actions{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-top:8px}
        .vs-show-more-list-button{border:1px solid rgba(148,163,184,.18);border-radius:999px;background:rgba(15,23,42,.86);color:var(--vs-text,#f8fafc);cursor:pointer;font-size:11px;font-weight:900;letter-spacing:.08em;min-height:36px;padding:10px 14px;text-transform:uppercase;transition:border-color .16s ease,color .16s ease,background .16s ease,transform .16s ease}
        .vs-show-more-list-button:hover{border-color:rgba(251,146,60,.52);background:rgba(251,146,60,.1);color:#fed7aa;transform:translateY(-1px)}.vs-show-more-list-button:focus-visible{outline:2px solid rgba(251,146,60,.85);outline-offset:2px}
      `}</style>
      {visibleItems.map((item, index) => (
        <div key={item?.id || item?.candidate_id || item?.slug || item?.name || index} className={["vs-show-more-list-item", itemClassName].filter(Boolean).join(" ")}>
          {typeof renderItem === "function" ? renderItem(item, index) : item}
        </div>
      ))}
      {safeItems.length > safeInitialCount ? (
        <div className="vs-show-more-list-actions">
          {canShowMore ? <button type="button" className={["vs-show-more-list-button", buttonClassName].filter(Boolean).join(" ")} onClick={handleShowMore}>{mode === "incremental" ? `Show ${Math.min(safeIncrement, safeItems.length - visibleItems.length)} More` : showAllText}</button> : null}
          {canShowLess ? <button type="button" className={["vs-show-more-list-button", buttonClassName].filter(Boolean).join(" ")} onClick={handleShowLess}>{showLessLabel}</button> : null}
        </div>
      ) : null}
    </div>
  );
}

