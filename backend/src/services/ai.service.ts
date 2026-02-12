// ============================================================
// AI Service — LLM integration for enrichment, scoring, outreach, call analysis
// Supports Claude API (Anthropic) with Azure OpenAI fallback
// ============================================================

import { config } from '../config';
import { logger } from '../utils/logger';
import { GTLead, EmailVariant, CallIntelligence, CompanyIntel } from '../types';

// HawkRidge product catalog context for AI prompts
const HAWKRIDGE_CONTEXT = `
HawkRidge Systems is a leading provider of 3D design, engineering, and manufacturing technology solutions.

Key Products & Solutions:
- SolidWorks (3D CAD, Simulation, PDM, CAM) — flagship offering
- Markforged (3D Printing / Additive Manufacturing)
- Artec 3D (3D Scanning)
- DriveWorks (Design Automation)
- SOLIDWORKS Simulation — FEA, CFD, structural analysis
- SOLIDWORKS PDM — product data management
- SOLIDWORKS CAM — integrated CAM for CNC machining

Target Industries: Aerospace & Defense, Automotive, Medical Devices, Consumer Products, Industrial Equipment, Electronics

Value Proposition: HawkRidge doesn't just sell software — we provide complete engineering workflow solutions with expert implementation, training, and ongoing support. We help engineering teams design better products faster.

Key Differentiators:
- Elite SolidWorks reseller (top in North America)
- 200+ technical experts for implementation and support
- Full engineering workflow: Design → Simulate → Manufacture → Manage
- Training programs and certification paths
`;

export class AIService {
  /**
   * Generate company intelligence for a lead.
   * In production, this would call Claude API with web search results.
   * For PoC, returns structured enrichment data.
   */
  async enrichLead(lead: Partial<GTLead>): Promise<CompanyIntel> {
    logger.info(`Enriching lead: ${lead.displayName} at ${lead.company}`);

    const prompt = `You are a sales intelligence AI for HawkRidge Systems (a SolidWorks reseller).
Research and provide intelligence on the following company and contact:

Company: ${lead.company}
Contact: ${lead.displayName}, ${lead.title}
Email Domain: ${lead.email?.split('@')[1] || 'unknown'}
Industry: ${lead.industry || 'unknown'}
Website: ${lead.website || 'unknown'}

Provide a JSON response with:
{
  "summary": "2-3 sentence company overview relevant to selling engineering software",
  "recentNews": ["array of 2-3 recent news items about this company"],
  "techStack": ["known engineering/design tools they use"],
  "estimatedRevenue": "revenue range estimate",
  "employeeCount": estimated_number
}`;

    try {
      const result = await this.callLLM(prompt);
      return JSON.parse(result);
    } catch (error) {
      logger.warn('AI enrichment failed, returning partial data', { error });
      return {
        summary: `${lead.company} operates in the ${lead.industry || 'engineering'} sector.`,
        recentNews: [],
        techStack: [],
      };
    }
  }

  /**
   * Score a lead based on available data. (US-002)
   * Rule-based for PoC, transitioning to ML after 500+ data points.
   */
  scoreLead(lead: GTLead): { score: number; factors: string[] } {
    let score = 50; // Base score
    const factors: string[] = [];

    // Title-based scoring
    const titleWeight = this.getTitleWeight(lead.title);
    score += titleWeight.points;
    if (titleWeight.points > 0) factors.push(titleWeight.reason);

    // Buying signals boost
    for (const signal of lead.buyingSignals) {
      score += signal.impactScore;
      factors.push(`${signal.type.replace('_', ' ')}: ${signal.description.substring(0, 80)}`);
    }

    // Company intel scoring
    if (lead.companyIntel.techStack.some((t) =>
      ['solidworks', 'autocad', 'catia', 'inventor', 'fusion 360'].includes(t.toLowerCase())
    )) {
      score += 10;
      factors.push('Tech stack match: existing CAD/CAE user');
    }

    if (lead.companyIntel.employeeCount && lead.companyIntel.employeeCount > 100) {
      score += 5;
      factors.push(`Company size: ${lead.companyIntel.employeeCount} employees`);
    }

    // Engagement scoring
    if (lead.contactAttempts > 0 && lead.status === 'engaged') {
      score += 10;
      factors.push('Active engagement — has responded to outreach');
    }

    // Decay for unresponsive leads
    if (lead.contactAttempts >= 3 && lead.status !== 'engaged' && lead.status !== 'qualified') {
      score -= 15;
      factors.push('Cooling down — 3+ contact attempts with no response');
    }

    // Recency of last activity
    if (lead.lastActivity) {
      const daysSinceActivity = (Date.now() - new Date(lead.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity < 7) {
        score += 5;
      } else if (daysSinceActivity > 30) {
        score -= 10;
        factors.push('Stale — no activity in 30+ days');
      }
    }

    // Clamp to 0-100
    score = Math.max(0, Math.min(100, score));

    // Return top 3 factors
    return {
      score,
      factors: factors.slice(0, 3),
    };
  }

  private getTitleWeight(title: string): { points: number; reason: string } {
    const lower = title.toLowerCase();
    if (lower.includes('cto') || lower.includes('ceo') || lower.includes('coo') || lower.includes('chief')) {
      return { points: 15, reason: 'C-level contact — executive decision maker' };
    }
    if (lower.includes('vp') || lower.includes('vice president')) {
      return { points: 12, reason: 'VP-level contact — key decision maker' };
    }
    if (lower.includes('director')) {
      return { points: 10, reason: 'Director-level contact — budget authority likely' };
    }
    if (lower.includes('head of') || lower.includes('manager')) {
      return { points: 7, reason: 'Manager-level contact — influences buying decisions' };
    }
    if (lower.includes('senior') || lower.includes('lead')) {
      return { points: 3, reason: 'Senior IC — technical evaluator and champion' };
    }
    return { points: 0, reason: '' };
  }

  /**
   * Generate personalized outreach emails. (US-003)
   */
  async generateOutreach(
    lead: GTLead,
    sequenceType: string,
    variants: number = 3,
    tone: string = 'professional_casual'
  ): Promise<EmailVariant[]> {
    logger.info(`Generating ${variants} outreach variants for ${lead.displayName}`);

    const prompt = `You are an expert sales copywriter for HawkRidge Systems.

${HAWKRIDGE_CONTEXT}

Generate ${variants} email variants for a ${sequenceType} outreach to:
Name: ${lead.displayName}
Title: ${lead.title}
Company: ${lead.company}
Industry: ${lead.industry || 'Engineering/Manufacturing'}

Company Intelligence:
${lead.companyIntel.summary}

Recent News:
${lead.companyIntel.recentNews.join('\n')}

Buying Signals:
${lead.buyingSignals.map((s) => `- ${s.description}`).join('\n') || 'None detected'}

Tone: ${tone}

Return a JSON array of email variants:
[{
  "subject": "email subject line",
  "body": "full email body with personalization",
  "personalizationPoints": ["what was personalized"]
}]

Requirements:
- Each email MUST include a personalized opener referencing the contact or company context
- Include a clear value proposition for HawkRidge's solutions relevant to their needs
- End with a specific, low-friction call-to-action (15-min call, quick demo, etc.)
- Keep emails under 150 words
- Each variant should take a different angle/approach`;

    try {
      const result = await this.callLLM(prompt);
      return JSON.parse(result);
    } catch (error) {
      logger.warn('AI outreach generation failed, using templates', { error });
      return this.getFallbackOutreach(lead, variants);
    }
  }

  /**
   * Analyze a call transcript and generate intelligence. (US-005)
   */
  async analyzeCall(transcript: string, lead: GTLead): Promise<Partial<CallIntelligence>> {
    logger.info(`Analyzing call for lead: ${lead.displayName}`);

    const prompt = `You are a sales call intelligence analyst for HawkRidge Systems.

${HAWKRIDGE_CONTEXT}

Analyze this call transcript between an SDR and ${lead.displayName} (${lead.title} at ${lead.company}):

TRANSCRIPT:
${transcript}

Provide a JSON response with:
{
  "summary": "3-5 sentence call summary focusing on outcomes and key discussion points",
  "actionItems": ["specific follow-up actions for the SDR"],
  "sentimentScore": number_from_-1_to_1,
  "keyMoments": [{
    "timestamp": approximate_seconds,
    "type": "objection|buying_signal|competitor_mention|pricing_discussion|next_steps|pain_point",
    "description": "what happened",
    "transcript": "relevant quote",
    "sentiment": number_from_-1_to_1
  }],
  "coachingTips": ["specific coaching suggestions based on call performance"],
  "competitorsMentioned": ["competitor names mentioned"]
}`;

    try {
      const result = await this.callLLM(prompt);
      return JSON.parse(result);
    } catch (error) {
      logger.warn('AI call analysis failed', { error });
      return {
        summary: 'Call analysis temporarily unavailable. Please review the recording manually.',
        actionItems: ['Review call recording manually'],
        sentimentScore: 0,
        keyMoments: [],
        coachingTips: [],
        competitorsMentioned: [],
      };
    }
  }

  /**
   * Core LLM call — routes to configured provider.
   */
  private async callLLM(prompt: string): Promise<string> {
    if (config.ai.provider === 'anthropic' && config.ai.anthropicApiKey) {
      return this.callClaude(prompt);
    }
    if (config.ai.provider === 'azure_openai' && config.ai.azureOpenaiKey) {
      return this.callAzureOpenAI(prompt);
    }

    // In dev without API keys, return a structured placeholder
    logger.warn('No AI provider configured — returning placeholder response');
    throw new Error('No AI provider configured');
  }

  private async callClaude(prompt: string): Promise<string> {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: config.ai.anthropicApiKey });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text in Claude response');
    }
    // Extract JSON from response (handle markdown code blocks)
    const text = textBlock.text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    return jsonMatch ? jsonMatch[1].trim() : text.trim();
  }

  private async callAzureOpenAI(prompt: string): Promise<string> {
    const url = `${config.ai.azureOpenaiEndpoint}/openai/deployments/${config.ai.azureOpenaiDeployment}/chat/completions?api-version=2024-02-01`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': config.ai.azureOpenaiKey,
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content;
  }

  private getFallbackOutreach(lead: GTLead, variants: number): EmailVariant[] {
    const templates: EmailVariant[] = [
      {
        subject: `Quick question about ${lead.company}'s engineering workflow`,
        body: `Hi ${lead.displayName.split(' ')[0]},\n\nI noticed ${lead.company} is growing its engineering capabilities${lead.companyIntel.recentNews.length > 0 ? ' — congrats on the recent developments' : ''}.\n\nAt HawkRidge Systems, we help engineering teams like yours streamline their design-to-manufacture workflow with SolidWorks and complementary tools.\n\nWould you be open to a 15-minute call to explore if there's a fit?\n\nBest,\n[SDR Name]`,
        personalizationPoints: ['company_name', 'recent_news'],
      },
      {
        subject: `How ${lead.industry || 'engineering'} teams are cutting design cycles by 40%`,
        body: `Hi ${lead.displayName.split(' ')[0]},\n\nI work with ${lead.title.includes('VP') || lead.title.includes('Director') ? 'engineering leaders' : 'engineering teams'} in the ${lead.industry || 'manufacturing'} space who are looking to accelerate their product development.\n\nOne of our clients recently reduced their design iteration cycle by 40% using integrated simulation and design automation.\n\nWould it be worth 15 minutes to see if similar results are achievable for ${lead.company}?\n\nBest,\n[SDR Name]`,
        personalizationPoints: ['title_level', 'industry'],
      },
      {
        subject: `${lead.company} + HawkRidge: a quick thought`,
        body: `Hi ${lead.displayName.split(' ')[0]},\n\nI've been following ${lead.company}'s work in ${lead.industry || 'engineering'} — impressive trajectory.\n\nI had a thought on how HawkRidge Systems might help your team with ${lead.companyIntel.techStack.length > 0 ? `your ${lead.companyIntel.techStack[0]} workflow` : 'your engineering workflow'}.\n\nNo pressure — just a quick 15-minute conversation. Would next week work?\n\nBest,\n[SDR Name]`,
        personalizationPoints: ['company_trajectory', 'tech_stack'],
      },
    ];

    return templates.slice(0, variants);
  }
}

export const aiService = new AIService();
