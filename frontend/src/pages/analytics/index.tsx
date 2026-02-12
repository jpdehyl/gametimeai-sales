// ============================================================
// Analytics Page — Phase 3 placeholder with pipeline overview
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { fetchDashboard } from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  Users,
  Phone,
  Mail,
  Clock,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
  });

  const pipeline = data?.data?.pipelineSnapshot;

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
        <p className="text-sm text-amber-800">
          <strong>Phase 3 Preview:</strong> Full analytics with ROI metrics, before/after comparisons,
          and PDF report generation will be available after Phase 1 PoC data collection.
        </p>
      </div>

      {/* Pipeline funnel */}
      {pipeline && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Pipeline Overview
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <FunnelBar label="Total Leads" value={pipeline.totalLeads} max={pipeline.totalLeads} color="bg-blue-500" />
              <FunnelBar label="New" value={pipeline.newLeads} max={pipeline.totalLeads} color="bg-green-500" />
              <FunnelBar label="Contacted" value={pipeline.contacted} max={pipeline.totalLeads} color="bg-yellow-500" />
              <FunnelBar label="Engaged" value={pipeline.engaged} max={pipeline.totalLeads} color="bg-purple-500" />
              <FunnelBar label="Qualified" value={pipeline.qualified} max={pipeline.totalLeads} color="bg-indigo-500" />
            </div>
          </div>
        </div>
      )}

      {/* Placeholder metric cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PlaceholderMetric icon={Phone} label="Calls This Week" value="--" note="Tracking starts after PoC" />
        <PlaceholderMetric icon={Mail} label="Emails Sent" value="--" note="AI-assisted vs manual" />
        <PlaceholderMetric icon={Target} label="Meetings Booked" value="--" note="Conversion tracking" />
        <PlaceholderMetric icon={Clock} label="Avg Response Time" value="--" note="Time-to-first-call" />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card card-body text-center py-12">
          <TrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-gray-700">AI Impact Report</h4>
          <p className="text-xs text-gray-500 mt-1">
            Before/after comparison charts will appear after 30 days of data collection
          </p>
        </div>
        <div className="card card-body text-center py-12">
          <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-gray-700">Team Performance</h4>
          <p className="text-xs text-gray-500 mt-1">
            SDR activity leaderboard and coaching metrics (Manager view)
          </p>
        </div>
      </div>
    </div>
  );
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{value}</span>
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
          <p className="text-2xl font-bold text-gray-300">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">{note}</p>
    </div>
  );
}
