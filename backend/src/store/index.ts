// ============================================================
// In-Memory Data Store
// For PoC — replace with Azure SQL / PostgreSQL in production
// ============================================================

import { GTLead, CallIntelligence, OutreachSequence, User, Notification } from '../types';

class DataStore {
  leads: Map<string, GTLead> = new Map();
  calls: Map<string, CallIntelligence> = new Map();
  sequences: Map<string, OutreachSequence> = new Map();
  users: Map<string, User> = new Map();
  notifications: Map<string, Notification> = new Map();

  // Index for lookups
  leadsBySalesforceId: Map<string, string> = new Map();
  callsByLeadId: Map<string, string[]> = new Map();
  sequencesByLeadId: Map<string, string[]> = new Map();
  notificationsByUserId: Map<string, string[]> = new Map();

  constructor() {
    this.seedDemoData();
  }

  private seedDemoData(): void {
    // Seed demo user
    const demoUser: User = {
      id: 'user_demo_001',
      email: 'sdr@hawkridge.com',
      name: 'Alex Johnson',
      role: 'sdr',
      salesforceUserId: '005xx000001Sv0uAAC',
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    const managerUser: User = {
      id: 'user_demo_002',
      email: 'manager@hawkridge.com',
      name: 'Sarah Chen',
      role: 'manager',
      salesforceUserId: '005xx000001Sv0vAAC',
      createdAt: new Date(),
    };
    this.users.set(managerUser.id, managerUser);

    // Seed demo leads
    const demoLeads: GTLead[] = [
      {
        id: 'gt_lead_001',
        salesforceId: '00Q5f000009ABC1',
        salesforceAccountId: '001xx000003DGb1AAG',
        displayName: 'Jane Smith',
        email: 'jane.smith@acmecorp.com',
        company: 'Acme Corp',
        title: 'VP Engineering',
        phone: '+1-415-555-0101',
        industry: 'Manufacturing',
        website: 'https://acmecorp.com',
        aiScore: 87,
        scoreFactors: [
          'Recent job change (VP Engineering) — 2 weeks ago',
          'Company raised Series B ($45M) last month',
          'Tech stack match: SolidWorks + AutoCAD user',
        ],
        companyIntel: {
          summary: 'Acme Corp is a mid-market manufacturing company specializing in precision components for aerospace and defense. 450 employees across 3 facilities. Recently expanded into additive manufacturing.',
          recentNews: [
            'Acme Corp raises $45M Series B to expand additive manufacturing capabilities (Jan 2026)',
            'New VP Engineering Jane Smith joins from Boeing (Feb 2026)',
            'Acme wins $12M DoD contract for precision components (Dec 2025)',
          ],
          techStack: ['SolidWorks', 'AutoCAD', 'SAP ERP', 'Salesforce'],
          estimatedRevenue: '$80M-$120M',
          employeeCount: 450,
        },
        buyingSignals: [
          {
            type: 'job_change',
            description: 'Jane Smith promoted to VP Engineering — likely evaluating new tools',
            detectedAt: new Date('2026-01-28'),
            source: 'LinkedIn',
            impactScore: 25,
          },
          {
            type: 'funding_round',
            description: 'Series B ($45M) — budget available for technology investments',
            detectedAt: new Date('2026-01-15'),
            source: 'Crunchbase',
            impactScore: 20,
          },
          {
            type: 'tech_stack_change',
            description: 'Job postings mention evaluating "3D printing software solutions"',
            detectedAt: new Date('2026-02-05'),
            source: 'Job Boards',
            impactScore: 15,
          },
        ],
        lastScoredAt: new Date(),
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
        recommendedAction: 'Call — high intent signal detected',
        lastActivity: new Date('2026-02-10T15:30:00Z'),
        contactAttempts: 1,
        lastContactedAt: new Date('2026-02-10T15:30:00Z'),
        status: 'contacted',
        createdAt: new Date('2026-01-20'),
        updatedAt: new Date(),
      },
      {
        id: 'gt_lead_002',
        salesforceId: '00Q5f000009ABC2',
        displayName: 'Michael Torres',
        email: 'mtorres@globalfab.io',
        company: 'GlobalFab Industries',
        title: 'Director of Product Development',
        phone: '+1-312-555-0202',
        industry: 'Industrial Manufacturing',
        website: 'https://globalfab.io',
        aiScore: 74,
        scoreFactors: [
          'Active SolidWorks license renewal due in 60 days',
          'Attended HawkRidge webinar on simulation tools',
          'Company expanding R&D headcount by 30%',
        ],
        companyIntel: {
          summary: 'GlobalFab Industries is a $200M industrial manufacturer specializing in heavy equipment components. Strong R&D focus with 50+ engineers. Evaluating next-gen simulation and design tools.',
          recentNews: [
            'GlobalFab announces $30M R&D facility expansion in Chicago (Jan 2026)',
            'Named to IndustryWeek Best Plants 2025 list',
          ],
          techStack: ['SolidWorks', 'ANSYS', 'Oracle ERP', 'Microsoft 365'],
          estimatedRevenue: '$180M-$220M',
          employeeCount: 800,
        },
        buyingSignals: [
          {
            type: 'content_engagement',
            description: 'Attended "Advanced Simulation Workflows" webinar',
            detectedAt: new Date('2026-02-01'),
            source: 'HawkRidge Events',
            impactScore: 18,
          },
        ],
        lastScoredAt: new Date(),
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
        recommendedAction: 'Email — follow up on webinar attendance',
        lastActivity: new Date('2026-02-08T10:00:00Z'),
        contactAttempts: 0,
        status: 'new',
        createdAt: new Date('2026-01-25'),
        updatedAt: new Date(),
      },
      {
        id: 'gt_lead_003',
        salesforceId: '00Q5f000009ABC3',
        displayName: 'Rachel Kim',
        email: 'rachel.kim@precisionparts.com',
        company: 'Precision Parts Co',
        title: 'Engineering Manager',
        phone: '+1-206-555-0303',
        industry: 'Automotive Parts',
        website: 'https://precisionparts.com',
        aiScore: 65,
        scoreFactors: [
          'Growing team — 5 new engineer hires in Q1',
          'Current CATIA user exploring alternatives',
          'Industry shift toward cloud-based CAD tools',
        ],
        companyIntel: {
          summary: 'Precision Parts Co manufactures high-tolerance components for the automotive industry. 200 employees, recently investing in digital transformation of their engineering workflows.',
          recentNews: [
            'Precision Parts wins Toyota Tier-2 supplier contract (Feb 2026)',
            'Company hiring aggressively for digital engineering roles',
          ],
          techStack: ['CATIA', 'Siemens NX', 'SAP', 'Jira'],
          estimatedRevenue: '$50M-$80M',
          employeeCount: 200,
        },
        buyingSignals: [],
        lastScoredAt: new Date(),
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
        recommendedAction: 'Research — identify specific pain points before outreach',
        contactAttempts: 0,
        status: 'new',
        createdAt: new Date('2026-02-01'),
        updatedAt: new Date(),
      },
      {
        id: 'gt_lead_004',
        salesforceId: '00Q5f000009ABC4',
        salesforceAccountId: '001xx000003DGb4AAG',
        displayName: 'David Park',
        email: 'dpark@novaengineering.com',
        company: 'Nova Engineering Solutions',
        title: 'CTO',
        phone: '+1-617-555-0404',
        industry: 'Engineering Services',
        website: 'https://novaengineering.com',
        aiScore: 91,
        scoreFactors: [
          'CTO-level contact — decision maker',
          'Company tripling engineering team this quarter',
          'Pricing page visited 3 times in last week',
        ],
        companyIntel: {
          summary: 'Nova Engineering Solutions is a fast-growing engineering consultancy serving Fortune 500 clients. They provide contract engineering services and need robust CAD/CAM/CAE tools at scale.',
          recentNews: [
            'Nova Engineering raises $20M Series A (Jan 2026)',
            'Wins multi-year contract with Lockheed Martin for design services',
            'CTO David Park featured in Engineering.com on "Scaling Engineering Teams"',
          ],
          techStack: ['SolidWorks', 'Inventor', 'Fusion 360', 'AWS'],
          estimatedRevenue: '$25M-$40M',
          employeeCount: 150,
        },
        buyingSignals: [
          {
            type: 'website_visit',
            description: 'Visited HawkRidge pricing page 3 times in the last 7 days',
            detectedAt: new Date('2026-02-11'),
            source: 'Website Analytics',
            impactScore: 30,
          },
          {
            type: 'funding_round',
            description: 'Series A ($20M) — scaling engineering team rapidly',
            detectedAt: new Date('2026-01-20'),
            source: 'Crunchbase',
            impactScore: 22,
          },
        ],
        lastScoredAt: new Date(),
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
        recommendedAction: 'Call immediately — high buying intent',
        lastActivity: new Date('2026-02-11T09:15:00Z'),
        contactAttempts: 0,
        status: 'new',
        createdAt: new Date('2026-02-05'),
        updatedAt: new Date(),
      },
      {
        id: 'gt_lead_005',
        salesforceId: '00Q5f000009ABC5',
        displayName: 'Lisa Chang',
        email: 'lchang@steelworks.net',
        company: 'Pacific Steelworks',
        title: 'Senior Design Engineer',
        phone: '+1-510-555-0505',
        industry: 'Steel Manufacturing',
        website: 'https://pacificsteelworks.net',
        aiScore: 42,
        scoreFactors: [
          'Individual contributor — may not be decision maker',
          'Company stable — no growth signals detected',
          'Last contacted 3 weeks ago, no response',
        ],
        companyIntel: {
          summary: 'Pacific Steelworks is an established steel manufacturer in the Bay Area. Stable business, moderate technology adoption. 120 employees.',
          recentNews: [],
          techStack: ['AutoCAD', 'SolidWorks (legacy version)'],
          estimatedRevenue: '$30M-$50M',
          employeeCount: 120,
        },
        buyingSignals: [],
        lastScoredAt: new Date(),
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
        recommendedAction: 'Deprioritize — cooling down, try again in 30 days',
        lastActivity: new Date('2026-01-22T14:00:00Z'),
        contactAttempts: 3,
        lastContactedAt: new Date('2026-01-22T14:00:00Z'),
        status: 'nurture',
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date(),
      },
      {
        id: 'gt_lead_006',
        salesforceId: '00Q5f000009ABC6',
        displayName: 'Robert Chen',
        email: 'rchen@quantumdesign.tech',
        company: 'Quantum Design Technologies',
        title: 'Head of Engineering',
        phone: '+1-858-555-0606',
        industry: 'Electronics Manufacturing',
        website: 'https://quantumdesign.tech',
        aiScore: 78,
        scoreFactors: [
          'Decision maker at growing electronics firm',
          'Company posted job for "CAD Administrator" — tool evaluation likely',
          'Industry peer (Velo3D) recently purchased HawkRidge solutions',
        ],
        companyIntel: {
          summary: 'Quantum Design Technologies designs and manufactures advanced PCB and electronic enclosure systems. Known for innovative thermal management solutions.',
          recentNews: [
            'Quantum Design partners with NVIDIA on thermal simulation R&D (Jan 2026)',
            'Opens new design center in San Diego',
          ],
          techStack: ['Altium Designer', 'SolidWorks', 'COMSOL', 'Azure'],
          estimatedRevenue: '$60M-$90M',
          employeeCount: 300,
        },
        buyingSignals: [
          {
            type: 'job_change',
            description: 'Hiring CAD Administrator — indicates tool consolidation or expansion',
            detectedAt: new Date('2026-02-08'),
            source: 'LinkedIn Jobs',
            impactScore: 20,
          },
        ],
        lastScoredAt: new Date(),
        lastSyncedAt: new Date(),
        syncStatus: 'synced',
        recommendedAction: 'Email — reference industry peer success story',
        lastActivity: new Date('2026-02-09T11:30:00Z'),
        contactAttempts: 1,
        lastContactedAt: new Date('2026-02-09T11:30:00Z'),
        status: 'contacted',
        createdAt: new Date('2026-01-28'),
        updatedAt: new Date(),
      },
    ];

    for (const lead of demoLeads) {
      this.leads.set(lead.id, lead);
      this.leadsBySalesforceId.set(lead.salesforceId, lead.id);
    }

    // Seed demo call intelligence
    const demoCalls: CallIntelligence[] = [
      {
        id: 'gt_call_001',
        leadId: 'gt_lead_001',
        zraCallId: 'zra_call_001',
        salesforceTaskId: '00Txx000004abc1',
        duration: 342,
        direction: 'outbound',
        outcome: 'connected',
        callerEmail: 'sdr@hawkridge.com',
        summary: 'Spoke with Jane Smith (VP Engineering, Acme Corp) about their additive manufacturing expansion. She expressed strong interest in SolidWorks simulation tools for metal 3D printing validation. Currently using basic SolidWorks but needs advanced simulation. Mentioned budget is approved for Q1 tooling investments. Wants a demo next week.',
        actionItems: [
          'Schedule SolidWorks Simulation demo for next week',
          'Send case study: aerospace manufacturer using SolidWorks for AM validation',
          'Connect Jane with HawkRidge Solutions Architect for technical scoping',
        ],
        sentimentScore: 0.8,
        talkRatio: 0.35,
        keyMoments: [
          {
            timestamp: 45,
            type: 'pain_point',
            description: 'Jane described manual FEA validation process taking 2 weeks per part',
            transcript: '...right now our FEA validation takes about two weeks per part design, and with the volume we\'re doing for the DoD contract, that\'s just not sustainable...',
            sentiment: -0.3,
          },
          {
            timestamp: 120,
            type: 'buying_signal',
            description: 'Mentioned approved budget for Q1 tooling',
            transcript: '...we actually have budget allocated for Q1 specifically for upgrading our simulation and validation tools...',
            sentiment: 0.7,
          },
          {
            timestamp: 210,
            type: 'competitor_mention',
            description: 'Currently evaluating ANSYS as alternative',
            transcript: '...we\'ve also been looking at ANSYS, but honestly the integration with our existing SolidWorks workflow is a concern...',
            sentiment: 0.2,
          },
          {
            timestamp: 295,
            type: 'next_steps',
            description: 'Agreed to demo next week',
            transcript: '...yes, a demo next week would be great. Can we do Tuesday or Wednesday afternoon?...',
            sentiment: 0.9,
          },
        ],
        coachingTips: [
          'Great talk ratio (35% SDR / 65% prospect) — let the customer talk more, you listened well',
          'When ANSYS was mentioned, you could have probed deeper on their specific simulation needs to differentiate',
          'Strong close — got a specific demo commitment. Consider sending a calendar invite within 1 hour.',
        ],
        competitorsMentioned: ['ANSYS'],
        analysisStatus: 'completed',
        callDate: new Date('2026-02-10T15:30:00Z'),
        analyzedAt: new Date('2026-02-10T15:32:00Z'),
        createdAt: new Date('2026-02-10T15:32:00Z'),
      },
      {
        id: 'gt_call_002',
        leadId: 'gt_lead_005',
        zraCallId: 'zra_call_002',
        duration: 28,
        direction: 'outbound',
        outcome: 'voicemail',
        callerEmail: 'sdr@hawkridge.com',
        summary: 'Left voicemail for Lisa Chang at Pacific Steelworks. Third attempt to reach — no callbacks received.',
        actionItems: [
          'Send follow-up email referencing voicemail',
          'Consider moving to nurture sequence after 5 total attempts',
        ],
        sentimentScore: 0,
        talkRatio: 1.0,
        keyMoments: [],
        coachingTips: [
          'Third voicemail with no callback — consider varying your approach (try email or LinkedIn)',
          'Voicemail was professional but generic. Try mentioning a specific business trigger next time.',
        ],
        competitorsMentioned: [],
        analysisStatus: 'completed',
        callDate: new Date('2026-01-22T14:00:00Z'),
        analyzedAt: new Date('2026-01-22T14:01:00Z'),
        createdAt: new Date('2026-01-22T14:01:00Z'),
      },
    ];

    for (const call of demoCalls) {
      this.calls.set(call.id, call);
      const leadCalls = this.callsByLeadId.get(call.leadId) || [];
      leadCalls.push(call.id);
      this.callsByLeadId.set(call.leadId, leadCalls);
    }

    // Seed notifications
    const demoNotifications: Notification[] = [
      {
        id: 'notif_001',
        type: 'buying_signal',
        title: 'High Intent Signal',
        message: 'David Park (Nova Engineering) visited pricing page 3 times this week',
        leadId: 'gt_lead_004',
        read: false,
        createdAt: new Date('2026-02-11T09:15:00Z'),
      },
      {
        id: 'notif_002',
        type: 'call_analyzed',
        title: 'Call Analysis Ready',
        message: 'Your call with Jane Smith (Acme Corp) has been analyzed — strong buying signals detected',
        leadId: 'gt_lead_001',
        read: false,
        createdAt: new Date('2026-02-10T15:32:00Z'),
      },
      {
        id: 'notif_003',
        type: 'score_change',
        title: 'Score Increased +18',
        message: 'Robert Chen (Quantum Design) score increased from 60 to 78 — new job posting detected',
        leadId: 'gt_lead_006',
        read: true,
        createdAt: new Date('2026-02-09T08:00:00Z'),
      },
    ];

    for (const notif of demoNotifications) {
      this.notifications.set(notif.id, notif);
    }
  }

  // Lead helpers
  getLeadsSorted(): GTLead[] {
    return Array.from(this.leads.values()).sort((a, b) => b.aiScore - a.aiScore);
  }

  getLeadById(id: string): GTLead | undefined {
    return this.leads.get(id);
  }

  getCallsForLead(leadId: string): CallIntelligence[] {
    const callIds = this.callsByLeadId.get(leadId) || [];
    return callIds
      .map((id) => this.calls.get(id))
      .filter((c): c is CallIntelligence => c !== undefined)
      .sort((a, b) => b.callDate.getTime() - a.callDate.getTime());
  }

  getRecentCalls(limit: number = 10): CallIntelligence[] {
    return Array.from(this.calls.values())
      .sort((a, b) => b.callDate.getTime() - a.callDate.getTime())
      .slice(0, limit);
  }

  getNotifications(userId?: string): Notification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getPipelineSnapshot(): {
    totalLeads: number;
    newLeads: number;
    contacted: number;
    engaged: number;
    qualified: number;
    nurture: number;
    averageScore: number;
  } {
    const leads = Array.from(this.leads.values());
    const scores = leads.map((l) => l.aiScore);
    return {
      totalLeads: leads.length,
      newLeads: leads.filter((l) => l.status === 'new').length,
      contacted: leads.filter((l) => l.status === 'contacted').length,
      engaged: leads.filter((l) => l.status === 'engaged').length,
      qualified: leads.filter((l) => l.status === 'qualified').length,
      nurture: leads.filter((l) => l.status === 'nurture').length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    };
  }
}

export const store = new DataStore();
