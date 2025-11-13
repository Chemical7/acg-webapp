#!/bin/bash

echo "=== Clearing existing data ==="
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

echo "=== Importing production seed data in batches ==="
echo "This will take a few moments..."

# Split the seed file and execute in smaller chunks
wrangler d1 execute acg-webapp-production --local --file=./seed_production_data.sql

echo "=== Done! Restarting server ==="
pm2 restart acg-webapp

echo "=== Testing server ==="
sleep 3
curl -s http://localhost:3000/api/projects | head -20

