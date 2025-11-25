

    document.addEventListener('DOMContentLoaded', function() {
        // Try to get from localStorage
        let startDate = localStorage.getItem('reportsStartDate');
        let endDate = localStorage.getItem('reportsEndDate');

        if (!startDate || !endDate) {
            // If not set, use last 30 days
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 30);
            startDate = start.toISOString().split('T')[0];
            endDate = end.toISOString().split('T')[0];
        }

        document.getElementById('startDate').value = startDate;
        document.getElementById('endDate').value = endDate;

        loadReports();
    });

    // Save date range to localStorage on filter submit
    document.getElementById('dateRangeForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        localStorage.setItem('reportsStartDate', startDate);
        localStorage.setItem('reportsEndDate', endDate);
        loadReports();
    });

    // Reload team reports when period changes
    document.getElementById('teamPeriod').addEventListener('change', function() {
        loadReports();
    });

    // Function to load all reports
    function loadReports() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        // Load project reports
        fetch(`/api/reports/projects/?start_date=${startDate}&end_date=${endDate}`)
            .then(response => response.json())
            .then(data => {
                updateProjectOverview(data);
                updateProjectProgressChart(data);
            });

        // Load task reports
        fetch(`/api/reports/tasks/?start_date=${startDate}&end_date=${endDate}`)
            .then(response => response.json())
            .then(data => {
                updateTaskStatusChart(data);
                updateTaskPriorityChart(data);
                updateOverdueTasks(data);
            });

        // Load team performance
        const period = document.getElementById('teamPeriod').value;
        fetch(`/api/reports/team/?start_date=${startDate}&end_date=${endDate}&period=${period}`)
            .then(response => response.json())
            .then(data => {
                updateTeamPerformanceChart(data);
                updateTeamScatterChart(data);
                updateUtilizationChart(data);
                updateUtilizationTable(data);
                updateManagerPerformanceLine(data);
            });

        // Load burndown
        fetch(`/api/reports/burndown/?start_date=${startDate}&end_date=${endDate}`)
            .then(response => response.json())
            .then(data => {
                updateBurndownChart(data);
                updateBurndownTable(data);
            });

       
    }

    // Function to export reports
    function exportReport(type, format) {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        window.location.href = `/api/reports/export/${type}/${format}/?start_date=${startDate}&end_date=${endDate}`;
    }

    // Chart update functions
    function updateProjectProgressChart(data) {
        const ctx = document.getElementById('projectProgressChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.projects.map(p => p.name),
                datasets: [{
                    label: 'Progress %',
                    data: data.projects.map(p => p.progress),
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

  function updateTaskStatusChart(data) {
    const ctx = document.getElementById('taskStatusChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['To Do', 'In Progress', 'Review', 'Done'],
            datasets: [{
                data: [
                    data.status_counts.todo,
                    data.status_counts.in_progress,
                    data.status_counts.review,
                    data.status_counts.done
                ],
                backgroundColor: [
                    '#42a5f5', // blue
                    '#ffb300', // amber
                    '#66bb6a', // green
                    '#9e9e9e'  // gray
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
       options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom' }
    }
}

    });
}


   function updateTaskPriorityChart(data) {
    const ctx = document.getElementById('taskPriorityChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: [ 'High', 'Medium', 'Low'],
            datasets: [{
                data: [
                    // data.priority_counts.urgent,
                    data.priority_counts.high,
                    data.priority_counts.medium,
                    data.priority_counts.low
                ],
                backgroundColor: [
                    // '#b71c1c', // dark red
                    '#f44336', // red
                    '#ff9800', // orange
                    '#4caf50'  // green
                ],
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
       options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'bottom' }
    }
}

    });
}


    function updateTeamPerformanceChart(data) {
        const ctx = document.getElementById('teamPerformanceChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.members.map(m => m.name),
                datasets: [{
                    label: 'Completed',
                    data: data.members.map(m => m.completed),
                    backgroundColor: 'rgba(76, 175, 80, 0.5)'
                }, {
                    label: 'Pending',
                    data: data.members.map(m => m.pending),
                    backgroundColor: 'rgba(255, 152, 0, 0.5)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true
                    }
                }
            }
        });
    }

    function updateTeamScatterChart(data) {
        const ctx = document.getElementById('teamScatterChart').getContext('2d');
        const datasets = data.scatter.map(s => ({
            label: s.member,
            data: s.points.map(p => ({x: p.total_tasks, y: p.bucket_index, r: Math.max(3, Math.min(12, Math.round(p.completion_rate)))/2})),
            backgroundColor: s.color,
        }));
        new Chart(ctx, {
            type: 'bubble',
            data: { datasets },
            options: {
                responsive: true,
                scales: {
                    x: { title: { display: true, text: 'Total Tasks' }, beginAtZero: true },
                    y: { title: { display: true, text: data.bucket_label }, ticks: { stepSize: 1 } }
                },
                plugins: { legend: { display: true } }
            }
        });
    }





   

    function updateBurndownChart(data) {
        const ctx = document.getElementById('burndownChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.series.map(p => p.date),
                datasets: [{
                    label: 'Remaining Tasks',
                    data: data.series.map(p => p.remaining),
                    borderColor: 'rgba(33, 150, 243, 1)',
                    tension: 0.2,
                    fill: false
                },{
                    label: 'Completed (cumulative)',
                    data: data.series.map(p => p.completed),
                    borderColor: 'rgba(76, 175, 80, 1)',
                    tension: 0.2,
                    fill: false
                }]
            }
        });
    }

    // Table update functions
    function updateProjectOverview(data) {
        const tbody = document.querySelector('#projectOverviewTable tbody');
        const projects = data.projects || [];
        
        if (projects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No projects found</td></tr>';
            return;
        }
        
        // Show all projects - scrolling will be handled by CSS max-height
        tbody.innerHTML = projects.map(p => {
            // Get status badge color
            let statusClass = 'badge bg-secondary';
            if (p.status === 'Completed' || p.status === 'Done') {
                statusClass = 'badge bg-success';
            } else if (p.status === 'In Progress') {
                statusClass = 'badge bg-primary';
            } else if (p.status === 'On Hold') {
                statusClass = 'badge bg-warning text-dark';
            } else if (p.status === 'Cancelled') {
                statusClass = 'badge bg-danger';
            }
            
            // Get progress bar color
            let progressClass = 'bg-success';
            if (p.progress < 30) {
                progressClass = 'bg-danger';
            } else if (p.progress < 70) {
                progressClass = 'bg-warning';
            }
            
            return `
                <tr>
                    <td><strong>${p.name || 'N/A'}</strong></td>
                    <td><span class="${statusClass}">${p.status || 'N/A'}</span></td>
                    <td>${p.start_date || 'N/A'}</td>
                    <td>${p.end_date || 'N/A'}</td>
                    <td>
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar ${progressClass}" role="progressbar" 
                                 style="width: ${p.progress || 0}%" 
                                 aria-valuenow="${p.progress || 0}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                                ${p.progress || 0}%
                            </div>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function updateOverdueTasks(data) {
        const tbody = document.querySelector('#overdueTasksTable tbody');
        tbody.innerHTML = data.overdue_tasks.map(t => `
            <tr>
                <td>${t.title}</td>
                <td>${t.due_date}</td>
                <td>${t.status}</td>
            </tr>
        `).join('');
    }

let burndownDataSeries = [];

function updateBurndownTable(data) {
    burndownDataSeries = data.series || [];

    flatpickr("#burndownCalendar", {
        inline: true,
        dateFormat: "Y-m-d",
        onDayCreate: function(_, __, ___, dayElem) {
            const year = dayElem.dateObj.getFullYear();
            const month = String(dayElem.dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dayElem.dateObj.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const today = new Date();
            const dateObj = new Date(dateStr);
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(today.getDate() - 30);

            // Default: no background for out-of-range or future
            dayElem.style.background = "";
            dayElem.style.opacity = "0.5"; // light gray for out-of-range

            // Apply colors only if within the past 30 days
            if (dateObj >= oneMonthAgo && dateObj <= today) {
                const match = burndownDataSeries.find(d => d.date === dateStr);
                const hasTasks = match && Number(match.remaining) > 0;

                if (hasTasks) {
                    dayElem.style.background = "#ffcdd2"; // 🔴 has tasks
                    dayElem.style.opacity = "1";
                } else {
                    dayElem.style.background = "#c8e6c9"; // 🟢 no tasks
                    dayElem.style.opacity = "1";
                }
            }

            dayElem.style.borderRadius = "6px";
        },
        onChange: function(selectedDates, dateStr) {
            const summary = document.getElementById("burndownDaySummary");
            const match = burndownDataSeries.find(d => d.date === dateStr);
            const selectedDate = new Date(dateStr);
            const today = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setDate(today.getDate() - 30);

            // If outside of range
            if (selectedDate > today) {
                summary.innerHTML = `<strong>${dateStr}</strong><br><span class="text-muted">Future date — no data yet.</span>`;
                return;
            }
            if (selectedDate < oneMonthAgo) {
                summary.innerHTML = `<strong>${dateStr}</strong><br><span class="text-muted">Older than 30 days — data not shown.</span>`;
                return;
            }

            // Normal data display
            if (match) {
                summary.innerHTML = `
                    <strong>${dateStr}</strong><br>
                    Remaining: ${match.remaining}<br>
                    Completed: ${match.completed}
                `;
            } else {
                summary.innerHTML = `
                    <strong>${dateStr}</strong><br>
                    <span class="text-success">No tasks found.</span>
                `;
            }
        }
    });
}
