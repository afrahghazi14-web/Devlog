import React from "react";

// Severity pill colors: LOW green, MEDIUM yellow, HIGH orange, CRITICAL red
const SEVERITY_STYLES = {
  LOW: "bg-emerald-950/70 text-emerald-400 border-emerald-800/60",
  MEDIUM: "bg-yellow-950/70 text-yellow-300 border-yellow-800/60",
  HIGH: "bg-orange-950/70 text-orange-400 border-orange-800/60",
  CRITICAL: "bg-rose-950/70 text-rose-400 border-rose-800/60",
};

const SEVERITY_DOTS = {
  LOW: "bg-emerald-400",
  MEDIUM: "bg-yellow-400",
  HIGH: "bg-orange-400",
  CRITICAL: "bg-rose-400",
};

export function SeverityPill({ severity }) {
  const normalized = (severity || "").toUpperCase();
  const style = SEVERITY_STYLES[normalized] || "bg-slate-800 text-slate-300 border-slate-700";
  const dotColor = SEVERITY_DOTS[normalized] || "bg-slate-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {normalized}
    </span>
  );
}

export default SeverityPill;
