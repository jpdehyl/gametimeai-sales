// ============================================================
// API Client — Fetch wrapper for GameTime backend
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `API error: ${res.status}`);
  }

  return res.json();
}

// Dashboard
export async function fetchDashboard() {
  return fetchAPI<{ data: DashboardData }>('/api/v1/dashboard');
}

// Leads
export async function fetchLeads(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  minScore?: number;
  search?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.minScore) searchParams.set('minScore', String(params.minScore));
  if (params?.search) searchParams.set('search', params.search);

  const query = searchParams.toString();
  return fetchAPI<{ data: LeadSummary[]; pagination: Pagination }>(
    `/api/v1/leads${query ? `?${query}` : ''}`
  );
}

export async function fetchLeadDetail(id: string) {
  return fetchAPI<{ data: LeadDetail }>(`/api/v1/leads/${id}`);
}

export async function rescoreLead(id: string) {
  return fetchAPI<{ data: ScoreResult }>(`/api/v1/leads/${id}/score`, { method: 'POST' });
}

export async function syncLeads() {
  return fetchAPI<{ data: SyncResult }>('/api/v1/leads/sync', { method: 'POST' });
}

// Outreach
export async function generateOutreach(params: {
  leadId: string;
  sequenceType: string;
  variants?: number;
  tone?: string;
}) {
  return fetchAPI<{ data: OutreachResult }>('/api/v1/outreach/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// Calls
export async function fetchCalls(params?: { leadId?: string; limit?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.leadId) searchParams.set('leadId', params.leadId);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return fetchAPI<{ data: CallSummary[] }>(`/api/v1/calls${query ? `?${query}` : ''}`);
}

export async function fetchCallDetail(id: string) {
  return fetchAPI<{ data: CallDetail }>(`/api/v1/calls/${id}`);
}

// Notifications
export async function markNotificationRead(id: string) {
  return fetchAPI<{ data: { id: string; read: boolean } }>(
    `/api/v1/dashboard/notifications/${id}`,
    { method: 'PATCH' }
  );
}

// ============================================================
// Frontend Types (mirrors backend but tailored for UI)
// ============================================================

export interface DashboardData {
  prioritizedLeads: LeadSummary[];
  pendingFollowUps: FollowUp[];
  recentCalls: CallSummary[];
  pipelineSnapshot: PipelineSnapshot;
  notifications: NotificationItem[];
  unreadNotifications: number;
}

export interface LeadSummary {
  id: string;
  salesforceId: string;
  displayName: string;
  email: string;
  company: string;
  title: string;
  phone?: string;
  industry?: string;
  aiScore: number;
  scoreFactors: string[];
  recommendedAction?: string;
  lastActivity?: string;
  status: string;
  syncStatus: string;
  contactAttempts: number;
  buyingSignals: number;
}

export interface LeadDetail extends Omit<LeadSummary, 'buyingSignals'> {
  website?: string;
  companyIntel: {
    summary: string;
    recentNews: string[];
    techStack: string[];
    estimatedRevenue?: string;
    employeeCount?: number;
  };
  buyingSignals: Array<{
    type: string;
    description: string;
    detectedAt: string;
    source: string;
    impactScore: number;
  }>;
  interactions: {
    calls: Array<{
      id: string;
      date: string;
      duration: number;
      outcome: string;
      summary: string;
      sentimentScore: number;
    }>;
    totalCalls: number;
  };
  lastScoredAt: string | null;
  lastSyncedAt: string;
}

export interface FollowUp {
  id: string;
  displayName: string;
  company: string;
  aiScore: number;
  lastContactedAt?: string;
  recommendedAction?: string;
}

export interface CallSummary {
  id: string;
  leadId: string;
  leadName: string;
  leadCompany: string;
  duration: number;
  direction: string;
  outcome: string;
  summary: string;
  sentimentScore: number;
  analysisStatus: string;
  callDate: string;
  actionItems: number;
  coachingTips: number;
}

export interface CallDetail {
  id: string;
  leadId: string;
  salesforceTaskId?: string;
  duration: number;
  direction: string;
  outcome: string;
  summary: string;
  actionItems: string[];
  sentimentScore: number;
  talkRatio: number;
  keyMoments: Array<{
    timestamp: number;
    type: string;
    description: string;
    transcript: string;
    sentiment: number;
  }>;
  coachingTips: string[];
  competitorsMentioned: string[];
  analysisStatus: string;
  callDate: string;
  lead?: {
    id: string;
    displayName: string;
    company: string;
    title: string;
  };
}

export interface PipelineSnapshot {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  engaged: number;
  qualified: number;
  nurture?: number;
  averageScore: number;
  lastSyncedAt: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  leadId?: string;
  read: boolean;
  createdAt: string;
}

export interface OutreachResult {
  sequenceId: string;
  variants: Array<{
    subject: string;
    body: string;
    personalizationPoints: string[];
  }>;
  hasEnrichment: boolean;
  personalizationContext: string;
}

export interface ScoreResult {
  leadId: string;
  previousScore: number;
  newScore: number;
  factors: string[];
  scoredAt: string;
}

export interface SyncResult {
  message: string;
  synced: number;
  errors: number;
  timestamp: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
