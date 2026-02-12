// ============================================================
// Pipeline / Deals Page — Kanban + Table view for AE pipeline
// GameTime AI — Deal Intelligence Platform
// ============================================================

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDeals, DEAL_STAGES, type DealSummary, type DealStage } from '@/lib/api';
import Link from 'next/link';
import {
  LayoutGrid,
  List,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  Users,
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  cn,
  formatCurrency,
  formatRelativeTime,
  getHealthScoreColor,
  getStageBadgeColor,
} from '@/lib/utils';

// ============================================================
// Constants
// ============================================================

/** Active pipeline stages shown in the Kanban board (excludes closed) */
const ACTIVE_STAGES = DEAL_STAGES.filter(
  (s) => s.key !== 'closed_won' && s.key !== 'closed_lost'
);

const STAGE_FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Stages' },
  ...DEAL_STAGES.map((s) => ({ value: s.key, label: s.label })),
];

type ViewMode = 'kanban' | 'table';

type SortField =
  | 'name'
  | 'accountName'
  | 'amount'
  | 'stage'
  | 'healthScore'
  | 'winProbability'
  | 'closeDate'
  | 'daysInCurrentStage'
  | 'forecastCategory'
  | 'lastActivityAt';

type SortDir = 'asc' | 'desc';

// ============================================================
// Helpers
// ============================================================

function isCloseWithin7Days(closeDate: string): boolean {
  const close = new Date(closeDate);
  const now = new Date();
  const diffMs = close.getTime() - now.getTime();
  return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
}

function isOverdue(closeDate: string): boolean {
  return new Date(closeDate).getTime() < new Date().getTime();
}

function formatCloseDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `${diffDays}d left`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getForecastBadge(category: string): { label: string; classes: string } {
  switch (category) {
    case 'commit':
      return { label: 'Commit', classes: 'bg-emerald-100 text-emerald-800' };
    case 'best_case':
      return { label: 'Best Case', classes: 'bg-blue-100 text-blue-800' };
    case 'pipeline':
      return { label: 'Pipeline', classes: 'bg-gray-100 text-gray-700' };
    case 'omitted':
      return { label: 'Omitted', classes: 'bg-red-50 text-red-600' };
    default:
      return { label: category, classes: 'bg-gray-100 text-gray-600' };
  }
}

function getStageLabelByKey(stageKey: string): string {
  return DEAL_STAGES.find((s) => s.key === stageKey)?.label ?? stageKey;
}

// ============================================================
// Main Component
// ============================================================

export default function DealsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('amount');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['deals', { search, stage: stageFilter }],
    queryFn: () =>
      fetchDeals({
        search: search || undefined,
        stage: (stageFilter as DealStage) || undefined,
      }),
  });

  const deals: DealSummary[] = data?.data ?? [];

  // Compute summary from local data
  const summary = useMemo(() => {
    const totalValue = deals.reduce((sum, d) => sum + d.amount, 0);
    const totalDeals = deals.length;
    const weightedValue = deals.reduce(
      (sum, d) => sum + d.amount * (d.winProbability / 100),
      0
    );
    const byStage = ACTIVE_STAGES.map((stage) => {
      const stageDeals = deals.filter((d) => d.stage === stage.key);
      return {
        stage: stage.key,
        label: stage.label,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + d.amount, 0),
      };
    });
    return { totalValue, totalDeals, weightedValue, byStage };
  }, [deals]);

  // Sorted deals for the table view
  const sortedDeals = useMemo(() => {
    if (!deals.length) return deals;
    return [...deals].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'accountName':
          cmp = a.accountName.localeCompare(b.accountName);
          break;
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'stage': {
          const aOrder = DEAL_STAGES.find((s) => s.key === a.stage)?.order ?? 0;
          const bOrder = DEAL_STAGES.find((s) => s.key === b.stage)?.order ?? 0;
          cmp = aOrder - bOrder;
          break;
        }
        case 'healthScore':
          cmp = a.healthScore - b.healthScore;
          break;
        case 'winProbability':
          cmp = a.winProbability - b.winProbability;
          break;
        case 'closeDate':
          cmp = new Date(a.closeDate).getTime() - new Date(b.closeDate).getTime();
          break;
        case 'daysInCurrentStage':
          cmp = a.daysInCurrentStage - b.daysInCurrentStage;
          break;
        case 'forecastCategory':
          cmp = a.forecastCategory.localeCompare(b.forecastCategory);
          break;
        case 'lastActivityAt':
          cmp =
            new Date(a.lastActivityAt).getTime() -
            new Date(b.lastActivityAt).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [deals, sortField, sortDir]);

  // Deals grouped by stage for Kanban
  const dealsByStage = useMemo(() => {
    const map: Record<string, DealSummary[]> = {};
    for (const stage of ACTIVE_STAGES) {
      map[stage.key] = deals.filter((d) => d.stage === stage.key);
    }
    return map;
  }, [deals]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'name' || field === 'accountName' ? 'asc' : 'desc');
    }
  }

  return (
    <div className="space-y-4">
      {/* ============================================================ */}
      {/* Top Bar — Pipeline summary + controls                       */}
      {/* ============================================================ */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Pipeline metrics */}
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(summary.totalValue)}
              </p>
              <p className="text-xs text-gray-500">
                {summary.totalDeals} deal{summary.totalDeals !== 1 ? 's' : ''} in pipeline
              </p>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-gray-200" />

          <div className="hidden sm:flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(summary.weightedValue)}
              </p>
              <p className="text-xs text-gray-500">Weighted pipeline</p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
                viewMode === 'kanban'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300',
                viewMode === 'table'
                  ? 'bg-primary-600 text-white border-l-primary-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search deals..."
              className="w-44 sm:w-56 pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Stage filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white appearance-none
                         focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              {STAGE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Loading state                                                */}
      {/* ============================================================ */}
      {isLoading && (
        <div className="space-y-4">
          {viewMode === 'kanban' ? <KanbanSkeleton /> : <TableSkeleton />}
        </div>
      )}

      {/* ============================================================ */}
      {/* Kanban View                                                  */}
      {/* ============================================================ */}
      {!isLoading && viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
          {ACTIVE_STAGES.map((stage) => {
            const stageDeals = dealsByStage[stage.key] ?? [];
            const stageValue = stageDeals.reduce((sum, d) => sum + d.amount, 0);

            return (
              <div
                key={stage.key}
                className="flex-shrink-0 w-72 flex flex-col"
              >
                {/* Column header */}
                <div className="rounded-t-lg px-3 py-2.5 border border-b-0 border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {stage.label}
                    </h3>
                    <span className="ml-auto flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-xs font-medium text-gray-700">
                      {stageDeals.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 font-medium">
                    {formatCurrency(stageValue)}
                  </p>
                </div>

                {/* Deal cards container */}
                <div className="flex-1 border border-gray-200 rounded-b-lg bg-gray-50/50 p-2 space-y-2 min-h-[200px]">
                  {stageDeals.length === 0 ? (
                    <div className="flex items-center justify-center h-24 text-xs text-gray-400">
                      No deals
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <DealCard key={deal.id} deal={deal} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* Table View                                                   */}
      {/* ============================================================ */}
      {!isLoading && viewMode === 'table' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <SortableHeader
                    label="Deal Name"
                    field="name"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Account"
                    field="accountName"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="hidden md:table-cell"
                  />
                  <SortableHeader
                    label="Amount"
                    field="amount"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Stage"
                    field="stage"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="hidden lg:table-cell"
                  />
                  <SortableHeader
                    label="Health"
                    field="healthScore"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="hidden md:table-cell"
                  />
                  <SortableHeader
                    label="Win %"
                    field="winProbability"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="hidden lg:table-cell"
                  />
                  <SortableHeader
                    label="Close Date"
                    field="closeDate"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="hidden xl:table-cell"
                  />
                  <SortableHeader
                    label="Days in Stage"
                    field="daysInCurrentStage"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="hidden xl:table-cell"
                  />
                  <SortableHeader
                    label="Forecast"
                    field="forecastCategory"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="hidden xl:table-cell"
                  />
                  <SortableHeader
                    label="Last Activity"
                    field="lastActivityAt"
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={handleSort}
                    className="hidden 2xl:table-cell"
                  />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedDeals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="w-8 h-8 text-gray-300" />
                        <p className="text-sm text-gray-500 font-medium">
                          No deals found
                        </p>
                        <p className="text-xs text-gray-400">
                          {search || stageFilter
                            ? 'Try adjusting your search or filters.'
                            : 'Deals will appear here once created.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedDeals.map((deal) => {
                    const health = getHealthScoreColor(deal.healthScore);
                    const closeSoon = isCloseWithin7Days(deal.closeDate);
                    const overdue = isOverdue(deal.closeDate);
                    const forecast = getForecastBadge(deal.forecastCategory);

                    return (
                      <tr key={deal.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-6 py-4">
                          <Link href={`/deals/${deal.id}`} className="group/link">
                            <p className="text-sm font-semibold text-gray-900 group-hover/link:text-primary-600 transition-colors">
                              {deal.name}
                            </p>
                          </Link>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <p className="text-sm text-gray-700">{deal.accountName}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(deal.amount)}
                          </p>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span
                            className={cn(
                              'status-badge',
                              getStageBadgeColor(deal.stage as DealStage)
                            )}
                          >
                            {getStageLabelByKey(deal.stage)}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2">
                            <HealthCircle score={deal.healthScore} size="sm" />
                            <span className={cn('text-sm font-medium', health.text)}>
                              {deal.healthScore}
                            </span>
                            {deal.healthTrend === 'improving' && (
                              <TrendingUp className="w-3 h-3 text-emerald-500" />
                            )}
                            {deal.healthTrend === 'declining' && (
                              <TrendingDown className="w-3 h-3 text-red-500" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden lg:table-cell">
                          <span className="text-sm text-gray-700">
                            {deal.winProbability}%
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden xl:table-cell">
                          <span
                            className={cn(
                              'text-sm',
                              closeSoon || overdue
                                ? 'text-red-600 font-medium'
                                : 'text-gray-700'
                            )}
                          >
                            {formatCloseDate(deal.closeDate)}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden xl:table-cell">
                          <span className="text-sm text-gray-600">
                            {deal.daysInCurrentStage}d
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden xl:table-cell">
                          <span
                            className={cn(
                              'status-badge',
                              forecast.classes
                            )}
                          >
                            {forecast.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden 2xl:table-cell">
                          <span className="text-xs text-gray-400">
                            {deal.lastActivityAt
                              ? formatRelativeTime(deal.lastActivityAt)
                              : 'No activity'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

/** Individual deal card for the Kanban board */
function DealCard({ deal }: { deal: DealSummary }) {
  const health = getHealthScoreColor(deal.healthScore);
  const closeSoon = isCloseWithin7Days(deal.closeDate);
  const overdue = isOverdue(deal.closeDate);
  const isAtRisk = deal.healthScore < 60;

  return (
    <Link
      href={`/deals/${deal.id}`}
      className="block bg-white rounded-lg border border-gray-200 p-3 shadow-sm
                 hover:shadow-md hover:border-gray-300 transition-all group"
    >
      {/* Risk banner */}
      {isAtRisk && (
        <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded bg-red-50 border border-red-100">
          <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
          <span className="text-[11px] font-medium text-red-700">At Risk</span>
        </div>
      )}

      {/* Deal name */}
      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
        {deal.name}
      </p>

      {/* Account name */}
      <p className="text-xs text-gray-500 mt-0.5 truncate">{deal.accountName}</p>

      {/* Amount */}
      <p className="text-sm font-bold text-gray-900 mt-2">
        {formatCurrency(deal.amount)}
      </p>

      {/* Health + Win % row */}
      <div className="flex items-center gap-3 mt-2">
        <div className="flex items-center gap-1.5">
          <HealthCircle score={deal.healthScore} size="sm" />
          <span className={cn('text-xs font-medium', health.text)}>
            {deal.healthScore}
          </span>
          {deal.healthTrend === 'improving' && (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          )}
          {deal.healthTrend === 'declining' && (
            <TrendingDown className="w-3 h-3 text-red-500" />
          )}
        </div>

        <div className="h-3 w-px bg-gray-200" />

        <span className="text-xs text-gray-600 font-medium">
          {deal.winProbability}% win
        </span>
      </div>

      {/* Bottom row: close date, days in stage, stakeholders */}
      <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-gray-100">
        {/* Close date */}
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span
            className={cn(
              'text-[11px]',
              closeSoon || overdue
                ? 'text-red-600 font-semibold'
                : 'text-gray-500'
            )}
          >
            {formatCloseDate(deal.closeDate)}
          </span>
        </div>

        {/* Days in stage */}
        <span className="text-[11px] text-gray-400">
          {deal.daysInCurrentStage}d in stage
        </span>

        {/* Stakeholder count */}
        <div className="flex items-center gap-0.5 ml-auto">
          <Users className="w-3 h-3 text-gray-400" />
          <span className="text-[11px] text-gray-500">{deal.stakeholderCount}</span>
        </div>
      </div>
    </Link>
  );
}

/** Colored health score circle indicator */
function HealthCircle({
  score,
  size = 'sm',
}: {
  score: number;
  size?: 'sm' | 'md';
}) {
  const health = getHealthScoreColor(score);
  const px = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div
      className={cn(
        'rounded-full flex-shrink-0',
        px,
        health.fill
      )}
      title={`Health: ${score} - ${health.label}`}
    />
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
        'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700',
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

// ============================================================
// Skeletons
// ============================================================

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 animate-pulse">
      {ACTIVE_STAGES.map((stage) => (
        <div key={stage.key} className="flex-shrink-0 w-72">
          <div className="rounded-t-lg px-3 py-2.5 border border-b-0 border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="ml-auto w-5 h-5 rounded-full bg-gray-200" />
            </div>
            <div className="h-3 w-12 bg-gray-200 rounded mt-1" />
          </div>
          <div className="border border-gray-200 rounded-b-lg bg-gray-50/50 p-2 space-y-2 min-h-[200px]">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-3">
                <div className="h-4 w-36 bg-gray-200 rounded mb-1" />
                <div className="h-3 w-24 bg-gray-100 rounded mb-2" />
                <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
                <div className="flex gap-2 mt-2">
                  <div className="h-3 w-3 rounded-full bg-gray-200" />
                  <div className="h-3 w-8 bg-gray-100 rounded" />
                  <div className="h-3 w-12 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Deal Name', 'Account', 'Amount', 'Stage', 'Health', 'Win %', 'Close Date', 'Days', 'Forecast', 'Activity'].map(
                (h) => (
                  <th key={h} className="px-6 py-3 text-left">
                    <div className="h-3 w-16 bg-gray-200 rounded" />
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...Array(6)].map((_, i) => (
              <tr key={i}>
                <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 rounded" /></td>
                <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-100 rounded-full" /></td>
                <td className="px-6 py-4"><div className="h-4 w-10 bg-gray-100 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-10 bg-gray-100 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-8 bg-gray-100 rounded" /></td>
                <td className="px-6 py-4"><div className="h-5 w-16 bg-gray-100 rounded-full" /></td>
                <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
