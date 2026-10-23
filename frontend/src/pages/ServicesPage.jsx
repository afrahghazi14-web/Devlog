import React from "react";

export function ServicesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Services Registry
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage microservices and environments registered to DevLog.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-500">
        <p className="text-base font-medium text-slate-300">
          Services list and registration form will be assembled in Phase 7.
        </p>
      </div>
    </div>
  );
}

export default ServicesPage;
