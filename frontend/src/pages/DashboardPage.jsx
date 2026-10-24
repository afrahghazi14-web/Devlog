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
import AddIncidentModal from "../components/AddIncidentModal.jsx";
import ResolveIncidentModal from "../components/ResolveIncidentModal.jsx";
import PostMortemModal from "../components/PostMortemModal.jsx";
import ServiceStatsCard from "../components/ServiceStatsCard.jsx";


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

  // Modal dialog states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resolvingIncident, setResolvingIncident] = useState(null);
  const [viewingPostMortemId, setViewingPostMortemId] = useState(null);

  // 1. Fetch dashboard metrics from /stats (auto-refreshed every 30s)
  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
  } = useStats();

  // 2. Fetch paginated incidents with status filter (auto-refreshed every 30s)
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
      {/* Page Header with Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Incident Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time incident response metrics, health statuses, and post-mortems.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-950/60 transition-all cursor-pointer hover:shadow-indigo-600/25"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>Add Incident</span>
        </button>
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

      {/* Service-Level Analytics: Time Spent by Service */}
      <ServiceStatsCard />

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
                    <th className="py-3.5 px-4">Date Created</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-normal">
                  {incidentsList.map((incident) => {
                    const isResolved = incident.status === "RESOLVED";

                    return (
                      <tr
                        key={incident.id}
                        onClick={() => {
                          if (isResolved) {
                            setViewingPostMortemId(incident.id);
                          }
                        }}
                        className={`transition-colors group ${
                          isResolved
                            ? "cursor-pointer hover:bg-slate-800/60"
                            : "hover:bg-slate-800/40"
                        }`}
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
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-400">
                          {formatDate(incident.createdAt)}
                        </td>

                        {/* Actions Column */}
                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-right">
                          {incident.status === "OPEN" ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setResolvingIncident(incident);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/80 hover:text-emerald-200 rounded-md text-xs font-semibold shadow-sm transition-all cursor-pointer"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span>Resolve & Post-Mortem</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingPostMortemId(incident.id);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-950/70 text-indigo-300 border border-indigo-700/60 hover:bg-indigo-900/80 hover:text-indigo-200 rounded-md text-xs font-medium shadow-sm transition-all cursor-pointer"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              <span>View Post-Mortem</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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

      {/* 3. Modals */}
      <AddIncidentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ResolveIncidentModal
        incident={resolvingIncident}
        isOpen={Boolean(resolvingIncident)}
        onClose={() => setResolvingIncident(null)}
      />

      <PostMortemModal
        incidentId={viewingPostMortemId}
        isOpen={Boolean(viewingPostMortemId)}
        onClose={() => setViewingPostMortemId(null)}
      />
    </div>
  );
}

export default DashboardPage;
