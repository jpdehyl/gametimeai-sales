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
 * GET /api/v1/calls
 * List recent calls with deal and account context.
 * Supports filtering by dealId or accountId.
 */
router.get('/', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const dealId = req.query.dealId as string;
  const accountId = req.query.accountId as string;

  let calls = store.getRecentCalls(limit);

  // Filter by dealId if provided
  if (dealId) {
    calls = calls.filter((c) => c.dealId === dealId);
  }

  // Filter by accountId if provided
  if (accountId) {
    calls = calls.filter((c) => c.accountId === accountId);
  }

  res.json({
    data: calls.map((call) => {
      const deal = call.dealId ? store.getDealById(call.dealId) : undefined;
      const account = call.accountId ? store.getAccountById(call.accountId) : undefined;
      return {
        id: call.id,
        dealId: call.dealId,
        dealName: deal?.name || call.dealName || 'Unknown',
        accountId: call.accountId,
        accountName: account?.name || call.accountName || 'Unknown',
        stakeholderName: call.stakeholderName,
        duration: call.duration,
        direction: call.direction,
        outcome: call.outcome,
        summary: call.summary,
        sentimentScore: call.sentimentScore,
        analysisStatus: call.analysisStatus,
        callDate: call.callDate,
        actionItems: call.actionItems?.length || 0,
        coachingTips: call.coachingTips?.length || 0,
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
  const call = store.calls.get(req.params.id);

  if (!call) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Call ${req.params.id} not found`,
      statusCode: 404,
    });
  }

  const deal = call.dealId ? store.getDealById(call.dealId) : undefined;
  const account = call.accountId ? store.getAccountById(call.accountId) : undefined;

  res.json({
    data: {
      ...call,
      deal: deal
        ? {
            id: deal.id,
            name: deal.name,
            accountName: deal.accountName,
            stage: deal.stage,
            amount: deal.amount,
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
