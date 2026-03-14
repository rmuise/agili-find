"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[var(--cream)] mb-1">
              Something went wrong
            </h3>
            <p className="text-sm text-[var(--muted-text)] mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-black bg-[var(--agili-accent)] rounded-md hover:brightness-110 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
