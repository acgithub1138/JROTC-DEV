import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorCount: number;
  lastErrorTime: number;
}

class ErrorBoundary extends Component<Props, State> {
  private maxErrorsPerMinute = 5;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      errorCount: 0,
      lastErrorTime: 0
    };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, errorCount: 0, lastErrorTime: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;
    
    // Rate limit error reporting to prevent Sentry spam
    if (timeSinceLastError > 60000) {
      // Reset count after 1 minute
      this.setState({ errorCount: 1, lastErrorTime: now });
    } else {
      this.setState(prevState => ({
        errorCount: prevState.errorCount + 1,
        lastErrorTime: now
      }));
    }

    // Only report errors if we haven't exceeded the rate limit
    if (this.state.errorCount < this.maxErrorsPerMinute) {
      // Filter out common harmless errors
      const harmlessErrors = [
        'Unrecognized feature',
        'ResizeObserver loop limit exceeded',
        'Non-Error promise rejection captured',
        'Script error',
        'NetworkError',
        'ChunkLoadError'
      ];

      const isHarmless = harmlessErrors.some(harmless => 
        error.message?.includes(harmless) || error.stack?.includes(harmless)
      );

      if (!isHarmless) {
        console.warn('Error caught by boundary:', error, errorInfo);
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-4">
              Please refresh the page to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;