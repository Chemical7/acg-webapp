-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'account_lead', 'project_lead', 'specialist', 'viewer')),
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'archived')),
  sector TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  lead_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'on_hold', 'completed', 'cancelled')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (lead_id) REFERENCES users(id)
);

-- Stages table (onboarding, brief_strategy, execution, qa_review, delivery_reporting, post_project_review)
CREATE TABLE IF NOT EXISTS stages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('onboarding', 'brief_strategy', 'execution', 'qa_review', 'delivery_reporting', 'post_project_review')),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'blocked')),
  required_outputs TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stage_id INTEGER,
  project_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  owner_id INTEGER,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'review', 'approved', 'completed', 'blocked')),
  contract_ref TEXT,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  peer_reviewer_id INTEGER,
  senior_approver_id INTEGER,
  peer_status TEXT DEFAULT 'pending' CHECK(peer_status IN ('pending', 'approved', 'rejected')),
  senior_status TEXT DEFAULT 'pending' CHECK(senior_status IN ('pending', 'approved', 'rejected')),
  peer_notes TEXT,
  senior_notes TEXT,
  peer_reviewed_at DATETIME,
  senior_approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (peer_reviewer_id) REFERENCES users(id),
  FOREIGN KEY (senior_approver_id) REFERENCES users(id)
);

-- Risks table
CREATE TABLE IF NOT EXISTS risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  likelihood TEXT NOT NULL CHECK(likelihood IN ('low', 'medium', 'high')),
  impact TEXT NOT NULL CHECK(impact IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'mitigated', 'closed')),
  mitigation TEXT,
  owner_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Contact reports table
CREATE TABLE IF NOT EXISTS contact_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  summary TEXT NOT NULL,
  sent_to TEXT, -- JSON array of email addresses
  meeting_date DATE,
  attendees TEXT, -- JSON array
  action_items TEXT, -- JSON array
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- KPI events table
CREATE TABLE IF NOT EXISTS kpi_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('on_time_delivery', 'late_delivery', 'qa_pass', 'qa_fail', 'peer_review_done', 'escalation', 'client_feedback')),
  value REAL, -- Numeric value if applicable
  period TEXT, -- e.g., '2024-Q1', '2024-01'
  metadata TEXT, -- JSON for additional data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Files table (for tracking mandatory project files)
CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('brief', 'contract_summary', 'contact_report', 'finance_note', 'project_tracker', 'qa_pack', 'report', 'other')),
  name TEXT NOT NULL,
  drive_id TEXT, -- Google Drive file ID
  role_lock TEXT, -- JSON array of roles that can access
  url TEXT,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Briefs table (structured client brief data)
CREATE TABLE IF NOT EXISTS briefs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER UNIQUE NOT NULL,
  objectives TEXT NOT NULL,
  audience TEXT,
  tone TEXT,
  channels TEXT, -- JSON array
  timeline TEXT,
  approvals_required TEXT, -- JSON array
  client_sign_off TEXT, -- Email or e-signature data
  client_sign_off_date DATETIME,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'revision_needed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('brand_ci', 'reports', 'digital_social', 'webinars', 'qa_checklist', 'other')),
  description TEXT,
  file_url TEXT,
  drive_id TEXT,
  tags TEXT, -- JSON array for search
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id INTEGER,
  ip_address TEXT,
  metadata TEXT, -- JSON for additional context
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Escalations table
CREATE TABLE IF NOT EXISTS escalations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  task_id INTEGER,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')),
  escalated_by INTEGER NOT NULL,
  assigned_to INTEGER,
  resolved_at DATETIME,
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (escalated_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_lead_id ON projects(lead_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_stages_project_id ON stages(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_stage_id ON tasks(stage_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_approvals_task_id ON approvals(task_id);
CREATE INDEX IF NOT EXISTS idx_risks_project_id ON risks(project_id);
CREATE INDEX IF NOT EXISTS idx_contact_reports_project_id ON contact_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_kpi_events_project_id ON kpi_events(project_id);
CREATE INDEX IF NOT EXISTS idx_kpi_events_period ON kpi_events(period);
CREATE INDEX IF NOT EXISTS idx_files_project_id ON files(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_escalations_project_id ON escalations(project_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
