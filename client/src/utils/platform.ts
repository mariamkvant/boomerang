// Detect if running on iOS (any iOS device — app, PWA, or browser)
export const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
export const isIPad = /iPad/.test(navigator.userAgent) || (navigator.userAgent.includes('Macintosh') && 'ontouchend' in document);

// Native share using Web Share API (works in WKWebView on iOS)
export async function nativeShare(data: { title?: string; text?: string; url?: string }) {
  if (navigator.share) {
    try { await navigator.share(data); return true; } catch { return false; }
  }
  return false;
}

// Haptic feedback (works on iOS Safari/WKWebView)
export function haptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    navigator.vibrate(style === 'light' ? 10 : style === 'medium' ? 20 : 30);
  }
}
