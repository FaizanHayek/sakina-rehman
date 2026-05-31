import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] p-6">
          <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-red-100 text-center">
            <div className="text-5xl mb-6">⚠️</div>
            <h2 className="serif-heading text-2xl text-[#064e3b] font-black mb-4">Something went wrong</h2>
            <p className="text-[#3d5a45]/70 mb-8 italic amiri-font text-lg">
              "With every hardship comes ease." Please try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#064e3b] text-white px-8 py-3 rounded-full font-black uppercase tracking-widest hover:bg-[#043327] transition-all"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <pre className="mt-8 p-4 bg-red-50 text-red-700 text-left text-xs overflow-auto rounded-xl border border-red-100">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
