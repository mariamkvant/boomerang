import { describe, it, expect } from 'vitest';
import { cached, invalidate } from '../cache';

describe('Cache', () => {
  it('caches results', async () => {
    let callCount = 0;
    const fn = cached('test-key-1', 5000, async () => {
      callCount++;
      return { data: 'hello' };
    });
    const r1 = await fn();
    const r2 = await fn();
    expect(r1.data).toBe('hello');
    expect(r2.data).toBe('hello');
    expect(callCount).toBe(1); // Only called once
  });

  it('invalidates cache', async () => {
    let callCount = 0;
    const key = 'test-key-2';
    const fn = cached(key, 5000, async () => {
      callCount++;
      return callCount;
    });
    await fn();
    invalidate(key);
    await fn();
    expect(callCount).toBe(2);
  });
});
