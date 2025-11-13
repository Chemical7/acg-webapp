#!/usr/bin/env node

/**
 * Add many tasks and approvals to the ACG Client Service System
 * This script creates tasks across all projects with various statuses
 * and creates approval requests (pending and approved)
 * 
 * Usage: node add_tasks_approvals.js
 */

const API_BASE = 'http://localhost:3000/api';

// Helper to make API calls
async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': '1', // Admin Login
    ...options.headers
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }
  
  return response.json();
}

// Generate random date in the past N days
function pastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Generate future date
function futureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}

// Random element from array
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function generateTasksAndApprovals() {
  console.log('🚀 Starting tasks and approvals generation...\n');
  
  try {
    // Get existing data
    console.log('📊 Fetching existing data...');
    const { users } = await apiCall('/users');
    const { projects } = await apiCall('/projects');
    const { clients } = await apiCall('/clients');
    
    const specialists = users.filter(u => u.role === 'specialist');
    const leads = users.filter(u => u.role === 'account_lead' || u.role === 'project_lead');
    const activeProjects = projects.filter(p => p.status === 'active');
    
    console.log(`  ✅ Found ${users.length} users`);
    console.log(`  ✅ Found ${projects.length} projects (${activeProjects.length} active)`);
    console.log(`  ✅ Found ${specialists.length} specialists`);
    console.log(`  ✅ Found ${leads.length} leads\n`);
    
    // Task templates
    const taskTemplates = [
      { title: 'Draft initial brief', desc: 'Create comprehensive project brief document', priority: 'high' },
      { title: 'Client kickoff meeting prep', desc: 'Prepare presentation and agenda for kickoff', priority: 'high' },
      { title: 'Research competitive landscape', desc: 'Analyze competitors and market positioning', priority: 'medium' },
      { title: 'Develop creative concepts', desc: 'Brainstorm and sketch initial creative directions', priority: 'high' },
      { title: 'Review brand guidelines', desc: 'Ensure compliance with client brand standards', priority: 'medium' },
      { title: 'Draft social media content', desc: 'Create posts for all planned platforms', priority: 'medium' },
      { title: 'Design visual assets', desc: 'Create graphics, infographics, and images', priority: 'high' },
      { title: 'Write press release', desc: 'Draft press release for media distribution', priority: 'high' },
      { title: 'Conduct stakeholder interviews', desc: 'Interview key stakeholders for insights', priority: 'medium' },
      { title: 'Build presentation deck', desc: 'Create client-facing presentation', priority: 'medium' },
      { title: 'Create video script', desc: 'Write script for promotional video', priority: 'low' },
      { title: 'Develop campaign messaging', desc: 'Craft core messaging framework', priority: 'high' },
      { title: 'Schedule media interviews', desc: 'Coordinate with media outlets', priority: 'low' },
      { title: 'Prepare executive briefing', desc: 'Create briefing document for executives', priority: 'medium' },
      { title: 'Design email templates', desc: 'Create branded email templates', priority: 'low' },
      { title: 'Update project tracker', desc: 'Maintain project status documentation', priority: 'low' },
      { title: 'Coordinate with vendors', desc: 'Manage external vendor relationships', priority: 'medium' },
      { title: 'Review analytics data', desc: 'Analyze performance metrics and insights', priority: 'medium' },
      { title: 'Prepare monthly report', desc: 'Compile monthly client status report', priority: 'high' },
      { title: 'Client feedback session', desc: 'Present work and gather client input', priority: 'high' },
      { title: 'Implement revisions', desc: 'Make changes based on client feedback', priority: 'high' },
      { title: 'Final quality check', desc: 'Comprehensive review before delivery', priority: 'urgent' },
      { title: 'Prepare delivery package', desc: 'Package all deliverables for client', priority: 'high' },
      { title: 'Schedule handoff meeting', desc: 'Coordinate final delivery meeting', priority: 'medium' },
      { title: 'Document lessons learned', desc: 'Record insights for future projects', priority: 'low' },
      { title: 'Archive project files', desc: 'Organize and store project materials', priority: 'low' },
      { title: 'Budget reconciliation', desc: 'Review and finalize project finances', priority: 'medium' },
      { title: 'Team retrospective', desc: 'Conduct post-project team review', priority: 'low' },
      { title: 'Client satisfaction survey', desc: 'Gather client feedback on experience', priority: 'medium' },
      { title: 'Update case study', desc: 'Document project success for portfolio', priority: 'low' }
    ];
    
    const statuses = ['pending', 'in_progress', 'review', 'completed', 'blocked'];
    const priorities = ['urgent', 'high', 'medium', 'low'];
    
    // Create tasks for each active project
    console.log('📝 Creating tasks...');
    const createdTasks = [];
    let taskCount = 0;
    
    for (const project of activeProjects) {
      // Create 8-15 tasks per project
      const numTasks = 8 + Math.floor(Math.random() * 8);
      
      for (let i = 0; i < numTasks; i++) {
        const template = randomChoice(taskTemplates);
        const specialist = randomChoice(specialists);
        const daysOffset = Math.floor(Math.random() * 60) - 30; // -30 to +30 days
        const status = randomChoice(statuses);
        
        try {
          const task = await apiCall('/tasks', {
            method: 'POST',
            body: JSON.stringify({
              project_id: project.id,
              title: template.title,
              description: template.desc,
              owner_id: specialist.id,
              due_date: daysOffset < 0 ? pastDate(Math.abs(daysOffset)) : futureDate(daysOffset),
              priority: randomChoice(priorities),
              status: status
            })
          });
          createdTasks.push({ ...task, project_id: project.id, project_name: project.name });
          taskCount++;
          
          if (taskCount % 10 === 0) {
            process.stdout.write(`  📝 Created ${taskCount} tasks...\r`);
          }
        } catch (e) {
          console.log(`\n  ⚠️  Failed to create task: ${e.message}`);
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
    
    console.log(`\n  ✅ Created ${taskCount} tasks across ${activeProjects.length} projects\n`);
    
    // Create approvals for tasks in 'review' status
    console.log('✅ Creating approval requests...');
    const reviewTasks = createdTasks.filter(t => t.status === 'review');
    let approvalCount = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    
    for (const task of reviewTasks) {
      const peerReviewer = randomChoice(specialists);
      const seniorApprover = randomChoice(leads);
      
      try {
        // Create approval request
        const approval = await apiCall('/approvals', {
          method: 'POST',
          body: JSON.stringify({
            task_id: task.id,
            peer_reviewer_id: peerReviewer.id,
            senior_approver_id: seniorApprover.id
          })
        });
        
        approvalCount++;
        
        // Randomly approve some (60% chance for peer, 40% for senior if peer approved)
        const peerApproves = Math.random() > 0.4;
        
        if (peerApproves) {
          await apiCall(`/approvals/${approval.id}/peer`, {
            method: 'PATCH',
            headers: { 'X-User-Id': peerReviewer.id.toString() },
            body: JSON.stringify({
              status: 'approved',
              notes: 'Looks good, approved for senior review'
            })
          });
          
          approvedCount++;
          
          // Senior approval (40% chance)
          if (Math.random() > 0.6) {
            await apiCall(`/approvals/${approval.id}/senior`, {
              method: 'PATCH',
              headers: { 'X-User-Id': seniorApprover.id.toString() },
              body: JSON.stringify({
                status: 'approved',
                notes: 'Final approval granted, ready for delivery'
              })
            });
            approvedCount++;
          } else {
            pendingCount++;
          }
        } else {
          pendingCount++;
        }
        
        if (approvalCount % 5 === 0) {
          process.stdout.write(`  ✅ Created ${approvalCount} approvals...\r`);
        }
        
      } catch (e) {
        console.log(`\n  ⚠️  Failed to create approval: ${e.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`\n  ✅ Created ${approvalCount} approval requests`);
    console.log(`     📋 ${pendingCount} pending approvals`);
    console.log(`     ✔️  ${approvedCount} approved items\n`);
    
    // Summary
    console.log('📊 GENERATION COMPLETE');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Total Tasks Created: ${taskCount}`);
    console.log(`✅ Total Approvals Created: ${approvalCount}`);
    console.log(`   - Pending: ${pendingCount}`);
    console.log(`   - Approved: ${approvedCount}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('✨ You can now view the enriched dashboard and analytics!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
generateTasksAndApprovals();
