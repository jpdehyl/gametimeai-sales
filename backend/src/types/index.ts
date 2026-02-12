// ============================================================
// GameTime AI — Deal Intelligence Platform
// AE-focused data models for HawkRidge Systems
// ============================================================

// ─── Deal Stage Constants ────────────────────────────────────

export type DealStage =
  | 'discovery'
  | 'qualification'
  | 'technical_evaluation'
  | 'proposal'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

export interface DealStageDefinition {
  key: DealStage;
  label: string;
  order: number;
  color: string;
}

export const DEAL_STAGES: DealStageDefinition[] = [
  { key: 'discovery', label: 'Discovery', order: 1, color: '#6366F1' },
  { key: 'qualification', label: 'Qualification', order: 2, color: '#8B5CF6' },
  { key: 'technical_evaluation', label: 'Technical Evaluation', order: 3, color: '#3B82F6' },
  { key: 'proposal', label: 'Proposal', order: 4, color: '#F59E0B' },
  { key: 'negotiation', label: 'Negotiation', order: 5, color: '#F97316' },
  { key: 'closed_won', label: 'Closed Won', order: 6, color: '#10B981' },
  { key: 'closed_lost', label: 'Closed Lost', order: 7, color: '#EF4444' },
];

// ─── Account ─────────────────────────────────────────────────

export interface Account {
  id: string;
  name: string;
  industry: string;
  website?: string;
  employeeCount?: number;
  estimatedRevenue?: string;
  address?: string;
  // Deep intel
  summary: string;
  recentNews: string[];
  techStack: string[];
  healthScore: number; // 0-100
  // Relationships
  salesforceAccountId?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ─── Stakeholder ─────────────────────────────────────────────

export type StakeholderRole =
  | 'economic_buyer'
  | 'champion'
  | 'technical_evaluator'
  | 'blocker'
  | 'influencer'
  | 'end_user'
  | 'coach'
  | 'decision_maker'
  | 'procurement';

export type StakeholderSentiment =
  | 'strong_advocate'
  | 'supportive'
  | 'neutral'
  | 'skeptical'
  | 'opposed';

export interface Stakeholder {
  id: string;
  accountId: string;
  dealId: string;
  // Contact info
  name: string;
  title: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  // Role mapping
  roles: StakeholderRole[];
  isPrimary: boolean;
  // Influence & sentiment
  influenceLevel: number; // 1-10
  sentiment: StakeholderSentiment;
  sentimentTrend: 'improving' | 'stable' | 'declining';
  // Engagement tracking
  lastContactedAt?: Date;
  contactFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'never';
  preferredChannel: 'email' | 'phone' | 'linkedin' | 'in_person';
  // Org chart
  reportsTo?: string; // stakeholder ID
  // Notes
  notes?: string;
  priorities?: string[];
  objections?: string[];
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ─── MEDDIC Scoring ──────────────────────────────────────────

export interface MEDDICScore {
  metrics: { score: number; notes: string };       // 0-10
  economicBuyer: { score: number; notes: string };  // 0-10
  decisionCriteria: { score: number; notes: string };// 0-10
  decisionProcess: { score: number; notes: string }; // 0-10
  identifyPain: { score: number; notes: string };    // 0-10
  champion: { score: number; notes: string };        // 0-10
  overall: number; // computed 0-100
}

// ─── Risk Factor ─────────────────────────────────────────────

export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface RiskFactor {
  id: string;
  category: 'engagement' | 'competition' | 'timeline' | 'budget' | 'champion' | 'decision_process' | 'technical';
  description: string;
  severity: RiskSeverity;
  detectedAt: Date;
  mitigationAction?: string;
  isResolved: boolean;
}

// ─── Competitor Intel ────────────────────────────────────────

export interface CompetitorIntel {
  competitorName: string;
  threatLevel: 'low' | 'medium' | 'high';
  // Positioning
  strengths: string[];
  weaknesses: string[];
  ourAdvantages: string[];
  // Battlecard
  keyDifferentiators: string[];
  objectionHandlers: { objection: string; response: string }[];
  // Context
  incumbentProduct?: string;
  relationshipStrength?: 'none' | 'weak' | 'moderate' | 'strong';
  lastMentionedAt?: Date;
  mentionedBy?: string; // stakeholder ID
}

// ─── Next Best Action ────────────────────────────────────────

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';
export type ActionType = 'call' | 'email' | 'meeting' | 'internal' | 'research' | 'follow_up' | 'proposal' | 'executive_sponsor';

export interface NextBestAction {
  id: string;
  type: ActionType;
  priority: ActionPriority;
  title: string;
  description: string;
  aiReasoning: string;
  targetStakeholderId?: string;
  dueDate?: Date;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
}

// ─── Deal ────────────────────────────────────────────────────

export interface Deal {
  id: string;
  accountId: string;
  salesforceOpportunityId?: string;
  // Core deal info
  name: string;
  value: number;
  stage: DealStage;
  probability: number; // 0-100
  winProbability: number; // AI-computed 0-100
  // Products
  products: string[];
  seatCount?: number;
  // Timeline
  closeDate: Date;
  nextMeetingDate?: Date;
  daysInStage: number;
  // Scoring
  healthScore: number; // 0-100
  meddic: MEDDICScore;
  // Intelligence
  riskFactors: RiskFactor[];
  competitors: CompetitorIntel[];
  nextBestActions: NextBestAction[];
  // Stage history
  stageHistory: { stage: DealStage; enteredAt: Date; exitedAt?: Date }[];
  // Ownership
  ownerId: string;
  // Notes
  dealNotes?: string;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ─── Activity ────────────────────────────────────────────────

export type ActivityType = 'call' | 'email' | 'meeting' | 'stage_change' | 'note' | 'task';
export type ActivityDirection = 'inbound' | 'outbound';

export interface Activity {
  id: string;
  dealId: string;
  accountId: string;
  stakeholderId?: string;
  // Core
  type: ActivityType;
  direction?: ActivityDirection;
  subject: string;
  summary: string;
  // AI analysis
  sentiment?: number; // -1 to 1
  keyInsights?: string[];
  actionItems?: string[];
  buyingSignals?: string[];
  competitorsMentioned?: string[];
  // Call-specific
  duration?: number; // seconds
  outcome?: 'connected' | 'voicemail' | 'no_answer' | 'completed';
  talkRatio?: number; // 0-1
  // Email-specific
  emailOpened?: boolean;
  emailReplied?: boolean;
  // Stage change specific
  fromStage?: DealStage;
  toStage?: DealStage;
  // Timestamps
  occurredAt: Date;
  createdAt: Date;
}

// ─── Meeting Prep ────────────────────────────────────────────

export interface StakeholderBrief {
  stakeholderId: string;
  stakeholderName: string;
  title: string;
  role: StakeholderRole[];
  sentiment: StakeholderSentiment;
  recentInteractions: string[];
  priorities: string[];
  potentialObjections: string[];
  talkingPoints: string[];
}

export interface MeetingPrep {
  id: string;
  dealId: string;
  meetingDate: Date;
  meetingType: 'discovery' | 'demo' | 'technical_review' | 'proposal_review' | 'negotiation' | 'executive_briefing' | 'follow_up';
  // Content
  objective: string;
  agenda: string[];
  stakeholderBriefs: StakeholderBrief[];
  competitiveContext: {
    activeCompetitors: string[];
    keyBattlePoints: string[];
    avoidTopics: string[];
  };
  talkingPoints: string[];
  discoveryQuestions: string[];
  risksToAddress: string[];
  // AI metadata
  generatedAt: Date;
  confidence: number; // 0-100
}

// ─── User ────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ae' | 'manager' | 'admin';
  title?: string;
  salesforceUserId?: string;
  azureAdId?: string;
  // Quota tracking
  quota?: number;
  closedWonYTD?: number;
  // Timestamps
  createdAt: Date;
}

// ─── Dashboard Types ─────────────────────────────────────────

export interface QuotaAttainment {
  quota: number;
  closedWon: number;
  weightedPipeline: number;
  gap: number;
  projected: number;
  attainmentPercent: number;
}

export interface PipelineStageSummary {
  stage: DealStage;
  label: string;
  count: number;
  value: number;
  color: string;
}

export interface DealAtRisk {
  dealId: string;
  dealName: string;
  accountName: string;
  value: number;
  healthScore: number;
  stage: DealStage;
  topRisk: string;
  daysInStage: number;
}

export interface ForecastData {
  commit: number;
  bestCase: number;
  pipeline: number;
  target: number;
}

export interface TodayAction {
  dealId: string;
  dealName: string;
  accountName: string;
  action: NextBestAction;
}

export interface DashboardData {
  quotaAttainment: QuotaAttainment;
  pipelineByStage: PipelineStageSummary[];
  dealsAtRisk: DealAtRisk[];
  todayActions: TodayAction[];
  forecast: ForecastData;
  notifications: Notification[];
}

// ─── Notification ────────────────────────────────────────────

export type NotificationType =
  | 'deal_risk'
  | 'stage_change'
  | 'stakeholder_alert'
  | 'competitor_alert'
  | 'engagement_drop'
  | 'buying_signal'
  | 'meeting_reminder'
  | 'action_overdue'
  | 'forecast_change';

export interface Notification {
  id: string;
  type: NotificationType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  dealId?: string;
  accountId?: string;
  stakeholderId?: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
}

// ─── API Response Types ──────────────────────────────────────

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
