// ============================================================
// Outreach Composer Page — AI email generation for deal stakeholders
// ============================================================

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchDeals,
  fetchDealDetail,
  generateOutreach,
  type OutreachResult,
  type DealSummary,
  type Stakeholder,
} from '@/lib/api';
import {
  Mail,
  Send,
  Sparkles,
  Copy,
  CheckCircle,
  Users,
  Target,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { cn, formatCurrency, getHealthScoreColor } from '@/lib/utils';

const SEQUENCE_TYPES = [
  { value: 'cold_intro', label: 'Cold Introduction' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 're_engagement', label: 'Re-engagement' },
  { value: 'event_triggered', label: 'Event Triggered' },
  { value: 'proposal_follow_up', label: 'Proposal Follow-Up' },
  { value: 'multi_thread', label: 'Multi-Thread Outreach' },
];

const TONES = [
  { value: 'professional_casual', label: 'Professional Casual' },
  { value: 'professional_formal', label: 'Professional Formal' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'direct', label: 'Direct' },
  { value: 'executive', label: 'Executive Briefing' },
];

export default function OutreachPage() {
  const [selectedDealId, setSelectedDealId] = useState('');
  const [selectedStakeholderId, setSelectedStakeholderId] = useState('');
  const [sequenceType, setSequenceType] = useState('follow_up');
  const [tone, setTone] = useState('professional_casual');
  const [variants, setVariants] = useState(3);
  const [result, setResult] = useState<OutreachResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Fetch all deals for the deal selector
  const { data: dealsData } = useQuery({
    queryKey: ['deals'],
    queryFn: () => fetchDeals(),
  });

  const deals = dealsData?.data || [];

  // Fetch deal detail to get stakeholders when a deal is selected
  const { data: dealDetailData } = useQuery({
    queryKey: ['deal', selectedDealId],
    queryFn: () => fetchDealDetail(selectedDealId),
    enabled: !!selectedDealId,
  });

  const dealDetail = dealDetailData?.data;
  const stakeholders = dealDetail?.stakeholders || [];

  // Find the selected stakeholder for the context sidebar
  const selectedStakeholder = useMemo(
    () => stakeholders.find((s) => s.id === selectedStakeholderId),
    [stakeholders, selectedStakeholderId]
  );

  // Reset stakeholder when deal changes
  const handleDealChange = (dealId: string) => {
    setSelectedDealId(dealId);
    setSelectedStakeholderId('');
    setResult(null);
  };

  const mutation = useMutation({
    mutationFn: () =>
      generateOutreach({
        dealId: selectedDealId,
        stakeholderId: selectedStakeholderId || undefined,
        sequenceType,
        variants,
        tone,
      }),
    onSuccess: (data) => setResult(data.data),
  });

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Configuration sidebar */}
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-500" />
                AI Outreach Generator
              </h3>
            </div>
            <div className="card-body space-y-4">
              {/* Deal selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Deal</label>
                <select
                  value={selectedDealId}
                  onChange={(e) => handleDealChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose a deal...</option>
                  {deals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.name} ({deal.accountName}) -- {formatCurrency(deal.amount)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stakeholder selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Stakeholder</label>
                <select
                  value={selectedStakeholderId}
                  onChange={(e) => setSelectedStakeholderId(e.target.value)}
                  disabled={!selectedDealId || stakeholders.length === 0}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-primary-500
                             disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">
                    {!selectedDealId
                      ? 'Select a deal first...'
                      : stakeholders.length === 0
                      ? 'No stakeholders on this deal'
                      : 'Choose a stakeholder...'}
                  </option>
                  {stakeholders.map((sh) => (
                    <option key={sh.id} value={sh.id}>
                      {sh.name} -- {sh.title} ({sh.role?.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sequence type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sequence Type</label>
                <select
                  value={sequenceType}
                  onChange={(e) => setSequenceType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {SEQUENCE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Tone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {TONES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Variants */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Variants</label>
                <select
                  value={variants}
                  onChange={(e) => setVariants(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value={1}>1 variant</option>
                  <option value={2}>2 variants</option>
                  <option value={3}>3 variants</option>
                </select>
              </div>

              <button
                onClick={() => mutation.mutate()}
                disabled={!selectedDealId || mutation.isPending}
                className="btn-primary w-full justify-center"
              >
                {mutation.isPending ? (
                  <><Send className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Outreach</>
                )}
              </button>
            </div>
          </div>

          {/* Stakeholder context sidebar */}
          {selectedStakeholder && (
            <StakeholderContextCard stakeholder={selectedStakeholder} />
          )}

          {/* Deal context card */}
          {selectedDealId && dealDetail && (
            <DealContextCard deal={dealDetail} />
          )}
        </div>

        {/* Generated emails */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">
                  Generated Variants ({result.variants.length})
                </h3>
                <span className="text-xs text-gray-500">
                  Context: {result.personalizationContext}
                </span>
              </div>

              {result.variants.map((variant, i) => (
                <div key={i} className="card">
                  <div className="card-header flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Variant {i + 1}</h4>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Subject: <span className="font-medium">{variant.subject}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(`Subject: ${variant.subject}\n\n${variant.body}`, i)}
                      className="btn-secondary text-xs"
                    >
                      {copiedIndex === i ? (
                        <><CheckCircle className="w-3 h-3 mr-1 text-green-500" /> Copied</>
                      ) : (
                        <><Copy className="w-3 h-3 mr-1" /> Copy</>
                      )}
                    </button>
                  </div>
                  <div className="card-body">
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                      {variant.body}
                    </div>
                    <div className="flex gap-2 mt-3">
                      {variant.personalizationPoints.map((point) => (
                        <span
                          key={point}
                          className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded font-medium"
                        >
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card card-body flex flex-col items-center justify-center py-16 text-center">
              <Mail className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">No outreach generated yet</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-md">
                Select a deal and stakeholder, then click &ldquo;Generate Outreach&rdquo; to create
                personalized email variants powered by AI with full deal context.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StakeholderContextCard({ stakeholder }: { stakeholder: Stakeholder }) {
  const sentimentColor =
    stakeholder.sentiment === 'positive'
      ? 'text-green-600'
      : stakeholder.sentiment === 'negative'
      ? 'text-red-600'
      : 'text-gray-600';

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary-500" />
          Stakeholder Context
        </h4>
      </div>
      <div className="card-body space-y-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{stakeholder.name}</p>
          <p className="text-xs text-gray-500">{stakeholder.title}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-400 uppercase">Role</p>
            <p className="text-xs font-medium text-gray-700">
              {stakeholder.role?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Sentiment</p>
            <p className={cn('text-xs font-medium capitalize', sentimentColor)}>
              {stakeholder.sentiment}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Influence</p>
            <p className="text-xs font-medium text-gray-700 capitalize">{stakeholder.influence}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase">Engagement</p>
            <p className="text-xs font-medium text-gray-700 capitalize">{stakeholder.engagementLevel}</p>
          </div>
        </div>

        {stakeholder.priorities && stakeholder.priorities.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" /> Priorities
            </p>
            <ul className="space-y-1">
              {stakeholder.priorities.map((p, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="text-primary-400 mt-0.5">&#x2022;</span> {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {stakeholder.concerns && stakeholder.concerns.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase mb-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Concerns
            </p>
            <ul className="space-y-1">
              {stakeholder.concerns.map((c, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                  <span className="text-orange-400 mt-0.5">&#x2022;</span> {c}
                </li>
              ))}
            </ul>
          </div>
        )}

        {stakeholder.background && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase mb-1">
              <MessageSquare className="w-3 h-3 inline mr-1" />
              Background
            </p>
            <p className="text-xs text-gray-600">{stakeholder.background}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DealContextCard({ deal }: { deal: any }) {
  const health = getHealthScoreColor(deal.healthScore || 0);
  const stageLabel = deal.stage
    ?.replace(/_/g, ' ')
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Target className="w-4 h-4 text-blue-500" />
          Deal Context
        </h4>
      </div>
      <div className="card-body space-y-2">
        <p className="text-sm font-semibold text-gray-900">{deal.name}</p>
        <p className="text-xs text-gray-500">{deal.accountName || deal.account?.name}</p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <p className="text-xs text-gray-400">Stage</p>
            <p className="text-xs font-medium text-gray-700">{stageLabel}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Amount</p>
            <p className="text-xs font-medium text-gray-700">{formatCurrency(deal.amount || 0)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Health</p>
            <p className={cn('text-xs font-medium', health.text)}>{deal.healthScore}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Stakeholders</p>
            <p className="text-xs font-medium text-gray-700">
              {deal.stakeholders?.length || deal.stakeholderCount || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
