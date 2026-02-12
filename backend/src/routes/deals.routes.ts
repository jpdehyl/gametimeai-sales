// ============================================================
// Deal Routes — AE Deal Intelligence Platform
// GET /api/v1/deals — List deals with pipeline data
// GET /api/v1/deals/:id — Full deal room
// POST /api/v1/deals/:id/actions/:actionId/complete — Complete action
// POST /api/v1/deals/:id/stage — Update deal stage
// ============================================================

import { Router, Request, Response } from 'express';
import { store } from '../store';

const router = Router();

/**
 * GET /api/v1/deals
 * List all deals with pipeline data.
 * Supports filtering by stage, search, and pagination.
 */
router.get('/', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const stage = req.query.stage as string;
  const search = (req.query.search as string || '').toLowerCase();
  const sortBy = (req.query.sortBy as string) || 'closeDate';
  const sortDir = (req.query.sortDir as string) || 'asc';

  let deals = store.getDeals();

  // Filter by stage
  if (stage) {
    deals = deals.filter((d) => d.stage === stage);
  }

  // Search filter
  if (search) {
    deals = deals.filter(
      (d) =>
        d.name.toLowerCase().includes(search) ||
        d.accountName.toLowerCase().includes(search)
    );
  }

  // Sort
  deals.sort((a, b) => {
    let cmp = 0;
    switch (sortBy) {
      case 'amount':
        cmp = a.amount - b.amount;
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

  res.json({
    data: paginatedDeals.map((deal) => ({
      id: deal.id,
      name: deal.name,
      accountId: deal.accountId,
      accountName: deal.accountName,
      amount: deal.amount,
      stage: deal.stage,
      probability: deal.probability,
      closeDate: deal.closeDate,
      healthScore: deal.healthScore,
      riskFactors: deal.riskFactors,
      ownerName: deal.ownerName,
      nextActions: (deal.nextActions || []).filter((a) => !a.completed).slice(0, 2),
      daysInStage: deal.daysInStage,
      lastActivityDate: deal.lastActivityDate,
    })),
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
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const deal = store.getDealById(req.params.id);

  if (!deal) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Deal ${req.params.id} not found`,
      statusCode: 404,
    });
  }

  const account = store.getAccountById(deal.accountId);
  const stakeholders = store.getStakeholdersForDeal(deal.id);
  const activities = store.getActivitiesForDeal(deal.id);

  res.json({
    data: {
      deal: {
        id: deal.id,
        name: deal.name,
        accountId: deal.accountId,
        accountName: deal.accountName,
        amount: deal.amount,
        stage: deal.stage,
        probability: deal.probability,
        closeDate: deal.closeDate,
        healthScore: deal.healthScore,
        riskFactors: deal.riskFactors,
        ownerName: deal.ownerName,
        daysInStage: deal.daysInStage,
        lastActivityDate: deal.lastActivityDate,
        createdAt: deal.createdAt,
        updatedAt: deal.updatedAt,
      },
      account: account
        ? {
            id: account.id,
            name: account.name,
            industry: account.industry,
            employeeCount: account.employeeCount,
            annualRevenue: account.annualRevenue,
            website: account.website,
            healthScore: account.healthScore,
          }
        : null,
      stakeholders: stakeholders.map((s) => ({
        id: s.id,
        name: s.name,
        title: s.title,
        role: s.role,
        email: s.email,
        phone: s.phone,
        sentiment: s.sentiment,
        engagementLevel: s.engagementLevel,
        lastContactDate: s.lastContactDate,
        influenceLevel: s.influenceLevel,
      })),
      activities: activities.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        dealId: a.dealId,
        dealName: a.dealName,
        stakeholderName: a.stakeholderName,
        timestamp: a.timestamp,
        outcome: a.outcome,
      })),
      competitiveIntel: deal.competitiveIntel || {
        competitors: [],
        ourStrengths: [],
        ourWeaknesses: [],
        landmines: [],
      },
      meddic: deal.meddic || {
        metrics: null,
        economicBuyer: null,
        decisionCriteria: null,
        decisionProcess: null,
        identifyPain: null,
        champion: null,
      },
      nextActions: deal.nextActions || [],
    },
  });
});

/**
 * POST /api/v1/deals/:id/actions/:actionId/complete
 * Mark a next-best-action as completed.
 */
router.post(
  '/:id/actions/:actionId/complete',
  (req: Request<{ id: string; actionId: string }>, res: Response) => {
    const deal = store.getDealById(req.params.id);

    if (!deal) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Deal ${req.params.id} not found`,
        statusCode: 404,
      });
    }

    const actions = deal.nextActions || [];
    const action = actions.find((a) => a.id === req.params.actionId);

    if (!action) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Action ${req.params.actionId} not found on deal ${req.params.id}`,
        statusCode: 404,
      });
    }

    action.completed = true;
    action.completedAt = new Date().toISOString();
    deal.updatedAt = new Date().toISOString();

    res.json({
      data: {
        dealId: deal.id,
        actionId: action.id,
        completed: true,
        completedAt: action.completedAt,
        remainingActions: actions.filter((a) => !a.completed).length,
      },
    });
  }
);

/**
 * POST /api/v1/deals/:id/stage
 * Update deal stage. Returns the updated deal.
 */
router.post('/:id/stage', (req: Request<{ id: string }>, res: Response) => {
  const deal = store.getDealById(req.params.id);

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
    'discovery',
    'qualification',
    'demo',
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost',
  ];

  if (!validStages.includes(stage)) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: `Invalid stage. Must be one of: ${validStages.join(', ')}`,
      statusCode: 400,
    });
  }

  const previousStage = deal.stage;
  deal.stage = stage;
  deal.daysInStage = 0;
  deal.updatedAt = new Date().toISOString();

  // Update probability based on stage
  const stageProbability: Record<string, number> = {
    discovery: 10,
    qualification: 25,
    demo: 40,
    proposal: 60,
    negotiation: 80,
    closed_won: 100,
    closed_lost: 0,
  };
  deal.probability = stageProbability[stage] ?? deal.probability;

  res.json({
    data: {
      id: deal.id,
      name: deal.name,
      previousStage,
      newStage: deal.stage,
      probability: deal.probability,
      daysInStage: deal.daysInStage,
      updatedAt: deal.updatedAt,
    },
  });
});

export default router;
