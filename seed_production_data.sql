-- ============================================================
-- ACG Client Service System - Production-Like Seed Data (3 Months)
-- ============================================================
-- This script generates realistic data spanning the last 3 months
-- to showcase analytics, KPIs, and dashboard features
-- ============================================================

-- Clear existing data (optional - comment out if you want to keep current data)
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

-- ============================================================
-- USERS (20 users across all roles)
-- ============================================================
INSERT INTO users (id, email, name, role, created_at) VALUES 
  -- Admin
  (1, 'ceo@acg.com', 'Sarah Chen', 'admin', '2024-08-01 09:00:00'),
  (2, 'gm@acg.com', 'Michael Roberts', 'admin', '2024-08-01 09:00:00'),
  (3, 'cs.lead@acg.com', 'Jennifer Martinez', 'admin', '2024-08-01 09:00:00'),
  
  -- Account Leads
  (4, 'lead.tech@acg.com', 'David Kumar', 'account_lead', '2024-08-01 09:00:00'),
  (5, 'lead.healthcare@acg.com', 'Emily Thompson', 'account_lead', '2024-08-01 09:00:00'),
  (6, 'lead.finance@acg.com', 'James Wilson', 'account_lead', '2024-08-01 09:00:00'),
  
  -- Project Leads
  (7, 'pm.alpha@acg.com', 'Lisa Anderson', 'project_lead', '2024-08-01 09:00:00'),
  (8, 'pm.beta@acg.com', 'Robert Chang', 'project_lead', '2024-08-01 09:00:00'),
  (9, 'pm.gamma@acg.com', 'Maria Garcia', 'project_lead', '2024-08-01 09:00:00'),
  
  -- Specialists - PR
  (10, 'pr.senior@acg.com', 'Amanda Foster', 'specialist', '2024-08-01 09:00:00'),
  (11, 'pr.mid@acg.com', 'Chris Parker', 'specialist', '2024-08-01 09:00:00'),
  (12, 'pr.junior@acg.com', 'Nina Patel', 'specialist', '2024-08-01 09:00:00'),
  
  -- Specialists - Digital
  (13, 'digital.senior@acg.com', 'Tom Bradley', 'specialist', '2024-08-01 09:00:00'),
  (14, 'digital.mid@acg.com', 'Sophie Lee', 'specialist', '2024-08-01 09:00:00'),
  (15, 'digital.junior@acg.com', 'Alex Johnson', 'specialist', '2024-08-01 09:00:00'),
  
  -- Specialists - Events
  (16, 'events.senior@acg.com', 'Rachel Green', 'specialist', '2024-08-01 09:00:00'),
  (17, 'events.mid@acg.com', 'Kevin Brown', 'specialist', '2024-08-01 09:00:00'),
  
  -- Viewers
  (18, 'viewer.client1@acg.com', 'Client Contact A', 'viewer', '2024-08-01 09:00:00'),
  (19, 'viewer.client2@acg.com', 'Client Contact B', 'viewer', '2024-08-01 09:00:00'),
  (20, 'viewer.client3@acg.com', 'Client Contact C', 'viewer', '2024-08-01 09:00:00');

-- ============================================================
-- CLIENTS (15 clients across different sectors)
-- ============================================================
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

-- ============================================================
-- PROJECTS (25 projects - mix of active, completed, on_hold)
-- Status distribution: 15 active, 7 completed, 3 on_hold
-- ============================================================
INSERT INTO projects (id, client_id, lead_id, name, start_date, end_date, status, created_at) VALUES 
  -- August projects (older)
  (1, 1, 4, 'Product Launch Campaign - AI Platform', '2024-08-05', '2024-11-30', 'active', '2024-08-05 11:00:00'),
  (2, 2, 5, 'Healthcare Crisis Communication Plan', '2024-08-10', '2024-10-31', 'completed', '2024-08-10 11:00:00'),
  (3, 3, 6, 'Brand Refresh Initiative', '2024-08-15', '2024-12-15', 'active', '2024-08-15 11:00:00'),
  (4, 4, 4, 'Thought Leadership Series', '2024-08-20', '2024-11-20', 'active', '2024-08-20 11:00:00'),
  (5, 5, 5, 'Student Recruitment Campaign', '2024-08-25', '2024-10-25', 'completed', '2024-08-25 11:00:00'),
  
  -- September projects (mid-range)
  (6, 6, 6, 'Holiday Season PR Blitz', '2024-09-01', '2024-12-24', 'active', '2024-09-01 11:00:00'),
  (7, 7, 4, 'Security Awareness Campaign', '2024-09-05', '2024-11-05', 'active', '2024-09-05 11:00:00'),
  (8, 8, 5, 'Clinical Trial Media Relations', '2024-09-10', '2024-12-10', 'active', '2024-09-10 11:00:00'),
  (9, 9, 6, 'New Development Launch', '2024-09-12', '2024-10-30', 'completed', '2024-09-12 11:00:00'),
  (10, 10, 4, 'Restaurant Opening Series', '2024-09-15', '2024-11-15', 'active', '2024-09-15 11:00:00'),
  (11, 11, 5, 'Auto Show Press Kit', '2024-09-18', '2024-10-18', 'completed', '2024-09-18 11:00:00'),
  (12, 12, 6, 'Travel Safety Campaign', '2024-09-20', '2024-11-20', 'active', '2024-09-20 11:00:00'),
  (13, 13, 4, 'Content Strategy Overhaul', '2024-09-22', '2024-12-22', 'on_hold', '2024-09-22 11:00:00'),
  (14, 1, 5, 'Customer Success Stories', '2024-09-25', '2024-11-25', 'active', '2024-09-25 11:00:00'),
  (15, 2, 6, 'Patient Testimonial Videos', '2024-09-28', '2024-10-28', 'completed', '2024-09-28 11:00:00'),
  
  -- October projects (recent)
  (16, 14, 4, 'Legal Tech Summit Sponsorship', '2024-10-01', '2024-12-01', 'active', '2024-10-01 11:00:00'),
  (17, 3, 5, 'Sustainability Report Launch', '2024-10-03', '2024-11-30', 'active', '2024-10-03 11:00:00'),
  (18, 6, 6, 'Black Friday Campaign', '2024-10-05', '2024-11-29', 'active', '2024-10-05 11:00:00'),
  (19, 7, 4, 'Cybersecurity Webinar Series', '2024-10-08', '2024-12-15', 'active', '2024-10-08 11:00:00'),
  (20, 8, 5, 'FDA Approval Communications', '2024-10-10', '2024-10-25', 'completed', '2024-10-10 11:00:00'),
  (21, 10, 6, 'Food Safety Crisis Response', '2024-10-12', '2024-11-12', 'on_hold', '2024-10-12 11:00:00'),
  (22, 11, 4, 'Electric Vehicle Showcase', '2024-10-15', '2024-12-31', 'active', '2024-10-15 11:00:00'),
  (23, 12, 5, 'Winter Destinations Campaign', '2024-10-18', '2024-12-20', 'active', '2024-10-18 11:00:00'),
  (24, 4, 6, 'Investment Platform Relaunch', '2024-10-20', '2024-11-10', 'completed', '2024-10-20 11:00:00'),
  (25, 15, 4, 'Championship Sponsorship Package', '2024-07-15', '2024-09-30', 'completed', '2024-07-15 11:00:00');

-- ============================================================
-- STAGES (6 per project = 150 total)
-- Status varies based on project age and status
-- ============================================================
INSERT INTO stages (project_id, type, status, due_date, created_at) 
SELECT 
  p.id,
  stage_type,
  CASE 
    -- Completed projects: all stages completed
    WHEN p.status = 'completed' THEN 'completed'
    -- On-hold projects: some completed, some blocked
    WHEN p.status = 'on_hold' AND stage_type IN ('onboarding', 'brief_strategy') THEN 'completed'
    WHEN p.status = 'on_hold' THEN 'blocked'
    -- Active projects: progression based on start date
    WHEN p.status = 'active' AND p.start_date < date('2024-08-20') AND stage_type IN ('onboarding', 'brief_strategy') THEN 'completed'
    WHEN p.status = 'active' AND p.start_date < date('2024-09-01') AND stage_type IN ('onboarding', 'brief_strategy', 'execution') THEN 'completed'
    WHEN p.status = 'active' AND p.start_date < date('2024-09-01') AND stage_type = 'qa_review' THEN 'in_progress'
    WHEN p.status = 'active' AND p.start_date < date('2024-09-15') AND stage_type IN ('onboarding', 'brief_strategy') THEN 'completed'
    WHEN p.status = 'active' AND p.start_date < date('2024-09-15') AND stage_type = 'execution' THEN 'in_progress'
    WHEN p.status = 'active' AND p.start_date >= date('2024-10-01') AND stage_type = 'onboarding' THEN 'completed'
    WHEN p.status = 'active' AND p.start_date >= date('2024-10-01') AND stage_type = 'brief_strategy' THEN 'in_progress'
    ELSE 'pending'
  END as status,
  date(p.start_date, '+' || 
    CASE stage_type
      WHEN 'onboarding' THEN '7'
      WHEN 'brief_strategy' THEN '21'
      WHEN 'execution' THEN '45'
      WHEN 'qa_review' THEN '60'
      WHEN 'delivery_reporting' THEN '75'
      WHEN 'post_project_review' THEN '90'
    END || ' days') as due_date,
  p.created_at
FROM projects p
CROSS JOIN (
  SELECT 'onboarding' as stage_type UNION ALL
  SELECT 'brief_strategy' UNION ALL
  SELECT 'execution' UNION ALL
  SELECT 'qa_review' UNION ALL
  SELECT 'delivery_reporting' UNION ALL
  SELECT 'post_project_review'
) stages;

-- ============================================================
-- FILES (5 mandatory per project = 125 total)
-- ============================================================
INSERT INTO files (project_id, kind, name, created_by, created_at)
SELECT 
  p.id,
  file_type,
  file_name || ' - ' || c.name,
  CASE (p.id % 7) WHEN 0 THEN 4 WHEN 1 THEN 5 WHEN 2 THEN 6 WHEN 3 THEN 7 WHEN 4 THEN 8 ELSE 9 END,
  p.created_at
FROM projects p
JOIN clients c ON p.client_id = c.id
CROSS JOIN (
  SELECT 'brief' as file_type, 'Client Brief' as file_name UNION ALL
  SELECT 'contract_summary', 'Contract Summary' UNION ALL
  SELECT 'contact_report', 'Contact Reports' UNION ALL
  SELECT 'finance_note', 'Finance Notes (Admin Only)' UNION ALL
  SELECT 'project_tracker', 'Project Tracker'
) files;

-- ============================================================
-- BRIEFS (1 per project = 25 total)
-- ============================================================
INSERT INTO briefs (project_id, objectives, audience, tone, channels, timeline, status, created_at)
SELECT 
  id,
  'Achieve ' || (50 + (id * 10)) || '% increase in brand awareness and drive engagement with target demographics through strategic multi-channel communications.',
  CASE (id % 5)
    WHEN 0 THEN 'C-suite executives, enterprise decision makers'
    WHEN 1 THEN 'Healthcare professionals, patients, caregivers'
    WHEN 2 THEN 'Tech-savvy millennials and Gen-Z consumers'
    WHEN 3 THEN 'Industry analysts, business journalists'
    ELSE 'General consumers, brand advocates'
  END,
  CASE (id % 4)
    WHEN 0 THEN 'Professional, authoritative, trustworthy'
    WHEN 1 THEN 'Innovative, forward-thinking, bold'
    WHEN 2 THEN 'Warm, accessible, community-focused'
    ELSE 'Energetic, inspiring, action-oriented'
  END,
  '["social_media","press_release","events","digital_ads","thought_leadership"]',
  'Q3-Q4 2024',
  CASE 
    WHEN status = 'completed' THEN 'approved'
    WHEN status = 'on_hold' THEN 'revision_needed'
    WHEN start_date < date('2024-09-15') THEN 'approved'
    ELSE 'submitted'
  END,
  created_at
FROM projects;

-- ============================================================
-- TASKS (15-25 per project, ~400 total)
-- Mix of completed, in_progress, pending, review, approved
-- ============================================================

-- Helper: Generate tasks for each project
WITH task_generator AS (
  SELECT 
    p.id as project_id,
    s.id as stage_id,
    s.type as stage_type,
    s.status as stage_status,
    p.start_date,
    p.status as project_status,
    task_num
  FROM projects p
  JOIN stages s ON p.id = s.project_id
  CROSS JOIN (
    SELECT 1 as task_num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
  ) nums
)
INSERT INTO tasks (project_id, stage_id, title, description, owner_id, due_date, status, priority, contract_ref, created_at)
SELECT 
  project_id,
  stage_id,
  CASE task_num
    WHEN 1 THEN 'Draft ' || replace(stage_type, '_', ' ') || ' deliverables'
    WHEN 2 THEN 'Review and approval - ' || replace(stage_type, '_', ' ')
    WHEN 3 THEN 'Execute ' || replace(stage_type, '_', ' ') || ' activities'
    WHEN 4 THEN 'Finalize ' || replace(stage_type, '_', ' ') || ' documentation'
  END,
  'Complete all required activities for ' || replace(stage_type, '_', ' ') || ' stage according to project timeline and client requirements.',
  10 + (abs(random()) % 8), -- Assign to specialists (IDs 10-17)
  date(start_date, '+' || (task_num * 7 + 
    CASE stage_type
      WHEN 'onboarding' THEN 3
      WHEN 'brief_strategy' THEN 14
      WHEN 'execution' THEN 35
      WHEN 'qa_review' THEN 56
      WHEN 'delivery_reporting' THEN 70
      ELSE 85
    END) || ' days'),
  CASE 
    WHEN stage_status = 'completed' THEN 'completed'
    WHEN stage_status = 'in_progress' AND task_num <= 2 THEN 'completed'
    WHEN stage_status = 'in_progress' AND task_num = 3 THEN 'in_progress'
    WHEN stage_status = 'in_progress' AND task_num = 4 THEN 'review'
    WHEN stage_status = 'blocked' THEN 'blocked'
    ELSE 'pending'
  END,
  CASE (abs(random()) % 4)
    WHEN 0 THEN 'urgent'
    WHEN 1 THEN 'high'
    WHEN 2 THEN 'medium'
    ELSE 'low'
  END,
  'SOW-' || printf('%04d', project_id) || '-' || printf('%02d', task_num),
  datetime(start_date, '+' || (task_num - 1) || ' days')
FROM task_generator
WHERE project_id <= 25; -- All 25 projects

-- ============================================================
-- APPROVALS (for tasks in 'review' or 'approved' status)
-- ============================================================
INSERT INTO approvals (task_id, peer_reviewer_id, senior_approver_id, peer_status, senior_status, peer_reviewed_at, senior_approved_at, created_at)
SELECT 
  t.id,
  10 + (abs(random()) % 8), -- Peer reviewer
  7 + (abs(random()) % 3),  -- Senior approver (project leads 7-9)
  CASE 
    WHEN t.status IN ('approved', 'completed') THEN 'approved'
    WHEN t.status = 'review' THEN 'pending'
    ELSE 'pending'
  END,
  CASE 
    WHEN t.status IN ('approved', 'completed') THEN 'approved'
    WHEN t.status = 'review' THEN 'pending'
    ELSE 'pending'
  END,
  CASE 
    WHEN t.status IN ('approved', 'completed') THEN datetime(t.due_date, '-2 days')
    ELSE NULL
  END,
  CASE 
    WHEN t.status IN ('approved', 'completed') THEN datetime(t.due_date, '-1 days')
    ELSE NULL
  END,
  t.created_at
FROM tasks t
WHERE t.status IN ('review', 'approved', 'completed')
  AND (abs(random()) % 2) = 0 -- 50% of eligible tasks have approvals
LIMIT 80;

-- ============================================================
-- RISKS (2-5 per active/on-hold project)
-- ============================================================
INSERT INTO risks (project_id, description, likelihood, impact, status, mitigation, owner_id, created_at)
WITH risk_data AS (
  SELECT 
    id as project_id,
    risk_num,
    status as project_status,
    created_at as project_created
  FROM projects
  CROSS JOIN (SELECT 1 as risk_num UNION ALL SELECT 2 UNION ALL SELECT 3) nums
  WHERE status IN ('active', 'on_hold')
)
SELECT 
  project_id,
  CASE risk_num
    WHEN 1 THEN 'Timeline pressure due to stakeholder availability constraints'
    WHEN 2 THEN 'Budget allocation pending final approval from finance team'
    WHEN 3 THEN 'Third-party vendor delays impacting deliverable schedule'
  END,
  CASE (abs(random()) % 3)
    WHEN 0 THEN 'low'
    WHEN 1 THEN 'medium'
    ELSE 'high'
  END,
  CASE (abs(random()) % 3)
    WHEN 0 THEN 'low'
    WHEN 1 THEN 'medium'
    ELSE 'high'
  END,
  CASE 
    WHEN project_status = 'on_hold' THEN 'open'
    WHEN (abs(random()) % 3) = 0 THEN 'mitigated'
    WHEN (abs(random()) % 5) = 0 THEN 'closed'
    ELSE 'open'
  END,
  CASE risk_num
    WHEN 1 THEN 'Weekly sync meetings scheduled, backup contacts identified'
    WHEN 2 THEN 'Engaged CFO office directly, expedited approval process initiated'
    WHEN 3 THEN 'Alternative vendors evaluated, buffer time added to schedule'
  END,
  7 + (abs(random()) % 3), -- Project leads
  datetime(project_created, '+' || (risk_num * 5) || ' days')
FROM risk_data;

-- ============================================================
-- CONTACT REPORTS (5-10 per project)
-- ============================================================
INSERT INTO contact_reports (project_id, summary, sent_to, meeting_date, attendees, action_items, created_by, created_at)
WITH report_dates AS (
  SELECT 
    p.id as project_id,
    p.lead_id,
    p.start_date,
    date(p.start_date, '+' || (report_num * 7) || ' days') as meeting_date
  FROM projects p
  CROSS JOIN (
    SELECT 1 as report_num UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL 
    SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
  ) nums
  WHERE date(p.start_date, '+' || (report_num * 7) || ' days') <= date('now')
)
SELECT 
  project_id,
  CASE (abs(random()) % 5)
    WHEN 0 THEN 'Weekly status meeting - reviewed deliverables and upcoming milestones'
    WHEN 1 THEN 'Client kickoff session - aligned on objectives and timeline'
    WHEN 2 THEN 'Creative review meeting - presented concepts and gathered feedback'
    WHEN 3 THEN 'Executive briefing - updated leadership on campaign progress'
    ELSE 'Planning session - outlined next phase activities and resource needs'
  END,
  '["client@example.com","stakeholder@example.com","lead@acg.com"]',
  meeting_date,
  '["Client CMO","Client PR Manager","ACG Account Lead","ACG Specialist"]',
  '["Finalize draft by Friday","Schedule follow-up for next week","Send updated timeline","Review budget allocation"]',
  lead_id,
  datetime(meeting_date, '+2 hours')
FROM report_dates;

-- ============================================================
-- ESCALATIONS (5-10 across all projects)
-- ============================================================
INSERT INTO escalations (project_id, description, severity, status, escalated_by, assigned_to, resolution_notes, created_at)
SELECT 
  id,
  CASE (abs(random()) % 4)
    WHEN 0 THEN 'Client requested major scope change mid-project - requires SOW amendment'
    WHEN 1 THEN 'Key stakeholder unresponsive for approval - blocking critical deliverable'
    WHEN 2 THEN 'Budget overrun anticipated due to additional rounds of revisions'
    ELSE 'Specialist resource unavailable - need immediate replacement to maintain timeline'
  END,
  CASE (abs(random()) % 4)
    WHEN 0 THEN 'critical'
    WHEN 1 THEN 'high'
    WHEN 2 THEN 'medium'
    ELSE 'low'
  END,
  CASE (abs(random()) % 3)
    WHEN 0 THEN 'resolved'
    WHEN 1 THEN 'in_progress'
    ELSE 'open'
  END,
  lead_id,
  CASE (abs(random()) % 3) WHEN 0 THEN 1 WHEN 1 THEN 2 ELSE 3 END, -- Escalate to admin
  CASE (abs(random()) % 3)
    WHEN 0 THEN 'Resolved through executive intervention and revised agreement'
    WHEN 1 THEN 'Alternative solution implemented, timeline adjusted'
    ELSE NULL
  END,
  datetime(start_date, '+' || (15 + abs(random()) % 30) || ' days')
FROM projects
WHERE status IN ('active', 'on_hold')
  AND (abs(random()) % 3) = 0 -- ~30% of active projects have escalations
LIMIT 12;

-- ============================================================
-- KPI EVENTS (tracking for analytics)
-- Distribute across last 3 months
-- ============================================================

-- On-time deliveries
INSERT INTO kpi_events (project_id, type, period, created_at)
SELECT 
  t.project_id,
  'on_time_delivery',
  strftime('%Y-%m', t.due_date),
  t.due_date
FROM tasks t
WHERE t.status = 'completed'
  AND t.due_date >= date('now', '-90 days')
  AND (abs(random()) % 3) != 0; -- 67% on-time

-- Late deliveries
INSERT INTO kpi_events (project_id, type, period, created_at)
SELECT 
  t.project_id,
  'late_delivery',
  strftime('%Y-%m', t.due_date),
  datetime(t.due_date, '+2 days')
FROM tasks t
WHERE t.status = 'completed'
  AND t.due_date >= date('now', '-90 days')
  AND (abs(random()) % 3) = 0; -- 33% late

-- QA pass
INSERT INTO kpi_events (project_id, type, period, created_at)
SELECT 
  t.project_id,
  'qa_pass',
  strftime('%Y-%m', a.senior_approved_at),
  a.senior_approved_at
FROM approvals a
JOIN tasks t ON a.task_id = t.id
WHERE a.senior_status = 'approved'
  AND a.senior_approved_at >= date('now', '-90 days')
  AND (abs(random()) % 5) != 0; -- 80% pass

-- QA fail
INSERT INTO kpi_events (project_id, type, period, created_at)
SELECT 
  t.project_id,
  'qa_fail',
  strftime('%Y-%m', a.peer_reviewed_at),
  a.peer_reviewed_at
FROM approvals a
JOIN tasks t ON a.task_id = t.id
WHERE a.peer_status = 'rejected'
  AND a.peer_reviewed_at >= date('now', '-90 days');

-- Peer reviews done
INSERT INTO kpi_events (project_id, type, period, created_at)
SELECT 
  t.project_id,
  'peer_review_done',
  strftime('%Y-%m', a.peer_reviewed_at),
  a.peer_reviewed_at
FROM approvals a
JOIN tasks t ON a.task_id = t.id
WHERE a.peer_reviewed_at IS NOT NULL
  AND a.peer_reviewed_at >= date('now', '-90 days');

-- Escalations
INSERT INTO kpi_events (project_id, type, period, created_at)
SELECT 
  project_id,
  'escalation',
  strftime('%Y-%m', created_at),
  created_at
FROM escalations
WHERE created_at >= date('now', '-90 days');

-- Client feedback (random positive)
INSERT INTO kpi_events (project_id, type, value, period, created_at)
SELECT 
  id,
  'client_feedback',
  4.0 + (abs(random()) % 10) / 10.0, -- 4.0 to 5.0 rating
  strftime('%Y-%m', date(start_date, '+30 days')),
  datetime(start_date, '+30 days')
FROM projects
WHERE status IN ('active', 'completed')
  AND date(start_date, '+30 days') >= date('now', '-90 days')
  AND (abs(random()) % 2) = 0; -- 50% have feedback

-- ============================================================
-- TEMPLATES (20 templates across categories)
-- ============================================================
INSERT INTO templates (name, category, description, tags, created_at) VALUES 
  -- Brand CI
  ('ACG Brand Guidelines Master', 'brand_ci', 'Complete brand identity guidelines including logo usage, color palette, typography', '["brand","guidelines","identity"]', '2024-08-01 09:00:00'),
  ('Logo Usage Guide', 'brand_ci', 'Detailed logo specifications and usage scenarios', '["logo","brand","guidelines"]', '2024-08-01 09:00:00'),
  ('Brand Voice & Tone Guide', 'brand_ci', 'Communication standards and voice guidelines', '["brand","voice","tone"]', '2024-08-01 09:00:00'),
  
  -- Reports
  ('Monthly Client Report Template', 'reports', 'Standard monthly performance and activity report', '["report","monthly","client"]', '2024-08-01 09:00:00'),
  ('Quarterly Business Review Template', 'reports', 'Comprehensive quarterly review deck', '["report","quarterly","qbr"]', '2024-08-01 09:00:00'),
  ('Campaign Performance Dashboard', 'reports', 'Real-time campaign metrics and KPI tracking', '["report","campaign","metrics"]', '2024-08-01 09:00:00'),
  ('Executive Summary Template', 'reports', 'One-page executive summary format', '["report","executive","summary"]', '2024-08-01 09:00:00'),
  
  -- Digital/Social
  ('Social Media Content Calendar', 'digital_social', 'Monthly social media planning template', '["social","content","calendar"]', '2024-08-01 09:00:00'),
  ('Social Media Style Guide', 'digital_social', 'Platform-specific guidelines and best practices', '["social","guidelines","style"]', '2024-08-01 09:00:00'),
  ('Influencer Campaign Brief', 'digital_social', 'Influencer partnership and campaign structure', '["influencer","campaign","social"]', '2024-08-01 09:00:00'),
  ('Digital Ad Creative Specs', 'digital_social', 'Technical specifications for digital advertising', '["digital","ads","specs"]', '2024-08-01 09:00:00'),
  
  -- Webinars
  ('Webinar Planning Checklist', 'webinars', 'Complete webinar preparation checklist', '["webinar","checklist","planning"]', '2024-08-01 09:00:00'),
  ('Webinar Script Template', 'webinars', 'Standard webinar script and flow structure', '["webinar","script","template"]', '2024-08-01 09:00:00'),
  ('Post-Webinar Follow-up Guide', 'webinars', 'Attendee follow-up and lead nurturing', '["webinar","followup","leads"]', '2024-08-01 09:00:00'),
  
  -- QA Checklists
  ('General QA Checklist', 'qa_checklist', 'Universal quality assurance checklist', '["qa","quality","checklist"]', '2024-08-01 09:00:00'),
  ('Press Release QA Checklist', 'qa_checklist', 'Press release specific quality checks', '["qa","press","checklist"]', '2024-08-01 09:00:00'),
  ('Website QA Checklist', 'qa_checklist', 'Website content and functionality checks', '["qa","website","checklist"]', '2024-08-01 09:00:00'),
  ('Social Media QA Checklist', 'qa_checklist', 'Social media post quality verification', '["qa","social","checklist"]', '2024-08-01 09:00:00'),
  ('Brand Compliance Checklist', 'qa_checklist', 'Brand guidelines compliance verification', '["qa","brand","compliance"]', '2024-08-01 09:00:00'),
  
  -- Other
  ('Client Onboarding Packet', 'other', 'New client welcome and onboarding materials', '["onboarding","client","welcome"]', '2024-08-01 09:00:00');

-- ============================================================
-- AUDIT LOGS (sample of key activities)
-- This would normally be auto-generated, but we'll add some key entries
-- ============================================================
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, created_at)
SELECT 
  created_by,
  'create',
  'projects',
  id,
  '192.168.1.' || (abs(random()) % 255),
  created_at
FROM projects;

INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, created_at)
SELECT 
  owner_id,
  'update',
  'tasks',
  id,
  '192.168.1.' || (abs(random()) % 255),
  datetime(due_date, '-1 day')
FROM tasks
WHERE status = 'completed'
LIMIT 100;

INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, created_at)
SELECT 
  senior_approver_id,
  'senior_approve',
  'approvals',
  id,
  '192.168.1.' || (abs(random()) % 255),
  senior_approved_at
FROM approvals
WHERE senior_status = 'approved';

-- ============================================================
-- SUMMARY STATISTICS
-- ============================================================
SELECT 
  'Data Generation Complete!' as status,
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM clients) as clients,
  (SELECT COUNT(*) FROM projects) as projects,
  (SELECT COUNT(*) FROM stages) as stages,
  (SELECT COUNT(*) FROM tasks) as tasks,
  (SELECT COUNT(*) FROM approvals) as approvals,
  (SELECT COUNT(*) FROM risks) as risks,
  (SELECT COUNT(*) FROM contact_reports) as contact_reports,
  (SELECT COUNT(*) FROM escalations) as escalations,
  (SELECT COUNT(*) FROM kpi_events) as kpi_events,
  (SELECT COUNT(*) FROM templates) as templates,
  (SELECT COUNT(*) FROM audit_logs) as audit_logs;
