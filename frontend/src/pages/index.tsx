// ============================================================
// AE Deal Intelligence Dashboard — Command Center
// "What do I need to do to hit my number?"
// ============================================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDashboard, completeAction, DEAL_STAGES, type DashboardData } from '@/lib/api';
import {
  cn,
  formatCurrency,
  formatRelativeTime,
  getHealthScoreColor,
  getHealthScoreBg,
  getStageBadgeColor,
  getPriorityColor,
  getSeverityColor,
} from '@/lib/utils';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Info,
  Mail,
  MessageSquare,
  Phone,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================
// Helpers
// ============================================================

function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getStageLabel(stageKey: string): string {
  const found = DEAL_STAGES.find((s) => s.key === stageKey);
  return found?.label ?? stageKey;
}

function getStageBarColor(stageKey: string): string {
  const found = DEAL_STAGES.find((s) => s.key === stageKey);
  return found?.color ?? '#9ca3af';
}

// Health score returns { ring, bg, text } for the circular badge
function healthScoreStyles(score: number) {
  if (score >= 80) return { ring: 'ring-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' };
  if (score >= 60) return { ring: 'ring-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700' };
  if (score >= 40) return { ring: 'ring-orange-400', bg: 'bg-orange-50', text: 'text-orange-700' };
  return { ring: 'ring-red-400', bg: 'bg-red-50', text: 'text-red-700' };
}

// Priority returns { bg, text, dot } for inline badges
function priorityStyles(priority: string) {
  switch (priority) {
    case 'critical': return { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' };
    case 'high': return { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' };
    case 'medium': return { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };
  }
}

// Severity returns { bg, border, text, icon } for notification cards
function severityStyles(severity: string) {
  switch (severity) {
    case 'critical': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-500' };
    case 'warning': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', icon: 'text-amber-500' };
    case 'info': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-500' };
    default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: 'text-gray-500' };
  }
}

// ============================================================
// Main Dashboard Component
// ============================================================

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 60_000,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div>
          <p className="font-medium text-red-800">Dashboard unavailable</p>
          <p className="text-sm text-red-600">
            Unable to load dashboard data. Please try again or contact support.
          </p>
        </div>
      </div>
    );
  }

  const dashboard = data?.data;
  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      {/* 1. Revenue Bar */}
      <RevenueBar quota={dashboard.quotaAttainment} />

      {/* 2. Forecast Cards */}
      <ForecastCards forecast={dashboard.forecast} />

      {/* 3. Main Grid: 2 columns */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left Column — Primary workspace (wider) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <DealsAtRisk deals={dashboard.dealsAtRisk} />
          <TodayActions actions={dashboard.todayActions} />
        </div>

        {/* Right Column — Context panels */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <PipelineByStage stages={dashboard.pipelineSummary.byStage} />
          <RecentActivityFeed activities={dashboard.recentActivities} />
          <NotificationsPanel notifications={dashboard.notifications} />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 1. Revenue Bar — Quota attainment progress strip
// ============================================================

function RevenueBar({
  quota,
}: {
  quota: DashboardData['quotaAttainment'];
}) {
  const total = quota.quota || 1;
  const closedPct = Math.min((quota.closedWon / total) * 100, 100);
  const weightedPct = Math.min(
    ((quota.closedWon + quota.pipelineWeighted) / total) * 100 - closedPct,
    100 - closedPct
  );
  const isOnTrack = quota.projectedAttainment >= 100;

  return (
    <div className="card">
      <div className="px-6 py-4">
        {/* Header row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Quota Attainment
              </h2>
              <p className="text-xs text-gray-500">
                Current Quarter &middot; Updated live
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 tabular-nums">
                {formatCurrencyFull(quota.closedWon)}{' '}
                <span className="text-base font-normal text-gray-400">
                  / {formatCurrencyFull(quota.quota)}
                </span>
              </p>
            </div>
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold',
                isOnTrack
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              )}
            >
              {isOnTrack ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              {Math.round(quota.percentAttained)}% Attained
            </div>
          </div>
        </div>

        {/* Segmented progress bar */}
        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
          {/* Closed Won — solid green */}
          <div
            className="absolute inset-y-0 left-0 bg-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${closedPct}%`, borderRadius: closedPct >= 100 ? '9999px' : '9999px 0 0 9999px' }}
          />
          {/* Weighted Pipeline — blue striped */}
          <div
            className="absolute inset-y-0 transition-all duration-700 ease-out"
            style={{
              left: `${closedPct}%`,
              width: `${Math.max(weightedPct, 0)}%`,
              background:
                'repeating-linear-gradient(135deg, #3b82f6, #3b82f6 4px, #60a5fa 4px, #60a5fa 8px)',
              borderRadius: (closedPct + weightedPct) >= 100 ? '0 9999px 9999px 0' : '0',
            }}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" />
            Closed Won ({formatCurrency(quota.closedWon)})
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{
                background:
                  'repeating-linear-gradient(135deg, #3b82f6, #3b82f6 2px, #60a5fa 2px, #60a5fa 4px)',
              }}
            />
            Weighted Pipeline ({formatCurrency(quota.pipelineWeighted)})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-gray-200" />
            Gap ({formatCurrency(Math.max(quota.gap, 0))})
          </span>
          <span className="ml-auto font-semibold text-gray-900">
            Projected: {Math.round(quota.projectedAttainment)}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 2. Forecast Cards — Row of 4
// ============================================================

function ForecastCards({
  forecast,
}: {
  forecast: DashboardData['forecast'];
}) {
  const gap = forecast.target - forecast.commit;
  const isAboveTarget = gap <= 0;

  const cards = [
    {
      label: 'Commit',
      value: forecast.commit,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      desc: 'Deals in commit forecast',
    },
    {
      label: 'Best Case',
      value: forecast.bestCase,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      desc: 'Upside potential',
    },
    {
      label: 'Pipeline',
      value: forecast.pipeline,
      icon: BarChart3,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200',
      desc: 'All active pipeline',
    },
    {
      label: isAboveTarget ? 'Above Target' : 'Gap to Target',
      value: Math.abs(gap),
      icon: Target,
      color: isAboveTarget ? 'text-emerald-600' : 'text-red-600',
      bgColor: isAboveTarget ? 'bg-emerald-50' : 'bg-red-50',
      borderColor: isAboveTarget ? 'border-emerald-200' : 'border-red-200',
      desc: isAboveTarget ? 'Surplus over target' : 'Additional pipeline needed',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={cn('card border px-5 py-4', card.borderColor)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {card.label}
              </span>
              <div className={cn('p-1.5 rounded-lg', card.bgColor)}>
                <Icon className={cn('w-4 h-4', card.color)} />
              </div>
            </div>
            <p className={cn('text-2xl font-bold tabular-nums', card.color)}>
              {formatCurrency(card.value)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{card.desc}</p>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 3a. Deals Requiring Attention
// ============================================================

function DealsAtRisk({
  deals,
}: {
  deals: DashboardData['dealsAtRisk'];
}) {
  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Deals Requiring Attention
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {deals.length} deal{deals.length !== 1 ? 's' : ''} flagged by AI
            </p>
          </div>
        </div>
        <Link
          href="/deals?filter=at-risk"
          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          View All <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="divide-y divide-gray-100">
        {deals.length === 0 && (
          <div className="px-6 py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">All deals on track</p>
            <p className="text-xs text-gray-500 mt-1">No deals currently flagged as at-risk</p>
          </div>
        )}

        {deals.map((deal) => {
          const hs = healthScoreStyles(deal.healthScore);
          return (
            <Link
              key={deal.id}
              href={`/deals/${deal.id}`}
              className="flex items-start gap-4 px-6 py-4 hover:bg-gray-50/80 transition-colors group"
            >
              {/* Health Score Circle */}
              <div className="flex-shrink-0 pt-0.5">
                <div
                  className={cn(
                    'relative w-11 h-11 rounded-full flex items-center justify-center ring-2',
                    hs.bg,
                    hs.ring
                  )}
                >
                  <span className={cn('text-sm font-bold tabular-nums', hs.text)}>
                    {deal.healthScore}
                  </span>
                </div>
              </div>

              {/* Deal info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                    {deal.name}
                  </p>
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide flex-shrink-0',
                      getStageBadgeColor(deal.stage)
                    )}
                  >
                    {getStageLabel(deal.stage)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-1.5">
                  {deal.accountName} &middot;{' '}
                  <span className="font-semibold text-gray-700">
                    {formatCurrency(deal.amount)}
                  </span>
                </p>
                {/* Top risk factor */}
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-600 truncate">{deal.topRisk}</p>
                </div>
              </div>

              {/* Right side: days in stage + arrow */}
              <div className="flex-shrink-0 text-right space-y-1">
                <div className="flex items-center gap-1 text-xs text-gray-400 justify-end">
                  <Clock className="w-3 h-3" />
                  <span>{deal.daysInStage}d in stage</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 ml-auto group-hover:text-primary-500 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 3b. Today's AI Actions
// ============================================================

function TodayActions({
  actions,
}: {
  actions: DashboardData['todayActions'];
}) {
  const queryClient = useQueryClient();
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  const completeMutation = useMutation({
    mutationFn: ({ dealId, actionId }: { dealId: string; actionId: string }) =>
      completeAction(dealId, actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleComplete = (actionId: string, dealId: string) => {
    setCompletedIds((prev) => new Set(prev).add(actionId));
    completeMutation.mutate({ dealId, actionId });
  };

  const actionTypeIcons: Record<
    string,
    { icon: React.ComponentType<{ className?: string }>; color: string }
  > = {
    call: { icon: Phone, color: 'text-green-600 bg-green-50' },
    email: { icon: Mail, color: 'text-blue-600 bg-blue-50' },
    meeting: { icon: Calendar, color: 'text-purple-600 bg-purple-50' },
    internal: { icon: Users, color: 'text-orange-600 bg-orange-50' },
    research: { icon: BarChart3, color: 'text-indigo-600 bg-indigo-50' },
    follow_up: { icon: MessageSquare, color: 'text-teal-600 bg-teal-50' },
    escalation: { icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
    document: { icon: FileText, color: 'text-gray-600 bg-gray-100' },
  };

  const pending = actions.filter((a) => !a.completed && !completedIds.has(a.id));
  const completed = actions.filter((a) => a.completed || completedIds.has(a.id));

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Today&apos;s AI Actions
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {pending.length} remaining &middot; {completed.length} completed
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {pending.length === 0 && completed.length === 0 && (
          <div className="px-6 py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700">All caught up</p>
            <p className="text-xs text-gray-500 mt-1">No AI-recommended actions for today</p>
          </div>
        )}

        {pending.map((action) => {
          const ps = priorityStyles(action.priority);
          const typeConfig = actionTypeIcons[action.type] || actionTypeIcons.email;
          const TypeIcon = typeConfig.icon;

          return (
            <div
              key={action.id}
              className="flex items-start gap-3 px-6 py-4 hover:bg-gray-50/50 transition-colors"
            >
              {/* Completion checkbox */}
              <button
                onClick={() => action.dealId && handleComplete(action.id, action.dealId)}
                className="flex-shrink-0 mt-0.5 w-5 h-5 rounded border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 transition-colors flex items-center justify-center group/check"
                title="Mark as complete"
              >
                <Check className="w-3 h-3 text-transparent group-hover/check:text-primary-500 transition-colors" />
              </button>

              {/* Action type icon */}
              <div
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                  typeConfig.color
                )}
              >
                <TypeIcon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  {/* Priority badge */}
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                      ps.bg,
                      ps.text
                    )}
                  >
                    <span className={cn('w-1.5 h-1.5 rounded-full', ps.dot)} />
                    {action.priority}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {action.title}
                  </p>
                </div>
                <p className="text-xs text-gray-600 mb-1.5 line-clamp-2">
                  {action.description}
                </p>
                {/* AI reasoning callout */}
                <div className="flex items-start gap-1.5 bg-amber-50/60 border border-amber-100 rounded px-2 py-1.5">
                  <Zap className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {action.reasoning}
                  </p>
                </div>
                {/* Deal link */}
                {action.dealId && (
                  <Link
                    href={`/deals/${action.dealId}`}
                    className="inline-flex items-center gap-1 text-[11px] text-primary-600 hover:text-primary-700 font-medium mt-1.5"
                  >
                    {action.dealName || 'View Deal'}{' '}
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        {/* Completed actions (collapsed summary) */}
        {completed.length > 0 && (
          <div className="px-6 py-3 bg-gray-50/50">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
              Completed ({completed.length})
            </p>
            {completed.slice(0, 3).map((action) => (
              <div key={action.id} className="flex items-center gap-2 py-1 opacity-60">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <p className="text-xs text-gray-500 line-through truncate">
                  {action.title}
                </p>
              </div>
            ))}
            {completed.length > 3 && (
              <p className="text-[11px] text-gray-400 mt-1">
                +{completed.length - 3} more completed
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 3c. Pipeline by Stage — Horizontal bar chart
// ============================================================

function PipelineByStage({
  stages,
}: {
  stages: DashboardData['pipelineSummary']['byStage'];
}) {
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-900">
            Pipeline by Stage
          </h3>
        </div>
        <Link
          href="/deals"
          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          All Deals <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="px-6 pb-4 space-y-3">
        {stages.length === 0 && (
          <p className="text-xs text-gray-500 py-2">No pipeline data available</p>
        )}

        {stages.map((stage) => {
          const pct = (stage.value / maxValue) * 100;
          const barColor = getStageBarColor(stage.stage);

          return (
            <div key={stage.stage}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700">
                  {stage.label || getStageLabel(stage.stage)}
                </span>
                <div className="flex items-center gap-2 text-xs tabular-nums">
                  <span className="text-gray-500">
                    {stage.count} deal{stage.count !== 1 ? 's' : ''}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(stage.value)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 3d. Recent Activity Feed — Timeline
// ============================================================

function RecentActivityFeed({
  activities,
}: {
  activities: DashboardData['recentActivities'];
}) {
  const activityIcons: Record<
    string,
    { icon: React.ComponentType<{ className?: string }>; color: string }
  > = {
    call: { icon: Phone, color: 'text-green-500 bg-green-50' },
    email: { icon: Mail, color: 'text-blue-500 bg-blue-50' },
    meeting: { icon: Calendar, color: 'text-purple-500 bg-purple-50' },
    demo: { icon: BarChart3, color: 'text-indigo-500 bg-indigo-50' },
    note: { icon: FileText, color: 'text-gray-500 bg-gray-100' },
    task: { icon: CheckCircle2, color: 'text-teal-500 bg-teal-50' },
    stage_change: { icon: ArrowRight, color: 'text-amber-500 bg-amber-50' },
  };

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {activities.length === 0 && (
          <p className="px-6 py-4 text-xs text-gray-500">No recent activity to display</p>
        )}

        {activities.slice(0, 8).map((activity) => {
          const config = activityIcons[activity.type] || activityIcons.note;
          const Icon = config.icon;

          return (
            <Link
              key={activity.id}
              href={`/deals/${activity.dealId}`}
              className="flex items-start gap-3 px-6 py-3 hover:bg-gray-50/50 transition-colors"
            >
              <div
                className={cn(
                  'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5',
                  config.color
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {activity.subject}
                </p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {activity.dealName && (
                    <span className="text-[10px] font-medium text-primary-600 truncate">
                      {activity.dealName}
                    </span>
                  )}
                  {activity.stakeholderName && (
                    <>
                      <span className="text-gray-300">&middot;</span>
                      <span className="text-[10px] text-gray-500 truncate">
                        {activity.stakeholderName}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className="flex-shrink-0 text-[10px] text-gray-400 tabular-nums whitespace-nowrap mt-0.5">
                {formatRelativeTime(activity.occurredAt)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 3e. Notifications Panel
// ============================================================

function NotificationsPanel({
  notifications,
}: {
  notifications: DashboardData['notifications'];
}) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  const severityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    critical: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {notifications.length === 0 && (
          <p className="px-6 py-4 text-xs text-gray-500">No notifications</p>
        )}

        {notifications.slice(0, 6).map((notif) => {
          const ss = severityStyles(notif.severity);
          const SeverityIcon = severityIcons[notif.severity] || Info;

          return (
            <div
              key={notif.id}
              className={cn(
                'px-6 py-3 transition-colors',
                !notif.read && ss.bg
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex-shrink-0 mt-0.5 p-1 rounded',
                    notif.read ? 'bg-gray-100' : ''
                  )}
                >
                  <SeverityIcon
                    className={cn(
                      'w-3.5 h-3.5',
                      notif.read ? 'text-gray-400' : ss.icon
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-xs font-semibold truncate',
                      notif.read ? 'text-gray-500' : ss.text
                    )}
                  >
                    {notif.title}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
                    {notif.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-gray-400 tabular-nums">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                    {notif.dealId && (
                      <Link
                        href={`/deals/${notif.dealId}`}
                        className="text-[10px] text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View Deal
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Loading Skeleton
// ============================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Revenue Bar Skeleton */}
      <div className="card px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-200" />
            <div>
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-7 w-48 bg-gray-200 rounded" />
            <div className="h-8 w-28 bg-gray-200 rounded-full" />
          </div>
        </div>
        <div className="h-4 bg-gray-100 rounded-full" />
        <div className="flex gap-6 mt-3">
          <div className="h-3 w-32 bg-gray-100 rounded" />
          <div className="h-3 w-40 bg-gray-100 rounded" />
          <div className="h-3 w-24 bg-gray-100 rounded" />
        </div>
      </div>

      {/* Forecast Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="w-8 h-8 bg-gray-100 rounded-lg" />
            </div>
            <div className="h-7 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-100 rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Deals at risk skeleton */}
          <div className="card">
            <div className="card-header">
              <div className="h-4 w-48 bg-gray-200 rounded" />
            </div>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-4 px-6 py-4 border-b border-gray-100"
              >
                <div className="w-11 h-11 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-36 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-56 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Actions skeleton */}
          <div className="card">
            <div className="card-header">
              <div className="h-4 w-40 bg-gray-200 rounded" />
            </div>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-6 py-4 border-b border-gray-100"
              >
                <div className="w-5 h-5 rounded border-2 border-gray-200" />
                <div className="w-8 h-8 rounded-lg bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 w-48 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-full bg-gray-100 rounded mb-2" />
                  <div className="h-8 w-full bg-amber-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Pipeline skeleton */}
          <div className="card">
            <div className="card-header">
              <div className="h-4 w-36 bg-gray-200 rounded" />
            </div>
            <div className="px-6 pb-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Activity skeleton */}
          <div className="card">
            <div className="card-header">
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-6 py-3 border-b border-gray-100"
              >
                <div className="w-7 h-7 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-3 w-40 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-28 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Notifications skeleton */}
          <div className="card">
            <div className="card-header">
              <div className="h-4 w-28 bg-gray-200 rounded" />
            </div>
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-6 py-3 border-b border-gray-100"
              >
                <div className="w-5 h-5 rounded bg-gray-200" />
                <div className="flex-1">
                  <div className="h-3 w-36 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-48 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
