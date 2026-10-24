import React from "react";

// Status badge: OPEN and RESOLVED clearly different colors
const STATUS_STYLES = {
  OPEN: "bg-blue-950/80 text-blue-300 border-blue-800/60",
  RESOLVED: "bg-purple-950/80 text-purple-300 border-purple-800/60",
};

export function StatusBadge({ status }) {
  const normalized = (status || "").toUpperCase();
  const style = STATUS_STYLES[normalized] || "bg-slate-800 text-slate-300 border-slate-700";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold tracking-wide uppercase border ${style}`}
    >
      {normalized}
    </span>
  );
}

export default StatusBadge;
