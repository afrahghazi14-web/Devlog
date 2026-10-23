import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import ErrorBoundary from "../components/ErrorBoundary.jsx";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
                D
              </div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                DevLog
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                  v1.0
                </span>
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-800 text-indigo-400 shadow-sm border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/services"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? "bg-slate-800 text-indigo-400 shadow-sm border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`
                }
              >
                Services
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Routed Content Area wrapped in ErrorBoundary */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default AppLayout;
