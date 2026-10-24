import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "./Modal.jsx";
import { useServices } from "../hooks/useServices.js";
import { useCreateIncident } from "../hooks/useCreateIncident.js";

export function AddIncidentModal({ isOpen, onClose }) {
  const { data: services = [], isLoading: isServicesLoading } = useServices();
  const createIncidentMutation = useCreateIncident();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      serviceId: "",
      title: "",
      description: "",
      severity: "MEDIUM",
    },
  });

  // Reset form errors and fields when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      reset({
        serviceId: "",
        title: "",
        description: "",
        severity: "MEDIUM",
      });
      createIncidentMutation.reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (formData) => {
    try {
      await createIncidentMutation.mutateAsync({
        serviceId: Number(formData.serviceId),
        title: formData.title.trim(),
        description: formData.description.trim(),
        severity: formData.severity,
      });
      // Close modal on success; query cache invalidation updates UI automatically
      onClose();
    } catch {
      // Backend error is stored in createIncidentMutation.error and shown in modal
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log New Incident"
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Backend API Error Banner */}
        {createIncidentMutation.isError && (
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
              <p className="font-semibold">Failed to create incident</p>
              <p className="text-xs text-rose-300/90 mt-0.5">
                {createIncidentMutation.error?.message ||
                  "An unexpected error occurred while communicating with the server."}
              </p>
            </div>
          </div>
        )}

        {/* Affected Service Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Affected Service <span className="text-rose-400">*</span>
          </label>
          <select
            {...register("serviceId", {
              required: "Please select an affected service",
              validate: (v) =>
                (Number(v) > 0) || "Please select an affected service",
            })}
            disabled={isServicesLoading || createIncidentMutation.isPending}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-50"
          >
            <option value="">
              {isServicesLoading
                ? "Loading services..."
                : "Select the affected service"}
            </option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.environment})
              </option>
            ))}
          </select>
          {errors.serviceId && (
            <p className="text-xs text-rose-400 mt-1 font-medium">
              {errors.serviceId.message}
            </p>
          )}
        </div>

        {/* Title Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Incident Title <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. High latency on user authentication token verification"
            {...register("title", {
              required: "Incident title is required",
              minLength: {
                value: 3,
                message: "Title must be at least 3 characters",
              },
              maxLength: {
                value: 255,
                message: "Title cannot exceed 255 characters",
              },
            })}
            disabled={createIncidentMutation.isPending}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-50"
          />
          {errors.title && (
            <p className="text-xs text-rose-400 mt-1 font-medium">
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Description Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Description <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows="3"
            placeholder="Describe what occurred, impacted users, and initial symptoms..."
            {...register("description", {
              required: "Incident description is required",
              minLength: {
                value: 5,
                message: "Description must be at least 5 characters",
              },
              maxLength: {
                value: 2000,
                message: "Description cannot exceed 2000 characters",
              },
            })}
            disabled={createIncidentMutation.isPending}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-50 resize-y"
          />
          {errors.description && (
            <p className="text-xs text-rose-400 mt-1 font-medium">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Severity Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Severity Level <span className="text-rose-400">*</span>
          </label>
          <select
            {...register("severity", {
              required: "Please select a severity level",
            })}
            disabled={createIncidentMutation.isPending}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-50"
          >
            <option value="LOW">LOW - Minimal impact / internal inconvenience</option>
            <option value="MEDIUM">MEDIUM - Impaired performance or degraded functionality</option>
            <option value="HIGH">HIGH - Critical workflow failure affecting users</option>
            <option value="CRITICAL">CRITICAL - Complete service outage or data risk</option>
          </select>
          {errors.severity && (
            <p className="text-xs text-rose-400 mt-1 font-medium">
              {errors.severity.message}
            </p>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={createIncidentMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createIncidentMutation.isPending}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-950/60 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {createIncidentMutation.isPending && (
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
              {createIncidentMutation.isPending
                ? "Logging Incident..."
                : "Log Incident"}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddIncidentModal;
