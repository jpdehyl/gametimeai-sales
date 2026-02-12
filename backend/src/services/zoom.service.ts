// ============================================================
// Zoom / ZRA Integration Service (US-005)
// Handles ZRA webhooks, transcript fetching, and call analysis
// ============================================================

import { config } from '../config';
import { logger } from '../utils/logger';
import { store } from '../store';
import { CallIntelligence } from '../types';
import { v4 as uuid } from 'uuid';
import { aiService } from './ai.service';
import { salesforceService } from './salesforce.service';

interface ZRAWebhookPayload {
  event: string;
  callId: string;
  transcript_url?: string;
  duration: number;
  participants: string[];
  direction?: 'inbound' | 'outbound';
}

export class ZoomService {
  /**
   * Process incoming ZRA webhook for call completion. (US-005)
   * Triggers the AI analysis pipeline.
   */
  async processCallWebhook(payload: ZRAWebhookPayload): Promise<{ analysisId: string; status: string }> {
    logger.info(`Processing ZRA webhook: ${payload.event} for call ${payload.callId}`);

    const analysisId = `gt_analysis_${uuid().substring(0, 8)}`;

    // Find the lead associated with this call
    const callerEmail = payload.participants.find((p) => p.includes('@'));
    let leadId: string | undefined;

    if (callerEmail) {
      for (const lead of store.leads.values()) {
        if (lead.email === callerEmail || payload.participants.includes(lead.phone || '')) {
          leadId = lead.id;
          break;
        }
      }
    }

    // Create initial call intelligence record
    const callRecord: CallIntelligence = {
      id: analysisId,
      leadId: leadId || 'unknown',
      zraCallId: payload.callId,
      duration: payload.duration,
      direction: payload.direction || 'outbound',
      outcome: payload.duration > 60 ? 'connected' : payload.duration > 10 ? 'voicemail' : 'no_answer',
      callerEmail,
      summary: '',
      actionItems: [],
      sentimentScore: 0,
      talkRatio: 0,
      keyMoments: [],
      coachingTips: [],
      competitorsMentioned: [],
      analysisStatus: 'processing',
      callDate: new Date(),
      createdAt: new Date(),
    };

    store.calls.set(analysisId, callRecord);
    if (leadId) {
      const leadCalls = store.callsByLeadId.get(leadId) || [];
      leadCalls.push(analysisId);
      store.callsByLeadId.set(leadId, leadCalls);
    }

    // Trigger async analysis
    this.analyzeCallAsync(analysisId, payload.transcript_url);

    return {
      analysisId,
      status: 'processing',
    };
  }

  /**
   * Fetch transcript from ZRA and run AI analysis.
   */
  private async analyzeCallAsync(analysisId: string, transcriptUrl?: string): Promise<void> {
    const call = store.calls.get(analysisId);
    if (!call) return;

    try {
      // Fetch transcript (in production, calls ZRA API)
      const transcript = transcriptUrl
        ? await this.fetchTranscript(transcriptUrl)
        : 'Transcript not available — ZRA webhook did not include transcript URL.';

      // Get lead for context
      const lead = store.leads.get(call.leadId);

      if (lead && transcript) {
        // Run AI analysis
        const analysis = await aiService.analyzeCall(transcript, lead);

        // Update call record
        call.summary = analysis.summary || call.summary;
        call.actionItems = analysis.actionItems || [];
        call.sentimentScore = analysis.sentimentScore || 0;
        call.keyMoments = analysis.keyMoments || [];
        call.coachingTips = analysis.coachingTips || [];
        call.competitorsMentioned = analysis.competitorsMentioned || [];
        call.analysisStatus = 'completed';
        call.analyzedAt = new Date();

        store.calls.set(analysisId, call);

        // Write Task to Salesforce (US-005 AC: Task created on Lead/Contact)
        const taskId = await salesforceService.createCallTask(
          lead.salesforceId,
          call.summary,
          call.actionItems,
          call.duration,
          call.outcome
        );

        if (taskId) {
          call.salesforceTaskId = taskId;
          store.calls.set(analysisId, call);
        }

        // Create notification
        store.notifications.set(`notif_call_${analysisId}`, {
          id: `notif_call_${analysisId}`,
          type: 'call_analyzed',
          title: 'Call Analysis Ready',
          message: `Your call with ${lead.displayName} (${lead.company}) has been analyzed`,
          leadId: lead.id,
          read: false,
          createdAt: new Date(),
        });

        logger.info(`Call analysis complete for ${analysisId}`);
      } else {
        call.analysisStatus = 'completed';
        call.summary = 'Call recorded. Limited analysis available — lead not matched or transcript unavailable.';
        call.analyzedAt = new Date();
        store.calls.set(analysisId, call);
      }
    } catch (error) {
      logger.error(`Call analysis failed for ${analysisId}`, { error });
      call.analysisStatus = 'failed';
      call.summary = 'Call analysis failed. Please review the recording manually.';
      store.calls.set(analysisId, call);
    }
  }

  /**
   * Fetch transcript from ZRA API.
   */
  private async fetchTranscript(transcriptUrl: string): Promise<string> {
    if (!config.zoom.clientId) {
      logger.warn('Zoom not configured — cannot fetch transcript');
      return '';
    }

    try {
      const response = await fetch(transcriptUrl, {
        headers: {
          Authorization: `Bearer ${await this.getZoomAccessToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`ZRA API error: ${response.status}`);
      }

      const data = await response.json() as { transcript: string };
      return data.transcript;
    } catch (error) {
      logger.error('Failed to fetch transcript from ZRA', { error });
      return '';
    }
  }

  /**
   * Get Zoom OAuth access token.
   */
  private async getZoomAccessToken(): Promise<string> {
    const credentials = Buffer.from(
      `${config.zoom.clientId}:${config.zoom.clientSecret}`
    ).toString('base64');

    const response = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=account_credentials&account_id=${config.zoom.accountId}`,
    });

    if (!response.ok) {
      throw new Error(`Zoom OAuth error: ${response.status}`);
    }

    const data = await response.json() as { access_token: string };
    return data.access_token;
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
