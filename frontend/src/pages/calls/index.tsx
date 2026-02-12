// ============================================================
// Calls List Page — AI-analyzed call recordings with deal context
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { fetchCalls } from '@/lib/api';
import Link from 'next/link';
import { Phone, ArrowRight } from 'lucide-react';
import { cn, formatDuration, formatRelativeTime, getSentimentLabel } from '@/lib/utils';

export default function CallsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['calls'],
    queryFn: () => fetchCalls({ limit: 50 }),
  });

  const calls = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">AI-analyzed call recordings with coaching insights</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Outcome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Duration</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Sentiment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Summary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 rounded" /></td>
                  <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 w-20 bg-gray-100 rounded" /></td>
                  <td className="px-6 py-4 hidden md:table-cell"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                  <td className="px-6 py-4 hidden lg:table-cell"><div className="h-4 w-24 bg-gray-100 rounded" /></td>
                  <td className="px-6 py-4 hidden lg:table-cell"><div className="h-4 w-48 bg-gray-100 rounded" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>
                  <td className="px-6 py-4"></td>
                </tr>
              ))
            ) : calls.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                  No calls recorded yet.
                </td>
              </tr>
            ) : (
              calls.map((call) => {
                const sentimentLabel = call.sentiment
                  ? { label: call.sentiment.charAt(0).toUpperCase() + call.sentiment.slice(1), color: call.sentiment === 'positive' ? 'text-green-600' : call.sentiment === 'negative' ? 'text-red-500' : 'text-gray-500' }
                  : { label: '--', color: 'text-gray-400' };
                return (
                  <tr key={call.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/deals/${call.dealId}`} className="group">
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600">
                          {call.dealName}
                        </p>
                        <p className="text-xs text-gray-500">{call.accountName}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={cn(
                        'status-badge',
                        call.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                        call.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      )}>
                        {call.direction}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-sm text-gray-600">
                      {formatDuration(call.duration)}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className={cn('text-sm', sentimentLabel.color)}>{sentimentLabel.label}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <p className="text-sm text-gray-600 max-w-xs truncate">{call.summary}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {formatRelativeTime(call.callDate)}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/calls/${call.id}`} className="text-gray-400 hover:text-primary-600">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
