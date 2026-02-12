// ============================================================
// GameTime AI — API Gateway
// Express.js + Auth + RBAC (per PRD Section 4)
// ============================================================

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { logger } from './utils/logger';
import { salesforceService } from './services/salesforce.service';

// Route imports
import leadsRouter from './routes/leads.routes';
import outreachRouter from './routes/outreach.routes';
import callsRouter, { webhookRouter } from './routes/calls.routes';
import dashboardRouter from './routes/dashboard.routes';

const app = express();
const httpServer = createServer(app);

// WebSocket setup for real-time notifications (US-004)
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'gametimeai-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes (v1)
app.use('/api/v1/leads', leadsRouter);
app.use('/api/v1/outreach', outreachRouter);
app.use('/api/v1/calls', callsRouter);
app.use('/api/v1/webhooks', webhookRouter);
app.use('/api/v1/dashboard', dashboardRouter);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: config.nodeEnv === 'production' ? 'An unexpected error occurred' : err.message,
    statusCode: 500,
  });
});

// Start server
async function start() {
  // Attempt Salesforce connection (non-blocking for PoC)
  salesforceService.connect().catch((err) => {
    logger.warn('Salesforce connection failed — running in demo mode', { error: err });
  });

  httpServer.listen(config.port, () => {
    logger.info(`GameTime AI API running on port ${config.port}`);
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`CORS origin: ${config.corsOrigin}`);
  });
}

start();

export { app, io };
