import React from "react";

const TABS = [
  { id: "ALL", label: "All" },
  { id: "OPEN", label: "Open" },
  { id: "RESOLVED", label: "Resolved" },
];

export function FilterTabs({ activeTab = "ALL", onTabChange }) {
  return (
    <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg shadow-inner">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              isActive
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default FilterTabs;
