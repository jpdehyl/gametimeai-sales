// ============================================================
// Call Intelligence Routes — US-005
// GET /api/v1/calls — Recent call list
// GET /api/v1/calls/:id — Call detail with analysis
// POST /api/v1/webhooks/zra — ZRA webhook endpoint
// ============================================================

import { Router, Request, Response } from 'express';
import { store } from '../store';
import { zoomService } from '../services/zoom.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/v1/calls
 * List recent calls with AI analysis.
 */
router.get('/', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 20;
  const leadId = req.query.leadId as string;

  let calls = leadId
    ? store.getCallsForLead(leadId)
    : store.getRecentCalls(limit);

  res.json({
    data: calls.map((call) => {
      const lead = store.getLeadById(call.leadId);
      return {
        id: call.id,
        leadId: call.leadId,
        leadName: lead?.displayName || 'Unknown',
        leadCompany: lead?.company || 'Unknown',
        duration: call.duration,
        direction: call.direction,
        outcome: call.outcome,
        summary: call.summary,
        sentimentScore: call.sentimentScore,
        analysisStatus: call.analysisStatus,
        callDate: call.callDate,
        actionItems: call.actionItems.length,
        coachingTips: call.coachingTips.length,
      };
    }),
  });
});

/**
 * GET /api/v1/calls/:id
 * Full call detail with transcript analysis, key moments, coaching.
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

  const lead = store.getLeadById(call.leadId);

  res.json({
    data: {
      ...call,
      lead: lead
        ? {
            id: lead.id,
            displayName: lead.displayName,
            company: lead.company,
            title: lead.title,
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
 * Per PRD Section 6: API Contracts
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

  const { event, callId, transcript_url, duration, participants, direction } = req.body;

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
    });

    // Return 202 Accepted — analysis runs async (per PRD)
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
