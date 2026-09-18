import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

export default class NodeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[CRITICAL UI FAULT in ${this.props.nodeName || 'Component Node'}]:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-3xl p-6 border-2 border-amber-300 shadow-sm text-center space-y-3 animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              FAULT ISOLATION ENGAGED
            </span>
            <h3 className="text-base font-bold text-charcoal-900 mt-1.5">
              {this.props.nodeName || 'System Node'} Temporarily Unavailable
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">
              An isolated interface fault was contained. Core background monitoring and fail-safe dispatch pipelines remain fully operational.
            </p>
          </div>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 rounded-xl bg-charcoal-950 hover:bg-charcoal-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recover Node
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
