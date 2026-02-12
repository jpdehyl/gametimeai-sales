// ============================================================
// SDR Dashboard — Primary Workspace (US-004)
// "What should I do next?" — action-first command center
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { fetchDashboard, type DashboardData } from '@/lib/api';
import {
  Phone,
  Mail,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Zap,
  Clock,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn, formatRelativeTime, getScoreBgColor, getStatusBadgeColor, formatDuration } from '@/lib/utils';

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 60_000, // Refresh every 60s
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <div>
          <p className="font-medium text-red-800">Dashboard unavailable</p>
          <p className="text-sm text-red-600">Unable to load dashboard data. Showing cached data if available.</p>
        </div>
      </div>
    );
  }

  const dashboard = data?.data;
  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      {/* Pipeline Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Total Leads"
          value={dashboard.pipelineSnapshot.totalLeads}
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          label="New"
          value={dashboard.pipelineSnapshot.newLeads}
          icon={Zap}
          color="bg-green-500"
        />
        <MetricCard
          label="Contacted"
          value={dashboard.pipelineSnapshot.contacted}
          icon={Phone}
          color="bg-yellow-500"
        />
        <MetricCard
          label="Engaged"
          value={dashboard.pipelineSnapshot.engaged}
          icon={TrendingUp}
          color="bg-purple-500"
        />
        <MetricCard
          label="Qualified"
          value={dashboard.pipelineSnapshot.qualified}
          icon={Target}
          color="bg-indigo-500"
        />
        <MetricCard
          label="Avg Score"
          value={dashboard.pipelineSnapshot.averageScore}
          icon={TrendingUp}
          color="bg-primary-500"
          suffix="/100"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Prioritized Call List — Main workspace area */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Today&apos;s Prioritized Call List</h3>
              <p className="text-sm text-gray-500 mt-0.5">AI-ranked by likelihood to convert</p>
            </div>
            <Link href="/leads" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {dashboard.prioritizedLeads.map((lead, index) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-6 text-center">
                  <span className="text-sm font-bold text-gray-400">#{index + 1}</span>
                </div>

                {/* Score */}
                <div className="flex-shrink-0">
                  <span className={cn('score-badge', getScoreBgColor(lead.aiScore))}>
                    {lead.aiScore}
                  </span>
                </div>

                {/* Lead info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {lead.displayName}
                    </p>
                    <span className={cn('status-badge', getStatusBadgeColor(lead.status))}>
                      {lead.status}
                    </span>
                    {(lead.buyingSignals as number) > 0 && (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <Zap className="w-3 h-3" />
                        {lead.buyingSignals as number} signal{(lead.buyingSignals as number) !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {lead.title} at {lead.company}
                  </p>
                </div>

                {/* Recommended action */}
                <div className="hidden sm:block flex-shrink-0 text-right max-w-[200px]">
                  <p className="text-xs text-primary-600 font-medium truncate">
                    {lead.recommendedAction}
                  </p>
                  {lead.lastActivity && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatRelativeTime(lead.lastActivity)}
                    </p>
                  )}
                </div>

                <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Right sidebar: Notifications + Follow-ups */}
        <div className="space-y-6">
          {/* Notifications */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
              {dashboard.unreadNotifications > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {dashboard.unreadNotifications} new
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {dashboard.notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    'px-6 py-3',
                    !notif.read && 'bg-blue-50/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <NotificationIcon type={notif.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(notif.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Follow-ups */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900">Pending Follow-ups</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {dashboard.pendingFollowUps.map((followUp) => (
                <Link
                  key={followUp.id}
                  href={`/leads/${followUp.id}`}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {followUp.displayName}
                    </p>
                    <p className="text-xs text-gray-500">{followUp.company}</p>
                  </div>
                  <span className={cn('score-badge text-xs', getScoreBgColor(followUp.aiScore))}>
                    {followUp.aiScore}
                  </span>
                </Link>
              ))}
              {dashboard.pendingFollowUps.length === 0 && (
                <p className="px-6 py-4 text-sm text-gray-500">No pending follow-ups</p>
              )}
            </div>
          </div>

          {/* Recent Calls */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Recent Calls</h3>
              <Link href="/calls" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View All
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {dashboard.recentCalls.map((call) => (
                <Link
                  key={call.id}
                  href={`/calls/${call.id}`}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className={cn(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    call.outcome === 'connected' ? 'bg-green-100' : 'bg-gray-100'
                  )}>
                    <Phone className={cn(
                      'w-4 h-4',
                      call.outcome === 'connected' ? 'text-green-600' : 'text-gray-400'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{call.leadName}</p>
                    <p className="text-xs text-gray-500">
                      {call.outcome} &middot; {formatDuration(call.duration)}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">{formatRelativeTime(call.callDate)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  suffix,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  suffix?: string;
}) {
  return (
    <div className="card card-body">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {value}{suffix && <span className="text-sm font-normal text-gray-400">{suffix}</span>}
          </p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  const iconMap: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string; fg: string }> = {
    buying_signal: { icon: Zap, bg: 'bg-amber-100', fg: 'text-amber-600' },
    score_change: { icon: TrendingUp, bg: 'bg-blue-100', fg: 'text-blue-600' },
    call_analyzed: { icon: Phone, bg: 'bg-green-100', fg: 'text-green-600' },
    outreach_reply: { icon: Mail, bg: 'bg-purple-100', fg: 'text-purple-600' },
    deal_alert: { icon: AlertCircle, bg: 'bg-red-100', fg: 'text-red-600' },
  };

  const config = iconMap[type] || iconMap.deal_alert;
  const Icon = config.icon;

  return (
    <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center', config.bg)}>
      <Icon className={cn('w-4 h-4', config.fg)} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card card-body">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-200" />
              <div>
                <div className="h-6 w-12 bg-gray-200 rounded" />
                <div className="h-3 w-16 bg-gray-100 rounded mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="card-header">
            <div className="h-5 w-48 bg-gray-200 rounded" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-gray-100">
              <div className="h-4 w-full bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-header">
            <div className="h-5 w-32 bg-gray-200 rounded" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="px-6 py-3 border-b border-gray-100">
              <div className="h-4 w-full bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
