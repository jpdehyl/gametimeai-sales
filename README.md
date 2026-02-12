# GameTime AI

AI-Powered Sales Intelligence Platform for HawkRidge Systems.

## Overview

GameTime AI is a Monaco-inspired, AI-native sales intelligence platform that sits as an intelligence layer on top of HawkRidge's existing Salesforce + Zoom + Azure stack. It provides:

- **AI Lead Scoring** — Rule-based scoring with buying signal detection (US-002)
- **Salesforce Sync** — Bidirectional sync with AI enrichment (US-001)
- **AI Outreach Generation** — Personalized email sequences via Claude/Azure OpenAI (US-003)
- **Unified Dashboard** — Action-first command center for SDRs (US-004)
- **Call Intelligence** — ZRA integration with AI analysis, coaching, and SF task creation (US-005)

## Architecture

```
Frontend (Next.js 14 + React + Tailwind)
    ↕
Backend API (Express.js + TypeScript)
    ↕
Integrations: Salesforce REST API | Zoom/ZRA API | Claude/Azure OpenAI
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# Edit .env files with your credentials
```

### Development

```bash
# Run both backend and frontend
npm run dev

# Or run separately:
npm run dev:backend   # API on http://localhost:3001
npm run dev:frontend  # App on http://localhost:3000
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/dashboard` | Dashboard data (leads, calls, pipeline) |
| GET | `/api/v1/leads` | Prioritized lead list |
| GET | `/api/v1/leads/:id` | Lead detail with enrichment |
| POST | `/api/v1/leads/sync` | Trigger Salesforce sync |
| POST | `/api/v1/leads/:id/score` | Re-score a lead |
| POST | `/api/v1/outreach/generate` | Generate AI outreach emails |
| GET | `/api/v1/calls` | Recent call list |
| GET | `/api/v1/calls/:id` | Call detail with analysis |
| POST | `/api/v1/webhooks/zra` | ZRA call webhook |
| GET | `/api/health` | Health check |

## Tech Stack

- **Frontend:** Next.js 14, React 18, Tailwind CSS, TanStack Query
- **Backend:** Express.js, TypeScript, Socket.io
- **AI:** Claude API (Anthropic) with Azure OpenAI fallback
- **Integrations:** Salesforce REST API, Zoom Revenue Accelerator API
- **Auth:** Azure AD SSO (planned), JWT

## Project Structure

```
gametimeai-sales/
├── backend/
│   └── src/
│       ├── config/        # Environment configuration
│       ├── routes/         # API route handlers
│       ├── services/       # Business logic (AI, Salesforce, Zoom)
│       ├── store/          # In-memory data store (PoC)
│       ├── types/          # TypeScript interfaces
│       ├── utils/          # Logger, helpers
│       └── index.ts        # Express server entry
├── frontend/
│   └── src/
│       ├── components/     # React components
│       ├── lib/            # API client, utilities
│       ├── pages/          # Next.js pages
│       └── styles/         # Global CSS
└── README.md
```

## Phase 1 (PoC) Scope

- [x] US-001: Salesforce Lead Sync & AI Enrichment
- [x] US-002: AI-Powered Lead Scoring & Prioritization
- [x] US-003: AI Outreach Generation (Email Sequences)
- [x] US-004: Unified Sales Dashboard
- [x] US-005: ZRA Call Intelligence Integration
