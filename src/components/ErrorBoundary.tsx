import React, { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Garia OS ErrorBoundary] Uncaught runtime error:", error, errorInfo);
  }

  private handleReload = () => {
    try {
      sessionStorage.removeItem("garia_chunk_reload");
    } catch (e) {}
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = "#home";
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isChunkError =
        this.state.error?.name === "ChunkLoadError" ||
        this.state.error?.message?.includes("Failed to fetch dynamically imported module") ||
        this.state.error?.message?.includes("dynamically imported module") ||
        this.state.error?.message?.includes("Loading chunk");

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold font-heading text-white mb-2">
            {isChunkError ? "Applet Version Updated" : "Something encountered an issue"}
          </h2>

          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            {isChunkError
              ? "A fresh build or code update was deployed. Reloading will sync the latest components instantly."
              : this.state.error?.message || "An unexpected error occurred in this view. Your study data is safe."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-2xl bg-cyan-500 text-slate-900 font-bold text-xs hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>

            <button
              onClick={this.handleGoHome}
              className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:bg-slate-800 font-bold text-xs transition-all flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Go to Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
