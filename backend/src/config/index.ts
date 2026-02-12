import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Salesforce
  salesforce: {
    loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',
    clientId: process.env.SF_CLIENT_ID || '',
    clientSecret: process.env.SF_CLIENT_SECRET || '',
    username: process.env.SF_USERNAME || '',
    password: process.env.SF_PASSWORD || '',
    securityToken: process.env.SF_SECURITY_TOKEN || '',
    apiVersion: process.env.SF_API_VERSION || '59.0',
  },

  // Zoom / ZRA
  zoom: {
    accountId: process.env.ZOOM_ACCOUNT_ID || '',
    clientId: process.env.ZOOM_CLIENT_ID || '',
    clientSecret: process.env.ZOOM_CLIENT_SECRET || '',
    webhookSecret: process.env.ZOOM_WEBHOOK_SECRET || '',
    zraApiUrl: process.env.ZRA_API_URL || 'https://api.zoom.us/v2',
  },

  // AI / LLM
  ai: {
    provider: (process.env.AI_PROVIDER || 'anthropic') as 'anthropic' | 'azure_openai',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    azureOpenaiEndpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    azureOpenaiKey: process.env.AZURE_OPENAI_KEY || '',
    azureOpenaiDeployment: process.env.AZURE_OPENAI_DEPLOYMENT || '',
  },

  // Azure AD Auth
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    azureAdTenantId: process.env.AZURE_AD_TENANT_ID || '',
    azureAdClientId: process.env.AZURE_AD_CLIENT_ID || '',
  },

  // App
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
};
