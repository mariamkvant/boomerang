import { describe, it, expect } from 'vitest';
import { isContentClean } from '../contentFilter';

describe('Content Filter', () => {
  it('allows clean text', () => {
    expect(isContentClean('Hello, I need help with gardening').clean).toBe(true);
    expect(isContentClean('Can you teach me guitar?').clean).toBe(true);
    expect(isContentClean('Thanks for the great service!').clean).toBe(true);
  });

  it('blocks profanity', () => {
    expect(isContentClean('what the fuck').clean).toBe(false);
    expect(isContentClean('you are a bitch').clean).toBe(false);
    expect(isContentClean('asshole').clean).toBe(false);
  });

  it('handles empty/null input', () => {
    expect(isContentClean('').clean).toBe(true);
    expect(isContentClean(null as any).clean).toBe(true);
  });

  it('returns reason when blocked', () => {
    const result = isContentClean('fuck this');
    expect(result.clean).toBe(false);
    expect(result.reason).toBeTruthy();
  });
});
