import { describe, it, expect } from 'vitest';
import { generateToken } from '../auth';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'skillswap-dev-secret-change-in-production';

describe('Auth', () => {
  it('generates a valid JWT token', () => {
    const token = generateToken(1);
    expect(token).toBeTruthy();
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    expect(decoded.userId).toBe(1);
  });

  it('token contains expiry', () => {
    const token = generateToken(42);
    const decoded = jwt.decode(token) as any;
    expect(decoded.exp).toBeDefined();
    expect(decoded.userId).toBe(42);
  });
});
