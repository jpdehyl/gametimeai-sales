// ============================================================
// Deal Routes — AE Deal Intelligence Platform
// GET /api/v1/deals — List deals with pipeline data
// GET /api/v1/deals/:id — Full deal room
// POST /api/v1/deals/:id/actions/:actionId/complete — Complete action
// POST /api/v1/deals/:id/stage — Update deal stage
// ============================================================

import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

/**
 * GET /api/v1/deals
 * List all deals with pipeline data.
 * Supports filtering by stage, search, and pagination.
 */
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const stage = req.query.stage as string;
  const search = (req.query.search as string || '').toLowerCase();
  const sortBy = (req.query.sortBy as string) || 'closeDate';
  const sortDir = (req.query.sortDir as string) || 'asc';

  let deals = await db.getDeals({ stage, search: search || undefined });

  // Sort
  deals.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'amount':
        cmp = a.value - b.value;
        break;
      case 'healthScore':
        cmp = a.healthScore - b.healthScore;
        break;
      case 'stage':
        cmp = a.stage.localeCompare(b.stage);
        break;
      case 'closeDate':
      default:
        cmp = new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
        break;
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const total = deals.length;
  const start = (page - 1) * pageSize;
  const paginatedDeals = deals.slice(start, start + pageSize);

  const dealResults = await Promise.all(
    paginatedDeals.map(async (deal) => {
      const account = await db.getAccountById(deal.accountId);
      const owner = await db.getUserById(deal.ownerId);
      const activities = await db.getActivitiesForDeal(deal.id);

      const lastActivityDate = activities.length > 0
        ? activities.reduce((latest, act) =>
            act.occurredAt > latest ? act.occurredAt : latest,
            activities[0].occurredAt
          )
        : null;

      return {
        id: deal.id,
        name: deal.name,
        accountId: deal.accountId,
        accountName: account?.name || 'Unknown',
        amount: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        closeDate: deal.closeDate,
        healthScore: deal.healthScore,
        riskFactors: deal.riskFactors,
        ownerName: owner?.name || 'Unknown',
        nextActions: (deal.nextBestActions || [])
          .filter((a) => !a.isCompleted)
          .slice(0, 2)
          .map((a) => ({
            ...a,
            completed: a.isCompleted,
            dueDate: a.dueDate,
          })),
        daysInStage: deal.daysInStage,
        lastActivityDate,
      };
    })
  );

  res.json({
    data: dealResults,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

/**
 * GET /api/v1/deals/:id
 * Full deal room: deal data, account info, stakeholders,
 * activities, competitive intel, MEDDIC scorecard, and next actions.
 */
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const deal = await db.getDealById(req.params.id);

  if (!deal) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Deal ${req.params.id} not found`,
      statusCode: 404,
    });
  }

  const account = await db.getAccountById(deal.accountId);
  const stakeholders = await db.getStakeholdersForDeal(deal.id);
  const activities = await db.getActivitiesForDeal(deal.id);
  const owner = await db.getUserById(deal.ownerId);

  const accountName = account?.name || 'Unknown';
  const ownerName = owner?.name || 'Unknown';

  const lastActivityDate = activities.length > 0
    ? activities.reduce((latest, act) =>
        act.occurredAt > latest ? act.occurredAt : latest,
        activities[0].occurredAt
      )
    : null;

  const deriveEngagementLevel = (contactFrequency: string): string => {
    switch (contactFrequency) {
      case 'weekly': return 'high';
      case 'biweekly': return 'medium-high';
      case 'monthly': return 'medium';
      case 'quarterly': return 'low';
      case 'never': return 'none';
      default: return 'unknown';
    }
  };

  const competitiveIntel = {
    competitors: deal.competitors.map((c) => ({
      name: c.competitorName,
      threatLevel: c.threatLevel,
      strengths: c.strengths,
      weaknesses: c.weaknesses,
      keyDifferentiators: c.keyDifferentiators,
      objectionHandlers: c.objectionHandlers,
      incumbentProduct: c.incumbentProduct,
      relationshipStrength: c.relationshipStrength,
      lastMentionedAt: c.lastMentionedAt,
      mentionedBy: c.mentionedBy,
    })),
    ourStrengths: deal.competitors.flatMap((c) => c.ourAdvantages),
    ourWeaknesses: deal.competitors.flatMap((c) => c.weaknesses),
    landmines: deal.competitors
      .filter((c) => c.threatLevel === 'high')
      .map((c) => `${c.competitorName}: ${c.strengths[0] || 'Active threat'}`),
  };

  const activityResults = await Promise.all(
    activities.map(async (a) => {
      const stakeholder = a.stakeholderId
        ? await db.getStakeholderById(a.stakeholderId)
        : null;
      return {
        id: a.id,
        type: a.type,
        description: a.summary,
        dealId: a.dealId,
        dealName: deal.name,
        stakeholderName: stakeholder?.name || null,
        timestamp: a.occurredAt,
        outcome: a.outcome,
      };
    })
  );

  res.json({
    data: {
      deal: {
        id: deal.id,
        name: deal.name,
        accountId: deal.accountId,
        accountName,
        amount: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        closeDate: deal.closeDate,
        healthScore: deal.healthScore,
        riskFactors: deal.riskFactors,
        ownerName,
        daysInStage: deal.daysInStage,
        lastActivityDate,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
      },
      account: account
        ? {
            id: account.id,
            name: account.name,
            industry: account.industry,
            employeeCount: account.employeeCount,
            annualRevenue: account.estimatedRevenue,
            website: account.website,
            healthScore: account.healthScore,
          }
        : null,
      stakeholders: stakeholders.map((s) => ({
        id: s.id,
        name: s.name,
        title: s.title,
        role: s.roles[0] || null,
        email: s.email,
        phone: s.phone,
        sentiment: s.sentiment,
        engagementLevel: deriveEngagementLevel(s.contactFrequency),
        lastContactDate: s.lastContactedAt,
        influenceLevel: s.influenceLevel,
      })),
      activities: activityResults,
      competitiveIntel,
      meddic: deal.meddic,
      nextActions: deal.nextBestActions.map((a) => ({
        ...a,
        completed: a.isCompleted,
        dueDate: a.dueDate,
      })),
    },
  });
});

/**
 * POST /api/v1/deals/:id/actions/:actionId/complete
 * Mark a next-best-action as completed.
 */
router.post(
  '/:id/actions/:actionId/complete',
  async (req: Request<{ id: string; actionId: string }>, res: Response) => {
    const result = await db.completeAction(req.params.id, req.params.actionId);

    if (!result) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Action ${req.params.actionId} not found on deal ${req.params.id}`,
        statusCode: 404,
      });
    }

    res.json({
      data: {
        dealId: req.params.id,
        actionId: result.action.id,
        completed: true,
        completedAt: result.action.completedAt,
        remainingActions: result.remainingActions,
      },
    });
  }
);

/**
 * POST /api/v1/deals/:id/stage
 * Update deal stage.
 */
router.post('/:id/stage', async (req: Request<{ id: string }>, res: Response) => {
  const deal = await db.getDealById(req.params.id);

  if (!deal) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Deal ${req.params.id} not found`,
      statusCode: 404,
    });
  }

  const { stage } = req.body;

  if (!stage) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'stage is required in request body',
      statusCode: 400,
    });
  }

  const validStages = [
    'discovery', 'qualification', 'technical_evaluation',
    'proposal', 'negotiation', 'closed_won', 'closed_lost',
  ];

  if (!validStages.includes(stage)) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: `Invalid stage. Must be one of: ${validStages.join(', ')}`,
      statusCode: 400,
    });
  }

  const stageProbability: Record<string, number> = {
    discovery: 10, qualification: 25, technical_evaluation: 40,
    proposal: 60, negotiation: 80, closed_won: 100, closed_lost: 0,
  };

  const previousStage = deal.stage;
  const updatedDeal = await db.updateDealStage(
    req.params.id,
    stage,
    stageProbability[stage] ?? deal.probability
  );

  res.json({
    data: {
      id: deal.id,
      name: deal.name,
      previousStage,
      newStage: stage,
      probability: updatedDeal?.probability ?? deal.probability,
      daysInStage: 0,
      updatedAt: updatedDeal?.updatedAt ?? new Date(),
    },
  });
});

export default router;
