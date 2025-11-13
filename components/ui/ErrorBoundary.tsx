'use client';

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================
// Purpose: Catch React errors and display fallback UI
// Usage: Wrap sections/pages that might error
// ============================================================================

import { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mb-6 rounded-full bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>

          <h2 className="text-2xl font-bold text-black mb-2">Something went wrong</h2>

          <p className="text-sm text-gray-600 max-w-md mb-6">
            An unexpected error occurred. Please try again or contact support if the problem persists.
          </p>

          {this.state.error && (
            <pre className="text-xs text-left text-gray-500 bg-gray-50 p-4 rounded-md mb-6 max-w-2xl overflow-auto">
              {this.state.error.message}
            </pre>
          )}

          <Button variant="primary" onClick={this.handleReset}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
