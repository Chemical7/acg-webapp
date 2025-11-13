#!/usr/bin/env node

/**
 * Assign tasks and approvals to Admin Login (User 1)
 * This makes the dashboard more useful when logged in as the default user
 */

const API_BASE = 'http://localhost:3000/api';

async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': '1',
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

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

async function assignTasksToCEO() {
  console.log('🚀 Assigning tasks and approvals to Admin Login...\n');
  
  try {
    const { tasks } = await apiCall('/tasks');
    const { users } = await apiCall('/users');
    
    // Get unassigned or randomly selected tasks
    const tasksToReassign = tasks
      .filter(t => t.status !== 'completed' && t.status !== 'approved')
      .sort(() => Math.random() - 0.5)
      .slice(0, 15);
    
    console.log(`📝 Assigning ${tasksToReassign.length} tasks to Admin Login...\n`);
    
    let assigned = 0;
    for (const task of tasksToReassign) {
      try {
        await apiCall(`/tasks/${task.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ owner_id: 1 })
        });
        assigned++;
        if (assigned % 5 === 0) {
          process.stdout.write(`  ✅ Assigned ${assigned} tasks...\r`);
        }
      } catch (e) {
        console.log(`\n  ⚠️  Failed: ${e.message}`);
      }
    }
    
    console.log(`\n  ✅ Assigned ${assigned} tasks to Admin Login\n`);
    
    // Update some existing approvals to use CEO as reviewer/approver
    console.log('✅ Adding CEO as reviewer/approver...\n');
    
    // Get all tasks in review status without approvals assigned to CEO
    const reviewTasks = tasks
      .filter(t => t.status === 'review')
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);
    
    let approvalCount = 0;
    
    for (const task of reviewTasks) {
      try {
        // Create new approval with CEO as senior approver
        const specialist = users.find(u => u.role === 'specialist');
        
        await apiCall('/approvals', {
          method: 'POST',
          body: JSON.stringify({
            task_id: task.id,
            peer_reviewer_id: specialist.id,
            senior_approver_id: 1 // CEO
          })
        });
        
        approvalCount++;
        if (approvalCount % 3 === 0) {
          process.stdout.write(`  ✅ Created ${approvalCount} approval requests...\r`);
        }
      } catch (e) {
        // Might already have approval, skip
      }
    }
    
    console.log(`\n  ✅ Created ${approvalCount} approval requests with CEO as approver\n`);
    
    // Also make CEO a peer reviewer for some
    const moreReviewTasks = tasks
      .filter(t => t.status === 'review')
      .sort(() => Math.random() - 0.5)
      .slice(0, 8);
    
    let peerApprovalCount = 0;
    
    for (const task of moreReviewTasks) {
      try {
        const lead = users.find(u => u.role === 'account_lead');
        
        await apiCall('/approvals', {
          method: 'POST',
          body: JSON.stringify({
            task_id: task.id,
            peer_reviewer_id: 1, // CEO as peer reviewer
            senior_approver_id: lead.id
          })
        });
        
        peerApprovalCount++;
      } catch (e) {
        // Skip if already exists
      }
    }
    
    console.log(`  ✅ Created ${peerApprovalCount} approval requests with CEO as peer reviewer\n`);
    
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Tasks Assigned to CEO: ${assigned}`);
    console.log(`✅ Approvals (CEO as Senior): ${approvalCount}`);
    console.log(`✅ Approvals (CEO as Peer): ${peerApprovalCount}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('✨ Dashboard should now show data for Admin Login!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

assignTasksToCEO();
