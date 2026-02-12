// ============================================================
// Lead Routes — Virtual Assistant / Automated Lead Response
// Handles ~100K inbound leads/year (~270/day) with AI-generated
// instant responses, SDR qualification, and AE handoff.
//
// GET  /api/v1/leads           — List inbound leads with filtering
// GET  /api/v1/leads/metrics   — Lead response metrics dashboard
// GET  /api/v1/leads/:id       — Lead detail with auto-responses
// POST /api/v1/leads/:id/qualify  — SDR qualifies/disqualifies lead
// POST /api/v1/leads/:id/convert  — Convert qualified lead to account + deal
// ============================================================

import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

// ============================================================
// Lead Status Constants
// ============================================================

const VALID_STATUSES = [
  'new',
  'auto_responded',
  'sdr_review',
  'qualified',
  'disqualified',
  'converted',
];

const VALID_SOURCES = [
  'website',
  'email',
  'chat',
  'phone',
  'social',
  'referral',
  'event',
  'partner',
];

// ============================================================
// GET /api/v1/leads
// List inbound leads with filtering, search, and pagination.
// ============================================================

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 25, 100);
    const status = req.query.status as string;
    const source = req.query.source as string;
    const region = req.query.region as string;
    const search = (req.query.search as string || '').toLowerCase().trim();
    const sortBy = (req.query.sortBy as string) || 'receivedAt';
    const sortOrder = (req.query.sortOrder as string) || 'desc';

    // Build filter object
    const filters: Record<string, any> = {};
    if (status && VALID_STATUSES.includes(status)) {
      filters.status = status;
    }
    if (source && VALID_SOURCES.includes(source)) {
      filters.source = source;
    }
    if (region) {
      filters.region = region;
    }
    if (search) {
      filters.search = search;
    }
    filters.page = page;
    filters.pageSize = pageSize;
    filters.sortBy = sortBy;
    filters.sortOrder = sortOrder;

    const result = await db.getInboundLeads(filters);

    const leads = result.leads || [];
    const total = result.total || leads.length;

    res.json({
      data: leads.map((lead: any) => ({
        id: lead.id,
        source: lead.source,
        sourceDetail: lead.sourceDetail,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        title: lead.title,
        industry: lead.industry,
        employeeCount: lead.employeeCount,
        website: lead.website,
        productInterest: lead.productInterest,
        region: lead.region,
        aiScore: lead.aiScore,
        aiQualified: lead.aiQualified,
        autoResponseSent: lead.autoResponseSent,
        autoResponseAt: lead.autoResponseAt,
        responseTimeMs: lead.responseTimeMs,
        status: lead.status,
        receivedAt: lead.receivedAt,
        qualifiedAt: lead.qualifiedAt,
        convertedAt: lead.convertedAt,
        assignedSdrId: lead.assignedSdrId,
        assignedAeId: lead.assignedAeId,
        autoResponseCount: lead.autoResponses?.length || 0,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch leads',
      statusCode: 500,
    });
  }
});

// ============================================================
// GET /api/v1/leads/metrics
// Lead response metrics dashboard — aggregated KPIs for the
// Virtual Assistant system.
// ============================================================

router.get('/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await db.getLeadMetrics();

    res.json({
      data: {
        totalLeads: metrics.totalLeads || 0,
        todayLeadCount: metrics.todayLeadCount || 0,
        weekLeadCount: metrics.weekLeadCount || 0,
        avgResponseTimeMs: metrics.avgResponseTimeMs || 0,
        autoResponseRate: metrics.autoResponseRate || 0,
        qualificationRate: metrics.qualificationRate || 0,
        conversionRate: metrics.conversionRate || 0,
        leadsByStatus: metrics.leadsByStatus || {},
        leadsBySource: metrics.leadsBySource || {},
        leadsByRegion: metrics.leadsByRegion || {},
        speedToLeadDistribution: metrics.speedToLeadDistribution || {
          under5s: 0,
          under15s: 0,
          under30s: 0,
          under60s: 0,
          over60s: 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching lead metrics:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch lead metrics',
      statusCode: 500,
    });
  }
});

// ============================================================
// GET /api/v1/leads/:id
// Full lead detail with AI analysis, auto-response content,
// qualification data, and linked records.
// ============================================================

router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const lead = await db.getInboundLeadById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Lead ${req.params.id} not found`,
        statusCode: 404,
      });
    }

    res.json({
      data: {
        id: lead.id,
        source: lead.source,
        sourceDetail: lead.sourceDetail,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        title: lead.title,
        industry: lead.industry,
        employeeCount: lead.employeeCount,
        website: lead.website,
        message: lead.message,
        productInterest: lead.productInterest,
        region: lead.region,
        aiScore: lead.aiScore,
        aiScoreFactors: lead.aiScoreFactors,
        aiSummary: lead.aiSummary,
        aiQualified: lead.aiQualified,
        autoResponseSent: lead.autoResponseSent,
        autoResponseAt: lead.autoResponseAt,
        autoResponseContent: lead.autoResponseContent,
        responseTimeMs: lead.responseTimeMs,
        status: lead.status,
        assignedSdrId: lead.assignedSdrId,
        assignedAeId: lead.assignedAeId,
        convertedAccountId: lead.convertedAccountId,
        convertedDealId: lead.convertedDealId,
        receivedAt: lead.receivedAt,
        qualifiedAt: lead.qualifiedAt,
        convertedAt: lead.convertedAt,
        autoResponses: (lead.autoResponses || []).map((ar: any) => ({
          id: ar.id,
          subject: ar.subject,
          body: ar.body,
          channel: ar.channel,
          sentAt: ar.sentAt,
          opened: ar.opened,
          replied: ar.replied,
          confidence: ar.confidence,
          model: ar.model,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching lead detail:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch lead detail',
      statusCode: 500,
    });
  }
});

// ============================================================
// POST /api/v1/leads/:id/qualify
// SDR qualifies or disqualifies a lead. Updates status and
// optionally assigns to an AE for handoff.
// ============================================================

router.post('/:id/qualify', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { qualified, notes, assignedAeId } = req.body;

    if (typeof qualified !== 'boolean') {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: '"qualified" (boolean) is required in request body',
        statusCode: 400,
      });
    }

    const lead = await db.getInboundLeadById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Lead ${req.params.id} not found`,
        statusCode: 404,
      });
    }

    const newStatus = qualified ? 'qualified' : 'disqualified';

    const updatedLead = await db.prisma.inboundLead.update({
      where: { id: req.params.id },
      data: {
        status: newStatus,
        qualifiedAt: qualified ? new Date() : null,
        aiSummary: notes ? `${lead.aiSummary || ''}\n\nSDR Notes: ${notes}` : lead.aiSummary,
        assignedAeId: qualified && assignedAeId ? assignedAeId : lead.assignedAeId,
      },
    });

    res.json({
      data: {
        id: updatedLead.id,
        status: updatedLead.status,
        qualified,
        qualifiedAt: updatedLead.qualifiedAt,
        assignedAeId: updatedLead.assignedAeId,
        notes: notes || null,
      },
    });
  } catch (error) {
    console.error('Error qualifying lead:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to qualify lead',
      statusCode: 500,
    });
  }
});

// ============================================================
// POST /api/v1/leads/:id/convert
// Convert a qualified lead into an account + deal. Links the
// new records back to the original inbound lead for attribution.
// ============================================================

router.post('/:id/convert', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const lead = await db.getInboundLeadById(req.params.id);

    if (!lead) {
      return res.status(404).json({
        error: 'NOT_FOUND',
        message: `Lead ${req.params.id} not found`,
        statusCode: 404,
      });
    }

    if (lead.status !== 'qualified') {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Lead must be in "qualified" status before conversion',
        statusCode: 400,
      });
    }

    if (lead.convertedAccountId) {
      return res.status(400).json({
        error: 'ALREADY_CONVERTED',
        message: 'This lead has already been converted',
        statusCode: 400,
      });
    }

    const acctId = `acct_lead_${lead.id}`;
    const dealId = `deal_lead_${lead.id}`;

    // Create the account
    const account = await db.prisma.account.create({
      data: {
        id: acctId,
        name: lead.company,
        industry: lead.industry || 'Unknown',
        website: lead.website || undefined,
        employeeCount: lead.employeeCount || undefined,
        region: lead.region || undefined,
        summary: `Converted from inbound lead (${lead.source}). Contact: ${lead.firstName} ${lead.lastName} (${lead.email})`,
        healthScore: 50,
      },
    });

    // Create the deal
    const deal = await db.prisma.deal.create({
      data: {
        id: dealId,
        name: `${lead.company} — ${lead.productInterest || 'New Opportunity'}`,
        accountId: account.id,
        stage: 'discovery',
        value: 0,
        probability: 10,
        winProbability: 20,
        closeDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        ownerId: lead.assignedAeId || 'user_ae_001',
        healthScore: 50,
      },
    });

    // Update the lead with conversion info
    await db.prisma.inboundLead.update({
      where: { id: req.params.id },
      data: {
        status: 'converted',
        convertedAt: new Date(),
        convertedAccountId: account.id,
        convertedDealId: deal.id,
      },
    });

    res.json({
      data: {
        leadId: lead.id,
        status: 'converted',
        convertedAt: new Date().toISOString(),
        account: {
          id: account.id,
          name: account.name,
        },
        deal: {
          id: deal.id,
          name: deal.name,
          stage: deal.stage,
        },
      },
    });
  } catch (error) {
    console.error('Error converting lead:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Failed to convert lead',
      statusCode: 500,
    });
  }
});

export default router;
