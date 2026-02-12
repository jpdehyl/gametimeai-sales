// ============================================================
// Database Access Layer — GameTime AI Deal Intelligence Platform
// Wraps Prisma queries as a drop-in replacement for the
// in-memory Map-based store.
// ============================================================

import { PrismaClient } from '../generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import {
  Account,
  Activity,
  CompetitorIntel,
  DashboardData,
  Deal,
  DealAtRisk,
  DealStage,
  ForecastData,
  MEDDICScore,
  NextBestAction,
  Notification,
  PipelineStageSummary,
  QuotaAttainment,
  RiskFactor,
  Stakeholder,
  TodayAction,
  User,
  DEAL_STAGES,
} from '../types';

// ─── Singleton Prisma Client ────────────────────────────────

import path from 'path';

const dbPath = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace('file:', '')
  : path.join(__dirname, '../../prisma/dev.db');

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
export const prisma = new PrismaClient({ adapter });

// ─── JSON Helpers ───────────────────────────────────────────

function parseJSON<T>(str: string | null | undefined, fallback: T): T {
  if (str == null) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

// ─── Row → Domain Mappers ───────────────────────────────────

/**
 * Map a Prisma Account row to the application Account type.
 */
function mapAccount(row: any): Account {
  return {
    id: row.id,
    name: row.name,
    industry: row.industry,
    website: row.website ?? undefined,
    employeeCount: row.employeeCount ?? undefined,
    estimatedRevenue: row.estimatedRevenue ?? undefined,
    address: row.address ?? undefined,
    summary: row.summary,
    recentNews: parseJSON<string[]>(row.recentNews, []),
    techStack: parseJSON<string[]>(row.techStack, []),
    healthScore: row.healthScore,
    salesforceAccountId: row.salesforceAccountId ?? undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

/**
 * Map a Prisma User row to the application User type.
 */
function mapUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as User['role'],
    title: row.title ?? undefined,
    salesforceUserId: row.salesforceUserId ?? undefined,
    quota: row.quota ?? undefined,
    closedWonYTD: row.closedWonYTD ?? undefined,
    createdAt: new Date(row.createdAt),
  };
}

/**
 * Map a Prisma RiskFactor row to the application RiskFactor type.
 */
function mapRiskFactor(row: any): RiskFactor {
  return {
    id: row.id,
    category: row.category as RiskFactor['category'],
    description: row.description,
    severity: row.severity as RiskFactor['severity'],
    detectedAt: new Date(row.detectedAt),
    mitigationAction: row.mitigationAction ?? undefined,
    isResolved: row.isResolved,
  };
}

/**
 * Map a Prisma CompetitorIntel row to the application CompetitorIntel type.
 */
function mapCompetitor(row: any): CompetitorIntel {
  return {
    competitorName: row.competitorName,
    threatLevel: row.threatLevel as CompetitorIntel['threatLevel'],
    strengths: parseJSON<string[]>(row.strengths, []),
    weaknesses: parseJSON<string[]>(row.weaknesses, []),
    ourAdvantages: parseJSON<string[]>(row.ourAdvantages, []),
    keyDifferentiators: parseJSON<string[]>(row.keyDifferentiators, []),
    objectionHandlers: parseJSON<{ objection: string; response: string }[]>(
      row.objectionHandlers,
      [],
    ),
    incumbentProduct: row.incumbentProduct ?? undefined,
    relationshipStrength: row.relationshipStrength ?? undefined,
    lastMentionedAt: row.lastMentionedAt ? new Date(row.lastMentionedAt) : undefined,
    mentionedBy: row.mentionedBy ?? undefined,
  };
}

/**
 * Map a Prisma NextBestAction row to the application NextBestAction type.
 */
function mapNextBestAction(row: any): NextBestAction {
  return {
    id: row.id,
    type: row.type as NextBestAction['type'],
    priority: row.priority as NextBestAction['priority'],
    title: row.title,
    description: row.description,
    aiReasoning: row.aiReasoning,
    targetStakeholderId: row.targetStakeholderId ?? undefined,
    dueDate: row.dueDate ? new Date(row.dueDate) : undefined,
    isCompleted: row.isCompleted,
    completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
    createdAt: new Date(row.createdAt),
  };
}

/**
 * Map a Prisma Deal row (with optional relations) to the application Deal type.
 */
function mapDeal(row: any): Deal {
  return {
    id: row.id,
    accountId: row.accountId,
    salesforceOpportunityId: row.salesforceOpportunityId ?? undefined,
    name: row.name,
    value: row.value,
    stage: row.stage as DealStage,
    probability: row.probability,
    winProbability: row.winProbability,
    products: parseJSON<string[]>(row.products, []),
    seatCount: row.seatCount ?? undefined,
    closeDate: new Date(row.closeDate),
    nextMeetingDate: row.nextMeetingDate ? new Date(row.nextMeetingDate) : undefined,
    daysInStage: row.daysInStage,
    healthScore: row.healthScore,
    meddic: parseJSON<MEDDICScore>(row.meddic, {
      metrics: { score: 0, notes: '' },
      economicBuyer: { score: 0, notes: '' },
      decisionCriteria: { score: 0, notes: '' },
      decisionProcess: { score: 0, notes: '' },
      identifyPain: { score: 0, notes: '' },
      champion: { score: 0, notes: '' },
      overall: 0,
    }),
    stageHistory: parseJSON<{ stage: DealStage; enteredAt: Date; exitedAt?: Date }[]>(
      row.stageHistory,
      [],
    ),
    riskFactors: (row.riskFactors || []).map(mapRiskFactor),
    competitors: (row.competitors || []).map(mapCompetitor),
    nextBestActions: (row.nextBestActions || []).map(mapNextBestAction),
    ownerId: row.ownerId,
    dealNotes: row.dealNotes ?? undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

/**
 * Map a Prisma Stakeholder row to the application Stakeholder type.
 */
function mapStakeholder(row: any): Stakeholder {
  return {
    id: row.id,
    accountId: row.accountId,
    dealId: row.dealId,
    name: row.name,
    title: row.title,
    email: row.email,
    phone: row.phone ?? undefined,
    linkedinUrl: row.linkedinUrl ?? undefined,
    roles: parseJSON<Stakeholder['roles']>(row.roles, []),
    isPrimary: row.isPrimary,
    influenceLevel: row.influenceLevel,
    sentiment: row.sentiment as Stakeholder['sentiment'],
    sentimentTrend: row.sentimentTrend as Stakeholder['sentimentTrend'],
    lastContactedAt: row.lastContactedAt ? new Date(row.lastContactedAt) : undefined,
    contactFrequency: row.contactFrequency as Stakeholder['contactFrequency'],
    preferredChannel: row.preferredChannel as Stakeholder['preferredChannel'],
    reportsTo: row.reportsTo ?? undefined,
    notes: row.notes ?? undefined,
    priorities: row.priorities ? parseJSON<string[]>(row.priorities, []) : undefined,
    objections: row.objections ? parseJSON<string[]>(row.objections, []) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

/**
 * Map a Prisma Activity row to the application Activity type.
 */
function mapActivity(row: any): Activity {
  return {
    id: row.id,
    dealId: row.dealId,
    accountId: row.accountId,
    stakeholderId: row.stakeholderId ?? undefined,
    type: row.type as Activity['type'],
    direction: row.direction as Activity['direction'] | undefined,
    subject: row.subject,
    summary: row.summary,
    sentiment: row.sentiment ?? undefined,
    keyInsights: row.keyInsights ? parseJSON<string[]>(row.keyInsights, []) : undefined,
    actionItems: row.actionItems ? parseJSON<string[]>(row.actionItems, []) : undefined,
    buyingSignals: row.buyingSignals ? parseJSON<string[]>(row.buyingSignals, []) : undefined,
    competitorsMentioned: row.competitorsMentioned
      ? parseJSON<string[]>(row.competitorsMentioned, [])
      : undefined,
    duration: row.duration ?? undefined,
    outcome: row.outcome as Activity['outcome'] | undefined,
    talkRatio: row.talkRatio ?? undefined,
    emailOpened: row.emailOpened ?? undefined,
    emailReplied: row.emailReplied ?? undefined,
    fromStage: row.fromStage as DealStage | undefined,
    toStage: row.toStage as DealStage | undefined,
    occurredAt: new Date(row.occurredAt),
    createdAt: new Date(row.createdAt),
  };
}

/**
 * Map a Prisma Notification row to the application Notification type.
 */
function mapNotification(row: any): Notification {
  return {
    id: row.id,
    type: row.type as Notification['type'],
    severity: row.severity as Notification['severity'],
    title: row.title,
    message: row.message,
    dealId: row.dealId ?? undefined,
    accountId: row.accountId ?? undefined,
    stakeholderId: row.stakeholderId ?? undefined,
    actionUrl: row.actionUrl ?? undefined,
    read: row.read,
    createdAt: new Date(row.createdAt),
  };
}

// ─── Inbound Lead Types (for Virtual Assistant) ─────────────

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
  autoResponseAt?: Date;
  autoResponseContent?: string;
  responseTimeMs?: number;
  status: string;
  assignedSdrId?: string;
  assignedAeId?: string;
  convertedAccountId?: string;
  convertedDealId?: string;
  receivedAt: Date;
  qualifiedAt?: Date;
  convertedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  autoResponses: AutoResponse[];
}

export interface AutoResponse {
  id: string;
  inboundLeadId: string;
  subject: string;
  body: string;
  personalization?: Record<string, any>;
  channel: string;
  sentAt?: Date;
  opened: boolean;
  replied: boolean;
  confidence?: number;
  model?: string;
}

export interface SpeedToLeadDistribution {
  under5s: number;
  under15s: number;
  under30s: number;
  under60s: number;
  over60s: number;
}

export interface LeadMetrics {
  totalLeads: number;
  avgResponseTimeMs: number;
  autoResponseRate: number;
  qualificationRate: number;
  conversionRate: number;
  leadsByStatus: Record<string, number>;
  leadsBySource: Record<string, number>;
  leadsByRegion: Record<string, number>;
  todayLeadCount: number;
  weekLeadCount: number;
  speedToLeadDistribution: SpeedToLeadDistribution;
}

export interface InboundLeadFilters {
  status?: string;
  source?: string;
  region?: string;
  aiQualified?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface InboundLeadResult {
  leads: InboundLead[];
  total: number;
}

function mapAutoResponse(row: any): AutoResponse {
  return {
    id: row.id,
    inboundLeadId: row.inboundLeadId,
    subject: row.subject,
    body: row.body,
    personalization: row.personalization
      ? parseJSON<Record<string, any>>(row.personalization, {})
      : undefined,
    channel: row.channel,
    sentAt: row.sentAt ? new Date(row.sentAt) : undefined,
    opened: row.opened,
    replied: row.replied,
    confidence: row.confidence ?? undefined,
    model: row.model ?? undefined,
  };
}

function mapInboundLead(row: any): InboundLead {
  return {
    id: row.id,
    source: row.source,
    sourceDetail: row.sourceDetail ?? undefined,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone ?? undefined,
    company: row.company,
    title: row.title ?? undefined,
    industry: row.industry ?? undefined,
    employeeCount: row.employeeCount ?? undefined,
    website: row.website ?? undefined,
    message: row.message ?? undefined,
    productInterest: row.productInterest ?? undefined,
    region: row.region ?? undefined,
    aiScore: row.aiScore ?? undefined,
    aiScoreFactors: row.aiScoreFactors
      ? parseJSON<string[]>(row.aiScoreFactors, [])
      : undefined,
    aiSummary: row.aiSummary ?? undefined,
    aiQualified: row.aiQualified,
    autoResponseSent: row.autoResponseSent,
    autoResponseAt: row.autoResponseAt ? new Date(row.autoResponseAt) : undefined,
    autoResponseContent: row.autoResponseContent ?? undefined,
    responseTimeMs: row.responseTimeMs ?? undefined,
    status: row.status,
    assignedSdrId: row.assignedSdrId ?? undefined,
    assignedAeId: row.assignedAeId ?? undefined,
    convertedAccountId: row.convertedAccountId ?? undefined,
    convertedDealId: row.convertedDealId ?? undefined,
    receivedAt: new Date(row.receivedAt),
    qualifiedAt: row.qualifiedAt ? new Date(row.qualifiedAt) : undefined,
    convertedAt: row.convertedAt ? new Date(row.convertedAt) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    autoResponses: (row.autoResponses || []).map(mapAutoResponse),
  };
}

// ─── Common Prisma Includes ─────────────────────────────────

const DEAL_RELATIONS_MINIMAL = {
  account: true,
} as const;

const DEAL_RELATIONS_FULL = {
  account: true,
  stakeholders: true,
  activities: true,
  riskFactors: true,
  competitors: true,
  nextBestActions: true,
} as const;

// ─── Database Access Object ─────────────────────────────────

export const db = {
  /**
   * Direct access to the Prisma client for ad-hoc queries
   * (e.g., create / update operations that don't yet have a
   * dedicated wrapper method).
   */
  prisma,

  // ─── Deals ──────────────────────────────────────────────

  /**
   * Get all deals sorted by value descending.
   * Each deal includes the account relation and nested risk factors,
   * competitors, and next best actions.
   */
  async getDeals(filters?: {
    stage?: string;
    search?: string;
  }): Promise<Deal[]> {
    const where: any = {};

    if (filters?.stage) {
      where.stage = filters.stage;
    }

    const rows = await prisma.deal.findMany({
      where,
      include: {
        account: true,
        riskFactors: true,
        competitors: true,
        nextBestActions: true,
      },
      orderBy: { value: 'desc' },
    });

    let deals = rows.map(mapDeal);

    // Apply search filter in-memory (searches deal name and account name)
    if (filters?.search) {
      const term = filters.search.toLowerCase();
      deals = deals.filter(
        (d) =>
          d.name.toLowerCase().includes(term) ||
          ((rows.find((r) => r.id === d.id)?.account as any)?.name || '')
            .toLowerCase()
            .includes(term),
      );
    }

    return deals;
  },

  /**
   * Get a single deal by ID with full relations (stakeholders, activities,
   * risk factors, competitors, next best actions, account).
   */
  async getDealById(id: string): Promise<Deal | null> {
    const row = await prisma.deal.findUnique({
      where: { id },
      include: DEAL_RELATIONS_FULL,
    });
    return row ? mapDeal(row) : null;
  },

  /**
   * Get all deals in a given stage.
   */
  async getDealsByStage(stage: string): Promise<Deal[]> {
    const rows = await prisma.deal.findMany({
      where: { stage },
      include: {
        riskFactors: true,
        competitors: true,
        nextBestActions: true,
      },
      orderBy: { value: 'desc' },
    });
    return rows.map(mapDeal);
  },

  /**
   * Get all deals for a given account.
   */
  async getDealsByAccount(accountId: string): Promise<Deal[]> {
    const rows = await prisma.deal.findMany({
      where: { accountId },
      include: {
        riskFactors: true,
        competitors: true,
        nextBestActions: true,
      },
      orderBy: { value: 'desc' },
    });
    return rows.map(mapDeal);
  },

  /**
   * Get deals at risk (healthScore < 60, excluding closed stages).
   * Sorted by healthScore ascending (worst first).
   */
  async getDealsAtRisk(): Promise<Deal[]> {
    const rows = await prisma.deal.findMany({
      where: {
        healthScore: { lt: 60 },
        stage: { notIn: ['closed_won', 'closed_lost'] },
      },
      include: {
        riskFactors: true,
        competitors: true,
        nextBestActions: true,
      },
      orderBy: { healthScore: 'asc' },
    });
    return rows.map(mapDeal);
  },

  /**
   * Update a deal's stage, daysInStage, probability, and updatedAt.
   */
  async updateDealStage(
    id: string,
    stage: string,
    probability: number,
  ): Promise<Deal | null> {
    const row = await prisma.deal.update({
      where: { id },
      data: {
        stage,
        daysInStage: 0,
        probability,
        updatedAt: new Date(),
      },
      include: DEAL_RELATIONS_FULL,
    });
    return row ? mapDeal(row) : null;
  },

  /**
   * Mark a NextBestAction as completed.
   */
  async completeAction(
    dealId: string,
    actionId: string,
  ): Promise<{ action: NextBestAction; remainingActions: number } | null> {
    const action = await prisma.nextBestAction.findFirst({
      where: { id: actionId, dealId },
    });
    if (!action) return null;

    const now = new Date();
    const updatedRow = await prisma.nextBestAction.update({
      where: { id: actionId },
      data: { isCompleted: true, completedAt: now },
    });

    // Also touch the deal's updatedAt
    await prisma.deal.update({
      where: { id: dealId },
      data: { updatedAt: now },
    });

    const remaining = await prisma.nextBestAction.count({
      where: { dealId, isCompleted: false },
    });

    return {
      action: mapNextBestAction(updatedRow),
      remainingActions: remaining,
    };
  },

  // ─── Accounts ───────────────────────────────────────────

  /**
   * Get all accounts sorted by name.
   */
  async getAccounts(): Promise<Account[]> {
    const rows = await prisma.account.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map(mapAccount);
  },

  /**
   * Get a single account by ID.
   */
  async getAccountById(id: string): Promise<Account | null> {
    const row = await prisma.account.findUnique({ where: { id } });
    return row ? mapAccount(row) : null;
  },

  // ─── Stakeholders ───────────────────────────────────────

  /**
   * Get stakeholders for a deal, sorted by influenceLevel descending.
   */
  async getStakeholdersForDeal(dealId: string): Promise<Stakeholder[]> {
    const rows = await prisma.stakeholder.findMany({
      where: { dealId },
      orderBy: { influenceLevel: 'desc' },
    });
    return rows.map(mapStakeholder);
  },

  /**
   * Get stakeholders for an account.
   */
  async getStakeholdersForAccount(accountId: string): Promise<Stakeholder[]> {
    const rows = await prisma.stakeholder.findMany({
      where: { accountId },
    });
    return rows.map(mapStakeholder);
  },

  /**
   * Get a single stakeholder by ID.
   */
  async getStakeholderById(id: string): Promise<Stakeholder | null> {
    const row = await prisma.stakeholder.findUnique({ where: { id } });
    return row ? mapStakeholder(row) : null;
  },

  // ─── Activities ─────────────────────────────────────────

  /**
   * Get activities for a deal, sorted by occurredAt descending.
   */
  async getActivitiesForDeal(dealId: string): Promise<Activity[]> {
    const rows = await prisma.activity.findMany({
      where: { dealId },
      orderBy: { occurredAt: 'desc' },
    });
    return rows.map(mapActivity);
  },

  /**
   * Get the N most recent activities across all deals.
   */
  async getRecentActivities(limit: number = 20): Promise<Activity[]> {
    const rows = await prisma.activity.findMany({
      orderBy: { occurredAt: 'desc' },
      take: limit,
    });
    return rows.map(mapActivity);
  },

  /**
   * Get a single activity by ID (used by calls routes for store.activities.get).
   */
  async getActivityById(id: string): Promise<Activity | null> {
    const row = await prisma.activity.findUnique({ where: { id } });
    return row ? mapActivity(row) : null;
  },

  // ─── Users ──────────────────────────────────────────────

  /**
   * Get a single user by ID.
   */
  async getUserById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? mapUser(row) : null;
  },

  /**
   * Get the current AE user (hardcoded to user_ae_001 for PoC).
   */
  async getCurrentUser(): Promise<User> {
    const row = await prisma.user.findUniqueOrThrow({
      where: { id: 'user_ae_001' },
    });
    return mapUser(row);
  },

  // ─── Notifications ──────────────────────────────────────

  /**
   * Get notifications, optionally filtered to unread only.
   * Sorted by createdAt descending.
   */
  async getNotifications(unreadOnly: boolean = false): Promise<Notification[]> {
    const where: any = {};
    if (unreadOnly) {
      where.read = false;
    }
    const rows = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapNotification);
  },

  /**
   * Get the count of unread notifications.
   */
  async getUnreadNotificationCount(): Promise<number> {
    return prisma.notification.count({
      where: { read: false },
    });
  },

  /**
   * Mark a single notification as read.
   */
  async markNotificationRead(id: string): Promise<void> {
    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  },

  /**
   * Get a single notification by ID (used by dashboard routes
   * for store.notifications.get).
   */
  async getNotificationById(id: string): Promise<Notification | null> {
    const row = await prisma.notification.findUnique({ where: { id } });
    return row ? mapNotification(row) : null;
  },

  // ─── Inbound Leads (Virtual Assistant) ──────────────────

  /**
   * Get inbound leads with optional filters. Includes autoResponses relation.
   * Returns `{ leads, total }` for pagination support.
   */
  async getInboundLeads(filters?: InboundLeadFilters): Promise<InboundLeadResult> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.source) {
      where.source = filters.source;
    }
    if (filters?.region) {
      where.region = filters.region;
    }
    if (filters?.aiQualified !== undefined) {
      where.aiQualified = filters.aiQualified;
    }
    if (filters?.search) {
      const term = filters.search;
      where.OR = [
        { firstName: { contains: term } },
        { lastName: { contains: term } },
        { email: { contains: term } },
        { company: { contains: term } },
      ];
    }

    // Determine sort order
    const sortBy = filters?.sortBy || 'receivedAt';
    const sortOrder = (filters?.sortOrder || 'desc') as 'asc' | 'desc';
    const orderBy: Record<string, 'asc' | 'desc'> = { [sortBy]: sortOrder };

    // Pagination: prefer page/pageSize, fall back to limit/offset
    let take: number | undefined;
    let skip: number | undefined;
    if (filters?.page && filters?.pageSize) {
      take = filters.pageSize;
      skip = (filters.page - 1) * filters.pageSize;
    } else {
      take = filters?.limit;
      skip = filters?.offset;
    }

    const [rows, total] = await Promise.all([
      prisma.inboundLead.findMany({
        where,
        include: { autoResponses: true },
        orderBy,
        take,
        skip,
      }),
      prisma.inboundLead.count({ where }),
    ]);

    return {
      leads: rows.map(mapInboundLead),
      total,
    };
  },

  /**
   * Get a single inbound lead by ID with autoResponses.
   */
  async getInboundLeadById(id: string): Promise<InboundLead | null> {
    const row = await prisma.inboundLead.findUnique({
      where: { id },
      include: { autoResponses: true },
    });
    return row ? mapInboundLead(row) : null;
  },

  /**
   * Compute aggregate lead metrics for the Virtual Assistant dashboard.
   */
  async getLeadMetrics(): Promise<LeadMetrics> {
    const allLeads = await prisma.inboundLead.findMany();

    const totalLeads = allLeads.length;

    // Average response time (only for leads that have a responseTimeMs)
    const leadsWithResponseTime = allLeads.filter((l) => l.responseTimeMs != null);
    const avgResponseTimeMs =
      leadsWithResponseTime.length > 0
        ? Math.round(
            leadsWithResponseTime.reduce((sum, l) => sum + (l.responseTimeMs || 0), 0) /
              leadsWithResponseTime.length,
          )
        : 0;

    // Auto response rate
    const autoRespondedCount = allLeads.filter((l) => l.autoResponseSent).length;
    const autoResponseRate =
      totalLeads > 0 ? Math.round((autoRespondedCount / totalLeads) * 100) / 100 : 0;

    // Qualification rate
    const qualifiedCount = allLeads.filter((l) => l.aiQualified).length;
    const qualificationRate =
      totalLeads > 0 ? Math.round((qualifiedCount / totalLeads) * 100) / 100 : 0;

    // Conversion rate
    const convertedCount = allLeads.filter((l) => l.convertedDealId != null).length;
    const conversionRate =
      totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) / 100 : 0;

    // Leads by status
    const leadsByStatus: Record<string, number> = {};
    for (const lead of allLeads) {
      leadsByStatus[lead.status] = (leadsByStatus[lead.status] || 0) + 1;
    }

    // Leads by source
    const leadsBySource: Record<string, number> = {};
    for (const lead of allLeads) {
      leadsBySource[lead.source] = (leadsBySource[lead.source] || 0) + 1;
    }

    // Leads by region
    const leadsByRegion: Record<string, number> = {};
    for (const lead of allLeads) {
      const region = lead.region || 'unknown';
      leadsByRegion[region] = (leadsByRegion[region] || 0) + 1;
    }

    // Today's leads
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayLeadCount = allLeads.filter(
      (l) => new Date(l.receivedAt) >= todayStart,
    ).length;

    // This week's leads (Monday start)
    const weekStart = new Date();
    const dayOfWeek = weekStart.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - diffToMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekLeadCount = allLeads.filter(
      (l) => new Date(l.receivedAt) >= weekStart,
    ).length;

    // Speed-to-lead distribution (buckets by response time)
    const speedToLeadDistribution: SpeedToLeadDistribution = {
      under5s: 0,
      under15s: 0,
      under30s: 0,
      under60s: 0,
      over60s: 0,
    };
    for (const lead of leadsWithResponseTime) {
      const seconds = (lead.responseTimeMs || 0) / 1000;
      if (seconds < 5) speedToLeadDistribution.under5s++;
      else if (seconds < 15) speedToLeadDistribution.under15s++;
      else if (seconds < 30) speedToLeadDistribution.under30s++;
      else if (seconds < 60) speedToLeadDistribution.under60s++;
      else speedToLeadDistribution.over60s++;
    }

    return {
      totalLeads,
      avgResponseTimeMs,
      autoResponseRate,
      qualificationRate,
      conversionRate,
      leadsByStatus,
      leadsBySource,
      leadsByRegion,
      todayLeadCount,
      weekLeadCount,
      speedToLeadDistribution,
    };
  },

  /**
   * Update the status of an inbound lead.
   */
  async updateLeadStatus(id: string, status: string): Promise<InboundLead> {
    const row = await prisma.inboundLead.update({
      where: { id },
      data: { status },
      include: { autoResponses: true },
    });
    return mapInboundLead(row);
  },

  // ─── Dashboard ──────────────────────────────────────────

  /**
   * Compute the full AE dashboard data: quota attainment, pipeline by stage,
   * deals at risk, today's actions, forecast, and notifications.
   */
  async getDashboardData(): Promise<DashboardData> {
    // Fetch user, all deals (with relations), and notifications in parallel
    const [user, dealRows, notifications] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: 'user_ae_001' } }),
      prisma.deal.findMany({
        include: {
          account: true,
          riskFactors: true,
          competitors: true,
          nextBestActions: true,
        },
      }),
      prisma.notification.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);

    const allDeals = dealRows.map(mapDeal);
    const activeDeals = allDeals.filter(
      (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost',
    );

    // Quota attainment
    const quota = user.quota || 1500000;
    const closedWon = user.closedWonYTD || 680000;
    const weightedPipeline = activeDeals.reduce(
      (sum, d) => sum + (d.value * d.probability) / 100,
      0,
    );
    const gap = quota - closedWon;
    const projected = closedWon + weightedPipeline;
    const attainmentPercent = Math.round((closedWon / quota) * 100);

    const quotaAttainment: QuotaAttainment = {
      quota,
      closedWon,
      weightedPipeline: Math.round(weightedPipeline),
      gap,
      projected: Math.round(projected),
      attainmentPercent,
    };

    // Pipeline by stage
    const pipelineByStage: PipelineStageSummary[] = DEAL_STAGES.map((stageDef) => {
      const stageDeals = activeDeals.filter((d) => d.stage === stageDef.key);
      return {
        stage: stageDef.key,
        label: stageDef.label,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + d.value, 0),
        color: stageDef.color,
      };
    });

    // Deals at risk (healthScore < 60)
    const dealsAtRisk: DealAtRisk[] = activeDeals
      .filter((d) => d.healthScore < 60)
      .map((d) => {
        // Find account name from the raw row (which has the account relation)
        const rawRow = dealRows.find((r) => r.id === d.id);
        const accountName = (rawRow?.account as any)?.name || 'Unknown';
        const topRisk = d.riskFactors
          .filter((r) => !r.isResolved)
          .sort((a, b) => {
            const severityOrder: Record<string, number> = {
              critical: 0,
              high: 1,
              medium: 2,
              low: 3,
            };
            return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
          })[0];
        return {
          dealId: d.id,
          dealName: d.name,
          accountName,
          value: d.value,
          healthScore: d.healthScore,
          stage: d.stage,
          topRisk: topRisk?.description || 'No specific risk identified',
          daysInStage: d.daysInStage,
        };
      })
      .sort((a, b) => a.healthScore - b.healthScore);

    // Today's actions across all deals
    const todayActions: TodayAction[] = [];
    for (const deal of activeDeals) {
      const rawRow = dealRows.find((r) => r.id === deal.id);
      const accountName = (rawRow?.account as any)?.name || 'Unknown';
      for (const action of deal.nextBestActions) {
        if (!action.isCompleted && (action.priority === 'critical' || action.priority === 'high')) {
          todayActions.push({
            dealId: deal.id,
            dealName: deal.name,
            accountName,
            action,
          });
        }
      }
    }
    todayActions.sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        critical: 0,
        high: 1,
        medium: 2,
        low: 3,
      };
      return (priorityOrder[a.action.priority] ?? 3) - (priorityOrder[b.action.priority] ?? 3);
    });

    // Forecast
    const negotiationDeals = activeDeals.filter((d) => d.stage === 'negotiation');
    const proposalDeals = activeDeals.filter((d) => d.stage === 'proposal');
    const otherActiveDeals = activeDeals.filter(
      (d) => d.stage !== 'negotiation' && d.stage !== 'proposal',
    );

    const commit = closedWon + negotiationDeals.reduce((sum, d) => sum + d.value, 0);
    const bestCase = commit + proposalDeals.reduce((sum, d) => sum + d.value, 0);
    const pipeline = bestCase + otherActiveDeals.reduce((sum, d) => sum + d.value, 0);

    const forecast: ForecastData = {
      commit,
      bestCase,
      pipeline,
      target: quota,
    };

    return {
      quotaAttainment,
      pipelineByStage,
      dealsAtRisk,
      todayActions,
      forecast,
      notifications: notifications.map(mapNotification),
    };
  },
};
