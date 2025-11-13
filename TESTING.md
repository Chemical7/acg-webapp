# ACG Client Service System - Testing Guide

## Live Application URL
**Public Access**: https://3000-ifzu109gtk9kd7bkihvkv-b237eb32.sandbox.novita.ai

## Quick Test Commands

### 1. Authentication (Mock)
```bash
curl http://localhost:3000/api/auth/me
# Expected: Returns CEO Admin user details
```

### 2. List All Projects
```bash
curl http://localhost:3000/api/projects
# Expected: Returns 3 test projects with client and lead info
```

### 3. Get Project Details with Stages & Files
```bash
curl http://localhost:3000/api/projects/1
# Expected: Project with 6 stages and 5 mandatory files
```

### 4. List All Users
```bash
curl http://localhost:3000/api/users
# Expected: 8 users (CEO, GM, leads, specialists, viewer)
```

### 5. List Templates
```bash
curl http://localhost:3000/api/templates
# Expected: 5 templates across different categories
```

### 6. Analytics Dashboard
```bash
curl http://localhost:3000/api/analytics/overview
# Expected: KPI counts, overdue tasks, pending approvals, open risks
```

### 7. Project Health Metrics
```bash
curl http://localhost:3000/api/analytics/project-health
# Expected: Per-project completion rates and risk counts
```

### 8. Ask the Process Assistant
```bash
curl -X POST http://localhost:3000/api/assistant/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the QA process?"}'
# Expected: Answer with template links
```

## Feature Testing Checklist

### ✅ Guided Project Creation
- [ ] Navigate to Dashboard
- [ ] Click "New Project" button
- [ ] Fill in: Client, Project Name, Lead, Start/End dates
- [ ] Submit form
- [ ] Verify: 6 stages created (onboarding → post-project review)
- [ ] Verify: 5 mandatory files created (Brief, Contract, Reports, Finance, Tracker)

### ✅ Brief Builder
- [ ] Open a project
- [ ] Click "Client Brief" from mandatory files
- [ ] Fill in: Objectives, Audience, Tone, Channels, Timeline
- [ ] Submit brief (status: draft)
- [ ] Request client sign-off
- [ ] Verify: Brief status changes to "approved"
- [ ] Verify: Brief is immutable after sign-off

### ✅ Task Management
- [ ] Add new task to project
- [ ] Assign owner, set due date, priority
- [ ] Update task status (pending → in_progress → review)
- [ ] View "My Tasks" on dashboard
- [ ] Filter tasks by status/owner

### ✅ QA & Approval Workflow
1. **Submit for Review**
   - [ ] Create task
   - [ ] Submit task for peer review
   - [ ] Task status changes to "review"
   - [ ] Peer reviewer sees task in "Pending Approvals"

2. **Peer Review**
   - [ ] Peer reviewer approves task
   - [ ] Senior approver now sees task
   - [ ] OR Peer reviewer rejects with notes
   - [ ] Task returns to owner for revision

3. **Senior Approval**
   - [ ] Senior approver reviews
   - [ ] Approve: Task status → "approved"
   - [ ] Reject: Task returns with notes

4. **Blocking Enforcement**
   - [ ] Verify: Cannot mark task "sent" without both approvals
   - [ ] Verify: Approval chain enforced (peer → senior)

### ✅ Risk Management
- [ ] Open project detail
- [ ] Click "Report Risk"
- [ ] Enter: Description, Likelihood, Impact, Mitigation
- [ ] Submit risk
- [ ] Risk appears in project risk panel
- [ ] Update risk status (open → mitigated → closed)

### ✅ Contact Reports
- [ ] Click "Add Contact Report"
- [ ] Enter: Meeting summary, date, attendees, action items
- [ ] Submit report
- [ ] Verify: Email placeholder generated
- [ ] Report appears in project timeline

### ✅ Escalation
- [ ] Create escalation with severity level
- [ ] Assign to team member
- [ ] Verify: KPI event logged
- [ ] Check Analytics for escalation count

### ✅ Templates Hub
- [ ] Navigate to Templates
- [ ] Search for "QA"
- [ ] Filter by category
- [ ] Download template (placeholder)
- [ ] Verify: 5 categories visible (Brand CI, Reports, Digital/Social, Webinars, QA)

### ✅ Analytics Dashboard
1. **KPI Cards**
   - [ ] Tasks Due This Week count
   - [ ] Overdue Tasks count
   - [ ] Pending Approvals count
   - [ ] Open Risks count

2. **Project Health Table**
   - [ ] Total tasks per project
   - [ ] Completion percentage
   - [ ] Overdue tasks highlighted
   - [ ] Health status (Good/Moderate/Poor)

### ✅ "Ask the Process" Assistant
- [ ] Click "Ask Process" button
- [ ] Type: "What are the brand guidelines?"
- [ ] Verify: Answer with template link
- [ ] Type: "How does QA work?"
- [ ] Verify: Step-by-step answer
- [ ] Click template link → navigates to Templates

### ✅ Audit Logging
- [ ] Perform any action (create project, view template, etc.)
- [ ] Check database: `wrangler d1 execute acg-webapp-production --local --command="SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10"`
- [ ] Verify: Action logged with user_id, timestamp, IP

### ✅ Role-Based Access Control
- [ ] Test with different X-User-Id headers
- [ ] Admin (user_id=1): Full access
- [ ] Account Lead (user_id=3): Project management
- [ ] Specialist (user_id=5): Task execution
- [ ] Viewer (user_id=8): Read-only

## Database Verification

### Check Projects and Stages
```bash
wrangler d1 execute acg-webapp-production --local --command="
  SELECT p.name, s.type, s.status 
  FROM projects p 
  JOIN stages s ON p.id = s.project_id 
  WHERE p.id = 1
"
```

### Check Files (5 Mandatory Items)
```bash
wrangler d1 execute acg-webapp-production --local --command="
  SELECT kind, name 
  FROM files 
  WHERE project_id = 1
"
```

### Check Audit Logs
```bash
wrangler d1 execute acg-webapp-production --local --command="
  SELECT user_id, action, resource_type, created_at 
  FROM audit_logs 
  ORDER BY created_at DESC 
  LIMIT 10
"
```

### Check KPI Events
```bash
wrangler d1 execute acg-webapp-production --local --command="
  SELECT type, COUNT(*) as count 
  FROM kpi_events 
  GROUP BY type
"
```

## Frontend Testing

### 1. Navigation
- [ ] Click Dashboard → Shows My Tasks and KPI cards
- [ ] Click Projects → Shows project list table
- [ ] Click Approvals → Shows pending approval queue
- [ ] Click Templates → Shows template library
- [ ] Click Analytics → Shows KPI summary and project health

### 2. Responsive Design
- [ ] Desktop view: Full layout with sidebar
- [ ] Tablet view: Responsive grid
- [ ] Mobile view: Stacked layout

### 3. Interactive Elements
- [ ] Hover effects on buttons
- [ ] Loading states during API calls
- [ ] Toast notifications for success/error
- [ ] Modal dialogs for forms
- [ ] Status badges color-coded

## Performance Testing

### API Response Times
```bash
# Test dashboard load
time curl -s http://localhost:3000/api/analytics/overview

# Test projects list
time curl -s http://localhost:3000/api/projects

# Test project detail
time curl -s http://localhost:3000/api/projects/1
```

Expected: All < 200ms

## Error Handling

### Test Invalid Requests
```bash
# Non-existent project
curl http://localhost:3000/api/projects/999
# Expected: 404 with error message

# Missing required fields
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: Validation error
```

## Integration Testing

### Complete Workflow Test
1. Create new project
2. Create client brief
3. Add tasks to stages
4. Submit task for review
5. Peer review approval
6. Senior approval
7. Add contact report
8. Create risk
9. Check analytics
10. View audit logs

## Browser Testing

### Supported Browsers
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### JavaScript Console
- [ ] No errors in console
- [ ] API calls successful
- [ ] State management working

## Acceptance Criteria Verification

### ✅ MVP Requirements Met
- [x] User can create project → auto-creates 6 stages + 5 files
- [x] User can complete brief with client sign-off → immutable
- [x] User can submit for QA → peer + senior approval required
- [x] User can add contact report → email placeholder
- [x] User can ask process → returns template links
- [x] Dashboard shows KPIs and project health
- [x] All actions logged in audit_logs

## Known Limitations (MVP)

1. **Mock Authentication**: Real Google OAuth not implemented
2. **Mock LLM**: Assistant returns hardcoded responses (no RAG)
3. **Email Placeholder**: Contact reports don't send real emails
4. **Google Drive**: No real Drive integration for templates
5. **File Upload**: Files are tracked but not actually stored

## Next Steps for Production

1. Implement real Google OAuth
2. Set up RAG system with ACG documents
3. Integrate Google Drive API
4. Add SMTP for contact report emails
5. Deploy to Cloudflare Pages with production D1 database
6. Set up monitoring and error tracking
7. Add file upload to R2 storage

## Troubleshooting

### Server Not Starting
```bash
pm2 logs acg-webapp --lines 50
pm2 restart acg-webapp
```

### Database Issues
```bash
npm run db:reset  # Clears and reseeds database
npm run db:migrate:local
npm run db:seed
```

### Port Already in Use
```bash
fuser -k 3000/tcp
pm2 delete all
pm2 start ecosystem.config.cjs
```

### Build Errors
```bash
rm -rf dist .wrangler node_modules
npm install
npm run build
```

## Support

For issues or questions:
- Check PM2 logs: `pm2 logs acg-webapp`
- Check database: `npm run db:console:local`
- Restart: `pm2 restart acg-webapp`
- Reset: `npm run db:reset && pm2 restart acg-webapp`
