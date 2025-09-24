import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md p-6 bg-card border border-border rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              The workflow debugger encountered an error. This might happen if
              the workflow server is unreachable.
            </p>
            <details className="mb-4">
              <summary className="text-sm font-medium cursor-pointer hover:text-foreground">
                Error Details
              </summary>
              <pre className="mt-2 text-xs bg-muted p-3 rounded border overflow-auto">
                {this.state.error.message}
              </pre>
            </details>
            <div className="flex gap-2">
              <button
                onClick={this.resetError}
                className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
