import React from "react";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Incident Dashboard
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor service health, active disruptions, and resolution velocity.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500">
        <p className="text-base font-medium text-slate-300">
          Dashboard metrics, filters, and incidents table will be assembled in Phase 6.
        </p>
      </div>
    </div>
  );
}

export default DashboardPage;
