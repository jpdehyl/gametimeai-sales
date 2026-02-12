// ============================================================
// API Client — GameTime AI Deal Intelligence Platform
// Monaco-style deal room for Account Executives
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

// ============================================================
// Deal Stages
// ============================================================

export type DealStage =
  | 'discovery'
  | 'qualification'
  | 'technical_evaluation'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export const DEAL_STAGES: Array<{ key: DealStage; label: string; order: number; color: string }> = [
  { key: 'discovery', label: 'Discovery', order: 1, color: '#6366f1' },
  { key: 'qualification', label: 'Qualification', order: 2, color: '#8b5cf6' },
  { key: 'technical_evaluation', label: 'Technical Evaluation', order: 3, color: '#3b82f6' },
  { key: 'proposal', label: 'Proposal', order: 4, color: '#f59e0b' },
  { key: 'negotiation', label: 'Negotiation', order: 5, color: '#f97316' },
  { key: 'closed_won', label: 'Closed Won', order: 6, color: '#22c55e' },
  { key: 'closed_lost', label: 'Closed Lost', order: 7, color: '#ef4444' },
];

// ============================================================
// TypeScript Interfaces
// ============================================================

// --- Dashboard ---

export interface DashboardData {
  quotaAttainment: {
    quota: number;
    closedWon: number;
    pipelineWeighted: number;
    gap: number;
    percentAttained: number;
    projectedAttainment: number;
  };
  pipelineSummary: {
    totalValue: number;
    totalDeals: number;
    weightedValue: number;
    averageDealSize: number;
    averageSalesCycle: number;
    byStage: Array<{
      stage: DealStage;
      label: string;
      count: number;
      value: number;
      weightedValue: number;
    }>;
  };
  dealsAtRisk: Array<{
    id: string;
    name: string;
    accountName: string;
    amount: number;
    stage: DealStage;
    healthScore: number;
    topRisk: string;
    daysInStage: number;
  }>;
  todayActions: NextBestAction[];
  recentActivities: Activity[];
  forecast: {
    commit: number;
    bestCase: number;
    pipeline: number;
    target: number;
  };
  notifications: Notification[];
}

// --- Deals ---

export interface DealSummary {
  id: string;
  salesforceOpportunityId: string;
  name: string;
  accountName: string;
  accountId: string;
  amount: number;
  stage: DealStage;
  healthScore: number;
  healthTrend: 'improving' | 'stable' | 'declining';
  winProbability: number;
  closeDate: string;
  daysInCurrentStage: number;
  stakeholderCount: number;
  forecastCategory: 'commit' | 'best_case' | 'pipeline' | 'omitted';
  lastActivityAt: string;
}

export interface DealDetail extends DealSummary {
  account: Account;
  stakeholders: Stakeholder[];
  activities: Activity[];
  competitors: CompetitorIntel[];
  nextBestActions: NextBestAction[];
  riskFactors: RiskFactor[];
  strengths: string[];
  meddicScore: MEDDICScore;
  products: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

// --- Accounts ---

export interface Account {
  id: string;
  name: string;
  domain: string;
  industry: string;
  employeeCount: number;
  annualRevenue: number;
  address: string;
  techStack: string[];
  companyDescription: string;
  recentNews: Array<{
    title: string;
    url: string;
    publishedAt: string;
    summary: string;
  }>;
  tier: 'enterprise' | 'mid_market' | 'smb';
  healthScore: number;
  totalPipelineValue: number;
  totalClosedWon: number;
  lastEngagementAt: string;
}

// --- Stakeholders ---

export type StakeholderRole =
  | 'economic_buyer'
  | 'champion'
  | 'technical_evaluator'
  | 'end_user'
  | 'blocker'
  | 'coach'
  | 'influencer';

export interface Stakeholder {
  id: string;
  accountId: string;
  dealIds: string[];
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  role: StakeholderRole;
  influence: 'high' | 'medium' | 'low';
  sentiment: 'positive' | 'neutral' | 'negative' | 'unknown';
  engagementLevel: 'high' | 'medium' | 'low' | 'none';
  background: string;
  priorities: string[];
  concerns: string[];
  lastContactedAt: string;
  totalInteractions: number;
  nextAction: string;
}

// --- Activities ---

export interface Activity {
  id: string;
  dealId: string;
  accountId: string;
  stakeholderId: string;
  type: 'call' | 'email' | 'meeting' | 'demo' | 'note' | 'task' | 'stage_change';
  subject: string;
  description: string;
  occurredAt: string;
  callDuration?: number;
  callSentiment?: 'positive' | 'neutral' | 'negative';
  callSummary?: string;
  callActionItems?: string[];
  callCoachingTips?: string[];
  callKeyMoments?: Array<{
    timestamp: number;
    type: string;
    description: string;
    transcript: string;
    sentiment: number;
  }>;
  dealName?: string;
  stakeholderName?: string;
}

// --- Competitor Intelligence ---

export interface CompetitorIntel {
  name: string;
  status: 'active' | 'evaluating' | 'eliminated' | 'unknown';
  strengths: string[];
  weaknesses: string[];
  ourAdvantages: string[];
  talkingPoints: string[];
  threatLevel: 'high' | 'medium' | 'low';
}

// --- Next Best Actions ---

export interface NextBestAction {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'call' | 'email' | 'meeting' | 'research' | 'internal' | 'follow_up' | 'escalation';
  title: string;
  description: string;
  reasoning: string;
  suggestedDate?: string;
  stakeholderId?: string;
  completed: boolean;
  dealId?: string;
  dealName?: string;
  accountName?: string;
}

// --- MEDDIC ---

export interface MEDDICScore {
  metrics: { score: number; notes: string };
  economicBuyer: { score: number; notes: string };
  decisionCriteria: { score: number; notes: string };
  decisionProcess: { score: number; notes: string };
  identifyPain: { score: number; notes: string };
  champion: { score: number; notes: string };
  overallScore: number;
}

// --- Risk Factors ---

export interface RiskFactor {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'engagement' | 'competition' | 'timeline' | 'stakeholder' | 'technical' | 'budget';
  description: string;
  recommendation: string;
}

// --- Meeting Prep ---

export interface MeetingPrep {
  id: string;
  dealId: string;
  scheduledAt: string;
  attendees: Array<{
    name: string;
    title: string;
    role: StakeholderRole;
    sentiment: string;
  }>;
  objective: string;
  agenda: Array<{
    topic: string;
    duration: number;
    notes: string;
  }>;
  keyTalkingPoints: string[];
  stakeholderBriefs: Array<{
    name: string;
    title: string;
    priorities: string[];
    concerns: string[];
    approachTips: string;
  }>;
  competitiveContext: string;
  risksToAddress: string[];
  desiredOutcomes: string[];
  openQuestions: string[];
}

// --- Notifications ---

export interface Notification {
  id: string;
  type: 'deal_risk' | 'action_due' | 'stage_change' | 'competitor_alert' | 'stakeholder_change' | 'coaching' | 'system';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  dealId?: string;
  accountId?: string;
  read: boolean;
  createdAt: string;
}

// --- Outreach ---

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

// --- Calls ---

export interface CallSummary {
  id: string;
  dealId: string;
  dealName: string;
  accountName: string;
  stakeholderName: string;
  duration: number;
  direction: 'inbound' | 'outbound';
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
  callDate: string;
  actionItemCount: number;
  coachingTipCount: number;
}

export interface CallDetail {
  id: string;
  dealId: string;
  accountId: string;
  stakeholderId: string;
  salesforceTaskId?: string;
  duration: number;
  direction: 'inbound' | 'outbound';
  sentiment: 'positive' | 'neutral' | 'negative';
  summary: string;
  actionItems: string[];
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
  callDate: string;
  deal?: {
    id: string;
    name: string;
    accountName: string;
    stage: DealStage;
  };
  stakeholder?: {
    id: string;
    name: string;
    title: string;
    role: StakeholderRole;
  };
}

// ============================================================
// API Functions
// ============================================================

// --- Dashboard ---

export async function fetchDashboard() {
  return fetchAPI<{ data: DashboardData }>('/api/v1/dashboard');
}

// --- Deals ---

export async function fetchDeals(params?: {
  stage?: DealStage;
  search?: string;
  forecastCategory?: string;
  minHealthScore?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const searchParams = new URLSearchParams();
  if (params?.stage) searchParams.set('stage', params.stage);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.forecastCategory) searchParams.set('forecastCategory', params.forecastCategory);
  if (params?.minHealthScore) searchParams.set('minHealthScore', String(params.minHealthScore));
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  const query = searchParams.toString();
  return fetchAPI<{ data: DealSummary[] }>(
    `/api/v1/deals${query ? `?${query}` : ''}`
  );
}

export async function fetchDealDetail(id: string) {
  return fetchAPI<{ data: DealDetail }>(`/api/v1/deals/${id}`);
}

export async function updateDealStage(id: string, stage: DealStage) {
  return fetchAPI<{ data: DealDetail }>(`/api/v1/deals/${id}/stage`, {
    method: 'POST',
    body: JSON.stringify({ stage }),
  });
}

export async function completeAction(dealId: string, actionId: string) {
  return fetchAPI<{ data: NextBestAction }>(`/api/v1/deals/${dealId}/actions/${actionId}/complete`, {
    method: 'POST',
  });
}

// --- Accounts ---

export async function fetchAccounts() {
  return fetchAPI<{ data: Account[] }>('/api/v1/accounts');
}

export async function fetchAccountDetail(id: string) {
  return fetchAPI<{ data: Account }>(`/api/v1/accounts/${id}`);
}

// --- Calls ---

export async function fetchCalls(params?: {
  dealId?: string;
  accountId?: string;
  stakeholderId?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.dealId) searchParams.set('dealId', params.dealId);
  if (params?.accountId) searchParams.set('accountId', params.accountId);
  if (params?.stakeholderId) searchParams.set('stakeholderId', params.stakeholderId);
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const query = searchParams.toString();
  return fetchAPI<{ data: CallSummary[] }>(`/api/v1/calls${query ? `?${query}` : ''}`);
}

export async function fetchCallDetail(id: string) {
  return fetchAPI<{ data: CallDetail }>(`/api/v1/calls/${id}`);
}

// --- Outreach ---

export async function generateOutreach(params: {
  dealId: string;
  stakeholderId?: string;
  sequenceType: string;
  variants?: number;
  tone?: string;
  context?: string;
}) {
  return fetchAPI<{ data: OutreachResult }>('/api/v1/outreach/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// --- Meeting Prep ---

export async function generateMeetingPrep(dealId: string) {
  return fetchAPI<{ data: MeetingPrep }>(`/api/v1/deals/${dealId}/meeting-prep`, {
    method: 'POST',
  });
}

// --- Notifications ---

export async function markNotificationRead(id: string) {
  return fetchAPI<{ data: { id: string; read: boolean } }>(
    `/api/v1/dashboard/notifications/${id}`,
    { method: 'PATCH' }
  );
}

// ============================================================
// Inbound Leads (Virtual Assistant)
// ============================================================

// --- Interfaces ---

export interface InboundLead {
  id: string;
  source: string;
  sourceDetail?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  title?: string;
  industry?: string;
  employeeCount?: number;
  website?: string;
  message?: string;
  productInterest?: string;
  region?: string;
  aiScore?: number;
  aiScoreFactors?: string[];
  aiSummary?: string;
  aiQualified: boolean;
  autoResponseSent: boolean;
  autoResponseAt?: string;
  autoResponseContent?: string;
  responseTimeMs?: number;
  status: string;
  assignedSdrId?: string;
  assignedAeId?: string;
  convertedAccountId?: string;
  convertedDealId?: string;
  receivedAt: string;
  qualifiedAt?: string;
  convertedAt?: string;
  autoResponses?: AutoResponseData[];
  autoResponseCount?: number;
}

export interface AutoResponseData {
  id: string;
  subject: string;
  body: string;
  channel: string;
  sentAt?: string;
  opened: boolean;
  replied: boolean;
  confidence?: number;
  model?: string;
}

export interface LeadMetrics {
  totalLeads: number;
  todayLeadCount: number;
  weekLeadCount: number;
  avgResponseTimeMs: number;
  autoResponseRate: number;
  qualificationRate: number;
  conversionRate: number;
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  leadsByRegion: Record<string, number>;
  speedToLeadDistribution?: {
    under5s: number;
    under15s: number;
    under30s: number;
    under60s: number;
    over60s: number;
  };
}

// --- API Functions ---

export async function fetchLeads(params?: {
  status?: string;
  source?: string;
  region?: string;
  search?: string;
  page?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.source) searchParams.set('source', params.source);
  if (params?.region) searchParams.set('region', params.region);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', String(params.page));
  const query = searchParams.toString();
  return fetchAPI<{ data: InboundLead[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(
    `/api/v1/leads${query ? `?${query}` : ''}`
  );
}

export async function fetchLeadDetail(id: string) {
  return fetchAPI<{ data: InboundLead }>(`/api/v1/leads/${id}`);
}

export async function fetchLeadMetrics() {
  return fetchAPI<{ data: LeadMetrics }>('/api/v1/leads/metrics');
}

export async function qualifyLead(id: string, qualified: boolean, notes: string, assignedAeId?: string) {
  return fetchAPI<{ data: InboundLead }>(`/api/v1/leads/${id}/qualify`, {
    method: 'POST',
    body: JSON.stringify({ qualified, notes, assignedAeId }),
  });
}

export async function convertLead(id: string) {
  return fetchAPI<{
    data: {
      leadId: string;
      status: string;
      convertedAt: string;
      account: { id: string; name: string };
      deal: { id: string; name: string; stage: string };
    };
  }>(`/api/v1/leads/${id}/convert`, {
    method: 'POST',
  });
}
