#!/usr/bin/env node

/**
 * Add approval requests to existing tasks
 * This script updates some tasks to 'review' status and creates approvals
 * 
 * Usage: node add_approvals_only.js
 */

const API_BASE = 'http://localhost:3000/api';

// Helper to make API calls
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

async function addApprovals() {
  console.log('🚀 Starting approval generation...\n');
  
  try {
    // Get data
    console.log('📊 Fetching data...');
    const { users } = await apiCall('/users');
    const { tasks } = await apiCall('/tasks');
    
    const specialists = users.filter(u => u.role === 'specialist');
    const leads = users.filter(u => u.role === 'account_lead' || u.role === 'project_lead');
    
    console.log(`  ✅ Found ${tasks.length} tasks`);
    console.log(`  ✅ Found ${specialists.length} specialists`);
    console.log(`  ✅ Found ${leads.length} leads\n`);
    
    // Select 50 random tasks to put in review
    const tasksForReview = tasks
      .filter(t => t.status === 'in_progress' || t.status === 'pending')
      .sort(() => Math.random() - 0.5)
      .slice(0, 50);
    
    console.log(`📝 Updating ${tasksForReview.length} tasks to 'review' status...\n`);
    
    let approvalCount = 0;
    let pendingPeerCount = 0;
    let pendingSeniorCount = 0;
    let fullyApprovedCount = 0;
    
    for (const task of tasksForReview) {
      try {
        // Update task to review status
        await apiCall(`/tasks/${task.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'review' })
        });
        
        // Create approval
        const peerReviewer = randomChoice(specialists);
        const seniorApprover = randomChoice(leads);
        
        const approval = await apiCall('/approvals', {
          method: 'POST',
          body: JSON.stringify({
            task_id: task.id,
            peer_reviewer_id: peerReviewer.id,
            senior_approver_id: seniorApprover.id
          })
        });
        
        approvalCount++;
        
        // Randomly approve some
        const rand = Math.random();
        
        if (rand < 0.3) {
          // 30% - Leave as pending peer review
          pendingPeerCount++;
        } else if (rand < 0.6) {
          // 30% - Peer approved, pending senior
          await apiCall(`/approvals/${approval.id}/peer`, {
            method: 'PATCH',
            headers: { 'X-User-Id': peerReviewer.id.toString() },
            body: JSON.stringify({
              status: 'approved',
              notes: 'Reviewed and approved - ready for senior review'
            })
          });
          pendingSeniorCount++;
        } else {
          // 40% - Fully approved
          await apiCall(`/approvals/${approval.id}/peer`, {
            method: 'PATCH',
            headers: { 'X-User-Id': peerReviewer.id.toString() },
            body: JSON.stringify({
              status: 'approved',
              notes: 'Peer review complete - excellent work'
            })
          });
          
          await apiCall(`/approvals/${approval.id}/senior`, {
            method: 'PATCH',
            headers: { 'X-User-Id': seniorApprover.id.toString() },
            body: JSON.stringify({
              status: 'approved',
              notes: 'Final approval granted - ready for delivery'
            })
          });
          fullyApprovedCount++;
        }
        
        if (approvalCount % 5 === 0) {
          process.stdout.write(`  ✅ Created ${approvalCount} approvals...\r`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (e) {
        console.log(`\n  ⚠️  Failed: ${e.message}`);
      }
    }
    
    console.log(`\n\n📊 APPROVALS SUMMARY`);
    console.log('═══════════════════════════════════════');
    console.log(`✅ Total Approvals Created: ${approvalCount}`);
    console.log(`   📋 Pending Peer Review: ${pendingPeerCount}`);
    console.log(`   🔄 Pending Senior Approval: ${pendingSeniorCount}`);
    console.log(`   ✔️  Fully Approved: ${fullyApprovedCount}`);
    console.log('═══════════════════════════════════════\n');
    
    console.log('✨ Dashboard now has rich approval data!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addApprovals();
