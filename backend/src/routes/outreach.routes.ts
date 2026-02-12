// ============================================================
// Outreach Routes — AE Deal Intelligence Platform
// POST /api/v1/outreach/generate — Generate emails for a stakeholder on a deal
// POST /api/v1/deals/:id/meeting-prep — Generate meeting prep for a deal
// ============================================================

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { aiService } from '../services/ai.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Derive an engagement level label from contactFrequency.
 */
function deriveEngagementLevel(freq: string): 'high' | 'medium' | 'low' {
  switch (freq) {
    case 'weekly': return 'high';
    case 'biweekly': return 'high';
    case 'monthly': return 'medium';
    case 'quarterly': return 'low';
    case 'never': return 'low';
    default: return 'medium';
  }
}

/**
 * POST /api/v1/outreach/generate
 * Generate AI-powered outreach emails for a stakeholder on a specific deal.
 */
router.post('/generate', async (req: Request, res: Response) => {
  const {
    dealId, stakeholderId,
    emailType = 'follow_up', variants = 3,
    tone = 'professional_casual', context,
  } = req.body;

  if (!dealId) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR', message: 'dealId is required', statusCode: 400,
    });
  }

  if (!stakeholderId) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR', message: 'stakeholderId is required', statusCode: 400,
    });
  }

  const deal = await db.getDealById(dealId);
  if (!deal) {
    return res.status(404).json({
      error: 'NOT_FOUND', message: `Deal ${dealId} not found`, statusCode: 404,
    });
  }

  const stakeholders = await db.getStakeholdersForDeal(dealId);
  const stakeholder = stakeholders.find((s) => s.id === stakeholderId);

  if (!stakeholder) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Stakeholder ${stakeholderId} not found on deal ${dealId}`,
      statusCode: 404,
    });
  }

  const account = await db.getAccountById(deal.accountId);
  const activities = await db.getActivitiesForDeal(dealId);

  try {
    const generationContext = {
      deal: {
        name: deal.name,
        stage: deal.stage,
        value: deal.value,
        competitors: deal.competitors,
        meddic: deal.meddic,
      },
      stakeholder: {
        name: stakeholder.name,
        title: stakeholder.title,
        roles: stakeholder.roles.join(', '),
        sentiment: stakeholder.sentiment,
        engagementLevel: deriveEngagementLevel(stakeholder.contactFrequency),
      },
      account: account
        ? {
            name: account.name,
            industry: account.industry,
            techStack: account.techStack,
            recentNews: account.recentNews,
          }
        : null,
      recentActivities: activities.slice(0, 5),
      additionalContext: context || '',
    };

    const emailVariants = await aiService.generateOutreach(
      generationContext, emailType, Math.min(variants, 5), tone
    );

    res.json({
      data: {
        dealId: deal.id,
        dealName: deal.name,
        stakeholderId: stakeholder.id,
        stakeholderName: stakeholder.name,
        emailType,
        variants: emailVariants,
        generationContext: {
          dealStage: deal.stage,
          stakeholderRoles: stakeholder.roles.join(', '),
          accountIndustry: account?.industry || 'Unknown',
        },
      },
    });
  } catch (error) {
    logger.error('Outreach generation failed', { error, dealId, stakeholderId });
    res.status(500).json({
      error: 'GENERATION_FAILED',
      message: 'Failed to generate outreach. Please try again.',
      statusCode: 500,
    });
  }
});

/**
 * POST /api/v1/deals/:id/meeting-prep
 * Generate AI-powered meeting preparation for a deal.
 */
router.post('/deals/:id/meeting-prep', async (req: Request<{ id: string }>, res: Response) => {
  const deal = await db.getDealById(req.params.id);

  if (!deal) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Deal ${req.params.id} not found`,
      statusCode: 404,
    });
  }

  const { meetingType = 'general', attendeeIds } = req.body;

  const account = await db.getAccountById(deal.accountId);
  const accountName = account?.name || 'Unknown';
  const allStakeholders = await db.getStakeholdersForDeal(deal.id);
  const activities = await db.getActivitiesForDeal(deal.id);

  const attendees = attendeeIds && attendeeIds.length > 0
    ? allStakeholders.filter((s) => attendeeIds.includes(s.id))
    : allStakeholders;

  const stakeholderBriefings = attendees.map((s) => {
    const engagement = deriveEngagementLevel(s.contactFrequency);
    const primaryRole = s.roles[0] || 'unknown';
    return {
      id: s.id,
      name: s.name,
      title: s.title,
      roles: s.roles,
      sentiment: s.sentiment,
      engagementLevel: engagement,
      lastContactedAt: s.lastContactedAt,
      talkingPoints: [
        `${s.name} is the ${primaryRole} — tailor messaging to their priorities`,
        s.sentiment === 'opposed' || s.sentiment === 'skeptical'
          ? `Sentiment is ${s.sentiment} — address concerns proactively`
          : s.sentiment === 'strong_advocate' || s.sentiment === 'supportive'
          ? `Sentiment is ${s.sentiment} — leverage as internal champion`
          : `Sentiment is neutral — focus on building rapport and demonstrating value`,
        engagement === 'low'
          ? `Low engagement — prepare re-engagement strategy`
          : `Engaged — maintain momentum with next-step commitment`,
      ],
    };
  });

  const competitors = deal.competitors || [];
  const competitorNames = competitors.map((c) => c.competitorName);
  const ourStrengths = competitors.flatMap((c) => c.ourAdvantages);
  const landmines = competitors.flatMap((c) => c.weaknesses);

  const meddic = deal.meddic;
  const meddicGaps: string[] = [];
  if (meddic.metrics.score < 5) meddicGaps.push('Metrics: No quantified business impact identified yet — probe for ROI data');
  if (meddic.economicBuyer.score < 5) meddicGaps.push('Economic Buyer: Not identified — ask who controls budget');
  if (meddic.decisionCriteria.score < 5) meddicGaps.push('Decision Criteria: Unclear — understand evaluation framework');
  if (meddic.decisionProcess.score < 5) meddicGaps.push('Decision Process: Unknown — map the approval workflow');
  if (meddic.identifyPain.score < 5) meddicGaps.push('Pain: Not validated — confirm business pain points');
  if (meddic.champion.score < 5) meddicGaps.push('Champion: No internal champion identified — cultivate one');

  const riskFactors = deal.riskFactors || [];
  const riskMitigations = riskFactors.map((risk) => ({
    risk: risk.description,
    severity: risk.severity,
    mitigation: risk.mitigationAction || `Address "${risk.description}" directly in the meeting — prepare supporting evidence`,
  }));

  const agendaTemplates: Record<string, string[]> = {
    discovery: [
      'Introductions and rapport building (5 min)',
      'Understand current state and pain points (15 min)',
      'Explore desired future state and business impact (10 min)',
      'Qualify budget, timeline, and decision process (10 min)',
      'Align on next steps and demo scheduling (5 min)',
    ],
    demo: [
      'Recap of requirements from discovery (5 min)',
      'Live product demonstration aligned to pain points (20 min)',
      'Q&A and technical deep-dive (10 min)',
      'Discuss implementation timeline and resources (5 min)',
      'Agree on evaluation criteria and next steps (5 min)',
    ],
    negotiation: [
      'Review proposal and pricing structure (10 min)',
      'Address outstanding concerns or objections (10 min)',
      'Discuss contract terms and implementation plan (10 min)',
      'Align on decision timeline and stakeholder sign-off (10 min)',
      'Confirm commitment and next steps (5 min)',
    ],
    general: [
      'Opening and relationship check-in (5 min)',
      'Review progress since last meeting (10 min)',
      'Address open items and blockers (15 min)',
      'Discuss priorities and timeline (10 min)',
      'Confirm next steps and action items (5 min)',
    ],
  };

  const suggestedAgenda = agendaTemplates[meetingType] || agendaTemplates.general;

  res.json({
    data: {
      dealId: deal.id,
      dealName: deal.name,
      accountName,
      meetingType,
      currentStage: deal.stage,
      dealValue: deal.value,
      healthScore: deal.healthScore,
      stakeholderBriefings,
      suggestedAgenda,
      talkingPoints: [
        `Deal is in ${deal.stage} stage — focus on advancing to next stage`,
        deal.healthScore < 60
          ? `Deal health is at ${deal.healthScore}% — prioritize risk mitigation`
          : `Deal health is strong at ${deal.healthScore}% — maintain momentum`,
        ...meddicGaps.slice(0, 3),
      ],
      competitivePositioning: {
        competitors: competitorNames,
        strengths: ourStrengths,
        landmines,
        differentiation: ourStrengths.length > 0
          ? `Lead with: ${ourStrengths[0]}`
          : 'Prepare competitive differentiation talking points',
      },
      meddicScorecard: {
        ...meddic,
        gaps: meddicGaps,
      },
      riskMitigations,
      recentActivity: activities.slice(0, 5).map((a) => ({
        type: a.type,
        summary: a.summary,
        occurredAt: a.occurredAt,
      })),
      preparedAt: new Date().toISOString(),
    },
  });
});

export default router;
