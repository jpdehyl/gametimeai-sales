import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

export function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800';
  if (score >= 40) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

export function getSentimentLabel(score: number): { label: string; color: string } {
  if (score >= 0.5) return { label: 'Positive', color: 'text-green-600' };
  if (score >= 0.1) return { label: 'Neutral-Positive', color: 'text-green-500' };
  if (score >= -0.1) return { label: 'Neutral', color: 'text-gray-500' };
  if (score >= -0.5) return { label: 'Neutral-Negative', color: 'text-orange-500' };
  return { label: 'Negative', color: 'text-red-500' };
}

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800';
    case 'contacted': return 'bg-yellow-100 text-yellow-800';
    case 'engaged': return 'bg-green-100 text-green-800';
    case 'qualified': return 'bg-purple-100 text-purple-800';
    case 'nurture': return 'bg-gray-100 text-gray-600';
    case 'disqualified': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
