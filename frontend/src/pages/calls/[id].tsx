// ============================================================
// Call Review Page — Post-call analysis view (US-005)
// Shows: transcript key moments, AI summary, action items, coaching tips
// ============================================================

import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { fetchCallDetail, type CallDetail } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Shield,
  Lightbulb,
  BarChart3,
  User,
} from 'lucide-react';
import { cn, formatDuration, formatRelativeTime, getSentimentLabel } from '@/lib/utils';

function getKeyMomentIcon(type: string) {
  switch (type) {
    case 'buying_signal': return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' };
    case 'objection': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' };
    case 'competitor_mention': return { icon: Shield, color: 'text-orange-600', bg: 'bg-orange-100' };
    case 'pain_point': return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' };
    case 'next_steps': return { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' };
    case 'pricing_discussion': return { icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-100' };
    default: return { icon: MessageSquare, color: 'text-gray-600', bg: 'bg-gray-100' };
  }
}

export default function CallDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data, isLoading } = useQuery({
    queryKey: ['call', id],
    queryFn: () => fetchCallDetail(id as string),
    enabled: !!id,
  });

  if (isLoading || !data) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="card card-body space-y-4">
          <div className="h-6 w-64 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  const call = data.data;
  const sentiment = getSentimentLabel(call.sentimentScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/calls" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              Call with {call.lead?.displayName || 'Unknown'}
            </h1>
            <span className={cn(
              'status-badge',
              call.outcome === 'connected' ? 'bg-green-100 text-green-800' :
              call.outcome === 'voicemail' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            )}>
              {call.outcome}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {call.lead?.title} at {call.lead?.company} &middot; {formatRelativeTime(call.callDate)}
          </p>
        </div>
      </div>

      {/* Call metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card card-body">
          <p className="text-xs text-gray-500 uppercase">Duration</p>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            {formatDuration(call.duration)}
          </p>
        </div>
        <div className="card card-body">
          <p className="text-xs text-gray-500 uppercase">Sentiment</p>
          <p className={cn('text-lg font-bold flex items-center gap-2', sentiment.color)}>
            <TrendingUp className="w-4 h-4" />
            {sentiment.label}
          </p>
        </div>
        <div className="card card-body">
          <p className="text-xs text-gray-500 uppercase">Talk Ratio (SDR)</p>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400" />
            {Math.round(call.talkRatio * 100)}%
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div
              className={cn(
                'h-1.5 rounded-full',
                call.talkRatio <= 0.4 ? 'bg-green-500' : call.talkRatio <= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${call.talkRatio * 100}%` }}
            />
          </div>
        </div>
        <div className="card card-body">
          <p className="text-xs text-gray-500 uppercase">Direction</p>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            {call.direction}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main: Summary + Key Moments */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Summary */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                AI Summary
              </h3>
            </div>
            <div className="card-body">
              <p className="text-sm text-gray-700 leading-relaxed">{call.summary}</p>
            </div>
          </div>

          {/* Key Moments Timeline */}
          {call.keyMoments.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-base font-semibold text-gray-900">Key Moments</h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {call.keyMoments.map((moment, i) => {
                    const { icon: Icon, color, bg } = getKeyMomentIcon(moment.type);
                    const momentSentiment = getSentimentLabel(moment.sentiment);
                    return (
                      <div key={i} className="flex gap-4">
                        {/* Timeline */}
                        <div className="flex flex-col items-center">
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', bg)}>
                            <Icon className={cn('w-4 h-4', color)} />
                          </div>
                          {i < call.keyMoments.length - 1 && (
                            <div className="w-px h-full bg-gray-200 mt-2" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {moment.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-400">
                              at {Math.floor(moment.timestamp / 60)}:{(moment.timestamp % 60).toString().padStart(2, '0')}
                            </span>
                            <span className={cn('text-xs', momentSentiment.color)}>
                              {momentSentiment.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{moment.description}</p>
                          {moment.transcript && (
                            <blockquote className="mt-2 pl-3 border-l-2 border-gray-200 text-sm text-gray-500 italic">
                              &ldquo;{moment.transcript}&rdquo;
                            </blockquote>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Competitors Mentioned */}
          {call.competitorsMentioned.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Competitors Mentioned
                </h3>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap gap-2">
                  {call.competitorsMentioned.map((comp) => (
                    <span key={comp} className="px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-200">
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Action Items + Coaching */}
        <div className="space-y-6">
          {/* Action Items */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Action Items
              </h3>
            </div>
            <div className="card-body">
              {call.actionItems.length > 0 ? (
                <ul className="space-y-3">
                  {call.actionItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No action items extracted.</p>
              )}
            </div>
          </div>

          {/* Coaching Tips */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                Coaching Tips
              </h3>
            </div>
            <div className="card-body">
              {call.coachingTips.length > 0 ? (
                <ul className="space-y-3">
                  {call.coachingTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No coaching tips available.</p>
              )}
            </div>
          </div>

          {/* Salesforce Sync Status */}
          <div className="card card-body">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Salesforce Task</span>
              {call.salesforceTaskId ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Synced
                </span>
              ) : (
                <button className="btn-secondary text-xs">
                  Push to Salesforce
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
