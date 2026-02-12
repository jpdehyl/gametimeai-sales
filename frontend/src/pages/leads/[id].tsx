// ============================================================
// Lead Detail Page — Full intelligence view (US-004)
// Shows: AI enrichment, interactions, score, recommended actions
// ============================================================

import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchLeadDetail, generateOutreach, rescoreLead, type LeadDetail, type OutreachResult } from '@/lib/api';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Zap,
  RefreshCw,
  Send,
  TrendingUp,
  Clock,
  Newspaper,
  Cpu,
  Users,
  DollarSign,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Copy,
} from 'lucide-react';
import { cn, getScoreBgColor, getStatusBadgeColor, formatRelativeTime, formatDuration, getSentimentLabel } from '@/lib/utils';

export default function LeadDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const [showOutreach, setShowOutreach] = useState(false);
  const [outreachResult, setOutreachResult] = useState<OutreachResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['lead', id],
    queryFn: () => fetchLeadDetail(id as string),
    enabled: !!id,
  });

  const scoreMutation = useMutation({
    mutationFn: () => rescoreLead(id as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
    },
  });

  const outreachMutation = useMutation({
    mutationFn: () =>
      generateOutreach({
        leadId: id as string,
        sequenceType: 'cold_intro',
        variants: 3,
        tone: 'professional_casual',
      }),
    onSuccess: (data) => {
      setOutreachResult(data.data);
      setShowOutreach(true);
    },
  });

  if (isLoading || !data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card card-body space-y-4">
            <div className="h-6 w-64 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
          </div>
          <div className="card card-body space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const lead = data.data as LeadDetail;

  const handleCopyEmail = (body: string, index: number) => {
    navigator.clipboard.writeText(body);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{lead.displayName}</h1>
              <span className={cn('score-badge text-base', getScoreBgColor(lead.aiScore))}>
                {lead.aiScore}
              </span>
              <span className={cn('status-badge', getStatusBadgeColor(lead.status))}>
                {lead.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {lead.title} at {lead.company}
              {lead.industry && ` · ${lead.industry}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => scoreMutation.mutate()}
            disabled={scoreMutation.isPending}
            className="btn-secondary"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', scoreMutation.isPending && 'animate-spin')} />
            Re-score
          </button>
          <button
            onClick={() => outreachMutation.mutate()}
            disabled={outreachMutation.isPending}
            className="btn-primary"
          >
            <Send className={cn('w-4 h-4 mr-2', outreachMutation.isPending && 'animate-spin')} />
            Generate Outreach
          </button>
        </div>
      </div>

      {/* AI Recommended Action */}
      {lead.recommendedAction && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg px-4 py-3 flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary-900">Recommended Next Action</p>
            <p className="text-sm text-primary-700">{lead.recommendedAction}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content — 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Intelligence */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Company Intelligence
              </h3>
            </div>
            <div className="card-body space-y-4">
              <p className="text-sm text-gray-700">{lead.companyIntel.summary || 'No company summary available yet.'}</p>

              <div className="grid sm:grid-cols-2 gap-4">
                {lead.companyIntel.employeeCount && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{lead.companyIntel.employeeCount.toLocaleString()} employees</span>
                  </div>
                )}
                {lead.companyIntel.estimatedRevenue && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{lead.companyIntel.estimatedRevenue}</span>
                  </div>
                )}
                {lead.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600 truncate">{lead.website}</span>
                  </div>
                )}
              </div>

              {/* Tech Stack */}
              {lead.companyIntel.techStack.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> Tech Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {lead.companyIntel.techStack.map((tech) => (
                      <span key={tech} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent News */}
              {lead.companyIntel.recentNews.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-2 flex items-center gap-1">
                    <Newspaper className="w-3 h-3" /> Recent News
                  </h4>
                  <ul className="space-y-2">
                    {lead.companyIntel.recentNews.map((news, i) => (
                      <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-gray-300 mt-1">&#8226;</span>
                        {news}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Buying Signals */}
          {lead.buyingSignals && (lead.buyingSignals as any[]).length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Buying Signals
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {(lead.buyingSignals as any[]).map((signal: any, i: number) => (
                  <div key={i} className="px-6 py-3 flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{signal.description}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {signal.source} &middot; {formatRelativeTime(signal.detectedAt)} &middot; Impact: +{signal.impactScore}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interaction History */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Interaction History ({lead.interactions.totalCalls} calls)
              </h3>
            </div>
            {lead.interactions.calls.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {lead.interactions.calls.map((call) => {
                  const sentiment = getSentimentLabel(call.sentimentScore);
                  return (
                    <Link
                      key={call.id}
                      href={`/calls/${call.id}`}
                      className="flex items-start gap-3 px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5',
                        call.outcome === 'connected' ? 'bg-green-100' : 'bg-gray-100'
                      )}>
                        <Phone className={cn(
                          'w-4 h-4',
                          call.outcome === 'connected' ? 'text-green-600' : 'text-gray-400'
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 capitalize">{call.outcome}</span>
                          <span className="text-xs text-gray-400">{formatDuration(call.duration)}</span>
                          <span className={cn('text-xs', sentiment.color)}>{sentiment.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{call.summary}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(call.date)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="card-body text-sm text-gray-500">
                No calls recorded yet. Use the prioritized call list to start outreach.
              </div>
            )}
          </div>

          {/* AI-Generated Outreach */}
          {showOutreach && outreachResult && (
            <div className="card">
              <div className="card-header flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  AI-Generated Outreach
                </h3>
                <button onClick={() => setShowOutreach(false)} className="text-gray-400 hover:text-gray-600">
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {outreachResult.variants.map((variant, i) => (
                  <div key={i} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900">
                        Variant {i + 1}: {variant.subject}
                      </p>
                      <button
                        onClick={() => handleCopyEmail(variant.body, i)}
                        className="btn-secondary text-xs"
                      >
                        {copiedIndex === i ? (
                          <><CheckCircle className="w-3 h-3 mr-1 text-green-500" /> Copied</>
                        ) : (
                          <><Copy className="w-3 h-3 mr-1" /> Copy</>
                        )}
                      </button>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line">
                      {variant.body}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {variant.personalizationPoints.map((point) => (
                        <span key={point} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — Score & Contact Info */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900">Contact Info</h3>
            </div>
            <div className="card-body space-y-3">
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <a href={`mailto:${lead.email}`} className="text-primary-600 hover:underline">{lead.email}</a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${lead.phone}`} className="text-primary-600 hover:underline">{lead.phone}</a>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{lead.company}</span>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  SF ID: {lead.salesforceId}
                </p>
                <p className="text-xs text-gray-400">
                  Last synced: {formatRelativeTime(lead.lastSyncedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                AI Score Breakdown
              </h3>
            </div>
            <div className="card-body space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Score</span>
                <span className={cn('text-2xl font-bold', getScoreBgColor(lead.aiScore).split(' ')[1])}>
                  {lead.aiScore}/100
                </span>
              </div>
              {/* Score bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    lead.aiScore >= 80 ? 'bg-green-500' :
                    lead.aiScore >= 60 ? 'bg-yellow-500' :
                    lead.aiScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  )}
                  style={{ width: `${lead.aiScore}%` }}
                />
              </div>
              {/* Factors */}
              <div className="space-y-2 pt-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Top Scoring Factors</p>
                {lead.scoreFactors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-primary-500 mt-0.5">&#x2022;</span>
                    {factor}
                  </div>
                ))}
              </div>
              {lead.lastScoredAt && (
                <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <Clock className="w-3 h-3 inline mr-1" />
                  Last scored: {formatRelativeTime(lead.lastScoredAt)}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="card-body space-y-2">
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="btn-primary w-full justify-center">
                  <Phone className="w-4 h-4 mr-2" /> Call Now
                </a>
              )}
              <a href={`mailto:${lead.email}`} className="btn-secondary w-full justify-center">
                <Mail className="w-4 h-4 mr-2" /> Send Email
              </a>
              <button
                onClick={() => outreachMutation.mutate()}
                disabled={outreachMutation.isPending}
                className="btn-secondary w-full justify-center"
              >
                <Send className={cn('w-4 h-4 mr-2', outreachMutation.isPending && 'animate-spin')} />
                {outreachMutation.isPending ? 'Generating...' : 'AI Outreach'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
