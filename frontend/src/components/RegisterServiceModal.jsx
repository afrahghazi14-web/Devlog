import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import Modal from "./Modal.jsx";
import { useCreateService } from "../hooks/useCreateService.js";

export function RegisterServiceModal({ isOpen, onClose }) {
  const createServiceMutation = useCreateService();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      environment: "PRODUCTION",
    },
  });

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: "",
        environment: "PRODUCTION",
      });
      createServiceMutation.reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (formData) => {
    try {
      await createServiceMutation.mutateAsync({
        name: formData.name.trim(),
        environment: formData.environment,
      });
      // Close modal on success; query cache invalidation updates UI automatically
      onClose();
    } catch {
      // Backend error is stored in createServiceMutation.error and shown in modal
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Service"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Backend API Error Banner (e.g., 409 Duplicate name + environment) */}
        {createServiceMutation.isError && (
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
              <p className="font-semibold">Failed to register service</p>
              <p className="text-xs text-rose-300/90 mt-0.5">
                {createServiceMutation.error?.message ||
                  "An unexpected error occurred while communicating with the server."}
              </p>
            </div>
          </div>
        )}

        {/* Service Name Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Service Name <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Payment Gateway Service"
            {...register("name", {
              required: "Service name is required",
              minLength: {
                value: 2,
                message: "Service name must be at least 2 characters",
              },
              maxLength: {
                value: 100,
                message: "Service name cannot exceed 100 characters",
              },
            })}
            disabled={createServiceMutation.isPending}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-50"
          />
          {errors.name && (
            <p className="text-xs text-rose-400 mt-1 font-medium">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Environment Field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Target Environment <span className="text-rose-400">*</span>
          </label>
          <select
            {...register("environment", {
              required: "Please select an environment",
            })}
            disabled={createServiceMutation.isPending}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors disabled:opacity-50"
          >
            <option value="PRODUCTION">PRODUCTION</option>
            <option value="STAGING">STAGING</option>
            <option value="QA">QA</option>
          </select>
          {errors.environment && (
            <p className="text-xs text-rose-400 mt-1 font-medium">
              {errors.environment.message}
            </p>
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            disabled={createServiceMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createServiceMutation.isPending}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-950/60 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {createServiceMutation.isPending && (
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
              {createServiceMutation.isPending
                ? "Registering..."
                : "Register Service"}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default RegisterServiceModal;
