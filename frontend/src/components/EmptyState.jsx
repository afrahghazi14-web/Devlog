import React from "react";

export function EmptyState({ title = "No incidents yet", description = "No incidents match the selected filter." }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center my-4">
      <div className="w-12 h-12 rounded-full bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-3 text-slate-400">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      {description && <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">{description}</p>}
    </div>
  );
}

export default EmptyState;
