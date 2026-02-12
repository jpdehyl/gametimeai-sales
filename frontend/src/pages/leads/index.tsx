// ============================================================
// Lead List Page — Prioritized, filterable lead table
// ============================================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLeads } from '@/lib/api';
import Link from 'next/link';
import {
  Search,
  Filter,
  RefreshCw,
  Zap,
  ArrowUpDown,
} from 'lucide-react';
import { cn, getScoreBgColor, getStatusBadgeColor, formatRelativeTime } from '@/lib/utils';

const STATUS_FILTERS = [
  { value: '', label: 'All Status' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'engaged', label: 'Engaged' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'nurture', label: 'Nurture' },
];

export default function LeadsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['leads', { search, status, page }],
    queryFn: () => fetchLeads({ search, status: status || undefined, page, pageSize: 20 }),
  });

  const leads = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads by name, company, or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            className="btn-secondary"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leads table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Score <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Signals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Recommended Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-6 w-10 bg-gray-200 rounded-full" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                    <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4 hidden lg:table-cell"><div className="h-5 w-16 bg-gray-100 rounded-full" /></td>
                    <td className="px-6 py-4 hidden lg:table-cell"><div className="h-4 w-8 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4 hidden xl:table-cell"><div className="h-4 w-40 bg-gray-100 rounded" /></td>
                    <td className="px-6 py-4 hidden xl:table-cell"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    No leads found matching your filters.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={cn('score-badge', getScoreBgColor(lead.aiScore))}>
                        {lead.aiScore}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/leads/${lead.id}`} className="group">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600">
                          {lead.displayName}
                        </p>
                        <p className="text-xs text-gray-500">{lead.title}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-700">{lead.company}</p>
                      {lead.industry && (
                        <p className="text-xs text-gray-400">{lead.industry}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className={cn('status-badge', getStatusBadgeColor(lead.status))}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {(lead.buyingSignals as number) > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <Zap className="w-3 h-3" />
                          {lead.buyingSignals as number}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden xl:table-cell">
                      <p className="text-xs text-primary-600 max-w-[200px] truncate">
                        {lead.recommendedAction || '—'}
                      </p>
                    </td>
                    <td className="px-6 py-4 hidden xl:table-cell">
                      <span className="text-xs text-gray-400">
                        {lead.lastActivity ? formatRelativeTime(lead.lastActivity) : 'No activity'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.pageSize + 1}-
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                className="btn-secondary text-xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn-secondary text-xs"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
