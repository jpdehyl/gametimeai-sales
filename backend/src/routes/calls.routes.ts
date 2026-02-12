// ============================================================
// Call Intelligence Routes — AE Deal Intelligence Platform
// GET /api/v1/calls — Recent calls with deal context
// GET /api/v1/calls/:id — Call detail with coaching
// POST /api/v1/webhooks/zra — ZRA webhook endpoint
// ============================================================

import { Router, Request, Response } from 'express';
import { store } from '../store';
import { zoomService } from '../services/zoom.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Map a numeric sentiment (-1 to 1) to a human-readable label.
 */
function sentimentLabel(score: number | undefined): 'positive' | 'neutral' | 'negative' {
  if (score === undefined) return 'neutral';
  if (score > 0.25) return 'positive';
  if (score < -0.25) return 'negative';
  return 'neutral';
}

/**
 * GET /api/v1/calls
 * List recent calls with deal and account context.
 * Supports filtering by dealId or accountId.
 */
router.get('/', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const dealId = req.query.dealId as string;
  const accountId = req.query.accountId as string;

  // Calls are Activity objects with type === 'call'
  let calls = store
    .getRecentActivities(limit * 3) // over-fetch to have enough after filtering
    .filter((a) => a.type === 'call');

  // Filter by dealId if provided
  if (dealId) {
    calls = calls.filter((c) => c.dealId === dealId);
  }

  // Filter by accountId if provided
  if (accountId) {
    calls = calls.filter((c) => c.accountId === accountId);
  }

  // Apply the requested limit
  calls = calls.slice(0, limit);

  res.json({
    data: calls.map((call) => {
      const deal = call.dealId ? store.getDealById(call.dealId) : undefined;
      const account = call.accountId ? store.getAccountById(call.accountId) : undefined;
      const stakeholder = call.stakeholderId ? store.getStakeholderById(call.stakeholderId) : undefined;

      return {
        id: call.id,
        dealId: call.dealId,
        dealName: deal?.name || 'Unknown',
        accountName: account?.name || 'Unknown',
        stakeholderName: stakeholder?.name || 'Unknown',
        duration: call.duration,
        direction: call.direction,
        sentiment: sentimentLabel(call.sentiment),
        summary: call.summary,
        callDate: call.occurredAt,
        actionItemCount: call.actionItems?.length || 0,
        coachingTipCount: 0, // PoC — coaching tips not yet implemented
      };
    }),
  });
});

/**
 * GET /api/v1/calls/:id
 * Full call detail with transcript analysis, key moments,
 * coaching tips, and deal/account context.
 */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const call = store.activities.get(req.params.id);

  if (!call || call.type !== 'call') {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Call ${req.params.id} not found`,
      statusCode: 404,
    });
  }

  const deal = call.dealId ? store.getDealById(call.dealId) : undefined;
  const account = call.accountId ? store.getAccountById(call.accountId) : undefined;
  const stakeholder = call.stakeholderId ? store.getStakeholderById(call.stakeholderId) : undefined;

  res.json({
    data: {
      id: call.id,
      dealId: call.dealId,
      accountId: call.accountId,
      stakeholderId: call.stakeholderId,
      stakeholderName: stakeholder?.name || 'Unknown',
      direction: call.direction,
      subject: call.subject,
      summary: call.summary,
      sentiment: sentimentLabel(call.sentiment),
      sentimentScore: call.sentiment,
      keyInsights: call.keyInsights,
      actionItems: call.actionItems,
      buyingSignals: call.buyingSignals,
      competitorsMentioned: call.competitorsMentioned,
      duration: call.duration,
      outcome: call.outcome,
      talkRatio: call.talkRatio,
      callDate: call.occurredAt,
      deal: deal
        ? {
            id: deal.id,
            name: deal.name,
            accountName: account?.name || 'Unknown',
            stage: deal.stage,
            value: deal.value,
            healthScore: deal.healthScore,
          }
        : null,
      account: account
        ? {
            id: account.id,
            name: account.name,
            industry: account.industry,
          }
        : null,
    },
  });
});

export default router;

// ============================================================
// ZRA Webhook Route — separate for webhook-specific middleware
// ============================================================

export const webhookRouter = Router();

/**
 * POST /api/v1/webhooks/zra
 * Receive ZRA call completed webhook and trigger AI analysis.
 */
webhookRouter.post('/zra', async (req: Request, res: Response) => {
  logger.info('Received ZRA webhook', { event: req.body.event });

  // Validate webhook signature (in production)
  const signature = req.headers['x-zm-signature'] as string;
  if (signature && !zoomService.validateWebhookSignature(JSON.stringify(req.body), signature)) {
    return res.status(401).json({
      error: 'INVALID_SIGNATURE',
      message: 'Webhook signature validation failed',
      statusCode: 401,
    });
  }

  const { event, callId, transcript_url, duration, participants, direction, dealId, accountId } = req.body;

  if (event !== 'call.completed') {
    // Acknowledge non-call events
    return res.status(200).json({ received: true });
  }

  if (!callId || !participants) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'callId and participants are required',
      statusCode: 400,
    });
  }

  try {
    const result = await zoomService.processCallWebhook({
      event,
      callId,
      transcript_url,
      duration: duration || 0,
      participants: participants || [],
      direction,
      dealId,
      accountId,
    });

    // Return 202 Accepted — analysis runs async
    res.status(202).json({
      analysisId: result.analysisId,
      status: result.status,
      estimatedCompletion: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    logger.error('ZRA webhook processing failed', { error });
    res.status(500).json({
      error: 'PROCESSING_FAILED',
      message: 'Call analysis queued for retry',
      statusCode: 500,
    });
  }
});
