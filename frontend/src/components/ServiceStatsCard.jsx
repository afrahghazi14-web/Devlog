import React from "react";
import EnvironmentBadge from "./EnvironmentBadge.jsx";
import Spinner from "./Spinner.jsx";
import ErrorMessage from "./ErrorMessage.jsx";
import { useServiceStats } from "../hooks/useStats.js";

// Helper function to format minutes into "Xh Ym"
function formatMinutes(totalMinutes = 0) {
  const mins = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  if (hours > 0 && remaining > 0) return `${hours}h ${remaining}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export function ServiceStatsCard() {
  const {
    data: serviceStats = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useServiceStats();

  // Determine maximum minutes spent across all services to normalize progress bars
  const maxMinutes = Math.max(
    ...serviceStats.map((s) => s.totalMinutesSpent || 0),
    1
  );

  return (
    <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl shadow-black/20 backdrop-blur-sm">
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <svg
              className="w-4 h-4 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Time Spent by Service
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            SQL analytics ranking services by resolution time investment
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {isError ? (
          <ErrorMessage
            message={`Failed to load service analytics: ${error?.message}`}
            onRetry={refetch}
          />
        ) : isLoading ? (
          <Spinner label="Loading service analytics..." />
        ) : serviceStats.length === 0 ? (
          <div className="text-center text-slate-400 py-6 text-sm">
            No service metrics recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {serviceStats.map((service) => {
              const percentage = Math.round(
                ((service.totalMinutesSpent || 0) / maxMinutes) * 100
              );

              return (
                <div key={service.id} className="space-y-1.5 group">
                  {/* Service Header Row */}
                  <div className="flex flex-wrap items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700/80 text-slate-300 font-bold flex items-center justify-center text-[10px]">
                        #{service.rank}
                      </span>
                      <span className="font-semibold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {service.name}
                      </span>
                      <EnvironmentBadge environment={service.environment} />
                    </div>

                    <div className="flex items-center gap-3 text-slate-400">
                      <span>
                        {service.resolvedCount}/{service.incidentCount} resolved
                      </span>
                      <span className="font-bold text-indigo-400">
                        {formatMinutes(service.totalMinutesSpent)}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Visualizer */}
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60 flex">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                      title={`${percentage}% of highest service`}
                    />
                  </div>

                  {/* Average time preview */}
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>
                      Avg: {Math.round(service.avgMinutesPerResolved)}m / resolved
                      incident
                    </span>
                    <span>{percentage}% of max</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ServiceStatsCard;
