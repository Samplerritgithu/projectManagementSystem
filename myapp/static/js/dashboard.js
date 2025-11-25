
    let taskStatusChart, projectProgressChart;

    function updateDashboard() {
    // Show loading indicators
    document.getElementById('recent-tasks').innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;
    document.getElementById('active-projects-list').innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    // Fetch dashboard data
    fetch(DASHBOARD_DATA_URL, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        // Update statistics with empty-state notes
        const totalTasks = data.total_tasks || 0;
        const completedTasks = data.completed_tasks || 0;
        const overdueTasks = data.overdue_tasks || 0;
        const activeProjects = data.active_projects || 0;

        document.getElementById('total-tasks').textContent = totalTasks;
        document.getElementById('completed-tasks').textContent = completedTasks;
        document.getElementById('overdue-tasks').textContent = overdueTasks;
        document.getElementById('active-projects').textContent = activeProjects;

        document.getElementById('total-tasks-note').textContent = totalTasks === 0 ? '' : '';
        document.getElementById('completed-tasks-note').textContent = completedTasks === 0 ? '' : '';
        document.getElementById('overdue-tasks-note').textContent = overdueTasks === 0 ? '' : '';
        document.getElementById('active-projects-note').textContent = activeProjects === 0 ? '' : '';
        // Enable/disable "View All" button
      // Show/hide "View All Tasks" button
        const viewAllBtn = document.getElementById('viewAllTasksBtn');
        viewAllBtn.style.display = totalTasks > 0 ? 'inline-block' : 'none';

        // Show/hide "View All Projects" button
        const viewAllProjectsBtn = document.getElementById('ViewAllProjectsBtn');
        viewAllProjectsBtn.style.display = activeProjects > 0 ? 'inline-block' : 'none';


        // Update recent tasks
        const recentTasksContainer = document.getElementById('recent-tasks');
        if (data.recent_tasks && data.recent_tasks.length > 0) {
            recentTasksContainer.innerHTML = data.recent_tasks.map(task => `
                <div class="list-group-item task-item">
                    <div class="flex-grow-1">
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">
                            <span class="chip chip-date"><i class="bi bi-calendar-event"></i> ${task.due_date}</span>
                            <span class="chip"><i class="bi bi-flag"></i> ${task.status}</span>
                        </div>
                    </div>
                    <span class="badge bg-${getStatusColor(task.status)}">${task.status}</span>
                </div>
            `).join('');
        } else {
            recentTasksContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-inbox text-muted" style="font-size: 2rem;"></i>
                    <p class="mt-3 mb-0 text-muted">No recent tasks</p>
                </div>
            `;
        }

        // Update active projects
        const projectsContainer = document.getElementById('active-projects-list');
        if (data.active_projects_list && data.active_projects_list.length > 0) {
            projectsContainer.innerHTML = data.active_projects_list.map(project => `
                <div class="list-group-item project-item">
                    <div class="flex-grow-1">
                        <div class="project-title">${project.name}</div>
                        <div class="project-meta">
                            <span class="chip"><i class="bi bi-hash"></i> ${project.project_id || 'N/A'}</span>
                            <span class="chip chip-progress"><i class="bi bi-bar-chart"></i> ${project.progress}%</span>
                        </div>
                        <div class="progress progress-thin mt-2">
                            <div class="progress-bar" role="progressbar" style="width: ${project.progress}%"></div>
                        </div>
                    </div>
                    <span class="badge bg-${getProjectStatusColor(project.status)}">${project.status}</span>
                </div>
            `).join('');
        } else {
            projectsContainer.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-folder text-muted" style="font-size: 2rem;"></i>
                    <p class="mt-3 mb-0 text-muted">No active projects</p>
                </div>
            `;
        }

        // Update charts and toggle empty-state visibility
        const hasTaskDist = (data.task_status_data || []).some(v => v > 0);

        const taskStatusCanvas = document.getElementById('taskStatusChart');
        const taskStatusEmpty = document.getElementById('taskStatusEmpty');
        taskStatusCanvas.style.display = hasTaskDist ? 'block' : 'none';
        taskStatusEmpty.style.display = hasTaskDist ? 'none' : 'block';

        const projectProgressCanvas = document.getElementById('projectProgressChart');
        const projectProgressEmpty = document.getElementById('projectProgressEmpty');

        if (data.active_projects_list && data.active_projects_list.length > 0) {
            // Show chart even if all progress values are 0
            projectProgressCanvas.style.display = 'block';
            projectProgressEmpty.style.display = 'none';
        } else {
            projectProgressCanvas.style.display = 'none';
            projectProgressEmpty.style.display = 'block';
        }



        updateCharts(data);
    })
    .catch(error => {
        console.error('Error fetching dashboard data:', error);
        document.getElementById('recent-tasks').innerHTML = `
            <div class="text-center py-5 text-danger">
                <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                <p class="mt-3 mb-0">Error loading data</p>
            </div>
        `;
        document.getElementById('active-projects-list').innerHTML = `
            <div class="text-center py-5 text-danger">
                <i class="bi bi-exclamation-triangle" style="font-size: 2rem;"></i>
                <p class="mt-3 mb-0">Error loading data</p>
            </div>
        `;
    });
}


    function updateCharts(data) {
        // Update task status chart
        if (taskStatusChart) {
            taskStatusChart.destroy();
        }
        const taskStatusCtx = document.getElementById('taskStatusChart').getContext('2d');
        taskStatusChart = new Chart(taskStatusCtx, {
            type: 'pie',
            data: {
                labels: data.task_status_labels || [],
                datasets: [{
                    data: data.task_status_data || [],
                    backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6', '#807B84E0', '#ef4444'],
                    borderWidth: 2,
                    borderColor: '#ffffff22'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            boxWidth: 12,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 12 }
                        }
                    }
                }
            }
        });

        // Update project progress chart
        if (projectProgressChart) {
            projectProgressChart.destroy();
        }
        const projectProgressCtx = document.getElementById('projectProgressChart').getContext('2d');
        projectProgressChart = new Chart(projectProgressCtx, {
    type: 'bar',
    data: {
        labels: data.project_names || [],
        datasets: [{
            label: 'Progress',
            data: data.project_progress || [],
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderRadius: 0,
            borderSkipped: false,
            maxBarThickness: 28
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,  // helps better fit on small screens
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    stepSize: 10,            // Force 0%,10%,20%,...
                    autoSkip: false,          // Don’t skip labels
                    callback: function(value) {
                        return value + '%';
                    }
                },
                grid: { color: 'rgba(0,0,0,0.06)' }
            },
            x: {
                grid: { display: false },
                ticks: {
                    autoSkip: false,         // Show all project names even if crowded
                    maxRotation: 45,         // Slightly rotate labels for readability
                    minRotation: 30
                }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => ` ${ctx.parsed.y}%`
                }
            }
        }
    }
});

      
    }

    function getStatusColor(status) {
        const colors = {
            'Completed': 'success',
            'In Progress': 'warning',
            'To Do': 'info',
            'Review': 'primary',
            'Overdue': 'danger'
        };
        return colors[status] || 'secondary';
    }

    function getProjectStatusColor(status) {
        const colors = {
            'Planning': 'info',
            'In Progress': 'warning',
            'On Hold': 'secondary',
            'Completed': 'success',
            'Cancelled': 'danger'
        };
        return colors[status] || 'secondary';
    }



    function refreshDashboard() {
        updateDashboard();
    }

    // Redirect functions for clickable cards
    // function redirectToTasks() {
    //     window.location.href = "{% url 'tasks' %}";
    // }

    // function redirectToProjects() {
    //     window.location.href = "{% url 'projects' %}";
    // }

    // Initial load
    document.addEventListener('DOMContentLoaded', function() {
        updateDashboard();

        // Click handlers for stat cards → navigate with filters
        const totalCard = document.getElementById('total-tasks-card');
        if (totalCard && typeof TASKS_URL !== 'undefined') {
            totalCard.addEventListener('click', function() {
                window.location.href = TASKS_URL; // all tasks
            });
        }

        const completedCard = document.getElementById('completed-tasks-card');
        if (completedCard && typeof TASKS_URL !== 'undefined') {
            completedCard.addEventListener('click', function() {
                const url = new URL(TASKS_URL, window.location.origin);
                url.searchParams.set('status', 'Done');
                // Also sort by updated/ due_date for consistency
                url.searchParams.set('sort', 'due_date');
                window.location.href = url.toString();
            });
        }

        const overdueCard = document.getElementById('overdue-tasks-card');
        if (overdueCard && typeof TASKS_URL !== 'undefined') {
            overdueCard.addEventListener('click', function() {
                const url = new URL(TASKS_URL, window.location.origin);
                url.searchParams.set('overdue', '1');
                url.searchParams.set('sort', 'due_date');
                window.location.href = url.toString();
            });
        }

        const activeProjectsStat = document.getElementById('active-projects-stat-card');
        if (activeProjectsStat && typeof PROJECTS_URL !== 'undefined') {
            activeProjectsStat.addEventListener('click', function() {
                window.location.href = PROJECTS_URL;
            });
        }

        const activeProjectsListCard = document.getElementById('active-projects-card');
        if (activeProjectsListCard && typeof PROJECTS_URL !== 'undefined') {
            activeProjectsListCard.addEventListener('click', function(e) {
                // avoid triggering when clicking the internal View All button
                const isButton = e.target.closest && e.target.closest('#ViewAllProjectsBtn');
                if (isButton) return;
                window.location.href = PROJECTS_URL;
            });
        }
    });

    // Refresh every 5 minutes
    setInterval(updateDashboard, 300000);

    function updateChartsTheme() {
        const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDarkMode ? '#ffffff' : '#2c3e50';
        
        // Update Task Status Chart
        if (taskStatusChart) {
            taskStatusChart.options.plugins.legend.labels.color = textColor;
            taskStatusChart.update();
        }

        // Update Project Progress Chart
        if (projectProgressChart) {
            projectProgressChart.options.scales.y.ticks.color = textColor;
            projectProgressChart.options.scales.x.ticks.color = textColor;
            projectProgressChart.update();
        }
    }

    // Add theme change listener
    document.addEventListener('DOMContentLoaded', function() {
        // Initial theme setup for charts
        updateChartsTheme();

        // Listen for theme changes
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'data-theme') {
                    updateChartsTheme();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    });
