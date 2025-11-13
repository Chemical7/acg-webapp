#!/usr/bin/env node

/**
 * Generate 3 months of demo data for ACG Client Service System
 * Run this script to populate your database with realistic test data
 * 
 * Usage: node generate_demo_data.js
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
    throw new Error(`API Error: ${error}`);
  }
  
  return response.json();
}

// Generate random date in the last N days
function randomDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  return date.toISOString().split('T')[0];
}

// Generate future date
function futureDateDaysAhead(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

async function generateDemoData() {
  console.log('🚀 Starting demo data generation...\n');
  
  try {
    // 1. Create additional clients
    console.log('📊 Creating clients...');
    const clientNames = [
      { name: 'InnovateNow Tech', sector: 'Technology' },
      { name: 'HealthPlus Systems', sector: 'Healthcare' },
      { name: 'GlobalFinance Group', sector: 'Finance' },
      { name: 'EcoSustain Energy', sector: 'Energy' },
      { name: 'SmartCity Solutions', sector: 'Government' }
    ];
    
    const createdClients = [];
    for (const client of clientNames) {
      try {
        const result = await apiCall('/clients', {
          method: 'POST',
          body: JSON.stringify({ ...client, status: 'active' })
        });
        createdClients.push(result);
        console.log(`  ✅ Created: ${client.name}`);
      } catch (e) {
        console.log(`  ⚠️  Skipped: ${client.name} (may already exist)`);
      }
    }
    
    // 2. Get all clients to use for projects
    const { clients } = await apiCall('/clients');
    console.log(`\n📋 Found ${clients.length} total clients\n`);
    
    // 3. Get users to assign as leads
    const { users } = await apiCall('/users');
    const leads = users.filter(u => u.role === 'account_lead' || u.role === 'project_lead');
    console.log(`👥 Found ${leads.length} leads\n`);
    
    // 4. Create projects (20 new projects spanning 3 months)
    console.log('🎯 Creating projects...');
    const projectNames = [
      'Product Launch Campaign',
      'Brand Refresh Initiative',
      'Crisis Communication Plan',
      'Thought Leadership Series',
      'Social Media Blitz',
      'Press Release Package',
      'Event Sponsorship Program',
      'Content Marketing Strategy',
      'Influencer Partnership',
      'Customer Success Stories',
      'Annual Report Production',
      'Rebranding Project',
      'Digital Ad Campaign',
      'Community Outreach Program',
      'Industry Conference Presence',
      'Video Content Series',
      'Podcast Launch',
      'Website Redesign Communications',
      'Employee Advocacy Program',
      'Sustainability Report Launch'
    ];
    
    const createdProjects = [];
    for (let i = 0; i < Math.min(20, projectNames.length); i++) {
      const client = clients[i % clients.length];
      const lead = leads[i % leads.length];
      const startDaysAgo = Math.floor(Math.random() * 90); // 0-90 days ago
      const durationDays = 60 + Math.floor(Math.random() * 60); // 60-120 days
      
      try {
        const project = await apiCall('/projects', {
          method: 'POST',
          body: JSON.stringify({
            client_id: client.id,
            lead_id: lead.id,
            name: `${projectNames[i]} - ${client.name}`,
            start_date: randomDateDaysAgo(startDaysAgo),
            end_date: futureDateDaysAhead(durationDays - startDaysAgo)
          })
        });
        createdProjects.push(project);
        console.log(`  ✅ Project ${i + 1}/${projectNames.length}: ${projectNames[i]}`);
      } catch (e) {
        console.log(`  ⚠️  Project ${i + 1} failed: ${e.message}`);
      }
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n🎯 Created ${createdProjects.length} projects\n`);
    
    // 5. Add tasks to recent projects
    console.log('📝 Adding tasks to projects...');
    const specialists = users.filter(u => u.role === 'specialist');
    let taskCount = 0;
    
    for (const project of createdProjects.slice(0, 10)) { // Add tasks to first 10 projects
      const taskTitles = [
        'Draft initial strategy',
        'Review with client',
        'Execute phase 1',
        'Create deliverables',
        'Quality review',
        'Final approval',
        'Delivery to client',
        'Post-project review'
      ];
      
      for (let i = 0; i < 5; i++) {
        const specialist = specialists[Math.floor(Math.random() * specialists.length)];
        try {
          await apiCall('/tasks', {
            method: 'POST',
            body: JSON.stringify({
              project_id: project.id,
              title: taskTitles[i % taskTitles.length],
              description: `Complete ${taskTitles[i % taskTitles.length]} for ${project.name}`,
              owner_id: specialist.id,
              due_date: futureDateDaysAhead(7 * (i + 1)),
              priority: ['high', 'medium', 'low'][i % 3]
            })
          });
          taskCount++;
        } catch (e) {
          // Continue on error
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`  ✅ Created ${taskCount} tasks\n`);
    
    // 6. Add risks to some projects
    console.log('⚠️  Adding risks...');
    const riskDescriptions = [
      'Timeline pressure due to stakeholder availability',
      'Budget allocation pending approval',
      'Third-party vendor delays',
      'Resource availability constraints',
      'Client feedback cycle delays'
    ];
    
    let riskCount = 0;
    for (const project of createdProjects.slice(0, 8)) {
      for (let i = 0; i < 2; i++) {
        try {
          await apiCall('/risks', {
            method: 'POST',
            body: JSON.stringify({
              project_id: project.id,
              description: riskDescriptions[i % riskDescriptions.length],
              likelihood: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
              impact: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
              mitigation: 'Mitigation plan in progress',
              owner_id: leads[0].id
            })
          });
          riskCount++;
        } catch (e) {
          // Continue on error
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`  ✅ Created ${riskCount} risks\n`);
    
    // 7. Add contact reports
    console.log('📞 Adding contact reports...');
    let reportCount = 0;
    
    for (const project of createdProjects.slice(0, 12)) {
      for (let i = 0; i < 3; i++) {
        try {
          await apiCall('/contact-reports', {
            method: 'POST',
            headers: { 'X-User-Id': project.lead_id || '3' },
            body: JSON.stringify({
              project_id: project.id,
              summary: `Weekly status meeting ${i + 1} - reviewed progress and upcoming milestones`,
              sent_to: ['client@example.com', 'stakeholder@example.com'],
              meeting_date: randomDateDaysAgo(i * 7),
              attendees: ['Client CMO', 'ACG Lead', 'Specialist'],
              action_items: ['Finalize draft', 'Schedule follow-up', 'Send timeline']
            })
          });
          reportCount++;
        } catch (e) {
          // Continue on error
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`  ✅ Created ${reportCount} contact reports\n`);
    
    // 8. Final summary
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════');
    
    const { projects } = await apiCall('/projects');
    const { tasks } = await apiCall('/tasks');
    const { risks } = await apiCall('/risks');
    
    console.log(`Projects:        ${projects.length}`);
    console.log(`Tasks:           ${tasks.length}`);
    console.log(`Risks:           ${risks.length}`);
    console.log(`Contact Reports: ${reportCount}`);
    
    console.log('\n✅ Demo data generation complete!');
    console.log('\n🌐 Visit the app to see the results:');
    console.log('   https://3000-ifzu109gtk9kd7bkihvkv-b237eb32.sandbox.novita.ai\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateDemoData();
