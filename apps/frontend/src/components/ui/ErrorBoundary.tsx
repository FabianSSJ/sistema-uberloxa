import React, { Component, ErrorInfo, ReactNode } from 'react';

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
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-6 m-4 bg-red-50 border-2 border-red-300 rounded-xl text-red-900 shadow-lg">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            ⚠️ Ocurrió un error inesperado al renderizar este componente
          </h2>
          <p className="font-mono text-sm bg-red-100 p-3 rounded-lg border border-red-200 mb-4 whitespace-pre-wrap overflow-x-auto">
            {this.state.error?.toString()}
          </p>
          {this.state.errorInfo?.componentStack && (
            <details className="text-xs text-red-700 font-mono bg-red-100/50 p-2 rounded">
              <summary className="cursor-pointer font-bold mb-1">Ver detalles técnicos</summary>
              <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
            </details>
          )}
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null, errorInfo: null });
              window.location.reload();
            }}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
