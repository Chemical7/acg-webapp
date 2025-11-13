-- Seed data for development

-- Insert test users
INSERT OR IGNORE INTO users (id, email, name, role) VALUES 
  (1, 'ceo@acg.com', 'CEO Admin', 'admin'),
  (2, 'gm@acg.com', 'General Manager', 'admin'),
  (3, 'lead@acg.com', 'Account Lead', 'account_lead'),
  (4, 'projectlead@acg.com', 'Project Lead', 'project_lead'),
  (5, 'pr@acg.com', 'PR Specialist', 'specialist'),
  (6, 'digital@acg.com', 'Digital Specialist', 'specialist'),
  (7, 'events@acg.com', 'Events Specialist', 'specialist'),
  (8, 'viewer@acg.com', 'Client Viewer', 'viewer');

-- Insert test clients
INSERT OR IGNORE INTO clients (id, name, status, sector) VALUES 
  (1, 'TechCorp International', 'active', 'Technology'),
  (2, 'Green Energy Co', 'active', 'Energy'),
  (3, 'Healthcare Plus', 'active', 'Healthcare');

-- Insert test projects
INSERT OR IGNORE INTO projects (id, client_id, lead_id, name, start_date, end_date, status) VALUES 
  (1, 1, 3, 'Product Launch Campaign', '2024-01-15', '2024-06-30', 'active'),
  (2, 2, 3, 'Brand Refresh', '2024-02-01', '2024-08-31', 'active'),
  (3, 3, 4, 'Crisis Communication Plan', '2024-03-01', '2024-05-31', 'active');

-- Insert stages for project 1
INSERT OR IGNORE INTO stages (project_id, type, status) VALUES 
  (1, 'onboarding', 'completed'),
  (1, 'brief_strategy', 'in_progress'),
  (1, 'execution', 'pending'),
  (1, 'qa_review', 'pending'),
  (1, 'delivery_reporting', 'pending'),
  (1, 'post_project_review', 'pending');

-- Insert tasks
INSERT OR IGNORE INTO tasks (stage_id, project_id, title, owner_id, status, priority) VALUES 
  (1, 1, 'Complete client onboarding', 3, 'completed', 'high'),
  (2, 1, 'Draft campaign strategy', 3, 'in_progress', 'high'),
  (2, 1, 'Get client brief approval', 3, 'review', 'high');

-- Insert brief
INSERT OR IGNORE INTO briefs (project_id, objectives, audience, tone, channels, timeline, status) VALUES 
  (1, 'Launch new product to market with awareness campaign', 'Tech enthusiasts, early adopters', 'Professional but innovative', '["social_media", "press_release", "events"]', 'Q1-Q2 2024', 'submitted');

-- Insert templates
INSERT OR IGNORE INTO templates (name, category, description, tags) VALUES 
  ('Brand Guidelines Checklist', 'brand_ci', 'Standard brand compliance checklist', '["brand", "guidelines", "checklist"]'),
  ('Monthly Report Template', 'reports', 'Standard monthly client report', '["report", "monthly", "client"]'),
  ('Social Media Content Guide', 'digital_social', 'Guidelines for social media posts', '["social", "content", "digital"]'),
  ('QA Checklist - General', 'qa_checklist', 'General quality assurance checklist', '["qa", "quality", "checklist"]'),
  ('QA Checklist - Website', 'qa_checklist', 'Website-specific QA checklist', '["qa", "website", "checklist"]');

-- Insert files (5 mandatory items for project 1)
INSERT OR IGNORE INTO files (project_id, kind, name, created_by) VALUES 
  (1, 'brief', 'Client Brief - TechCorp Product Launch', 3),
  (1, 'contract_summary', 'Contract Summary', 3),
  (1, 'contact_report', 'Contact Reports', 3),
  (1, 'finance_note', 'Finance Notes (Locked)', 3),
  (1, 'project_tracker', 'Project Tracker', 3);

-- Insert contact report
INSERT OR IGNORE INTO contact_reports (project_id, summary, sent_to, meeting_date, created_by) VALUES 
  (1, 'Kickoff meeting with client stakeholders. Discussed objectives and timeline.', '["client@techcorp.com", "lead@acg.com"]', '2024-01-15', 3);

-- Insert KPI events
INSERT OR IGNORE INTO kpi_events (project_id, type, period) VALUES 
  (1, 'on_time_delivery', '2024-01'),
  (1, 'peer_review_done', '2024-01'),
  (1, 'qa_pass', '2024-01');
