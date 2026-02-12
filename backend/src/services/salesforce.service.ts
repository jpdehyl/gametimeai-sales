// ============================================================
// Salesforce Integration Service (US-001)
// Handles bidirectional sync: SF → GameTime, GameTime → SF
// ============================================================

import { config } from '../config';
import { logger } from '../utils/logger';
import { store } from '../store';
import { GTLead } from '../types';
import { v4 as uuid } from 'uuid';
import { aiService } from './ai.service';

interface SalesforceLeadRecord {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Company: string;
  Title: string;
  Phone?: string;
  Industry?: string;
  Website?: string;
  Status: string;
  // Custom GameTime fields
  GameTime_Score__c?: number;
  GameTime_Score_Factors__c?: string;
}

export class SalesforceService {
  private connection: any = null;
  private isConnected = false;

  /**
   * Initialize Salesforce connection using jsforce.
   * In PoC, gracefully handles missing credentials.
   */
  async connect(): Promise<boolean> {
    if (!config.salesforce.clientId || !config.salesforce.username) {
      logger.warn('Salesforce credentials not configured — running in demo mode');
      return false;
    }

    try {
      const jsforce = await import('jsforce');
      this.connection = new jsforce.Connection({
        loginUrl: config.salesforce.loginUrl,
        version: config.salesforce.apiVersion,
      });

      await this.connection.login(
        config.salesforce.username,
        config.salesforce.password + config.salesforce.securityToken
      );

      this.isConnected = true;
      logger.info('Connected to Salesforce successfully');
      return true;
    } catch (error) {
      logger.error('Failed to connect to Salesforce', { error });
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Sync leads from Salesforce into GameTime. (US-001)
   * Queries SF Lead + Contact objects, creates/updates GTLead records,
   * triggers AI enrichment for new leads.
   */
  async syncLeads(): Promise<{ synced: number; errors: number }> {
    if (!this.isConnected || !this.connection) {
      logger.info('Salesforce not connected — using demo data');
      return { synced: store.leads.size, errors: 0 };
    }

    let synced = 0;
    let errors = 0;

    try {
      const records: SalesforceLeadRecord[] = await this.connection
        .sobject('Lead')
        .find(
          { IsConverted: false },
          {
            Id: 1, FirstName: 1, LastName: 1, Email: 1, Company: 1,
            Title: 1, Phone: 1, Industry: 1, Website: 1, Status: 1,
            GameTime_Score__c: 1, GameTime_Score_Factors__c: 1,
          }
        )
        .sort({ LastModifiedDate: -1 })
        .limit(200)
        .execute();

      for (const record of records) {
        try {
          const existingId = store.leadsBySalesforceId.get(record.Id);
          if (existingId) {
            // Update existing lead
            const existing = store.leads.get(existingId)!;
            existing.displayName = `${record.FirstName || ''} ${record.LastName}`.trim();
            existing.email = record.Email;
            existing.company = record.Company;
            existing.title = record.Title || '';
            existing.phone = record.Phone;
            existing.industry = record.Industry;
            existing.website = record.Website;
            existing.lastSyncedAt = new Date();
            existing.syncStatus = 'synced';
            existing.updatedAt = new Date();
            store.leads.set(existingId, existing);
          } else {
            // Create new lead
            const newLead: GTLead = {
              id: `gt_lead_${uuid().substring(0, 8)}`,
              salesforceId: record.Id,
              displayName: `${record.FirstName || ''} ${record.LastName}`.trim(),
              email: record.Email,
              company: record.Company,
              title: record.Title || '',
              phone: record.Phone,
              industry: record.Industry,
              website: record.Website,
              aiScore: 50,
              scoreFactors: [],
              companyIntel: { summary: '', recentNews: [], techStack: [] },
              buyingSignals: [],
              lastScoredAt: null,
              lastSyncedAt: new Date(),
              syncStatus: 'synced',
              contactAttempts: 0,
              status: 'new',
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            store.leads.set(newLead.id, newLead);
            store.leadsBySalesforceId.set(record.Id, newLead.id);

            // Trigger async enrichment
            this.enrichLeadAsync(newLead.id);
          }
          synced++;
        } catch (err) {
          errors++;
          logger.error(`Failed to sync lead ${record.Id}`, { error: err });
        }
      }

      logger.info(`Salesforce sync complete: ${synced} synced, ${errors} errors`);
    } catch (error) {
      logger.error('Salesforce lead sync failed', { error });
      errors++;
    }

    return { synced, errors };
  }

  /**
   * Write AI score back to Salesforce custom fields.
   */
  async writeScoreToSalesforce(salesforceId: string, score: number, factors: string[]): Promise<boolean> {
    if (!this.isConnected || !this.connection) {
      logger.debug('Salesforce not connected — skipping score writeback');
      return false;
    }

    try {
      await this.connection.sobject('Lead').update({
        Id: salesforceId,
        GameTime_Score__c: score,
        GameTime_Score_Factors__c: factors.join('\n'),
      });
      logger.info(`Wrote score ${score} to SF Lead ${salesforceId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to write score to SF Lead ${salesforceId}`, { error });
      return false;
    }
  }

  /**
   * Create a Salesforce Task from call analysis. (US-005)
   */
  async createCallTask(
    salesforceLeadId: string,
    summary: string,
    actionItems: string[],
    duration: number,
    outcome: string
  ): Promise<string | null> {
    if (!this.isConnected || !this.connection) {
      logger.debug('Salesforce not connected — skipping task creation');
      return null;
    }

    try {
      const result = await this.connection.sobject('Task').create({
        WhoId: salesforceLeadId,
        Subject: `Call - ${outcome}`,
        Description: `${summary}\n\nAction Items:\n${actionItems.map((a) => `• ${a}`).join('\n')}`,
        Status: 'Completed',
        Priority: 'Normal',
        Type: 'Call',
        CallDurationInSeconds: duration,
        ActivityDate: new Date().toISOString().split('T')[0],
      });
      logger.info(`Created SF Task ${result.id} for Lead ${salesforceLeadId}`);
      return result.id;
    } catch (error) {
      logger.error(`Failed to create SF Task for Lead ${salesforceLeadId}`, { error });
      return null;
    }
  }

  /**
   * Background enrichment for newly synced leads.
   */
  private async enrichLeadAsync(leadId: string): Promise<void> {
    const lead = store.leads.get(leadId);
    if (!lead) return;

    try {
      const intel = await aiService.enrichLead(lead);
      lead.companyIntel = intel;

      // Re-score after enrichment
      const { score, factors } = aiService.scoreLead(lead);
      lead.aiScore = score;
      lead.scoreFactors = factors;
      lead.lastScoredAt = new Date();
      lead.updatedAt = new Date();

      store.leads.set(leadId, lead);

      // Write back to SF
      this.writeScoreToSalesforce(lead.salesforceId, score, factors);

      logger.info(`Enriched and scored lead ${leadId}: score=${score}`);
    } catch (error) {
      logger.error(`Background enrichment failed for lead ${leadId}`, { error });
    }
  }
}

export const salesforceService = new SalesforceService();
