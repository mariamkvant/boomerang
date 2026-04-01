// Basic content filter — catches obvious profanity
// Not exhaustive, but catches the worst offenders
const BLOCKED_PATTERNS = [
  /\bf+u+c+k+/i, /\bs+h+i+t+/i, /\ba+s+s+h+o+l+e/i, /\bb+i+t+c+h/i,
  /\bd+i+c+k/i, /\bc+u+n+t/i, /\bn+i+g+g/i, /\bf+a+g+/i, /\br+e+t+a+r+d/i,
  /\bkill\s+(your|my|him|her|them)self/i, /\bsuicid/i,
];

export function isContentClean(text: string): { clean: boolean; reason?: string } {
  if (!text) return { clean: true };
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { clean: false, reason: 'Your message contains inappropriate language. Please keep it respectful.' };
    }
  }
  return { clean: true };
}
