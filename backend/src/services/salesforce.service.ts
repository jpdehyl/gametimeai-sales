// ============================================================
// Salesforce Integration Service
// Handles bidirectional sync: SF → GameTime, GameTime → SF
// Stubbed for PoC — real integration in production
// ============================================================

import { config } from '../config';
import { logger } from '../utils/logger';

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
   * Create a Salesforce Task from call analysis.
   */
  async createCallTask(
    salesforceRecordId: string,
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
        WhoId: salesforceRecordId,
        Subject: `Call - ${outcome}`,
        Description: `${summary}\n\nAction Items:\n${actionItems.map((a: string) => `• ${a}`).join('\n')}`,
        Status: 'Completed',
        Priority: 'Normal',
        Type: 'Call',
        CallDurationInSeconds: duration,
        ActivityDate: new Date().toISOString().split('T')[0],
      });
      logger.info(`Created SF Task ${result.id}`);
      return result.id;
    } catch (error) {
      logger.error('Failed to create SF Task', { error });
      return null;
    }
  }

  /**
   * Write deal health score back to Salesforce Opportunity.
   * In production, syncs deal intelligence to SF custom fields.
   */
  async writeDealScore(salesforceOpportunityId: string, healthScore: number): Promise<boolean> {
    if (!this.isConnected || !this.connection) {
      logger.debug('Salesforce not connected — skipping score writeback');
      return false;
    }

    try {
      await this.connection.sobject('Opportunity').update({
        Id: salesforceOpportunityId,
        GameTime_Health_Score__c: healthScore,
      });
      logger.info(`Wrote health score ${healthScore} to SF Opportunity ${salesforceOpportunityId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to write score to SF Opportunity ${salesforceOpportunityId}`, { error });
      return false;
    }
  }
}

export const salesforceService = new SalesforceService();
