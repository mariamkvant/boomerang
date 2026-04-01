import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../components/Toast';
import React from 'react';

function TestComponent() {
  const { toast } = useToast();
  return <button onClick={() => toast('Test message', 'success')}>Show Toast</button>;
}

describe('Toast', () => {
  it('renders toast provider without crashing', () => {
    render(<ToastProvider><div>Hello</div></ToastProvider>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('shows toast message when triggered', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );
    await act(async () => {
      screen.getByText('Show Toast').click();
    });
    expect(screen.getByText(/Test message/)).toBeInTheDocument();
  });
});
