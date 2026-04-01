import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFoundPage from '../pages/NotFoundPage';
import React from 'react';

describe('NotFoundPage', () => {
  it('renders 404 message', () => {
    render(<BrowserRouter><NotFoundPage /></BrowserRouter>);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('has link to home', () => {
    render(<BrowserRouter><NotFoundPage /></BrowserRouter>);
    expect(screen.getByText('Go Home')).toBeInTheDocument();
  });

  it('has link to browse', () => {
    render(<BrowserRouter><NotFoundPage /></BrowserRouter>);
    expect(screen.getByText('Browse Services')).toBeInTheDocument();
  });
});
