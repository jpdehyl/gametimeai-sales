// ============================================================
// Analytics Page — Phase 3 placeholder with AE revenue metrics
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  Gauge,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  const dashboard = data?.data;
  const pipeline = dashboard?.pipelineSummary;
  const quota = dashboard?.quotaAttainment;

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <p className="text-sm text-amber-800">
          <strong>Phase 3 Preview:</strong> Full analytics with revenue impact, deal velocity trends,
          win/loss analysis, and executive PDF report generation will be available after Phase 1 PoC
          data collection.
        </p>
      </div>

      {/* Quota tracking */}
      {quota && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Quota Tracking
            </h3>
          </div>
          <div className="card-body">
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Quota</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(quota.quota)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Closed Won</p>
                <p className="text-2xl font-bold text-green-700">{formatCurrency(quota.closedWon)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase mb-1">Attainment</p>
                <p className="text-2xl font-bold text-primary-700">{quota.percentAttained}%</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Progress to quota</span>
                <span className="text-xs font-medium text-gray-700">{quota.percentAttained}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={cn(
                    'h-3 rounded-full transition-all',
                    quota.percentAttained >= 100
                      ? 'bg-green-500'
                      : quota.percentAttained >= 75
                      ? 'bg-blue-500'
                      : quota.percentAttained >= 50
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(quota.percentAttained, 100)}%` }}
                />
              </div>
              {quota.gap > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  Gap to close: <span className="font-semibold text-gray-700">{formatCurrency(quota.gap)}</span>
                  {' '}&middot; Weighted pipeline: {formatCurrency(quota.pipelineWeighted)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pipeline health overview */}
      {pipeline && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Pipeline Health
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {pipeline.byStage
                .filter((s) => s.stage !== 'closed_won' && s.stage !== 'closed_lost')
                .map((stage) => (
                  <FunnelBar
                    key={stage.stage}
                    label={stage.label}
                    value={stage.value}
                    count={stage.count}
                    max={pipeline.totalValue}
                    color={getStageColor(stage.stage)}
                  />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Placeholder metric cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PlaceholderMetric
          icon={Gauge}
          label="Deal Velocity"
          value="--"
          note="Avg days from discovery to close"
        />
        <PlaceholderMetric
          icon={ArrowUpRight}
          label="Win Rate"
          value="--"
          note="Closed won vs total closed"
        />
        <PlaceholderMetric
          icon={DollarSign}
          label="Avg Deal Size"
          value={pipeline ? formatCurrency(pipeline.averageDealSize) : '--'}
          note="Average opportunity value"
        />
        <PlaceholderMetric
          icon={Clock}
          label="Avg Sales Cycle"
          value={pipeline ? `${pipeline.averageSalesCycle}d` : '--'}
          note="Discovery to close average"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card card-body text-center py-12">
          <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-gray-700">Revenue Impact Report</h4>
          <p className="text-xs text-gray-500 mt-1">
            AI-assisted deal analysis and revenue attribution will appear after 30 days of data collection
          </p>
        </div>
        <div className="card card-body text-center py-12">
          <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-gray-700">Pipeline Health Trends</h4>
          <p className="text-xs text-gray-500 mt-1">
            Stage conversion rates, pipeline velocity, and deal aging analysis
          </p>
        </div>
      </div>
    </div>
  );
}

function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    discovery: 'bg-sky-500',
    qualification: 'bg-blue-500',
    technical_evaluation: 'bg-indigo-500',
    proposal: 'bg-violet-500',
    negotiation: 'bg-purple-500',
  };
  return colors[stage] || 'bg-gray-400';
}

function FunnelBar({
  label,
  value,
  count,
  max,
  color,
}: {
  label: string;
  value: number;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">
          {label}{' '}
          <span className="text-xs text-gray-400">({count} deals)</span>
        </span>
        <span className="text-sm font-bold text-gray-900">{formatCurrency(value)}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div className={cn('h-3 rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PlaceholderMetric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="card card-body">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <div>
          <p className={cn('text-2xl font-bold', value === '--' ? 'text-gray-300' : 'text-gray-900')}>{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">{note}</p>
    </div>
  );
}
