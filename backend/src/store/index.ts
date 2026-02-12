// ============================================================
// In-Memory Data Store — Deal Intelligence Platform
// Rich demo data for HawkRidge Systems AE pipeline
// For PoC — replace with Azure SQL / PostgreSQL in production
// ============================================================

import {
  Account,
  Stakeholder,
  Deal,
  Activity,
  User,
  Notification,
  DashboardData,
  QuotaAttainment,
  PipelineStageSummary,
  DealAtRisk,
  ForecastData,
  TodayAction,
  MeetingPrep,
  DEAL_STAGES,
} from '../types';

class DataStore {
  accounts: Map<string, Account> = new Map();
  stakeholders: Map<string, Stakeholder> = new Map();
  deals: Map<string, Deal> = new Map();
  activities: Map<string, Activity> = new Map();
  users: Map<string, User> = new Map();
  notifications: Map<string, Notification> = new Map();
  meetingPreps: Map<string, MeetingPrep> = new Map();

  // Indexes
  stakeholdersByDeal: Map<string, string[]> = new Map();
  stakeholdersByAccount: Map<string, string[]> = new Map();
  activitiesByDeal: Map<string, string[]> = new Map();
  dealsByAccount: Map<string, string[]> = new Map();

  constructor() {
    this.seedDemoData();
  }

  // ─── Seed Data ───────────────────────────────────────────────

  private seedDemoData(): void {
    this.seedUsers();
    this.seedAccounts();
    this.seedDeals();
    this.seedStakeholders();
    this.seedActivities();
    this.seedNotifications();
  }

  // ─── Users ───────────────────────────────────────────────────

  private seedUsers(): void {
    const aeUser: User = {
      id: 'user_ae_001',
      email: 'marcus.rodriguez@hawkridge.com',
      name: 'Marcus Rodriguez',
      role: 'ae',
      title: 'Senior Account Executive',
      salesforceUserId: '005xx000001Sv0uAAC',
      quota: 1500000,
      closedWonYTD: 680000,
      createdAt: new Date('2024-03-15'),
    };
    this.users.set(aeUser.id, aeUser);

    const managerUser: User = {
      id: 'user_mgr_001',
      email: 'sarah.chen@hawkridge.com',
      name: 'Sarah Chen',
      role: 'manager',
      title: 'VP of Sales',
      salesforceUserId: '005xx000001Sv0vAAC',
      createdAt: new Date('2022-08-01'),
    };
    this.users.set(managerUser.id, managerUser);
  }

  // ─── Accounts ────────────────────────────────────────────────

  private seedAccounts(): void {
    const accounts: Account[] = [
      {
        id: 'acct_001',
        name: 'Acme Aerospace',
        industry: 'Aerospace & Defense',
        website: 'https://acmeaerospace.com',
        employeeCount: 450,
        estimatedRevenue: '$80M-$120M',
        address: 'San Jose, CA',
        summary: 'Acme Aerospace is a mid-market aerospace manufacturer specializing in precision components for commercial and defense aviation. They operate 3 facilities with 450 employees and recently won a $12M DoD contract. Currently using SolidWorks Standard across 35 seats but need to upgrade simulation capabilities for their expanding additive manufacturing division.',
        recentNews: [
          'Acme Aerospace wins $12M DoD precision components contract (Dec 2025)',
          'VP Engineering Sarah Mitchell joins from Boeing to lead digital transformation (Jan 2026)',
          'Company announces $8M expansion of additive manufacturing facility (Feb 2026)',
        ],
        techStack: ['SolidWorks Standard', 'AutoCAD', 'SAP ERP', 'Salesforce', 'ANSYS Discovery (trial)'],
        healthScore: 78,
        salesforceAccountId: '001xx000003DGb1AAG',
        createdAt: new Date('2025-09-15'),
        updatedAt: new Date('2026-02-10'),
      },
      {
        id: 'acct_002',
        name: 'GlobalFab Industries',
        industry: 'Industrial Manufacturing',
        website: 'https://globalfab.io',
        employeeCount: 800,
        estimatedRevenue: '$180M-$220M',
        address: 'Chicago, IL',
        summary: 'GlobalFab Industries is a $200M industrial manufacturer specializing in heavy equipment components for the construction and mining sectors. Strong R&D focus with 60+ engineers. They have been a SolidWorks customer for 5 years but their license renewal is approaching and they are actively evaluating alternatives including Siemens NX. Their champion, Director of Product Development Michael Torres, has gone silent after initially driving the evaluation.',
        recentNews: [
          'GlobalFab announces $30M R&D facility expansion in Chicago (Jan 2026)',
          'Named to IndustryWeek Best Plants 2025 list',
          'New CTO Anita Patel hired from Caterpillar (Nov 2025)',
        ],
        techStack: ['SolidWorks Professional', 'ANSYS Mechanical', 'Oracle ERP', 'Microsoft 365', 'Teamcenter PLM'],
        healthScore: 45,
        salesforceAccountId: '001xx000003DGb2AAG',
        createdAt: new Date('2025-06-20'),
        updatedAt: new Date('2026-02-08'),
      },
      {
        id: 'acct_003',
        name: 'Nova Engineering Solutions',
        industry: 'Engineering Services',
        website: 'https://novaengineering.com',
        employeeCount: 150,
        estimatedRevenue: '$25M-$40M',
        address: 'Boston, MA',
        summary: 'Nova Engineering Solutions is a fast-growing engineering consultancy serving Fortune 500 clients in automotive, medical devices, and consumer electronics. They provide contract engineering and product development services. CEO/CTO David Park is personally championing the SolidWorks standardization initiative across 50 seats as they scale from Inventor/Fusion 360 mixed environment. Series A funded with aggressive growth targets.',
        recentNews: [
          'Nova Engineering raises $20M Series A (Jan 2026)',
          'Wins multi-year contract with Lockheed Martin for design services',
          'CTO David Park featured in Engineering.com on "Scaling Engineering Teams"',
          'Opens second office in Austin, TX to serve Texas manufacturing corridor',
        ],
        techStack: ['Autodesk Inventor', 'Fusion 360', 'SolidWorks (partial)', 'AWS', 'Jira', 'Confluence'],
        healthScore: 88,
        salesforceAccountId: '001xx000003DGb3AAG',
        createdAt: new Date('2025-11-01'),
        updatedAt: new Date('2026-02-11'),
      },
      {
        id: 'acct_004',
        name: 'Precision Parts Co',
        industry: 'Automotive Parts',
        website: 'https://precisionparts.com',
        employeeCount: 200,
        estimatedRevenue: '$50M-$80M',
        address: 'Detroit, MI',
        summary: 'Precision Parts Co manufactures high-tolerance components for the automotive industry, primarily serving Toyota, Honda, and GM as a Tier-2 supplier. 200 employees with a 15-person engineering team currently using CATIA. They are exploring alternatives due to high CATIA licensing costs and desire for easier-to-use tooling as they hire junior engineers. Early-stage evaluation.',
        recentNews: [
          'Precision Parts wins Toyota Tier-2 supplier contract extension (Feb 2026)',
          'Company investing in digital twin technology for quality control',
          'Hiring aggressively — 5 new engineering roles posted in Q1 2026',
        ],
        techStack: ['CATIA V5', 'Siemens NX (2 seats)', 'SAP', 'Jira', 'MATLAB'],
        healthScore: 55,
        salesforceAccountId: '001xx000003DGb4AAG',
        createdAt: new Date('2026-01-10'),
        updatedAt: new Date('2026-02-06'),
      },
    ];

    for (const account of accounts) {
      this.accounts.set(account.id, account);
    }
  }

  // ─── Deals ───────────────────────────────────────────────────

  private seedDeals(): void {
    const deals: Deal[] = [
      // ── Deal 1: Acme Aerospace — $285K, Negotiation ──────────
      {
        id: 'deal_001',
        accountId: 'acct_001',
        salesforceOpportunityId: '006xx000004abc1',
        name: 'Acme Aerospace — SolidWorks Premium + Simulation',
        value: 285000,
        stage: 'negotiation',
        probability: 75,
        winProbability: 72,
        products: ['SolidWorks Premium (35 seats)', 'Simulation Professional (10 seats)', 'HawkRidge Technical Support Package'],
        seatCount: 35,
        closeDate: new Date('2026-03-28'),
        nextMeetingDate: new Date('2026-02-14T14:00:00Z'),
        daysInStage: 8,
        healthScore: 74,
        meddic: {
          metrics: { score: 8, notes: 'Quantified: 2-week FEA cycle reduced to 2 days. $340K/yr productivity gain identified. ROI model presented and accepted by CFO.' },
          economicBuyer: { score: 7, notes: 'CFO Robert Yang identified and engaged. Had 1:1 meeting — positive but wants to see competitive pricing before signing.' },
          decisionCriteria: { score: 8, notes: 'Technical: SolidWorks integration, simulation accuracy, training timeline. Business: ROI within 12 months, support quality, migration path from Standard to Premium.' },
          decisionProcess: { score: 7, notes: 'VP Eng recommends to CFO, CFO approves > $200K. Board approval not required. Target: PO by end of March. Legal review 1 week.' },
          identifyPain: { score: 9, notes: 'Manual FEA validation taking 2 weeks per part — unsustainable with DoD contract volume. Current SolidWorks Standard lacks simulation. Engineers using workaround tools.' },
          champion: { score: 8, notes: 'Sarah Mitchell (VP Eng) is strong champion. Joined from Boeing, knows SolidWorks ecosystem well. Actively selling internally.' },
          overall: 78,
        },
        riskFactors: [
          {
            id: 'risk_001_1',
            category: 'competition',
            description: 'ANSYS submitted aggressive counter-proposal at 20% discount after learning about our engagement',
            severity: 'high',
            detectedAt: new Date('2026-02-06'),
            mitigationAction: 'Emphasize SolidWorks-native integration advantage and total cost of ownership including training',
            isResolved: false,
          },
          {
            id: 'risk_001_2',
            category: 'budget',
            description: 'CFO requested 15% discount and extended payment terms — may stall if pricing not approved by HawkRidge leadership',
            severity: 'medium',
            detectedAt: new Date('2026-02-08'),
            mitigationAction: 'Prepare multi-year deal structure with Year 1 discount offset by 3-year commitment',
            isResolved: false,
          },
          {
            id: 'risk_001_3',
            category: 'timeline',
            description: 'Legal review could delay final signature by 1-2 weeks past target close date',
            severity: 'low',
            detectedAt: new Date('2026-02-10'),
            mitigationAction: 'Send draft contract to legal early for parallel review',
            isResolved: false,
          },
          {
            id: 'risk_001_4',
            category: 'technical',
            description: 'PTC Creo also being evaluated by a senior engineer in the additive manufacturing team',
            severity: 'medium',
            detectedAt: new Date('2026-01-22'),
            mitigationAction: 'Schedule targeted demo showing SolidWorks additive manufacturing workflow superiority',
            isResolved: false,
          },
        ],
        competitors: [
          {
            competitorName: 'ANSYS',
            threatLevel: 'high',
            strengths: [
              'Industry-leading FEA solver accuracy for complex nonlinear problems',
              'Strong aerospace industry brand recognition',
              'Submitted aggressive 20% discounted proposal',
            ],
            weaknesses: [
              'Requires separate CAD tool — no native modeling environment',
              'Steep learning curve — would require extensive training investment',
              'No integrated PDM/PLM solution',
              'Per-solver licensing model can escalate costs quickly',
            ],
            ourAdvantages: [
              'SolidWorks Simulation is embedded in their existing CAD environment — zero context switching',
              'Single-vendor support through HawkRidge for CAD + simulation + training',
              'Faster time-to-competency: engineers productive in 2 weeks vs 2 months for ANSYS',
              'Total cost of ownership 30% lower when factoring training and integration',
            ],
            keyDifferentiators: [
              'Seamless CAD-to-simulation workflow eliminates file translation errors',
              'HawkRidge provides local, hands-on training and support — not offshore',
            ],
            objectionHandlers: [
              {
                objection: 'ANSYS has more advanced solvers for our aerospace applications',
                response: 'SolidWorks Simulation Professional covers 90% of your validation needs. For the remaining edge cases, we can integrate with specialized solvers. Let me show you the benchmark results from a similar aerospace manufacturer.',
              },
              {
                objection: 'ANSYS gave us a 20% discount',
                response: 'When you factor in the training cost ($40K+), integration time (3 months), and ongoing per-solver licensing, our total 3-year TCO is still 30% lower. I can build a side-by-side TCO comparison for Robert.',
              },
            ],
            incumbentProduct: 'ANSYS Discovery (trial)',
            relationshipStrength: 'moderate',
            lastMentionedAt: new Date('2026-02-06'),
            mentionedBy: 'stkh_001_3',
          },
          {
            competitorName: 'PTC Creo',
            threatLevel: 'medium',
            strengths: [
              'Strong additive manufacturing (AM) workflows',
              'Good parametric modeling for complex geometry',
            ],
            weaknesses: [
              'Much smaller reseller network — limited local support',
              'Acme engineers have no Creo experience — full retraining required',
              'No existing PTC infrastructure at Acme',
            ],
            ourAdvantages: [
              'Acme already has 35 SolidWorks seats — upgrade path vs rip-and-replace',
              'HawkRidge can provide AM-specific SolidWorks training',
              'SolidWorks 2026 AM module competitive with Creo AM capabilities',
            ],
            keyDifferentiators: [
              'Migration cost: $0 for SolidWorks upgrade vs $200K+ for Creo switch',
            ],
            objectionHandlers: [
              {
                objection: 'Creo has better additive manufacturing tools',
                response: 'SolidWorks 2026 closed that gap significantly. Let me show you our AM workflow demo — our customer Horizon Aerospace switched from Creo to SolidWorks for AM specifically.',
              },
            ],
            relationshipStrength: 'weak',
            lastMentionedAt: new Date('2026-01-22'),
            mentionedBy: 'stkh_001_3',
          },
        ],
        nextBestActions: [
          {
            id: 'nba_001_1',
            type: 'meeting',
            priority: 'critical',
            title: 'Prepare for pricing negotiation meeting (Feb 14)',
            description: 'CFO Robert Yang and VP Eng Sarah Mitchell will attend. Bring multi-year pricing model, TCO comparison vs ANSYS, and ROI recap.',
            aiReasoning: 'This is the pricing decision meeting. ANSYS counter-proposal is on the table. Failure to present compelling TCO story risks losing deal to competitor. Prepare 3-year commitment structure with Year 1 incentive.',
            targetStakeholderId: 'stkh_001_2',
            dueDate: new Date('2026-02-14'),
            isCompleted: false,
            createdAt: new Date('2026-02-10'),
          },
          {
            id: 'nba_001_2',
            type: 'email',
            priority: 'high',
            title: 'Send TCO comparison document to CFO',
            description: 'Build and send a side-by-side 3-year TCO comparison: SolidWorks Premium + Simulation vs ANSYS standalone. Include training, integration, and ongoing license costs.',
            aiReasoning: 'CFO Robert Yang is analytical and data-driven. He mentioned wanting competitive pricing comparison in last meeting. Proactively sending this before Feb 14 meeting shows responsiveness and gives him ammo to justify internally.',
            targetStakeholderId: 'stkh_001_2',
            dueDate: new Date('2026-02-13'),
            isCompleted: false,
            createdAt: new Date('2026-02-10'),
          },
          {
            id: 'nba_001_3',
            type: 'call',
            priority: 'high',
            title: 'Align with champion Sarah Mitchell before pricing meeting',
            description: 'Quick call with Sarah to pre-wire the pricing conversation. Confirm she supports our multi-year structure and will advocate for SolidWorks in the meeting.',
            aiReasoning: 'Champion alignment before economic buyer meetings is critical. Sarah Mitchell has been strong but we need to ensure she is prepared to counter any ANSYS objections Robert may raise.',
            targetStakeholderId: 'stkh_001_1',
            dueDate: new Date('2026-02-13'),
            isCompleted: false,
            createdAt: new Date('2026-02-10'),
          },
          {
            id: 'nba_001_4',
            type: 'internal',
            priority: 'medium',
            title: 'Get pre-approval from HawkRidge leadership on discount structure',
            description: 'Request approval for up to 12% discount on 3-year commitment from VP Sales Sarah Chen. Prepare deal memo with margin analysis.',
            aiReasoning: 'CFO requested 15% discount. We need to know our floor before the negotiation meeting. Standard max discount is 10%, but deal size and multi-year commitment may justify 12%.',
            dueDate: new Date('2026-02-13'),
            isCompleted: false,
            createdAt: new Date('2026-02-10'),
          },
        ],
        stageHistory: [
          { stage: 'discovery', enteredAt: new Date('2025-10-15'), exitedAt: new Date('2025-11-08') },
          { stage: 'qualification', enteredAt: new Date('2025-11-08'), exitedAt: new Date('2025-12-12') },
          { stage: 'technical_evaluation', enteredAt: new Date('2025-12-12'), exitedAt: new Date('2026-01-20') },
          { stage: 'proposal', enteredAt: new Date('2026-01-20'), exitedAt: new Date('2026-02-04') },
          { stage: 'negotiation', enteredAt: new Date('2026-02-04') },
        ],
        ownerId: 'user_ae_001',
        dealNotes: 'Strong deal with clear champion and identified pain. Main risk is ANSYS counter-proposal and CFO price sensitivity. Need to close before end of Q1 for quota.',
        createdAt: new Date('2025-10-15'),
        updatedAt: new Date('2026-02-10'),
      },

      // ── Deal 2: GlobalFab Industries — $180K, Technical Eval ──
      {
        id: 'deal_002',
        accountId: 'acct_002',
        salesforceOpportunityId: '006xx000004abc2',
        name: 'GlobalFab Industries — SolidWorks Professional Renewal + Expansion',
        value: 180000,
        stage: 'technical_evaluation',
        probability: 40,
        winProbability: 35,
        products: ['SolidWorks Professional (40 seats renewal)', 'SolidWorks PDM Professional (20 seats)', 'HawkRidge Implementation Services'],
        seatCount: 40,
        closeDate: new Date('2026-04-15'),
        nextMeetingDate: undefined,
        daysInStage: 22,
        healthScore: 42,
        meddic: {
          metrics: { score: 5, notes: 'Partial: engineering team reports 30% time waste on file management (PDM opportunity). Full ROI model not yet presented to economic buyer.' },
          economicBuyer: { score: 4, notes: 'CTO Anita Patel identified but not yet directly engaged. New to role (hired Nov 2025) — unknown budget priorities. Michael Torres was our path in but has gone silent.' },
          decisionCriteria: { score: 6, notes: 'Technical: PLM integration with Teamcenter, simulation accuracy, data migration. Business: must beat or match Siemens NX total package pricing.' },
          decisionProcess: { score: 3, notes: 'Unclear since CTO change. Previous process: Director recommends, VP Eng approves. New CTO may have changed approval chain. Need to re-map.' },
          identifyPain: { score: 7, notes: 'File management chaos — engineers losing work due to no PDM. License renewal approaching with budget pressure. But pain may not be acute enough to drive urgency.' },
          champion: { score: 3, notes: 'RISK: Michael Torres (original champion) has not responded to 3 outreach attempts in 2 weeks. May have been sidelined or lost interest. Need to re-establish or find new champion.' },
          overall: 47,
        },
        riskFactors: [
          {
            id: 'risk_002_1',
            category: 'champion',
            description: 'Champion Michael Torres (Director, Product Dev) has gone silent — no response to emails or calls for 14 days',
            severity: 'critical',
            detectedAt: new Date('2026-02-05'),
            mitigationAction: 'Attempt multi-channel re-engagement: LinkedIn message, direct phone call, and email with new value proposition. If no response in 5 days, pivot to Engineering Manager or CTO.',
            isResolved: false,
          },
          {
            id: 'risk_002_2',
            category: 'competition',
            description: 'Siemens NX running parallel evaluation — IT Director Kevin Wu is pushing for Siemens due to Teamcenter PLM integration',
            severity: 'high',
            detectedAt: new Date('2026-01-28'),
            mitigationAction: 'Position SolidWorks PDM Professional as cost-effective Teamcenter alternative. Request meeting with IT Director to address PLM concerns directly.',
            isResolved: false,
          },
          {
            id: 'risk_002_3',
            category: 'decision_process',
            description: 'New CTO Anita Patel may reset evaluation criteria — unknown priorities and vendor preferences',
            severity: 'high',
            detectedAt: new Date('2026-01-15'),
            mitigationAction: 'Request executive-level meeting between HawkRidge VP Sales and CTO Patel. Position as strategic partnership discussion, not vendor pitch.',
            isResolved: false,
          },
          {
            id: 'risk_002_4',
            category: 'timeline',
            description: 'License renewal deadline is April 15 but no urgency from customer to finalize evaluation',
            severity: 'medium',
            detectedAt: new Date('2026-02-01'),
            mitigationAction: 'Create urgency around renewal pricing — current rates expire if not locked in. Highlight risk of lapsed licenses affecting engineering productivity.',
            isResolved: false,
          },
          {
            id: 'risk_002_5',
            category: 'engagement',
            description: 'Overall account engagement has dropped 60% in last 3 weeks — fewer email opens, no meetings scheduled',
            severity: 'high',
            detectedAt: new Date('2026-02-08'),
            isResolved: false,
          },
        ],
        competitors: [
          {
            competitorName: 'Siemens NX',
            threatLevel: 'high',
            strengths: [
              'Native Teamcenter PLM integration — GlobalFab already uses Teamcenter',
              'Strong enterprise manufacturing reputation',
              'IT Director Kevin Wu is a former Siemens shop user and advocates strongly',
              'Unified CAD/CAM/CAE platform',
            ],
            weaknesses: [
              'Significantly higher per-seat cost ($8K+ vs $5K for SolidWorks)',
              'Steep learning curve — 60+ engineers would need extensive retraining',
              'Overkill for most of GlobalFab\'s design work (heavy equipment components)',
              'Longer implementation timeline (6-9 months vs 2-3 months)',
            ],
            ourAdvantages: [
              'GlobalFab engineers already proficient in SolidWorks — zero retraining cost',
              'SolidWorks PDM Professional provides 80% of Teamcenter functionality at 40% of the cost',
              'HawkRidge local support and training vs Siemens remote-only support',
              'Faster time-to-value: upgrade vs rip-and-replace',
            ],
            keyDifferentiators: [
              'Total switch cost to Siemens NX: $500K+ including retraining, productivity loss, and migration',
              'SolidWorks PDM can integrate with existing Teamcenter via API bridge',
            ],
            objectionHandlers: [
              {
                objection: 'Siemens NX integrates natively with our Teamcenter PLM',
                response: 'Understood — PLM integration is critical. SolidWorks PDM Professional can connect to Teamcenter via our API bridge, giving you the best of both worlds. Let me show you a customer case study where we achieved this at a similar manufacturer.',
              },
              {
                objection: 'Our IT Director recommends standardizing on the Siemens platform',
                response: 'I respect that perspective. However, the engineering team\'s productivity is the priority — retraining 60 engineers on NX would cost $300K+ and 6 months of reduced output. Let\'s get IT and Engineering in the same room to evaluate the full picture.',
              },
            ],
            incumbentProduct: 'Teamcenter PLM',
            relationshipStrength: 'moderate',
            lastMentionedAt: new Date('2026-01-28'),
            mentionedBy: 'stkh_002_4',
          },
        ],
        nextBestActions: [
          {
            id: 'nba_002_1',
            type: 'call',
            priority: 'critical',
            title: 'Re-engage champion Michael Torres — direct phone call',
            description: 'Call Michael Torres directly. If no answer, leave voicemail referencing the upcoming renewal deadline and new PDM value proposition. Follow up with LinkedIn message.',
            aiReasoning: 'Champion has been silent for 14 days — this is the #1 risk to this deal. Without champion engagement, the deal will likely stall or be lost to Siemens. Direct phone outreach has highest response rate for re-engagement.',
            targetStakeholderId: 'stkh_002_1',
            dueDate: new Date('2026-02-12'),
            isCompleted: false,
            createdAt: new Date('2026-02-08'),
          },
          {
            id: 'nba_002_2',
            type: 'executive_sponsor',
            priority: 'high',
            title: 'Request Sarah Chen to reach out to CTO Anita Patel',
            description: 'Ask VP Sales Sarah Chen to send a peer-level intro email to CTO Anita Patel. Position as strategic partnership discussion about GlobalFab\'s engineering transformation.',
            aiReasoning: 'New CTO is the unknown variable. Executive-to-executive outreach bypasses the silent champion and establishes a new relationship at the decision-maker level. This is standard deal recovery protocol when a champion goes dark.',
            targetStakeholderId: 'stkh_002_2',
            dueDate: new Date('2026-02-14'),
            isCompleted: false,
            createdAt: new Date('2026-02-08'),
          },
          {
            id: 'nba_002_3',
            type: 'meeting',
            priority: 'high',
            title: 'Schedule PLM integration demo for IT Director',
            description: 'Arrange a focused demo showing SolidWorks PDM to Teamcenter integration. Include HawkRidge Solutions Architect. Address Kevin Wu\'s specific concerns about data flow and compliance.',
            aiReasoning: 'IT Director Kevin Wu is a potential blocker pushing for Siemens. Rather than going around him, address his technical concerns directly with a tailored demo. Converting a blocker to neutral eliminates a major deal risk.',
            targetStakeholderId: 'stkh_002_4',
            dueDate: new Date('2026-02-19'),
            isCompleted: false,
            createdAt: new Date('2026-02-08'),
          },
          {
            id: 'nba_002_4',
            type: 'email',
            priority: 'medium',
            title: 'Send renewal pricing lock-in notice',
            description: 'Email Michael Torres and Engineering Manager James Park with a formal notice that current renewal pricing expires April 1 and new rates are 8% higher.',
            aiReasoning: 'Creating pricing urgency can motivate re-engagement. The renewal deadline is a natural forcing function — use it strategically without being aggressive.',
            targetStakeholderId: 'stkh_002_1',
            dueDate: new Date('2026-02-15'),
            isCompleted: false,
            createdAt: new Date('2026-02-08'),
          },
          {
            id: 'nba_002_5',
            type: 'research',
            priority: 'medium',
            title: 'Research CTO Anita Patel\'s vendor preferences from Caterpillar tenure',
            description: 'Check LinkedIn, conference talks, and published articles for CTO Anita Patel\'s engineering tool preferences from her time at Caterpillar. Identify any SolidWorks or Siemens connections.',
            aiReasoning: 'Understanding the new CTO\'s background and preferences will inform our approach. If she used SolidWorks at Caterpillar, that is a strong talking point. If she used Siemens, we need to prepare differently.',
            targetStakeholderId: 'stkh_002_2',
            dueDate: new Date('2026-02-13'),
            isCompleted: false,
            createdAt: new Date('2026-02-08'),
          },
        ],
        stageHistory: [
          { stage: 'discovery', enteredAt: new Date('2025-08-10'), exitedAt: new Date('2025-09-15') },
          { stage: 'qualification', enteredAt: new Date('2025-09-15'), exitedAt: new Date('2025-11-20') },
          { stage: 'technical_evaluation', enteredAt: new Date('2025-11-20') },
        ],
        ownerId: 'user_ae_001',
        dealNotes: 'Deal at risk. Champion went silent, new CTO is unknown variable, and Siemens NX has internal advocate in IT Director. Need to re-engage or find new champion ASAP. Renewal deadline creates some urgency but not enough on its own.',
        createdAt: new Date('2025-08-10'),
        updatedAt: new Date('2026-02-08'),
      },

      // ── Deal 3: Nova Engineering — $420K, Proposal ───────────
      {
        id: 'deal_003',
        accountId: 'acct_003',
        salesforceOpportunityId: '006xx000004abc3',
        name: 'Nova Engineering — Enterprise SolidWorks Standardization (50 seats)',
        value: 420000,
        stage: 'proposal',
        probability: 65,
        winProbability: 71,
        products: ['SolidWorks Premium (50 seats)', 'SolidWorks PDM Standard (50 seats)', 'SolidWorks Simulation Standard (20 seats)', 'HawkRidge Training Package (5 days on-site)', 'HawkRidge Migration Services'],
        seatCount: 50,
        closeDate: new Date('2026-03-15'),
        nextMeetingDate: new Date('2026-02-18T10:00:00Z'),
        daysInStage: 11,
        healthScore: 85,
        meddic: {
          metrics: { score: 9, notes: 'Quantified: standardizing on SolidWorks saves $180K/yr in license consolidation + $95K/yr in reduced training overhead. CTO has accepted ROI model and shared with board.' },
          economicBuyer: { score: 9, notes: 'CTO David Park is both champion and economic buyer. Has board-level authority for purchases up to $500K. Actively driving this initiative.' },
          decisionCriteria: { score: 8, notes: 'Must support multi-site collaboration (Boston + Austin), handle Inventor file migration, include training for 30 new hires expected in 2026. Pricing must be competitive with Autodesk enterprise agreement.' },
          decisionProcess: { score: 8, notes: 'CTO approves up to $500K with board notification. Procurement Lead Lisa Chen handles contract review (5-7 business days). David wants to close by mid-March to align with Austin office opening.' },
          identifyPain: { score: 9, notes: 'Mixed Inventor/Fusion 360 environment causing collaboration failures. File incompatibility between teams. New hires confused by multiple toolsets. Scaling to 50 engineers requires standardization.' },
          champion: { score: 9, notes: 'David Park is an exceptional champion — presenting our proposal to the board himself. Actively selling SolidWorks internally. Has shot down alternative proposals.' },
          overall: 87,
        },
        riskFactors: [
          {
            id: 'risk_003_1',
            category: 'budget',
            description: 'Procurement Lead Lisa Chen has requested 3 competitive quotes per company policy — may invite Autodesk counter-proposal',
            severity: 'medium',
            detectedAt: new Date('2026-02-05'),
            mitigationAction: 'Provide best-and-final pricing proactively. Emphasize migration services included in our proposal that competitors will charge separately for.',
            isResolved: false,
          },
          {
            id: 'risk_003_2',
            category: 'timeline',
            description: 'Austin office opening date moved from March 1 to March 15 — may shift close date',
            severity: 'low',
            detectedAt: new Date('2026-02-08'),
            mitigationAction: 'Decouple Austin opening from deal close. Propose phased rollout: Boston seats first, Austin seats deployed on opening day.',
            isResolved: false,
          },
          {
            id: 'risk_003_3',
            category: 'technical',
            description: 'Head of Engineering wants to validate Inventor-to-SolidWorks file migration accuracy before signing',
            severity: 'medium',
            detectedAt: new Date('2026-02-03'),
            mitigationAction: 'Offer free migration pilot: convert 50 sample files and validate with engineering team before full commitment.',
            isResolved: false,
          },
        ],
        competitors: [
          {
            competitorName: 'Autodesk (Inventor/Fusion 360)',
            threatLevel: 'medium',
            strengths: [
              'Nova currently uses Autodesk products — incumbent advantage',
              'Autodesk may offer aggressive retention pricing',
              'Cloud-based Fusion 360 appeals to some team members for remote work',
            ],
            weaknesses: [
              'CTO explicitly wants to move away from Autodesk due to licensing complexity',
              'Mixed Inventor/Fusion 360 causing the collaboration problems they want to solve',
              'Autodesk subscription model has had unpopular price increases',
              'No strong Autodesk reseller relationship — currently direct',
            ],
            ourAdvantages: [
              'SolidWorks standardizes on one platform — solves the multi-tool problem',
              'HawkRidge provides migration services included in the deal — Autodesk cannot offer this',
              'SolidWorks PDM provides file management that Autodesk Vault lacks for mixed environments',
              'On-site training from HawkRidge vs Autodesk online-only training',
            ],
            keyDifferentiators: [
              'All-inclusive deal: licenses + migration + training + support from one vendor',
              'SolidWorks has stronger simulation tools for Nova\'s client work',
            ],
            objectionHandlers: [
              {
                objection: 'We already have Autodesk licenses — switching is expensive',
                response: 'That is exactly why we included migration services at no extra cost. The $180K/yr you save in license consolidation pays for the switch in Year 1. Plus, your team spends 15 hours/week on file compatibility issues that go away on Day 1 of SolidWorks.',
              },
            ],
            incumbentProduct: 'Autodesk Inventor + Fusion 360',
            relationshipStrength: 'weak',
            lastMentionedAt: new Date('2026-02-01'),
          },
        ],
        nextBestActions: [
          {
            id: 'nba_003_1',
            type: 'proposal',
            priority: 'critical',
            title: 'Finalize and send proposal document for Feb 18 review',
            description: 'Complete the formal proposal document including 50-seat pricing, migration services scope, training schedule, and 3-year TCO model. David Park will present to his leadership team on Feb 20.',
            aiReasoning: 'David is scheduled to present to leadership on Feb 20. He needs our final proposal by Feb 18 meeting at the latest. This is the single most important action — the deal hinges on this document being compelling and complete.',
            targetStakeholderId: 'stkh_003_1',
            dueDate: new Date('2026-02-17'),
            isCompleted: false,
            createdAt: new Date('2026-02-10'),
          },
          {
            id: 'nba_003_2',
            type: 'meeting',
            priority: 'high',
            title: 'Run Inventor-to-SolidWorks migration pilot',
            description: 'Schedule a half-day session with Head of Engineering Priya Sharma to convert 50 sample Inventor files to SolidWorks and validate accuracy. Include HawkRidge Solutions Architect.',
            aiReasoning: 'Priya Sharma has a technical validation concern about migration accuracy. Addressing this proactively with a hands-on pilot removes a blocker and turns her into an advocate for the deal.',
            targetStakeholderId: 'stkh_003_2',
            dueDate: new Date('2026-02-16'),
            isCompleted: false,
            createdAt: new Date('2026-02-10'),
          },
          {
            id: 'nba_003_3',
            type: 'email',
            priority: 'medium',
            title: 'Send competitive pricing summary to Procurement',
            description: 'Provide Lisa Chen with a competitive pricing summary showing SolidWorks vs Autodesk enterprise agreement, including hidden costs of status quo (productivity loss, dual licensing, training).',
            aiReasoning: 'Procurement requires 3 competitive quotes. Get ahead of this by proactively showing our value vs incumbent. This speeds up procurement process and frames the conversation favorably before Autodesk submits a retention offer.',
            targetStakeholderId: 'stkh_003_3',
            dueDate: new Date('2026-02-15'),
            isCompleted: false,
            createdAt: new Date('2026-02-10'),
          },
          {
            id: 'nba_003_4',
            type: 'follow_up',
            priority: 'medium',
            title: 'Confirm Austin office timeline with David Park',
            description: 'Quick check-in with David on the Austin office opening timeline shift. Propose phased deployment plan: Boston first (March), Austin on opening day.',
            aiReasoning: 'Austin office opening moved to March 15. A phased deployment actually works in our favor — lets us prove success in Boston before Austin rollout. Position this as a risk-reduction strategy.',
            targetStakeholderId: 'stkh_003_1',
            dueDate: new Date('2026-02-14'),
            isCompleted: false,
            createdAt: new Date('2026-02-10'),
          },
        ],
        stageHistory: [
          { stage: 'discovery', enteredAt: new Date('2025-11-15'), exitedAt: new Date('2025-12-10') },
          { stage: 'qualification', enteredAt: new Date('2025-12-10'), exitedAt: new Date('2026-01-08') },
          { stage: 'technical_evaluation', enteredAt: new Date('2026-01-08'), exitedAt: new Date('2026-02-01') },
          { stage: 'proposal', enteredAt: new Date('2026-02-01') },
        ],
        ownerId: 'user_ae_001',
        dealNotes: 'Strongest deal in pipeline. CTO is an ideal champion — technical, decisive, and has budget authority. Main execution risk is procurement process and migration validation. Need to nail the Feb 18 proposal review.',
        createdAt: new Date('2025-11-15'),
        updatedAt: new Date('2026-02-11'),
      },

      // ── Deal 4: Precision Parts Co — $95K, Discovery ─────────
      {
        id: 'deal_004',
        accountId: 'acct_004',
        salesforceOpportunityId: '006xx000004abc4',
        name: 'Precision Parts Co — CATIA to SolidWorks Migration',
        value: 95000,
        stage: 'discovery',
        probability: 20,
        winProbability: 25,
        products: ['SolidWorks Professional (15 seats)', 'SolidWorks CAM Standard (5 seats)', 'HawkRidge CATIA Migration Services'],
        seatCount: 15,
        closeDate: new Date('2026-06-30'),
        nextMeetingDate: new Date('2026-02-20T15:00:00Z'),
        daysInStage: 14,
        healthScore: 52,
        meddic: {
          metrics: { score: 3, notes: 'Early stage. Engineering Manager Rachel Kim mentioned CATIA licensing costs are "painful" but no specific dollar figures captured. Need to build ROI model.' },
          economicBuyer: { score: 2, notes: 'VP Operations Tom Bradley identified as likely economic buyer but not yet engaged. Rachel Kim is our only contact. Need to map decision authority.' },
          decisionCriteria: { score: 3, notes: 'Preliminary: must handle high-tolerance parts (automotive), support CATIA file import, integrate with SAP PLM. Full criteria not documented.' },
          decisionProcess: { score: 2, notes: 'Unknown. Need to discover: Who makes software purchasing decisions? What is the approval process? Timeline for evaluation?' },
          identifyPain: { score: 5, notes: 'CATIA licensing costs are 2x SolidWorks for similar capability. Junior engineers struggle with CATIA complexity. But pain may not be severe enough to drive switch inertia.' },
          champion: { score: 4, notes: 'Rachel Kim (Engineering Manager) is interested but cautious. Not yet a true champion — needs to see proof of SolidWorks handling automotive tolerancing before she will advocate internally.' },
          overall: 32,
        },
        riskFactors: [
          {
            id: 'risk_004_1',
            category: 'champion',
            description: 'No confirmed champion — Rachel Kim is interested but not yet committed to advocating internally',
            severity: 'medium',
            detectedAt: new Date('2026-02-06'),
            mitigationAction: 'Provide Rachel with automotive-specific SolidWorks demo and customer references to build her confidence. Help her build internal business case.',
            isResolved: false,
          },
          {
            id: 'risk_004_2',
            category: 'decision_process',
            description: 'Decision process and economic buyer not yet mapped — risk of engaging wrong people or missing key influencer',
            severity: 'high',
            detectedAt: new Date('2026-02-06'),
            mitigationAction: 'Use discovery meeting on Feb 20 to explicitly map org chart and decision process. Ask Rachel who else needs to be involved.',
            isResolved: false,
          },
          {
            id: 'risk_004_3',
            category: 'technical',
            description: 'CATIA to SolidWorks migration for high-tolerance automotive parts is technically complex — potential deal breaker if accuracy is insufficient',
            severity: 'medium',
            detectedAt: new Date('2026-02-01'),
            mitigationAction: 'Arrange migration proof-of-concept with sample parts before formal evaluation. Involve HawkRidge CAM specialist.',
            isResolved: false,
          },
        ],
        competitors: [
          {
            competitorName: 'Dassault Systemes (CATIA)',
            threatLevel: 'medium',
            strengths: [
              'Incumbent — all existing designs are in CATIA format',
              'Deep automotive industry penetration and reputation',
              'Engineers already trained on CATIA',
            ],
            weaknesses: [
              'Very high licensing costs — roughly 2x SolidWorks per seat',
              'Over-featured for Precision Parts\' design complexity',
              'Poor support experience reported by Rachel Kim',
              'Steep learning curve for new hires',
            ],
            ourAdvantages: [
              'SolidWorks is significantly more cost-effective for their use case',
              'Easier to learn — reduces new hire onboarding from 3 months to 3 weeks',
              'HawkRidge provides CATIA-to-SolidWorks migration services with validated workflows',
              'SolidWorks CAM Standard provides integrated manufacturing prep that CATIA charges extra for',
            ],
            keyDifferentiators: [
              'Total annual savings of $60K+ in licensing costs alone',
              'HawkRidge local support vs Dassault remote-only support',
            ],
            objectionHandlers: [
              {
                objection: 'We have years of CATIA designs — migration is too risky',
                response: 'I completely understand that concern. That is why we offer a free migration proof-of-concept. We will convert 20 of your most critical parts and you validate the accuracy before committing. HawkRidge has migrated over 50 companies from CATIA to SolidWorks.',
              },
              {
                objection: 'CATIA is the automotive industry standard',
                response: 'CATIA is strong in OEMs, but for Tier-2 suppliers like Precision Parts, SolidWorks Professional provides all the tolerancing and surfacing capabilities you need at half the cost. Companies like BorgWarner and Magna use SolidWorks for similar component design work.',
              },
            ],
            incumbentProduct: 'CATIA V5',
            relationshipStrength: 'strong',
            lastMentionedAt: new Date('2026-02-06'),
            mentionedBy: 'stkh_004_1',
          },
        ],
        nextBestActions: [
          {
            id: 'nba_004_1',
            type: 'meeting',
            priority: 'high',
            title: 'Prepare for discovery meeting (Feb 20)',
            description: 'Prepare tailored demo showing SolidWorks Professional handling automotive tolerancing. Include CATIA file import demonstration. Map org chart and decision process.',
            aiReasoning: 'This is only our second meeting with Precision Parts. The discovery call needs to accomplish two things: (1) prove SolidWorks technical viability for automotive parts, and (2) map the buying process and identify the economic buyer. Come prepared with automotive case studies.',
            targetStakeholderId: 'stkh_004_1',
            dueDate: new Date('2026-02-19'),
            isCompleted: false,
            createdAt: new Date('2026-02-10'),
          },
          {
            id: 'nba_004_2',
            type: 'research',
            priority: 'medium',
            title: 'Research VP Operations Tom Bradley on LinkedIn',
            description: 'Research Tom Bradley\'s background, priorities, and any public statements about engineering technology. Prepare to engage him after discovery meeting if Rachel opens the door.',
            aiReasoning: 'VP Operations is likely the economic buyer for a $95K software decision at a $50-80M company. Understanding his priorities before engaging helps frame our value proposition in operational terms (efficiency, cost reduction) rather than pure engineering terms.',
            targetStakeholderId: 'stkh_004_2',
            dueDate: new Date('2026-02-18'),
            isCompleted: false,
            createdAt: new Date('2026-02-10'),
          },
          {
            id: 'nba_004_3',
            type: 'email',
            priority: 'medium',
            title: 'Send automotive customer case studies to Rachel Kim',
            description: 'Email Rachel 2-3 case studies of automotive parts manufacturers who migrated from CATIA to SolidWorks. Include tolerancing and quality metrics.',
            aiReasoning: 'Rachel needs proof that SolidWorks can handle automotive tolerancing before she will champion this internally. Case studies from similar companies are the most persuasive evidence at this stage. Send before Feb 20 meeting so she has time to review.',
            targetStakeholderId: 'stkh_004_1',
            dueDate: new Date('2026-02-17'),
            isCompleted: false,
            createdAt: new Date('2026-02-10'),
          },
        ],
        stageHistory: [
          { stage: 'discovery', enteredAt: new Date('2026-01-29') },
        ],
        ownerId: 'user_ae_001',
        dealNotes: 'Early-stage opportunity. Rachel Kim is warm but not yet a champion. CATIA lock-in and migration risk are main barriers. Need to prove technical viability and identify economic buyer before advancing to qualification.',
        createdAt: new Date('2026-01-29'),
        updatedAt: new Date('2026-02-06'),
      },
    ];

    for (const deal of deals) {
      this.deals.set(deal.id, deal);
      const accountDeals = this.dealsByAccount.get(deal.accountId) || [];
      accountDeals.push(deal.id);
      this.dealsByAccount.set(deal.accountId, accountDeals);
    }
  }

  // ─── Stakeholders ────────────────────────────────────────────

  private seedStakeholders(): void {
    const stakeholders: Stakeholder[] = [
      // ── Acme Aerospace Stakeholders ──────────────────────────
      {
        id: 'stkh_001_1',
        accountId: 'acct_001',
        dealId: 'deal_001',
        name: 'Sarah Mitchell',
        title: 'VP Engineering',
        email: 'sarah.mitchell@acmeaerospace.com',
        phone: '+1-408-555-0101',
        linkedinUrl: 'https://linkedin.com/in/sarahmitchell-eng',
        roles: ['champion', 'decision_maker'],
        isPrimary: true,
        influenceLevel: 9,
        sentiment: 'strong_advocate',
        sentimentTrend: 'stable',
        lastContactedAt: new Date('2026-02-10'),
        contactFrequency: 'weekly',
        preferredChannel: 'phone',
        notes: 'Joined from Boeing 2 months ago. Has deep SolidWorks experience from Boeing. Actively championing our solution internally. Wants to make her mark with the simulation upgrade.',
        priorities: [
          'Reduce FEA validation cycle from 2 weeks to 2 days',
          'Support additive manufacturing expansion',
          'Standardize simulation tools across 3 facilities',
        ],
        objections: [],
        createdAt: new Date('2025-10-15'),
        updatedAt: new Date('2026-02-10'),
      },
      {
        id: 'stkh_001_2',
        accountId: 'acct_001',
        dealId: 'deal_001',
        name: 'Robert Yang',
        title: 'Chief Financial Officer',
        email: 'robert.yang@acmeaerospace.com',
        phone: '+1-408-555-0102',
        roles: ['economic_buyer'],
        isPrimary: false,
        influenceLevel: 10,
        sentiment: 'neutral',
        sentimentTrend: 'stable',
        lastContactedAt: new Date('2026-02-04'),
        contactFrequency: 'monthly',
        preferredChannel: 'email',
        reportsTo: undefined,
        notes: 'Analytical and data-driven. Approved budget in principle but wants to see competitive pricing. Mentioned ANSYS offered 20% discount. Cares about ROI and payment terms.',
        priorities: [
          'Maximize ROI on all capital expenditures',
          'Negotiate best possible pricing and payment terms',
          'Ensure technology investments align with 3-year strategic plan',
        ],
        objections: [
          'ANSYS offered a 20% discount — need competitive pricing',
          'Wants extended payment terms (net-60 or quarterly)',
        ],
        createdAt: new Date('2025-12-15'),
        updatedAt: new Date('2026-02-08'),
      },
      {
        id: 'stkh_001_3',
        accountId: 'acct_001',
        dealId: 'deal_001',
        name: 'James Liu',
        title: 'Senior Design Engineer',
        email: 'james.liu@acmeaerospace.com',
        phone: '+1-408-555-0103',
        roles: ['technical_evaluator', 'end_user'],
        isPrimary: false,
        influenceLevel: 6,
        sentiment: 'supportive',
        sentimentTrend: 'improving',
        lastContactedAt: new Date('2026-02-06'),
        contactFrequency: 'biweekly',
        preferredChannel: 'email',
        reportsTo: 'stkh_001_1',
        notes: 'Ran the hands-on technical evaluation. Initially skeptical about SolidWorks Simulation vs ANSYS solver accuracy. After the demo, his concerns were addressed. Also evaluated PTC Creo for AM workflows but preferred SolidWorks integration.',
        priorities: [
          'Simulation accuracy for aerospace-grade stress analysis',
          'Seamless CAD-to-simulation workflow',
          'Support for additive manufacturing design validation',
        ],
        objections: [
          'Concerned about nonlinear solver accuracy vs ANSYS (mostly addressed in demo)',
        ],
        createdAt: new Date('2025-12-12'),
        updatedAt: new Date('2026-02-06'),
      },

      // ── GlobalFab Industries Stakeholders ────────────────────
      {
        id: 'stkh_002_1',
        accountId: 'acct_002',
        dealId: 'deal_002',
        name: 'Michael Torres',
        title: 'Director of Product Development',
        email: 'mtorres@globalfab.io',
        phone: '+1-312-555-0201',
        linkedinUrl: 'https://linkedin.com/in/michaeltorres-mfg',
        roles: ['champion', 'influencer'],
        isPrimary: true,
        influenceLevel: 7,
        sentiment: 'supportive',
        sentimentTrend: 'declining',
        lastContactedAt: new Date('2026-01-25'),
        contactFrequency: 'biweekly',
        preferredChannel: 'email',
        notes: 'Was our primary champion but has gone silent for 14 days. Last conversation was positive — discussed PDM needs. Silence may be due to internal politics with new CTO or shifting priorities. Need to re-engage urgently.',
        priorities: [
          'Implement PDM to fix file management issues',
          'Maintain SolidWorks as standard to avoid retraining team',
          'Modernize engineering workflows',
        ],
        objections: [],
        createdAt: new Date('2025-08-10'),
        updatedAt: new Date('2026-01-25'),
      },
      {
        id: 'stkh_002_2',
        accountId: 'acct_002',
        dealId: 'deal_002',
        name: 'Anita Patel',
        title: 'Chief Technology Officer',
        email: 'apatel@globalfab.io',
        phone: '+1-312-555-0202',
        linkedinUrl: 'https://linkedin.com/in/anitapatel-cto',
        roles: ['economic_buyer', 'decision_maker'],
        isPrimary: false,
        influenceLevel: 10,
        sentiment: 'neutral',
        sentimentTrend: 'stable',
        lastContactedAt: undefined,
        contactFrequency: 'never',
        preferredChannel: 'email',
        notes: 'New CTO, hired from Caterpillar in November 2025. Have not yet engaged directly. Unknown vendor preferences and priorities. Michael Torres was supposed to introduce us but went silent before that happened.',
        priorities: [
          'Evaluate all engineering tools as part of technology strategy',
          'Consolidate vendor relationships where possible',
          'Digital transformation of manufacturing operations',
        ],
        objections: [],
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-02-08'),
      },
      {
        id: 'stkh_002_3',
        accountId: 'acct_002',
        dealId: 'deal_002',
        name: 'James Park',
        title: 'Engineering Manager',
        email: 'jpark@globalfab.io',
        phone: '+1-312-555-0203',
        roles: ['technical_evaluator', 'end_user'],
        isPrimary: false,
        influenceLevel: 5,
        sentiment: 'supportive',
        sentimentTrend: 'stable',
        lastContactedAt: new Date('2026-01-30'),
        contactFrequency: 'monthly',
        preferredChannel: 'phone',
        reportsTo: 'stkh_002_1',
        notes: 'Hands-on engineering manager who runs the daily SolidWorks workflows. Supportive of SolidWorks renewal but frustrated by lack of PDM. Good secondary contact if Michael stays silent.',
        priorities: [
          'Resolve file management and version control issues',
          'Ensure training for 10 new engineers joining in Q2',
          'Maintain productivity during any tool transitions',
        ],
        objections: [],
        createdAt: new Date('2025-09-20'),
        updatedAt: new Date('2026-01-30'),
      },
      {
        id: 'stkh_002_4',
        accountId: 'acct_002',
        dealId: 'deal_002',
        name: 'Kevin Wu',
        title: 'IT Director',
        email: 'kwu@globalfab.io',
        phone: '+1-312-555-0204',
        roles: ['blocker', 'influencer'],
        isPrimary: false,
        influenceLevel: 7,
        sentiment: 'skeptical',
        sentimentTrend: 'stable',
        lastContactedAt: new Date('2026-01-28'),
        contactFrequency: 'monthly',
        preferredChannel: 'email',
        reportsTo: 'stkh_002_2',
        notes: 'Pushing for Siemens NX due to native Teamcenter integration. Came from a Siemens shop. Has the ear of the new CTO. Need to address his PLM integration concerns or he will block the deal.',
        priorities: [
          'Standardize on integrated PLM platform',
          'Minimize IT support burden for engineering tools',
          'Ensure cybersecurity compliance for all engineering data',
        ],
        objections: [
          'SolidWorks PDM does not integrate natively with Teamcenter',
          'Prefers Siemens unified platform for reduced IT overhead',
          'Concerned about SolidWorks data security for defense-adjacent work',
        ],
        createdAt: new Date('2025-11-25'),
        updatedAt: new Date('2026-01-28'),
      },

      // ── Nova Engineering Stakeholders ────────────────────────
      {
        id: 'stkh_003_1',
        accountId: 'acct_003',
        dealId: 'deal_003',
        name: 'David Park',
        title: 'CTO & Co-Founder',
        email: 'dpark@novaengineering.com',
        phone: '+1-617-555-0301',
        linkedinUrl: 'https://linkedin.com/in/davidpark-nova',
        roles: ['champion', 'economic_buyer', 'decision_maker'],
        isPrimary: true,
        influenceLevel: 10,
        sentiment: 'strong_advocate',
        sentimentTrend: 'improving',
        lastContactedAt: new Date('2026-02-11'),
        contactFrequency: 'weekly',
        preferredChannel: 'phone',
        notes: 'Exceptional champion. CTO and co-founder with full budget authority. Personally driving the SolidWorks standardization initiative. Has shot down internal advocates for staying with Autodesk. Wants to close by mid-March for Austin office opening.',
        priorities: [
          'Standardize engineering tools across Boston and Austin offices',
          'Reduce tool-related collaboration failures',
          'Scale from 50 to 100 engineers by end of 2026',
        ],
        objections: [],
        createdAt: new Date('2025-11-15'),
        updatedAt: new Date('2026-02-11'),
      },
      {
        id: 'stkh_003_2',
        accountId: 'acct_003',
        dealId: 'deal_003',
        name: 'Priya Sharma',
        title: 'Head of Engineering',
        email: 'psharma@novaengineering.com',
        phone: '+1-617-555-0302',
        roles: ['technical_evaluator', 'influencer'],
        isPrimary: false,
        influenceLevel: 7,
        sentiment: 'supportive',
        sentimentTrend: 'stable',
        lastContactedAt: new Date('2026-02-07'),
        contactFrequency: 'biweekly',
        preferredChannel: 'email',
        reportsTo: 'stkh_003_1',
        notes: 'Led the technical evaluation. Supportive of SolidWorks but wants to validate Inventor file migration accuracy before signing. Has 15 years of Inventor experience — wants assurance that migration will not lose parametric history.',
        priorities: [
          'Ensure zero data loss in Inventor-to-SolidWorks migration',
          'Maintain engineering productivity during transition',
          'Validate simulation accuracy for client deliverables',
        ],
        objections: [
          'Wants proof of Inventor-to-SolidWorks migration accuracy',
          'Concerned about learning curve for Inventor-trained engineers',
        ],
        createdAt: new Date('2025-12-10'),
        updatedAt: new Date('2026-02-07'),
      },
      {
        id: 'stkh_003_3',
        accountId: 'acct_003',
        dealId: 'deal_003',
        name: 'Lisa Chen',
        title: 'Procurement Lead',
        email: 'lchen@novaengineering.com',
        phone: '+1-617-555-0303',
        roles: ['procurement'],
        isPrimary: false,
        influenceLevel: 4,
        sentiment: 'neutral',
        sentimentTrend: 'stable',
        lastContactedAt: new Date('2026-02-05'),
        contactFrequency: 'monthly',
        preferredChannel: 'email',
        reportsTo: 'stkh_003_1',
        notes: 'Process-oriented procurement lead. Requires 3 competitive quotes per company policy. Will handle contract negotiation and legal review. Not a blocker but will slow the process if requirements are not met. 5-7 business day review cycle.',
        priorities: [
          'Obtain 3 competitive quotes for compliance',
          'Negotiate favorable payment terms',
          'Ensure contract includes SLA for support response times',
        ],
        objections: [
          'Requires 3 competitive quotes per procurement policy',
          'Contract must include SLA guarantees for support',
        ],
        createdAt: new Date('2026-01-20'),
        updatedAt: new Date('2026-02-05'),
      },

      // ── Precision Parts Co Stakeholders ──────────────────────
      {
        id: 'stkh_004_1',
        accountId: 'acct_004',
        dealId: 'deal_004',
        name: 'Rachel Kim',
        title: 'Engineering Manager',
        email: 'rachel.kim@precisionparts.com',
        phone: '+1-313-555-0401',
        linkedinUrl: 'https://linkedin.com/in/rachelkim-eng',
        roles: ['technical_evaluator', 'influencer'],
        isPrimary: true,
        influenceLevel: 6,
        sentiment: 'supportive',
        sentimentTrend: 'stable',
        lastContactedAt: new Date('2026-02-06'),
        contactFrequency: 'biweekly',
        preferredChannel: 'email',
        notes: 'Initial contact. Interested in SolidWorks as CATIA alternative but cautious about migration risk. Manages 15-person engineering team. Has 8 years CATIA experience. Open to exploring but needs strong proof of SolidWorks handling automotive tolerancing. Not yet a champion — needs more convincing.',
        priorities: [
          'Reduce CAD licensing costs',
          'Hire and onboard junior engineers faster (CATIA training takes too long)',
          'Maintain precision tolerancing capabilities for automotive clients',
        ],
        objections: [
          'CATIA is the automotive industry standard — risk of moving away',
          'Concerned about migration accuracy for critical tolerance parts',
          'Team resistance to learning new software',
        ],
        createdAt: new Date('2026-01-29'),
        updatedAt: new Date('2026-02-06'),
      },
      {
        id: 'stkh_004_2',
        accountId: 'acct_004',
        dealId: 'deal_004',
        name: 'Tom Bradley',
        title: 'VP Operations',
        email: 'tbradley@precisionparts.com',
        phone: '+1-313-555-0402',
        roles: ['economic_buyer'],
        isPrimary: false,
        influenceLevel: 9,
        sentiment: 'neutral',
        sentimentTrend: 'stable',
        lastContactedAt: undefined,
        contactFrequency: 'never',
        preferredChannel: 'phone',
        reportsTo: undefined,
        notes: 'Not yet engaged. Likely economic buyer for $95K purchase. Background in operations — will care about productivity metrics and cost reduction rather than technical features. Need introduction through Rachel Kim.',
        priorities: [
          'Operational efficiency and cost reduction',
          'Support rapid scaling of engineering team',
          'Maintain Toyota/Honda quality standards',
        ],
        objections: [],
        createdAt: new Date('2026-02-06'),
        updatedAt: new Date('2026-02-06'),
      },
    ];

    for (const stakeholder of stakeholders) {
      this.stakeholders.set(stakeholder.id, stakeholder);
      const dealStakeholders = this.stakeholdersByDeal.get(stakeholder.dealId) || [];
      dealStakeholders.push(stakeholder.id);
      this.stakeholdersByDeal.set(stakeholder.dealId, dealStakeholders);
      const acctStakeholders = this.stakeholdersByAccount.get(stakeholder.accountId) || [];
      acctStakeholders.push(stakeholder.id);
      this.stakeholdersByAccount.set(stakeholder.accountId, acctStakeholders);
    }
  }

  // ─── Activities ──────────────────────────────────────────────

  private seedActivities(): void {
    const activities: Activity[] = [
      // ── Acme Aerospace Activities ────────────────────────────
      {
        id: 'act_001_01',
        dealId: 'deal_001',
        accountId: 'acct_001',
        stakeholderId: 'stkh_001_1',
        type: 'call',
        direction: 'outbound',
        subject: 'Discovery call with Sarah Mitchell',
        summary: 'Initial discovery call with Sarah Mitchell (VP Engineering). She described Acme\'s additive manufacturing expansion and the bottleneck in FEA validation — currently taking 2 weeks per part. She has budget approved for Q1 tool upgrades and is familiar with SolidWorks from her Boeing days. Very positive conversation — agreed to move to formal evaluation.',
        sentiment: 0.8,
        keyInsights: ['Budget approved for Q1', 'FEA bottleneck is critical pain point', 'Sarah has SolidWorks experience from Boeing'],
        actionItems: ['Send SolidWorks Simulation overview', 'Schedule technical evaluation with James Liu'],
        buyingSignals: ['Budget approved', 'Timeline urgency — DoD contract volume increasing'],
        duration: 1800,
        outcome: 'connected',
        talkRatio: 0.35,
        occurredAt: new Date('2025-10-20T15:00:00Z'),
        createdAt: new Date('2025-10-20T15:30:00Z'),
      },
      {
        id: 'act_001_02',
        dealId: 'deal_001',
        accountId: 'acct_001',
        stakeholderId: 'stkh_001_3',
        type: 'meeting',
        direction: 'outbound',
        subject: 'SolidWorks Simulation Technical Demo',
        summary: 'Full technical demo of SolidWorks Simulation Professional for James Liu (Sr Design Engineer) and Sarah Mitchell. Demonstrated FEA workflow on an aerospace bracket similar to their DoD contract parts. James was initially skeptical about nonlinear solver accuracy but the benchmark results from our aerospace customer Horizon convinced him. Sarah was very engaged. James mentioned a colleague was also looking at PTC Creo for additive manufacturing — need to monitor. Demo was well-received overall.',
        sentiment: 0.7,
        keyInsights: ['James initially skeptical but won over by benchmarks', 'PTC Creo being evaluated by AM team member', 'Both stakeholders aligned after demo'],
        actionItems: ['Send benchmark data and test files', 'Address Creo AM comparison', 'Schedule CFO meeting'],
        buyingSignals: ['Asked about implementation timeline', 'Requested pricing information'],
        competitorsMentioned: ['ANSYS', 'PTC Creo'],
        duration: 5400,
        outcome: 'completed',
        occurredAt: new Date('2025-12-18T14:00:00Z'),
        createdAt: new Date('2025-12-18T15:30:00Z'),
      },
      {
        id: 'act_001_03',
        dealId: 'deal_001',
        accountId: 'acct_001',
        type: 'stage_change',
        subject: 'Stage: Qualification to Technical Evaluation',
        summary: 'Deal advanced to Technical Evaluation after successful qualification. Sarah Mitchell confirmed budget and timeline. Technical demo scheduled.',
        fromStage: 'qualification',
        toStage: 'technical_evaluation',
        occurredAt: new Date('2025-12-12T10:00:00Z'),
        createdAt: new Date('2025-12-12T10:00:00Z'),
      },
      {
        id: 'act_001_04',
        dealId: 'deal_001',
        accountId: 'acct_001',
        stakeholderId: 'stkh_001_2',
        type: 'meeting',
        direction: 'outbound',
        subject: 'CFO Robert Yang — ROI and Pricing Discussion',
        summary: 'Met with CFO Robert Yang and Sarah Mitchell to present ROI model and initial pricing. Robert was engaged — asked detailed questions about the $340K/yr productivity gain calculation. He accepted the ROI methodology. However, he revealed that ANSYS had submitted a counter-proposal with a 20% discount and asked us to be competitive. He wants to see a side-by-side comparison. Requested extended payment terms (quarterly billing). Sarah continued to advocate strongly for SolidWorks throughout.',
        sentiment: 0.4,
        keyInsights: ['CFO accepts ROI model', 'ANSYS counter-proposal at 20% discount', 'Wants payment term flexibility'],
        actionItems: ['Build TCO comparison vs ANSYS', 'Get internal approval for discount structure', 'Propose quarterly payment plan'],
        competitorsMentioned: ['ANSYS'],
        buyingSignals: ['CFO engaged in detailed ROI discussion', 'Discussing payment terms indicates intent to buy'],
        duration: 3600,
        outcome: 'completed',
        occurredAt: new Date('2026-02-04T16:00:00Z'),
        createdAt: new Date('2026-02-04T17:00:00Z'),
      },
      {
        id: 'act_001_05',
        dealId: 'deal_001',
        accountId: 'acct_001',
        type: 'stage_change',
        subject: 'Stage: Proposal to Negotiation',
        summary: 'Deal moved to Negotiation. CFO engaged on pricing, champion aligned. Key hurdle is competitive pricing vs ANSYS counter-proposal.',
        fromStage: 'proposal',
        toStage: 'negotiation',
        occurredAt: new Date('2026-02-04T17:30:00Z'),
        createdAt: new Date('2026-02-04T17:30:00Z'),
      },
      {
        id: 'act_001_06',
        dealId: 'deal_001',
        accountId: 'acct_001',
        stakeholderId: 'stkh_001_1',
        type: 'email',
        direction: 'outbound',
        subject: 'RE: Acme Aerospace — SolidWorks Proposal Follow-up',
        summary: 'Sent follow-up email to Sarah Mitchell with revised proposal summary highlighting key differentiators vs ANSYS. Included customer testimonial from Horizon Aerospace. Sarah replied within 2 hours confirming she will present to Robert before our Feb 14 meeting.',
        sentiment: 0.6,
        keyInsights: ['Sarah actively selling internally', 'Quick response shows high engagement'],
        buyingSignals: ['Champion proactively presenting to economic buyer'],
        emailOpened: true,
        emailReplied: true,
        occurredAt: new Date('2026-02-06T09:00:00Z'),
        createdAt: new Date('2026-02-06T09:00:00Z'),
      },
      {
        id: 'act_001_07',
        dealId: 'deal_001',
        accountId: 'acct_001',
        stakeholderId: 'stkh_001_1',
        type: 'call',
        direction: 'outbound',
        subject: 'Weekly check-in with Sarah Mitchell',
        summary: 'Quick check-in call with Sarah. She confirmed Robert is reviewing our proposal and the ANSYS counter-proposal side by side. Sarah is confident but said Robert is "doing his due diligence." She mentioned the legal team will need 1 week for contract review once pricing is agreed. Confirmed Feb 14 meeting is on the calendar. Sarah will push for a decision by end of February.',
        sentiment: 0.7,
        keyInsights: ['CFO comparing proposals side by side', 'Legal review needs 1 week', 'Champion pushing for February decision'],
        actionItems: ['Prepare TCO doc for Feb 14', 'Draft contract for legal parallel track'],
        duration: 900,
        outcome: 'connected',
        talkRatio: 0.4,
        occurredAt: new Date('2026-02-10T11:00:00Z'),
        createdAt: new Date('2026-02-10T11:15:00Z'),
      },

      // ── GlobalFab Industries Activities ──────────────────────
      {
        id: 'act_002_01',
        dealId: 'deal_002',
        accountId: 'acct_002',
        stakeholderId: 'stkh_002_1',
        type: 'call',
        direction: 'outbound',
        subject: 'Discovery call with Michael Torres',
        summary: 'Initial discovery call with Michael Torres (Director of Product Development). He described ongoing file management issues — engineers frequently overwriting each other\'s work due to no PDM system. SolidWorks license renewal coming up in April. He wants to add PDM this time. 60+ engineers affected. Positive and enthusiastic conversation. Agreed to schedule a technical demo.',
        sentiment: 0.7,
        keyInsights: ['File management is critical pain', 'Renewal timing creates urgency', '60+ engineers affected'],
        actionItems: ['Send PDM overview materials', 'Schedule technical demo'],
        buyingSignals: ['License renewal approaching', 'Proactive outreach from customer side'],
        duration: 2100,
        outcome: 'connected',
        talkRatio: 0.3,
        occurredAt: new Date('2025-08-15T14:00:00Z'),
        createdAt: new Date('2025-08-15T14:35:00Z'),
      },
      {
        id: 'act_002_02',
        dealId: 'deal_002',
        accountId: 'acct_002',
        stakeholderId: 'stkh_002_3',
        type: 'meeting',
        direction: 'outbound',
        subject: 'SolidWorks PDM Technical Demo',
        summary: 'PDM demo for James Park (Engineering Manager) and Michael Torres. James was very positive — said "this would solve 80% of our daily headaches." Demonstrated version control, check-in/check-out, and BOM management. Michael asked about Teamcenter integration, flagging IT Director Kevin Wu\'s preference for Siemens NX. First mention of internal competition. James agreed to run a pilot with 5 users.',
        sentiment: 0.6,
        keyInsights: ['Engineering Manager very enthusiastic about PDM', 'IT Director pushing for Siemens NX', 'Teamcenter integration is a requirement for IT'],
        actionItems: ['Prepare PDM pilot plan', 'Research Teamcenter integration options', 'Schedule meeting with IT Director'],
        competitorsMentioned: ['Siemens NX'],
        buyingSignals: ['Agreed to pilot', 'Engineering team enthusiastic'],
        duration: 4200,
        outcome: 'completed',
        occurredAt: new Date('2025-10-22T10:00:00Z'),
        createdAt: new Date('2025-10-22T11:10:00Z'),
      },
      {
        id: 'act_002_03',
        dealId: 'deal_002',
        accountId: 'acct_002',
        stakeholderId: 'stkh_002_4',
        type: 'meeting',
        direction: 'outbound',
        subject: 'IT Director Kevin Wu — PLM Integration Discussion',
        summary: 'Meeting with IT Director Kevin Wu to discuss PLM requirements. Kevin was direct — he prefers Siemens NX because of native Teamcenter integration. He came from a Siemens shop and is familiar with the platform. I presented the SolidWorks PDM to Teamcenter API bridge option but he was skeptical. He said he would "present both options to the new CTO." Not hostile but clearly favors the competition. Need to address his concerns more directly with a technical proof of concept.',
        sentiment: -0.1,
        keyInsights: ['IT Director prefers Siemens', 'Will present both options to CTO', 'API bridge approach met with skepticism'],
        actionItems: ['Prepare Teamcenter integration technical brief', 'Engage HawkRidge Solutions Architect for POC'],
        competitorsMentioned: ['Siemens NX'],
        duration: 2700,
        outcome: 'completed',
        occurredAt: new Date('2025-11-15T15:00:00Z'),
        createdAt: new Date('2025-11-15T15:45:00Z'),
      },
      {
        id: 'act_002_04',
        dealId: 'deal_002',
        accountId: 'acct_002',
        type: 'stage_change',
        subject: 'Stage: Qualification to Technical Evaluation',
        summary: 'Deal moved to Technical Evaluation. PDM pilot approved by Michael Torres. Competing against Siemens NX for platform decision.',
        fromStage: 'qualification',
        toStage: 'technical_evaluation',
        occurredAt: new Date('2025-11-20T09:00:00Z'),
        createdAt: new Date('2025-11-20T09:00:00Z'),
      },
      {
        id: 'act_002_05',
        dealId: 'deal_002',
        accountId: 'acct_002',
        stakeholderId: 'stkh_002_1',
        type: 'call',
        direction: 'outbound',
        subject: 'Check-in with Michael Torres — CTO introduction',
        summary: 'Called Michael to discuss introducing us to the new CTO Anita Patel. Michael was positive but said "the timing isn\'t right yet — Anita is still getting settled." He committed to making the introduction "in the next couple of weeks." This was 3 weeks ago — the introduction never happened and Michael has since gone silent.',
        sentiment: 0.3,
        keyInsights: ['CTO introduction delayed', 'Michael still supportive but non-committal on timeline'],
        actionItems: ['Follow up in 2 weeks on CTO intro', 'Prepare executive-level pitch for CTO'],
        duration: 720,
        outcome: 'connected',
        talkRatio: 0.45,
        occurredAt: new Date('2026-01-18T11:00:00Z'),
        createdAt: new Date('2026-01-18T11:12:00Z'),
      },
      {
        id: 'act_002_06',
        dealId: 'deal_002',
        accountId: 'acct_002',
        stakeholderId: 'stkh_002_1',
        type: 'email',
        direction: 'outbound',
        subject: 'Following up: CTO Introduction + Renewal Timeline',
        summary: 'Sent follow-up email to Michael Torres about the CTO introduction and renewal timeline. No response. This was the second unanswered email in a row.',
        sentiment: 0,
        emailOpened: true,
        emailReplied: false,
        occurredAt: new Date('2026-01-25T10:00:00Z'),
        createdAt: new Date('2026-01-25T10:00:00Z'),
      },
      {
        id: 'act_002_07',
        dealId: 'deal_002',
        accountId: 'acct_002',
        stakeholderId: 'stkh_002_1',
        type: 'call',
        direction: 'outbound',
        subject: 'Attempted call to Michael Torres',
        summary: 'Attempted to reach Michael Torres by phone. Call went to voicemail. Left message referencing the April renewal deadline and offered to schedule a brief call at his convenience. No callback received.',
        sentiment: -0.2,
        duration: 45,
        outcome: 'voicemail',
        talkRatio: 1.0,
        occurredAt: new Date('2026-01-30T14:00:00Z'),
        createdAt: new Date('2026-01-30T14:01:00Z'),
      },
      {
        id: 'act_002_08',
        dealId: 'deal_002',
        accountId: 'acct_002',
        stakeholderId: 'stkh_002_1',
        type: 'email',
        direction: 'outbound',
        subject: 'RE: GlobalFab SolidWorks Renewal — New PDM Value Analysis',
        summary: 'Sent third outreach attempt to Michael Torres with new PDM value analysis showing $120K annual productivity gain from eliminating file management issues. Included customer case study from similar manufacturer. Email was opened but not replied to.',
        sentiment: -0.1,
        keyInsights: ['Email opened but no response — Michael is seeing our messages but choosing not to engage'],
        emailOpened: true,
        emailReplied: false,
        occurredAt: new Date('2026-02-05T09:30:00Z'),
        createdAt: new Date('2026-02-05T09:30:00Z'),
      },

      // ── Nova Engineering Activities ──────────────────────────
      {
        id: 'act_003_01',
        dealId: 'deal_003',
        accountId: 'acct_003',
        stakeholderId: 'stkh_003_1',
        type: 'call',
        direction: 'inbound',
        subject: 'Inbound call from David Park — Platform Standardization',
        summary: 'David Park (CTO) called us directly after researching HawkRidge online. He described Nova\'s rapid growth and the chaos of running mixed Inventor/Fusion 360 across 2 offices. He wants to standardize on a single platform before opening the Austin office. Has budget from Series A. Asked about enterprise licensing, migration services, and training. Very direct and decisive — this is a CTO who is ready to buy. Immediately scheduled a follow-up demo.',
        sentiment: 0.9,
        keyInsights: ['Inbound call — highest intent signal', 'Series A funding available', 'Austin office opening drives timeline', 'CTO personally driving initiative'],
        actionItems: ['Schedule demo within 1 week', 'Prepare enterprise pricing', 'Research Inventor migration tools'],
        buyingSignals: ['Inbound contact', 'Budget available', 'Specific timeline (Austin opening)', 'Decision maker directly engaged'],
        duration: 1500,
        outcome: 'connected',
        talkRatio: 0.25,
        occurredAt: new Date('2025-11-18T09:30:00Z'),
        createdAt: new Date('2025-11-18T09:55:00Z'),
      },
      {
        id: 'act_003_02',
        dealId: 'deal_003',
        accountId: 'acct_003',
        stakeholderId: 'stkh_003_2',
        type: 'meeting',
        direction: 'outbound',
        subject: 'Technical Evaluation — SolidWorks Enterprise Demo',
        summary: 'Full enterprise demo for David Park, Priya Sharma (Head of Engineering), and 3 senior engineers. Demonstrated SolidWorks Premium modeling, PDM collaboration across sites, and Simulation Standard. Priya was thorough — asked detailed questions about Inventor file migration and parametric history preservation. David was visibly impressed with the multi-site PDM workflow. Engineers asked about training timeline. Overall very positive — David said "this is exactly what we need." Priya wants a migration pilot before final sign-off.',
        sentiment: 0.85,
        keyInsights: ['CTO explicitly said "this is exactly what we need"', 'Priya wants migration pilot', 'Multi-site PDM demo was the highlight', 'Engineers asking about training = buying intent'],
        actionItems: ['Schedule migration pilot with Priya', 'Prepare formal proposal', 'Include training plan in proposal'],
        buyingSignals: ['CTO quote: "this is exactly what we need"', 'Team asking about implementation timeline'],
        duration: 7200,
        outcome: 'completed',
        occurredAt: new Date('2026-01-10T10:00:00Z'),
        createdAt: new Date('2026-01-10T12:00:00Z'),
      },
      {
        id: 'act_003_03',
        dealId: 'deal_003',
        accountId: 'acct_003',
        type: 'stage_change',
        subject: 'Stage: Technical Evaluation to Proposal',
        summary: 'Deal advanced to Proposal. Technical evaluation completed successfully. CTO requested formal proposal with pricing for 50-seat enterprise deployment.',
        fromStage: 'technical_evaluation',
        toStage: 'proposal',
        occurredAt: new Date('2026-02-01T09:00:00Z'),
        createdAt: new Date('2026-02-01T09:00:00Z'),
      },
      {
        id: 'act_003_04',
        dealId: 'deal_003',
        accountId: 'acct_003',
        stakeholderId: 'stkh_003_3',
        type: 'email',
        direction: 'inbound',
        subject: 'RE: Nova Engineering — SolidWorks Enterprise Proposal Process',
        summary: 'Lisa Chen (Procurement Lead) emailed requesting formal RFQ process details. She needs 3 competitive quotes per company policy. Asked about payment terms, SLA for support response times, and contract flexibility for adding seats mid-term. Professional and straightforward — standard procurement process.',
        sentiment: 0.3,
        keyInsights: ['Procurement engaged — deal is moving through official buying process', '3 competitive quotes required', 'Need to address SLA and contract flexibility'],
        emailOpened: true,
        emailReplied: false,
        occurredAt: new Date('2026-02-05T11:00:00Z'),
        createdAt: new Date('2026-02-05T11:00:00Z'),
      },
      {
        id: 'act_003_05',
        dealId: 'deal_003',
        accountId: 'acct_003',
        stakeholderId: 'stkh_003_1',
        type: 'call',
        direction: 'outbound',
        subject: 'Proposal review prep with David Park',
        summary: 'Called David to align on proposal review meeting (Feb 18). He confirmed he wants to present our proposal to the leadership team on Feb 20. He asked for the proposal by Feb 17 EOD. David mentioned that Austin office opening moved to March 15 but he still wants to close the deal by mid-March. He reiterated that Autodesk "isn\'t even in the running anymore" — he wants SolidWorks. Very confident tone. Asked about phased rollout option for Austin office.',
        sentiment: 0.9,
        keyInsights: ['CTO presenting proposal to leadership Feb 20', 'Autodesk not in contention per CTO', 'Austin office timeline shifted to March 15', 'Wants phased rollout'],
        actionItems: ['Finalize proposal by Feb 17 EOD', 'Add phased rollout option to proposal', 'Include Austin deployment plan'],
        buyingSignals: ['CTO will present to leadership', 'Autodesk eliminated', 'Discussing implementation details'],
        duration: 1200,
        outcome: 'connected',
        talkRatio: 0.3,
        occurredAt: new Date('2026-02-11T15:00:00Z'),
        createdAt: new Date('2026-02-11T15:20:00Z'),
      },
      {
        id: 'act_003_06',
        dealId: 'deal_003',
        accountId: 'acct_003',
        stakeholderId: 'stkh_003_2',
        type: 'email',
        direction: 'outbound',
        subject: 'Migration Pilot — Sample File Set Request',
        summary: 'Emailed Priya Sharma requesting a set of 50 representative Inventor files for the migration pilot. Explained we will convert them and provide a quality report showing parametric history preservation, feature accuracy, and any manual adjustments needed. Priya responded same day with the file set and a list of "must-pass" accuracy criteria.',
        sentiment: 0.5,
        keyInsights: ['Priya very responsive — same-day turnaround', 'Has specific accuracy criteria = serious evaluation'],
        actionItems: ['Run migration pilot on 50 files', 'Generate quality report'],
        buyingSignals: ['Quick stakeholder response', 'Detailed evaluation criteria shared'],
        emailOpened: true,
        emailReplied: true,
        occurredAt: new Date('2026-02-07T08:30:00Z'),
        createdAt: new Date('2026-02-07T08:30:00Z'),
      },

      // ── Precision Parts Co Activities ────────────────────────
      {
        id: 'act_004_01',
        dealId: 'deal_004',
        accountId: 'acct_004',
        stakeholderId: 'stkh_004_1',
        type: 'email',
        direction: 'inbound',
        subject: 'Interest in SolidWorks — CATIA Alternative',
        summary: 'Rachel Kim (Engineering Manager) contacted us through the HawkRidge website. She expressed interest in SolidWorks as a CATIA alternative, citing high licensing costs and difficulty training new hires on CATIA. Asked about pricing for 15 seats and migration services. Brief initial inquiry — no urgency indicated.',
        sentiment: 0.4,
        keyInsights: ['Inbound inquiry — organic interest', 'CATIA cost and training are pain points', '15-seat opportunity'],
        actionItems: ['Send SolidWorks overview for automotive manufacturers', 'Schedule discovery call'],
        buyingSignals: ['Inbound website inquiry', 'Specific seat count mentioned'],
        emailOpened: true,
        emailReplied: true,
        occurredAt: new Date('2026-01-29T14:00:00Z'),
        createdAt: new Date('2026-01-29T14:00:00Z'),
      },
      {
        id: 'act_004_02',
        dealId: 'deal_004',
        accountId: 'acct_004',
        stakeholderId: 'stkh_004_1',
        type: 'call',
        direction: 'outbound',
        subject: 'Initial discovery call with Rachel Kim',
        summary: 'First call with Rachel Kim. She manages a 15-person engineering team doing precision automotive parts for Toyota, Honda, and GM. They use CATIA V5 and are "used to it but frustrated" by the cost ($9K/seat vs SolidWorks $5K). She is the technical lead but does not make purchasing decisions — that is Tom Bradley (VP Ops). She needs to be convinced SolidWorks can handle their tolerancing requirements before even raising it with Tom. Agreed to a follow-up meeting where we can show automotive-specific capabilities.',
        sentiment: 0.4,
        keyInsights: ['Rachel is not decision maker — VP Ops Tom Bradley is', 'Cost savings is primary driver', 'Technical validation needed before internal advocacy', 'Team is comfortable with CATIA — switching costs are psychological barrier'],
        actionItems: ['Prepare automotive tolerancing demo', 'Research Tom Bradley background', 'Send case studies before next meeting'],
        duration: 1320,
        outcome: 'connected',
        talkRatio: 0.35,
        occurredAt: new Date('2026-02-03T16:00:00Z'),
        createdAt: new Date('2026-02-03T16:22:00Z'),
      },
      {
        id: 'act_004_03',
        dealId: 'deal_004',
        accountId: 'acct_004',
        stakeholderId: 'stkh_004_1',
        type: 'email',
        direction: 'outbound',
        subject: 'SolidWorks for Automotive — Case Studies & Migration Info',
        summary: 'Sent Rachel a curated package of information: 2 automotive case studies (BorgWarner and a Tier-2 supplier similar to Precision Parts), SolidWorks tolerancing capabilities overview, and CATIA migration FAQ. Email was opened twice but no response yet.',
        sentiment: 0.2,
        keyInsights: ['Email opened multiple times — indicates interest', 'No response yet — may be reviewing internally'],
        emailOpened: true,
        emailReplied: false,
        occurredAt: new Date('2026-02-06T10:00:00Z'),
        createdAt: new Date('2026-02-06T10:00:00Z'),
      },
      {
        id: 'act_004_04',
        dealId: 'deal_004',
        accountId: 'acct_004',
        type: 'note',
        subject: 'Internal note: Precision Parts strategy',
        summary: 'Research shows Precision Parts recently won a Toyota contract extension and is hiring 5 new engineers. The combination of cost pressure (CATIA), growth (new hires), and complexity (CATIA training for juniors) creates a window. Key risk: they may opt to just reduce CATIA seat count instead of switching. Need to show SolidWorks as growth enabler, not just cost saver.',
        occurredAt: new Date('2026-02-08T09:00:00Z'),
        createdAt: new Date('2026-02-08T09:00:00Z'),
      },
    ];

    for (const activity of activities) {
      this.activities.set(activity.id, activity);
      const dealActivities = this.activitiesByDeal.get(activity.dealId) || [];
      dealActivities.push(activity.id);
      this.activitiesByDeal.set(activity.dealId, dealActivities);
    }
  }

  // ─── Notifications ───────────────────────────────────────────

  private seedNotifications(): void {
    const notifications: Notification[] = [
      {
        id: 'notif_001',
        type: 'deal_risk',
        severity: 'critical',
        title: 'Champion Gone Silent — GlobalFab Industries',
        message: 'Michael Torres (Director, Product Dev) has not responded to any outreach in 14 days. Deal health score dropped to 42. Recommend immediate escalation to executive-level outreach.',
        dealId: 'deal_002',
        accountId: 'acct_002',
        stakeholderId: 'stkh_002_1',
        actionUrl: '/deals/deal_002',
        read: false,
        createdAt: new Date('2026-02-10T08:00:00Z'),
      },
      {
        id: 'notif_002',
        type: 'competitor_alert',
        severity: 'warning',
        title: 'ANSYS Counter-Proposal Detected — Acme Aerospace',
        message: 'CFO Robert Yang mentioned ANSYS submitted a 20% discounted proposal. Prepare competitive TCO comparison before Feb 14 pricing meeting.',
        dealId: 'deal_001',
        accountId: 'acct_001',
        actionUrl: '/deals/deal_001',
        read: false,
        createdAt: new Date('2026-02-06T17:00:00Z'),
      },
      {
        id: 'notif_003',
        type: 'stage_change',
        severity: 'info',
        title: 'Deal Advanced — Acme Aerospace to Negotiation',
        message: 'Acme Aerospace deal moved from Proposal to Negotiation. CFO engaged on pricing. Target close: March 28.',
        dealId: 'deal_001',
        accountId: 'acct_001',
        actionUrl: '/deals/deal_001',
        read: true,
        createdAt: new Date('2026-02-04T17:30:00Z'),
      },
      {
        id: 'notif_004',
        type: 'buying_signal',
        severity: 'info',
        title: 'Strong Buying Signal — Nova Engineering',
        message: 'CTO David Park confirmed he will present SolidWorks proposal to leadership team on Feb 20. He stated Autodesk "isn\'t even in the running anymore."',
        dealId: 'deal_003',
        accountId: 'acct_003',
        stakeholderId: 'stkh_003_1',
        actionUrl: '/deals/deal_003',
        read: false,
        createdAt: new Date('2026-02-11T15:30:00Z'),
      },
      {
        id: 'notif_005',
        type: 'engagement_drop',
        severity: 'warning',
        title: 'Engagement Drop — GlobalFab Industries',
        message: 'Account engagement has declined 60% over the past 3 weeks. Last email was opened but not replied to. No meetings scheduled.',
        dealId: 'deal_002',
        accountId: 'acct_002',
        actionUrl: '/deals/deal_002',
        read: false,
        createdAt: new Date('2026-02-08T09:00:00Z'),
      },
      {
        id: 'notif_006',
        type: 'meeting_reminder',
        severity: 'info',
        title: 'Pricing Meeting Tomorrow — Acme Aerospace',
        message: 'Pricing negotiation meeting with CFO Robert Yang and VP Eng Sarah Mitchell is tomorrow at 2:00 PM. Ensure TCO comparison and multi-year pricing are ready.',
        dealId: 'deal_001',
        accountId: 'acct_001',
        actionUrl: '/deals/deal_001',
        read: false,
        createdAt: new Date('2026-02-13T08:00:00Z'),
      },
      {
        id: 'notif_007',
        type: 'stakeholder_alert',
        severity: 'warning',
        title: 'New Stakeholder Identified — GlobalFab IT Director',
        message: 'IT Director Kevin Wu is actively pushing for Siemens NX. He has the ear of the new CTO. Consider engaging him directly with a PLM integration demo.',
        dealId: 'deal_002',
        accountId: 'acct_002',
        stakeholderId: 'stkh_002_4',
        actionUrl: '/deals/deal_002',
        read: true,
        createdAt: new Date('2026-01-28T16:00:00Z'),
      },
      {
        id: 'notif_008',
        type: 'action_overdue',
        severity: 'warning',
        title: 'Overdue Action — Research CTO Anita Patel Background',
        message: 'Action item "Research CTO Anita Patel\'s vendor preferences" was due Feb 10 and is overdue. This intel is critical for the GlobalFab deal recovery strategy.',
        dealId: 'deal_002',
        accountId: 'acct_002',
        actionUrl: '/deals/deal_002',
        read: false,
        createdAt: new Date('2026-02-11T08:00:00Z'),
      },
    ];

    for (const notif of notifications) {
      this.notifications.set(notif.id, notif);
    }
  }

  // ─── Helper Methods ──────────────────────────────────────────

  // Deals
  getDeals(): Deal[] {
    return Array.from(this.deals.values()).sort((a, b) => b.value - a.value);
  }

  getDealById(id: string): Deal | undefined {
    return this.deals.get(id);
  }

  getDealsByStage(stage: string): Deal[] {
    return Array.from(this.deals.values()).filter((d) => d.stage === stage);
  }

  getDealsByAccount(accountId: string): Deal[] {
    const dealIds = this.dealsByAccount.get(accountId) || [];
    return dealIds
      .map((id) => this.deals.get(id))
      .filter((d): d is Deal => d !== undefined);
  }

  getDealsAtRisk(): Deal[] {
    return Array.from(this.deals.values())
      .filter((d) => d.healthScore < 60 && d.stage !== 'closed_won' && d.stage !== 'closed_lost')
      .sort((a, b) => a.healthScore - b.healthScore);
  }

  // Accounts
  getAccounts(): Account[] {
    return Array.from(this.accounts.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getAccountById(id: string): Account | undefined {
    return this.accounts.get(id);
  }

  // Stakeholders
  getStakeholdersForDeal(dealId: string): Stakeholder[] {
    const ids = this.stakeholdersByDeal.get(dealId) || [];
    return ids
      .map((id) => this.stakeholders.get(id))
      .filter((s): s is Stakeholder => s !== undefined)
      .sort((a, b) => b.influenceLevel - a.influenceLevel);
  }

  getStakeholdersForAccount(accountId: string): Stakeholder[] {
    const ids = this.stakeholdersByAccount.get(accountId) || [];
    return ids
      .map((id) => this.stakeholders.get(id))
      .filter((s): s is Stakeholder => s !== undefined);
  }

  getStakeholderById(id: string): Stakeholder | undefined {
    return this.stakeholders.get(id);
  }

  // Activities
  getActivitiesForDeal(dealId: string): Activity[] {
    const ids = this.activitiesByDeal.get(dealId) || [];
    return ids
      .map((id) => this.activities.get(id))
      .filter((a): a is Activity => a !== undefined)
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
  }

  getRecentActivities(limit: number = 20): Activity[] {
    return Array.from(this.activities.values())
      .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
      .slice(0, limit);
  }

  // Users
  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getCurrentUser(): User {
    return this.users.get('user_ae_001')!;
  }

  // Notifications
  getNotifications(unreadOnly: boolean = false): Notification[] {
    let notifs = Array.from(this.notifications.values());
    if (unreadOnly) {
      notifs = notifs.filter((n) => !n.read);
    }
    return notifs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getUnreadNotificationCount(): number {
    return Array.from(this.notifications.values()).filter((n) => !n.read).length;
  }

  markNotificationRead(id: string): void {
    const notif = this.notifications.get(id);
    if (notif) {
      notif.read = true;
    }
  }

  // Meeting Prep
  getMeetingPrepForDeal(dealId: string): MeetingPrep | undefined {
    return Array.from(this.meetingPreps.values()).find((mp) => mp.dealId === dealId);
  }

  // ─── Dashboard Data ──────────────────────────────────────────

  getDashboardData(): DashboardData {
    const user = this.getCurrentUser();
    const allDeals = Array.from(this.deals.values());
    const activeDeals = allDeals.filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost');

    // Quota attainment
    const quota = user.quota || 1500000;
    const closedWon = user.closedWonYTD || 680000;
    const weightedPipeline = activeDeals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);
    const gap = quota - closedWon;
    const projected = closedWon + weightedPipeline;
    const attainmentPercent = Math.round((closedWon / quota) * 100);

    const quotaAttainment: QuotaAttainment = {
      quota,
      closedWon,
      weightedPipeline: Math.round(weightedPipeline),
      gap,
      projected: Math.round(projected),
      attainmentPercent,
    };

    // Pipeline by stage
    const pipelineByStage: PipelineStageSummary[] = DEAL_STAGES.map((stageDef) => {
      const stageDeals = activeDeals.filter((d) => d.stage === stageDef.key);
      return {
        stage: stageDef.key,
        label: stageDef.label,
        count: stageDeals.length,
        value: stageDeals.reduce((sum, d) => sum + d.value, 0),
        color: stageDef.color,
      };
    });

    // Deals at risk (health score < 60)
    const dealsAtRisk: DealAtRisk[] = activeDeals
      .filter((d) => d.healthScore < 60)
      .map((d) => {
        const account = this.accounts.get(d.accountId);
        const topRisk = d.riskFactors
          .filter((r) => !r.isResolved)
          .sort((a, b) => {
            const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
          })[0];
        return {
          dealId: d.id,
          dealName: d.name,
          accountName: account?.name || 'Unknown',
          value: d.value,
          healthScore: d.healthScore,
          stage: d.stage,
          topRisk: topRisk?.description || 'No specific risk identified',
          daysInStage: d.daysInStage,
        };
      })
      .sort((a, b) => a.healthScore - b.healthScore);

    // Today's actions across all deals
    const todayActions: TodayAction[] = [];
    for (const deal of activeDeals) {
      const account = this.accounts.get(deal.accountId);
      for (const action of deal.nextBestActions) {
        if (!action.isCompleted && (action.priority === 'critical' || action.priority === 'high')) {
          todayActions.push({
            dealId: deal.id,
            dealName: deal.name,
            accountName: account?.name || 'Unknown',
            action,
          });
        }
      }
    }
    todayActions.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.action.priority] - priorityOrder[b.action.priority];
    });

    // Forecast
    const negotiationDeals = activeDeals.filter((d) => d.stage === 'negotiation');
    const proposalDeals = activeDeals.filter((d) => d.stage === 'proposal');
    const otherActiveDeals = activeDeals.filter((d) => d.stage !== 'negotiation' && d.stage !== 'proposal');

    const commit = closedWon + negotiationDeals.reduce((sum, d) => sum + d.value, 0);
    const bestCase = commit + proposalDeals.reduce((sum, d) => sum + d.value, 0);
    const pipeline = bestCase + otherActiveDeals.reduce((sum, d) => sum + d.value, 0);

    const forecast: ForecastData = {
      commit,
      bestCase,
      pipeline,
      target: quota,
    };

    return {
      quotaAttainment,
      pipelineByStage,
      dealsAtRisk,
      todayActions,
      forecast,
      notifications: this.getNotifications(),
    };
  }
}

export const store = new DataStore();
