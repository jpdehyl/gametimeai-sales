// ============================================================
// Dashboard Routes — AE Deal Intelligence Platform
// GET /api/v1/dashboard — Full AE dashboard
// GET /api/v1/dashboard/notifications — Notification feed
// PATCH /api/v1/dashboard/notifications/:id — Mark notification read
// ============================================================

import { Router, Request, Response } from 'express';
import { db } from '../db';

const router = Router();

/**
 * GET /api/v1/dashboard
 * Full AE dashboard: quota attainment, pipeline summary by stage,
 * deals at risk, AI-recommended actions, recent activities,
 * forecast numbers, and notifications.
 */
router.get('/', async (req: Request, res: Response) => {
  const deals = await db.getDeals();
  const recentActivities = await db.getRecentActivities(10);
  const notifications = await db.getNotifications();
  const user = await db.getCurrentUser();

  // Pipeline summary by stage
  const pipelineByStage: Record<string, { count: number; totalValue: number; dealIds: string[] }> = {};
  for (const deal of deals) {
    if (!pipelineByStage[deal.stage]) {
      pipelineByStage[deal.stage] = { count: 0, totalValue: 0, dealIds: [] };
    }
    pipelineByStage[deal.stage].count += 1;
    pipelineByStage[deal.stage].totalValue += deal.value;
    pipelineByStage[deal.stage].dealIds.push(deal.id);
  }

  // Deals at risk — low health score or stalled
  const dealsAtRisk = await Promise.all(
    deals
      .filter((d) => d.healthScore < 60 && d.stage !== 'closed_won' && d.stage !== 'closed_lost')
      .sort((a, b) => a.healthScore - b.healthScore)
      .slice(0, 5)
      .map(async (d) => {
        const account = await db.getAccountById(d.accountId);
        return {
          id: d.id,
          name: d.name,
          accountName: account?.name || 'Unknown',
          amount: d.value,
          stage: d.stage,
          healthScore: d.healthScore,
          riskFactors: d.riskFactors,
          closeDate: d.closeDate,
          daysUntilClose: Math.ceil(
            (new Date(d.closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          ),
        };
      })
  );

  // Today's AI-recommended actions
  const recommendedActions: Array<{
    dealId: string;
    dealName: string;
    accountName: string;
    actionId: string;
    action: string;
    priority: string;
    dueDate?: string;
  }> = [];

  for (const deal of deals) {
    if (deal.stage === 'closed_won' || deal.stage === 'closed_lost') continue;
    const account = await db.getAccountById(deal.accountId);
    for (const action of deal.nextBestActions || []) {
      if (!action.isCompleted) {
        recommendedActions.push({
          dealId: deal.id,
          dealName: deal.name,
          accountName: account?.name || 'Unknown',
          actionId: action.id,
          action: action.description,
          priority: action.priority,
          dueDate: action.dueDate ? action.dueDate.toISOString() : undefined,
        });
      }
    }
  }

  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendedActions.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3);
    if (pDiff !== 0) return pDiff;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    return 0;
  });

  // Quota and forecast
  const totalPipelineValue = deals
    .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + d.value, 0);

  const closedWonValue = deals
    .filter((d) => d.stage === 'closed_won')
    .reduce((sum, d) => sum + d.value, 0);

  const weightedPipeline = deals
    .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + d.value * (d.probability / 100), 0);

  const quota = user.quota || 1500000;
  const closedWon = user.closedWonYTD || closedWonValue;

  // Activity results with deal names
  const activityResults = await Promise.all(
    recentActivities.map(async (a) => {
      const deal = await db.getDealById(a.dealId);
      return {
        id: a.id,
        type: a.type,
        description: a.summary,
        dealId: a.dealId,
        dealName: deal?.name || 'Unknown',
        timestamp: a.occurredAt,
      };
    })
  );

  res.json({
    data: {
      quotaAttainment: {
        quota,
        closed: closedWon,
        attainmentPercent: Math.round((closedWon / quota) * 100),
        remaining: quota - closedWon,
        pipelineCoverage: totalPipelineValue > 0
          ? Math.round((totalPipelineValue / (quota - closedWon)) * 100) / 100
          : 0,
      },
      forecast: {
        bestCase: closedWon + totalPipelineValue,
        commit: closedWon + weightedPipeline,
        weighted: Math.round(weightedPipeline),
        totalPipeline: totalPipelineValue,
        closedWon,
      },
      pipelineSummary: pipelineByStage,
      dealsAtRisk,
      recommendedActions: recommendedActions.slice(0, 10),
      recentActivities: activityResults,
      notifications: notifications.slice(0, 10).map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        dealId: n.dealId,
        read: n.read,
        createdAt: n.createdAt,
      })),
      unreadNotifications: notifications.filter((n) => !n.read).length,
      lastUpdated: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/v1/dashboard/notifications
 * Full notification feed.
 */
router.get('/notifications', async (req: Request, res: Response) => {
  const notifications = await db.getNotifications();

  res.json({
    data: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      dealId: n.dealId,
      read: n.read,
      createdAt: n.createdAt,
    })),
    unreadCount: notifications.filter((n) => !n.read).length,
  });
});

/**
 * PATCH /api/v1/dashboard/notifications/:id
 * Mark notification as read.
 */
router.patch('/notifications/:id', async (req: Request<{ id: string }>, res: Response) => {
  const notification = await db.getNotificationById(req.params.id);

  if (!notification) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Notification ${req.params.id} not found`,
      statusCode: 404,
    });
  }

  await db.markNotificationRead(req.params.id);

  res.json({ data: { id: notification.id, read: true } });
});

export default router;
