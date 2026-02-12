// ============================================================
// Lead Detail — Virtual Assistant Lead Intelligence View
// GameTime AI — Full lead detail with AI analysis, auto-response
// content, qualification workflow, and conversion tracking.
// ============================================================

import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLeadDetail,
  qualifyLead,
  convertLead,
  type InboundLead,
  type AutoResponseData,
} from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Brain,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Inbox,
  Mail,
  MailOpen,
  MessageSquare,
  Phone,
  Reply,
  Send,
  Shield,
  Target,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  User,
  Users,
  XCircle,
  Zap,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';

// ============================================================
// Helpers
// ============================================================

function getStatusBadge(status: string): { label: string; classes: string } {
  switch (status) {
    case 'new':
      return { label: 'New', classes: 'bg-blue-100 text-blue-800' };
    case 'auto_responded':
      return { label: 'Auto Responded', classes: 'bg-cyan-100 text-cyan-800' };
    case 'sdr_review':
      return { label: 'SDR Review', classes: 'bg-amber-100 text-amber-800' };
    case 'qualified':
      return { label: 'Qualified', classes: 'bg-emerald-100 text-emerald-800' };
    case 'disqualified':
      return { label: 'Disqualified', classes: 'bg-red-100 text-red-800' };
    case 'converted':
      return { label: 'Converted', classes: 'bg-purple-100 text-purple-800' };
    default:
      return { label: status, classes: 'bg-gray-100 text-gray-700' };
  }
}

function getAiScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (score >= 40) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

function getAiScoreLabel(score: number): string {
  if (score >= 80) return 'High Quality';
  if (score >= 60) return 'Medium Quality';
  if (score >= 40) return 'Low Quality';
  return 'Very Low Quality';
}

function formatResponseTimeMs(ms: number | undefined): string {
  if (!ms) return '--';
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = seconds / 60;
  return `${minutes.toFixed(1)}m`;
}

function getResponseTimeColor(ms: number | undefined): string {
  if (!ms) return 'text-gray-400';
  const seconds = ms / 1000;
  if (seconds < 15) return 'text-emerald-600';
  if (seconds < 60) return 'text-yellow-600';
  return 'text-red-500';
}

// ============================================================
// Main Component
// ============================================================

export default function LeadDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();

  const [qualifyNotes, setQualifyNotes] = useState('');
  const [showQualifyForm, setShowQualifyForm] = useState(false);

  // ---- Data Fetching ----
  const { data, isLoading, isError } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLeadDetail(id as string),
    enabled: !!id,
  });

  // ---- Mutations ----
  const qualifyMutation = useMutation({
    mutationFn: ({ qualified }: { qualified: boolean }) =>
      qualifyLead(id as string, qualified, qualifyNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-metrics'] });
      setShowQualifyForm(false);
      setQualifyNotes('');
    },
  });

  const convertMutation = useMutation({
    mutationFn: () => convertLead(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-metrics'] });
    },
  });

  // ---- Loading State ----
  if (isLoading || !data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-72 bg-gray-200 rounded" />
        <div className="h-3 w-48 bg-gray-100 rounded" />
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
        <h2 className="text-lg font-semibold text-gray-900">Failed to load lead</h2>
        <p className="text-sm text-gray-500 mt-1">Please try refreshing the page.</p>
      </div>
    );
  }

  const lead = data.data;
  const statusBadge = getStatusBadge(lead.status);
  const aiScore = lead.aiScore ?? 0;
  const canQualify = lead.status === 'sdr_review' || lead.status === 'auto_responded' || lead.status === 'new';
  const canConvert = lead.status === 'qualified' && !lead.convertedAccountId;

  return (
    <div className="space-y-5">
      {/* ================================================================
          HEADER
          ================================================================ */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Link href="/leads" className="p-2 hover:bg-gray-100 rounded-lg mt-0.5">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">
                  {lead.firstName} {lead.lastName}
                </h1>
                <span className={cn('status-badge', statusBadge.classes)}>
                  {statusBadge.label}
                </span>
                {aiScore > 0 && (
                  <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold border', getAiScoreBg(aiScore))}>
                    AI: {aiScore}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <Building2 className="w-3.5 h-3.5" />
                <span>{lead.company}</span>
                {lead.title && (
                  <>
                    <span className="text-gray-300">&middot;</span>
                    <span>{lead.title}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {canConvert && (
              <button
                onClick={() => convertMutation.mutate()}
                disabled={convertMutation.isPending}
                className="btn-primary"
              >
                {convertMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <TrendingUp className="w-4 h-4 mr-2" />
                )}
                Convert to Deal
              </button>
            )}
            {canQualify && !showQualifyForm && (
              <button
                onClick={() => setShowQualifyForm(true)}
                className="btn-secondary"
              >
                <Target className="w-4 h-4 mr-2" />
                Qualify / Disqualify
              </button>
            )}
          </div>
        </div>

        {/* Metric chips */}
        <div className="flex items-center gap-3 flex-wrap pl-11">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Response</span>
            <span className={cn('text-sm font-bold', getResponseTimeColor(lead.responseTimeMs))}>
              {formatResponseTimeMs(lead.responseTimeMs)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
            <Inbox className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Source</span>
            <span className="text-sm font-bold text-gray-900 capitalize">{lead.source}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500 font-medium">Received</span>
            <span className="text-sm font-bold text-gray-900">{formatRelativeTime(lead.receivedAt)}</span>
          </div>
          {lead.region && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500 font-medium">Region</span>
              <span className="text-sm font-bold text-gray-900 capitalize">{lead.region}</span>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================
          QUALIFICATION FORM (conditional)
          ================================================================ */}
      {showQualifyForm && canQualify && (
        <div className="card border-amber-200 bg-amber-50/30">
          <div className="card-header border-amber-200">
            <h3 className="text-base font-semibold text-amber-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" />
              SDR Qualification
            </h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qualification Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
                placeholder="Add notes about this lead's qualification..."
                value={qualifyNotes}
                onChange={(e) => setQualifyNotes(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => qualifyMutation.mutate({ qualified: true })}
                disabled={qualifyMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {qualifyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ThumbsUp className="w-4 h-4" />
                )}
                Qualify
              </button>
              <button
                onClick={() => qualifyMutation.mutate({ qualified: false })}
                disabled={qualifyMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {qualifyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ThumbsDown className="w-4 h-4" />
                )}
                Disqualify
              </button>
              <button
                onClick={() => {
                  setShowQualifyForm(false);
                  setQualifyNotes('');
                }}
                className="px-4 py-2 text-gray-600 text-sm hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          CONVERSION SUCCESS
          ================================================================ */}
      {convertMutation.isSuccess && convertMutation.data && (
        <div className="card border-emerald-200 bg-emerald-50/30">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">Lead converted successfully!</p>
                <div className="flex items-center gap-3 mt-1">
                  <Link
                    href={`/accounts/${convertMutation.data.data.account.id}`}
                    className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                  >
                    View Account
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href={`/deals/${convertMutation.data.data.deal.id}`}
                    className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                  >
                    View Deal
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          MAIN 2-COLUMN LAYOUT
          ================================================================ */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* ============================================================
            LEFT COLUMN (2/3) — AI Summary, Auto-Response, Message, Score
            ============================================================ */}
        <div className="lg:col-span-2 space-y-6">
          {/* ---- AI Summary ---- */}
          {lead.aiSummary && (
            <div className="card border-indigo-200 bg-indigo-50/30">
              <div className="card-header border-indigo-200">
                <h3 className="text-base font-semibold text-indigo-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-500" />
                  AI Analysis
                </h3>
              </div>
              <div className="card-body">
                <p className="text-sm text-indigo-800 leading-relaxed">{lead.aiSummary}</p>
              </div>
            </div>
          )}

          {/* ---- Auto-Responses ---- */}
          {lead.autoResponses && lead.autoResponses.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-cyan-500" />
                  Auto-Responses
                  <span className="text-xs font-normal text-gray-400">
                    ({lead.autoResponses.length})
                  </span>
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {lead.autoResponses.map((ar) => (
                  <AutoResponseCard key={ar.id} response={ar} />
                ))}
              </div>
            </div>
          )}

          {/* ---- Original Inquiry Message ---- */}
          {lead.message && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Original Inquiry
                </h3>
              </div>
              <div className="card-body">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {lead.message}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Received {formatRelativeTime(lead.receivedAt)}
                  </span>
                  {lead.sourceDetail && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {lead.sourceDetail}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ---- AI Score Breakdown ---- */}
          {lead.aiScoreFactors && lead.aiScoreFactors.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-amber-500" />
                  AI Score Breakdown
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border', getAiScoreBg(aiScore))}>
                    {aiScore}/100 - {getAiScoreLabel(aiScore)}
                  </span>
                </h3>
              </div>
              <div className="card-body">
                {/* Score bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={cn(
                        'h-2.5 rounded-full transition-all',
                        aiScore >= 80 ? 'bg-emerald-500' : aiScore >= 60 ? 'bg-yellow-500' : aiScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      )}
                      style={{ width: `${aiScore}%` }}
                    />
                  </div>
                </div>

                {/* Score factors */}
                <ul className="space-y-2">
                  {lead.aiScoreFactors.map((factor, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <Zap className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            RIGHT COLUMN (1/3) — Contact Info, Company Intel, Timeline
            ============================================================ */}
        <div className="space-y-6">
          {/* ---- Contact Info ---- */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                Contact Info
              </h3>
            </div>
            <div className="card-body space-y-3">
              <ContactRow icon={Mail} label="Email" value={lead.email} href={`mailto:${lead.email}`} />
              {lead.phone && (
                <ContactRow icon={Phone} label="Phone" value={lead.phone} href={`tel:${lead.phone}`} />
              )}
              <ContactRow icon={Building2} label="Company" value={lead.company} />
              {lead.industry && (
                <ContactRow icon={Shield} label="Industry" value={lead.industry} />
              )}
              {lead.website && (
                <ContactRow icon={Globe} label="Website" value={lead.website} href={lead.website} external />
              )}
            </div>
          </div>

          {/* ---- Company Intel ---- */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                Company Intel
              </h3>
            </div>
            <div className="card-body space-y-3">
              {lead.employeeCount != null && lead.employeeCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Employees</span>
                  <span className="text-sm font-medium text-gray-900">
                    {lead.employeeCount.toLocaleString()}
                  </span>
                </div>
              )}
              {lead.industry && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Industry</span>
                  <span className="text-sm font-medium text-gray-900">{lead.industry}</span>
                </div>
              )}
              {lead.productInterest && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Product Interest</span>
                  <span className="text-sm font-medium text-gray-900">{lead.productInterest}</span>
                </div>
              )}
              {lead.region && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Region</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">{lead.region}</span>
                </div>
              )}
            </div>
          </div>

          {/* ---- Response Timeline ---- */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Timeline
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-0">
                <TimelineStep
                  icon={Inbox}
                  label="Received"
                  date={lead.receivedAt}
                  completed
                  isFirst
                />
                <TimelineStep
                  icon={Bot}
                  label="Auto-Responded"
                  date={lead.autoResponseAt}
                  completed={lead.autoResponseSent}
                  detail={
                    lead.responseTimeMs
                      ? `Response time: ${formatResponseTimeMs(lead.responseTimeMs)}`
                      : undefined
                  }
                />
                <TimelineStep
                  icon={Users}
                  label="SDR Assigned"
                  date={lead.assignedSdrId ? lead.receivedAt : undefined}
                  completed={!!lead.assignedSdrId}
                />
                <TimelineStep
                  icon={CheckCircle2}
                  label="Qualified"
                  date={lead.qualifiedAt}
                  completed={lead.status === 'qualified' || lead.status === 'converted'}
                />
                <TimelineStep
                  icon={TrendingUp}
                  label="Converted"
                  date={lead.convertedAt}
                  completed={lead.status === 'converted'}
                  isLast
                />
              </div>
            </div>
          </div>

          {/* ---- Converted Links ---- */}
          {lead.convertedAccountId && (
            <div className="card border-emerald-200 bg-emerald-50/30">
              <div className="card-header border-emerald-200">
                <h3 className="text-base font-semibold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Converted Records
                </h3>
              </div>
              <div className="card-body space-y-2">
                <Link
                  href={`/accounts/${lead.convertedAccountId}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-white border border-emerald-200 hover:border-emerald-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">View Account</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                </Link>
                {lead.convertedDealId && (
                  <Link
                    href={`/deals/${lead.convertedDealId}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-white border border-emerald-200 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-800">View Deal</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sub-Components
// ============================================================

/** Auto-response email card */
function AutoResponseCard({ response }: { response: AutoResponseData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-6 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Subject */}
          <div className="flex items-center gap-2 flex-wrap">
            <Send className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
            <span className="text-sm font-semibold text-gray-900">{response.subject}</span>
            <span className="text-xs text-gray-400 capitalize">{response.channel}</span>
          </div>

          {/* Tracking indicators */}
          <div className="flex items-center gap-3 mt-1.5">
            {response.sentAt && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Sent {formatRelativeTime(response.sentAt)}
              </span>
            )}
            <span
              className={cn(
                'text-xs flex items-center gap-1',
                response.opened ? 'text-emerald-600' : 'text-gray-400'
              )}
            >
              <MailOpen className="w-3 h-3" />
              {response.opened ? 'Opened' : 'Not opened'}
            </span>
            <span
              className={cn(
                'text-xs flex items-center gap-1',
                response.replied ? 'text-emerald-600' : 'text-gray-400'
              )}
            >
              <Reply className="w-3 h-3" />
              {response.replied ? 'Replied' : 'No reply'}
            </span>
            {response.confidence != null && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Brain className="w-3 h-3" />
                {(response.confidence * 100).toFixed(0)}% confidence
              </span>
            )}
          </div>

          {/* Expandable body */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary-600 hover:text-primary-800 mt-2"
          >
            {expanded ? 'Hide content' : 'Show content'}
          </button>
          {expanded && (
            <div className="mt-2 bg-gray-50 rounded-lg border border-gray-200 p-3">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {response.body}
              </p>
              {response.model && (
                <p className="text-[10px] text-gray-400 mt-2">
                  Generated by {response.model}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Contact information row */
function ContactRow({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-gray-400 uppercase font-medium">{label}</p>
        {href ? (
          <a
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="text-sm text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1 truncate"
          >
            {value}
            {external && <ExternalLink className="w-3 h-3 flex-shrink-0" />}
          </a>
        ) : (
          <p className="text-sm text-gray-900 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

/** Timeline step in the response timeline */
function TimelineStep({
  icon: Icon,
  label,
  date,
  completed,
  detail,
  isFirst,
  isLast,
}: {
  icon: typeof Inbox;
  label: string;
  date?: string;
  completed: boolean;
  detail?: string;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 relative">
      {/* Vertical line */}
      {!isLast && (
        <div
          className={cn(
            'absolute left-[13px] top-7 w-0.5 h-[calc(100%+4px)]',
            completed ? 'bg-emerald-300' : 'bg-gray-200'
          )}
        />
      )}

      {/* Icon circle */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10',
          completed ? 'bg-emerald-100' : 'bg-gray-100'
        )}
      >
        <Icon
          className={cn(
            'w-3.5 h-3.5',
            completed ? 'text-emerald-600' : 'text-gray-400'
          )}
        />
      </div>

      {/* Content */}
      <div className="pb-5 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            completed ? 'text-gray-900' : 'text-gray-400'
          )}
        >
          {label}
        </p>
        {date && (
          <p className="text-xs text-gray-400 mt-0.5">
            {formatRelativeTime(date)}
          </p>
        )}
        {detail && (
          <p className="text-xs text-emerald-600 mt-0.5">{detail}</p>
        )}
      </div>
    </div>
  );
}
