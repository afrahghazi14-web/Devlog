import React from "react";

// Reusable card for dashboard metrics
export function StatCard({ title, value, description, icon, trendColor = "text-indigo-400" }) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 shadow-lg shadow-black/20 backdrop-blur-sm transition-all hover:border-slate-700/80">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider uppercase text-slate-400">
          {title}
        </span>
        {icon && (
          <div className={`p-2 rounded-lg bg-slate-800/80 ${trendColor}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-white">
          {value}
        </span>
      </div>
      {description && (
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

export default StatCard;
