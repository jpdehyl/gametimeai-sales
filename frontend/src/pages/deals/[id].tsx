// ============================================================
// Deal Room — Monaco-style Deal Intelligence Command Center
// The most important page in GameTime AI. This is where an AE
// manages a specific deal end-to-end: stakeholders, risks,
// competitive intel, MEDDIC scoring, next actions, and more.
// ============================================================

import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchDealDetail,
  completeAction,
  updateDealStage,
  generateMeetingPrep,
  DEAL_STAGES,
  type DealDetail,
  type DealStage,
  type Activity,
  type Stakeholder,
  type RiskFactor,
  type NextBestAction,
  type CompetitorIntel,
} from '@/lib/api';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import {
  cn,
  formatCurrency,
  formatRelativeTime,
  formatDuration,
  getHealthScoreColor,
  getHealthScoreBg,
  getStageBadgeColor,
  getRoleBadgeColor,
  getSentimentColor,
  getSeverityColor,
  getPriorityColor,
  getInfluenceIcon,
} from '@/lib/utils';
import {
  ArrowLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Clock,
  Target,
  Shield,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Users,
  User,
  Phone,
  Mail,
  Video,
  FileText,
  MessageSquare,
  Zap,
  Brain,
  Swords,
  Package,
  Sparkles,
  Activity as ActivityIcon,
  CircleDot,
  Signal,
  Star,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Search,
  BarChart3,
  Loader2,
} from 'lucide-react';

// ============================================================
// Stage Progress Bar Component
// ============================================================

function StageProgressBar({ currentStage, daysInStage }: { currentStage: DealStage; daysInStage: number }) {
  const activeStages = DEAL_STAGES.filter((s) => s.key !== 'closed_lost');
  const currentIndex = activeStages.findIndex((s) => s.key === currentStage);
  const isLost = currentStage === 'closed_lost';

  return (
    <div className="card card-body">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deal Progress</h3>
        <span className="text-xs text-gray-500">
          {daysInStage} {daysInStage === 1 ? 'day' : 'days'} in current stage
        </span>
      </div>
      {isLost ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <AlertOctagon className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-red-800">Deal Closed Lost</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {activeStages.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isWon = stage.key === 'closed_won' && currentStage === 'closed_won';

            return (
              <div key={stage.key} className="flex-1 flex items-center">
                <div className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'w-full h-2 rounded-full transition-all',
                      isCompleted || isWon
                        ? 'bg-emerald-500'
                        : isCurrent
                          ? 'bg-primary-500 ring-2 ring-primary-200'
                          : 'bg-gray-200'
                    )}
                  />
                  <span
                    className={cn(
                      'text-[10px] font-medium leading-none text-center',
                      isCurrent
                        ? 'text-primary-700 font-bold'
                        : isCompleted || isWon
                          ? 'text-emerald-600'
                          : 'text-gray-400'
                    )}
                  >
                    {stage.label}
                  </span>
                </div>
                {idx < activeStages.length - 1 && (
                  <ChevronRight
                    className={cn(
                      'w-3 h-3 mx-0.5 flex-shrink-0',
                      isCompleted ? 'text-emerald-400' : 'text-gray-300'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MEDDIC Scorecard Component
// ============================================================

const MEDDIC_LABELS: Record<string, { label: string; icon: typeof Target }> = {
  metrics: { label: 'Metrics', icon: BarChart3 },
  economicBuyer: { label: 'Economic Buyer', icon: User },
  decisionCriteria: { label: 'Decision Criteria', icon: FileText },
  decisionProcess: { label: 'Decision Process', icon: Target },
  identifyPain: { label: 'Identify Pain', icon: AlertTriangle },
  champion: { label: 'Champion', icon: Star },
};

function getMeddicBarColor(score: number): string {
  if (score >= 8) return 'bg-emerald-500';
  if (score >= 6) return 'bg-yellow-500';
  if (score >= 4) return 'bg-orange-500';
  return 'bg-red-500';
}

function MEDDICScorecard({ meddic }: { meddic: DealDetail['meddicScore'] }) {
  const [expanded, setExpanded] = useState(true);

  const criteria = Object.entries(MEDDIC_LABELS).map(([key, meta]) => {
    const data = meddic[key as keyof typeof meddic] as { score: number; notes: string };
    return { key, ...meta, score: data.score, notes: data.notes };
  });

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full card-header flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-500" />
            MEDDIC Scorecard
          </h3>
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold',
              meddic.overallScore >= 70
                ? 'bg-emerald-100 text-emerald-800'
                : meddic.overallScore >= 50
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            )}
          >
            {meddic.overallScore}/100
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expanded && (
        <div className="card-body space-y-4">
          {criteria.map(({ key, label, icon: Icon, score, notes }) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </div>
                <span
                  className={cn(
                    'text-sm font-bold',
                    score >= 8 ? 'text-emerald-600' : score >= 6 ? 'text-yellow-600' : score >= 4 ? 'text-orange-600' : 'text-red-600'
                  )}
                >
                  {score}/10
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={cn('h-1.5 rounded-full transition-all', getMeddicBarColor(score))}
                  style={{ width: `${score * 10}%` }}
                />
              </div>
              {notes && <p className="text-xs text-gray-500 pl-5.5">{notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Activity Type Helpers
// ============================================================

function getActivityIcon(type: Activity['type']) {
  switch (type) {
    case 'call':
      return { icon: Phone, color: 'text-green-600', bg: 'bg-green-100' };
    case 'email':
      return { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100' };
    case 'meeting':
      return { icon: Video, color: 'text-purple-600', bg: 'bg-purple-100' };
    case 'demo':
      return { icon: Sparkles, color: 'text-indigo-600', bg: 'bg-indigo-100' };
    case 'note':
      return { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' };
    case 'task':
      return { icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-100' };
    case 'stage_change':
      return { icon: ChevronRight, color: 'text-orange-600', bg: 'bg-orange-100' };
    default:
      return { icon: CircleDot, color: 'text-gray-600', bg: 'bg-gray-100' };
  }
}

function getCategoryTag(category: RiskFactor['category']): { label: string; bg: string; text: string } {
  switch (category) {
    case 'engagement':
      return { label: 'Engagement', bg: 'bg-blue-50', text: 'text-blue-700' };
    case 'competition':
      return { label: 'Competition', bg: 'bg-orange-50', text: 'text-orange-700' };
    case 'timeline':
      return { label: 'Timeline', bg: 'bg-amber-50', text: 'text-amber-700' };
    case 'budget':
      return { label: 'Budget', bg: 'bg-emerald-50', text: 'text-emerald-700' };
    case 'stakeholder':
      return { label: 'Champion', bg: 'bg-purple-50', text: 'text-purple-700' };
    case 'technical':
      return { label: 'Technical', bg: 'bg-indigo-50', text: 'text-indigo-700' };
    default:
      return { label: category, bg: 'bg-gray-50', text: 'text-gray-700' };
  }
}

function getCompetitorStatusBadge(status: CompetitorIntel['status']): { label: string; bg: string; text: string } {
  switch (status) {
    case 'active':
      return { label: 'Active Threat', bg: 'bg-red-100', text: 'text-red-800' };
    case 'evaluating':
      return { label: 'Evaluating', bg: 'bg-amber-100', text: 'text-amber-800' };
    case 'eliminated':
      return { label: 'Eliminated', bg: 'bg-green-100', text: 'text-green-800' };
    case 'unknown':
      return { label: 'Unknown', bg: 'bg-gray-100', text: 'text-gray-700' };
    default:
      return { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

function getForecastBadge(category: string): { label: string; bg: string; text: string } {
  switch (category) {
    case 'commit':
      return { label: 'Commit', bg: 'bg-emerald-100', text: 'text-emerald-800' };
    case 'best_case':
      return { label: 'Best Case', bg: 'bg-blue-100', text: 'text-blue-800' };
    case 'pipeline':
      return { label: 'Pipeline', bg: 'bg-gray-100', text: 'text-gray-700' };
    case 'omitted':
      return { label: 'Omitted', bg: 'bg-gray-50', text: 'text-gray-500' };
    default:
      return { label: category, bg: 'bg-gray-100', text: 'text-gray-700' };
  }
}

function getThreatBars(level: 'high' | 'medium' | 'low'): { count: number; color: string } {
  switch (level) {
    case 'high':
      return { count: 3, color: 'bg-red-500' };
    case 'medium':
      return { count: 2, color: 'bg-amber-500' };
    case 'low':
      return { count: 1, color: 'bg-green-500' };
    default:
      return { count: 1, color: 'bg-gray-400' };
  }
}

function getActionTypeIcon(type: NextBestAction['type']) {
  switch (type) {
    case 'call':
      return Phone;
    case 'email':
      return Mail;
    case 'meeting':
      return Video;
    case 'research':
      return Search;
    case 'internal':
      return Users;
    case 'follow_up':
      return MessageSquare;
    case 'escalation':
      return AlertTriangle;
    default:
      return Zap;
  }
}

// ============================================================
// Close Date Helpers
// ============================================================

function getCloseDateInfo(closeDate: string): { label: string; urgent: boolean; overdue: boolean; daysLeft: number } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const close = new Date(closeDate);
  close.setHours(0, 0, 0, 0);
  const diffMs = close.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / 86400000);

  if (daysLeft < 0) {
    return { label: `${Math.abs(daysLeft)}d overdue`, urgent: true, overdue: true, daysLeft };
  }
  if (daysLeft === 0) {
    return { label: 'Due today', urgent: true, overdue: false, daysLeft: 0 };
  }
  if (daysLeft <= 7) {
    return { label: `${daysLeft}d left`, urgent: true, overdue: false, daysLeft };
  }
  return { label: `${daysLeft}d left`, urgent: false, overdue: false, daysLeft };
}

// ============================================================
// Main Deal Room Page
// ============================================================

export default function DealRoomPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();

  const [activityFilter, setActivityFilter] = useState<Activity['type'] | 'all'>('all');
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [meetingPrepLoading, setMeetingPrepLoading] = useState(false);

  // ---- Data Fetching ----

  const { data, isLoading, isError } = useQuery({
    queryKey: ['deal', id],
    queryFn: () => fetchDealDetail(id as string),
    enabled: !!id,
  });

  // ---- Mutations ----

  const completeActionMutation = useMutation({
    mutationFn: ({ actionId }: { actionId: string }) => completeAction(id as string, actionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', id] });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: (stage: DealStage) => updateDealStage(id as string, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', id] });
      setStageDropdownOpen(false);
    },
  });

  const meetingPrepMutation = useMutation({
    mutationFn: () => generateMeetingPrep(id as string),
    onSettled: () => setMeetingPrepLoading(false),
  });

  // ---- Loading State ----

  if (isLoading || !data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-72 bg-gray-200 rounded" />
        <div className="h-3 w-48 bg-gray-100 rounded" />
        <div className="grid grid-cols-6 gap-3 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-2 bg-gray-200 rounded-full" />
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card card-body space-y-4">
              <div className="h-6 w-48 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
            </div>
            <div className="card card-body space-y-4">
              <div className="h-6 w-64 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="card card-body space-y-4">
              <div className="h-6 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900">Failed to load deal</h2>
        <p className="text-sm text-gray-500 mt-1">Please try refreshing the page.</p>
      </div>
    );
  }

  const deal = data.data;
  const healthColor = getHealthScoreColor(deal.healthScore);
  const closeDateInfo = getCloseDateInfo(deal.closeDate);
  const forecastBadge = getForecastBadge(deal.forecastCategory);

  // Filter activities
  const filteredActivities =
    activityFilter === 'all' ? deal.activities : deal.activities.filter((a) => a.type === activityFilter);

  // Stage label helper
  const stageLabel = DEAL_STAGES.find((s) => s.key === deal.stage)?.label || deal.stage;

  return (
    <div className="space-y-5">
      {/* ================================================================
          HEADER — Deal Identity + Key Metrics + Actions
          ================================================================ */}
      <div className="space-y-4">
        {/* Top Row: Back + Deal Name + Actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link href="/deals" className="p-2 hover:bg-gray-100 rounded-lg mt-0.5">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{deal.name}</h1>
                <span className={cn('status-badge', getStageBadgeColor(deal.stage))}>{stageLabel}</span>
                <span className={cn('status-badge', forecastBadge.bg, forecastBadge.text)}>
                  {forecastBadge.label}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Link
                  href={`/accounts/${deal.account.id}`}
                  className="text-sm text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1"
                >
                  {deal.account.name}
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
                {deal.account.industry && (
                  <span className="text-xs text-gray-400">&middot; {deal.account.industry}</span>
                )}
                {deal.account.tier && (
                  <span className="text-xs text-gray-400 capitalize">&middot; {deal.account.tier.replace('_', ' ')}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setMeetingPrepLoading(true);
                meetingPrepMutation.mutate();
              }}
              disabled={meetingPrepLoading}
              className="btn-secondary"
            >
              {meetingPrepLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              Generate Meeting Prep
            </button>

            {/* Stage Dropdown */}
            <div className="relative">
              <button
                onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
                className="btn-primary"
              >
                Update Stage
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              {stageDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStageDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                    {DEAL_STAGES.map((stage) => (
                      <button
                        key={stage.key}
                        onClick={() => updateStageMutation.mutate(stage.key)}
                        disabled={stage.key === deal.stage || updateStageMutation.isPending}
                        className={cn(
                          'w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2',
                          stage.key === deal.stage && 'bg-primary-50 text-primary-700 font-medium'
                        )}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.label}
                        {stage.key === deal.stage && (
                          <span className="text-xs text-primary-500 ml-auto">Current</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Metric Chips Row */}
        <div className="flex items-center gap-3 flex-wrap pl-11">
          {/* Amount */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
            <span className="text-xs text-gray-500 font-medium">Amount</span>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(deal.amount)}</span>
          </div>

          {/* Health Score */}
          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border', getHealthScoreBg(deal.healthScore))}>
            <span className="text-xs font-medium opacity-70">Health</span>
            <span className="text-sm font-bold">{deal.healthScore}</span>
            {deal.healthTrend === 'improving' && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
            {deal.healthTrend === 'declining' && <TrendingDown className="w-3.5 h-3.5 text-red-600" />}
            {deal.healthTrend === 'stable' && <Minus className="w-3.5 h-3.5 text-gray-500" />}
          </div>

          {/* Win Probability */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
            <Target className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Win</span>
            <span className="text-sm font-bold text-gray-900">{deal.winProbability}%</span>
          </div>

          {/* Close Date */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border',
              closeDateInfo.urgent
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-white border-gray-200 text-gray-900'
            )}
          >
            <Calendar className="w-3.5 h-3.5 opacity-60" />
            <span className="text-xs font-medium opacity-70">Close</span>
            <span className="text-sm font-bold">{new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span
              className={cn(
                'text-xs font-semibold',
                closeDateInfo.overdue ? 'text-red-600' : closeDateInfo.urgent ? 'text-red-600' : 'text-gray-500'
              )}
            >
              ({closeDateInfo.label})
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================
          STAGE PROGRESS BAR
          ================================================================ */}
      <StageProgressBar currentStage={deal.stage} daysInStage={deal.daysInCurrentStage} />

      {/* ================================================================
          MEDDIC SCORECARD
          ================================================================ */}
      <MEDDICScorecard meddic={deal.meddicScore} />

      {/* ================================================================
          MAIN 2-COLUMN GRID — Left (wider) + Right
          ================================================================ */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* ============================================================
            LEFT COLUMN — Risks, Stakeholders, Activity Timeline
            ============================================================ */}
        <div className="lg:col-span-2 space-y-6">
          {/* ---- Risk Factors ---- */}
          {deal.riskFactors.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Risk Factors
                  <span className="text-xs font-normal text-gray-400">({deal.riskFactors.length})</span>
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {deal.riskFactors.map((risk) => {
                  const severityStyle = getSeverityColor(risk.severity);
                  const categoryTag = getCategoryTag(risk.category);
                  return (
                    <div
                      key={risk.id}
                      className={cn(
                        'px-6 py-4 border-l-4',
                        risk.severity === 'critical'
                          ? 'border-l-red-500'
                          : risk.severity === 'high'
                            ? 'border-l-orange-500'
                            : risk.severity === 'medium'
                              ? 'border-l-amber-400'
                              : 'border-l-blue-300'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase',
                                severityStyle
                              )}
                            >
                              {risk.severity}
                            </span>
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                                categoryTag.bg,
                                categoryTag.text
                              )}
                            >
                              {categoryTag.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 mt-1">{risk.description}</p>
                          {risk.recommendation && (
                            <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                              <Lightbulb className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-blue-800">{risk.recommendation}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- Stakeholder Map ---- */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                Stakeholder Map
                <span className="text-xs font-normal text-gray-400">({deal.stakeholders.length})</span>
              </h3>
            </div>
            {deal.stakeholders.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {deal.stakeholders
                  .sort((a, b) => {
                    const influenceOrder = { high: 0, medium: 1, low: 2 };
                    return (influenceOrder[a.influence] ?? 3) - (influenceOrder[b.influence] ?? 3);
                  })
                  .map((stakeholder) => {
                    const roleBadge = getRoleBadgeColor(stakeholder.role);
                    const sentimentStyle = getSentimentColor(stakeholder.sentiment);
                    const influenceInfo = getInfluenceIcon(stakeholder.influence);

                    return (
                      <div key={stakeholder.id} className="px-6 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Name + Title */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-gray-900">{stakeholder.name}</span>
                              <span className="text-xs text-gray-500">{stakeholder.title}</span>
                            </div>

                            {/* Badges Row */}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span
                                className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize',
                                  roleBadge
                                )}
                              >
                                {stakeholder.role.replace(/_/g, ' ')}
                              </span>

                              {/* Influence bars */}
                              <span className="inline-flex items-center gap-1" title={influenceInfo.label}>
                                {[1, 2, 3].map((bar) => (
                                  <span
                                    key={bar}
                                    className={cn(
                                      'w-1 rounded-sm',
                                      bar <= influenceInfo.bars ? influenceInfo.color : 'text-gray-200',
                                      bar <= influenceInfo.bars
                                        ? bar === 3
                                          ? 'h-3 bg-current'
                                          : bar === 2
                                            ? 'h-2.5 bg-current'
                                            : 'h-2 bg-current'
                                        : bar === 3
                                          ? 'h-3 bg-gray-200'
                                          : bar === 2
                                            ? 'h-2.5 bg-gray-200'
                                            : 'h-2 bg-gray-200'
                                    )}
                                  />
                                ))}
                                <span className="text-[10px] text-gray-400 ml-0.5 capitalize">{stakeholder.influence}</span>
                              </span>

                              {/* Sentiment */}
                              <span className={cn('text-xs font-medium capitalize', sentimentStyle)}>
                                {stakeholder.sentiment === 'unknown' ? '?' : stakeholder.sentiment}
                              </span>

                              {/* Engagement */}
                              <span
                                className={cn(
                                  'text-[10px] px-1.5 py-0.5 rounded capitalize',
                                  stakeholder.engagementLevel === 'high'
                                    ? 'bg-green-50 text-green-700'
                                    : stakeholder.engagementLevel === 'medium'
                                      ? 'bg-yellow-50 text-yellow-700'
                                      : stakeholder.engagementLevel === 'low'
                                        ? 'bg-orange-50 text-orange-700'
                                        : 'bg-gray-50 text-gray-500'
                                )}
                              >
                                {stakeholder.engagementLevel} engagement
                              </span>
                            </div>

                            {/* Contact + Interactions */}
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                              <span>
                                Last contact: {stakeholder.lastContactedAt ? formatRelativeTime(stakeholder.lastContactedAt) : 'Never'}
                              </span>
                              <span>{stakeholder.totalInteractions} interactions</span>
                            </div>

                            {/* Next Action */}
                            {stakeholder.nextAction && (
                              <div className="flex items-start gap-1.5 mt-2">
                                <Zap className="w-3 h-3 text-amber-500 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-amber-700">{stakeholder.nextAction}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="card-body text-sm text-gray-500">
                No stakeholders mapped yet. Start building your stakeholder map.
              </div>
            )}
          </div>

          {/* ---- Activity Timeline ---- */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <ActivityIcon className="w-4 h-4 text-gray-500" />
                Activity Timeline
                <span className="text-xs font-normal text-gray-400">({deal.activities.length})</span>
              </h3>
              {/* Filter Tabs */}
              <div className="flex items-center gap-1">
                {(['all', 'call', 'email', 'meeting', 'demo', 'stage_change'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActivityFilter(type)}
                    className={cn(
                      'px-2 py-1 text-xs rounded-md transition-colors capitalize',
                      activityFilter === type
                        ? 'bg-primary-100 text-primary-800 font-medium'
                        : 'text-gray-500 hover:bg-gray-100'
                    )}
                  >
                    {type === 'stage_change' ? 'Stages' : type}
                  </button>
                ))}
              </div>
            </div>
            {filteredActivities.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {filteredActivities.map((activity, idx) => {
                  const { icon: Icon, color, bg } = getActivityIcon(activity.type);
                  return (
                    <div key={activity.id} className="px-6 py-3 flex items-start gap-3">
                      <div className={cn('flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5', bg)}>
                        <Icon className={cn('w-3.5 h-3.5', color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">{activity.subject}</span>
                          {activity.stakeholderId && (
                            <span className="text-xs text-gray-400 truncate">
                              {deal.stakeholders.find((s) => s.id === activity.stakeholderId)?.name}
                            </span>
                          )}
                        </div>
                        {activity.description && (
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{activity.description}</p>
                        )}

                        {/* Call-specific details */}
                        {activity.type === 'call' && (
                          <div className="flex items-center gap-3 mt-1">
                            {activity.callDuration != null && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(activity.callDuration)}
                              </span>
                            )}
                            {activity.callSentiment && (
                              <span
                                className={cn(
                                  'text-xs capitalize',
                                  activity.callSentiment === 'positive'
                                    ? 'text-green-600'
                                    : activity.callSentiment === 'negative'
                                      ? 'text-red-500'
                                      : 'text-gray-500'
                                )}
                              >
                                {activity.callSentiment}
                              </span>
                            )}
                          </div>
                        )}
                        {activity.type === 'call' && activity.callSummary && (
                          <p className="text-xs text-gray-500 mt-1 italic">{activity.callSummary}</p>
                        )}

                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {formatRelativeTime(activity.occurredAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card-body text-sm text-gray-500">
                No activities {activityFilter !== 'all' ? `of type "${activityFilter}"` : ''} recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* ============================================================
            RIGHT COLUMN — Actions, Competitive Intel, Products, Strengths
            ============================================================ */}
        <div className="space-y-6">
          {/* ---- Next Best Actions ---- */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                Next Best Actions
              </h3>
            </div>
            {deal.nextBestActions.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {deal.nextBestActions
                  .sort((a, b) => {
                    const pOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
                    if (a.completed !== b.completed) return a.completed ? 1 : -1;
                    return (pOrder[a.priority] ?? 4) - (pOrder[b.priority] ?? 4);
                  })
                  .map((action) => {
                    const priorityStyle = getPriorityColor(action.priority);
                    const ActionTypeIcon = getActionTypeIcon(action.type);
                    return (
                      <div
                        key={action.id}
                        className={cn(
                          'px-5 py-4 transition-colors',
                          action.completed && 'opacity-50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {/* Completion Toggle */}
                          <button
                            onClick={() => {
                              if (!action.completed) {
                                completeActionMutation.mutate({ actionId: action.id });
                              }
                            }}
                            disabled={action.completed || completeActionMutation.isPending}
                            className="mt-0.5 flex-shrink-0"
                          >
                            {action.completed ? (
                              <CheckSquare className="w-4 h-4 text-green-500" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300 hover:text-primary-500 transition-colors" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase', priorityStyle)}>
                                {action.priority}
                              </span>
                              <ActionTypeIcon className="w-3 h-3 text-gray-400" />
                              <span
                                className={cn(
                                  'text-sm font-medium',
                                  action.completed ? 'text-gray-400 line-through' : 'text-gray-900'
                                )}
                              >
                                {action.title}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{action.description}</p>

                            {/* AI Reasoning — the WHY */}
                            {action.reasoning && (
                              <div className="flex items-start gap-1.5 mt-2 px-2.5 py-1.5 bg-amber-50 rounded border border-amber-100">
                                <Brain className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-[11px] text-amber-800 leading-relaxed">{action.reasoning}</p>
                              </div>
                            )}

                            {action.suggestedDate && (
                              <span className="text-[10px] text-gray-400 mt-1.5 block">
                                Suggested: {new Date(action.suggestedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="card-body text-sm text-gray-500">No actions suggested yet.</div>
            )}
          </div>

          {/* ---- Competitive Intelligence ---- */}
          {deal.competitors.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-orange-500" />
                  Competitive Intelligence
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {deal.competitors.map((comp, idx) => {
                  const statusBadge = getCompetitorStatusBadge(comp.status);
                  const threat = getThreatBars(comp.threatLevel);
                  return (
                    <div key={idx} className="px-5 py-4">
                      {/* Competitor Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">{comp.name}</span>
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium', statusBadge.bg, statusBadge.text)}>
                            {statusBadge.label}
                          </span>
                        </div>
                        {/* Threat level bars */}
                        <div className="flex items-center gap-1" title={`${comp.threatLevel} threat`}>
                          {[1, 2, 3].map((bar) => (
                            <span
                              key={bar}
                              className={cn(
                                'w-1.5 rounded-sm',
                                bar <= threat.count ? threat.color : 'bg-gray-200',
                                bar === 1 ? 'h-2' : bar === 2 ? 'h-3' : 'h-4'
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Our Advantages */}
                      {comp.ourAdvantages.length > 0 && (
                        <div className="mb-2">
                          <span className="text-[10px] font-semibold text-emerald-600 uppercase">Our Advantages</span>
                          <ul className="mt-1 space-y-0.5">
                            {comp.ourAdvantages.map((adv, i) => (
                              <li key={i} className="text-xs text-emerald-700 flex items-start gap-1.5">
                                <ThumbsUp className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                {adv}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Their Strengths */}
                      {comp.strengths.length > 0 && (
                        <div className="mb-2">
                          <span className="text-[10px] font-semibold text-red-600 uppercase">Their Strengths</span>
                          <ul className="mt-1 space-y-0.5">
                            {comp.strengths.map((str, i) => (
                              <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
                                <ThumbsDown className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                {str}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Talking Points */}
                      {comp.talkingPoints.length > 0 && (
                        <div>
                          <span className="text-[10px] font-semibold text-blue-600 uppercase">Talking Points</span>
                          <ul className="mt-1 space-y-0.5">
                            {comp.talkingPoints.map((tp, i) => (
                              <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                                <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                {tp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---- Products ---- */}
          {deal.products && deal.products.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  Products
                </h3>
              </div>
              <div className="card-body">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] text-gray-400 uppercase">
                      <th className="text-left pb-2 font-medium">Product</th>
                      <th className="text-right pb-2 font-medium">Qty</th>
                      <th className="text-right pb-2 font-medium">Unit</th>
                      <th className="text-right pb-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {deal.products.map((product) => (
                      <tr key={product.id} className="text-sm">
                        <td className="py-2 text-gray-900 font-medium">{product.name}</td>
                        <td className="py-2 text-gray-600 text-right">{product.quantity}</td>
                        <td className="py-2 text-gray-600 text-right">{formatCurrency(product.unitPrice)}</td>
                        <td className="py-2 text-gray-900 font-medium text-right">{formatCurrency(product.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-200">
                      <td className="pt-2 text-sm font-bold text-gray-900" colSpan={3}>Total</td>
                      <td className="pt-2 text-sm font-bold text-gray-900 text-right">{formatCurrency(deal.amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ---- Deal Strengths ---- */}
          {deal.strengths && deal.strengths.length > 0 && (
            <div className="card border-emerald-200 bg-emerald-50/30">
              <div className="card-header border-emerald-200">
                <h3 className="text-base font-semibold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Deal Strengths
                </h3>
              </div>
              <div className="card-body">
                <ul className="space-y-2">
                  {deal.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================
          Meeting Prep Result (shows when generated)
          ================================================================ */}
      {meetingPrepMutation.isSuccess && meetingPrepMutation.data && (
        <div className="card border-indigo-200">
          <div className="card-header bg-indigo-50 border-indigo-200 flex items-center justify-between">
            <h3 className="text-base font-semibold text-indigo-900 flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-500" />
              Meeting Prep
            </h3>
            <button
              onClick={() => meetingPrepMutation.reset()}
              className="text-xs text-indigo-600 hover:text-indigo-800"
            >
              Dismiss
            </button>
          </div>
          <div className="card-body space-y-4">
            {/* Objective */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Objective</h4>
              <p className="text-sm text-gray-800">{meetingPrepMutation.data.data.objective}</p>
            </div>

            {/* Key Talking Points */}
            {meetingPrepMutation.data.data.keyTalkingPoints.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Key Talking Points</h4>
                <ul className="space-y-1">
                  {meetingPrepMutation.data.data.keyTalkingPoints.map((point, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-indigo-400 mt-0.5">&#x2022;</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risks to Address */}
            {meetingPrepMutation.data.data.risksToAddress.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Risks to Address</h4>
                <ul className="space-y-1">
                  {meetingPrepMutation.data.data.risksToAddress.map((risk, i) => (
                    <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Desired Outcomes */}
            {meetingPrepMutation.data.data.desiredOutcomes.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Desired Outcomes</h4>
                <ul className="space-y-1">
                  {meetingPrepMutation.data.data.desiredOutcomes.map((outcome, i) => (
                    <li key={i} className="text-sm text-emerald-700 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stakeholder Briefs */}
            {meetingPrepMutation.data.data.stakeholderBriefs.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Stakeholder Briefs</h4>
                <div className="space-y-3">
                  {meetingPrepMutation.data.data.stakeholderBriefs.map((brief, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-gray-900">{brief.name}</span>
                        <span className="text-xs text-gray-500">{brief.title}</span>
                      </div>
                      <p className="text-xs text-gray-600">{brief.approachTips}</p>
                      {brief.concerns.length > 0 && (
                        <div className="mt-1">
                          <span className="text-[10px] text-red-500 uppercase font-medium">Concerns: </span>
                          <span className="text-xs text-gray-600">{brief.concerns.join(' / ')}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
