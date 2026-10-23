import React from "react";

// ErrorBoundary catches runtime rendering errors anywhere in its child component tree
// and displays a user-friendly recovery UI instead of crashing the application.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
          <div className="max-w-md w-full bg-slate-900 border border-red-900/50 rounded-xl p-8 shadow-2xl">
            <div className="w-12 h-12 bg-red-950/80 border border-red-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400 font-bold text-xl">
              !
            </div>
            <h2 className="text-xl font-bold text-slate-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              {this.state.error?.message || "An unexpected rendering error occurred."}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-950/50 cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
