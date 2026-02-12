// ============================================================
// Dashboard Routes — US-004
// GET /api/v1/dashboard — Unified dashboard data
// GET /api/v1/dashboard/notifications — Notification feed
// PATCH /api/v1/dashboard/notifications/:id — Mark notification read
// ============================================================

import { Router, Request, Response } from 'express';
import { store } from '../store';

const router = Router();

/**
 * GET /api/v1/dashboard
 * Primary dashboard data endpoint. (US-004)
 * Returns: prioritized call list, pending follow-ups, recent calls, pipeline snapshot, notifications.
 */
router.get('/', (req: Request, res: Response) => {
  const leads = store.getLeadsSorted();
  const recentCalls = store.getRecentCalls(5);
  const notifications = store.getNotifications().slice(0, 10);
  const pipeline = store.getPipelineSnapshot();

  // Prioritized call list — top leads to call today
  const prioritizedLeads = leads
    .filter((l) => l.status !== 'disqualified' && l.status !== 'nurture')
    .slice(0, 10)
    .map((lead) => ({
      id: lead.id,
      displayName: lead.displayName,
      company: lead.company,
      title: lead.title,
      aiScore: lead.aiScore,
      scoreFactors: lead.scoreFactors,
      recommendedAction: lead.recommendedAction,
      lastActivity: lead.lastActivity,
      status: lead.status,
      phone: lead.phone,
      buyingSignals: lead.buyingSignals.length,
    }));

  // Pending follow-ups — leads with recent calls needing action
  const pendingFollowUps = leads
    .filter((l) => l.status === 'contacted' || l.status === 'engaged')
    .slice(0, 5)
    .map((lead) => ({
      id: lead.id,
      displayName: lead.displayName,
      company: lead.company,
      aiScore: lead.aiScore,
      lastContactedAt: lead.lastContactedAt,
      recommendedAction: lead.recommendedAction,
    }));

  // Recent call summaries
  const callSummaries = recentCalls.map((call) => {
    const lead = store.getLeadById(call.leadId);
    return {
      id: call.id,
      leadName: lead?.displayName || 'Unknown',
      leadCompany: lead?.company || 'Unknown',
      duration: call.duration,
      outcome: call.outcome,
      summary: call.summary.substring(0, 150) + (call.summary.length > 150 ? '...' : ''),
      sentimentScore: call.sentimentScore,
      callDate: call.callDate,
      actionItems: call.actionItems.length,
    };
  });

  res.json({
    data: {
      prioritizedLeads,
      pendingFollowUps,
      recentCalls: callSummaries,
      pipelineSnapshot: {
        ...pipeline,
        lastSyncedAt: new Date().toISOString(),
      },
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        leadId: n.leadId,
        read: n.read,
        createdAt: n.createdAt,
      })),
      unreadNotifications: notifications.filter((n) => !n.read).length,
    },
  });
});

/**
 * GET /api/v1/dashboard/notifications
 * Full notification feed.
 */
router.get('/notifications', (req: Request, res: Response) => {
  const notifications = store.getNotifications();

  res.json({
    data: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      leadId: n.leadId,
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
