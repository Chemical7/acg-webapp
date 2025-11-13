# ACG Client Service System

A comprehensive web application for managing ACG's client-service workflows, from onboarding to delivery, with built-in QA, approvals, and analytics.

## Project Overview

**Goal**: Digitize ACG's client-service system into a guided web application that walks staff through each project stage with proper templates, enforces peer review and approval workflows, and tracks KPIs for leadership.

**Tech Stack**: Hono + TypeScript + Cloudflare D1 + TailwindCSS

**Public URL**: https://3000-ifzu109gtk9kd7bkihvkv-b237eb32.sandbox.novita.ai

## Features Completed (MVP)

### ✅ Core Workflow Management
- **Guided Project Creation**: Wizard automatically creates 6 stages + 5 mandatory files (Brief, Contract Summary, Contact Reports, Finance Notes, Tracker)
- **Stage-Based Process**: Onboarding → Brief & Strategy → Execution → QA/Review → Delivery/Reporting → Post-Project Review
- **Project Tracker**: Per-project task management with status, priorities, and risk tracking

### ✅ QA & Approval System
- **Dual-Layer Approval**: Peer review + Senior approval workflow
- **Blocking Enforcement**: Tasks cannot be marked "sent" until both approvals pass
- **Approval Queue**: Dedicated view for pending peer and senior approvals
- **Escalation Button**: Timestamp notes for risks/issues with severity levels

### ✅ Client Brief Builder
- **Structured Form**: Objectives, audience, tone, channels, timeline, approvals
- **Client Sign-off**: Capture client approval with immutable record
- **Status Tracking**: Draft → Submitted → Approved → Revision Needed

### ✅ Document Management
- **5 Mandatory Files**: Auto-created for each project
  - Client Brief
  - Contract Summary (visible to team)
  - Contact Reports (with email generation)
  - Finance Notes (admin-only locked)
  - Project Tracker
- **Role-Based Access**: Finance and sensitive docs locked by role

### ✅ Contact Reports
- **Quick-Add Interface**: Meeting summary → auto-filed
- **Email Distribution**: Automatic email to leads and stakeholders
- **Meeting Details**: Attendees, action items, date tracking

### ✅ Templates Hub
- **Searchable Library**: Brand CI, Reports, Digital/Social, Webinars, QA Checklists
- **Category Organization**: Quick access to ACG templates
- **Template Metadata**: Tags, descriptions, download links

### ✅ Analytics Dashboard
- **KPI Overview**: Tasks due this week, overdue tasks, pending approvals, open risks
- **Project Health**: Per-project metrics (completion rate, overdue tasks, risk count)
- **Health Status**: Visual indicators (Good/Moderate/Poor)
- **Real-time Stats**: Current period analytics

### ✅ "Ask the Process" Assistant
- **Mock LLM Q&A**: Answer questions about ACG processes, templates, guidelines
- **Template Links**: Direct links to relevant templates
- **Sidebar Panel**: Always accessible from any view
- **Context-Aware**: Returns citations and "open template" buttons

### ✅ Security & Audit
- **Audit Logging**: Every action logged with user, timestamp, IP address
- **Role-Based Access Control (RBAC)**: Admin, Account Lead, Project Lead, Specialist, Viewer
- **Mock Authentication**: X-User-Id header (ready for Google OAuth integration)
- **Locked Resources**: Finance and password areas restricted

## User Roles

- **Admin (CEO/GM/CS Lead)**: Full access, policies, analytics
- **Account Lead / Project Lead**: Owns trackers, briefs, approvals
- **Specialists (PR/Digital/Events)**: Complete assigned tasks under QA/brand rules
- **Viewer**: Read-only access to client-safe documents

## Data Architecture

### Database (Cloudflare D1 SQLite)
- **Core Tables**: users, clients, projects, stages, tasks
- **Workflow**: approvals, risks, escalations, briefs
- **Tracking**: kpi_events, contact_reports, files, templates
- **Audit**: audit_logs (user_id, action, resource_type, ip_address, timestamp)

### Storage Services
- **D1 Database**: All relational data (33 tables with indexes)
- **Local Development**: SQLite with --local flag
- **Production**: Cloudflare D1 globally distributed

## API Endpoints

### Authentication
- `GET /api/auth/me` - Get current user (mock auth via X-User-Id header)

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client

### Projects
- `GET /api/projects` - List projects (filter by client_id, lead_id)
- `GET /api/projects/:id` - Get project details with stages, files, risks
- `POST /api/projects` - Create project (auto-creates 6 stages + 5 files)

### Stages
- `PATCH /api/stages/:id` - Update stage status/due date

### Tasks
- `GET /api/tasks` - List tasks (filter by project_id, owner_id, status)
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task

### Approvals
- `GET /api/approvals/pending` - Get pending approvals for current user
- `POST /api/approvals` - Create approval request
- `PATCH /api/approvals/:id/peer` - Peer review (approve/reject)
- `PATCH /api/approvals/:id/senior` - Senior approval (approve/reject)

### Briefs
- `GET /api/briefs/:project_id` - Get project brief
- `POST /api/briefs` - Create brief
- `PATCH /api/briefs/:id/sign-off` - Client sign-off

### Risks
- `GET /api/risks` - List risks (filter by project_id)
- `POST /api/risks` - Create risk
- `PATCH /api/risks/:id` - Update risk status

### Contact Reports
- `GET /api/contact-reports` - List contact reports (filter by project_id)
- `POST /api/contact-reports` - Create contact report (auto-emails)

### Templates
- `GET /api/templates` - List templates (filter by category, search)

### Escalations
- `GET /api/escalations` - List escalations (filter by project_id, status)
- `POST /api/escalations` - Create escalation (auto-logs KPI event)

### Analytics
- `GET /api/analytics/overview` - KPI summary for current period
- `GET /api/analytics/project-health` - Per-project health metrics

### Assistant
- `POST /api/assistant/ask` - Ask the Process (mock LLM responses)

## User Guide

### Getting Started
1. **Login**: System uses mock auth (CEO Admin by default)
2. **Dashboard**: View your tasks, KPIs, and project overview
3. **Create Project**: Click "New Project" → Fill wizard → Auto-creates structure

### Project Workflow
1. **Project Creation**: Wizard creates 6 stages + 5 mandatory files
2. **Brief Building**: Complete client brief form → Request sign-off
3. **Task Assignment**: Add tasks to stages → Assign owners
4. **QA Submission**: Submit content for peer review → Senior approval
5. **Delivery**: Once approved, mark tasks complete
6. **Reporting**: Add contact reports → Track in timeline

### Approval Process
1. Specialist submits task for review
2. Peer reviewer approves/rejects
3. If approved → Senior approver reviews
4. Both approvals required before delivery
5. Rejections require notes and reset workflow

### Analytics Monitoring
- View real-time KPIs on dashboard
- Check project health scores
- Monitor overdue tasks and risks
- Export audit logs (future feature)

## Development

### Local Setup
```bash
# Install dependencies
npm install

# Apply database migrations
npm run db:migrate:local

# Seed test data
npm run db:seed

# Build project
npm run build

# Start development server
npm run dev:sandbox

# Or use PM2
pm2 start ecosystem.config.cjs
```

### Database Management
```bash
# Reset database (clear all data)
npm run db:reset

# Execute SQL query
npm run db:console:local

# View tables
wrangler d1 execute acg-webapp-production --local --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### Testing
```bash
# Test server
npm test  # curl http://localhost:3000

# Test API
curl http://localhost:3000/api/auth/me
curl http://localhost:3000/api/projects
curl http://localhost:3000/api/templates
```

## Deployment

### Status
- **Platform**: Cloudflare Pages (ready for deployment)
- **Current**: Running in sandbox at https://3000-ifzu109gtk9kd7bkihvkv-b237eb32.sandbox.novita.ai
- **Production**: Requires Cloudflare API key configuration

### Deploy to Production
```bash
# Setup Cloudflare API key first
# Call setup_cloudflare_api_key tool

# Create production D1 database
npx wrangler d1 create acg-webapp-production

# Update wrangler.jsonc with database_id

# Apply migrations to production
npm run db:migrate:prod

# Build and deploy
npm run deploy:prod
```

## Features Not Yet Implemented

### Phase 2 (Planned)
- **LLM RAG Integration**: Real vector database with ACG docs embedding
- **Google Drive Sync**: Automatic template sync from Drive folders
- **Email Integration**: Real SMTP for contact reports
- **Google OAuth**: Replace mock auth with real Google SSO
- **Advanced Search**: Full-text search across projects, tasks, files

### Phase 3 (Planned)
- **Billing Module**: Invoice tracking and client billing
- **Resource Planning**: Staffing models and capacity planning
- **Client Portal**: Separate portal for client requests
- **Advanced Analytics**: Trend charts, forecasting, compliance reports
- **Mobile App**: React Native mobile application

## Acceptance Criteria Status

✅ User can create a new project → wizard auto-creates 5 mandatory items (6 stages)  
✅ User can complete brief form with client sign-off → saved and immutable  
✅ User can submit content for QA → peer + senior approval required  
✅ User can add contact report → generates email placeholder  
✅ User can trigger "Ask the Process" → returns mock doc links  
✅ Dashboard shows KPIs and overdue/at-risk trackers  
✅ Every action logged with user, date, IP in audit_logs table  

## System Architecture

```
Frontend (SPA):
- Pure JavaScript + TailwindCSS
- Single-page application with client-side routing
- Real-time UI updates via API calls

Backend (Hono):
- RESTful API on Cloudflare Workers
- Type-safe with TypeScript
- Middleware: CORS, audit logging

Database (D1):
- SQLite-based globally distributed
- 33 tables with proper indexes
- Local dev with --local flag

Deployment:
- Cloudflare Pages for static assets
- Cloudflare Workers for API routes
- Edge computing for global performance
```

## Last Updated
2025-11-13

## License
Proprietary - ACG Internal Use Only
