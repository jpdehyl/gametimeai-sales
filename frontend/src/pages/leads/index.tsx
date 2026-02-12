// ============================================================
// Lead Inbox — Virtual Assistant / Automated Lead Response
// GameTime AI — Inbound lead management with AI-powered
// instant response, SDR qualification, and AE handoff.
// Handles ~100K leads/year (~270/day) with < 30s speed-to-lead.
// ============================================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchLeads, fetchLeadMetrics, type InboundLead, type LeadMetrics } from '@/lib/api';
import Link from 'next/link';
import {
  Search,
  Inbox,
  Zap,
  Clock,
  CheckCircle2,
  TrendingUp,
  Users,
  Globe,
  Mail,
  MessageSquare,
  Phone,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Bot,
  Target,
  Filter,
} from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';

// ============================================================
// Constants
// ============================================================

const STATUS_TABS = [
  { value: '', label: 'All', icon: Inbox },
  { value: 'new', label: 'New', icon: Zap },
  { value: 'auto_responded', label: 'Auto Responded', icon: Bot },
  { value: 'sdr_review', label: 'SDR Review', icon: Users },
  { value: 'qualified', label: 'Qualified', icon: CheckCircle2 },
  { value: 'converted', label: 'Converted', icon: TrendingUp },
  { value: 'disqualified', label: 'Disqualified', icon: Target },
] as const;

type SortField = 'receivedAt' | 'aiScore' | 'responseTimeMs' | 'company' | 'source';
type SortDir = 'asc' | 'desc';

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

function getSourceIcon(source: string) {
  switch (source) {
    case 'website':
      return Globe;
    case 'email':
      return Mail;
    case 'chat':
      return MessageSquare;
    case 'phone':
      return Phone;
    default:
      return Inbox;
  }
}

function getAiScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function getAiScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-100 text-emerald-800';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800';
  if (score >= 40) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

function formatResponseTime(ms: number | undefined): { label: string; color: string } {
  if (ms === undefined || ms === null) return { label: '--', color: 'text-gray-400' };
  const seconds = ms / 1000;
  if (seconds < 15) return { label: `${seconds.toFixed(1)}s`, color: 'text-emerald-600' };
  if (seconds < 60) return { label: `${seconds.toFixed(1)}s`, color: 'text-yellow-600' };
  return { label: `${seconds.toFixed(1)}s`, color: 'text-red-500' };
}

function formatAvgResponseTime(ms: number): string {
  if (!ms) return '--';
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = seconds / 60;
  return `${minutes.toFixed(1)}m`;
}

// ============================================================
// Main Component
// ============================================================

export default function LeadInboxPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('receivedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  // Fetch leads
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['leads', { status: statusFilter, search, source: sourceFilter, page }],
    queryFn: () =>
      fetchLeads({
        status: statusFilter || undefined,
        search: search || undefined,
        source: sourceFilter || undefined,
        page,
      }),
  });

  // Fetch metrics
  const { data: metricsData } = useQuery({
    queryKey: ['lead-metrics'],
    queryFn: fetchLeadMetrics,
  });

  const leads: InboundLead[] = leadsData?.data ?? [];
  const pagination = leadsData?.pagination;
  const metrics: LeadMetrics | null = metricsData?.data ?? null;

  // Sort leads locally
  const sortedLeads = useMemo(() => {
    if (!leads.length) return leads;
    return [...leads].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'receivedAt':
          cmp = new Date(a.receivedAt).getTime() - new Date(b.receivedAt).getTime();
          break;
        case 'aiScore':
          cmp = (a.aiScore ?? 0) - (b.aiScore ?? 0);
          break;
        case 'responseTimeMs':
          cmp = (a.responseTimeMs ?? Infinity) - (b.responseTimeMs ?? Infinity);
          break;
        case 'company':
          cmp = a.company.localeCompare(b.company);
          break;
        case 'source':
          cmp = a.source.localeCompare(b.source);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [leads, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'company' || field === 'source' ? 'asc' : 'desc');
    }
  }

  return (
    <div className="space-y-4">
      {/* ============================================================ */}
      {/* Hero Metrics Bar                                             */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard
          label="Today's Leads"
          value={metrics?.todayLeadCount ?? 0}
          icon={Inbox}
          iconColor="bg-blue-500"
        />
        <MetricCard
          label="Avg Response Time"
          value={formatAvgResponseTime(metrics?.avgResponseTimeMs ?? 0)}
          icon={Clock}
          iconColor="bg-emerald-500"
        />
        <MetricCard
          label="Auto-Response Rate"
          value={`${(metrics?.autoResponseRate ?? 0).toFixed(0)}%`}
          icon={Bot}
          iconColor="bg-cyan-500"
        />
        <MetricCard
          label="Qualification Rate"
          value={`${(metrics?.qualificationRate ?? 0).toFixed(0)}%`}
          icon={CheckCircle2}
          iconColor="bg-amber-500"
        />
        <MetricCard
          label="Conversion Rate"
          value={`${(metrics?.conversionRate ?? 0).toFixed(0)}%`}
          icon={TrendingUp}
          iconColor="bg-purple-500"
          className="hidden sm:flex lg:flex"
        />
      </div>

      {/* ============================================================ */}
      {/* Filter Bar — Status Tabs + Search + Source                   */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 flex-1">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.value;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search + Source filter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads..."
              className="w-44 sm:w-56 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Source filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white appearance-none
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={sourceFilter}
              onChange={(e) => {
                setSourceFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Sources</option>
              <option value="website">Website</option>
              <option value="email">Email</option>
              <option value="chat">Chat</option>
              <option value="phone">Phone</option>
              <option value="social">Social</option>
              <option value="referral">Referral</option>
              <option value="event">Event</option>
              <option value="partner">Partner</option>
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Loading Skeleton                                             */}
      {/* ============================================================ */}
      {leadsLoading && <TableSkeleton />}

      {/* ============================================================ */}
      {/* Lead Table                                                   */}
      {/* ============================================================ */}
      {!leadsLoading && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <SortableHeader
                    label="Contact"
                    field="company"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Source"
                    field="source"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="hidden md:table-cell"
                  />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Product Interest
                  </th>
                  <SortableHeader
                    label="AI Score"
                    field="aiScore"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="hidden md:table-cell"
                  />
                  <SortableHeader
                    label="Response Time"
                    field="responseTimeMs"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="hidden lg:table-cell"
                  />
                  <SortableHeader
                    label="Received"
                    field="receivedAt"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="hidden xl:table-cell"
                  />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden xl:table-cell">
                    Region
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Inbox className="w-8 h-8 text-gray-300" />
                        <p className="text-sm text-gray-500 font-medium">
                          No leads found
                        </p>
                        <p className="text-xs text-gray-400">
                          {search || statusFilter || sourceFilter
                            ? 'Try adjusting your search or filters.'
                            : 'Inbound leads will appear here as they come in.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedLeads.map((lead) => {
                    const statusBadge = getStatusBadge(lead.status);
                    const SourceIcon = getSourceIcon(lead.source);
                    const responseTime = formatResponseTime(lead.responseTimeMs);
                    const aiScore = lead.aiScore ?? 0;

                    return (
                      <tr
                        key={lead.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        {/* Status */}
                        <td className="px-4 py-4">
                          <span className={cn('status-badge text-xs', statusBadge.classes)}>
                            {statusBadge.label}
                          </span>
                        </td>

                        {/* Contact */}
                        <td className="px-4 py-4">
                          <Link href={`/leads/${lead.id}`} className="group/link">
                            <p className="text-sm font-semibold text-gray-900 group-hover/link:text-primary-600 transition-colors">
                              {lead.firstName} {lead.lastName}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {lead.company}
                              {lead.title && <span className="text-gray-400"> &middot; {lead.title}</span>}
                            </p>
                          </Link>
                        </td>

                        {/* Source */}
                        <td className="px-4 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-1.5">
                            <SourceIcon className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm text-gray-700 capitalize">{lead.source}</span>
                          </div>
                        </td>

                        {/* Product Interest */}
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className="text-sm text-gray-600">
                            {lead.productInterest || '--'}
                          </span>
                        </td>

                        {/* AI Score */}
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span
                            className={cn(
                              'inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold',
                              getAiScoreBg(aiScore)
                            )}
                          >
                            {aiScore}
                          </span>
                        </td>

                        {/* Response Time */}
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <span className={cn('text-sm font-medium', responseTime.color)}>
                            {responseTime.label}
                          </span>
                        </td>

                        {/* Received */}
                        <td className="px-4 py-4 hidden xl:table-cell">
                          <span className="text-xs text-gray-500">
                            {formatRelativeTime(lead.receivedAt)}
                          </span>
                        </td>

                        {/* Region */}
                        <td className="px-4 py-4 hidden xl:table-cell">
                          <span className="text-xs text-gray-500 capitalize">
                            {lead.region || '--'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.pageSize) + 1}
                {' '}-{' '}
                {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                {' '}of {pagination.total} leads
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                  disabled={page >= pagination.totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-Components
// ============================================================

/** Hero metric card */
function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor,
  className,
}: {
  label: string;
  value: string | number;
  icon: typeof Inbox;
  iconColor: string;
  className?: string;
}) {
  return (
    <div className={cn('card card-body flex items-center gap-3', className)}>
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', iconColor)}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
        <p className="text-xs text-gray-500 truncate">{label}</p>
      </div>
    </div>
  );
}

/** Sortable table header cell */
function SortableHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
  className?: string;
}) {
  const isActive = sortField === field;

  function SortIcon() {
    if (!isActive) return <ArrowUpDown className="w-3 h-3 text-gray-300" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-primary-500" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary-500" />
    );
  }

  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700',
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <SortIcon />
      </div>
    </th>
  );
}

/** Loading skeleton for the lead table */
function TableSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Status', 'Contact', 'Source', 'Product', 'AI Score', 'Response', 'Received', 'Region'].map(
                (h) => (
                  <th key={h} className="px-4 py-3 text-left">
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...Array(8)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-4"><div className="h-5 w-20 bg-gray-100 rounded-full" /></td>
                <td className="px-4 py-4">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                </td>
                <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                <td className="px-4 py-4"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                <td className="px-4 py-4"><div className="h-6 w-10 bg-gray-100 rounded-full" /></td>
                <td className="px-4 py-4"><div className="h-4 w-12 bg-gray-100 rounded" /></td>
                <td className="px-4 py-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                <td className="px-4 py-4"><div className="h-4 w-14 bg-gray-100 rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
