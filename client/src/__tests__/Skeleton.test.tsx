import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { SkeletonCard, SkeletonGrid, SkeletonList } from '../components/Skeleton';
import React from 'react';

describe('Skeleton Components', () => {
  it('renders SkeletonCard', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders SkeletonGrid with correct count', () => {
    const { container } = render(<SkeletonGrid count={4} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBe(4);
  });

  it('renders SkeletonList with correct count', () => {
    const { container } = render(<SkeletonList count={3} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBe(3);
  });
});
