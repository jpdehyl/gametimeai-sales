// ============================================================
// GameTime AI — Core Data Models
// Per PRD Section 5: Data Models
// ============================================================

export interface Signal {
  type: 'job_change' | 'funding_round' | 'tech_stack_change' | 'website_visit' | 'content_engagement' | 'news_mention';
  description: string;
  detectedAt: Date;
  source: string;
  impactScore: number; // 0-100, how much this signal affects lead score
}

export interface KeyMoment {
  timestamp: number; // seconds into call
  type: 'objection' | 'buying_signal' | 'competitor_mention' | 'pricing_discussion' | 'next_steps' | 'pain_point';
  description: string;
  transcript: string;
  sentiment: number; // -1 to 1
}

export interface CompanyIntel {
  summary: string;
  recentNews: string[];
  techStack: string[];
  estimatedRevenue?: string;
  employeeCount?: number;
}

export interface GTLead {
  id: string;
  salesforceId: string;
  salesforceAccountId?: string;
  displayName: string;
  email: string;
  company: string;
  title: string;
  phone?: string;
  industry?: string;
  website?: string;
  // AI Enrichment
  aiScore: number;
  scoreFactors: string[];
  companyIntel: CompanyIntel;
  buyingSignals: Signal[];
  lastScoredAt: Date | null;
  // Sync
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'pending' | 'error';
  // Recommended action
  recommendedAction?: string;
  lastActivity?: Date;
  // Engagement
  contactAttempts: number;
  lastContactedAt?: Date;
  status: 'new' | 'contacted' | 'engaged' | 'qualified' | 'nurture' | 'disqualified';
  createdAt: Date;
  updatedAt: Date;
}

export interface CallIntelligence {
  id: string;
  leadId: string;
  zraCallId: string;
  salesforceTaskId?: string;
  // Call Metadata
  duration: number;
  direction: 'inbound' | 'outbound';
  outcome: 'connected' | 'voicemail' | 'no_answer' | 'busy';
  callerEmail?: string;
  // AI Analysis
  summary: string;
  actionItems: string[];
  sentimentScore: number;
  talkRatio: number;
  keyMoments: KeyMoment[];
  coachingTips: string[];
  competitorsMentioned: string[];
  // Status
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  // Timestamps
  callDate: Date;
  analyzedAt?: Date;
  createdAt: Date;
}

export interface SequenceStep {
  stepNumber: number;
  channel: 'email' | 'call' | 'linkedin';
  delayDays: number;
  subject?: string;
  body?: string;
  status: 'pending' | 'sent' | 'completed' | 'skipped';
  sentAt?: Date;
}

export interface OutreachSequence {
  id: string;
  leadId: string;
  sdrId: string;
  // Content
  steps: SequenceStep[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  // AI Metadata
  generatedBy: 'ai' | 'manual';
  personalizationContext: string;
  // Performance
  emailsSent: number;
  emailsOpened: number;
  replies: number;
  meetingsBooked: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailVariant {
  subject: string;
  body: string;
  personalizationPoints: string[];
}

export interface OutreachGenerationRequest {
  leadId: string;
  sequenceType: 'cold_intro' | 'follow_up' | 're_engagement' | 'event_triggered';
  variants: number;
  tone: 'professional_formal' | 'professional_casual' | 'friendly' | 'direct';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'sdr' | 'manager' | 'admin';
  salesforceUserId?: string;
  azureAdId?: string;
  createdAt: Date;
}

export interface DashboardData {
  prioritizedLeads: GTLead[];
  pendingFollowUps: GTLead[];
  recentCalls: CallIntelligence[];
  pipelineSnapshot: PipelineSnapshot;
  notifications: Notification[];
}

export interface PipelineSnapshot {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  engaged: number;
  qualified: number;
  averageScore: number;
}

export interface Notification {
  id: string;
  type: 'score_change' | 'buying_signal' | 'call_analyzed' | 'outreach_reply' | 'deal_alert';
  title: string;
  message: string;
  leadId?: string;
  read: boolean;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
