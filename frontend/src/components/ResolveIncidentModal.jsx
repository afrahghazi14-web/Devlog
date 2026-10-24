import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "./Modal.jsx";
import SeverityPill from "./SeverityPill.jsx";
import { useResolveIncident } from "../hooks/useResolveIncident.js";

export function ResolveIncidentModal({ incident, isOpen, onClose }) {
  const resolveIncidentMutation = useResolveIncident();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      rootCause: "",
      resolutionSteps: "",
      timeSpentMinutes: "",
    },
  });

  // Reset form state when a new incident is opened or modal closes
  useEffect(() => {
    if (isOpen) {
      reset({
        rootCause: "",
        resolutionSteps: "",
        timeSpentMinutes: "",
      });
      resolveIncidentMutation.reset();
    }
  }, [isOpen, reset]);

  if (!incident) return null;

  const onSubmit = async (formData) => {
    try {
      await resolveIncidentMutation.mutateAsync({
        id: incident.id,
        data: {
          rootCause: formData.rootCause.trim(),
          resolutionSteps: formData.resolutionSteps.trim(),
          timeSpentMinutes: Number(formData.timeSpentMinutes),
        },
      });
      // Close modal on success; query cache invalidation updates UI automatically
      onClose();
    } catch {
      // Backend error is stored in resolveIncidentMutation.error and rendered in modal
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Resolve Incident & Record Post-Mortem"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Incident Context Summary Box */}
        <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Incident #{incident.id}</span>
            <SeverityPill severity={incident.severity} />
          </div>
          <div className="text-sm font-semibold text-slate-100">
            {incident.title}
          </div>
          <div className="text-xs text-slate-400">
            Service:{" "}
            <span className="text-indigo-300 font-medium">
              {incident.service?.name}
            </span>{" "}
            ({incident.service?.environment})
          </div>
        </div>

        {/* Backend Error Display (e.g., 409 Conflict if already resolved) */}
        {resolveIncidentMutation.isError && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-sm flex items-start gap-2.5">
            <svg
              className="w-5 h-5 text-rose-400 shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-semibold">Unable to resolve incident</p>
              <p className="text-xs text-rose-300/90 mt-0.5">
                {resolveIncidentMutation.error?.message ||
                  "An error occurred while updating the incident."}
              </p>
            </div>
          </div>
        )}

        {/* Root Cause Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Root Cause <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows="3"
            placeholder="Explain the fundamental underlying condition or defect that triggered the incident..."
            {...register("rootCause", {
              required: "Root cause description is required",
              minLength: {
                value: 5,
                message: "Root cause must be at least 5 characters",
              },
            })}
            disabled={resolveIncidentMutation.isPending}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-50 resize-y"
          />
          {errors.rootCause && (
            <p className="text-xs text-rose-400 mt-1 font-medium">
              {errors.rootCause.message}
            </p>
          )}
        </div>

        {/* Resolution Steps Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Resolution Steps <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows="3"
            placeholder="Document the exact remediation steps taken to restore service and prevent recurrence..."
            {...register("resolutionSteps", {
              required: "Resolution steps are required",
              minLength: {
                value: 5,
                message: "Resolution steps must be at least 5 characters",
              },
            })}
            disabled={resolveIncidentMutation.isPending}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-50 resize-y"
          />
          {errors.resolutionSteps && (
            <p className="text-xs text-rose-400 mt-1 font-medium">
              {errors.resolutionSteps.message}
            </p>
          )}
        </div>

        {/* Time Spent Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Time Spent (Minutes) <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 45"
            {...register("timeSpentMinutes", {
              required: "Time spent in minutes is required",
              valueAsNumber: true,
              min: {
                value: 1,
                message: "Time spent must be at least 1 minute",
              },
              validate: (val) =>
                (Number(val) > 0 && Number.isInteger(Number(val))) ||
                "Time spent must be a positive integer",
            })}
            disabled={resolveIncidentMutation.isPending}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-50"
          />
          {errors.timeSpentMinutes && (
            <p className="text-xs text-rose-400 mt-1 font-medium">
              {errors.timeSpentMinutes.message}
            </p>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={resolveIncidentMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={resolveIncidentMutation.isPending}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {resolveIncidentMutation.isPending && (
              <svg
                className="w-4 h-4 animate-spin text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            )}
            <span>
              {resolveIncidentMutation.isPending
                ? "Resolving Incident..."
                : "Resolve & Save Post-Mortem"}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ResolveIncidentModal;
