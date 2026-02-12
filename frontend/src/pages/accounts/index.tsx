// ============================================================
// Accounts List Page — Card grid of all accounts
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAccounts } from '@/lib/api';
import Link from 'next/link';
import {
  Building2,
  Search,
  Users,
  DollarSign,
  Activity,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatRelativeTime,
  getHealthScoreColor,
} from '@/lib/utils';

const TIER_OPTIONS = [
  { value: '', label: 'All Tiers' },
  { value: 'strategic', label: 'Strategic' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'mid_market', label: 'Mid-Market' },
  { value: 'emerging', label: 'Emerging' },
];

function getTierBadge(tier: string) {
  switch (tier) {
    case 'strategic':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'enterprise':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'mid_market':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'emerging':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
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

export default function AccountsPage() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: fetchAccounts,
  });

  const accounts = data?.data || [];

  const filtered = accounts.filter((account) => {
    const matchesSearch =
      !search ||
      account.name.toLowerCase().includes(search.toLowerCase()) ||
      account.industry?.toLowerCase().includes(search.toLowerCase());
    const matchesTier = !tierFilter || account.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Manage and monitor all customer accounts
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search accounts by name or industry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {TIER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Account cards grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card card-body animate-pulse space-y-3">
              <div className="h-5 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-28 bg-gray-100 rounded" />
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card card-body flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700">No accounts found</h3>
          <p className="text-sm text-gray-500 mt-1">
            {search || tierFilter
              ? 'Try adjusting your search or filter criteria.'
              : 'No accounts available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((account) => {
            const health = getHealthScoreColor(account.healthScore);
            return (
              <Link
                key={account.id}
                href={`/accounts/${account.id}`}
                className="card hover:shadow-md transition-shadow group"
              >
                <div className="card-body space-y-3">
                  {/* Header: name + tier */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 truncate">
                        {account.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">{account.industry}</p>
                    </div>
                    <span
                      className={cn(
                        'flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border',
                        getTierBadge(account.tier)
                      )}
                    >
                      {getTierLabel(account.tier)}
                    </span>
                  </div>

                  {/* Health score bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Health</span>
                        <span className={cn('text-xs font-semibold', health.text)}>
                          {account.healthScore}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={cn('h-1.5 rounded-full transition-all', health.fill)}
                          style={{ width: `${Math.min(account.healthScore, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Key metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {account.employeeCount?.toLocaleString() || '--'} employees
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {account.annualRevenue
                          ? formatCurrency(account.annualRevenue)
                          : '--'}{' '}
                        rev
                      </span>
                    </div>
                  </div>

                  {/* Pipeline + Closed Won */}
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">Pipeline</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(account.totalPipelineValue || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Closed Won</p>
                      <p className="text-sm font-semibold text-green-700">
                        {formatCurrency(account.totalClosedWon || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Tech stack tags */}
                  {account.techStack && account.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {account.techStack.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                        >
                          <Cpu className="w-3 h-3" />
                          {tech}
                        </span>
                      ))}
                      {account.techStack.length > 4 && (
                        <span className="text-xs text-gray-400">
                          +{account.techStack.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Last engagement + arrow */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-400">
                      {account.lastEngagementAt
                        ? `Last engaged ${formatRelativeTime(account.lastEngagementAt)}`
                        : 'No recent engagement'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
