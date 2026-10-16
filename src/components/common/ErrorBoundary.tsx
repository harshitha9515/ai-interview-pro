import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '#dashboard';
    window.location.reload();
  };

  private handleClearCorruptedSession = () => {
    try {
      localStorage.removeItem('ai_interview_pro_active_session_v1');
    } catch {
      // Ignore
    }
    this.handleReset();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-navy-950 text-slate-100">
          <div 
            className="w-full max-w-lg glass-card rounded-3xl p-6 sm:p-8 border border-rose-500/40 bg-navy-900/90 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-300"
            role="alert"
            aria-live="assertive"
          >
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/50 mx-auto flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Something went wrong
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                AI Interview Pro encountered an unexpected error. Your interview history and completed sessions remain securely stored.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-left overflow-x-auto text-[11px] text-rose-300 font-mono max-h-36">
                <strong>Error:</strong> {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-navy-950 flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleClearCorruptedSession}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Active Session</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
