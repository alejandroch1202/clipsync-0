const ADJECTIVES = [
  'swift', 'quiet', 'hyper', 'neon', 'crisp', 'silent', 'cosmic', 'zen',
  'clean', 'agile', 'vivid', 'amber', 'shadow', 'cyber', 'smooth', 'rapid',
  'lunar', 'solar', 'polar', 'sonic', 'pixel', 'turbo', 'prime', 'alpha'
];

const NOUNS = [
  'falcon', 'orbit', 'pulse', 'spark', 'nexus', 'prism', 'relay', 'beacon',
  'stream', 'drift', 'matrix', 'echo', 'flux', 'haven', 'node', 'wave',
  'sync', 'slate', 'shard', 'spark', 'vault', 'atlas', 'apex', 'glider'
];

export function generateRoomSlug(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${adj}-${noun}-${num}`;
}

export function sanitizeRoom(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 32);
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffSec = Math.floor((now - timestamp) / 1000);

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function getStats(text: string): { chars: number; words: number; lines: number } {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text ? text.split('\n').length : 0;
  return { chars, words, lines };
}
