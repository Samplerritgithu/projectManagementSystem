

// Current user context for client-side permissions
const CURRENT_USER_ID = window.CURRENT_USER_ID || 0;
const CURRENT_USER_ROLE = window.CURRENT_USER_ROLE || "User";
let selectedProject = 'all', selectedMembers = [], submittedStatuses = [];
let lastAppliedFilters = null; // stores last Filter button criteria

const userRole = window.CURRENT_USER_ROLE || "User";
document.addEventListener("DOMContentLoaded", function () {
    if (userRole === "Manager") {
        const table = document.getElementById("submittedStatusTable");
        if (!table) return;

        // Hide Action header
        const actionHeader = table.querySelector("thead th:last-child");
        if (actionHeader && actionHeader.textContent.trim() === "Action") {
            actionHeader.style.display = "none";
        }

        // Hide all Action cells (if any rows are already loaded)
        table.querySelectorAll("tbody td:last-child").forEach(td => {
            td.style.display = "none";
        });

        // Also ensure it stays hidden whenever new data is added dynamically
        const observer = new MutationObserver(() => {
            table.querySelectorAll("tbody td:last-child").forEach(td => {
                td.style.display = "none";
            });
        });

        observer.observe(table.querySelector("tbody"), { childList: true });
    }
});


document.addEventListener('DOMContentLoaded', () => {
    populateProjectDropdown();
    loadSubmittedStatusesFromServer();
    updateSubmittedStatusTable([]);

    // Initialize: Hide all validation feedback messages
    ['projectInvalidFeedback', 'memberInvalidFeedback', 'periodInvalidFeedback', 'startDateInvalidFeedback', 'endDateInvalidFeedback'].forEach(id => {
        const feedback = document.getElementById(id);
        if (feedback) {
            feedback.style.display = 'none';
        }
    });

    // Real-time-ish refresh: poll latest data and re-apply last filters (if any)
    try {
        setInterval(() => {
            loadSubmittedStatusesFromServer(true);
        }, 10000); // 10s
    } catch (e) { }

});

// Tooltip init
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
tooltipTriggerList.map(function (tooltipTriggerEl) { return new bootstrap.Tooltip(tooltipTriggerEl); });

let editModal = new bootstrap.Modal(document.getElementById('editDailyStatusModal'));

function renderMemberMenuOptions(options) {
    const menu = document.getElementById('memberDropdownMenu');
    if (!menu) return;
    menu.innerHTML = '';

    const makeItem = (id, name, checked) => {
        const li = document.createElement('li');
        li.innerHTML = `
      <label class="dropdown-item d-flex align-items-center gap-2">
        <input type="checkbox" class="form-check-input m-0" data-id="${id}" ${checked ? 'checked' : ''}>
        <span>${name}</span>
      </label>`;
        return li;
    };

    const allChecked = selectedMembers.includes('all');
    menu.appendChild(makeItem('all', 'All Members', allChecked));

    options.forEach(opt => {
        const isChecked = allChecked || selectedMembers.includes(String(opt.id));
        menu.appendChild(makeItem(String(opt.id), opt.name, isChecked));
    });

    // Add change listeners
    menu.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function () {
            const val = this.getAttribute('data-id');
            const allBox = menu.querySelector('input[data-id="all"]');

            if (val === 'all') {
                if (this.checked) {
                    // ✅ Check everything
                    selectedMembers = ['all', ...options.map(o => String(o.id))];
                    menu.querySelectorAll('input[type="checkbox"]').forEach(other => {
                        other.checked = true;
                    });
                } else {
                    // ❌ Uncheck everything
                    selectedMembers = [];
                    menu.querySelectorAll('input[type="checkbox"]').forEach(other => {
                        other.checked = false;
                    });
                }
            } else {
                // Toggle individual member
                if (this.checked) {
                    if (!selectedMembers.includes(val)) selectedMembers.push(val);
                } else {
                    selectedMembers = selectedMembers.filter(v => v !== val);
                }

                // Handle All Members state
                const allIndividualsChecked = options.every(opt =>
                    menu.querySelector(`input[data-id="${opt.id}"]`).checked
                );

                if (allIndividualsChecked) {
                    // ✅ If all are selected, mark All Members
                    allBox.checked = true;
                    selectedMembers = ['all', ...options.map(o => String(o.id))];
                } else {
                    // ❌ If any unchecked, uncheck All Members
                    allBox.checked = false;
                    selectedMembers = selectedMembers.filter(v => v !== 'all');
                }
            }

            updateMemberChips();
        });
    });
}


function updateMemberChips() {
    const chipsWrap = document.getElementById('memberChips');
    const placeholder = document.getElementById('memberPlaceholder');
    const btn = document.getElementById('memberDropdownBtn');
    if (!chipsWrap || !btn) return;

    chipsWrap.innerHTML = '';
    const noneSelected = !selectedMembers || selectedMembers.length === 0;
    if (placeholder) placeholder.style.display = noneSelected ? '' : 'none';

    const makeChip = (id, label) => {
        const span = document.createElement('span');
        span.className = 'badge bg-secondary d-inline-flex align-items-center gap-1';
        span.innerHTML = `<span>${label}</span><button type="button" class="btn-close btn-close-white btn-sm" aria-label="Remove" data-id="${id}"></button>`;
        return span;
    };

    if (selectedMembers.includes('all')) {
        chipsWrap.appendChild(makeChip('all', 'All Members'));
    } else {
        const items = Array.from(document.querySelectorAll('#memberDropdownMenu input[type="checkbox"]'))
            .map(cb => ({ id: cb.getAttribute('data-id'), name: cb.closest('label').querySelector('span').textContent }));
        selectedMembers.forEach(id => {
            const item = items.find(i => String(i.id) === String(id));
            if (item) chipsWrap.appendChild(makeChip(item.id, item.name));
        });
    }

    chipsWrap.querySelectorAll('button[data-id]').forEach(btnX => {
        btnX.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // 👇 Forcefully close + prevent reopening
            const dropdownToggle = document.getElementById('memberDropdownBtn');
            const dropdownMenu = document.getElementById('memberDropdownMenu');

            // Close any open dropdown manually (Bootstrap 5 API)
            const bsDropdown = bootstrap.Dropdown.getInstance(dropdownToggle);
            if (bsDropdown) bsDropdown.hide();

            // Remove focus so Bootstrap doesn’t reopen it
            dropdownToggle.blur();

            // ---- Handle deselection ----
            const id = this.getAttribute('data-id');
            if (id === 'all') {
                selectedMembers = [];
            } else {
                selectedMembers = selectedMembers.filter(v => String(v) !== String(id));
            }

            // Uncheck corresponding checkboxes
            if (dropdownMenu) {
                const targetCb = dropdownMenu.querySelector(`input[data-id="${id}"]`);
                if (targetCb) targetCb.checked = false;
                if (id !== 'all') {
                    const allCb = dropdownMenu.querySelector('input[data-id="all"]');
                    if (allCb) allCb.checked = false;
                }
            }

            updateMemberChips();
        });
    });



    // Don't show validation here - only clear it when user selects
    btn.classList.remove('is-invalid', 'is-valid');
    const memberFeedback = document.getElementById('memberInvalidFeedback');
    if (!noneSelected && memberFeedback) {
        // Hide feedback if members are selected
        memberFeedback.style.display = 'none';
        memberFeedback.classList.remove('d-block');
    }
}

function populateProjectDropdown() {
    fetch('/api/daily-status/projects/')
        .then(res => res.json())
        .then(data => {
            const projectSelect = document.getElementById('filterProject');

            // Default option + "All Projects"
            projectSelect.innerHTML = `
        <option value="" selected disabled>Select a project</option>
        <option value="all">All Projects</option>
        ${data.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
      `;
        });
}

// Open Edit Modal
function openEditModal(id, project_id, status) {
    if (!id) return alert("Error: Status ID missing!");

    document.getElementById('editStatusId').value = id;
    document.getElementById('editDailyStatusText').value = status || '';

    fetch('/api/daily-status/projects/')
        .then(res => res.json())
        .then(data => {
            const projectSelect = document.getElementById('editDailyStatusProject');
            projectSelect.innerHTML = data.projects.map(p =>
                `<option value="${p.id}" ${p.id == project_id ? 'selected' : ''}>${p.name}</option>`
            ).join('');
            // snapshot original values for change detection
            try {
                window.__origEditDailyStatus = {
                    id: String(id),
                    project_id: String(project_id || ''),
                    status_text: (status || '').trim()
                };
            } catch (e) { window.__origEditDailyStatus = null; }

            // reset validation states
            projectSelect.classList.remove('is-invalid', 'is-valid');
            const txt = document.getElementById('editDailyStatusText');
            txt.classList.remove('is-invalid', 'is-valid');
            editModal.show();
        });
}

// Handle Edit Form Submit
document.getElementById('editDailyStatusModalForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const status_id = document.getElementById('editStatusId').value;
    const projectSelect = document.getElementById('editDailyStatusProject');
    const textArea = document.getElementById('editDailyStatusText');
    const projectId = projectSelect.value;
    const statusText = (textArea.value || '').trim();

    if (!status_id) {
        toastr.error('Missing status id. Please refresh and try again.', 'Error');
        return;
    }

    // Inline validations
    let valid = true;
    projectSelect.classList.remove('is-invalid', 'is-valid');
    textArea.classList.remove('is-invalid', 'is-valid');
    if (!projectId) { projectSelect.classList.add('is-invalid'); valid = false; } else { projectSelect.classList.add('is-valid'); }
    if (!statusText || statusText.length < 10) { textArea.classList.add('is-invalid'); valid = false; } else { textArea.classList.add('is-valid'); }
    if (!valid) return;

    // No-changes detection
    try {
        const orig = window.__origEditDailyStatus || {};
        const noChange = String(orig.project_id || '') === String(projectId || '') && String(orig.status_text || '') === String(statusText || '');
        if (noChange) {
            toastr.info('No changes made.', 'info', { timeOut: 2000, closeButton: true, progressBar: true });
            setTimeout(() => { editModal.hide(); }, 2100);
            return;
        }
    } catch (e) { }

    fetch(`/api/daily-status/statuses/${encodeURIComponent(status_id)}/`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ project_id: projectId, status_text: statusText })
    })
        .then(async res => {
            const text = await res.text();
            try { return JSON.parse(text); } catch (e) {
                console.error('Non-JSON response:', text);
                throw new Error('Server returned invalid response');
            }
        })
        .then(data => {
            if (data.success) {
                editModal.hide();
                loadSubmittedStatusesFromServer();
                toastr.success('Daily status updated successfully!', 'Success', { timeOut: 3000, closeButton: true, progressBar: true });
            } else {
                toastr.error(data.error || 'Failed to update status', 'Error', { timeOut: 4000, closeButton: true, progressBar: true });
            }
        })
        .catch(err => {
            toastr.error('Something went wrong. Try again.', 'Error');
        });
});

// Live validation for edit modal fields
(function () {
    const projectSelectEl = document.getElementById('editDailyStatusProject');
    const textAreaEl = document.getElementById('editDailyStatusText');
    if (projectSelectEl) {
        projectSelectEl.addEventListener('change', function () {
            if (this.value) { this.classList.add('is-valid'); this.classList.remove('is-invalid'); }
            else { this.classList.add('is-invalid'); this.classList.remove('is-valid'); }
        });
    }
    if (textAreaEl) {
        textAreaEl.addEventListener('input', function () {
            const v = (this.value || '').trim();
            if (!v || v.length < 10) { this.classList.add('is-invalid'); this.classList.remove('is-valid'); }
            else { this.classList.add('is-valid'); this.classList.remove('is-invalid'); }
        });
        textAreaEl.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('editDailyStatusModalForm').requestSubmit(); }
        });
    }
    const modalEl = document.getElementById('editDailyStatusModal');
    if (modalEl) {
        modalEl.addEventListener('hidden.bs.modal', function () {
            if (projectSelectEl) projectSelectEl.classList.remove('is-invalid', 'is-valid');
            if (textAreaEl) textAreaEl.classList.remove('is-invalid', 'is-valid');
            try { window.__origEditDailyStatus = null; } catch (e) { }
        });
    }
})();

// Load statuses
function loadSubmittedStatusesFromServer(isBackgroundRefresh) {
    fetch('/api/daily-status/statuses/')
        .then(async res => {
            const text = await res.text();
            try { return JSON.parse(text); } catch (e) {
                console.error('Non-JSON response:', text);
                return { statuses: [] };
            }
        })
        .then(data => {
            submittedStatuses = data.statuses;
            if (!isBackgroundRefresh) {
                // Rebuild member options only on full loads to avoid flicker while open
                populateMemberDropdownFromStatuses();
            }
            if (lastAppliedFilters) {
                // Reapply last filters if user used Filter before
                const { project, members, start, end } = lastAppliedFilters;
                const prevProject = selectedProject;
                const prevMembers = selectedMembers;
                selectedProject = project;
                selectedMembers = members.slice();
                updateSubmittedStatusTable(getFilteredStatuses(start, end));
                selectedProject = prevProject;
                selectedMembers = prevMembers;
            } else {
                // 👇 Default: show all statuses dynamically
                updateSubmittedStatusTable(submittedStatuses);
            }

        });
}
function updateSubmittedStatusTable(data = submittedStatuses) {
    const tbody = document.querySelector('#submittedStatusTable tbody');
    const heading = document.getElementById('submittedStatusHeading');

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">No records present</td></tr>`;
        heading.innerText = `Submitted Statuses (0)`;
        return;
    }

    heading.innerText = `Submitted Statuses (${data.length})`;

    tbody.innerHTML = data.map(s => {
        const isOwner = String(s.user_id) === String(CURRENT_USER_ID);
        const isManager = CURRENT_USER_ROLE === 'Manager';

        let actionCell = '';

        if (isOwner && !isManager) {
            // ✅ Editable by the same user (not manager)
            actionCell = `
        <button 
          class="btn btn-sm btn-outline-primary edit-status-btn"
          data-id="${s.id}"
          data-project="${s.project_id}"
          data-status="${s.status}"
          data-user="${s.user_id}"
          data-bs-toggle="tooltip"
          title="Edit Status"
        >
          <i class="bi bi-pencil-fill"></i>
        </button>
      `;
        }
        else if (!isOwner && !isManager) {
            // 🚫 Other developers see this
            actionCell = `<span class="text-danger fw-semibold">You can't edit</span>`;
        }
        else if (isManager) {
            // 👀 Manager - hide Action column entirely
            actionCell = '';
        }

        return `
      <tr>
        <td>${s.project_name}</td>
        <td>${s.user_name}</td>
        <td>${s.date}</td>
        <td>${s.status}</td>
        <td class="text-center">${actionCell}</td>
      </tr>
    `;
    }).join('');

    // Attach event listener only for edit buttons
    tbody.querySelectorAll('.edit-status-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const ownerId = btn.dataset.user;
            const canManage = (CURRENT_USER_ROLE === 'Manager' || CURRENT_USER_ROLE === 'Team Lead');
            if (String(ownerId) !== String(CURRENT_USER_ID) && !canManage) {
                toastr.error("You can't edit this", 'Error', { timeOut: 2500, closeButton: true, progressBar: true });
                return;
            }
            openEditModal(btn.dataset.id, btn.dataset.project, btn.dataset.status);
        });
    });

    // 🔒 Hide Action header + column if Manager
    if (CURRENT_USER_ROLE === 'Manager') {
        const table = document.getElementById("submittedStatusTable");
        const actionHeader = table.querySelector("thead th:last-child");
        if (actionHeader && actionHeader.textContent.trim() === "Action") {
            actionHeader.style.display = "none";
        }
        table.querySelectorAll("tbody td:last-child").forEach(td => {
            td.style.display = "none";
        });
    }
}



function populateMemberDropdown() {
    // First try to get members from API if a specific project is selected
    if (selectedProject && selectedProject !== 'all') {
        fetch(`/api/daily-status/projects/${encodeURIComponent(selectedProject)}/members/`)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                const opts = (data.members || []).map(m => ({ id: m.id, name: `${m.name} (${m.role || 'Member'})` }));
                if (opts.length === 0) {
                    // Show a message if no members found
                    const menu = document.getElementById('memberDropdownMenu');
                    if (menu) {
                        menu.innerHTML = '<li class="px-3 py-2 text-muted">No members found for this project</li>';
                    }
                } else {
                    renderMemberMenuOptions(opts);
                }
                selectedMembers = [];
                updateMemberChips();
            })
            .catch((error) => {
                console.error('Fallback API call failed:', error);
                // If API fails, fall back to submitted statuses
                populateMemberDropdownFromStatuses();
            });
    } else {
        // For 'all' projects (everyone should be shown, not just those who submitted statuses)
        fetch('/api/daily-status/all-members/')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                const opts = (data.members || []).map(m => ({ id: m.id, name: `${m.name} (${m.role || 'Member'})` }));
                if (opts.length === 0) {
                    const menu = document.getElementById('memberDropdownMenu');
                    if (menu) menu.innerHTML = '<li class="px-3 py-2 text-muted">No members found</li>';
                } else {
                    renderMemberMenuOptions(opts);
                }
                selectedMembers = [];
                updateMemberChips();
            })
            .catch((error) => {
                console.error('Error fetching all members:', error);
                populateMemberDropdownFromStatuses();
            });
    }
}

function populateMemberDropdownFromStatuses() {
    const candidates = submittedStatuses
        .filter(s => selectedProject === 'all' || String(s.project_id) === String(selectedProject))
        .reduce((map, s) => { map.set(String(s.user_id), s.user_name); return map; }, new Map());

    const options = Array.from(candidates.entries()).map(([id, name]) => ({ id, name }));
    renderMemberMenuOptions(options);
    selectedMembers = [];
    updateMemberChips();
}




function getFilteredStatuses(start, end) {
    const startVal = start ? new Date(start) : null;
    const endVal = end ? new Date(end) : null;

    return submittedStatuses.filter(s => {
        const matchProject = !selectedProject || selectedProject === 'all' || String(s.project_id) === String(selectedProject);

        const matchMember =
            selectedMembers.includes('all') ||
            selectedMembers.length === 0 ||
            selectedMembers.includes(String(s.user_id));

        const sDate = new Date(s.date);
        return matchProject && matchMember && (!startVal || sDate >= startVal) && (!endVal || sDate <= endVal);
    });
}


function applyFilters() {
    const start = document.getElementById('staticStartDate').value;
    const end = document.getElementById('staticEndDate').value;
    updateSubmittedStatusTable(getFilteredStatuses(start, end));
}

// CSRF helper
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        document.cookie.split(';').forEach(c => {
            const cookie = c.trim();
            if (cookie.startsWith(name + '=')) cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        });
    }
    return cookieValue;
}

document.getElementById('filterProject').onchange = function () {
    selectedProject = this.value;

    // 🧠 For non-managers (no member dropdown), apply filter immediately without validation UI
    if (CURRENT_USER_ROLE !== "Manager") {
        // selectedProject already set above
        try {
            const filtered = getFilteredStatuses();
            updateSubmittedStatusTable(filtered);
            // Remember selection so periodic refresh preserves filter
            lastAppliedFilters = { project: selectedProject, members: [], start: '', end: '' };
        } catch (e) {
            // no-op; safe fallback
        }
        return;
    }

    // 👇 Manager: old logic stays same
    const menu = document.getElementById('memberDropdownMenu');
    if (menu) menu.innerHTML = '<li class="px-3 py-2 text-muted">Loading members...</li>';
    
    // Clear any existing member selections when project changes
    selectedMembers = [];
    updateMemberChips();

    if (!selectedProject || selectedProject === 'all') {
        // When 'All Projects' is selected, list ALL members irrespective of submissions
        fetch('/api/daily-status/all-members/')
            .then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
            .then(data => {
                const opts = (data.members || []).map(m => ({ id: m.id, name: `${m.name} (${m.role || 'Member'})` }));
                if (opts.length === 0) {
                    const menu = document.getElementById('memberDropdownMenu');
                    if (menu) menu.innerHTML = '<li class="px-3 py-2 text-muted">No members found</li>';
                } else {
                    renderMemberMenuOptions(opts);
                }
                selectedMembers = [];
                updateMemberChips();
            })
            .catch(() => {
                // Fallback to any available statuses if API fails
                populateMemberDropdownFromStatuses();
            });
        return;
    }

    fetch(`/api/daily-status/projects/${encodeURIComponent(selectedProject)}/members/`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            const opts = (data.members || []).map(m => ({ id: m.id, name: `${m.name} (${m.role || 'Member'})` }));
            
            if (opts.length === 0) {
                // Show a message if no members found
                const menu = document.getElementById('memberDropdownMenu');
                if (menu) {
                    menu.innerHTML = '<li class="px-3 py-2 text-muted">No members found for this project</li>';
                }
            } else {
                renderMemberMenuOptions(opts);
            }
            selectedMembers = [];
            updateMemberChips();
        })
        .catch((error) => {
            console.error('Error fetching project members:', error);
            // Show error message in dropdown
            const menu = document.getElementById('memberDropdownMenu');
            if (menu) {
                menu.innerHTML = '<li class="px-3 py-2 text-danger">Error loading members. Please try again.</li>';
            }
            // Fall back to submitted statuses after a delay
            setTimeout(() => {
                populateMemberDropdownFromStatuses();
            }, 2000);
        });
};


document.getElementById('periodSelect').onchange = function () {
    const today = new Date();
    let start = '', end = '';

    if (this.value === 'weekly') {
        const day = today.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diff);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        start = monday.toISOString().slice(0, 10);
        end = sunday.toISOString().slice(0, 10);
    }
    else if (this.value === 'monthly') {
        const first = new Date(today.getFullYear(), today.getMonth(), 1);
        const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        start = first.toISOString().slice(0, 10);
        end = last.toISOString().slice(0, 10);
    }
    else if (this.value === 'yearly' || this.value === 'all') {
        // ✅ All and Yearly both show full-year range
        const first = new Date(today.getFullYear(), 0, 1);
        const last = new Date(today.getFullYear(), 11, 31);
        start = first.toISOString().slice(0, 10);
        end = last.toISOString().slice(0, 10);
    }

    document.getElementById('staticStartDate').value = start;
    document.getElementById('staticEndDate').value = end;
    
    // Auto-validate dates after setting them
    if (start) {
        validateSingleField('staticStartDate', start, 'startDateInvalidFeedback', true);
    }
    if (end) {
        validateSingleField('staticEndDate', end, 'endDateInvalidFeedback', true);
    }
    
    // Also check date range validation
    if (start && end) {
        const startEl = document.getElementById('staticStartDate');
        const endEl = document.getElementById('staticEndDate');
        const startFeedback = document.getElementById('startDateInvalidFeedback');
        const endFeedback = document.getElementById('endDateInvalidFeedback');
        
        if (new Date(start) > new Date(end)) {
            startEl.classList.remove('is-valid');
            startEl.classList.add('is-invalid');
            endEl.classList.remove('is-valid');
            endEl.classList.add('is-invalid');
            if (startFeedback) {
                startFeedback.textContent = 'Start date must be before end date.';
                startFeedback.classList.add('d-block');
                startFeedback.style.display = 'block';
            }
            if (endFeedback) {
                endFeedback.textContent = 'End date must be after start date.';
                endFeedback.classList.add('d-block');
                endFeedback.style.display = 'block';
            }
        } else {
            startEl.classList.remove('is-invalid');
            startEl.classList.add('is-valid');
            endEl.classList.remove('is-invalid');
            endEl.classList.add('is-valid');
            if (startFeedback) {
                startFeedback.classList.remove('d-block');
                startFeedback.style.display = 'none';
            }
            if (endFeedback) {
                endFeedback.classList.remove('d-block');
                endFeedback.style.display = 'none';
            }
        }
    }
};


// Helper function to validate and show feedback for a single field
function validateSingleField(fieldId, value, feedbackId, isRequired = true) {
    const el = document.getElementById(fieldId);
    const feedback = document.getElementById(feedbackId);
    
    if (!el || !feedback) return;
    
    let isValid = true;
    
    if (isRequired && (!value || value === '')) {
        isValid = false;
    }
    
    // Special validation for date range
    if (fieldId === 'staticStartDate' || fieldId === 'staticEndDate') {
        const startEl = document.getElementById('staticStartDate');
        const endEl = document.getElementById('staticEndDate');
        const start = startEl?.value;
        const end = endEl?.value;
        
        if (start && end && new Date(start) > new Date(end)) {
            isValid = false;
        }
    }
    
    if (isValid) {
        el.classList.remove('is-invalid');
        el.classList.add('is-valid');
        feedback.classList.remove('d-block');
        feedback.style.display = 'none';
    } else {
        el.classList.remove('is-valid');
        el.classList.add('is-invalid');
        feedback.classList.add('d-block');
        feedback.style.display = 'block';
    }
}

// Validate on field change - show real-time validation
['filterProject', 'periodSelect', 'staticStartDate', 'staticEndDate'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
        const feedbackId = id === 'filterProject' ? 'projectInvalidFeedback' :
                          id === 'periodSelect' ? 'periodInvalidFeedback' :
                          id === 'staticStartDate' ? 'startDateInvalidFeedback' :
                          'endDateInvalidFeedback';
        validateSingleField(id, el.value, feedbackId, true);
        
        // Also validate the other date if date range validation is needed
        if (id === 'staticStartDate') {
            const endEl = document.getElementById('staticEndDate');
            if (endEl && endEl.value) {
                validateSingleField('staticEndDate', endEl.value, 'endDateInvalidFeedback', true);
            }
        }
        if (id === 'staticEndDate') {
            const startEl = document.getElementById('staticStartDate');
            if (startEl && startEl.value) {
                validateSingleField('staticStartDate', startEl.value, 'startDateInvalidFeedback', true);
            }
        }
    });
});

// Special handling for member dropdown - validate on change
const memberDropdownMenu = document.getElementById('memberDropdownMenu');
if (memberDropdownMenu) {
    memberDropdownMenu.addEventListener('change', () => {
        const memberBtn = document.getElementById('memberDropdownBtn');
        const memberFeedback = document.getElementById('memberInvalidFeedback');
        if (memberBtn && memberFeedback) {
            if (selectedMembers.length > 0) {
                memberBtn.classList.remove('is-invalid');
                memberBtn.classList.add('is-valid');
                memberFeedback.classList.remove('d-block');
                memberFeedback.style.display = 'none';
            } else {
                memberBtn.classList.remove('is-valid');
                memberBtn.classList.add('is-invalid');
                memberFeedback.classList.add('d-block');
                memberFeedback.style.display = 'block';
            }
        }
    });
}
function validateAndApplyFilters() {
    const projectEl = document.getElementById('filterProject');
    const memberBtn = document.getElementById('memberDropdownBtn');
    const periodEl = document.getElementById('periodSelect');
    const startEl = document.getElementById('staticStartDate');
    const endEl = document.getElementById('staticEndDate');

    // Get feedback elements
    const projectFeedback = document.getElementById('projectInvalidFeedback');
    const memberFeedback = document.getElementById('memberInvalidFeedback');
    const periodFeedback = document.getElementById('periodInvalidFeedback');
    const startFeedback = document.getElementById('startDateInvalidFeedback');
    const endFeedback = document.getElementById('endDateInvalidFeedback');

    const project = projectEl.value;
    const memberValues = selectedMembers.slice();
    const period = periodEl.value;
    const start = startEl.value;
    const end = endEl.value;

    let anyFilterSet = (project) ||
        (memberValues.length > 0) ||
        (period) ||
        start || end;

    // Helper function to show/hide feedback
    const showFeedback = (el, feedback, show) => {
        if (el) el.classList.toggle('is-invalid', show);
        if (feedback) {
            if (show) {
                feedback.style.display = 'block';
                feedback.classList.add('d-block');
            } else {
                feedback.style.display = 'none';
                feedback.classList.remove('d-block');
            }
        }
    };

    // Reset validation first
    [projectEl, memberBtn, periodEl, startEl, endEl].forEach(el => {
        el.classList.remove('is-invalid', 'is-valid');
    });
    [projectFeedback, memberFeedback, periodFeedback, startFeedback, endFeedback].forEach(fb => {
        if (fb) {
            fb.style.display = 'none';
            fb.classList.remove('d-block');
        }
    });

    if (!anyFilterSet) {
        // Only mark fields invalid if nothing is set
        showFeedback(projectEl, projectFeedback, true);
        showFeedback(memberBtn, memberFeedback, true);
        showFeedback(periodEl, periodFeedback, true);
        showFeedback(startEl, startFeedback, true);
        showFeedback(endEl, endFeedback, true);
        projectEl.focus();
        return;
    }

    // Mark individual fields valid/invalid as per user input
    showFeedback(projectEl, projectFeedback, !project);
    if (project) projectEl.classList.add('is-valid');
    
    showFeedback(memberBtn, memberFeedback, memberValues.length === 0);
    if (memberValues.length > 0) memberBtn.classList.add('is-valid');
    
    showFeedback(periodEl, periodFeedback, !period || period === 'all');
    if (period && period !== 'all') periodEl.classList.add('is-valid');
    
    showFeedback(startEl, startFeedback, !start);
    if (start) startEl.classList.add('is-valid');
    
    showFeedback(endEl, endFeedback, !end);
    if (end) endEl.classList.add('is-valid');

    // If date range is invalid, show errors
    if (start && end && new Date(start) > new Date(end)) {
        showFeedback(startEl, startFeedback, true);
        showFeedback(endEl, endFeedback, true);
        startEl.focus();
        return;
    }

    // Apply filters
    selectedProject = project;
    selectedMembers = memberValues;
    applyFilters();
    // Remember last applied filters for polling refresh
    lastAppliedFilters = { project, members: memberValues.slice(), start, end };
}

// Note: Validation only happens on Filter button click, not on input change



const __filterBtn = document.getElementById('staticFilterBtn');
if (__filterBtn) __filterBtn.onclick = validateAndApplyFilters;
const __downloadBtn = document.getElementById('staticDownloadBtn');
if (__downloadBtn) __downloadBtn.onclick = function () {
    const start = document.getElementById('staticStartDate').value;
    const end = document.getElementById('staticEndDate').value;
    const filtered = getFilteredStatuses(start, end);

    if (!filtered.length) {
        toastr.error("No data to download.", "Error", {
            timeOut: 3000,       // auto-hide after 3 seconds
            closeButton: true,   // show cross button
            progressBar: true    // show progress bar
        });
        return;
    }

    const wsData = [['Project', 'Member', 'Date', 'Status'], ...filtered.map(s => [s.project_name, s.user_name, s.date, s.status])];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Filtered Statuses');
    XLSX.writeFile(wb, `filtered_statuses.xlsx`);
};

const __resetBtn = document.getElementById('staticResetBtn');
if (__resetBtn) __resetBtn.onclick = function () {
    // Reset all filter inputs
    document.getElementById('filterProject').value = '';
    document.getElementById('periodSelect').value = '';
    document.getElementById('staticStartDate').value = '';
    document.getElementById('staticEndDate').value = '';

    // Reset selected filter variables
    selectedProject = 'all';
    selectedMembers = [];
    updateMemberChips();

    // Remove validation states
    ['filterProject', 'memberDropdownBtn', 'periodSelect', 'staticStartDate', 'staticEndDate'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('is-invalid', 'is-valid');
    });
    
    // Hide all feedback messages
    ['projectInvalidFeedback', 'memberInvalidFeedback', 'periodInvalidFeedback', 'startDateInvalidFeedback', 'endDateInvalidFeedback'].forEach(id => {
        const feedback = document.getElementById(id);
        if (feedback) {
            feedback.style.display = 'none';
            feedback.classList.remove('d-block');
        }
    });

    // Clear table (show "No records found")
    updateSubmittedStatusTable([]);
};


