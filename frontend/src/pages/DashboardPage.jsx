import React, { useState } from "react";
import { useStats } from "../hooks/useStats.js";
import { useIncidents } from "../hooks/useIncidents.js";
import StatCard from "../components/StatCard.jsx";
import SeverityPill from "../components/SeverityPill.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import EnvironmentBadge from "../components/EnvironmentBadge.jsx";
import FilterTabs from "../components/FilterTabs.jsx";
import Pagination from "../components/Pagination.jsx";
import Spinner from "../components/Spinner.jsx";
import ErrorMessage from "../components/ErrorMessage.jsx";
import EmptyState from "../components/EmptyState.jsx";

// Helper function to format minutes into "Xh Ym"
function formatMinutes(totalMinutes = 0) {
  const mins = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(mins / 60);
  const remaining = mins % 60;
  return `${hours}h ${remaining}m`;
}

// Helper function to format timestamps into clean readable dates
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

export function DashboardPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // 1. Fetch dashboard metrics from /stats
  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
  } = useStats();

  // 2. Fetch paginated incidents with status filter
  const {
    data: incidentsData,
    isLoading: isIncidentsLoading,
    isError: isIncidentsError,
    error: incidentsError,
    refetch: refetchIncidents,
    isPlaceholderData,
  } = useIncidents({
    status: statusFilter,
    page: currentPage,
    limit: pageSize,
  });

  // Changing tabs resets the page to 1
  const handleTabChange = (newStatus) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const incidentsList = incidentsData?.data || [];
  const totalRecords = incidentsData?.total || 0;
  const totalPages = incidentsData?.totalPages || 1;

  return (
    <div className="space-y-8">
      {/* Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Incident Dashboard
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time incident response metrics, health statuses, and post-mortems.
        </p>
      </div>

      {/* 1. Summary Cards Section */}
      {isStatsError ? (
        <ErrorMessage
          message={`Failed to load statistics: ${statsError?.message}`}
          onRetry={refetchStats}
        />
      ) : isStatsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse" />
          <div className="h-28 bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse" />
          <div className="h-28 bg-slate-900/40 border border-slate-800 rounded-xl animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Active Incidents"
            value={stats?.openIncidents ?? 0}
            description="Currently unresolved incidents"
            trendColor="text-blue-400"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatCard
            title="High-Severity Open"
            value={stats?.openHighSeverity ?? 0}
            description="High or critical priority"
            trendColor="text-rose-400"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <StatCard
            title="Total Time Spent"
            value={formatMinutes(stats?.totalMinutesSpent)}
            description="Logged on resolved post-mortems"
            trendColor="text-indigo-400"
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
      )}

      {/* 2. Incidents Table Section with Filters */}
      <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl shadow-black/20 backdrop-blur-sm">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Incidents
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing {incidentsList.length} of {totalRecords} incidents
            </p>
          </div>

          <FilterTabs
            activeTab={statusFilter}
            onTabChange={handleTabChange}
          />
        </div>

        {/* Table Content Area */}
        {isIncidentsError ? (
          <div className="p-6">
            <ErrorMessage
              message={incidentsError?.message}
              onRetry={refetchIncidents}
            />
          </div>
        ) : isIncidentsLoading && !isPlaceholderData ? (
          <Spinner label="Loading incidents list..." />
        ) : incidentsList.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No incidents yet"
              description={`There are no incidents currently marked as ${statusFilter.toLowerCase()}.`}
            />
          </div>
        ) : (
          <div>
            {/* Table wrapper with overflow-x-auto for narrow screens */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4 sm:px-6">Title</th>
                    <th className="py-3.5 px-4">Service</th>
                    <th className="py-3.5 px-4">Severity</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 sm:px-6">Date Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-normal">
                  {incidentsList.map((incident) => (
                    <tr
                      key={incident.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Incident Title & Description preview */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
                          {incident.title}
                        </div>
                        {incident.description && (
                          <div className="text-xs text-slate-500 line-clamp-1 mt-0.5 max-w-md">
                            {incident.description}
                          </div>
                        )}
                      </td>

                      {/* Service Name & Environment Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-200">
                            {incident.service?.name || "Unknown Service"}
                          </span>
                          {incident.service?.environment && (
                            <EnvironmentBadge
                              environment={incident.service.environment}
                            />
                          )}
                        </div>
                      </td>

                      {/* Severity Pill */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <SeverityPill severity={incident.severity} />
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={incident.status} />
                      </td>

                      {/* Date Created */}
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-xs text-slate-400">
                        {formatDate(incident.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="border-t border-slate-800/80 p-3 bg-slate-900/40">
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                isPreviousData={isPlaceholderData}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
