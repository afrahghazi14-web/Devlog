import React from "react";

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-6 text-center my-4">
      <div className="w-10 h-10 rounded-full bg-rose-900/40 border border-rose-700/50 flex items-center justify-center mx-auto mb-3 text-rose-400 font-bold">
        !
      </div>
      <h3 className="text-sm font-semibold text-rose-200">
        Failed to load data
      </h3>
      <p className="mt-1 text-xs text-rose-300/80 max-w-md mx-auto">
        {message || "An unexpected error occurred while communicating with the server."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600/80 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-md shadow-rose-950"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorMessage;
