// Simple image size validation and cleanup
// For real compression, you'd use sharp, but this keeps deps minimal

export function validateBase64Image(data: string, maxBytes: number = 2_800_000): { valid: boolean; error?: string } {
  if (!data) return { valid: true };
  if (!data.startsWith('data:image/')) return { valid: false, error: 'Invalid image format' };
  if (data.length > maxBytes) return { valid: false, error: 'Image too large (max 2MB)' };
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  const mimeMatch = data.match(/^data:(image\/[a-z+]+);/);
  if (!mimeMatch || !allowedTypes.includes(mimeMatch[1])) {
    return { valid: false, error: 'Unsupported image type. Use JPEG, PNG, WebP, or GIF.' };
  }
  return { valid: true };
}
