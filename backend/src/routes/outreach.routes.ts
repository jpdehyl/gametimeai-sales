// ============================================================
// Outreach Routes — US-003
// POST /api/v1/outreach/generate — Generate AI outreach emails
// GET /api/v1/outreach/sequences — List outreach sequences
// GET /api/v1/outreach/sequences/:id — Get sequence detail
// ============================================================

import { Router, Request, Response } from 'express';
import { store } from '../store';
import { aiService } from '../services/ai.service';
import { OutreachSequence } from '../types';
import { v4 as uuid } from 'uuid';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/outreach/generate
 * Generate AI-powered outreach emails for a lead. (US-003)
 * Per PRD Section 6: API Contracts
 */
router.post('/generate', async (req: Request, res: Response) => {
  const { leadId, sequenceType, variants = 3, tone = 'professional_casual' } = req.body;

  if (!leadId) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'leadId is required',
      statusCode: 400,
    });
  }

  const lead = store.getLeadById(leadId);
  if (!lead) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Lead ${leadId} not found`,
      statusCode: 404,
    });
  }

  // Check if lead has enrichment data (US-003 AC: edge case)
  const hasEnrichment = lead.companyIntel.summary && lead.companyIntel.summary.length > 0;

  try {
    const emailVariants = await aiService.generateOutreach(
      lead,
      sequenceType || 'cold_intro',
      Math.min(variants, 5),
      tone
    );

    // Create a sequence record
    const sequence: OutreachSequence = {
      id: `gt_seq_${uuid().substring(0, 8)}`,
      leadId: lead.id,
      sdrId: 'user_demo_001', // In production, from auth context
      steps: emailVariants.map((variant, i) => ({
        stepNumber: i + 1,
        channel: 'email' as const,
        delayDays: i * 3, // 3-day intervals
        subject: variant.subject,
        body: variant.body,
        status: 'pending' as const,
      })),
      status: 'draft',
      generatedBy: 'ai',
      personalizationContext: hasEnrichment
        ? `Company: ${lead.company}, Industry: ${lead.industry}, Signals: ${lead.buyingSignals.length}`
        : 'Limited data — generic template with personalization prompts',
      emailsSent: 0,
      emailsOpened: 0,
      replies: 0,
      meetingsBooked: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.sequences.set(sequence.id, sequence);
    const leadSequences = store.sequencesByLeadId.get(lead.id) || [];
    leadSequences.push(sequence.id);
    store.sequencesByLeadId.set(lead.id, leadSequences);

    res.json({
      data: {
        sequenceId: sequence.id,
        variants: emailVariants,
        hasEnrichment,
        personalizationContext: sequence.personalizationContext,
      },
    });
  } catch (error) {
    logger.error('Outreach generation failed', { error, leadId });
    res.status(500).json({
      error: 'GENERATION_FAILED',
      message: 'Failed to generate outreach. Please try again.',
      statusCode: 500,
    });
  }
});

/**
 * GET /api/v1/outreach/sequences
 * List outreach sequences for the current user.
 */
router.get('/sequences', (req: Request, res: Response) => {
  const leadId = req.query.leadId as string;
  let sequences = Array.from(store.sequences.values());

  if (leadId) {
    sequences = sequences.filter((s) => s.leadId === leadId);
  }

  sequences.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  res.json({
    data: sequences.map((seq) => ({
      id: seq.id,
      leadId: seq.leadId,
      leadName: store.getLeadById(seq.leadId)?.displayName || 'Unknown',
      status: seq.status,
      steps: seq.steps.length,
      generatedBy: seq.generatedBy,
      emailsSent: seq.emailsSent,
      replies: seq.replies,
      meetingsBooked: seq.meetingsBooked,
      createdAt: seq.createdAt,
    })),
  });
});

/**
 * GET /api/v1/outreach/sequences/:id
 * Get full sequence detail.
 */
router.get('/sequences/:id', (req: Request<{ id: string }>, res: Response) => {
  const sequence = store.sequences.get(req.params.id);

  if (!sequence) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Sequence ${req.params.id} not found`,
      statusCode: 404,
    });
  }

  const lead = store.getLeadById(sequence.leadId);

  res.json({
    data: {
      ...sequence,
      lead: lead
        ? { id: lead.id, displayName: lead.displayName, company: lead.company }
        : null,
    },
  });
});

export default router;
