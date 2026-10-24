import React from "react";
import { useServices } from "../hooks/useServices.js";
import EnvironmentBadge from "../components/EnvironmentBadge.jsx";
import Spinner from "../components/Spinner.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import EmptyState from "../components/EmptyState.jsx";

// Helper function to format timestamp
function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ServicesPage() {
  const { data: services = [], isLoading, isError, error, refetch } = useServices();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Services Registry
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Registered infrastructure components and target environments.
        </p>
      </div>

      {/* Services Table Card */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl shadow-black/20 backdrop-blur-sm">
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Registered Services
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {services.length} {services.length === 1 ? "service" : "services"} registered
            </p>
          </div>
        </div>

        {/* Content Area */}
        {isError ? (
          <div className="p-6">
            <ErrorMessage
              message={error?.message}
              onRetry={refetch}
            />
          </div>
        ) : isLoading ? (
          <Spinner label="Loading services registry..." />
        ) : services.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No services registered yet"
              description="Register your microservices to begin tracking production disruptions."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4 sm:px-6">Name</th>
                  <th className="py-3.5 px-4">Environment</th>
                  <th className="py-3.5 px-4 sm:px-6">Date Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-normal">
                {services.map((service) => (
                  <tr
                    key={service.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Service Name */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        {service.name}
                      </div>
                    </td>

                    {/* Environment */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <EnvironmentBadge environment={service.environment} />
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-xs text-slate-400">
                      {formatDate(service.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServicesPage;
