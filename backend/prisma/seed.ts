// ============================================================
// Prisma Seed Script — GameTime AI
// Migrates in-memory store data + adds Virtual Assistant leads
// ============================================================

import { PrismaClient } from '../src/generated/prisma';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' });
const prisma = new PrismaClient({ adapter });

// Import the existing store (it self-populates on construction)
// We'll serialize its data into Prisma
import('../src/store/index').then(async (mod) => {
  const store = (mod as any).store;

  console.log('Clearing existing data...');
  // Delete in reverse dependency order
  await prisma.autoResponse.deleteMany();
  await prisma.inboundLead.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.nextBestAction.deleteMany();
  await prisma.competitorIntel.deleteMany();
  await prisma.riskFactor.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.stakeholder.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // ─── Users ──────────────────────────────────────────────────
  console.log('Seeding users...');
  for (const [, user] of store.users) {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        title: user.title || null,
        region: null,
        salesforceUserId: user.salesforceUserId || null,
        quota: user.quota || null,
        closedWonYTD: user.closedWonYTD || null,
        createdAt: user.createdAt,
      },
    });
  }

  // Add SDR users for the VA feature
  await prisma.user.create({
    data: {
      id: 'user_sdr_001',
      email: 'james.wilson@hawkridge.com',
      name: 'James Wilson',
      role: 'sdr',
      title: 'Sales Development Rep',
      region: 'West',
      createdAt: new Date('2024-06-01'),
    },
  });
  await prisma.user.create({
    data: {
      id: 'user_sdr_002',
      email: 'emily.carter@hawkridge.com',
      name: 'Emily Carter',
      role: 'sdr',
      title: 'Sales Development Rep',
      region: 'Central',
      createdAt: new Date('2024-09-15'),
    },
  });

  // ─── Accounts ───────────────────────────────────────────────
  console.log('Seeding accounts...');
  for (const [, account] of store.accounts) {
    await prisma.account.create({
      data: {
        id: account.id,
        name: account.name,
        industry: account.industry,
        website: account.website || null,
        employeeCount: account.employeeCount || null,
        estimatedRevenue: account.estimatedRevenue || null,
        address: account.address || null,
        region: account.address?.includes('CA') ? 'West' :
                account.address?.includes('IL') ? 'Central' :
                account.address?.includes('MA') ? 'East' :
                account.address?.includes('MI') ? 'Central' : null,
        summary: account.summary,
        recentNews: JSON.stringify(account.recentNews || []),
        techStack: JSON.stringify(account.techStack || []),
        healthScore: account.healthScore,
        salesforceAccountId: account.salesforceAccountId || null,
        createdAt: account.createdAt,
      },
    });
  }

  // ─── Deals ──────────────────────────────────────────────────
  console.log('Seeding deals...');
  for (const [, deal] of store.deals) {
    await prisma.deal.create({
      data: {
        id: deal.id,
        accountId: deal.accountId,
        salesforceOpportunityId: deal.salesforceOpportunityId || null,
        name: deal.name,
        value: deal.value,
        stage: deal.stage,
        probability: deal.probability,
        winProbability: deal.winProbability,
        products: JSON.stringify(deal.products || []),
        seatCount: deal.seatCount || null,
        closeDate: deal.closeDate,
        nextMeetingDate: deal.nextMeetingDate || null,
        daysInStage: deal.daysInStage,
        healthScore: deal.healthScore,
        meddic: JSON.stringify(deal.meddic),
        stageHistory: JSON.stringify(deal.stageHistory || []),
        ownerId: deal.ownerId,
        dealNotes: deal.dealNotes || null,
        createdAt: deal.createdAt,
      },
    });

    // Risk factors
    for (const risk of deal.riskFactors || []) {
      await prisma.riskFactor.create({
        data: {
          id: risk.id,
          dealId: deal.id,
          category: risk.category,
          description: risk.description,
          severity: risk.severity,
          detectedAt: risk.detectedAt,
          mitigationAction: risk.mitigationAction || null,
          isResolved: risk.isResolved,
        },
      });
    }

    // Competitors
    for (const comp of deal.competitors || []) {
      await prisma.competitorIntel.create({
        data: {
          dealId: deal.id,
          competitorName: comp.competitorName,
          threatLevel: comp.threatLevel,
          strengths: JSON.stringify(comp.strengths || []),
          weaknesses: JSON.stringify(comp.weaknesses || []),
          ourAdvantages: JSON.stringify(comp.ourAdvantages || []),
          keyDifferentiators: JSON.stringify(comp.keyDifferentiators || []),
          objectionHandlers: JSON.stringify(comp.objectionHandlers || []),
          incumbentProduct: comp.incumbentProduct || null,
          relationshipStrength: comp.relationshipStrength || null,
          lastMentionedAt: comp.lastMentionedAt || null,
          mentionedBy: comp.mentionedBy || null,
        },
      });
    }

    // Next best actions
    for (const action of deal.nextBestActions || []) {
      await prisma.nextBestAction.create({
        data: {
          id: action.id,
          dealId: deal.id,
          type: action.type,
          priority: action.priority,
          title: action.title,
          description: action.description,
          aiReasoning: action.aiReasoning,
          targetStakeholderId: action.targetStakeholderId || null,
          dueDate: action.dueDate || null,
          isCompleted: action.isCompleted,
          completedAt: action.completedAt || null,
          createdAt: action.createdAt,
        },
      });
    }
  }

  // ─── Stakeholders ────────────────────────────────────────────
  console.log('Seeding stakeholders...');
  for (const [, stakeholder] of store.stakeholders) {
    await prisma.stakeholder.create({
      data: {
        id: stakeholder.id,
        accountId: stakeholder.accountId,
        dealId: stakeholder.dealId,
        name: stakeholder.name,
        title: stakeholder.title,
        email: stakeholder.email,
        phone: stakeholder.phone || null,
        linkedinUrl: stakeholder.linkedinUrl || null,
        roles: JSON.stringify(stakeholder.roles || []),
        isPrimary: stakeholder.isPrimary,
        influenceLevel: stakeholder.influenceLevel,
        sentiment: stakeholder.sentiment,
        sentimentTrend: stakeholder.sentimentTrend,
        lastContactedAt: stakeholder.lastContactedAt || null,
        contactFrequency: stakeholder.contactFrequency,
        preferredChannel: stakeholder.preferredChannel,
        reportsTo: stakeholder.reportsTo || null,
        notes: stakeholder.notes || null,
        priorities: stakeholder.priorities ? JSON.stringify(stakeholder.priorities) : null,
        objections: stakeholder.objections ? JSON.stringify(stakeholder.objections) : null,
        createdAt: stakeholder.createdAt,
      },
    });
  }

  // ─── Activities ──────────────────────────────────────────────
  console.log('Seeding activities...');
  for (const [, activity] of store.activities) {
    await prisma.activity.create({
      data: {
        id: activity.id,
        dealId: activity.dealId,
        accountId: activity.accountId,
        stakeholderId: activity.stakeholderId || null,
        type: activity.type,
        direction: activity.direction || null,
        subject: activity.subject,
        summary: activity.summary,
        sentiment: activity.sentiment ?? null,
        keyInsights: activity.keyInsights ? JSON.stringify(activity.keyInsights) : null,
        actionItems: activity.actionItems ? JSON.stringify(activity.actionItems) : null,
        buyingSignals: activity.buyingSignals ? JSON.stringify(activity.buyingSignals) : null,
        competitorsMentioned: activity.competitorsMentioned ? JSON.stringify(activity.competitorsMentioned) : null,
        duration: activity.duration ?? null,
        outcome: activity.outcome || null,
        talkRatio: activity.talkRatio ?? null,
        emailOpened: activity.emailOpened ?? null,
        emailReplied: activity.emailReplied ?? null,
        fromStage: activity.fromStage || null,
        toStage: activity.toStage || null,
        occurredAt: activity.occurredAt,
        createdAt: activity.createdAt,
      },
    });
  }

  // ─── Notifications ──────────────────────────────────────────
  console.log('Seeding notifications...');
  for (const [, notification] of store.notifications) {
    await prisma.notification.create({
      data: {
        id: notification.id,
        type: notification.type,
        severity: notification.severity,
        title: notification.title,
        message: notification.message,
        dealId: notification.dealId || null,
        accountId: notification.accountId || null,
        stakeholderId: notification.stakeholderId || null,
        actionUrl: notification.actionUrl || null,
        read: notification.read,
        createdAt: notification.createdAt,
      },
    });
  }

  // ─── Inbound Leads (Virtual Assistant) ─────────────────────
  console.log('Seeding inbound leads...');

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);

  const leads = [
    // ── Brand New (3) ──
    {
      id: 'lead_001', source: 'website_form', sourceDetail: 'Contact Us page',
      firstName: 'Robert', lastName: 'Chen', email: 'rchen@apexmfg.com', phone: '(408) 555-0191',
      company: 'Apex Manufacturing', title: 'Director of Engineering', industry: 'Industrial Manufacturing',
      employeeCount: 320, website: 'https://apexmfg.com',
      message: 'We are evaluating SolidWorks Premium for our 25-person engineering team. Currently using Inventor. Looking for a demo.',
      productInterest: 'SolidWorks Premium', region: 'West',
      aiScore: 82, aiScoreFactors: JSON.stringify(['Director-level contact', '25 engineering seats', 'Active evaluation', 'Manufacturing industry fit']),
      aiSummary: 'High-value prospect. Director-level decision maker at a 320-person manufacturer evaluating SolidWorks Premium for 25 seats. Active evaluation stage indicates urgency.',
      aiQualified: true, status: 'new',
      receivedAt: hoursAgo(1),
    },
    {
      id: 'lead_002', source: 'chat', sourceDetail: 'Live chat widget',
      firstName: 'Lisa', lastName: 'Yamamoto', email: 'lyamamoto@velocityauto.com',
      company: 'Velocity Automotive', title: 'CAD Manager', industry: 'Automotive',
      employeeCount: 180, message: 'Quick question about SolidWorks CAM pricing for 8 seats.',
      productInterest: 'SolidWorks CAM', region: 'Central',
      aiScore: 65, aiScoreFactors: JSON.stringify(['CAD Manager role', 'Specific seat count', 'Automotive vertical']),
      aiSummary: 'Mid-tier prospect. CAD Manager inquiring about specific seat count for CAM module.',
      aiQualified: false, status: 'new',
      receivedAt: hoursAgo(0.5),
    },
    {
      id: 'lead_003', source: 'email', sourceDetail: 'info@hawkridge.com',
      firstName: 'Thomas', lastName: 'Mueller', email: 'tmueller@ironbridgesteel.com',
      company: 'Ironbridge Steel Structures', title: 'VP Operations', industry: 'Steel & Fabrication',
      employeeCount: 500, message: 'Interested in PDM Professional for our multi-site team of 40 engineers. Need data management across 3 plants.',
      productInterest: 'PDM Professional', region: 'East',
      aiScore: 91, aiScoreFactors: JSON.stringify(['VP-level contact', '40 seats multi-site', 'Specific pain point (data management)', 'Large company (500 emp)']),
      aiSummary: 'Top-tier prospect. VP Operations at 500-person steel manufacturer needs PDM across 3 plants for 40 engineers. High value, clear pain point.',
      aiQualified: true, status: 'new',
      receivedAt: hoursAgo(0.25),
    },

    // ── Auto-Responded (5) ──
    {
      id: 'lead_004', source: 'website_form', sourceDetail: 'Product page - Simulation',
      firstName: 'Karen', lastName: 'Patel', email: 'kpatel@titandef.com', phone: '(703) 555-0244',
      company: 'Titan Defense Systems', title: 'Chief Engineer', industry: 'Aerospace & Defense',
      employeeCount: 750, website: 'https://titandefense.com',
      message: 'Need SolidWorks Simulation Premium for FEA validation on defense contracts. Currently using ANSYS but looking to consolidate tools.',
      productInterest: 'SolidWorks Simulation Premium', region: 'East',
      aiScore: 95, aiScoreFactors: JSON.stringify(['Chief Engineer', 'Defense sector', 'Replacing ANSYS', '750 employees', 'Tool consolidation initiative']),
      aiSummary: 'Exceptional prospect. Chief Engineer at major defense contractor wants to consolidate from ANSYS to SolidWorks Simulation. High strategic value.',
      aiQualified: true, autoResponseSent: true, responseTimeMs: 3200,
      autoResponseAt: new Date(daysAgo(2).getTime() + 3200),
      autoResponseContent: 'Dear Karen,\n\nThank you for reaching out to HawkRidge Systems. I see you\'re evaluating SolidWorks Simulation Premium for FEA validation at Titan Defense Systems.\n\nConsolidating from ANSYS to SolidWorks Simulation is a path many defense contractors have taken successfully. The native integration eliminates model translation issues and can reduce FEA cycle time by 40-60%.\n\nI\'d love to set up a technical evaluation specific to your defense validation workflows. Could we schedule a 30-minute call this week?\n\nBest regards,\nHawkRidge Systems',
      status: 'auto_responded', receivedAt: daysAgo(2),
    },
    {
      id: 'lead_005', source: 'event', sourceDetail: 'SolidWorks World 2026',
      firstName: 'Derek', lastName: 'Nguyen', email: 'dnguyen@pacificnw-eng.com',
      company: 'Pacific Northwest Engineering', title: 'Engineering Manager', industry: 'Engineering Services',
      employeeCount: 85, website: 'https://pacificnweng.com',
      message: 'Met your team at SW World. We need SolidWorks + PDM for our growing team. Currently at 12 seats, expanding to 30.',
      productInterest: 'SolidWorks Professional + PDM', region: 'West',
      aiScore: 78, aiScoreFactors: JSON.stringify(['Event lead (high intent)', 'Growing team 12→30', 'Engineering services fit']),
      aiSummary: 'Strong event lead. Engineering Manager at growing consultancy expanding from 12 to 30 seats. Good growth trajectory.',
      aiQualified: true, autoResponseSent: true, responseTimeMs: 4800,
      autoResponseAt: new Date(daysAgo(5).getTime() + 4800),
      autoResponseContent: 'Hi Derek,\n\nGreat connecting with you at SolidWorks World 2026! It was wonderful meeting the Pacific Northwest Engineering team.\n\nI understand you\'re scaling from 12 to 30 SolidWorks seats and adding PDM — that\'s exactly the kind of growth trajectory we love to support.\n\nI\'d like to discuss a phased deployment plan that gets your new engineers productive quickly. Would next Tuesday or Wednesday work for a 30-minute call?\n\nBest,\nHawkRidge Systems',
      status: 'auto_responded', receivedAt: daysAgo(5),
    },
    {
      id: 'lead_006', source: 'website_form', sourceDetail: 'Free trial page',
      firstName: 'Maria', lastName: 'Santos', email: 'msantos@summitfab.com',
      company: 'Summit Fabrication', title: 'Design Lead', industry: 'Metal Fabrication',
      employeeCount: 120, message: 'Looking to evaluate SolidWorks for sheet metal design. We do a lot of custom HVAC ductwork.',
      productInterest: 'SolidWorks Standard', region: 'South',
      aiScore: 58, aiScoreFactors: JSON.stringify(['Design Lead role', 'Specific use case (sheet metal)', 'Small company']),
      aiSummary: 'Mid-tier prospect. Design Lead at metal fabrication shop with specific sheet metal focus.',
      aiQualified: false, autoResponseSent: true, responseTimeMs: 6100,
      autoResponseAt: new Date(daysAgo(7).getTime() + 6100),
      autoResponseContent: 'Hi Maria,\n\nThank you for your interest in SolidWorks for sheet metal design at Summit Fabrication.\n\nSolidWorks is an excellent fit for HVAC ductwork — our sheet metal tools include automatic bend calculations, flat pattern development, and integration with CNC cutting machines.\n\nI\'d be happy to arrange a demo focused on your specific sheet metal workflows. When would be a good time to connect?\n\nBest regards,\nHawkRidge Systems',
      status: 'auto_responded', receivedAt: daysAgo(7),
    },
    {
      id: 'lead_007', source: 'referral', sourceDetail: 'Referred by Acme Aerospace',
      firstName: 'Jason', lastName: 'Park', email: 'jpark@clearpathrob.com', phone: '(512) 555-0388',
      company: 'ClearPath Robotics', title: 'CTO', industry: 'Robotics & Automation',
      employeeCount: 60, website: 'https://clearpathrob.com',
      message: 'Sarah Mitchell at Acme Aerospace recommended HawkRidge. We need SolidWorks + Electrical for our robot control systems.',
      productInterest: 'SolidWorks Premium + Electrical', region: 'South',
      aiScore: 88, aiScoreFactors: JSON.stringify(['CTO level', 'Referral from customer', 'Multi-product interest', 'Robotics high-value segment']),
      aiSummary: 'Premium referral lead. CTO of robotics company referred by existing customer. Multi-product interest (Premium + Electrical) indicates serious evaluation.',
      aiQualified: true, autoResponseSent: true, responseTimeMs: 2800,
      autoResponseAt: new Date(daysAgo(3).getTime() + 2800),
      autoResponseContent: 'Dear Jason,\n\nThank you for reaching out — we\'re glad Sarah Mitchell at Acme Aerospace recommended us!\n\nSolidWorks Premium combined with SOLIDWORKS Electrical is a powerful combination for robotics — you get full 3D mechanical design plus electrical schematic and harness design in one integrated environment.\n\nGiven your ClearPath Robotics team\'s needs, I\'d love to arrange a tailored demo showing our robotics-specific workflows. How does this Thursday look?\n\nBest regards,\nHawkRidge Systems',
      status: 'auto_responded', receivedAt: daysAgo(3),
    },
    {
      id: 'lead_008', source: 'chat', sourceDetail: 'Live chat widget',
      firstName: 'Amanda', lastName: 'Richardson', email: 'arichardson@pinnacledef.com',
      company: 'Pinnacle Defense', title: 'Procurement Manager', industry: 'Defense',
      employeeCount: 400, message: 'Need pricing for 50-seat SolidWorks deployment. Have budget approved for Q1.',
      productInterest: 'SolidWorks Enterprise (50 seats)', region: 'East',
      aiScore: 93, aiScoreFactors: JSON.stringify(['Budget approved', '50 seats', 'Defense sector', 'Procurement involved']),
      aiSummary: 'Hot lead. Budget-approved 50-seat deployment at defense contractor. Procurement already engaged indicates advanced buying stage.',
      aiQualified: true, autoResponseSent: true, responseTimeMs: 1900,
      autoResponseAt: new Date(daysAgo(1).getTime() + 1900),
      autoResponseContent: 'Hi Amanda,\n\nThank you for reaching out about a 50-seat SolidWorks deployment for Pinnacle Defense.\n\nWith budget already approved for Q1, I want to make sure we can meet your timeline. I\'ll prepare a comprehensive proposal covering licensing, deployment, and training for your 50-seat rollout.\n\nCould we schedule a call tomorrow to discuss your specific requirements and pricing structure?\n\nBest regards,\nHawkRidge Systems',
      status: 'auto_responded', receivedAt: daysAgo(1),
    },

    // ── SDR Reviewing (3) ──
    {
      id: 'lead_009', source: 'website_form', sourceDetail: 'ROI Calculator page',
      firstName: 'Brian', lastName: 'Kowalski', email: 'bkowalski@midwestprecision.com',
      company: 'Midwest Precision Machining', title: 'Plant Manager', industry: 'Precision Machining',
      employeeCount: 95, message: 'Used your ROI calculator — shows $180K savings. Want to learn more about SolidWorks CAM.',
      productInterest: 'SolidWorks CAM', region: 'Central',
      aiScore: 72, aiScoreFactors: JSON.stringify(['Used ROI calculator', 'Plant Manager', 'Quantified savings ($180K)']),
      aiSummary: 'Engaged prospect. Already used ROI calculator showing $180K savings. Plant Manager at precision machining shop.',
      aiQualified: true, autoResponseSent: true, responseTimeMs: 5400,
      autoResponseAt: new Date(daysAgo(4).getTime() + 5400),
      autoResponseContent: 'Hi Brian,\n\nThat $180K projected savings with SolidWorks CAM sounds right in line with what other precision machining shops see.\n\nI\'d love to do a live calculation with your specific machine data. When works for a quick call?\n\nBest,\nHawkRidge Systems',
      status: 'sdr_reviewing', assignedSdrId: 'user_sdr_002', receivedAt: daysAgo(4),
    },
    {
      id: 'lead_010', source: 'email', sourceDetail: 'sales@hawkridge.com',
      firstName: 'Yuki', lastName: 'Tanaka', email: 'ytanaka@aerojet-micro.com',
      company: 'AeroJet Microsystems', title: 'VP R&D', industry: 'Aerospace Components',
      employeeCount: 210, message: 'Evaluating 3D CAD solutions for new satellite component division. Need simulation + PDM.',
      productInterest: 'SolidWorks Premium + Simulation + PDM', region: 'West',
      aiScore: 89, aiScoreFactors: JSON.stringify(['VP R&D', 'New division (greenfield)', 'Multi-product', 'Aerospace']),
      aiSummary: 'High-value greenfield opportunity. VP R&D building new satellite division from scratch — can set the standard. Multi-product interest.',
      aiQualified: true, autoResponseSent: true, responseTimeMs: 3100,
      autoResponseAt: new Date(daysAgo(6).getTime() + 3100),
      autoResponseContent: 'Dear Yuki,\n\nExciting to hear about AeroJet Microsystems\' new satellite component division!\n\nStarting with SolidWorks Premium, Simulation, and PDM from day one is the ideal approach. I can share case studies from similar aerospace teams.\n\nWould you have time for a strategic discussion this week?\n\nBest,\nHawkRidge Systems',
      status: 'sdr_reviewing', assignedSdrId: 'user_sdr_001', receivedAt: daysAgo(6),
    },
    {
      id: 'lead_011', source: 'phone', sourceDetail: 'Inbound call',
      firstName: 'Marcus', lastName: 'Brown', email: 'mbrown@greatlakes-tool.com', phone: '(216) 555-0712',
      company: 'Great Lakes Tooling', title: 'Owner', industry: 'Tool & Die',
      employeeCount: 45, message: 'Small shop switching from AutoCAD to 3D. Need affordable SolidWorks option.',
      productInterest: 'SolidWorks Standard', region: 'Central',
      aiScore: 45, aiScoreFactors: JSON.stringify(['Owner/decision-maker', 'Small shop', 'Budget sensitive', 'First-time 3D']),
      aiSummary: 'Small-business prospect. Owner of 45-person tool shop moving from 2D to 3D. Budget-conscious but decision-maker is directly involved.',
      aiQualified: false, autoResponseSent: true, responseTimeMs: 8200,
      autoResponseAt: new Date(daysAgo(8).getTime() + 8200),
      autoResponseContent: 'Hi Marcus,\n\nMoving from AutoCAD to SolidWorks is a great investment. Many tool and die shops see 30-40% faster design cycles after the switch.\n\nWe have starter packages designed for shops your size. Let\'s discuss options.\n\nBest,\nHawkRidge Systems',
      status: 'sdr_reviewing', assignedSdrId: 'user_sdr_002', receivedAt: daysAgo(8),
    },

    // ── Qualified (3) ──
    {
      id: 'lead_012', source: 'website_form', sourceDetail: 'Enterprise quote page',
      firstName: 'Rachel', lastName: 'Hoffman', email: 'rhoffman@dynamicaero.com', phone: '(206) 555-0533',
      company: 'Dynamic Aerospace', title: 'Director of IT', industry: 'Aerospace',
      employeeCount: 600, website: 'https://dynamicaero.com',
      message: 'Need enterprise SolidWorks deployment — 80 seats with PDM and admin tools. Budget approved.',
      productInterest: 'SolidWorks Enterprise (80 seats) + PDM', region: 'West',
      aiScore: 96, aiScoreFactors: JSON.stringify(['Enterprise scale (80 seats)', 'Budget approved', 'Director-level', 'Large company']),
      aiSummary: 'Enterprise-grade opportunity. 80-seat deployment with budget approved. Director of IT driving IT-side procurement.',
      aiQualified: true, autoResponseSent: true, responseTimeMs: 2100,
      autoResponseAt: new Date(daysAgo(10).getTime() + 2100),
      status: 'qualified', assignedSdrId: 'user_sdr_001', assignedAeId: 'user_ae_001',
      qualifiedAt: daysAgo(8), receivedAt: daysAgo(10),
    },
    {
      id: 'lead_013', source: 'referral', sourceDetail: 'Partner referral - Markforged',
      firstName: 'Steve', lastName: 'Martinez', email: 'smartinez@westcoast-proto.com',
      company: 'West Coast Prototyping', title: 'Founder & CEO', industry: 'Prototyping Services',
      employeeCount: 35, website: 'https://westcoastproto.com',
      message: 'Need SolidWorks + Markforged bundle for our prototyping lab. Markforged rep said you handle both.',
      productInterest: 'SolidWorks Professional + Markforged', region: 'West',
      aiScore: 74, aiScoreFactors: JSON.stringify(['CEO/Founder', 'Partner referral', 'Bundle opportunity', 'Clear intent']),
      aiSummary: 'Partner-referred bundle opportunity. CEO directly involved. SolidWorks + Markforged combo for prototyping lab.',
      aiQualified: true, autoResponseSent: true, responseTimeMs: 3900,
      autoResponseAt: new Date(daysAgo(12).getTime() + 3900),
      status: 'qualified', assignedSdrId: 'user_sdr_001', assignedAeId: 'user_ae_001',
      qualifiedAt: daysAgo(10), receivedAt: daysAgo(12),
    },
    {
      id: 'lead_014', source: 'event', sourceDetail: 'Manufacturing Technology Show',
      firstName: 'Patricia', lastName: 'Webb', email: 'pwebb@southernmfg-group.com', phone: '(404) 555-0891',
      company: 'Southern Manufacturing Group', title: 'VP Engineering', industry: 'Contract Manufacturing',
      employeeCount: 350, website: 'https://southernmfg.com',
      message: 'Need to standardize across 4 plants on one CAD platform. Currently mixed CATIA/SolidWorks/Inventor.',
      productInterest: 'SolidWorks Premium + PDM (multi-site)', region: 'South',
      aiScore: 87, aiScoreFactors: JSON.stringify(['VP Engineering', 'Multi-site standardization', '4 plants', 'High seat count potential']),
      aiSummary: 'Major standardization opportunity. VP Engineering wants to consolidate 4 plants onto single CAD platform. Multi-site PDM is key requirement.',
      aiQualified: true, autoResponseSent: true, responseTimeMs: 4500,
      autoResponseAt: new Date(daysAgo(14).getTime() + 4500),
      status: 'qualified', assignedSdrId: 'user_sdr_002', assignedAeId: 'user_ae_001',
      qualifiedAt: daysAgo(11), receivedAt: daysAgo(14),
    },

    // ── Converted (2) — linked to existing accounts ──
    {
      id: 'lead_015', source: 'website_form', sourceDetail: 'Contact Us page',
      firstName: 'David', lastName: 'Park', email: 'dpark@novaengineering.com',
      company: 'Nova Engineering Solutions', title: 'CEO/CTO', industry: 'Engineering Services',
      employeeCount: 150, website: 'https://novaengineering.com',
      message: 'Looking to standardize on SolidWorks across our growing team. Currently mixed Inventor/Fusion environment.',
      productInterest: 'SolidWorks Premium Enterprise', region: 'East',
      aiScore: 92, aiScoreFactors: JSON.stringify(['CEO/CTO', 'Standardization initiative', 'Growing team', 'Active pain point']),
      aiSummary: 'Converted to deal. CEO/CTO of fast-growing engineering consultancy drove SolidWorks standardization initiative.',
      aiQualified: true, autoResponseSent: true, responseTimeMs: 2400,
      autoResponseAt: new Date(daysAgo(60).getTime() + 2400),
      status: 'converted', convertedAccountId: 'acct_003', convertedDealId: 'deal_003',
      assignedSdrId: 'user_sdr_001', assignedAeId: 'user_ae_001',
      qualifiedAt: daysAgo(55), convertedAt: daysAgo(50), receivedAt: daysAgo(60),
    },
    {
      id: 'lead_016', source: 'email', sourceDetail: 'info@hawkridge.com',
      firstName: 'Frank', lastName: 'DeLuca', email: 'fdeluca@precisionparts.com',
      company: 'Precision Parts Co', title: 'Engineering Director', industry: 'Automotive Parts',
      employeeCount: 200, website: 'https://precisionparts.com',
      message: 'Exploring alternatives to CATIA. High licensing costs and difficulty hiring engineers who know CATIA.',
      productInterest: 'SolidWorks Premium', region: 'Central',
      aiScore: 79, aiScoreFactors: JSON.stringify(['Engineering Director', 'CATIA replacement', 'Cost pain point', 'Hiring pain point']),
      aiSummary: 'Converted to deal. Engineering Director seeking CATIA alternative due to cost and hiring challenges.',
      aiQualified: true, autoResponseSent: true, responseTimeMs: 5100,
      autoResponseAt: new Date(daysAgo(40).getTime() + 5100),
      status: 'converted', convertedAccountId: 'acct_004', convertedDealId: 'deal_004',
      assignedSdrId: 'user_sdr_002', assignedAeId: 'user_ae_001',
      qualifiedAt: daysAgo(35), convertedAt: daysAgo(30), receivedAt: daysAgo(40),
    },

    // ── Disqualified (2) ──
    {
      id: 'lead_017', source: 'website_form', sourceDetail: 'Free trial page',
      firstName: 'Kevin', lastName: 'Wong', email: 'kwong@studentproject.edu',
      company: 'Stanford University', title: 'Graduate Student', industry: 'Education',
      employeeCount: 0, message: 'Need SolidWorks for my thesis project on drone design.',
      productInterest: 'SolidWorks Student Edition', region: 'West',
      aiScore: 15, aiScoreFactors: JSON.stringify(['Student', 'No commercial intent', 'Education sector']),
      aiSummary: 'Not a commercial lead. Graduate student seeking academic license. Redirected to education program.',
      aiQualified: false, autoResponseSent: true, responseTimeMs: 7800,
      autoResponseAt: new Date(daysAgo(15).getTime() + 7800),
      status: 'disqualified', receivedAt: daysAgo(15),
    },
    {
      id: 'lead_018', source: 'chat', sourceDetail: 'Live chat widget',
      firstName: 'Tony', lastName: 'Russo', email: 'trusso@russoconsulting.com',
      company: 'Russo Consulting LLC', title: 'Consultant', industry: 'Consulting',
      employeeCount: 1, message: 'Just comparing software for a report. No immediate purchase planned.',
      productInterest: 'General inquiry', region: 'East',
      aiScore: 22, aiScoreFactors: JSON.stringify(['Solo consultant', 'No purchase intent', 'Research only']),
      aiSummary: 'Not qualified. Solo consultant doing market research with no purchase intent.',
      aiQualified: false, autoResponseSent: true, responseTimeMs: 12000,
      autoResponseAt: new Date(daysAgo(20).getTime() + 12000),
      status: 'disqualified', receivedAt: daysAgo(20),
    },
  ];

  for (const lead of leads) {
    await prisma.inboundLead.create({
      data: {
        id: lead.id,
        source: lead.source,
        sourceDetail: lead.sourceDetail || null,
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone || null,
        company: lead.company,
        title: lead.title || null,
        industry: lead.industry || null,
        employeeCount: lead.employeeCount || null,
        website: lead.website || null,
        message: lead.message || null,
        productInterest: lead.productInterest || null,
        region: lead.region || null,
        aiScore: lead.aiScore ?? null,
        aiScoreFactors: lead.aiScoreFactors || null,
        aiSummary: lead.aiSummary || null,
        aiQualified: lead.aiQualified ?? false,
        autoResponseSent: lead.autoResponseSent ?? false,
        autoResponseAt: lead.autoResponseAt || null,
        autoResponseContent: lead.autoResponseContent || null,
        responseTimeMs: lead.responseTimeMs || null,
        status: lead.status,
        assignedSdrId: lead.assignedSdrId || null,
        assignedAeId: lead.assignedAeId || null,
        convertedAccountId: lead.convertedAccountId || null,
        convertedDealId: lead.convertedDealId || null,
        receivedAt: lead.receivedAt,
        qualifiedAt: lead.qualifiedAt || null,
        convertedAt: lead.convertedAt || null,
      },
    });

    // Create AutoResponse records for responded leads
    if (lead.autoResponseSent && lead.autoResponseContent) {
      await prisma.autoResponse.create({
        data: {
          inboundLeadId: lead.id,
          subject: `Re: ${lead.productInterest || 'Your inquiry'} — HawkRidge Systems`,
          body: lead.autoResponseContent,
          personalization: JSON.stringify({
            contactName: `${lead.firstName} ${lead.lastName}`,
            company: lead.company,
            productInterest: lead.productInterest,
          }),
          channel: lead.source === 'chat' ? 'chat' : 'email',
          sentAt: lead.autoResponseAt || null,
          opened: Math.random() > 0.3,
          replied: Math.random() > 0.6,
          confidence: 0.82 + Math.random() * 0.13,
          model: 'claude-sonnet-4-5-20250929',
        },
      });
    }
  }

  // ─── Summary ────────────────────────────────────────────────
  const counts = {
    users: await prisma.user.count(),
    accounts: await prisma.account.count(),
    deals: await prisma.deal.count(),
    stakeholders: await prisma.stakeholder.count(),
    activities: await prisma.activity.count(),
    riskFactors: await prisma.riskFactor.count(),
    competitors: await prisma.competitorIntel.count(),
    actions: await prisma.nextBestAction.count(),
    notifications: await prisma.notification.count(),
    leads: await prisma.inboundLead.count(),
    autoResponses: await prisma.autoResponse.count(),
  };

  console.log('\nSeed complete!');
  console.log(JSON.stringify(counts, null, 2));

  await prisma.$disconnect();
}).catch(async (e) => {
  console.error('Seed failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
