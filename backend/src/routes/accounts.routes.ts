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
    data: paginatedAccounts.map((account) => {
      // Compute deal stats from store since Account type has no totalDeals/openDeals/totalDealValue
      const accountDeals = store.getDealsByAccount(account.id);
      const openDeals = accountDeals.filter(
        (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost'
      );
      const totalDealValue = accountDeals.reduce((sum, d) => sum + d.value, 0);

      // Compute lastActivityDate from activities across all deals for this account
      let lastActivityDate: Date | null = null;
      for (const deal of accountDeals) {
        const activities = store.getActivitiesForDeal(deal.id);
        for (const act of activities) {
          if (!lastActivityDate || act.occurredAt > lastActivityDate) {
            lastActivityDate = act.occurredAt;
          }
        }
      }

      return {
        id: account.id,
        name: account.name,
        industry: account.industry,
        employeeCount: account.employeeCount,
        annualRevenue: account.estimatedRevenue,
        website: account.website,
        healthScore: account.healthScore,
        totalDeals: accountDeals.length,
        openDeals: openDeals.length,
        totalDealValue,
        lastActivityDate: lastActivityDate ? lastActivityDate.toISOString() : null,
      };
    }),
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

  // Get all deals for this account
  const accountDeals = store.getDealsByAccount(account.id);

  // Collect activities from all deals for this account
  const activities = accountDeals.flatMap((deal) => store.getActivitiesForDeal(deal.id));
  // Sort activities by occurredAt descending
  activities.sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  // Compute deal stats since Account type has no totalDeals/openDeals/totalDealValue
  const openDeals = accountDeals.filter(
    (d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost'
  );
  const totalDealValue = accountDeals.reduce((sum, d) => sum + d.value, 0);

  // Compute lastActivityDate
  const lastActivityDate = activities.length > 0 ? activities[0].occurredAt : null;

  res.json({
    data: {
      account: {
        id: account.id,
        name: account.name,
        industry: account.industry,
        employeeCount: account.employeeCount,
        annualRevenue: account.estimatedRevenue,
        website: account.website,
        healthScore: account.healthScore,
        totalDeals: accountDeals.length,
        openDeals: openDeals.length,
        totalDealValue,
        lastActivityDate: lastActivityDate ? lastActivityDate.toISOString() : null,
        description: account.summary,
        techStack: account.techStack,
        recentNews: account.recentNews,
      },
      stakeholders: stakeholders.map((s) => {
        // Derive engagementLevel from contactFrequency
        const frequencyToEngagement: Record<string, string> = {
          weekly: 'high',
          biweekly: 'high',
          monthly: 'medium',
          quarterly: 'low',
          never: 'low',
        };
        return {
          id: s.id,
          name: s.name,
          title: s.title,
          role: s.roles[0] || null,
          email: s.email,
          phone: s.phone,
          sentiment: s.sentiment,
          engagementLevel: frequencyToEngagement[s.contactFrequency] || 'medium',
          lastContactDate: s.lastContactedAt,
          influenceLevel: s.influenceLevel,
        };
      }),
      deals: accountDeals.map((d) => ({
        id: d.id,
        name: d.name,
        amount: d.value,
        stage: d.stage,
        probability: d.probability,
        closeDate: d.closeDate,
        healthScore: d.healthScore,
        ownerName: store.getUserById(d.ownerId)?.name || 'Unknown',
        daysInStage: d.daysInStage,
      })),
      activities: activities.map((a) => {
        // Lookup deal name and stakeholder name
        const deal = store.getDealById(a.dealId);
        const stakeholder = a.stakeholderId
          ? store.getStakeholderById(a.stakeholderId)
          : undefined;
        return {
          id: a.id,
          type: a.type,
          description: a.summary,
          dealId: a.dealId,
          dealName: deal?.name || 'Unknown',
          stakeholderName: stakeholder?.name || null,
          timestamp: a.occurredAt,
          outcome: a.outcome,
        };
      }),
    },
  });
});

export default router;
