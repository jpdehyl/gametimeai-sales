// ============================================================
// Account Detail Page — Full account intelligence view
// ============================================================

import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { fetchAccountDetail, fetchDeals, fetchCalls, type DealStage } from '@/lib/api';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Globe,
  Users,
  DollarSign,
  Cpu,
  MapPin,
  ExternalLink,
  Phone,
  Mail,
  Calendar,
  Activity,
  TrendingUp,
  ArrowRight,
  Newspaper,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatCurrencyFull,
  formatRelativeTime,
  getHealthScoreColor,
  getStageBadgeColor,
} from '@/lib/utils';

function getTierBadge(tier: string) {
  switch (tier) {
    case 'strategic':
      return 'bg-purple-100 text-purple-800';
    case 'enterprise':
      return 'bg-blue-100 text-blue-800';
    case 'mid_market':
      return 'bg-green-100 text-green-800';
    case 'emerging':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getTierLabel(tier: string) {
  switch (tier) {
    case 'strategic':
      return 'Strategic';
    case 'enterprise':
      return 'Enterprise';
    case 'mid_market':
      return 'Mid-Market';
    case 'emerging':
      return 'Emerging';
    default:
      return tier;
  }
}

function getSentimentBadge(sentiment: string) {
  switch (sentiment) {
    case 'positive':
      return 'bg-green-100 text-green-800';
    case 'neutral':
      return 'bg-gray-100 text-gray-700';
    case 'negative':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function getInfluenceBadge(influence: string) {
  switch (influence) {
    case 'high':
      return 'bg-purple-100 text-purple-800';
    case 'medium':
      return 'bg-blue-100 text-blue-800';
    case 'low':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function getEngagementBadge(level: string) {
  switch (level) {
    case 'high':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-orange-100 text-orange-800';
    case 'none':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    economic_buyer: 'Economic Buyer',
    champion: 'Champion',
    technical_evaluator: 'Technical Evaluator',
    end_user: 'End User',
    blocker: 'Blocker',
    coach: 'Coach',
    influencer: 'Influencer',
  };
  return labels[role] || role;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'call':
      return Phone;
    case 'email':
      return Mail;
    case 'meeting':
      return Calendar;
    case 'demo':
      return Activity;
    default:
      return Activity;
  }
}

export default function AccountDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data: accountData, isLoading: loadingAccount } = useQuery({
    queryKey: ['account', id],
    queryFn: () => fetchAccountDetail(id as string),
    enabled: !!id,
  });

  const { data: dealsData } = useQuery({
    queryKey: ['deals', { accountId: id }],
    queryFn: () => fetchDeals({ search: '' }),
    enabled: !!id,
  });

  const { data: callsData } = useQuery({
    queryKey: ['calls', { accountId: id }],
    queryFn: () => fetchCalls({ accountId: id as string, limit: 10 }),
    enabled: !!id,
  });

  if (loadingAccount || !accountData) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded" />
        <div className="card card-body space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  const account = accountData.data;
  const health = getHealthScoreColor(account.healthScore);
  const deals = dealsData?.data || [];
  const accountDeals = deals.filter(
    (d) => d.accountId === id || d.accountName === account.name
  );
  const calls = callsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/accounts" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <Building2 className="w-6 h-6 text-gray-400" />
            <h1 className="text-xl font-bold text-gray-900">{account.name}</h1>
            <span className={cn('status-badge', getTierBadge(account.tier))}>
              {getTierLabel(account.tier)}
            </span>
            <span className={cn('status-badge', health.bg, health.text)}>
              Health: {account.healthScore}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
            {account.industry && <span>{account.industry}</span>}
            {account.domain && (
              <a
                href={`https://${account.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
              >
                <Globe className="w-3.5 h-3.5" />
                {account.domain}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {account.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {account.address}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Financial overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card card-body">
          <p className="text-xs text-gray-500 uppercase">Annual Revenue</p>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-400" />
            {account.annualRevenue ? formatCurrency(account.annualRevenue) : '--'}
          </p>
        </div>
        <div className="card card-body">
          <p className="text-xs text-gray-500 uppercase">Employees</p>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            {account.employeeCount?.toLocaleString() || '--'}
          </p>
        </div>
        <div className="card card-body">
          <p className="text-xs text-gray-500 uppercase">Pipeline Value</p>
          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            {formatCurrency(account.totalPipelineValue || 0)}
          </p>
        </div>
        <div className="card card-body">
          <p className="text-xs text-gray-500 uppercase">Closed Won</p>
          <p className="text-lg font-bold text-green-700 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            {formatCurrency(account.totalClosedWon || 0)}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column: description, news, tech stack */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company description */}
          {account.companyDescription && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  About
                </h3>
              </div>
              <div className="card-body">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {account.companyDescription}
                </p>
              </div>
            </div>
          )}

          {/* Recent news */}
          {account.recentNews && account.recentNews.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Newspaper className="w-4 h-4" />
                  Recent News
                </h3>
              </div>
              <div className="card-body">
                <div className="space-y-3">
                  {account.recentNews.map((news, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 pb-3 last:pb-0 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <a
                          href={news.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          {news.title}
                          <ExternalLink className="w-3 h-3 inline ml-1" />
                        </a>
                        <p className="text-xs text-gray-500 mt-0.5">{news.summary}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelativeTime(news.publishedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stakeholders */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Stakeholders
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                      Role
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                      Influence
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                      Sentiment
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                      Engagement
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                      Last Contact
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(account as any).stakeholders &&
                  (account as any).stakeholders.length > 0 ? (
                    (account as any).stakeholders.map((sh: any) => (
                      <tr key={sh.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          {sh.dealIds && sh.dealIds.length > 0 ? (
                            <Link
                              href={`/deals/${sh.dealIds[0]}`}
                              className="group"
                            >
                              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600">
                                {sh.name}
                              </p>
                              <p className="text-xs text-gray-500">{sh.title}</p>
                            </Link>
                          ) : (
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {sh.name}
                              </p>
                              <p className="text-xs text-gray-500">{sh.title}</p>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-xs font-medium text-gray-700">
                            {getRoleLabel(sh.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span
                            className={cn(
                              'status-badge text-xs',
                              getInfluenceBadge(sh.influence)
                            )}
                          >
                            {sh.influence}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span
                            className={cn(
                              'status-badge text-xs',
                              getSentimentBadge(sh.sentiment)
                            )}
                          >
                            {sh.sentiment}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span
                            className={cn(
                              'status-badge text-xs',
                              getEngagementBadge(sh.engagementLevel)
                            )}
                          >
                            {sh.engagementLevel}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-400">
                          {sh.lastContactedAt
                            ? formatRelativeTime(sh.lastContactedAt)
                            : '--'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-6 text-center text-sm text-gray-500"
                      >
                        No stakeholders mapped yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deals section */}
          <div className="card">
            <div className="card-header flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Deals
              </h3>
            </div>
            <div className="divide-y divide-gray-100">
              {accountDeals.length > 0 ? (
                accountDeals.map((deal) => {
                  const dealHealth = getHealthScoreColor(deal.healthScore);
                  const stageLabel = deal.stage
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, (c) => c.toUpperCase());
                  return (
                    <Link
                      key={deal.id}
                      href={`/deals/${deal.id}`}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 truncate">
                          {deal.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={cn(
                              'status-badge text-xs',
                              getStageBadgeColor(deal.stage as DealStage)
                            )}
                          >
                            {stageLabel}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">
                          {formatCurrency(deal.amount)}
                        </p>
                        <span
                          className={cn(
                            'text-xs font-medium',
                            dealHealth.text
                          )}
                        >
                          Health: {deal.healthScore}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 flex-shrink-0" />
                    </Link>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  No active deals for this account.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar: tech stack, activity timeline */}
        <div className="space-y-6">
          {/* Tech stack */}
          {account.techStack && account.techStack.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Tech Stack
                </h3>
              </div>
              <div className="card-body">
                <div className="flex flex-wrap gap-2">
                  {account.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-medium"
                    >
                      <Cpu className="w-3 h-3" />
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Activity
              </h3>
            </div>
            <div className="card-body">
              {calls.length > 0 ? (
                <div className="space-y-4">
                  {calls.slice(0, 8).map((call) => {
                    const Icon = Phone;
                    return (
                      <div key={call.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <div className="w-px h-full bg-gray-200 mt-1" />
                        </div>
                        <div className="flex-1 pb-4 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Call: {call.dealName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {call.summary}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {formatRelativeTime(call.callDate)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recent activity recorded.</p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card card-body space-y-2">
            <p className="text-xs text-gray-500 uppercase font-medium">Quick Actions</p>
            <Link
              href={`/outreach`}
              className="btn-secondary w-full justify-center text-sm"
            >
              <Mail className="w-4 h-4 mr-2" />
              Draft Outreach
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
