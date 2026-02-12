// ============================================================
// Lead Routes — US-001, US-002
// GET /api/v1/leads — Prioritized lead list
// GET /api/v1/leads/:id — Lead detail with enrichment
// POST /api/v1/leads/sync — Trigger Salesforce sync
// POST /api/v1/leads/:id/score — Re-score a lead
// ============================================================

import { Router, Request, Response } from 'express';
import { store } from '../store';
import { aiService } from '../services/ai.service';
import { salesforceService } from '../services/salesforce.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/leads
 * Fetch prioritized lead list for authenticated SDR.
 * Per PRD Section 6: API Contracts
 */
router.get('/', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const status = req.query.status as string;
  const minScore = parseInt(req.query.minScore as string) || 0;
  const search = (req.query.search as string || '').toLowerCase();

  let leads = store.getLeadsSorted();

  // Filter by status
  if (status) {
    leads = leads.filter((l) => l.status === status);
  }

  // Filter by minimum score
  if (minScore > 0) {
    leads = leads.filter((l) => l.aiScore >= minScore);
  }

  // Search filter
  if (search) {
    leads = leads.filter(
      (l) =>
        l.displayName.toLowerCase().includes(search) ||
        l.company.toLowerCase().includes(search) ||
        l.email.toLowerCase().includes(search)
    );
  }

  const total = leads.length;
  const start = (page - 1) * pageSize;
  const paginatedLeads = leads.slice(start, start + pageSize);

  res.json({
    data: paginatedLeads.map((lead) => ({
      id: lead.id,
      salesforceId: lead.salesforceId,
      displayName: lead.displayName,
      email: lead.email,
      company: lead.company,
      title: lead.title,
      phone: lead.phone,
      industry: lead.industry,
      aiScore: lead.aiScore,
      scoreFactors: lead.scoreFactors,
      recommendedAction: lead.recommendedAction,
      lastActivity: lead.lastActivity,
      status: lead.status,
      syncStatus: lead.syncStatus,
      contactAttempts: lead.contactAttempts,
      buyingSignals: lead.buyingSignals.length,
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
 * GET /api/v1/leads/:id
 * Full lead detail with enrichment, interactions, and scoring.
 */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const lead = store.getLeadById(req.params.id);

  if (!lead) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Lead ${req.params.id} not found`,
      statusCode: 404,
    });
  }

  const calls = store.getCallsForLead(lead.id);

  res.json({
    data: {
      ...lead,
      interactions: {
        calls: calls.map((c) => ({
          id: c.id,
          date: c.callDate,
          duration: c.duration,
          outcome: c.outcome,
          summary: c.summary,
          sentimentScore: c.sentimentScore,
        })),
        totalCalls: calls.length,
      },
    },
  });
});

/**
 * POST /api/v1/leads/sync
 * Trigger Salesforce lead sync. (US-001)
 */
router.post('/sync', async (_req: Request, res: Response) => {
  try {
    const result = await salesforceService.syncLeads();
    res.json({
      data: {
        message: 'Sync completed',
        ...result,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Lead sync endpoint failed', { error });
    res.status(500).json({
      error: 'SYNC_FAILED',
      message: 'Lead sync failed. Will retry automatically.',
      statusCode: 500,
    });
  }
});

/**
 * POST /api/v1/leads/:id/score
 * Re-score a specific lead. (US-002)
 */
router.post('/:id/score', (req: Request<{ id: string }>, res: Response) => {
  const lead = store.getLeadById(req.params.id);

  if (!lead) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Lead ${req.params.id} not found`,
      statusCode: 404,
    });
  }

  const { score, factors } = aiService.scoreLead(lead);
  const previousScore = lead.aiScore;

  lead.aiScore = score;
  lead.scoreFactors = factors;
  lead.lastScoredAt = new Date();
  lead.updatedAt = new Date();
  store.leads.set(lead.id, lead);

  // Notify on significant score change (>15 points, per US-002 AC)
  const scoreDelta = score - previousScore;
  if (Math.abs(scoreDelta) > 15) {
    store.notifications.set(`notif_score_${lead.id}_${Date.now()}`, {
      id: `notif_score_${lead.id}_${Date.now()}`,
      type: 'score_change',
      title: `Score ${scoreDelta > 0 ? 'Increased' : 'Decreased'} ${scoreDelta > 0 ? '+' : ''}${scoreDelta}`,
      message: `${lead.displayName} (${lead.company}) score changed from ${previousScore} to ${score}`,
      leadId: lead.id,
      read: false,
      createdAt: new Date(),
    });
  }

  // Write score back to SF
  salesforceService.writeScoreToSalesforce(lead.salesforceId, score, factors);

  res.json({
    data: {
      leadId: lead.id,
      previousScore,
      newScore: score,
      factors,
      scoredAt: lead.lastScoredAt,
    },
  });
});

export default router;
