import React from 'react';
import { Link } from 'react-router-dom';

interface State { hasError: boolean; }

export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() { return { hasError: true }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-5xl mb-4">😵</div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-gray-500 text-sm mb-6 text-center">An unexpected error occurred. Try refreshing the page.</p>
          <div className="flex gap-3">
            <button onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
              className="bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600">Refresh</button>
            <a href="/" className="border border-gray-200 text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-50">Go Home</a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
