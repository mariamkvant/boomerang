import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary';
import React from 'react';

function ThrowingComponent() {
  throw new Error('Test error');
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(<ErrorBoundary><div>Safe content</div></ErrorBoundary>);
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('catches errors and shows fallback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <BrowserRouter>
        <ErrorBoundary><ThrowingComponent /></ErrorBoundary>
      </BrowserRouter>
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
