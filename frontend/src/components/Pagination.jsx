import React from "react";

export function Pagination({ page = 1, totalPages = 1, onPageChange, isPreviousData = false }) {
  const safeTotalPages = Math.max(totalPages || 1, 1);
  const canGoPrevious = page > 1;
  const canGoNext = page < safeTotalPages;

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <div className="text-xs text-slate-400">
        Page <span className="font-semibold text-slate-200">{page}</span> of{" "}
        <span className="font-semibold text-slate-200">{safeTotalPages}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrevious}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            canGoPrevious
              ? "bg-slate-900 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer shadow-sm"
              : "bg-slate-900/40 border-slate-800/40 text-slate-600 cursor-not-allowed"
          }`}
        >
          Previous
        </button>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext || isPreviousData}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
            canGoNext && !isPreviousData
              ? "bg-slate-900 border-slate-700/80 text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer shadow-sm"
              : "bg-slate-900/40 border-slate-800/40 text-slate-600 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
