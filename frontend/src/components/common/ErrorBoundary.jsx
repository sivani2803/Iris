import React from 'react';
import { ShieldAlert, RefreshCw, Home } from 'lucide-react';

/**
 * IRIS Application-Level Error Boundary
 * 
 * Catches unhandled React render errors, preventing the whole application from blanking.
 * Displays a polished IRIS-branded recovery card with reload/retry options.
 * Strictly sanitizes error displays: never renders stack traces, auth tokens, secrets, or patient data.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorId: null };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorId: `ERR-${Date.now().toString(36).toUpperCase()}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Technical log to console only; never expose to user UI
    console.error(
      `[IRIS Application ErrorBoundary Catch] Component: ${this.props.name || 'Root'}:`,
      error?.message || error
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, errorId: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReloadPage = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 bg-surface-warm">
          <div className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-10 border border-stone-200 shadow-xl shadow-stone-200/50 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Shield motif */}
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-800 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-7 h-7 text-teal-700" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                <span>FAIL-SAFE PROTECTION ACTIVE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-charcoal-900 tracking-tight font-sans">
                Interface Temporarily Unavailable
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
                An isolated display issue was contained safely. Core background health monitoring and emergency response pathways continue operating without interruption.
              </p>
            </div>

            {/* Reference ticket */}
            {this.state.errorId && (
              <div className="text-[10px] font-mono text-stone-400 bg-stone-50 py-1.5 px-3 rounded-xl border border-stone-100 max-w-xs mx-auto">
                Incident Ref: {this.state.errorId}
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Screen
              </button>

              <button
                type="button"
                onClick={this.handleReloadPage}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                Reload Application
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-stone-500 hover:text-charcoal-900 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
