import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { DealStage, StakeholderRole } from './api';

// ============================================================
// Core Utilities
// ============================================================

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

// ============================================================
// Currency Formatting
// ============================================================

export function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `$${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const thousands = amount / 1_000;
    return `$${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

// ============================================================
// Full Currency Formatting (non-abbreviated)
// ============================================================

export function formatCurrencyFull(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
}

// ============================================================
// Health Score Colors
// ============================================================

export function getHealthScoreColor(score: number): { text: string; bg: string; fill: string; label: string } {
  if (score >= 80) return { text: 'text-green-600', bg: 'bg-green-100', fill: 'bg-green-500', label: 'Strong' };
  if (score >= 60) return { text: 'text-yellow-600', bg: 'bg-yellow-100', fill: 'bg-yellow-500', label: 'Fair' };
  if (score >= 40) return { text: 'text-orange-500', bg: 'bg-orange-100', fill: 'bg-orange-500', label: 'At Risk' };
  return { text: 'text-red-500', bg: 'bg-red-100', fill: 'bg-red-500', label: 'Critical' };
}

export function getHealthScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800';
  if (score >= 40) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

// ============================================================
// Deal Stage Colors
// ============================================================

export function getStageBadgeColor(stage: DealStage): string {
  switch (stage) {
    case 'discovery':
      return 'bg-indigo-100 text-indigo-800';
    case 'qualification':
      return 'bg-violet-100 text-violet-800';
    case 'technical_evaluation':
      return 'bg-blue-100 text-blue-800';
    case 'proposal':
      return 'bg-amber-100 text-amber-800';
    case 'negotiation':
      return 'bg-orange-100 text-orange-800';
    case 'closed_won':
      return 'bg-green-100 text-green-800';
    case 'closed_lost':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// ============================================================
// Stakeholder Role Colors
// ============================================================

export function getRoleBadgeColor(role: StakeholderRole): string {
  switch (role) {
    case 'economic_buyer':
      return 'bg-purple-100 text-purple-800';
    case 'champion':
      return 'bg-green-100 text-green-800';
    case 'technical_evaluator':
      return 'bg-blue-100 text-blue-800';
    case 'end_user':
      return 'bg-cyan-100 text-cyan-800';
    case 'blocker':
      return 'bg-red-100 text-red-800';
    case 'coach':
      return 'bg-teal-100 text-teal-800';
    case 'influencer':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// ============================================================
// Sentiment Label (numeric score)
// ============================================================

export function getSentimentLabel(score: number): { label: string; color: string } {
  if (score > 0.3) return { label: 'Positive', color: 'text-green-600' };
  if (score < -0.3) return { label: 'Negative', color: 'text-red-500' };
  return { label: 'Neutral', color: 'text-gray-500' };
}

// ============================================================
// Sentiment Colors
// ============================================================

export function getSentimentColor(sentiment: 'positive' | 'neutral' | 'negative' | 'unknown'): string {
  switch (sentiment) {
    case 'positive':
      return 'text-green-600';
    case 'neutral':
      return 'text-gray-500';
    case 'negative':
      return 'text-red-500';
    case 'unknown':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
}

// ============================================================
// Influence Level
// ============================================================

export function getInfluenceIcon(influence: 'high' | 'medium' | 'low'): {
  bars: number;
  color: string;
  label: string;
} {
  switch (influence) {
    case 'high':
      return { bars: 3, color: 'text-red-500', label: 'High Influence' };
    case 'medium':
      return { bars: 2, color: 'text-yellow-500', label: 'Medium Influence' };
    case 'low':
      return { bars: 1, color: 'text-gray-400', label: 'Low Influence' };
    default:
      return { bars: 1, color: 'text-gray-400', label: 'Unknown' };
  }
}

// ============================================================
// Risk Severity Colors
// ============================================================

export function getSeverityColor(severity: 'critical' | 'high' | 'medium' | 'low'): string {
  switch (severity) {
    case 'critical':
      return 'text-red-700 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    case 'low':
      return 'text-blue-700 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-700 bg-gray-50 border-gray-200';
  }
}

// ============================================================
// Action Priority Colors
// ============================================================

export function getPriorityColor(priority: 'critical' | 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'critical':
      return 'text-red-700 bg-red-100';
    case 'high':
      return 'text-orange-700 bg-orange-100';
    case 'medium':
      return 'text-yellow-700 bg-yellow-100';
    case 'low':
      return 'text-blue-700 bg-blue-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
}
