// ============================================================
// Account Routes — AE Deal Intelligence Platform
// GET /api/v1/accounts — List accounts with health scores
// GET /api/v1/accounts/:id — Full account detail
// ============================================================

import { Router, Request, Response } from 'express';
import { store } from '../store';

const router = Router();

/**
 * GET /api/v1/accounts
 * List all accounts with health scores.
 * Supports search and pagination.
 */
router.get('/', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const search = (req.query.search as string || '').toLowerCase();
  const industry = req.query.industry as string;

  let accounts = store.getAccounts();

  // Search filter
  if (search) {
    accounts = accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(search) ||
        (a.industry && a.industry.toLowerCase().includes(search))
    );
  }

  // Industry filter
  if (industry) {
    accounts = accounts.filter(
      (a) => a.industry && a.industry.toLowerCase() === industry.toLowerCase()
    );
  }

  // Sort by health score descending
  accounts.sort((a, b) => (b.healthScore || 0) - (a.healthScore || 0));

  const total = accounts.length;
  const start = (page - 1) * pageSize;
  const paginatedAccounts = accounts.slice(start, start + pageSize);

  res.json({
    data: paginatedAccounts.map((account) => ({
      id: account.id,
      name: account.name,
      industry: account.industry,
      employeeCount: account.employeeCount,
      annualRevenue: account.annualRevenue,
      website: account.website,
      healthScore: account.healthScore,
      totalDeals: account.totalDeals,
      openDeals: account.openDeals,
      totalDealValue: account.totalDealValue,
      lastActivityDate: account.lastActivityDate,
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
 * GET /api/v1/accounts/:id
 * Full account detail with stakeholders, deals, and activities.
 */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const account = store.getAccountById(req.params.id);

  if (!account) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Account ${req.params.id} not found`,
      statusCode: 404,
    });
  }

  const stakeholders = store.getStakeholdersForAccount(account.id);
  const activities = store.getActivitiesForAccount(account.id);

  // Get all deals for this account
  const allDeals = store.getDeals();
  const accountDeals = allDeals.filter((d) => d.accountId === account.id);

  res.json({
    data: {
      account: {
        id: account.id,
        name: account.name,
        industry: account.industry,
        employeeCount: account.employeeCount,
        annualRevenue: account.annualRevenue,
        website: account.website,
        healthScore: account.healthScore,
        totalDeals: account.totalDeals,
        openDeals: account.openDeals,
        totalDealValue: account.totalDealValue,
        lastActivityDate: account.lastActivityDate,
        description: account.description,
        techStack: account.techStack,
        recentNews: account.recentNews,
      },
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
      deals: accountDeals.map((d) => ({
        id: d.id,
        name: d.name,
        amount: d.amount,
        stage: d.stage,
        probability: d.probability,
        closeDate: d.closeDate,
        healthScore: d.healthScore,
        ownerName: d.ownerName,
        daysInStage: d.daysInStage,
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
    },
  });
});

export default router;
