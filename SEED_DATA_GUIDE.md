# Production Data Seeding Guide

## Overview
This guide explains how to populate your ACG Client Service System with 3 months of realistic dummy data to showcase the analytics dashboard and other features.

## Option 1: Quick Seed (Recommended for Testing)

### Simple Command
```bash
# Reset database with production-like data
npm run db:reset
npm run db:seed

# Restart server to see changes
pm2 restart acg-webapp
```

## Option 2: Manual SQL Generation (For Custom Data)

### Step 1: Clear Existing Data
```bash
wrangler d1 execute acg-webapp-production --local --command="
DELETE FROM audit_logs;
DELETE FROM kpi_events;
DELETE FROM contact_reports;
DELETE FROM escalations;
DELETE FROM approvals;
DELETE FROM tasks;
DELETE FROM risks;
DELETE FROM briefs;
DELETE FROM files;
DELETE FROM stages;
DELETE FROM projects;
DELETE FROM clients;
DELETE FROM users;
DELETE FROM templates;
"
```

### Step 2: Add Users (20 users)
```bash
wrangler d1 execute acg-webapp-production --local --command="
INSERT INTO users (id, email, name, role, created_at) VALUES 
  (1, 'ceo@acg.com', 'Sarah Chen', 'admin', '2024-08-01 09:00:00'),
  (2, 'gm@acg.com', 'Michael Roberts', 'admin', '2024-08-01 09:00:00'),
  (3, 'cs.lead@acg.com', 'Jennifer Martinez', 'admin', '2024-08-01 09:00:00'),
  (4, 'lead.tech@acg.com', 'David Kumar', 'account_lead', '2024-08-01 09:00:00'),
  (5, 'lead.healthcare@acg.com', 'Emily Thompson', 'account_lead', '2024-08-01 09:00:00'),
  (6, 'lead.finance@acg.com', 'James Wilson', 'account_lead', '2024-08-01 09:00:00'),
  (7, 'pm.alpha@acg.com', 'Lisa Anderson', 'project_lead', '2024-08-01 09:00:00'),
  (8, 'pm.beta@acg.com', 'Robert Chang', 'project_lead', '2024-08-01 09:00:00'),
  (9, 'pm.gamma@acg.com', 'Maria Garcia', 'project_lead', '2024-08-01 09:00:00'),
  (10, 'pr.senior@acg.com', 'Amanda Foster', 'specialist', '2024-08-01 09:00:00'),
  (11, 'pr.mid@acg.com', 'Chris Parker', 'specialist', '2024-08-01 09:00:00'),
  (12, 'pr.junior@acg.com', 'Nina Patel', 'specialist', '2024-08-01 09:00:00'),
  (13, 'digital.senior@acg.com', 'Tom Bradley', 'specialist', '2024-08-01 09:00:00'),
  (14, 'digital.mid@acg.com', 'Sophie Lee', 'specialist', '2024-08-01 09:00:00'),
  (15, 'digital.junior@acg.com', 'Alex Johnson', 'specialist', '2024-08-01 09:00:00'),
  (16, 'events.senior@acg.com', 'Rachel Green', 'specialist', '2024-08-01 09:00:00'),
  (17, 'events.mid@acg.com', 'Kevin Brown', 'specialist', '2024-08-01 09:00:00'),
  (18, 'viewer.client1@acg.com', 'Client Contact A', 'viewer', '2024-08-01 09:00:00'),
  (19, 'viewer.client2@acg.com', 'Client Contact B', 'viewer', '2024-08-01 09:00:00'),
  (20, 'viewer.client3@acg.com', 'Client Contact C', 'viewer', '2024-08-01 09:00:00');
"
```

### Step 3: Add Clients (15 clients)
```bash
wrangler d1 execute acg-webapp-production --local --command="
INSERT INTO clients (id, name, status, sector, created_at) VALUES 
  (1, 'TechVision Global', 'active', 'Technology', '2024-08-01 10:00:00'),
  (2, 'HealthFirst Medical', 'active', 'Healthcare', '2024-08-05 10:00:00'),
  (3, 'GreenEnergy Solutions', 'active', 'Energy', '2024-08-10 10:00:00'),
  (4, 'FinanceHub Corp', 'active', 'Finance', '2024-08-12 10:00:00'),
  (5, 'EduTech Academy', 'active', 'Education', '2024-08-15 10:00:00'),
  (6, 'RetailMax Inc', 'active', 'Retail', '2024-08-20 10:00:00'),
  (7, 'CloudSecure Systems', 'active', 'Technology', '2024-08-25 10:00:00'),
  (8, 'BioPharm Research', 'active', 'Healthcare', '2024-09-01 10:00:00'),
  (9, 'Urban Living Properties', 'active', 'Real Estate', '2024-09-05 10:00:00'),
  (10, 'FoodHub Networks', 'active', 'Food & Beverage', '2024-09-10 10:00:00'),
  (11, 'AutoDrive Technologies', 'active', 'Automotive', '2024-09-15 10:00:00'),
  (12, 'TravelWorld Express', 'active', 'Travel', '2024-09-20 10:00:00'),
  (13, 'MediaStream Pro', 'active', 'Media', '2024-09-25 10:00:00'),
  (14, 'LegalTech Partners', 'active', 'Legal', '2024-10-01 10:00:00'),
  (15, 'SportsFit International', 'active', 'Sports', '2024-07-15 10:00:00');
"
```

## Option 3: Automated Script (Coming Soon)

We've created a `seed_production_data.sql` file with comprehensive 3-month data, but it's too large for D1's single-execution limit. 

### What the Full Seed Includes:
- **20 users** across all roles
- **15 clients** in different sectors
- **25 projects** (mix of active, completed, on-hold)
- **150 stages** (6 per project)
- **400+ tasks** with realistic status progression
- **80+ approvals** (peer + senior reviews)
- **60+ risks** (open, mitigated, closed)
- **150+ contact reports** (weekly meetings)
- **12 escalations** (various severities)
- **200+ KPI events** (on-time, late, QA pass/fail)
- **20 templates** across all categories
- **Audit logs** for key actions

## Option 4: Use the API to Generate Data

You can also use the API to create data programmatically:

### Create Projects via API
```bash
# Create a new project
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 4" \
  -d '{
    "client_id": 1,
    "lead_id": 4,
    "name": "Q4 Product Launch",
    "start_date": "2024-10-01",
    "end_date": "2024-12-31"
  }'
```

### Create Tasks via API
```bash
# Add task to project
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 4" \
  -d '{
    "project_id": 1,
    "stage_id": 2,
    "title": "Draft press release",
    "description": "Create first draft of product launch press release",
    "owner_id": 10,
    "due_date": "2024-10-15",
    "priority": "high"
  }'
```

### Create Risks via API
```bash
# Add risk to project
curl -X POST http://localhost:3000/api/risks \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 4" \
  -d '{
    "project_id": 1,
    "description": "Client approval delays may impact timeline",
    "likelihood": "medium",
    "impact": "high",
    "mitigation": "Schedule buffer time and backup approval path",
    "owner_id": 7
  }'
```

## What You'll See After Seeding

### Dashboard Improvements
- **KPI Cards** showing real numbers:
  - Tasks due this week: 15-25
  - Overdue tasks: 5-10
  - Pending approvals: 8-12
  - Open risks: 10-15

### Projects View
- 25 projects across different clients
- Mix of statuses (active, completed, on_hold)
- Realistic timelines spanning 3 months
- Various team leads assigned

### Analytics Dashboard
- **Project Health Table**:
  - Completion rates (40%-90%)
  - Overdue task counts
  - Risk indicators
  - Health scores (Good/Moderate/Poor)

- **KPI Trends**:
  - On-time delivery rate: ~67%
  - QA pass rate: ~80%
  - Peer reviews completed: 80+
  - Escalations: 12 total

### Approvals Queue
- 10-15 pending approvals
- Mix of peer and senior reviews
- Real task titles and project context

### Templates Library
- 20 templates across 5 categories
- Searchable by keyword
- Tagged for easy discovery

## Quick Verification Commands

### Check Data Counts
```bash
# Count all records
wrangler d1 execute acg-webapp-production --local --command="
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM clients) as clients,
  (SELECT COUNT(*) FROM projects) as projects,
  (SELECT COUNT(*) FROM tasks) as tasks,
  (SELECT COUNT(*) FROM approvals) as approvals,
  (SELECT COUNT(*) FROM risks) as risks,
  (SELECT COUNT(*) FROM kpi_events) as kpi_events;
"
```

### Test Dashboard API
```bash
# Get analytics overview
curl -s http://localhost:3000/api/analytics/overview | python3 -m json.tool

# Get project health
curl -s http://localhost:3000/api/analytics/project-health | python3 -m json.tool

# Get all projects
curl -s http://localhost:3000/api/projects | python3 -m json.tool | head -50
```

## Customization Tips

### Adjust Date Ranges
To change the 3-month window, modify the date calculations in `seed_production_data.sql`:
- Start date: Currently `2024-08-01`
- End date: Currently `2024-11-13` (today)
- Adjust project `start_date` and `end_date` fields

### Adjust Data Volume
- **Fewer projects**: Remove rows from projects INSERT
- **More tasks**: Add more task_num values to CROSS JOIN
- **Different KPIs**: Modify kpi_events inserts

### Add Custom Clients/Projects
Copy the INSERT pattern and adjust:
```sql
INSERT INTO clients (id, name, status, sector, created_at) VALUES 
  (16, 'Your Company Name', 'active', 'Your Sector', '2024-10-01 10:00:00');

INSERT INTO projects (id, client_id, lead_id, name, start_date, end_date, status, created_at) VALUES 
  (26, 16, 4, 'Your Project Name', '2024-10-01', '2024-12-31', 'active', '2024-10-01 11:00:00');
```

## Troubleshooting

### "Too many terms in compound SELECT"
The full seed file is too complex for single execution. Use the step-by-step approach instead.

### "CONSTRAINT failed"
Check that enum values match schema constraints:
- client status: 'active', 'inactive', 'archived'
- project status: 'active', 'on_hold', 'completed', 'cancelled'
- task status: 'pending', 'in_progress', 'review', 'approved', 'completed', 'blocked'

### "Foreign key constraint failed"
Ensure parent records exist before creating child records:
1. Users first
2. Clients
3. Projects
4. Stages
5. Tasks
6. Everything else

## Recommended Workflow

For the best demo experience:

1. **Start fresh**:
   ```bash
   npm run db:reset
   ```

2. **Add production seed data** (use simplified version or API calls)

3. **Restart server**:
   ```bash
   pm2 restart acg-webapp
   ```

4. **Test dashboard**:
   - Open: https://3000-ifzu109gtk9kd7bkihvkv-b237eb32.sandbox.novita.ai
   - Check Dashboard for KPIs
   - View Projects list
   - Check Analytics page
   - Test Approvals queue

5. **Create more data on-the-fly** using the web interface:
   - Add new projects
   - Create tasks
   - Submit for approvals
   - Add risks and contact reports

This gives you a realistic 3-month historical dataset PLUS the ability to demonstrate live workflows!

## Alternative: Simple Multiplier Script

If you just want to multiply existing data quickly:

```bash
# This duplicates existing projects with new dates
wrangler d1 execute acg-webapp-production --local --command="
-- Create 10 more projects by copying existing ones
INSERT INTO projects (client_id, lead_id, name, start_date, end_date, status, created_at)
SELECT 
  client_id,
  lead_id,
  name || ' (Q4)',
  date('2024-10-01'),
  date('2024-12-31'),
  'active',
  datetime('now')
FROM projects
LIMIT 10;
"
```

This approach lets you quickly scale up your demo data without complex SQL.
