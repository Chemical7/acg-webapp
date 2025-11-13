// ACG Client Service System - Frontend Application

const API_BASE = '/api';
let currentUser = null;
let currentView = 'dashboard';

// ========== UTILITY FUNCTIONS ==========
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 ${
    type === 'error' ? 'bg-red-500' :
    type === 'success' ? 'bg-green-500' :
    'bg-blue-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': currentUser?.id || '1',
    ...options.headers
  };
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
}

function formatDate(dateString) {
  if (!dateString) return 'Not set';
  return new Date(dateString).toLocaleDateString();
}

function getStatusBadge(status) {
  const colors = {
    pending: 'bg-gray-200 text-gray-800',
    in_progress: 'bg-blue-200 text-blue-800',
    review: 'bg-yellow-200 text-yellow-800',
    approved: 'bg-green-200 text-green-800',
    completed: 'bg-green-200 text-green-800',
    blocked: 'bg-red-200 text-red-800',
    active: 'bg-green-200 text-green-800',
    open: 'bg-red-200 text-red-800',
    closed: 'bg-gray-200 text-gray-800'
  };
  
  return `<span class="px-2 py-1 rounded text-xs font-medium ${colors[status] || colors.pending}">${status.replace(/_/g, ' ')}</span>`;
}

function getPriorityBadge(priority) {
  const colors = {
    urgent: 'bg-red-500 text-white',
    high: 'bg-orange-500 text-white',
    medium: 'bg-yellow-500 text-white',
    low: 'bg-gray-500 text-white'
  };
  
  return `<span class="px-2 py-1 rounded text-xs font-medium ${colors[priority] || colors.medium}">${priority}</span>`;
}

// ========== NAVIGATION ==========
function navigate(view) {
  currentView = view;
  renderApp();
}

function viewTask(taskId) {
  navigate('tasks');
}

function viewApproval(approvalId) {
  navigate('approvals');
}



function renderNavigation() {
  return `
    <nav class="bg-blue-900 text-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center space-x-8">
            <div class="flex items-center space-x-2">
              <i class="fas fa-briefcase text-2xl"></i>
              <span class="text-xl font-bold">ACG Client Service</span>
            </div>
            <div class="flex space-x-4">
              <button onclick="navigate('dashboard')" class="nav-btn ${currentView === 'dashboard' ? 'nav-active' : ''}">
                <i class="fas fa-home mr-2"></i>Dashboard
              </button>
              <button onclick="navigate('projects')" class="nav-btn ${currentView === 'projects' ? 'nav-active' : ''}">
                <i class="fas fa-folder mr-2"></i>Projects
              </button>
              <button onclick="navigate('approvals')" class="nav-btn ${currentView === 'approvals' ? 'nav-active' : ''}">
                <i class="fas fa-check-circle mr-2"></i>Approvals
              </button>
              <button onclick="navigate('templates')" class="nav-btn ${currentView === 'templates' ? 'nav-active' : ''}">
                <i class="fas fa-file-alt mr-2"></i>Templates
              </button>
              <button onclick="navigate('analytics')" class="nav-btn ${currentView === 'analytics' ? 'nav-active' : ''}">
                <i class="fas fa-chart-line mr-2"></i>Analytics
              </button>
              <button onclick="navigate('reports')" class="nav-btn ${currentView === 'reports' ? 'nav-active' : ''}">
                <i class="fas fa-file-invoice mr-2"></i>Reports
              </button>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <button onclick="toggleAssistant()" class="nav-btn">
              <i class="fas fa-robot mr-2"></i>Ask ACGPT
            </button>
            <div class="flex items-center space-x-2">
              <i class="fas fa-user-circle text-2xl"></i>
              <span class="text-sm">${currentUser?.name || 'Loading...'}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `;
}

// ========== DASHBOARD VIEW ==========
async function renderDashboard() {
  const [myTasks, analytics, allRisks, projectHealth, allTasks, approvals] = await Promise.all([
    apiCall(`/tasks?owner_id=${currentUser.id}`),
    apiCall('/analytics/overview'),
    apiCall('/risks'),
    apiCall('/analytics/project-health'),
    apiCall('/tasks'),
    apiCall('/approvals/pending')
  ]);
  
  const tasksToday = myTasks.tasks.filter(t => 
    t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()
  );
  
  const tasksDueWeek = myTasks.tasks.filter(t => 
    t.status !== 'completed' && t.status !== 'approved'
  );
  
  // Get high-risk projects and their tasks
  const highRiskProjects = allRisks.risks
    .filter(r => r.status === 'open' && r.impact === 'high')
    .map(r => r.project_id);
  const highRiskTasks = allTasks.tasks
    .filter(t => highRiskProjects.includes(t.project_id) && t.status !== 'completed')
    .sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
    })
    .slice(0, 5);
  
  // Get projects needing attention (overdue tasks or high risks)
  const projectsNeedingAttention = projectHealth.project_health
    .filter(p => p.overdue_tasks > 0 || p.open_risks >= 2)
    .slice(0, 5);
  
  // Get pending approvals (already filtered by API)
  const urgentApprovals = approvals.approvals.slice(0, 5);
  
  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-gray-900">
          <i class="fas fa-tachometer-alt mr-3"></i>Dashboard
        </h1>
        <button onclick="showCreateProjectModal()" class="btn-primary">
          <i class="fas fa-plus mr-2"></i>New Project
        </button>
      </div>
      
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Tasks Due This Week</p>
              <p class="text-3xl font-bold text-blue-600">${analytics.tasks_due_this_week}</p>
            </div>
            <i class="fas fa-tasks text-4xl text-blue-200"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Overdue Tasks</p>
              <p class="text-3xl font-bold text-red-600">${analytics.overdue_tasks}</p>
            </div>
            <i class="fas fa-exclamation-triangle text-4xl text-red-200"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Pending Approvals</p>
              <p class="text-3xl font-bold text-yellow-600">${analytics.pending_approvals}</p>
            </div>
            <i class="fas fa-clock text-4xl text-yellow-200"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">Open Risks</p>
              <p class="text-3xl font-bold text-orange-600">${analytics.open_risks}</p>
            </div>
            <i class="fas fa-shield-alt text-4xl text-orange-200"></i>
          </div>
        </div>
      </div>
      
      <!-- Two Column Layout for Dashboard Widgets -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <!-- My Tasks -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <h2 class="text-xl font-semibold text-gray-900">
              <i class="fas fa-list-check mr-2 text-blue-600"></i>My Tasks
            </h2>
          </div>
          <div class="p-6 max-h-96 overflow-y-auto">
            ${tasksDueWeek.length === 0 ? 
              '<p class="text-gray-500 text-center py-8">No tasks assigned to you</p>' :
              `<div class="space-y-3">
                ${tasksDueWeek.slice(0, 5).map(task => `
                  <div class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div class="flex-1">
                      <div class="flex items-center space-x-2">
                        <h3 class="font-medium text-gray-900 text-sm">${task.title}</h3>
                        ${getStatusBadge(task.status)}
                        ${getPriorityBadge(task.priority)}
                      </div>
                      <div class="mt-1 text-xs text-gray-500">
                        <i class="fas fa-folder mr-1"></i>${task.project_name}
                        ${task.due_date ? `<span class="ml-3"><i class="fas fa-calendar mr-1"></i>${formatDate(task.due_date)}</span>` : ''}
                      </div>
                    </div>
                    <button onclick="viewTask(${task.id})" class="btn-secondary text-sm">
                      <i class="fas fa-arrow-right"></i>
                    </button>
                  </div>
                `).join('')}
                ${tasksDueWeek.length > 5 ? `<div class="text-center pt-3"><button onclick="navigate('tasks')" class="text-blue-600 hover:text-blue-800 text-sm">View all ${tasksDueWeek.length} tasks →</button></div>` : ''}
              </div>`
            }
          </div>
        </div>
        
        <!-- High-Risk Tasks -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-100">
            <h2 class="text-xl font-semibold text-gray-900">
              <i class="fas fa-exclamation-triangle mr-2 text-red-600"></i>High-Risk Tasks
            </h2>
          </div>
          <div class="p-6 max-h-96 overflow-y-auto">
            ${highRiskTasks.length === 0 ? 
              '<p class="text-gray-500 text-center py-8"><i class="fas fa-check-circle text-green-500 text-2xl mb-2"></i><br/>No high-risk tasks</p>' :
              `<div class="space-y-3">
                ${highRiskTasks.map(task => `
                  <div class="flex items-center justify-between p-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                    <div class="flex-1">
                      <div class="flex items-center space-x-2">
                        <h3 class="font-medium text-gray-900 text-sm">${task.title}</h3>
                        ${getStatusBadge(task.status)}
                        ${getPriorityBadge(task.priority)}
                      </div>
                      <div class="mt-1 text-xs text-gray-500">
                        <i class="fas fa-folder mr-1"></i>${task.project_name}
                        <span class="ml-3 text-red-600"><i class="fas fa-shield-alt mr-1"></i>High Risk Project</span>
                      </div>
                    </div>
                    <button onclick="viewTask(${task.id})" class="btn-secondary text-sm">
                      <i class="fas fa-arrow-right"></i>
                    </button>
                  </div>
                `).join('')}
              </div>`
            }
          </div>
        </div>
        
        <!-- Projects Needing Attention -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-100">
            <h2 class="text-xl font-semibold text-gray-900">
              <i class="fas fa-flag mr-2 text-yellow-600"></i>Projects Needing Attention
            </h2>
          </div>
          <div class="p-6 max-h-96 overflow-y-auto">
            ${projectsNeedingAttention.length === 0 ? 
              '<p class="text-gray-500 text-center py-8"><i class="fas fa-thumbs-up text-green-500 text-2xl mb-2"></i><br/>All projects on track</p>' :
              `<div class="space-y-3">
                ${projectsNeedingAttention.map(project => `
                  <div class="p-3 border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors">
                    <div class="flex items-center justify-between mb-2">
                      <h3 class="font-medium text-gray-900">${project.name}</h3>
                      ${getStatusBadge(project.status)}
                    </div>
                    <div class="flex items-center space-x-4 text-xs text-gray-600">
                      ${project.overdue_tasks > 0 ? `<span class="text-red-600"><i class="fas fa-clock mr-1"></i>${project.overdue_tasks} overdue</span>` : ''}
                      ${project.open_risks > 0 ? `<span class="text-orange-600"><i class="fas fa-exclamation-triangle mr-1"></i>${project.open_risks} risks</span>` : ''}
                      <span><i class="fas fa-tasks mr-1"></i>${project.completed_tasks}/${project.total_tasks} done</span>
                    </div>
                    <div class="mt-2">
                      <button onclick="navigate('projects', ${project.id})" class="text-blue-600 hover:text-blue-800 text-xs">
                        View project →
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>`
            }
          </div>
        </div>
        
        <!-- Pending Approvals -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-100">
            <h2 class="text-xl font-semibold text-gray-900">
              <i class="fas fa-hourglass-half mr-2 text-purple-600"></i>Pending Approvals
            </h2>
          </div>
          <div class="p-6 max-h-96 overflow-y-auto">
            ${urgentApprovals.length === 0 ? 
              '<p class="text-gray-500 text-center py-8"><i class="fas fa-check-double text-green-500 text-2xl mb-2"></i><br/>No pending approvals</p>' :
              `<div class="space-y-3">
                ${urgentApprovals.map(approval => `
                  <div class="p-3 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                    <div class="flex items-center justify-between mb-2">
                      <h3 class="font-medium text-gray-900 text-sm">${approval.task_title}</h3>
                      <span class="text-xs px-2 py-1 rounded ${approval.peer_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}">
                        ${approval.peer_status === 'pending' ? 'Peer Review' : 'Senior Approval'}
                      </span>
                    </div>
                    <div class="text-xs text-gray-500">
                      <i class="fas fa-folder mr-1"></i>${approval.project_name}
                      ${approval.peer_status === 'pending' ? `<span class="ml-3"><i class="fas fa-user-check mr-1"></i>Reviewer: ${approval.peer_reviewer_name}</span>` : `<span class="ml-3"><i class="fas fa-user-tie mr-1"></i>Approver: ${approval.senior_approver_name}</span>`}
                    </div>
                    <div class="mt-2 flex items-center space-x-2">
                      <button onclick="viewApproval(${approval.id})" class="text-blue-600 hover:text-blue-800 text-xs">
                        Review →
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>`
            }
          </div>
        </div>
        
      </div>
    </div>
  `;
}

// ========== PROJECTS VIEW ==========
async function renderProjects() {
  const [projects, clients] = await Promise.all([
    apiCall('/projects'),
    apiCall('/clients')
  ]);
  
  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-gray-900">
          <i class="fas fa-folder-open mr-3"></i>Projects
        </h1>
        <button onclick="showCreateProjectModal()" class="btn-primary">
          <i class="fas fa-plus mr-2"></i>New Project
        </button>
      </div>
      
      <div class="bg-white rounded-lg shadow">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timeline</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${projects.projects.map(project => `
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4">
                    <div class="font-medium text-gray-900">${project.name}</div>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">${project.client_name}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">${project.lead_name}</td>
                  <td class="px-6 py-4">${getStatusBadge(project.status)}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    ${formatDate(project.start_date)} - ${formatDate(project.end_date)}
                  </td>
                  <td class="px-6 py-4">
                    <button onclick="viewProject(${project.id})" class="btn-secondary">
                      <i class="fas fa-eye mr-1"></i>View
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ========== PROJECT DETAIL VIEW ==========
async function viewProject(projectId) {
  const data = await apiCall(`/projects/${projectId}`);
  const { project, stages, files, risks } = data;
  
  currentView = 'project-detail';
  document.getElementById('app-content').innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <button onclick="navigate('projects')" class="text-blue-600 hover:text-blue-800 mb-2">
            <i class="fas fa-arrow-left mr-2"></i>Back to Projects
          </button>
          <h1 class="text-3xl font-bold text-gray-900">${project.name}</h1>
          <p class="text-gray-500 mt-1">${project.client_name} • Lead: ${project.lead_name}</p>
        </div>
        ${getStatusBadge(project.status)}
      </div>
      
      <!-- Stage Timeline -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">
          <i class="fas fa-stream mr-2"></i>Project Stages
        </h2>
        <div class="space-y-3">
          ${stages.map((stage, idx) => `
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0 w-8 h-8 rounded-full ${
                stage.status === 'completed' ? 'bg-green-500' :
                stage.status === 'in_progress' ? 'bg-blue-500' :
                'bg-gray-300'
              } flex items-center justify-center text-white font-bold">
                ${idx + 1}
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <span class="font-medium">${stage.type.replace(/_/g, ' ').toUpperCase()}</span>
                  ${getStatusBadge(stage.status)}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- 5 Mandatory Files -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">
          <i class="fas fa-folder mr-2"></i>Project Files (5 Mandatory Items)
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          ${files.map(file => `
            <div class="border rounded-lg p-4 hover:shadow-md transition">
              <i class="fas ${
                file.kind === 'brief' ? 'fa-file-contract' :
                file.kind === 'contract_summary' ? 'fa-file-signature' :
                file.kind === 'contact_report' ? 'fa-comments' :
                file.kind === 'finance_note' ? 'fa-lock' :
                'fa-clipboard-list'
              } text-3xl text-blue-500 mb-2"></i>
              <h3 class="font-medium text-sm">${file.name}</h3>
              ${file.kind === 'brief' ? 
                `<button onclick="viewBrief(${project.id})" class="btn-secondary mt-2 w-full">Open</button>` :
                `<button class="btn-secondary mt-2 w-full" disabled>View</button>`
              }
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Risks Panel -->
      ${risks.length > 0 ? `
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold mb-4">
            <i class="fas fa-exclamation-triangle mr-2"></i>Risks & Issues
          </h2>
          <div class="space-y-3">
            ${risks.map(risk => `
              <div class="border-l-4 ${
                risk.impact === 'high' ? 'border-red-500' :
                risk.impact === 'medium' ? 'border-yellow-500' :
                'border-green-500'
              } pl-4 py-2">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <p class="font-medium">${risk.description}</p>
                    <p class="text-sm text-gray-500 mt-1">
                      Impact: ${risk.impact} | Likelihood: ${risk.likelihood}
                      ${risk.owner_name ? ` | Owner: ${risk.owner_name}` : ''}
                    </p>
                  </div>
                  ${getStatusBadge(risk.status)}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div class="flex space-x-4">
        <button onclick="showAddTaskModal(${project.id})" class="btn-primary">
          <i class="fas fa-plus mr-2"></i>Add Task
        </button>
        <button onclick="showAddRiskModal(${project.id})" class="btn-secondary">
          <i class="fas fa-exclamation-triangle mr-2"></i>Report Risk
        </button>
        <button onclick="showContactReportModal(${project.id})" class="btn-secondary">
          <i class="fas fa-file-alt mr-2"></i>Add Contact Report
        </button>
      </div>
    </div>
  `;
}

// ========== APPROVALS VIEW ==========
async function renderApprovals() {
  const data = await apiCall('/approvals/pending');
  
  return `
    <div class="space-y-6">
      <h1 class="text-3xl font-bold text-gray-900">
        <i class="fas fa-check-circle mr-3"></i>Pending Approvals
      </h1>
      
      <div class="bg-white rounded-lg shadow">
        ${data.approvals.length === 0 ?
          '<div class="p-12 text-center text-gray-500">No pending approvals</div>' :
          `<div class="divide-y divide-gray-200">
            ${data.approvals.map(approval => `
              <div class="p-6">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="text-lg font-medium text-gray-900">${approval.task_title}</h3>
                    <p class="text-gray-500 mt-1">${approval.project_name}</p>
                    ${approval.description ? `<p class="text-sm text-gray-600 mt-2">${approval.description}</p>` : ''}
                    <div class="mt-3 flex items-center space-x-4 text-sm">
                      <span>Peer: ${getStatusBadge(approval.peer_status)}</span>
                      <span>Senior: ${getStatusBadge(approval.senior_status)}</span>
                    </div>
                  </div>
                  <div class="ml-4 flex flex-col space-y-2">
                    ${approval.peer_status === 'pending' && approval.peer_reviewer_id == currentUser.id ? `
                      <button onclick="approveTask(${approval.id}, 'peer', 'approved')" class="btn-primary">
                        <i class="fas fa-check mr-1"></i>Approve
                      </button>
                      <button onclick="rejectTask(${approval.id}, 'peer')" class="btn-danger">
                        <i class="fas fa-times mr-1"></i>Reject
                      </button>
                    ` : ''}
                    ${approval.senior_status === 'pending' && approval.peer_status === 'approved' && approval.senior_approver_id == currentUser.id ? `
                      <button onclick="approveTask(${approval.id}, 'senior', 'approved')" class="btn-primary">
                        <i class="fas fa-check mr-1"></i>Approve
                      </button>
                      <button onclick="rejectTask(${approval.id}, 'senior')" class="btn-danger">
                        <i class="fas fa-times mr-1"></i>Reject
                      </button>
                    ` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>`
        }
      </div>
    </div>
  `;
}

// ========== REPORTS VIEW ==========
async function renderReports() {
  const [contactReports, projects, analytics, projectHealth, allTasks, allRisks, users] = await Promise.all([
    apiCall('/contact-reports'),
    apiCall('/projects'),
    apiCall('/analytics/overview'),
    apiCall('/analytics/project-health'),
    apiCall('/tasks'),
    apiCall('/risks'),
    apiCall('/users')
  ]);
  
  // Store users globally for later use
  window.reportUsers = users.users;
  
  // Calculate date ranges
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  // Weekly Stats
  const tasksThisWeek = allTasks.tasks.filter(t => new Date(t.created_at) >= startOfWeek);
  const tasksCompletedThisWeek = allTasks.tasks.filter(t => 
    t.status === 'completed' && new Date(t.updated_at) >= startOfWeek
  );
  const tasksOverdueThisWeek = allTasks.tasks.filter(t => 
    t.status !== 'completed' && t.due_date && new Date(t.due_date) < now && new Date(t.due_date) >= startOfWeek
  );
  
  // Monthly Stats
  const tasksThisMonth = allTasks.tasks.filter(t => new Date(t.created_at) >= startOfMonth);
  const tasksCompletedThisMonth = allTasks.tasks.filter(t => 
    t.status === 'completed' && new Date(t.updated_at) >= startOfMonth
  );
  const tasksLastMonth = allTasks.tasks.filter(t => 
    new Date(t.created_at) >= startOfLastMonth && new Date(t.created_at) <= endOfLastMonth
  );
  const tasksCompletedLastMonth = allTasks.tasks.filter(t => 
    t.status === 'completed' && new Date(t.updated_at) >= startOfLastMonth && new Date(t.updated_at) <= endOfLastMonth
  );
  
  // Risk Stats
  const risksThisWeek = allRisks.risks.filter(r => new Date(r.created_at) >= startOfWeek);
  const risksResolvedThisWeek = allRisks.risks.filter(r => 
    r.status === 'closed' && new Date(r.updated_at) >= startOfWeek
  );
  const risksThisMonth = allRisks.risks.filter(r => new Date(r.created_at) >= startOfMonth);
  const risksResolvedThisMonth = allRisks.risks.filter(r => 
    r.status === 'closed' && new Date(r.updated_at) >= startOfMonth
  );
  const openRisks = allRisks.risks.filter(r => r.status === 'open');
  
  // Contact Report Stats
  const contactReportsThisWeek = contactReports.reports.filter(r => {
    const reportDate = new Date(r.meeting_date || r.created_at);
    return reportDate >= startOfWeek;
  });
  const contactReportsThisMonth = contactReports.reports.filter(r => {
    const reportDate = new Date(r.meeting_date || r.created_at);
    return reportDate >= startOfMonth;
  });
  
  // Project Stats
  const activeProjects = projects.projects.filter(p => p.status === 'active').length;
  const projectsWithRisks = projectHealth.project_health.filter(p => p.open_risks > 0).length;
  const projectsWithOverdue = projectHealth.project_health.filter(p => p.overdue_tasks > 0).length;
  
  return `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-gray-900">
          <i class="fas fa-chart-bar mr-3"></i>Operational Reports
        </h1>
        <div class="text-sm text-gray-500">
          <i class="fas fa-calendar mr-2"></i>Reporting Period: ${formatDate(startOfMonth)} - Today
        </div>
      </div>
      
      <!-- Period Selector Tabs -->
      <div class="flex items-center space-x-4">
        <div class="bg-white rounded-lg shadow p-1 inline-flex">
          <button onclick="selectReportPeriod('week')" id="period-week" class="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white">
            This Week
          </button>
          <button onclick="selectReportPeriod('month')" id="period-month" class="px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100">
            This Month
          </button>
          <button onclick="selectReportPeriod('comparison')" id="period-comparison" class="px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100">
            Month Comparison
          </button>
          <button onclick="selectReportPeriod('custom')" id="period-custom" class="px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100">
            <i class="fas fa-calendar-alt mr-1"></i>Custom Range
          </button>
          <button onclick="selectReportPeriod('user')" id="period-user" class="px-4 py-2 rounded text-sm font-medium text-gray-600 hover:bg-gray-100">
            <i class="fas fa-user mr-1"></i>User Report
          </button>
        </div>
        
        <!-- Custom Date Range Picker (hidden by default) -->
        <div id="custom-date-picker" class="hidden bg-white rounded-lg shadow p-4 inline-flex items-center space-x-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">From</label>
            <input type="date" id="custom-start-date" class="input text-sm" value="${new Date(startOfMonth).toISOString().split('T')[0]}">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">To</label>
            <input type="date" id="custom-end-date" class="input text-sm" value="${new Date().toISOString().split('T')[0]}">
          </div>
          <button onclick="applyCustomDateRange()" class="btn-primary text-sm mt-5">
            <i class="fas fa-check mr-1"></i>Apply
          </button>
          <button onclick="cancelCustomDateRange()" class="btn-secondary text-sm mt-5">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- User Report Picker (hidden by default) -->
        <div id="user-report-picker" class="hidden bg-white rounded-lg shadow p-4 inline-flex items-center space-x-3">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Select User</label>
            <select id="user-select" class="input text-sm" style="min-width: 200px;">
              <option value="">All Users</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Period</label>
            <select id="user-period-select" class="input text-sm">
              <option value="week">This Week</option>
              <option value="month" selected>This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <button onclick="applyUserReport()" class="btn-primary text-sm mt-5">
            <i class="fas fa-chart-bar mr-1"></i>Generate
          </button>
          <button onclick="cancelUserReport()" class="btn-secondary text-sm mt-5">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <!-- Weekly Report Section -->
      <div id="report-week" class="report-section">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-calendar-week mr-2"></i>Weekly Summary
        </h2>
        
        <!-- Weekly Task Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-4">
              <div class="bg-white/20 rounded-lg p-3">
                <i class="fas fa-plus-circle text-2xl"></i>
              </div>
            </div>
            <div class="text-3xl font-bold mb-1">${tasksThisWeek.length}</div>
            <div class="text-blue-100 text-sm">Tasks Created</div>
          </div>
          
          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-4">
              <div class="bg-white/20 rounded-lg p-3">
                <i class="fas fa-check-circle text-2xl"></i>
              </div>
            </div>
            <div class="text-3xl font-bold mb-1">${tasksCompletedThisWeek.length}</div>
            <div class="text-green-100 text-sm">Tasks Completed</div>
          </div>
          
          <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-4">
              <div class="bg-white/20 rounded-lg p-3">
                <i class="fas fa-exclamation-triangle text-2xl"></i>
              </div>
            </div>
            <div class="text-3xl font-bold mb-1">${tasksOverdueThisWeek.length}</div>
            <div class="text-red-100 text-sm">Tasks Overdue</div>
          </div>
          
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-4">
              <div class="bg-white/20 rounded-lg p-3">
                <i class="fas fa-percent text-2xl"></i>
              </div>
            </div>
            <div class="text-3xl font-bold mb-1">${tasksThisWeek.length > 0 ? Math.round((tasksCompletedThisWeek.length / tasksThisWeek.length) * 100) : 0}%</div>
            <div class="text-purple-100 text-sm">Completion Rate</div>
          </div>
        </div>
        
        <!-- Weekly Risk Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="text-orange-600">
                <i class="fas fa-shield-alt text-3xl"></i>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-gray-900">${risksThisWeek.length}</div>
                <div class="text-sm text-gray-500">Risks Raised</div>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="text-green-600">
                <i class="fas fa-check-double text-3xl"></i>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-gray-900">${risksResolvedThisWeek.length}</div>
                <div class="text-sm text-gray-500">Risks Resolved</div>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="text-blue-600">
                <i class="fas fa-file-alt text-3xl"></i>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-gray-900">${contactReportsThisWeek.length}</div>
                <div class="text-sm text-gray-500">Contact Reports</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Monthly Report Section -->
      <div id="report-month" class="report-section hidden">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-calendar-alt mr-2"></i>Monthly Summary
        </h2>
        
        <!-- Monthly Task Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-4">
              <div class="bg-white/20 rounded-lg p-3">
                <i class="fas fa-plus-circle text-2xl"></i>
              </div>
            </div>
            <div class="text-3xl font-bold mb-1">${tasksThisMonth.length}</div>
            <div class="text-blue-100 text-sm">Tasks Assigned</div>
          </div>
          
          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-4">
              <div class="bg-white/20 rounded-lg p-3">
                <i class="fas fa-check-circle text-2xl"></i>
              </div>
            </div>
            <div class="text-3xl font-bold mb-1">${tasksCompletedThisMonth.length}</div>
            <div class="text-green-100 text-sm">Tasks Completed</div>
          </div>
          
          <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-4">
              <div class="bg-white/20 rounded-lg p-3">
                <i class="fas fa-clock text-2xl"></i>
              </div>
            </div>
            <div class="text-3xl font-bold mb-1">${analytics.overdue_tasks}</div>
            <div class="text-red-100 text-sm">Currently Overdue</div>
          </div>
          
          <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between mb-4">
              <div class="bg-white/20 rounded-lg p-3">
                <i class="fas fa-percent text-2xl"></i>
              </div>
            </div>
            <div class="text-3xl font-bold mb-1">${tasksThisMonth.length > 0 ? Math.round((tasksCompletedThisMonth.length / tasksThisMonth.length) * 100) : 0}%</div>
            <div class="text-purple-100 text-sm">Completion Rate</div>
          </div>
        </div>
        
        <!-- Monthly Risk & Report Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="text-orange-600">
                <i class="fas fa-shield-alt text-3xl"></i>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-gray-900">${risksThisMonth.length}</div>
                <div class="text-sm text-gray-500">Risks Raised</div>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="text-green-600">
                <i class="fas fa-check-double text-3xl"></i>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-gray-900">${risksResolvedThisMonth.length}</div>
                <div class="text-sm text-gray-500">Risks Resolved</div>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="text-red-600">
                <i class="fas fa-exclamation-circle text-3xl"></i>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-gray-900">${openRisks.length}</div>
                <div class="text-sm text-gray-500">Open Risks</div>
              </div>
            </div>
          </div>
          
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="text-blue-600">
                <i class="fas fa-file-alt text-3xl"></i>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold text-gray-900">${contactReportsThisMonth.length}</div>
                <div class="text-sm text-gray-500">Contact Reports</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Custom Date Range Section -->
      <div id="report-custom" class="report-section hidden">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-calendar-alt mr-2"></i>Custom Date Range
        </h2>
        
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-blue-800">
            <i class="fas fa-info-circle mr-2"></i>
            Select a custom date range above and click "Apply" to generate a report for that period.
          </p>
        </div>
        
        <!-- Custom range stats will be populated here when dates are selected -->
        <div id="custom-stats-container">
          <div class="text-center py-12 text-gray-500">
            <i class="fas fa-calendar-alt text-4xl mb-3"></i>
            <p>Select dates and click Apply to generate report</p>
          </div>
        </div>
      </div>
      
      <!-- User Report Section -->
      <div id="report-user" class="report-section hidden">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-user mr-2"></i>User Performance Report
        </h2>
        
        <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
          <p class="text-sm text-indigo-800">
            <i class="fas fa-info-circle mr-2"></i>
            Select a user and time period above to generate an individual performance report.
          </p>
        </div>
        
        <!-- User report stats will be populated here when user is selected -->
        <div id="user-stats-container">
          <div class="text-center py-12 text-gray-500">
            <i class="fas fa-user-chart text-4xl mb-3"></i>
            <p>Select a user and click Generate to create report</p>
          </div>
        </div>
      </div>
      
      <!-- Month Comparison Section -->
      <div id="report-comparison" class="report-section hidden">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-exchange-alt mr-2"></i>Month-over-Month Comparison
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Task Comparison -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Task Performance</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <div class="text-sm text-gray-600">Tasks Assigned</div>
                  <div class="flex items-center space-x-3 mt-1">
                    <span class="text-xl font-bold text-gray-900">${tasksThisMonth.length}</span>
                    <span class="text-sm text-gray-500">vs ${tasksLastMonth.length} last month</span>
                  </div>
                </div>
                <div class="text-${tasksThisMonth.length >= tasksLastMonth.length ? 'green' : 'red'}-600">
                  <i class="fas fa-arrow-${tasksThisMonth.length >= tasksLastMonth.length ? 'up' : 'down'} text-2xl"></i>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <div class="text-sm text-gray-600">Tasks Completed</div>
                  <div class="flex items-center space-x-3 mt-1">
                    <span class="text-xl font-bold text-gray-900">${tasksCompletedThisMonth.length}</span>
                    <span class="text-sm text-gray-500">vs ${tasksCompletedLastMonth.length} last month</span>
                  </div>
                </div>
                <div class="text-${tasksCompletedThisMonth.length >= tasksCompletedLastMonth.length ? 'green' : 'red'}-600">
                  <i class="fas fa-arrow-${tasksCompletedThisMonth.length >= tasksCompletedLastMonth.length ? 'up' : 'down'} text-2xl"></i>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <div class="text-sm text-gray-600">Completion Rate</div>
                  <div class="flex items-center space-x-3 mt-1">
                    <span class="text-xl font-bold text-gray-900">${tasksThisMonth.length > 0 ? Math.round((tasksCompletedThisMonth.length / tasksThisMonth.length) * 100) : 0}%</span>
                    <span class="text-sm text-gray-500">vs ${tasksLastMonth.length > 0 ? Math.round((tasksCompletedLastMonth.length / tasksLastMonth.length) * 100) : 0}% last month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Project Health -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Project Health</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 bg-indigo-50 rounded-lg">
                <div>
                  <div class="text-sm text-gray-600">Active Projects</div>
                  <div class="text-xl font-bold text-gray-900 mt-1">${activeProjects}</div>
                </div>
                <i class="fas fa-folder-open text-indigo-600 text-2xl"></i>
              </div>
              
              <div class="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div>
                  <div class="text-sm text-gray-600">Projects with Overdue Tasks</div>
                  <div class="text-xl font-bold text-gray-900 mt-1">${projectsWithOverdue}</div>
                </div>
                <i class="fas fa-clock text-yellow-600 text-2xl"></i>
              </div>
              
              <div class="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                <div>
                  <div class="text-sm text-gray-600">Projects with Open Risks</div>
                  <div class="text-xl font-bold text-gray-900 mt-1">${projectsWithRisks}</div>
                </div>
                <i class="fas fa-exclamation-triangle text-orange-600 text-2xl"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Contact Reports Summary -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
          <h2 class="text-xl font-semibold text-gray-900">
            <i class="fas fa-address-book mr-2 text-teal-600"></i>Client Contact Reports Summary
          </h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-6 bg-blue-50 rounded-lg">
              <div class="text-3xl font-bold text-blue-600 mb-2">${contactReports.reports.length}</div>
              <div class="text-sm text-gray-600">Total Reports</div>
            </div>
            <div class="text-center p-6 bg-green-50 rounded-lg">
              <div class="text-3xl font-bold text-green-600 mb-2">${contactReportsThisMonth.length}</div>
              <div class="text-sm text-gray-600">This Month</div>
            </div>
            <div class="text-center p-6 bg-purple-50 rounded-lg">
              <div class="text-3xl font-bold text-purple-600 mb-2">${contactReportsThisWeek.length}</div>
              <div class="text-sm text-gray-600">This Week</div>
            </div>
          </div>
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600 mb-3">Recent contact reports logged by the team</p>
            <div class="flex flex-wrap gap-2 justify-center">
              ${contactReports.reports.slice(0, 5).map(report => `
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  <i class="fas fa-file-alt mr-1"></i>${report.project_name}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function selectReportPeriod(period) {
  // Hide all sections
  document.querySelectorAll('.report-section').forEach(el => el.classList.add('hidden'));
  
  // Remove active class from all buttons
  document.querySelectorAll('[id^="period-"]').forEach(btn => {
    btn.classList.remove('bg-blue-600', 'text-white');
    btn.classList.add('text-gray-600');
  });
  
  // Hide all pickers
  const datePicker = document.getElementById('custom-date-picker');
  const userPicker = document.getElementById('user-report-picker');
  datePicker.classList.add('hidden');
  userPicker.classList.add('hidden');
  
  // Show/hide appropriate picker
  if (period === 'custom') {
    datePicker.classList.remove('hidden');
  } else if (period === 'user') {
    userPicker.classList.remove('hidden');
    // Populate user dropdown if not already done
    populateUserDropdown();
  }
  
  // Show selected section and highlight button
  document.getElementById('report-' + period).classList.remove('hidden');
  const activeBtn = document.getElementById('period-' + period);
  activeBtn.classList.add('bg-blue-600', 'text-white');
  activeBtn.classList.remove('text-gray-600');
}

function populateUserDropdown() {
  const select = document.getElementById('user-select');
  if (select.options.length > 1) return; // Already populated
  
  if (window.reportUsers) {
    window.reportUsers.forEach(user => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.name} (${user.role})`;
      select.appendChild(option);
    });
  }
}

async function applyCustomDateRange() {
  const startDate = document.getElementById('custom-start-date').value;
  const endDate = document.getElementById('custom-end-date').value;
  
  if (!startDate || !endDate) {
    showToast('Please select both start and end dates', 'error');
    return;
  }
  
  if (new Date(startDate) > new Date(endDate)) {
    showToast('Start date must be before end date', 'error');
    return;
  }
  
  // Show loading state
  const container = document.getElementById('custom-stats-container');
  container.innerHTML = `
    <div class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-3"></i>
      <p class="text-gray-600">Generating report...</p>
    </div>
  `;
  
  try {
    // Fetch data
    const [allTasks, allRisks, contactReports] = await Promise.all([
      apiCall('/tasks'),
      apiCall('/risks'),
      apiCall('/contact-reports')
    ]);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include full end date
    
    // Filter data by date range
    const tasksInRange = allTasks.tasks.filter(t => {
      const createdDate = new Date(t.created_at);
      return createdDate >= start && createdDate <= end;
    });
    
    const tasksCompletedInRange = allTasks.tasks.filter(t => {
      const updatedDate = new Date(t.updated_at);
      return t.status === 'completed' && updatedDate >= start && updatedDate <= end;
    });
    
    const tasksOverdueInRange = allTasks.tasks.filter(t => {
      const dueDate = new Date(t.due_date);
      return t.status !== 'completed' && t.due_date && dueDate >= start && dueDate <= end && dueDate < new Date();
    });
    
    const risksInRange = allRisks.risks.filter(r => {
      const createdDate = new Date(r.created_at);
      return createdDate >= start && createdDate <= end;
    });
    
    const risksResolvedInRange = allRisks.risks.filter(r => {
      const updatedDate = new Date(r.updated_at);
      return r.status === 'closed' && updatedDate >= start && updatedDate <= end;
    });
    
    const reportsInRange = contactReports.reports.filter(r => {
      const reportDate = new Date(r.meeting_date || r.created_at);
      return reportDate >= start && reportDate <= end;
    });
    
    const completionRate = tasksInRange.length > 0 
      ? Math.round((tasksCompletedInRange.length / tasksInRange.length) * 100) 
      : 0;
    
    // Calculate date range info
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    // Generate report HTML
    container.innerHTML = `
      <div class="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">
              ${formatDate(startDate)} - ${formatDate(endDate)}
            </h3>
            <p class="text-sm text-gray-600">${daysDiff} day${daysDiff !== 1 ? 's' : ''} selected</p>
          </div>
          <button onclick="selectReportPeriod('custom')" class="text-blue-600 hover:text-blue-800 text-sm">
            <i class="fas fa-edit mr-1"></i>Change Dates
          </button>
        </div>
      </div>
      
      <!-- Task Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-white/20 rounded-lg p-3">
              <i class="fas fa-plus-circle text-2xl"></i>
            </div>
          </div>
          <div class="text-3xl font-bold mb-1">${tasksInRange.length}</div>
          <div class="text-blue-100 text-sm">Tasks Created</div>
        </div>
        
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-white/20 rounded-lg p-3">
              <i class="fas fa-check-circle text-2xl"></i>
            </div>
          </div>
          <div class="text-3xl font-bold mb-1">${tasksCompletedInRange.length}</div>
          <div class="text-green-100 text-sm">Tasks Completed</div>
        </div>
        
        <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-white/20 rounded-lg p-3">
              <i class="fas fa-exclamation-triangle text-2xl"></i>
            </div>
          </div>
          <div class="text-3xl font-bold mb-1">${tasksOverdueInRange.length}</div>
          <div class="text-red-100 text-sm">Tasks Overdue</div>
        </div>
        
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-white/20 rounded-lg p-3">
              <i class="fas fa-percent text-2xl"></i>
            </div>
          </div>
          <div class="text-3xl font-bold mb-1">${completionRate}%</div>
          <div class="text-purple-100 text-sm">Completion Rate</div>
        </div>
      </div>
      
      <!-- Risk & Report Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="text-orange-600">
              <i class="fas fa-shield-alt text-3xl"></i>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-gray-900">${risksInRange.length}</div>
              <div class="text-sm text-gray-500">Risks Raised</div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="text-green-600">
              <i class="fas fa-check-double text-3xl"></i>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-gray-900">${risksResolvedInRange.length}</div>
              <div class="text-sm text-gray-500">Risks Resolved</div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="text-blue-600">
              <i class="fas fa-file-alt text-3xl"></i>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-gray-900">${reportsInRange.length}</div>
              <div class="text-sm text-gray-500">Contact Reports</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Daily Averages -->
      <div class="mt-6 bg-gray-50 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Daily Averages</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-blue-600">${(tasksInRange.length / daysDiff).toFixed(1)}</div>
            <div class="text-xs text-gray-600">Tasks/Day</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-green-600">${(tasksCompletedInRange.length / daysDiff).toFixed(1)}</div>
            <div class="text-xs text-gray-600">Completed/Day</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-orange-600">${(risksInRange.length / daysDiff).toFixed(1)}</div>
            <div class="text-xs text-gray-600">Risks/Day</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-purple-600">${(reportsInRange.length / daysDiff).toFixed(1)}</div>
            <div class="text-xs text-gray-600">Reports/Day</div>
          </div>
        </div>
      </div>
    `;
    
    showToast('Custom report generated successfully', 'success');
    
  } catch (error) {
    container.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
        <p>Error generating report: ${error.message}</p>
      </div>
    `;
    showToast('Failed to generate report', 'error');
  }
}

function cancelCustomDateRange() {
  // Reset to default view
  selectReportPeriod('week');
}

async function applyUserReport() {
  const userId = document.getElementById('user-select').value;
  const period = document.getElementById('user-period-select').value;
  
  if (!userId) {
    showToast('Please select a user', 'error');
    return;
  }
  
  // Show loading state
  const container = document.getElementById('user-stats-container');
  container.innerHTML = `
    <div class="text-center py-12">
      <i class="fas fa-spinner fa-spin text-4xl text-indigo-600 mb-3"></i>
      <p class="text-gray-600">Generating user report...</p>
    </div>
  `;
  
  try {
    // Fetch data
    const [allTasks, allRisks, contactReports, approvals] = await Promise.all([
      apiCall('/tasks'),
      apiCall('/risks'),
      apiCall('/contact-reports'),
      apiCall('/approvals/pending')
    ]);
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch(period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
    }
    
    // Find user info
    const user = window.reportUsers.find(u => u.id == userId);
    
    // Filter tasks by user
    const userTasks = allTasks.tasks.filter(t => t.owner_id == userId);
    const userTasksInPeriod = userTasks.filter(t => new Date(t.created_at) >= startDate);
    const userTasksCompleted = userTasks.filter(t => 
      t.status === 'completed' && new Date(t.updated_at) >= startDate
    );
    const userTasksOverdue = userTasks.filter(t => 
      t.status !== 'completed' && t.due_date && new Date(t.due_date) < now && new Date(t.due_date) >= startDate
    );
    const userTasksPending = userTasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
    
    // Filter risks owned by user
    const userRisks = allRisks.risks.filter(r => r.owner_id == userId);
    const userRisksInPeriod = userRisks.filter(r => new Date(r.created_at) >= startDate);
    const userRisksOpen = userRisks.filter(r => r.status === 'open');
    const userRisksResolved = userRisks.filter(r => 
      r.status === 'closed' && new Date(r.updated_at) >= startDate
    );
    
    // Filter contact reports created by user
    const userReports = contactReports.reports.filter(r => r.created_by == userId);
    const userReportsInPeriod = userReports.filter(r => {
      const reportDate = new Date(r.meeting_date || r.created_at);
      return reportDate >= startDate;
    });
    
    // Calculate completion rate
    const completionRate = userTasksInPeriod.length > 0 
      ? Math.round((userTasksCompleted.length / userTasksInPeriod.length) * 100) 
      : 0;
    
    // Calculate average task completion time
    const completedTasksWithDates = userTasksCompleted.filter(t => t.due_date && t.updated_at);
    const avgCompletionDays = completedTasksWithDates.length > 0
      ? Math.round(completedTasksWithDates.reduce((sum, t) => {
          const completed = new Date(t.updated_at);
          const due = new Date(t.due_date);
          const days = (completed - due) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / completedTasksWithDates.length)
      : 0;
    
    // Get period label
    const periodLabels = {
      'week': 'This Week',
      'month': 'This Month',
      'quarter': 'This Quarter',
      'all': 'All Time'
    };
    
    // Group tasks by project
    const tasksByProject = {};
    userTasks.forEach(task => {
      if (!tasksByProject[task.project_name]) {
        tasksByProject[task.project_name] = [];
      }
      tasksByProject[task.project_name].push(task);
    });
    const activeProjects = Object.keys(tasksByProject).length;
    
    // Generate report HTML
    container.innerHTML = `
      <!-- User Header -->
      <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <i class="fas fa-user text-3xl"></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold">${user.name}</h3>
              <p class="text-indigo-100">${user.role.replace('_', ' ').toUpperCase()} • ${user.email}</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm text-indigo-100">Report Period</div>
            <div class="text-xl font-bold">${periodLabels[period]}</div>
          </div>
        </div>
      </div>
      
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="text-blue-600">
              <i class="fas fa-tasks text-3xl"></i>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-gray-900">${userTasks.length}</div>
              <div class="text-sm text-gray-500">Total Tasks</div>
            </div>
          </div>
          <div class="text-xs text-gray-500">${userTasksInPeriod.length} in period</div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="text-green-600">
              <i class="fas fa-check-circle text-3xl"></i>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-gray-900">${userTasksCompleted.length}</div>
              <div class="text-sm text-gray-500">Completed</div>
            </div>
          </div>
          <div class="text-xs text-gray-500">${completionRate}% completion rate</div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="text-orange-600">
              <i class="fas fa-shield-alt text-3xl"></i>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-gray-900">${userRisksOpen.length}</div>
              <div class="text-sm text-gray-500">Open Risks</div>
            </div>
          </div>
          <div class="text-xs text-gray-500">${userRisksResolved.length} resolved in period</div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="text-purple-600">
              <i class="fas fa-file-alt text-3xl"></i>
            </div>
            <div class="text-right">
              <div class="text-2xl font-bold text-gray-900">${userReportsInPeriod.length}</div>
              <div class="text-sm text-gray-500">Reports Filed</div>
            </div>
          </div>
          <div class="text-xs text-gray-500">${userReports.length} total reports</div>
        </div>
      </div>
      
      <!-- Performance Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Task Breakdown -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-chart-pie mr-2 text-blue-600"></i>Task Breakdown
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <i class="fas fa-check text-green-600"></i>
                <span class="text-sm font-medium text-gray-700">Completed</span>
              </div>
              <span class="text-lg font-bold text-green-600">${userTasksCompleted.length}</span>
            </div>
            
            <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <i class="fas fa-clock text-yellow-600"></i>
                <span class="text-sm font-medium text-gray-700">In Progress</span>
              </div>
              <span class="text-lg font-bold text-yellow-600">${userTasksPending.length}</span>
            </div>
            
            <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <i class="fas fa-exclamation-triangle text-red-600"></i>
                <span class="text-sm font-medium text-gray-700">Overdue</span>
              </div>
              <span class="text-lg font-bold text-red-600">${userTasksOverdue.length}</span>
            </div>
          </div>
        </div>
        
        <!-- Key Metrics -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">
            <i class="fas fa-tachometer-alt mr-2 text-purple-600"></i>Key Metrics
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
              <div>
                <div class="text-sm text-gray-600">Projects Involved</div>
                <div class="text-2xl font-bold text-indigo-600">${activeProjects}</div>
              </div>
              <i class="fas fa-folder-open text-indigo-600 text-2xl"></i>
            </div>
            
            <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <div class="text-sm text-gray-600">Completion Rate</div>
                <div class="text-2xl font-bold text-purple-600">${completionRate}%</div>
              </div>
              <i class="fas fa-percent text-purple-600 text-2xl"></i>
            </div>
            
            <div class="flex items-center justify-between p-3 ${avgCompletionDays <= 0 ? 'bg-green-50' : 'bg-orange-50'} rounded-lg">
              <div>
                <div class="text-sm text-gray-600">Avg Completion</div>
                <div class="text-2xl font-bold ${avgCompletionDays <= 0 ? 'text-green-600' : 'text-orange-600'}">
                  ${avgCompletionDays <= 0 ? 'On Time' : avgCompletionDays + 'd late'}
                </div>
              </div>
              <i class="fas fa-calendar-check ${avgCompletionDays <= 0 ? 'text-green-600' : 'text-orange-600'} text-2xl"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Projects List -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">
          <i class="fas fa-list mr-2 text-gray-600"></i>Active Projects
        </h3>
        <div class="space-y-2">
          ${Object.entries(tasksByProject).slice(0, 10).map(([project, tasks]) => {
            const completed = tasks.filter(t => t.status === 'completed').length;
            const percentage = Math.round((completed / tasks.length) * 100);
            return `
              <div class="p-3 border rounded-lg hover:bg-gray-50">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium text-gray-900 text-sm">${project}</span>
                  <span class="text-xs font-semibold text-gray-600">${completed}/${tasks.length} tasks</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
              </div>
            `;
          }).join('')}
          ${Object.keys(tasksByProject).length > 10 ? `
            <div class="text-center pt-2">
              <span class="text-sm text-gray-500">+ ${Object.keys(tasksByProject).length - 10} more projects</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    showToast('User report generated successfully', 'success');
    
  } catch (error) {
    container.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
        <p>Error generating report: ${error.message}</p>
      </div>
    `;
    showToast('Failed to generate user report', 'error');
  }
}

function cancelUserReport() {
  // Reset to default view
  selectReportPeriod('week');
}

// ========== TEMPLATES VIEW ==========
async function renderTemplates() {
  const data = await apiCall('/templates');
  
  const categories = [...new Set(data.templates.map(t => t.category))];
  
  return `
    <div class="space-y-6">
      <h1 class="text-3xl font-bold text-gray-900">
        <i class="fas fa-file-alt mr-3"></i>Templates Library
      </h1>
      
      <div class="bg-white rounded-lg shadow p-6">
        <input type="text" 
               placeholder="Search templates..." 
               class="input w-full"
               onkeyup="searchTemplates(this.value)">
      </div>
      
      <div id="templates-content">
        ${categories.map(category => `
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4 capitalize">
              ${category.replace(/_/g, ' ')}
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${data.templates.filter(t => t.category === category).map(template => `
                <div class="border rounded-lg p-4 hover:shadow-md transition">
                  <h3 class="font-medium mb-2">${template.name}</h3>
                  <p class="text-sm text-gray-600 mb-3">${template.description || 'No description'}</p>
                  <div class="flex space-x-2">
                    <button class="btn-secondary flex-1">
                      <i class="fas fa-download mr-1"></i>Download
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ========== ANALYTICS VIEW ==========
async function renderAnalytics() {
  const [overview, projectHealth, allProjects, allTasks] = await Promise.all([
    apiCall('/analytics/overview'),
    apiCall('/analytics/project-health'),
    apiCall('/projects'),
    apiCall('/tasks')
  ]);
  
  // Calculate additional metrics
  const totalProjects = projectHealth.project_health.length;
  const activeProjects = projectHealth.project_health.filter(p => p.status === 'active').length;
  const totalTasks = projectHealth.project_health.reduce((sum, p) => sum + p.total_tasks, 0);
  const completedTasks = projectHealth.project_health.reduce((sum, p) => sum + p.completed_tasks, 0);
  const totalRisks = projectHealth.project_health.reduce((sum, p) => sum + p.open_risks, 0);
  const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Status distribution
  const statusCounts = {};
  allProjects.projects.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });
  
  // Task priority distribution
  const priorityCounts = { urgent: 0, high: 0, medium: 0, low: 0 };
  allTasks.tasks.forEach(t => {
    if (t.priority && priorityCounts.hasOwnProperty(t.priority)) {
      priorityCounts[t.priority]++;
    }
  });
  
  // Health distribution
  const healthCounts = { good: 0, moderate: 0, poor: 0 };
  projectHealth.project_health.forEach(project => {
    const health = project.overdue_tasks === 0 && project.open_risks === 0 ? 'good' :
                  project.overdue_tasks < 3 && project.open_risks < 2 ? 'moderate' : 'poor';
    healthCounts[health]++;
  });
  
  return `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold text-gray-900">
          <i class="fas fa-chart-line mr-3"></i>Analytics & Performance
        </h1>
        <div class="text-sm text-gray-500">
          <i class="fas fa-calendar mr-2"></i>Last updated: ${new Date().toLocaleString()}
        </div>
      </div>
      
      <!-- Big Number Callouts -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Active Projects -->
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-white/20 rounded-lg p-3">
              <i class="fas fa-folder-open text-2xl"></i>
            </div>
            <span class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Active</span>
          </div>
          <div class="text-4xl font-bold mb-1" data-counter="${activeProjects}">0</div>
          <div class="text-blue-100 text-sm">of <span data-counter="${totalProjects}">0</span> total projects</div>
          <div class="mt-3 flex items-center text-sm">
            <i class="fas fa-arrow-up mr-1"></i>
            <span>12% from last month</span>
          </div>
        </div>
        
        <!-- Task Completion -->
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-white/20 rounded-lg p-3">
              <i class="fas fa-check-circle text-2xl"></i>
            </div>
            <span class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Rate</span>
          </div>
          <div class="text-4xl font-bold mb-1" data-counter="${overallCompletion}" data-percentage="true">0%</div>
          <div class="text-green-100 text-sm"><span data-counter="${completedTasks}">0</span> of <span data-counter="${totalTasks}">0</span> tasks done</div>
          <div class="mt-3 flex items-center text-sm">
            <i class="fas fa-arrow-up mr-1"></i>
            <span>8% improvement</span>
          </div>
        </div>
        
        <!-- Open Risks -->
        <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-white/20 rounded-lg p-3">
              <i class="fas fa-exclamation-triangle text-2xl"></i>
            </div>
            <span class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Risks</span>
          </div>
          <div class="text-4xl font-bold mb-1" data-counter="${totalRisks}">0</div>
          <div class="text-orange-100 text-sm">Across all projects</div>
          <div class="mt-3 flex items-center text-sm">
            <i class="fas fa-arrow-down mr-1"></i>
            <span>5% decrease</span>
          </div>
        </div>
        
        <!-- Pending Approvals -->
        <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div class="flex items-center justify-between mb-4">
            <div class="bg-white/20 rounded-lg p-3">
              <i class="fas fa-hourglass-half text-2xl"></i>
            </div>
            <span class="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">Pending</span>
          </div>
          <div class="text-4xl font-bold mb-1" data-counter="${overview.pending_approvals}">0</div>
          <div class="text-purple-100 text-sm">Awaiting review</div>
          <div class="mt-3 flex items-center text-sm">
            <i class="fas fa-minus mr-1"></i>
            <span>Stable</span>
          </div>
        </div>
      </div>
      
      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Project Status Donut Chart -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold mb-6 flex items-center">
            <i class="fas fa-chart-pie mr-3 text-blue-600"></i>
            Project Status Distribution
          </h2>
          <div class="flex items-center justify-center" style="height: 280px;">
            <canvas id="statusChart"></canvas>
          </div>
          <div class="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-green-600" data-counter="${statusCounts.active || 0}">0</div>
              <div class="text-sm text-gray-600">Active</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-blue-600" data-counter="${statusCounts.completed || 0}">0</div>
              <div class="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-orange-600" data-counter="${statusCounts.on_hold || 0}">0</div>
              <div class="text-sm text-gray-600">On Hold</div>
            </div>
          </div>
        </div>
        
        <!-- Task Priority Bar Chart -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold mb-6 flex items-center">
            <i class="fas fa-chart-bar mr-3 text-purple-600"></i>
            Task Priority Breakdown
          </h2>
          <div style="height: 280px;">
            <canvas id="priorityChart"></canvas>
          </div>
          <div class="mt-6 grid grid-cols-4 gap-2 text-center">
            <div>
              <div class="text-xl font-bold text-red-600" data-counter="${priorityCounts.urgent}">0</div>
              <div class="text-xs text-gray-600">Urgent</div>
            </div>
            <div>
              <div class="text-xl font-bold text-orange-600" data-counter="${priorityCounts.high}">0</div>
              <div class="text-xs text-gray-600">High</div>
            </div>
            <div>
              <div class="text-xl font-bold text-yellow-600" data-counter="${priorityCounts.medium}">0</div>
              <div class="text-xs text-gray-600">Medium</div>
            </div>
            <div>
              <div class="text-xl font-bold text-gray-600" data-counter="${priorityCounts.low}">0</div>
              <div class="text-xs text-gray-600">Low</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Project Health Bar Chart -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-6 flex items-center">
          <i class="fas fa-heartbeat mr-3 text-red-600"></i>
          Project Health Overview
        </h2>
        <div style="height: 300px;">
          <canvas id="healthChart"></canvas>
        </div>
      </div>
      
      <!-- Top Projects by Completion -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-6 flex items-center">
          <i class="fas fa-trophy mr-3 text-yellow-600"></i>
          Top Performing Projects
        </h2>
        <div class="space-y-4">
          ${projectHealth.project_health
            .filter(p => p.total_tasks > 0)
            .sort((a, b) => (b.completed_tasks / b.total_tasks) - (a.completed_tasks / a.total_tasks))
            .slice(0, 5)
            .map((project, index) => {
              const completionRate = Math.round((project.completed_tasks / project.total_tasks) * 100);
              return `
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-sm">
                    ${index + 1}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                      <span class="font-medium text-gray-900">${project.name}</span>
                      <span class="text-sm font-semibold text-green-600" data-counter="${completionRate}" data-percentage="true">0%</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                      <div class="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500" style="width: ${completionRate}%"></div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
        </div>
      </div>
      
      <!-- Detailed Project Health Table -->
      <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 class="text-xl font-semibold flex items-center">
            <i class="fas fa-table mr-3 text-indigo-600"></i>
            Detailed Project Metrics
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tasks</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overdue</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Open Risks</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${projectHealth.project_health.map(project => {
                const completionRate = project.total_tasks > 0 ? (project.completed_tasks / project.total_tasks * 100).toFixed(0) : 0;
                const health = project.overdue_tasks === 0 && project.open_risks === 0 ? 'good' :
                              project.overdue_tasks < 3 && project.open_risks < 2 ? 'moderate' : 'poor';
                
                return `
                  <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 font-medium text-gray-900">${project.name}</td>
                    <td class="px-6 py-4 text-gray-700">${project.total_tasks}</td>
                    <td class="px-6 py-4">
                      <div class="flex items-center space-x-2">
                        <span class="text-gray-900">${project.completed_tasks}</span>
                        <span class="text-sm text-gray-500">(${completionRate}%)</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 ${project.overdue_tasks > 0 ? 'text-red-600 font-medium' : 'text-gray-700'}">${project.overdue_tasks}</td>
                    <td class="px-6 py-4 ${project.open_risks > 0 ? 'text-orange-600 font-medium' : ''}">${project.open_risks}</td>
                    <td class="px-6 py-4">
                      <span class="px-3 py-1 rounded-full text-xs font-medium ${
                        health === 'good' ? 'bg-green-100 text-green-800' :
                        health === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }">
                        ${health.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

// ========== MODALS ==========
async function showCreateProjectModal() {
  const [clients, users] = await Promise.all([
    apiCall('/clients'),
    apiCall('/users')
  ]);
  
  const leads = users.users.filter(u => u.role === 'account_lead' || u.role === 'project_lead');
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold">Create New Project</h2>
        <button onclick="this.closest('.modal').remove()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      <form onsubmit="createProject(event)" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Client</label>
          <select name="client_id" required class="input w-full">
            <option value="">Select client...</option>
            ${clients.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input type="text" name="name" required class="input w-full" placeholder="e.g., Product Launch Campaign">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Project Lead</label>
          <select name="lead_id" required class="input w-full">
            <option value="">Select lead...</option>
            ${leads.map(u => `<option value="${u.id}">${u.name} (${u.role})</option>`).join('')}
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" name="start_date" class="input w-full">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" name="end_date" class="input w-full">
          </div>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded p-4">
          <p class="text-sm text-blue-800">
            <i class="fas fa-info-circle mr-2"></i>
            This will automatically create:
            <ul class="list-disc ml-6 mt-2">
              <li>6 project stages (onboarding → post-project review)</li>
              <li>5 mandatory files (Brief, Contract Summary, Contact Reports, Finance Notes, Tracker)</li>
            </ul>
          </p>
        </div>
        <div class="flex justify-end space-x-3">
          <button type="button" onclick="this.closest('.modal').remove()" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Create Project
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
}

async function createProject(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  try {
    const data = await apiCall('/projects', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData))
    });
    
    showToast(data.message, 'success');
    form.closest('.modal').remove();
    navigate('projects');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function viewBrief(projectId) {
  const data = await apiCall(`/briefs/${projectId}`);
  
  if (!data.brief) {
    showCreateBriefModal(projectId);
    return;
  }
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content max-w-3xl">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold">Client Brief</h2>
        <button onclick="this.closest('.modal').remove()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Objectives</label>
          <p class="text-gray-900">${data.brief.objectives}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
          <p class="text-gray-900">${data.brief.audience || 'Not specified'}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tone</label>
          <p class="text-gray-900">${data.brief.tone || 'Not specified'}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Channels</label>
          <p class="text-gray-900">${data.brief.channels.join(', ')}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
          <p class="text-gray-900">${data.brief.timeline || 'Not specified'}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          ${getStatusBadge(data.brief.status)}
        </div>
        ${data.brief.client_sign_off ? `
          <div class="bg-green-50 border border-green-200 rounded p-4">
            <p class="text-green-800 font-medium">
              <i class="fas fa-check-circle mr-2"></i>
              Client sign-off received: ${formatDate(data.brief.client_sign_off_date)}
            </p>
            <p class="text-sm text-green-700 mt-1">${data.brief.client_sign_off}</p>
          </div>
        ` : `
          <button onclick="showSignOffModal(${data.brief.id})" class="btn-primary">
            <i class="fas fa-signature mr-2"></i>Request Client Sign-off
          </button>
        `}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function showCreateBriefModal(projectId) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content max-w-3xl">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold">Create Client Brief</h2>
        <button onclick="this.closest('.modal').remove()" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times text-2xl"></i>
        </button>
      </div>
      <form onsubmit="createBrief(event, ${projectId})" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Objectives *</label>
          <textarea name="objectives" required rows="3" class="input w-full" placeholder="What are the main objectives of this project?"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
          <input type="text" name="audience" class="input w-full" placeholder="e.g., Tech enthusiasts, early adopters">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tone</label>
          <input type="text" name="tone" class="input w-full" placeholder="e.g., Professional but innovative">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Channels</label>
          <div class="space-y-2">
            <label class="flex items-center"><input type="checkbox" name="channels" value="social_media" class="mr-2"> Social Media</label>
            <label class="flex items-center"><input type="checkbox" name="channels" value="press_release" class="mr-2"> Press Release</label>
            <label class="flex items-center"><input type="checkbox" name="channels" value="events" class="mr-2"> Events</label>
            <label class="flex items-center"><input type="checkbox" name="channels" value="digital_ads" class="mr-2"> Digital Ads</label>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Timeline</label>
          <input type="text" name="timeline" class="input w-full" placeholder="e.g., Q1-Q2 2024">
        </div>
        <div class="flex justify-end space-x-3">
          <button type="button" onclick="this.closest('.modal').remove()" class="btn-secondary">Cancel</button>
          <button type="submit" class="btn-primary">
            <i class="fas fa-save mr-2"></i>Create Brief
          </button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
}

async function createBrief(event, projectId) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);
  
  const channels = formData.getAll('channels');
  
  try {
    await apiCall('/briefs', {
      method: 'POST',
      body: JSON.stringify({
        project_id: projectId,
        objectives: formData.get('objectives'),
        audience: formData.get('audience'),
        tone: formData.get('tone'),
        channels,
        timeline: formData.get('timeline')
      })
    });
    
    showToast('Brief created successfully', 'success');
    form.closest('.modal').remove();
    viewBrief(projectId);
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function approveTask(approvalId, level, status) {
  try {
    await apiCall(`/approvals/${approvalId}/${level}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes: 'Approved' })
    });
    
    showToast('Approval recorded', 'success');
    navigate('approvals');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function rejectTask(approvalId, level) {
  const notes = prompt('Please provide rejection reason:');
  if (!notes) return;
  
  try {
    await apiCall(`/approvals/${approvalId}/${level}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'rejected', notes })
    });
    
    showToast('Task rejected', 'success');
    navigate('approvals');
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ========== ASSISTANT ==========
let assistantOpen = false;

function toggleAssistant() {
  assistantOpen = !assistantOpen;
  renderAssistant();
}

function renderAssistant() {
  let assistant = document.getElementById('assistant-panel');
  
  if (!assistantOpen) {
    if (assistant) assistant.remove();
    return;
  }
  
  if (!assistant) {
    assistant = document.createElement('div');
    assistant.id = 'assistant-panel';
    assistant.className = 'fixed right-0 top-16 bottom-0 w-96 bg-white shadow-2xl border-l z-40 flex flex-col';
    document.body.appendChild(assistant);
  }
  
  assistant.innerHTML = `
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <i class="fas fa-sparkles text-2xl"></i>
        <span class="font-bold text-lg">ACGPT</span>
      </div>
      <button onclick="toggleAssistant()" class="text-white hover:text-gray-200">
        <i class="fas fa-times"></i>
      </button>
    </div>
    
    <div id="assistant-messages" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div class="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <p class="text-sm text-gray-800 font-medium mb-2">
          <i class="fas fa-sparkles mr-2 text-purple-600"></i>
          Hi! I'm ACGPT ✨
        </p>
        <p class="text-xs text-gray-600">
          Your AI assistant for ACG processes, templates, and guidelines. Ask me about brand guidelines, QA procedures, or reporting requirements.
        </p>
      </div>
    </div>
    
    <form onsubmit="askAssistant(event)" class="p-4 border-t">
      <div class="flex space-x-2">
        <input type="text" 
               name="question" 
               placeholder="Ask ACGPT anything..." 
               class="input flex-1"
               required>
        <button type="submit" class="btn-primary">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </form>
  `;
}

async function askAssistant(event) {
  event.preventDefault();
  const form = event.target;
  const question = form.question.value;
  
  const messagesDiv = document.getElementById('assistant-messages');
  
  // Add user message
  messagesDiv.innerHTML += `
    <div class="flex justify-end">
      <div class="bg-blue-600 text-white rounded-lg p-3 max-w-xs">
        ${question}
      </div>
    </div>
  `;
  
  form.reset();
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  
  try {
    const response = await apiCall('/assistant/ask', {
      method: 'POST',
      body: JSON.stringify({ question })
    });
    
    // Add assistant response
    messagesDiv.innerHTML += `
      <div class="bg-gray-100 rounded-lg p-3">
        <p class="text-sm text-gray-900">${response.answer}</p>
        ${response.template_links.length > 0 ? `
          <div class="mt-2 space-y-1">
            ${response.template_links.map(link => `
              <button onclick="navigate('templates')" class="text-xs text-blue-600 hover:text-blue-800 block">
                <i class="fas fa-file-alt mr-1"></i>${link.name}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
    
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  } catch (error) {
    showToast(error.message, 'error');
  }
}

// ========== NUMBER COUNTER ANIMATION ==========
function animateCounter(element, target, duration = 1000, isPercentage = false) {
  const start = 0;
  const increment = target / (duration / 16); // 60fps
  let current = 0;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = isPercentage ? Math.round(current) + '%' : Math.round(current);
  }, 16);
}

function animateAllCounters() {
  // Animate all elements with data-counter attribute
  document.querySelectorAll('[data-counter]').forEach(el => {
    const target = parseInt(el.getAttribute('data-counter'));
    const isPercentage = el.getAttribute('data-percentage') === 'true';
    animateCounter(el, target, 1200, isPercentage);
  });
}

// ========== CHART INITIALIZATION ==========
async function initAnalyticsCharts() {
  const [overview, projectHealth, allProjects, allTasks] = await Promise.all([
    apiCall('/analytics/overview'),
    apiCall('/analytics/project-health'),
    apiCall('/projects'),
    apiCall('/tasks')
  ]);
  
  // Status distribution
  const statusCounts = {};
  allProjects.projects.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  });
  
  // Task priority distribution
  const priorityCounts = { urgent: 0, high: 0, medium: 0, low: 0 };
  allTasks.tasks.forEach(t => {
    if (t.priority && priorityCounts.hasOwnProperty(t.priority)) {
      priorityCounts[t.priority]++;
    }
  });
  
  // Health distribution
  const healthCounts = { good: 0, moderate: 0, poor: 0 };
  projectHealth.project_health.forEach(project => {
    const health = project.overdue_tasks === 0 && project.open_risks === 0 ? 'good' :
                  project.overdue_tasks < 3 && project.open_risks < 2 ? 'moderate' : 'poor';
    healthCounts[health]++;
  });
  
  // Status Donut Chart
  const statusCtx = document.getElementById('statusChart');
  if (statusCtx) {
    new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['Active', 'Completed', 'On Hold', 'Cancelled'],
        datasets: [{
          data: [
            statusCounts.active || 0,
            statusCounts.completed || 0,
            statusCounts.on_hold || 0,
            statusCounts.cancelled || 0
          ],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: { size: 12 }
            }
          }
        }
      }
    });
  }
  
  // Priority Bar Chart
  const priorityCtx = document.getElementById('priorityChart');
  if (priorityCtx) {
    new Chart(priorityCtx, {
      type: 'bar',
      data: {
        labels: ['Urgent', 'High', 'Medium', 'Low'],
        datasets: [{
          label: 'Tasks',
          data: [
            priorityCounts.urgent,
            priorityCounts.high,
            priorityCounts.medium,
            priorityCounts.low
          ],
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(234, 179, 8, 0.8)',
            'rgba(156, 163, 175, 0.8)'
          ],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 5 }
          }
        }
      }
    });
  }
  
  // Health Horizontal Bar Chart
  const healthCtx = document.getElementById('healthChart');
  if (healthCtx) {
    new Chart(healthCtx, {
      type: 'bar',
      data: {
        labels: ['Excellent Health', 'Moderate Health', 'Needs Attention'],
        datasets: [{
          label: 'Projects',
          data: [healthCounts.good, healthCounts.moderate, healthCounts.poor],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(234, 179, 8, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 2 }
          }
        }
      }
    });
  }
}

// ========== MAIN APP ==========
async function renderApp() {
  let content = '';
  
  switch (currentView) {
    case 'dashboard':
      content = await renderDashboard();
      break;
    case 'projects':
      content = await renderProjects();
      break;
    case 'approvals':
      content = await renderApprovals();
      break;
    case 'templates':
      content = await renderTemplates();
      break;
    case 'analytics':
      content = await renderAnalytics();
      break;
    case 'reports':
      content = await renderReports();
      break;
  }
  
  document.getElementById('app').innerHTML = `
    ${renderNavigation()}
    <div class="max-w-7xl mx-auto px-4 py-8" id="app-content">
      ${content}
    </div>
  `;
  
  // Initialize charts and counter animations if on analytics page
  if (currentView === 'analytics') {
    setTimeout(() => {
      initAnalyticsCharts();
      animateAllCounters();
    }, 100);
  }
}

// Initialize app
async function init() {
  try {
    const data = await apiCall('/auth/me');
    currentUser = data.user;
    await renderApp();
  } catch (error) {
    document.getElementById('app').innerHTML = `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
          <h1 class="text-2xl font-bold text-gray-900 mb-2">Error Loading Application</h1>
          <p class="text-gray-600">${error.message}</p>
        </div>
      </div>
    `;
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
