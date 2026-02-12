// ============================================================
// Dashboard Routes — AE Deal Intelligence Platform
// GET /api/v1/dashboard — Full AE dashboard
// GET /api/v1/dashboard/notifications — Notification feed
// PATCH /api/v1/dashboard/notifications/:id — Mark notification read
// ============================================================

import { Router, Request, Response } from 'express';
import { store } from '../store';
import { Notification } from '../types';

const router = Router();

/**
 * GET /api/v1/dashboard
 * Full AE dashboard: quota attainment, pipeline summary by stage,
 * deals at risk, AI-recommended actions, recent activities,
 * forecast numbers, and notifications.
 */
router.get('/', (req: Request, res: Response) => {
  const dashboard = store.getDashboardData();
  const deals = store.getDeals();
  const recentActivities = store.getRecentActivities(10);
  const notifications = Array.from(store.notifications.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  // Pipeline summary by stage
  const pipelineByStage: Record<string, { count: number; totalValue: number; dealIds: string[] }> = {};
  for (const deal of deals) {
    if (!pipelineByStage[deal.stage]) {
      pipelineByStage[deal.stage] = { count: 0, totalValue: 0, dealIds: [] };
    }
    pipelineByStage[deal.stage].count += 1;
    pipelineByStage[deal.stage].totalValue += deal.amount;
    pipelineByStage[deal.stage].dealIds.push(deal.id);
  }

  // Deals at risk — low health score or stalled
  const dealsAtRisk = deals
    .filter((d) => d.healthScore < 60 && d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 5)
    .map((d) => ({
      id: d.id,
      name: d.name,
      accountName: d.accountName,
      amount: d.amount,
      stage: d.stage,
      healthScore: d.healthScore,
      riskFactors: d.riskFactors,
      closeDate: d.closeDate,
      daysUntilClose: Math.ceil(
        (new Date(d.closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      ),
    }));

  // Today's AI-recommended actions — aggregated from all active deals
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
    for (const action of deal.nextActions || []) {
      if (!action.completed) {
        recommendedActions.push({
          dealId: deal.id,
          dealName: deal.name,
          accountName: deal.accountName,
          actionId: action.id,
          action: action.description,
          priority: action.priority,
          dueDate: action.dueDate,
        });
      }
    }
  }

  // Sort actions by priority (high > medium > low) then by due date
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  recommendedActions.sort((a, b) => {
    const pDiff = (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    if (pDiff !== 0) return pDiff;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    return 0;
  });

  // Quota and forecast
  const totalPipelineValue = deals
    .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + d.amount, 0);

  const closedWonValue = deals
    .filter((d) => d.stage === 'closed_won')
    .reduce((sum, d) => sum + d.amount, 0);

  const weightedPipeline = deals
    .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + d.amount * (d.probability / 100), 0);

  const quota = dashboard.quota || 500000;

  res.json({
    data: {
      quotaAttainment: {
        quota,
        closed: closedWonValue,
        attainmentPercent: Math.round((closedWonValue / quota) * 100),
        remaining: quota - closedWonValue,
        pipelineCoverage: totalPipelineValue > 0
          ? Math.round((totalPipelineValue / (quota - closedWonValue)) * 100) / 100
          : 0,
      },
      forecast: {
        bestCase: closedWonValue + totalPipelineValue,
        commit: closedWonValue + weightedPipeline,
        weighted: Math.round(weightedPipeline),
        totalPipeline: totalPipelineValue,
        closedWon: closedWonValue,
      },
      pipelineSummary: pipelineByStage,
      dealsAtRisk,
      recommendedActions: recommendedActions.slice(0, 10),
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        type: a.type,
        description: a.description,
        dealId: a.dealId,
        dealName: a.dealName,
        timestamp: a.timestamp,
      })),
      notifications: notifications.map((n) => ({
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
router.get('/notifications', (req: Request, res: Response) => {
  const notifications = Array.from(store.notifications.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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
router.patch('/notifications/:id', (req: Request<{ id: string }>, res: Response) => {
  const notification = store.notifications.get(req.params.id);

  if (!notification) {
    return res.status(404).json({
      error: 'NOT_FOUND',
      message: `Notification ${req.params.id} not found`,
      statusCode: 404,
    });
  }

  notification.read = true;
  store.notifications.set(notification.id, notification);

  res.json({ data: { id: notification.id, read: true } });
});

export default router;
