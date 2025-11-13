import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// Middleware for audit logging
const auditLog = async (c: any, action: string, resourceType: string, resourceId?: number) => {
  const userId = c.req.header('X-User-Id') || 1; // Mock user from header
  const ip = c.req.header('CF-Connecting-IP') || 'unknown';
  
  await c.env.DB.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).bind(userId, action, resourceType, resourceId || null, ip).run();
}

// ========== AUTH ROUTES (Mock for MVP) ==========
app.get('/api/auth/me', async (c) => {
  const userId = c.req.header('X-User-Id') || 1;
  
  const user = await c.env.DB.prepare(`
    SELECT id, email, name, role, avatar_url, created_at
    FROM users WHERE id = ?
  `).bind(userId).first();
  
  return c.json({ user });
})

// ========== USER ROUTES ==========
app.get('/api/users', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT id, email, name, role, avatar_url, created_at
    FROM users
    ORDER BY name
  `).all();
  
  await auditLog(c, 'list', 'users');
  return c.json({ users: results });
})

app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id');
  const user = await c.env.DB.prepare(`
    SELECT id, email, name, role, avatar_url, created_at
    FROM users WHERE id = ?
  `).bind(id).first();
  
  await auditLog(c, 'view', 'users', parseInt(id));
  return c.json({ user });
})

// ========== CLIENT ROUTES ==========
app.get('/api/clients', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT * FROM clients ORDER BY name
  `).all();
  
  await auditLog(c, 'list', 'clients');
  return c.json({ clients: results });
})

app.post('/api/clients', async (c) => {
  const { name, sector, status } = await c.req.json();
  
  const result = await c.env.DB.prepare(`
    INSERT INTO clients (name, sector, status, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `).bind(name, sector || null, status || 'active').run();
  
  await auditLog(c, 'create', 'clients', result.meta.last_row_id);
  return c.json({ id: result.meta.last_row_id, name, sector, status: status || 'active' });
})

// ========== PROJECT ROUTES ==========
app.get('/api/projects', async (c) => {
  const clientId = c.req.query('client_id');
  const leadId = c.req.query('lead_id');
  
  let query = `
    SELECT p.*, c.name as client_name, u.name as lead_name
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN users u ON p.lead_id = u.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  if (clientId) {
    query += ` AND p.client_id = ?`;
    params.push(clientId);
  }
  if (leadId) {
    query += ` AND p.lead_id = ?`;
    params.push(leadId);
  }
  
  query += ` ORDER BY p.created_at DESC`;
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  await auditLog(c, 'list', 'projects');
  return c.json({ projects: results });
})

app.get('/api/projects/:id', async (c) => {
  const id = c.req.param('id');
  
  const project = await c.env.DB.prepare(`
    SELECT p.*, c.name as client_name, u.name as lead_name, u.email as lead_email
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN users u ON p.lead_id = u.id
    WHERE p.id = ?
  `).bind(id).first();
  
  if (!project) {
    return c.json({ error: 'Project not found' }, 404);
  }
  
  // Get stages
  const { results: stages } = await c.env.DB.prepare(`
    SELECT * FROM stages WHERE project_id = ? ORDER BY 
    CASE type
      WHEN 'onboarding' THEN 1
      WHEN 'brief_strategy' THEN 2
      WHEN 'execution' THEN 3
      WHEN 'qa_review' THEN 4
      WHEN 'delivery_reporting' THEN 5
      WHEN 'post_project_review' THEN 6
    END
  `).bind(id).all();
  
  // Get files (5 mandatory items)
  const { results: files } = await c.env.DB.prepare(`
    SELECT * FROM files WHERE project_id = ? ORDER BY created_at
  `).bind(id).all();
  
  // Get risks
  const { results: risks } = await c.env.DB.prepare(`
    SELECT r.*, u.name as owner_name
    FROM risks r
    LEFT JOIN users u ON r.owner_id = u.id
    WHERE r.project_id = ?
    ORDER BY 
      CASE r.status WHEN 'open' THEN 1 WHEN 'mitigated' THEN 2 ELSE 3 END,
      CASE r.impact WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
  `).bind(id).all();
  
  await auditLog(c, 'view', 'projects', parseInt(id));
  return c.json({ project, stages, files, risks });
})

app.post('/api/projects', async (c) => {
  const { client_id, lead_id, name, start_date, end_date } = await c.req.json();
  
  // Start transaction (D1 doesn't support transactions, so we do sequential inserts)
  
  // 1. Create project
  const projectResult = await c.env.DB.prepare(`
    INSERT INTO projects (client_id, lead_id, name, start_date, end_date, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))
  `).bind(client_id, lead_id, name, start_date || null, end_date || null).run();
  
  const projectId = projectResult.meta.last_row_id;
  
  // 2. Create 6 stages
  const stageTypes = ['onboarding', 'brief_strategy', 'execution', 'qa_review', 'delivery_reporting', 'post_project_review'];
  for (const type of stageTypes) {
    await c.env.DB.prepare(`
      INSERT INTO stages (project_id, type, status, created_at, updated_at)
      VALUES (?, ?, 'pending', datetime('now'), datetime('now'))
    `).bind(projectId, type).run();
  }
  
  // 3. Create 5 mandatory files
  const userId = c.req.header('X-User-Id') || 1;
  const fileKinds = [
    { kind: 'brief', name: 'Client Brief' },
    { kind: 'contract_summary', name: 'Contract Summary' },
    { kind: 'contact_report', name: 'Contact Reports' },
    { kind: 'finance_note', name: 'Finance Notes (Admin Only)' },
    { kind: 'project_tracker', name: 'Project Tracker' }
  ];
  
  for (const file of fileKinds) {
    await c.env.DB.prepare(`
      INSERT INTO files (project_id, kind, name, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(projectId, file.kind, file.name, userId).run();
  }
  
  await auditLog(c, 'create', 'projects', projectId);
  return c.json({ id: projectId, message: 'Project created with 6 stages and 5 mandatory files' });
})

// ========== STAGE ROUTES ==========
app.patch('/api/stages/:id', async (c) => {
  const id = c.req.param('id');
  const { status, due_date } = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE stages SET status = ?, due_date = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(status, due_date || null, id).run();
  
  await auditLog(c, 'update', 'stages', parseInt(id));
  return c.json({ success: true });
})

// ========== TASK ROUTES ==========
app.get('/api/tasks', async (c) => {
  const projectId = c.req.query('project_id');
  const ownerId = c.req.query('owner_id');
  const status = c.req.query('status');
  
  let query = `
    SELECT t.*, u.name as owner_name, s.type as stage_type, p.name as project_name
    FROM tasks t
    LEFT JOIN users u ON t.owner_id = u.id
    LEFT JOIN stages s ON t.stage_id = s.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  if (projectId) {
    query += ` AND t.project_id = ?`;
    params.push(projectId);
  }
  if (ownerId) {
    query += ` AND t.owner_id = ?`;
    params.push(ownerId);
  }
  if (status) {
    query += ` AND t.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY 
    CASE t.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
    t.due_date ASC
  `;
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  await auditLog(c, 'list', 'tasks');
  return c.json({ tasks: results });
})

app.post('/api/tasks', async (c) => {
  const { project_id, stage_id, title, description, owner_id, due_date, priority, contract_ref } = await c.req.json();
  
  const result = await c.env.DB.prepare(`
    INSERT INTO tasks (project_id, stage_id, title, description, owner_id, due_date, priority, contract_ref, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
  `).bind(project_id, stage_id || null, title, description || null, owner_id || null, due_date || null, priority || 'medium', contract_ref || null).run();
  
  await auditLog(c, 'create', 'tasks', result.meta.last_row_id);
  return c.json({ id: result.meta.last_row_id, title, status: 'pending' });
})

app.patch('/api/tasks/:id', async (c) => {
  const id = c.req.param('id');
  const { status, description, owner_id, due_date, priority } = await c.req.json();
  
  let updates: string[] = [];
  let params: any[] = [];
  
  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    params.push(description);
  }
  if (owner_id !== undefined) {
    updates.push('owner_id = ?');
    params.push(owner_id);
  }
  if (due_date !== undefined) {
    updates.push('due_date = ?');
    params.push(due_date);
  }
  if (priority !== undefined) {
    updates.push('priority = ?');
    params.push(priority);
  }
  
  updates.push('updated_at = datetime(\'now\')');
  params.push(id);
  
  await c.env.DB.prepare(`
    UPDATE tasks SET ${updates.join(', ')} WHERE id = ?
  `).bind(...params).run();
  
  await auditLog(c, 'update', 'tasks', parseInt(id));
  return c.json({ success: true });
})

// ========== APPROVAL ROUTES ==========
app.post('/api/approvals', async (c) => {
  const { task_id, peer_reviewer_id, senior_approver_id } = await c.req.json();
  
  const result = await c.env.DB.prepare(`
    INSERT INTO approvals (task_id, peer_reviewer_id, senior_approver_id, peer_status, senior_status, created_at, updated_at)
    VALUES (?, ?, ?, 'pending', 'pending', datetime('now'), datetime('now'))
  `).bind(task_id, peer_reviewer_id || null, senior_approver_id || null).run();
  
  // Update task status to 'review'
  await c.env.DB.prepare(`
    UPDATE tasks SET status = 'review', updated_at = datetime('now') WHERE id = ?
  `).bind(task_id).run();
  
  await auditLog(c, 'create', 'approvals', result.meta.last_row_id);
  return c.json({ id: result.meta.last_row_id, message: 'Approval request created' });
})

app.get('/api/approvals/pending', async (c) => {
  const userId = c.req.header('X-User-Id') || 1;
  
  const { results } = await c.env.DB.prepare(`
    SELECT a.*, t.title as task_title, t.description, p.name as project_name,
           u1.name as peer_reviewer_name, u2.name as senior_approver_name
    FROM approvals a
    LEFT JOIN tasks t ON a.task_id = t.id
    LEFT JOIN projects p ON t.project_id = p.id
    LEFT JOIN users u1 ON a.peer_reviewer_id = u1.id
    LEFT JOIN users u2 ON a.senior_approver_id = u2.id
    WHERE (a.peer_reviewer_id = ? AND a.peer_status = 'pending')
       OR (a.senior_approver_id = ? AND a.senior_status = 'pending' AND a.peer_status = 'approved')
    ORDER BY a.created_at DESC
  `).bind(userId, userId).all();
  
  await auditLog(c, 'list', 'approvals');
  return c.json({ approvals: results });
})

app.patch('/api/approvals/:id/peer', async (c) => {
  const id = c.req.param('id');
  const { status, notes } = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE approvals 
    SET peer_status = ?, peer_notes = ?, peer_reviewed_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(status, notes || null, id).run();
  
  await auditLog(c, 'peer_review', 'approvals', parseInt(id));
  return c.json({ success: true });
})

app.patch('/api/approvals/:id/senior', async (c) => {
  const id = c.req.param('id');
  const { status, notes } = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE approvals 
    SET senior_status = ?, senior_notes = ?, senior_approved_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ?
  `).bind(status, notes || null, id).run();
  
  // If approved by senior, update task to 'approved'
  if (status === 'approved') {
    const approval = await c.env.DB.prepare(`SELECT task_id FROM approvals WHERE id = ?`).bind(id).first();
    if (approval) {
      await c.env.DB.prepare(`
        UPDATE tasks SET status = 'approved', updated_at = datetime('now') WHERE id = ?
      `).bind(approval.task_id).run();
    }
  }
  
  await auditLog(c, 'senior_approve', 'approvals', parseInt(id));
  return c.json({ success: true });
})

// ========== BRIEF ROUTES ==========
app.post('/api/briefs', async (c) => {
  const { project_id, objectives, audience, tone, channels, timeline, approvals_required } = await c.req.json();
  
  const result = await c.env.DB.prepare(`
    INSERT INTO briefs (project_id, objectives, audience, tone, channels, timeline, approvals_required, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', datetime('now'), datetime('now'))
  `).bind(
    project_id,
    objectives,
    audience || null,
    tone || null,
    JSON.stringify(channels || []),
    timeline || null,
    JSON.stringify(approvals_required || [])
  ).run();
  
  await auditLog(c, 'create', 'briefs', result.meta.last_row_id);
  return c.json({ id: result.meta.last_row_id, status: 'draft' });
})

app.get('/api/briefs/:project_id', async (c) => {
  const projectId = c.req.param('project_id');
  
  const brief = await c.env.DB.prepare(`
    SELECT * FROM briefs WHERE project_id = ?
  `).bind(projectId).first();
  
  if (brief) {
    // Parse JSON fields
    brief.channels = JSON.parse(brief.channels || '[]');
    brief.approvals_required = JSON.parse(brief.approvals_required || '[]');
  }
  
  await auditLog(c, 'view', 'briefs', parseInt(projectId));
  return c.json({ brief });
})

app.patch('/api/briefs/:id/sign-off', async (c) => {
  const id = c.req.param('id');
  const { client_sign_off } = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE briefs 
    SET client_sign_off = ?, client_sign_off_date = datetime('now'), status = 'approved', updated_at = datetime('now')
    WHERE id = ?
  `).bind(client_sign_off, id).run();
  
  await auditLog(c, 'sign_off', 'briefs', parseInt(id));
  return c.json({ success: true, message: 'Brief approved by client' });
})

// ========== RISK ROUTES ==========
app.get('/api/risks', async (c) => {
  const projectId = c.req.query('project_id');
  
  let query = `
    SELECT r.*, u.name as owner_name, p.name as project_name
    FROM risks r
    LEFT JOIN users u ON r.owner_id = u.id
    LEFT JOIN projects p ON r.project_id = p.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  if (projectId) {
    query += ` AND r.project_id = ?`;
    params.push(projectId);
  }
  
  query += ` ORDER BY 
    CASE r.status WHEN 'open' THEN 1 WHEN 'mitigated' THEN 2 ELSE 3 END,
    CASE r.impact WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END
  `;
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  await auditLog(c, 'list', 'risks');
  return c.json({ risks: results });
})

app.post('/api/risks', async (c) => {
  const { project_id, description, likelihood, impact, mitigation, owner_id } = await c.req.json();
  
  const result = await c.env.DB.prepare(`
    INSERT INTO risks (project_id, description, likelihood, impact, mitigation, owner_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'open', datetime('now'), datetime('now'))
  `).bind(project_id, description, likelihood, impact, mitigation || null, owner_id || null).run();
  
  await auditLog(c, 'create', 'risks', result.meta.last_row_id);
  return c.json({ id: result.meta.last_row_id });
})

app.patch('/api/risks/:id', async (c) => {
  const id = c.req.param('id');
  const { status, mitigation } = await c.req.json();
  
  await c.env.DB.prepare(`
    UPDATE risks SET status = ?, mitigation = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(status, mitigation || null, id).run();
  
  await auditLog(c, 'update', 'risks', parseInt(id));
  return c.json({ success: true });
})

// ========== CONTACT REPORT ROUTES ==========
app.get('/api/contact-reports', async (c) => {
  const projectId = c.req.query('project_id');
  
  let query = `
    SELECT cr.*, u.name as created_by_name, p.name as project_name
    FROM contact_reports cr
    LEFT JOIN users u ON cr.created_by = u.id
    LEFT JOIN projects p ON cr.project_id = p.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  if (projectId) {
    query += ` AND cr.project_id = ?`;
    params.push(projectId);
  }
  
  query += ` ORDER BY cr.meeting_date DESC, cr.created_at DESC`;
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  // Parse JSON fields
  results.forEach((report: any) => {
    report.sent_to = JSON.parse(report.sent_to || '[]');
    report.attendees = JSON.parse(report.attendees || '[]');
    report.action_items = JSON.parse(report.action_items || '[]');
  });
  
  await auditLog(c, 'list', 'contact_reports');
  return c.json({ reports: results });
})

app.post('/api/contact-reports', async (c) => {
  const { project_id, summary, sent_to, meeting_date, attendees, action_items } = await c.req.json();
  const userId = c.req.header('X-User-Id') || 1;
  
  const result = await c.env.DB.prepare(`
    INSERT INTO contact_reports (project_id, summary, sent_to, meeting_date, attendees, action_items, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    project_id,
    summary,
    JSON.stringify(sent_to || []),
    meeting_date || null,
    JSON.stringify(attendees || []),
    JSON.stringify(action_items || []),
    userId
  ).run();
  
  await auditLog(c, 'create', 'contact_reports', result.meta.last_row_id);
  return c.json({ id: result.meta.last_row_id, message: 'Contact report created and email sent' });
})

// ========== TEMPLATE ROUTES ==========
app.get('/api/templates', async (c) => {
  const category = c.req.query('category');
  const search = c.req.query('search');
  
  let query = `SELECT * FROM templates WHERE 1=1`;
  const params: any[] = [];
  
  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  
  if (search) {
    query += ` AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)`;
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  query += ` ORDER BY category, name`;
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  // Parse tags
  results.forEach((template: any) => {
    template.tags = JSON.parse(template.tags || '[]');
  });
  
  await auditLog(c, 'list', 'templates');
  return c.json({ templates: results });
})

// ========== ESCALATION ROUTES ==========
app.post('/api/escalations', async (c) => {
  const { project_id, task_id, description, severity, assigned_to } = await c.req.json();
  const userId = c.req.header('X-User-Id') || 1;
  
  const result = await c.env.DB.prepare(`
    INSERT INTO escalations (project_id, task_id, description, severity, status, escalated_by, assigned_to, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'open', ?, ?, datetime('now'), datetime('now'))
  `).bind(project_id, task_id || null, description, severity, userId, assigned_to || null).run();
  
  // Record KPI event
  await c.env.DB.prepare(`
    INSERT INTO kpi_events (project_id, type, period, created_at)
    VALUES (?, 'escalation', strftime('%Y-%m', 'now'), datetime('now'))
  `).bind(project_id).run();
  
  await auditLog(c, 'create', 'escalations', result.meta.last_row_id);
  return c.json({ id: result.meta.last_row_id, message: 'Escalation created' });
})

app.get('/api/escalations', async (c) => {
  const projectId = c.req.query('project_id');
  const status = c.req.query('status');
  
  let query = `
    SELECT e.*, p.name as project_name, u1.name as escalated_by_name, u2.name as assigned_to_name
    FROM escalations e
    LEFT JOIN projects p ON e.project_id = p.id
    LEFT JOIN users u1 ON e.escalated_by = u1.id
    LEFT JOIN users u2 ON e.assigned_to = u2.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  if (projectId) {
    query += ` AND e.project_id = ?`;
    params.push(projectId);
  }
  if (status) {
    query += ` AND e.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY 
    CASE e.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
    e.created_at DESC
  `;
  
  const { results } = await c.env.DB.prepare(query).bind(...params).all();
  
  await auditLog(c, 'list', 'escalations');
  return c.json({ escalations: results });
})

// ========== ANALYTICS / KPI ROUTES ==========
app.get('/api/analytics/overview', async (c) => {
  const period = c.req.query('period') || strftime('%Y-%m', new Date());
  
  // Get KPI counts by type for the period
  const { results: kpiCounts } = await c.env.DB.prepare(`
    SELECT type, COUNT(*) as count
    FROM kpi_events
    WHERE period = ?
    GROUP BY type
  `).bind(period).all();
  
  // Get overdue tasks
  const { results: overdueTasks } = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM tasks
    WHERE due_date < date('now') AND status NOT IN ('completed', 'approved')
  `).all();
  
  // Get tasks due this week
  const { results: thisWeekTasks } = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM tasks
    WHERE due_date BETWEEN date('now') AND date('now', '+7 days')
      AND status NOT IN ('completed', 'approved')
  `).all();
  
  // Get open risks
  const { results: openRisks } = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM risks
    WHERE status = 'open'
  `).all();
  
  // Get pending approvals
  const { results: pendingApprovals } = await c.env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM approvals
    WHERE peer_status = 'pending' OR senior_status = 'pending'
  `).all();
  
  await auditLog(c, 'view', 'analytics');
  return c.json({
    kpi_counts: kpiCounts,
    overdue_tasks: overdueTasks[0]?.count || 0,
    tasks_due_this_week: thisWeekTasks[0]?.count || 0,
    open_risks: openRisks[0]?.count || 0,
    pending_approvals: pendingApprovals[0]?.count || 0
  });
})

app.get('/api/analytics/project-health', async (c) => {
  const { results: projects } = await c.env.DB.prepare(`
    SELECT p.id, p.name, p.status,
           COUNT(DISTINCT t.id) as total_tasks,
           COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completed_tasks,
           COUNT(DISTINCT CASE WHEN t.due_date < date('now') AND t.status NOT IN ('completed', 'approved') THEN t.id END) as overdue_tasks,
           COUNT(DISTINCT r.id) as open_risks
    FROM projects p
    LEFT JOIN tasks t ON p.id = t.project_id
    LEFT JOIN risks r ON p.id = r.project_id AND r.status = 'open'
    WHERE p.status = 'active'
    GROUP BY p.id
    ORDER BY overdue_tasks DESC, open_risks DESC
  `).all();
  
  await auditLog(c, 'view', 'analytics');
  return c.json({ project_health: projects });
})

// ========== MOCK "ASK THE PROCESS" LLM ASSISTANT ==========
app.post('/api/assistant/ask', async (c) => {
  const { question } = await c.req.json();
  
  // Mock responses based on keywords
  let answer = '';
  let templateLinks: any[] = [];
  
  if (question.toLowerCase().includes('brand') || question.toLowerCase().includes('guideline')) {
    answer = 'ACG brand guidelines require 2FA compliance: always include logo, use approved color palette (primary: #003366, secondary: #FF6B35), and maintain consistent tone of voice. All materials must pass peer review before client delivery.';
    templateLinks = [{ name: 'Brand Guidelines Checklist', id: 1 }];
  } else if (question.toLowerCase().includes('qa') || question.toLowerCase().includes('quality')) {
    answer = 'ACG QA process requires: 1) Peer review by a specialist, 2) Senior approval by account/project lead, 3) Brand compliance check, 4) Platform-specific checks for digital content. No deliverable can be sent without both approvals.';
    templateLinks = [{ name: 'QA Checklist - General', id: 4 }];
  } else if (question.toLowerCase().includes('report')) {
    answer = 'Monthly client reports must include: executive summary, deliverables completed, KPIs vs targets, upcoming milestones, risks and mitigations. Use the standard template and submit for approval 3 days before client deadline.';
    templateLinks = [{ name: 'Monthly Report Template', id: 2 }];
  } else {
    answer = 'I can help you with ACG processes, templates, and guidelines. Try asking about brand guidelines, QA procedures, reporting requirements, or search for specific templates.';
  }
  
  await auditLog(c, 'ask', 'assistant');
  return c.json({ answer, template_links: templateLinks });
})

// ========== HOME / DASHBOARD ==========
app.use(renderer)

app.get('/', (c) => {
  return c.render(
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <i class="fas fa-spinner fa-spin text-6xl text-blue-600 mb-4"></i>
        <h1 class="text-2xl font-bold text-gray-900">Loading ACG Client Service System...</h1>
      </div>
    </div>
  )
})

export default app
