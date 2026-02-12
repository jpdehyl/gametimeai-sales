// ============================================================
// Zoom / ZRA Integration Service
// Handles ZRA webhooks, transcript fetching, and call analysis
// Stubbed for PoC — real integration in production
// ============================================================

import { config } from '../config';
import { logger } from '../utils/logger';
import { v4 as uuid } from 'uuid';

interface ZRAWebhookPayload {
  event: string;
  callId: string;
  transcript_url?: string;
  duration: number;
  participants: string[];
  direction?: 'inbound' | 'outbound';
  dealId?: string;
  accountId?: string;
}

export class ZoomService {
  /**
   * Process incoming ZRA webhook for call completion.
   * In production, triggers the AI analysis pipeline.
   * For PoC, returns a mock analysis ID.
   */
  async processCallWebhook(payload: ZRAWebhookPayload): Promise<{ analysisId: string; status: string }> {
    logger.info(`Processing ZRA webhook: ${payload.event} for call ${payload.callId}`);

    const analysisId = `gt_analysis_${uuid().substring(0, 8)}`;

    // In production: match call to deal/stakeholder, fetch transcript, run AI analysis
    // For PoC: just acknowledge the webhook
    logger.info(`Call analysis queued: ${analysisId} (PoC — no real processing)`);

    return {
      analysisId,
      status: 'processing',
    };
  }

  /**
   * Validate ZRA webhook signature.
   */
  validateWebhookSignature(payload: string, signature: string): boolean {
    if (!config.zoom.webhookSecret) {
      logger.warn('Zoom webhook secret not configured — skipping validation');
      return true; // Allow in dev
    }

    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', config.zoom.webhookSecret)
      .update(payload)
      .digest('hex');

    return signature === `v0=${expectedSignature}`;
  }
}

export const zoomService = new ZoomService();
