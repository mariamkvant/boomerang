import { describe, it, expect } from 'vitest';
import { rateLimit } from '../rateLimit';

describe('Rate Limiter', () => {
  it('allows requests under limit', () => {
    const limiter = rateLimit(60000, 3);
    const results: number[] = [];
    for (let i = 0; i < 3; i++) {
      const req = { ip: '192.168.1.100', path: '/test-' + Math.random() } as any;
      const res = { status: (code: number) => { results.push(code); return { json: () => {} }; } } as any;
      let called = false;
      limiter(req, res, () => { called = true; });
      if (called) results.push(200);
    }
    expect(results.every(r => r === 200)).toBe(true);
  });

  it('blocks requests over limit', () => {
    const limiter = rateLimit(60000, 2);
    const path = '/test-block-' + Math.random();
    let blocked = false;
    for (let i = 0; i < 5; i++) {
      const req = { ip: '10.0.0.1', path } as any;
      const res = { status: (code: number) => { if (code === 429) blocked = true; return { json: () => {} }; } } as any;
      limiter(req, res, () => {});
    }
    expect(blocked).toBe(true);
  });
});
