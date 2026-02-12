// ============================================================
// AI Service — LLM integration for enrichment, scoring, outreach, call analysis
// Supports Claude API (Anthropic) with Azure OpenAI fallback
// ============================================================

import { config } from '../config';
import { logger } from '../utils/logger';
import { Deal, Account, Activity } from '../types';

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

/** Shape returned by generateOutreach */
export interface EmailVariant {
  subject: string;
  body: string;
  personalizationPoints: string[];
}

export class AIService {
  /**
   * Enrich a deal with AI-generated intelligence.
   * In production, this would call Claude API with web search results.
   * For PoC, returns structured mock enrichment data.
   */
  async enrichDeal(deal: Partial<Deal>): Promise<{ summary: string; insights: string[] }> {
    logger.info(`Enriching deal: ${deal.name}`);

    const prompt = `You are a sales intelligence AI for HawkRidge Systems (a SolidWorks reseller).
Research and provide intelligence on the following deal:

Deal: ${deal.name}
Stage: ${deal.stage || 'unknown'}
Value: ${deal.value || 'unknown'}

${HAWKRIDGE_CONTEXT}

Provide a JSON response with:
{
  "summary": "2-3 sentence deal intelligence overview",
  "insights": ["array of 2-3 actionable insights for the AE"]
}`;

    try {
      const result = await this.callLLM(prompt);
      return JSON.parse(result);
    } catch (error) {
      logger.warn('AI deal enrichment failed, returning placeholder', { error });
      return {
        summary: `${deal.name || 'Deal'} is in the ${deal.stage || 'active'} stage.`,
        insights: ['Review recent stakeholder engagement', 'Update competitive positioning'],
      };
    }
  }

  /**
   * Generate personalized outreach emails for a deal context.
   * Accepts a flexible context object built by the route layer.
   */
  async generateOutreach(
    context: Record<string, unknown>,
    sequenceType: string,
    variants: number = 3,
    tone: string = 'professional_casual'
  ): Promise<EmailVariant[]> {
    logger.info(`Generating ${variants} outreach variants`);

    const prompt = `You are an expert sales copywriter for HawkRidge Systems.

${HAWKRIDGE_CONTEXT}

Generate ${variants} email variants for a ${sequenceType} outreach.
Context: ${JSON.stringify(context, null, 2)}
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
      return this.getFallbackOutreach(context, variants);
    }
  }

  /**
   * Analyze a call transcript and generate intelligence.
   */
  async analyzeCall(
    transcript: string,
    activity: Partial<Activity>
  ): Promise<{
    summary: string;
    actionItems: string[];
    sentimentScore: number;
    keyMoments: Array<{ timestamp: number; type: string; description: string; transcript: string; sentiment: number }>;
    coachingTips: string[];
    competitorsMentioned: string[];
  }> {
    logger.info(`Analyzing call activity: ${activity.id}`);

    const prompt = `You are a sales call intelligence analyst for HawkRidge Systems.

${HAWKRIDGE_CONTEXT}

Analyze this call transcript:

TRANSCRIPT:
${transcript}

Provide a JSON response with:
{
  "summary": "3-5 sentence call summary focusing on outcomes and key discussion points",
  "actionItems": ["specific follow-up actions for the AE"],
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

  private getFallbackOutreach(context: Record<string, unknown>, variants: number): EmailVariant[] {
    const dealCtx = (context.deal || {}) as Record<string, unknown>;
    const stakeholderCtx = (context.stakeholder || {}) as Record<string, unknown>;
    const accountCtx = (context.account || {}) as Record<string, unknown>;

    const dealName = (dealCtx.name as string) || 'your initiative';
    const stakeholderName = (stakeholderCtx.name as string) || 'there';
    const firstName = stakeholderName.split(' ')[0];
    const companyName = (accountCtx.name as string) || 'your company';
    const industry = (accountCtx.industry as string) || 'engineering';

    const templates: EmailVariant[] = [
      {
        subject: `Quick question about ${companyName}'s engineering workflow`,
        body: `Hi ${firstName},\n\nI noticed ${companyName} is growing its engineering capabilities.\n\nAt HawkRidge Systems, we help engineering teams like yours streamline their design-to-manufacture workflow with SolidWorks and complementary tools.\n\nWould you be open to a 15-minute call to explore if there's a fit?\n\nBest,\n[AE Name]`,
        personalizationPoints: ['company_name'],
      },
      {
        subject: `How ${industry} teams are cutting design cycles by 40%`,
        body: `Hi ${firstName},\n\nI work with engineering teams in the ${industry} space who are looking to accelerate their product development.\n\nOne of our clients recently reduced their design iteration cycle by 40% using integrated simulation and design automation.\n\nWould it be worth 15 minutes to see if similar results are achievable for ${companyName}?\n\nBest,\n[AE Name]`,
        personalizationPoints: ['industry'],
      },
      {
        subject: `${companyName} + HawkRidge: a quick thought`,
        body: `Hi ${firstName},\n\nI've been following ${companyName}'s work in ${industry} — impressive trajectory.\n\nI had a thought on how HawkRidge Systems might help your team with your engineering workflow.\n\nNo pressure — just a quick 15-minute conversation. Would next week work?\n\nBest,\n[AE Name]`,
        personalizationPoints: ['company_trajectory'],
      },
    ];

    return templates.slice(0, variants);
  }
}

export const aiService = new AIService();
