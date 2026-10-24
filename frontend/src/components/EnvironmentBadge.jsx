import React from "react";

const ENV_STYLES = {
  PRODUCTION: "bg-rose-950/70 text-rose-300 border-rose-800/60",
  STAGING: "bg-amber-950/70 text-amber-300 border-amber-800/60",
  QA: "bg-cyan-950/70 text-cyan-300 border-cyan-800/60",
};

export function EnvironmentBadge({ environment }) {
  const normalized = (environment || "").toUpperCase();
  const style = ENV_STYLES[normalized] || "bg-slate-800 text-slate-300 border-slate-700";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${style}`}>
      {normalized}
    </span>
  );
}

export default EnvironmentBadge;
