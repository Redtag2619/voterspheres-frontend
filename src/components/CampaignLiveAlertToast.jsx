export default function CampaignLiveAlertToast({ alert, onClose }) {
  if (!alert) return null;

  return (
    <div className="fixed right-5 top-5 z-50 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
            Checklist updated
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            {alert.title || "Live campaign alert"}
          </div>
          <div className="mt-1 text-sm text-slate-700">
            {alert.message || "A new live campaign event was detected."}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-xs font-medium text-slate-500 hover:text-slate-800"
        >
          Close
        </button>
      </div>
    </div>
  );
}
