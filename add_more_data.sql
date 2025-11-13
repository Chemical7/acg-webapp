-- Quick script to add more demo data to existing seed

-- Add more users
INSERT OR IGNORE INTO users (email, name, role, created_at) VALUES 
  ('specialist1@acg.com', 'John Smith', 'specialist', datetime('now', '-60 days')),
  ('specialist2@acg.com', 'Jane Doe', 'specialist', datetime('now', '-60 days')),
  ('specialist3@acg.com', 'Mike Johnson', 'specialist', datetime('now', '-60 days')),
  ('lead2@acg.com', 'Susan Williams', 'account_lead', datetime('now', '-60 days')),
  ('pm2@acg.com', 'Tom Anderson', 'project_lead', datetime('now', '-60 days'));

-- Add more clients
INSERT OR IGNORE INTO clients (name, status, sector, created_at) VALUES 
  ('InnovateNow Tech', 'active', 'Technology', datetime('now', '-50 days')),
  ('HealthPlus Systems', 'active', 'Healthcare', datetime('now', '-45 days')),
  ('GlobalFinance Group', 'active', 'Finance', datetime('now', '-40 days')),
  ('EcoSustain Energy', 'active', 'Energy', datetime('now', '-35 days')),
  ('SmartCity Solutions', 'active', 'Government', datetime('now', '-30 days'));

-- Create 10 more projects with varied dates
INSERT INTO projects (client_id, lead_id, name, start_date, end_date, status, created_at)
SELECT 
  (abs(random()) % 3) + 1,  -- Random client 1-3
  3,  -- Account lead
  'Campaign ' || (abs(random()) % 1000),
  date('now', '-' || ((n * 7) % 90) || ' days'),
  date('now', '+' || (30 + (n * 10)) || ' days'),
  CASE (n % 3) WHEN 0 THEN 'active' WHEN 1 THEN 'completed' ELSE 'active' END,
  datetime('now', '-' || ((n * 7) % 90) || ' days')
FROM (
  SELECT 1 as n UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
  UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
) numbers;

-- Summary
SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM clients) as total_clients,
  (SELECT COUNT(*) FROM projects) as total_projects,
  (SELECT COUNT(*) FROM tasks) as total_tasks;
