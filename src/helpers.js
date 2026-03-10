/**
 * helpers.js — shared utility functions
 */

export function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}
