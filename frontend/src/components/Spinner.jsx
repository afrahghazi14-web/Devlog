import React from "react";

export function Spinner({ label = "Loading...", size = "md" }) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-10 h-10 border-3",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-slate-400 gap-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-slate-700 border-t-indigo-500 animate-spin`}
        role="status"
        aria-label="loading"
      />
      {label && <span className="text-xs font-medium text-slate-400 tracking-wide">{label}</span>}
    </div>
  );
}

export default Spinner;
