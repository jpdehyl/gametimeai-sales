// ============================================================
// Outreach Composer Page — AI email generation (US-003)
// ============================================================

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchLeads, generateOutreach, type OutreachResult, type LeadSummary } from '@/lib/api';
import {
  Mail,
  Send,
  Sparkles,
  Copy,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';
import { cn, getScoreBgColor } from '@/lib/utils';

const SEQUENCE_TYPES = [
  { value: 'cold_intro', label: 'Cold Introduction' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 're_engagement', label: 'Re-engagement' },
  { value: 'event_triggered', label: 'Event Triggered' },
];

const TONES = [
  { value: 'professional_casual', label: 'Professional Casual' },
  { value: 'professional_formal', label: 'Professional Formal' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'direct', label: 'Direct' },
];

export default function OutreachPage() {
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [sequenceType, setSequenceType] = useState('cold_intro');
  const [tone, setTone] = useState('professional_casual');
  const [variants, setVariants] = useState(3);
  const [result, setResult] = useState<OutreachResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const { data: leadsData } = useQuery({
    queryKey: ['leads', { page: 1, pageSize: 50 }],
    queryFn: () => fetchLeads({ pageSize: 50 }),
  });

  const leads = leadsData?.data || [];

  const mutation = useMutation({
    mutationFn: () =>
      generateOutreach({
        leadId: selectedLeadId,
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
              {/* Lead selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Lead</label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => setSelectedLeadId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Choose a lead...</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.displayName} ({lead.company}) — Score: {lead.aiScore}
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
                disabled={!selectedLeadId || mutation.isPending}
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

          {/* Selected lead context */}
          {selectedLeadId && (
            <SelectedLeadCard lead={leads.find((l) => l.id === selectedLeadId)} />
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
                Select a lead and click &ldquo;Generate Outreach&rdquo; to create personalized email
                variants powered by AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SelectedLeadCard({ lead }: { lead?: LeadSummary }) {
  if (!lead) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="text-sm font-medium text-gray-500">Selected Lead</h4>
      </div>
      <div className="card-body space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900">{lead.displayName}</p>
          <span className={cn('score-badge text-xs', getScoreBgColor(lead.aiScore))}>
            {lead.aiScore}
          </span>
        </div>
        <p className="text-xs text-gray-500">{lead.title} at {lead.company}</p>
        {lead.industry && <p className="text-xs text-gray-400">{lead.industry}</p>}
        {lead.scoreFactors.length > 0 && (
          <div className="pt-2 border-t border-gray-100 space-y-1">
            {lead.scoreFactors.map((f, i) => (
              <p key={i} className="text-xs text-gray-500 flex items-start gap-1">
                <span className="text-primary-400">&#x2022;</span> {f}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
