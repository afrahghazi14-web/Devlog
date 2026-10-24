import React from "react";
import Modal from "./Modal.jsx";
import SeverityPill from "./SeverityPill.jsx";
import StatusBadge from "./StatusBadge.jsx";
import EnvironmentBadge from "./EnvironmentBadge.jsx";
import Spinner from "./Spinner.jsx";
import ErrorMessage from "./ErrorMessage.jsx";
import { useIncident } from "../hooks/useIncidents.js";

// Helper function to format time spent in hours and minutes
function formatMinutes(mins = 0) {
  const m = Math.max(0, Number(mins) || 0);
  const hours = Math.floor(m / 60);
  const remaining = m % 60;
  if (hours > 0 && remaining > 0) return `${hours}h ${remaining}m (${m} mins)`;
  if (hours > 0) return `${hours}h (${m} mins)`;
  return `${m} minutes`;
}

// Helper function to format dates
function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PostMortemModal({ incidentId, isOpen, onClose }) {
  const {
    data: incident,
    isLoading,
    isError,
    error,
    refetch,
  } = useIncident(incidentId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Incident Post-Mortem"
      maxWidth="max-w-2xl"
    >
      {isLoading ? (
        <Spinner label="Loading post-mortem details..." />
      ) : isError ? (
        <ErrorMessage
          message={error?.message || "Failed to load incident details."}
          onRetry={refetch}
        />
      ) : !incident ? (
        <div className="text-center text-slate-400 py-8">
          Incident record not found.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Incident Overview Card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-400">
                Incident #{incident.id}
              </span>
              <div className="flex items-center gap-2">
                <SeverityPill severity={incident.severity} />
                <StatusBadge status={incident.status} />
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                {incident.title}
              </h3>
              {incident.description && (
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {incident.description}
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Affected Service:</span>
                <span className="font-semibold text-white">
                  {incident.service?.name}
                </span>
                {incident.service?.environment && (
                  <EnvironmentBadge
                    environment={incident.service.environment}
                  />
                )}
              </div>
              <div className="text-slate-400">
                Created:{" "}
                <span className="text-slate-200">
                  {formatDate(incident.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Post-Mortem Details Section */}
          {incident.postMortem ? (
            <div className="space-y-4">
              {/* Resolution Metrics Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                  <span className="text-xs text-slate-400 block font-medium">
                    Time Spent on Resolution
                  </span>
                  <span className="text-sm font-bold text-indigo-400 mt-0.5 block">
                    {formatMinutes(incident.postMortem.timeSpentMinutes)}
                  </span>
                </div>
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
                  <span className="text-xs text-slate-400 block font-medium">
                    Resolved At
                  </span>
                  <span className="text-sm font-medium text-slate-200 mt-0.5 block">
                    {formatDate(incident.postMortem.createdAt)}
                  </span>
                </div>
              </div>

              {/* Root Cause Card */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Root Cause Analysis
                </div>
                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line pl-4 border-l-2 border-rose-500/40">
                  {incident.postMortem.rootCause}
                </div>
              </div>

              {/* Resolution Steps Card */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Resolution & Remediation Steps
                </div>
                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line pl-4 border-l-2 border-emerald-500/40">
                  {incident.postMortem.resolutionSteps}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-sm text-slate-400">
              No post-mortem document has been recorded for this incident yet.
            </div>
          )}

          {/* Footer Action */}
          <div className="flex justify-end pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default PostMortemModal;
