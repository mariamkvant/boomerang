import { describe, it, expect } from 'vitest';
import { validateBase64Image } from '../imageUtil';

describe('Image Validation', () => {
  it('accepts valid jpeg', () => {
    expect(validateBase64Image('data:image/jpeg;base64,/9j/4AAQ').valid).toBe(true);
  });

  it('accepts valid png', () => {
    expect(validateBase64Image('data:image/png;base64,iVBOR').valid).toBe(true);
  });

  it('accepts valid webp', () => {
    expect(validateBase64Image('data:image/webp;base64,UklGR').valid).toBe(true);
  });

  it('rejects non-image data', () => {
    expect(validateBase64Image('data:text/plain;base64,abc').valid).toBe(false);
  });

  it('rejects oversized images', () => {
    const big = 'data:image/jpeg;base64,' + 'A'.repeat(3_000_000);
    expect(validateBase64Image(big).valid).toBe(false);
  });

  it('accepts empty/null', () => {
    expect(validateBase64Image('').valid).toBe(true);
    expect(validateBase64Image(null as any).valid).toBe(true);
  });
});
