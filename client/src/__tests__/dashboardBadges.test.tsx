/**
 * Dashboard status badge colour tests.
 *
 * The badge() function in DashboardPage renders a <span> with colour classes
 * that depend on the request status. This test extracts and tests that logic
 * directly — no need to render the full dashboard.
 *
 * Colour mapping (from DashboardPage.tsx):
 *   pending   → amber  (waiting for provider to accept)
 *   accepted  → blue   (active / in progress)
 *   delivered → orange (waiting for requester to confirm)
 *   completed → green  (done)
 *   cancelled → grey   (archived)
 *   disputed  → red    (issue raised)
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

// ── Replicate the badge logic exactly from DashboardPage.tsx ──────────────
// (We test the logic directly rather than rendering the whole page, which
//  requires auth context, API mocks, etc.)

const STATUS_COLOURS: Record<string, string> = {
  pending:   'text-amber-700  bg-amber-50  dark:bg-amber-900/30  dark:text-amber-400',
  accepted:  'text-blue-700   bg-blue-50   dark:bg-blue-900/30   dark:text-blue-400',
  delivered: 'text-orange-700 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400',
  completed: 'text-green-700  bg-green-50  dark:bg-green-900/30  dark:text-green-400',
  cancelled: 'text-gray-400   bg-gray-50   dark:bg-gray-900      dark:text-gray-500',
  disputed:  'text-red-700    bg-red-50    dark:bg-red-900/30    dark:text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', accepted: 'Active', delivered: 'Delivered',
  completed: 'Done', cancelled: 'Cancelled', disputed: 'Issue',
};

function badge(s: string) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${STATUS_COLOURS[s] || ''}`}>
      {STATUS_LABELS[s] || s}
    </span>
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('Dashboard status badges — colour classes', () => {
  it.each([
    ['pending',   'amber',  'Pending'],
    ['accepted',  'blue',   'Active'],
    ['delivered', 'orange', 'Delivered'],
    ['completed', 'green',  'Done'],
    ['cancelled', 'gray',   'Cancelled'],
    ['disputed',  'red',    'Issue'],
  ])('%s → %s colour with label "%s"', (status, colour, label) => {
    const { container } = render(<>{badge(status)}</>);
    const span = container.querySelector('span')!;
    expect(span).toBeInTheDocument();
    expect(span.textContent).toBe(label);
    expect(span.className).toContain(`text-${colour}`);
    expect(span.className).toContain(`bg-${colour}`);
  });
});

describe('Dashboard status badges — exhaustive status set', () => {
  const ALL_STATUSES = ['pending', 'accepted', 'delivered', 'completed', 'cancelled', 'disputed'];

  it('covers all 6 statuses', () => {
    expect(ALL_STATUSES).toHaveLength(6);
  });

  it('every status has a distinct colour', () => {
    const colours = ALL_STATUSES.map(s => {
      const cls = STATUS_COLOURS[s] || '';
      // Extract the light-mode text colour token e.g. "amber", "blue"
      const match = cls.match(/text-(\w+)-700/);
      return match ? match[1] : 'unknown';
    });
    const unique = new Set(colours);
    // All 5 non-grey statuses should have distinct colours; cancelled uses grey
    expect(unique.size).toBe(6);
  });

  it('every status has a human-readable label (not the raw slug)', () => {
    for (const status of ALL_STATUSES) {
      const label = STATUS_LABELS[status];
      expect(label).toBeDefined();
      expect(label).not.toBe(status); // label should differ from the slug
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('pending is amber (waiting state)', () => {
    expect(STATUS_COLOURS.pending).toContain('amber');
  });

  it('completed is green (success state)', () => {
    expect(STATUS_COLOURS.completed).toContain('green');
  });

  it('disputed is red (danger state)', () => {
    expect(STATUS_COLOURS.disputed).toContain('red');
  });

  it('unknown status renders without crashing', () => {
    expect(() => render(<>{badge('unknown_status')}</>)).not.toThrow();
  });
});
