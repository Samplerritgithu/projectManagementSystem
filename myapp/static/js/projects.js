

    document.getElementById('projectSearch').addEventListener('input', filterProjects);
    document.getElementById('statusFilter').addEventListener('change', filterProjects);
    document.getElementById('clientFilter').addEventListener('change', filterProjects);
    // Pulse the filter bar when filters change
    ['projectSearch','statusFilter','clientFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', () => {
                const fc = document.getElementById('filtersCard');
                if (!fc) return;
                fc.classList.remove('filters-pulse');
                // force reflow to restart animation
                void fc.offsetWidth;
                fc.classList.add('filters-pulse');
            });
            el.addEventListener('change', () => {
                const fc = document.getElementById('filtersCard');
                if (!fc) return;
                fc.classList.remove('filters-pulse');
                void fc.offsetWidth;
                fc.classList.add('filters-pulse');
            });
        }
    });

    
function filterProjects() {
    const searchTerm = document.getElementById('projectSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const clientFilter = document.getElementById('clientFilter').value;

    let visibleCount = 0;

    document.querySelectorAll('.project-card').forEach(card => {
        const titleNode = card.querySelector('.card-header h5');
        const projectName = titleNode ? titleNode.textContent.toLowerCase() : '';
        const projectStatus = card.dataset.status;
        const projectClient = card.dataset.client;

        const matchesSearch = projectName.includes(searchTerm);
        const matchesStatus = !statusFilter || projectStatus === statusFilter;
        const matchesClient = !clientFilter || projectClient === clientFilter;

        const isVisible = matchesSearch && matchesStatus && matchesClient;
        card.style.display = isVisible ? '' : 'none';

        if (isVisible) visibleCount++;
    });

    // Show/hide the "No projects found" message
    const noProjectsMsg = document.getElementById('noProjectsFound');
    if (noProjectsMsg) {
        noProjectsMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}
    // Reset filters
    const resetFiltersBtn = document.getElementById('resetFilters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            document.getElementById('projectSearch').value = '';
            document.getElementById('statusFilter').value = '';
            document.getElementById('clientFilter').value = '';
            filterProjects();
        });
    } 
    // Set minimum date for start date input
    document.addEventListener('DOMContentLoaded', function() {
        // Initialize tooltips for project names
        var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Staggered futuristic floating entrance
        document.querySelectorAll('.project-card-inner').forEach((card, idx) => {
            card.classList.add('anim-flyflip');
            card.style.animationDelay = (idx * 120) + 'ms';
        });

        // Parallax effect for cards
        document.addEventListener('mousemove', function(e) {
            const cards = document.querySelectorAll('.project-card');
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;
            
            cards.forEach((card, index) => {
                const speed = 0.02 + (index * 0.005);
                const x = (mouseX - 0.5) * speed * 20;
                const y = (mouseY - 0.5) * speed * 20;
                
                card.style.transform = `translate3d(${x}px, ${y}px, 0px)`;
            });
        });

        // Animate circular progress rings
        document.querySelectorAll('.progress-ring').forEach(ring => {
            const progress = Math.max(0, Math.min(100, parseInt(ring.getAttribute('data-progress') || '0', 10)));
            const r = 42;
            const circumference = 2 * Math.PI * r;
            const offset = circumference - (progress / 100) * circumference;
            const fg = ring.querySelector('.fg');
            if (fg) {
                fg.setAttribute('stroke-dasharray', String(circumference));
                fg.style.strokeDashoffset = String(circumference);
                requestAnimationFrame(() => {
                    fg.style.strokeDashoffset = String(offset);
                });
            }
        });

        const startDateInput = document.getElementById('projectStartDate');
        const endDateInput = document.getElementById('projectEndDate');
        
        // Set minimum date to today for start date
        const today = new Date().toISOString().split('T')[0];
        startDateInput.min = today;
        
                 // Update end date minimum when start date changes
         startDateInput.addEventListener('change', function() {
             if (this.value) {
                 endDateInput.min = this.value;
                 // If end date is before new start date, show warning but don't clear
                 if (endDateInput.value && endDateInput.value < this.value) {
                     toastr.error('End date is before the new start date. update the end date.', 'error');
                 }
             }
         });
         
         // Validate end date when it changes
         endDateInput.addEventListener('change', function() {
             const startDate = startDateInput.value;
             if (startDate && this.value && this.value < startDate) {
                 toastr.error('End date cannot be before start date!', 'Error');
             }
         });
    });

    //add project form validation and submission
const form = document.getElementById('addProjectForm');
const saveBtn = document.getElementById('saveProjectBtn');
const projectNameField = document.getElementById('projectName');
const projectNameError = document.getElementById('projectNameError');
    const nameRegex = /^[A-Za-z0-9\s\-()]+$/; // letters, numbers, spaces, hyphens, parentheses

    // Check if form elements exist - but don't stop execution
    if (!form || !saveBtn) {
        console.warn('Form elements not found:', { form: !!form, saveBtn: !!saveBtn });
        // Don't return - let the rest of the page load
    }

   // ---------- Live Validation ----------
if (form) {
    form.querySelectorAll('input, textarea, select').forEach(field => {
        field.addEventListener('input', () => validateField(field));
        if (field.tagName === "SELECT") {
            field.addEventListener('change', () => validateField(field));
        }
    });
}
// Ensure listeners are attached after DOM is ready as well
document.addEventListener('DOMContentLoaded', function() {
    const formEl = document.getElementById('addProjectForm');
    if (formEl) {
        formEl.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('input', () => validateField(field));
            if (field.tagName === 'SELECT') {
                field.addEventListener('change', () => validateField(field));
            }
        });
    }
});

// ---------- Live duplicate project name check ----------
function checkDuplicateProjectName() {
    try {
        const field = document.getElementById('projectName');
        const btn = document.getElementById('saveProjectBtn');
        const err = document.getElementById('projectNameError');
        const newName = (field?.value || '').trim().toLowerCase();
        if (!newName) {
            // clear dup state
            if (field) field.setCustomValidity('');
            if (err) { err.textContent = ''; err.style.display = 'none'; }
            if (btn) btn.disabled = false;
            return false;
        }
        const titles = Array.from(document.querySelectorAll('.project-title')).map(el => (el.textContent || '').trim().toLowerCase());
        const dup = titles.includes(newName);
        if (dup) {
            if (field) {
                field.classList.add('is-invalid');
                field.classList.remove('is-valid');
                field.setCustomValidity('Duplicate project name');
            }
            if (err) {
                err.textContent = 'A project with this name already exists';
                err.style.display = 'block';
            }
            if (btn) btn.disabled = true;
            return true;
        } else {
            if (field) field.setCustomValidity('');
            if (err) {
                err.textContent = '';
                err.style.display = 'none';
            }
            if (btn) btn.disabled = false;
            return false;
        }
    } catch (_) {
        // Do nothing on error; allow server-side validation
        return false;
    }
}




// ---------- Generic Validate Field Function ----------
function validateField(field) {
    const value = field.value.trim();
    const fieldName = field.name || field.id;
    const fieldType = field.type;
    const nameRegex = /^[A-Za-z0-9\s\-\(\)]+$/;

    const isRequired = field.hasAttribute('required');

    // Reset previous validity
    field.classList.remove('is-invalid', 'is-valid');
    field.setCustomValidity('');

    // Clear projectNameField-specific error
    if (field === projectNameField && projectNameError) {
        projectNameError.textContent = '';
        projectNameError.style.display = 'none';
    }

    // ---------- Required Field Validation ----------
    if (isRequired && !value) {
        field.classList.add('is-invalid');
        field.setCustomValidity('This field is required');
        
        // Show custom error for project name
        if (field === projectNameField && projectNameError) {
            projectNameError.textContent = 'Project name is required';
            projectNameError.style.display = 'block';
        }
        return false;
    }

    // ---------- Pattern Validation for Project Name ----------
    if (field === projectNameField && value) {
        // Check for leading whitespace
        if (value !== value.trim() || /^\s/.test(value)) {
            field.classList.add('is-invalid');
            field.setCustomValidity('Project name cannot have leading whitespaces');
            if (projectNameError) {
                projectNameError.textContent = 'Project name cannot have leading whitespaces';
                projectNameError.style.display = 'block';
            }
            return false;
        }
          // Check allowed characters
        if (!nameRegex.test(value)) {
            field.classList.add('is-invalid');
            field.setCustomValidity('Only letters, numbers, spaces, hyphens, and parentheses are allowed');
            if (projectNameError) {
                projectNameError.textContent = 'Only letters, numbers, spaces, hyphens, and parentheses are allowed';
                projectNameError.style.display = 'block';
            }
            return false;
        }
        // Check length (min 3, max 40)
        if (value.length < 3) {
            field.classList.add('is-invalid');
            field.setCustomValidity('Project name must be at least 3 characters long');
            if (projectNameError) {
                projectNameError.textContent = 'Project name must be at least 3 characters long';
                projectNameError.style.display = 'block';
            }
            return false;
        }
        
        if (value.length > 40) {
            field.classList.add('is-invalid');
            field.setCustomValidity('Project name cannot exceed 40 characters');
            if (projectNameError) {
                projectNameError.textContent = 'Project name cannot exceed 40 characters';
                projectNameError.style.display = 'block';
            }
            return false;
        }
        
      
    }

    // ---------- Date Validation ----------
    if (fieldType === 'date' && value) {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (fieldName === 'start_date' && selectedDate < today) {
            field.classList.add('is-invalid');
            field.setCustomValidity('Start date cannot be in the past');
            return false;
        }
        
        if (fieldName === 'end_date') {
            const startDateField = document.getElementById('projectStartDate');
            if (startDateField && startDateField.value) {
                const startDate = new Date(startDateField.value);
                if (selectedDate < startDate) {
                    field.classList.add('is-invalid');
                    field.setCustomValidity('End date cannot be before start date');
                    return false;
                }
            }
        }
    }

    // ---------- Description Word Count Validation ----------
    if (fieldName === 'description' && value) {
        const trimmedValue = value.trim();
        const wordCount = trimmedValue.split(/\s+/).filter(word => word.length > 0).length;
        
        // Check word count (max 100 words)
        if (wordCount > 100) {
            field.classList.add('is-invalid');
            field.setCustomValidity(`Description cannot exceed 100 words. Current: ${wordCount} words`);
            return false;
        }
        
    
    }

    // ---------- Client Selection Validation ----------
    if (fieldName === 'client' && isRequired && (!value || value === '')) {
        field.classList.add('is-invalid');
        field.setCustomValidity('Please select a client');
        return false;
    }

    // ---------- Status Selection Validation ----------
    if (fieldName === 'status' && isRequired && (!value || value === '')) {
        field.classList.add('is-invalid');
        field.setCustomValidity('Please select a status');
        return false;
    }

    // ---------- Progress Validation (for edit form) ----------
    if (fieldName === 'progress' && value) {
        const progressValue = parseInt(value);
        if (isNaN(progressValue) || progressValue < 0 || progressValue > 100) {
            field.classList.add('is-invalid');
            field.setCustomValidity('Progress must be a number between 0 and 100');
            return false;
        }
    }

    // ---------- Valid Field ----------
    if (value || !isRequired) {
        field.classList.add('is-valid');
        
        // Show success feedback for important fields
        if (fieldName === 'name' && value) {
            console.log('Project name is valid:', value);
        }
        if (fieldName === 'client' && value) {
            console.log('Client selected:', value);
        }
        if (fieldName === 'status' && value) {
            console.log('Status selected:', value);
        }
        
        return true;
    }

    return false;
}

// ---------- On Save Button Click ----------
if (saveBtn) {
    saveBtn.addEventListener('click', function () {
    console.log('Save button clicked');
    
    let isFormValid = true;
    const invalidFields = [];

    // Validate all required fields
    if (form) {
        form.querySelectorAll('input[required], textarea[required], select[required]').forEach(field => {
            if (!validateField(field)) {
                isFormValid = false;
                invalidFields.push(field.name || field.id);
            }
        });
    }

    console.log('Form validation result:', isFormValid);
    console.log('Invalid fields:', invalidFields);

    if (!isFormValid) {
        if (form) {
            form.classList.add('was-validated');
        }
        
        
        // Scroll to first invalid field
        const firstInvalidField = form ? form.querySelector('.is-invalid') : null;
        if (firstInvalidField) {
            firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidField.focus();
        }
        return; // stop submission if invalid
    }

    // Live duplicate guard already handled in input/change; block if currently invalid
    if (checkDuplicateProjectName()) return;

    // Show loading state
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Saving...';

    // ---------- Submit Form via fetch ----------
    const formData = new FormData(form);
    
    // Debug: Log form data
    console.log('Form data being submitted:');
    for (let [key, value] of formData.entries()) {
        console.log(key, value);
    }
    
    fetch(ADD_PROJECT_URL, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            toastr.success('Project added successfully!', 'Success', {
                closeButton: true,
                progressBar: true,
                timeOut: 5000,
                extendedTimeOut: 1000,
                positionClass: 'toast-top-right',
            });
            setTimeout(() => window.location.reload(), 1500);
        } else {
            toastr.error('Error: ' + (data.error || 'Unknown error occurred'), 'Error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        toastr.error('An error occurred while saving the project. Please try again.', 'Error');
    })
    .finally(() => {
        // Reset button state
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Save Project';
    });
    });
}
function formatDateToReadable(date) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

    // ---------- Reset Form When Modal Closes ----------
    // ---------- Reset Form When Modal Closes ----------
function resetAddProjectForm() {
    if (form) {
        form.reset();
        form.classList.remove('was-validated');

        // Remove all validation classes
        form.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
        });

        // Clear all custom validation messages
        form.querySelectorAll('input, textarea, select').forEach(field => {
            field.setCustomValidity('');
        });

        // Clear project name error text and hide it
        if (projectNameError) {
            projectNameError.textContent = '';
            projectNameError.style.display = 'none';
        }

        // Reset any other dynamic UI like word counter
        const wordCounter = document.getElementById("wordCount");
        if (wordCounter) {
            wordCounter.textContent = "0";
        }

        // Reset date inputs to remove min restrictions
        const startDateInput = document.getElementById('projectStartDate');
        const endDateInput = document.getElementById('projectEndDate');
        if (startDateInput) {
            startDateInput.removeAttribute('min');
        }
        if (endDateInput) {
            endDateInput.removeAttribute('min');
        }
    }
}

// Works for both "x" button, cancel button, and clicking outside
const addProjectModal = document.getElementById('addProjectModal');
if (addProjectModal) {
    addProjectModal.addEventListener('hidden.bs.modal', resetAddProjectForm);
}


    // end of add project form validation and submission
   
    
    // View project functionality
    // Make entire card clickable for view
    document.querySelectorAll('.project-card-inner').forEach(card => {
        card.addEventListener('click', function(e) {
            // ignore clicks on interactive elements inside if any are added later
            const projectId = this.getAttribute('data-project-id');
            fetch(`/projects/${projectId}/view/`, {
                method: 'GET',
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.error || 'Failed to load project data');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                
                // Populate view modal with project data
                document.getElementById('viewProjectId').textContent = data.project_id || 'N/A';
                document.getElementById('viewProjectName').textContent = data.name;
                document.getElementById('viewProjectClient').textContent = data.client_name;
                document.getElementById('viewProjectDescription').textContent = data.description || 'No description available';
                
                // Format and display status with appropriate badge
                const statusBadge = document.createElement('span');
                statusBadge.className = `badge ${getStatusBadgeClass(data.status)}`;
                const statusIcon = getStatusIcon(data.status);
                statusBadge.innerHTML = `${statusIcon} ${data.status}`;
                document.getElementById('viewProjectStatus').innerHTML = '';
                document.getElementById('viewProjectStatus').appendChild(statusBadge);
                
                // Format and display dates
                
                document.getElementById('viewProjectStartDate').textContent = data.start_date
                ? formatDateToReadable(new Date(data.start_date))
                : 'Not set';

                document.getElementById('viewProjectEndDate').textContent = data.end_date
                ? formatDateToReadable(new Date(data.end_date))
                : 'Not set';
                
                // Update progress bar
                const progressBar = document.getElementById('viewProjectProgress');
                progressBar.style.width = `${data.progress || 0}%`;
                progressBar.setAttribute('aria-valuenow', data.progress || 0);
                progressBar.textContent = `${data.progress || 0}%`;
                
                // Clear and populate tasks
                const tasksList = document.getElementById('viewProjectTasks');
                tasksList.innerHTML = '';

              if (data.tasks && data.tasks.length > 0) {
                    data.tasks.forEach(task => {
                        const taskItem = document.createElement('div');
                        taskItem.className = 'list-group-item d-flex justify-content-between align-items-center';
                        
                        taskItem.innerHTML = `
                            <div class="task-info">
                                <h6 class="task-title mb-0">${task.title}</h6>
                                <div class="assigned-to">${task.assigned_to || ''}</div>
                            </div>
                            <span class="badge ${getStatusBadgeClass(task.status)}">
                                ${getStatusIcon(task.status)} ${task.status}
                            </span>
                        `;
                        tasksList.appendChild(taskItem);
                    });

                    // Add scroll only if more than 4 tasks
                    if (data.tasks.length > 4) {
                        tasksList.classList.add('scrollable-tasks');
                    } else {
                        tasksList.classList.remove('scrollable-tasks');
                    }

                } else {
                    tasksList.innerHTML = '<div class="list-group-item">No tasks found</div>';
                    tasksList.classList.remove('scrollable-tasks');
                }

                
                // Inject Edit/Delete buttons into modal footer actions area (only for Manager/Team Lead)
                const modalFooter = document.getElementById('viewProjectModalFooterActions');
                if (modalFooter) {
                    const userRole = USER_ROLE;
                    if (userRole === "Manager" || userRole === "Team Lead") {
                        modalFooter.innerHTML = `
                            <button class="btn btn-outline-info" id="modalEditProject" data-project-id="${projectId}"><i class="bi bi-pencil"></i> Edit</button>
                            <button class="btn btn-outline-danger" id="modalDeleteProject" data-project-id="${projectId}"><i class="bi bi-trash"></i> Delete</button>
                        `;
                    } else {
                        modalFooter.innerHTML = '';
                    }
                }

                // Wire up Edit in modal
                const editBtn = document.getElementById('modalEditProject');
                if (editBtn) {
                    editBtn.addEventListener('click', function(ev) {
                        ev.stopPropagation();
                        const pid = this.getAttribute('data-project-id');
                        fetch(`/projects/${pid}/edit/`, {
                            method: 'GET',
                            headers: { 'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value, 'Accept': 'application/json' }
                        })
                        .then(r => r.json())
                        .then(d => {
                            document.getElementById('editProjectId').value = pid;
                            document.getElementById('editProjectIdDisplay').value = d.project_id || 'N/A';
                            document.getElementById('editProjectName').value = d.name;
                            document.getElementById('editProjectDescription').value = d.description || '';
                            document.getElementById('editProjectClient').value = d.client_id || '';
                            document.getElementById('editProjectStatus').value = d.status;
                            document.getElementById('editProjectStartDate').value = d.start_date || '';
                            document.getElementById('editProjectEndDate').value = d.end_date || '';
                            document.getElementById('editProjectProgress').value = d.progress || 0;

                            // Store originals for change detection
                            const formEl = document.getElementById('editProjectForm');
                            if (formEl) {
                                formEl.dataset.original_name = (d.name || '').trim();
                                formEl.dataset.original_description = (d.description || '').trim();
                                formEl.dataset.original_client = String(d.client_id || '');
                                formEl.dataset.original_status = String(d.status || '');
                                formEl.dataset.original_start_date = d.start_date || '';
                                formEl.dataset.original_end_date = d.end_date || '';
                                formEl.dataset.original_progress = String(d.progress == null ? '0' : d.progress);
                                formEl.classList.remove('was-validated');
                                // Clear any previous validity classes
                                formEl.querySelectorAll('.is-valid, .is-invalid').forEach(el => el.classList.remove('is-valid','is-invalid'));
                            }
                            const editModal = new bootstrap.Modal(document.getElementById('editProjectModal'));
                            editModal.show();
                        });
                    });
                }

                // Wire up Delete in modal
                const delBtn = document.getElementById('modalDeleteProject');

                if (delBtn) {
                    // Create Bootstrap Modal dynamically
                    const modalHTML = `
                        <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-labelledby="deleteConfirmLabel" aria-hidden="true">
                            <div class="modal-dialog">
                                <div class="modal-content">
                                    <div class="modal-header bg-danger text-white">
                                        <h5 class="modal-title" id="deleteConfirmLabel">Confirm Delete</h5>
                                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                                    </div>
                                    <div class="modal-body">
                                        Are you sure you want to delete this project? This action cannot be undone.
                                    </div>
                                    <div class="modal-footer">
                                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                        <button type="button" id="confirmDeleteBtn" class="btn btn-danger">Delete</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                
                    // Append modal to body
                    document.body.insertAdjacentHTML('beforeend', modalHTML);
                
                    const modalEl = document.getElementById('deleteConfirmModal');
                    const confirmBtn = document.getElementById('confirmDeleteBtn');
                    const modal = new bootstrap.Modal(modalEl);
                
                    let projectId = null;
                
                    // When user clicks delete button
                    delBtn.addEventListener('click', function (ev) {
                        ev.stopPropagation();
                        projectId = this.getAttribute('data-project-id');
                        modal.show();
                    });
                
                    // When user confirms deletion
                    confirmBtn.addEventListener('click', function () {
                        if (!projectId) return;
                
                        fetch(`/projects/${projectId}/delete/`, {
                            method: 'POST',
                            headers: {
                                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                                'Accept': 'application/json'
                            }
                        })
                        .then(r => r.json())
                        .then(resp => {
                            modal.hide();
                            if (resp.success) {
                                toastr.success('Project deleted successfully!', 'Success', {
                                    closeButton: true,
                                    progressBar: true,
                                    timeOut: 5000,
                                    extendedTimeOut: 1000,
                                    positionClass: 'toast-top-right'
                                });
                                setTimeout(() => window.location.reload(), 1200);
                            } else {
                                toastr.error('Error: ' + (resp.error || 'Failed to delete project'), 'Error');
                            }
                        })
                        .catch(err => {
                            console.error(err);
                            toastr.error('An error occurred while deleting the project.', 'Error');
                        });
                    });
                }
                
                // Show view modal last
                const viewModal = new bootstrap.Modal(document.getElementById('viewProjectModal'));
                viewModal.show();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error loading project data: ' + error.message);
            });
        });
    });
    
    
    
    // Edit project date validation
    function validateEditDates() {
        const startDate = document.getElementById('editProjectStartDate').value;
        const endDate = document.getElementById('editProjectEndDate').value;
        const today = new Date().toISOString().split('T')[0];
        
        // Check if start date is provided
        if (!startDate) {
            toastr.error('Select a start date!', 'error');
            return false;
        }
     
        
        // Check if end date is provided
        if (!endDate) {
            toastr.error('Select an end date!', 'error');
            return false;
        }
        
        // Check if end date is before start date
        if (endDate < startDate) {
            toastr.error('End date cannot be before start date!', 'error');
            return false;
        }
        
        return true;
    }

    function validateEditDescription() {
        const description = document.getElementById('editProjectDescription').value;
        if (description) {
            const wordCount = description.trim().split(/\s+/).length;
            if (wordCount > 100) {
                toastr.error(`
                    not exceed 100 words. Current: ${wordCount} words`, 'error');
                return false;
            }
        }
        return true;
    }


document.getElementById('updateProjectBtn').addEventListener('click', function() {
    const form = document.getElementById('editProjectForm');

    // --- 1. Validate required fields (exclude description) ---
    let allValid = true;
    form.querySelectorAll('input, select, textarea').forEach(field => {
        // Skip validation for description and read-only fields
        if (field.id === 'editProjectDescription' || field.readOnly) return;

        if (!field.value || field.value.trim() === '') {
            field.classList.add('is-invalid');
            field.classList.remove('is-valid');
            allValid = false;
        } else {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        }
    });

    if (!allValid) {
        toastr.warning('Please fill all required fields.', 'Warning', {
            timeOut: 3000,
            closeButton: true,
            progressBar: true
        });
        return; // Stop if fields are invalid
    }

    // --- 2. Custom check for date logic ---
    const startDate = new Date(document.getElementById('editProjectStartDate').value);
    const endDate = new Date(document.getElementById('editProjectEndDate').value);
    if (endDate < startDate) {
        document.getElementById('editProjectEndDate').setCustomValidity("End date cannot be before start date.");
        form.classList.add('was-validated');
        return;
    } else {
        document.getElementById('editProjectEndDate').setCustomValidity("");
    }

    // --- 2.5. Description word limit validation ---
    if (!validateEditDescription()) {
        return;
    }

    // --- 3. Detect changes ---
    const currentData = {
        name: document.getElementById('editProjectName').value.trim(),
        description: document.getElementById('editProjectDescription').value.trim(),
        client: String(document.getElementById('editProjectClient').value),
        status: String(document.getElementById('editProjectStatus').value),
        start_date: document.getElementById('editProjectStartDate').value,
        end_date: document.getElementById('editProjectEndDate').value,
        progress: String(document.getElementById('editProjectProgress').value)
    };

    let isChanged = false;
    for (let key in currentData) {
        let original = form.dataset[`original_${key}`] ?? "";
        let current = currentData[key] ?? "";

        if (typeof original === "string") original = original.trim();
        if (typeof current === "string") current = current.trim();

        if (original != current) {
            isChanged = true;
            break;
        }
    }

    // --- 4. Show "No changes" toastr and close modal ---
    if (!isChanged) {
        toastr.info("No changes made!", "Info", {
            timeOut: 3000,
            closeButton: true,
            progressBar: true,
            onHidden: function() {
                const modal = bootstrap.Modal.getInstance(document.getElementById('editProjectModal'));
                if (modal) modal.hide();
            }
        });
        return;
    }

    // --- 5. Submit changes if valid and changed ---
    const formData = new FormData(form);
    const projectId = form.querySelector('#editProjectId').value;

    fetch(`/projects/${projectId}/edit/`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'Accept': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            toastr.success('Project updated successfully!', 'Success', {
                closeButton: true,
                progressBar: true,
                timeOut: 5000
            });
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            toastr.error('Error: ' + data.error, 'Error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        toastr.error('An error occurred while updating the project: ' + error.message, 'Error');
    });
});


// Open edit modal & load project data
function openEditModal(project) {
    const form = document.getElementById('editProjectForm');

    document.getElementById('editProjectId').value = project.id;
    document.getElementById('editProjectIdDisplay').value = project.id;
    document.getElementById('editProjectName').value = project.name;
    document.getElementById('editProjectDescription').value = project.description;
    document.getElementById('editProjectClient').value = project.client;
    document.getElementById('editProjectStatus').value = project.status;
    document.getElementById('editProjectStartDate').value = project.start_date;
    document.getElementById('editProjectEndDate').value = project.end_date;
    document.getElementById('editProjectProgress').value = project.progress;

    // Store originals in dataset (normalize to strings)
    form.dataset.original_name = project.name?.trim() || "";
    form.dataset.original_description = project.description?.trim() || "";
    form.dataset.original_client = String(project.client ?? "");
    form.dataset.original_status = String(project.status ?? "");
    form.dataset.original_start_date = project.start_date || "";
    form.dataset.original_end_date = project.end_date || "";
    form.dataset.original_progress = String(project.progress ?? "0");

    // Reset validation state each time modal opens
    form.classList.remove('was-validated');

    const modal = new bootstrap.Modal(document.getElementById('editProjectModal'));
    modal.show();
}



     
    // Inline validation for Edit Project Name (allow letters, numbers, spaces)
    (function() {
        const editNameField = document.getElementById('editProjectName');
        if (!editNameField) return;

        // Ensure pattern allows numbers too (done via JS to avoid altering other markup)
        editNameField.setAttribute('pattern', '^[A-Za-z0-9\\s]+$');
        editNameField.setAttribute('title', 'Project name can contain only letters, numbers, and spaces');

        const nameRegex = /^[A-Za-z0-9\s]+$/;
        const feedbackEl = editNameField.closest('.mb-3')?.querySelector('.invalid-feedback');

        function validateEditName() {
            const value = editNameField.value.trim();
            if (!value) {
                editNameField.setCustomValidity('Required');
                if (feedbackEl) feedbackEl.textContent = 'Project name is required';
                editNameField.classList.remove('is-valid');
                editNameField.classList.add('is-invalid');
                return false;
            }
            if (!nameRegex.test(value)) {
                editNameField.setCustomValidity('Invalid');
                if (feedbackEl) feedbackEl.textContent = 'Project name must have letters, spaces and numbers';
                editNameField.classList.remove('is-valid');
                editNameField.classList.add('is-invalid');
                return false;
            }
            editNameField.setCustomValidity('');
            editNameField.classList.remove('is-invalid');
            editNameField.classList.add('is-valid');
            return true;
        }

        editNameField.addEventListener('input', validateEditName);
        editNameField.addEventListener('blur', validateEditName);

        // Hook into update button flow to enforce name validation first
        // Live validation for start/end dates
        const startEl = document.getElementById('editProjectStartDate');
        const endEl = document.getElementById('editProjectEndDate');

        function getFeedbackEl(input) {
            if (!input) return null;
            let el = input.nextElementSibling;
            while (el && !el.classList.contains('invalid-feedback')) {
                el = el.nextElementSibling;
            }
            return el;
        }

        const startFeedback = getFeedbackEl(startEl);
        const endFeedback = getFeedbackEl(endEl);

        function validateStart() {
            if (!startEl) return true;
            const s = startEl.value;
            if (!s) {
                startEl.setCustomValidity('Required');
                if (startFeedback) startFeedback.textContent = 'Select a start date.';
                startEl.classList.remove('is-valid');
                startEl.classList.add('is-invalid');
                return false;
            }
            startEl.setCustomValidity('');
            startEl.classList.remove('is-invalid');
            startEl.classList.add('is-valid');
            return true;
        }

        function validateEnd() {
            if (!endEl) return true;
            const s = startEl ? startEl.value : '';
            const e = endEl.value;
            if (!e) {
                endEl.setCustomValidity('Required');
                if (endFeedback) endFeedback.textContent = 'Select a End date.';
                endEl.classList.remove('is-valid');
                endEl.classList.add('is-invalid');
                return false;
            }
            if (s && e && e < s) {
                endEl.setCustomValidity('End date cannot be before start date.');
                if (endFeedback) endFeedback.textContent = 'End date cannot be before start date.';
                endEl.classList.remove('is-valid');
                endEl.classList.add('is-invalid');
                return false;
            }
            endEl.setCustomValidity('');
            endEl.classList.remove('is-invalid');
            endEl.classList.add('is-valid');
            return true;
        }

        // Validate each field independently; do not validate end automatically on start clear
        startEl?.addEventListener('input', function() {
            validateStart();
            const s = startEl.value;
            if (endEl) {
                if (s) {
                    endEl.min = s; // disable earlier dates in picker
                    // If end is set before new start, clear and mark invalid without toast
                    if (endEl.value && endEl.value < s) {
                        endEl.value = '';
                        endEl.setCustomValidity('Required');
                        const endFeedbackNow = getFeedbackEl(endEl);
                        if (endFeedbackNow) endFeedbackNow.textContent = 'End date cannot be before start date.';
                        endEl.classList.remove('is-valid');
                        endEl.classList.add('is-invalid');
                    }
                } else {
                    endEl.removeAttribute('min');
                }
            }
        });
        startEl?.addEventListener('change', function() {
            validateStart();
            const s = startEl.value;
            if (endEl) {
                if (s) {
                    endEl.min = s;
                    if (endEl.value && endEl.value < s) {
                        endEl.value = '';
                        endEl.setCustomValidity('Required');
                        const endFeedbackNow = getFeedbackEl(endEl);
                        if (endFeedbackNow) endFeedbackNow.textContent = 'End date cannot be before start date.';
                        endEl.classList.remove('is-valid');
                        endEl.classList.add('is-invalid');
                    }
                } else {
                    endEl.removeAttribute('min');
                }
            }
        });
        endEl?.addEventListener('input', validateEnd);
        endEl?.addEventListener('change', validateEnd);

        const updateBtn = document.getElementById('updateProjectBtn');
        if (updateBtn) {
            updateBtn.addEventListener('click', function() {
                validateEditName();
                validateStart();
                validateEnd();
            }, { capture: true });
        }
    })();

  function getStatusBadgeClass(status) {
    switch (status) {
      case "Done":
        return "bg-success";
      case "In Progress":
        return "bg-warning text-dark";
      case "Review":
        return "bg-info";
      default:
        return "bg-secondary";
    }
  }

  function getStatusIcon(status) {
    switch (status) {   
      case "In Progress":
        return "⚡";
      case "On Hold":
        return "⏸️";
      case "Completed":
        return "✅";
      case "Done":
        return "✅";
      case "Review":
        return "👀";
      default:
        return "📋";
    }
  }

    // Word count functions
    function updateWordCount(textarea) {
        const text = textarea.value;
        const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        const wordCountElement = document.getElementById('wordCount');
        if (wordCountElement) {
            wordCountElement.textContent = wordCount;
            if (wordCount > 100) {
                wordCountElement.style.color = '#dc3545';
            } else {
                wordCountElement.style.color = '#6c757d';
            }
        }
    }

    function updateEditWordCount(textarea) {
        const text = textarea.value;
        const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        const wordCountElement = document.getElementById('editWordCount');
        if (wordCountElement) {
            wordCountElement.textContent = wordCount;
            if (wordCount > 100) {
                wordCountElement.style.color = '#dc3545';
            } else {
                wordCountElement.style.color = '#6c757d';
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        let role = localStorage.getItem("role");
        console.log("Current user role from localStorage:", role);
        
        // Fallback: check server-side role if localStorage is empty
        if (!role) {
            const serverRole = USER_ROLE;
            if (serverRole && serverRole !== "None") {
                role = serverRole;
                localStorage.setItem("role", role);
                console.log("Role set from server-side:", role);
            }
        }

        // Debug: Check if button exists in DOM
        const addProjectButton = document.querySelector('#addproject1');
        console.log("Add Project button element:", addProjectButton);
        console.log("Button computed style:", addProjectButton ? window.getComputedStyle(addProjectButton).display : "Button not found");

        if (role === "Manager" || role === "Team Lead") {
            if (addProjectButton) {
                addProjectButton.style.display = "block !important";
                addProjectButton.style.visibility = "visible";
                console.log("Add Project button made visible for role:", role);
            } else {
                console.error("Add Project button not found in DOM - this means the server-side template condition failed");
                console.log("Server-side role check:", USER_ROLE);
            }
        } else {
            console.log("Add Project button hidden for role:", role);
            if (addProjectButton) {
                addProjectButton.style.display = "none";
            }
        }

        // Initialize word count and auto-fill Project ID when add project modal is shown
        const addProjectModal = document.getElementById('addProjectModal');
        if (addProjectModal) {
            addProjectModal.addEventListener('shown.bs.modal', function () {
                updateWordCount(document.getElementById('projectDescription'));
                // Auto-fetch next project ID and set into disabled input for display
                fetch('/projects/next-id/', { headers: { 'Accept': 'application/json' } })
                    .then(r => r.json())
                    .then(d => {
                        const idInput = document.getElementById('projectId');
                        if (idInput) {
                            idInput.value = d.next_project_id || '';
                            idInput.setAttribute('disabled', 'disabled');
                            idInput.setAttribute('readonly', 'readonly');
                        }
                    })
                    .catch(() => {
                        // Ignore fetch failures; backend will still generate ID on save
                    });
            });
        }
    });
        
    // ✅ Helper function for form validation before submission
        function validateForm(form) {
            let isValid = true;
            const requiredFields = form.querySelectorAll('[required]');

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('is-invalid');
                    isValid = false;
                } else {
                    field.classList.remove('is-invalid');
                }
            });

            return isValid;
        }

    // Prevent Enter key from closing modal or submitting form automatically
        // ✅ Enhanced Enter-key handler with validation support
            ['addProjectForm', 'editProjectForm'].forEach(formId => {
                const form = document.getElementById(formId);
                if (!form) return;

                form.addEventListener('keydown', function (e) {
                    // Ignore Enter inside textarea
                    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                        e.preventDefault(); // prevent modal close / form submit

                        const openModal = e.target.closest('.modal.show');
                        if (!openModal) return;

                        // Run basic validation before simulating button click
                        if (!validateForm(form)) {
                            form.classList.add('was-validated');
                            return;
                        }

                        if (openModal.id === 'addProjectModal') {
                            const saveBtn = openModal.querySelector('#saveProjectBtn');
                            if (saveBtn) saveBtn.click();
                        } else if (openModal.id === 'editProjectModal') {
                            const updateBtn = openModal.querySelector('#updateProjectBtn');
                            if (updateBtn) updateBtn.click();
                        }
                    }
                });
            });


            // ✅ Remove red border when user starts typing again
        document.addEventListener('input', function (e) {
            if (e.target.classList.contains('is-invalid') && e.target.value.trim() !== '') {
                e.target.classList.remove('is-invalid');
            }
        });
const dateInputs = [
    document.getElementById("projectStartDate"),
    document.getElementById("projectEndDate"),
    document.getElementById("editProjectStartDate"),
    document.getElementById("editProjectEndDate")
];

dateInputs.forEach(input => {
    if (!input) return;

    // Restrict input format while typing
    input.addEventListener("input", function (e) {
        let val = e.target.value;

        // Remove any invalid chars (allow only numbers and dash)
        val = val.replace(/[^0-9-]/g, "");

        const parts = val.split("-");

        // Limit lengths
        if (parts[0]) parts[0] = parts[0].slice(0, 4); // year
        if (parts[1]) parts[1] = parts[1].slice(0, 2); // month
        if (parts[2]) parts[2] = parts[2].slice(0, 2); // day

        // Rejoin
        e.target.value = parts.join("-");
    });

    // Validate on blur
    input.addEventListener("blur", function () {
        const val = e.target.value;
        if (!val) return;

        const [year, month, day] = val.split("-");
        if (!year || year.length !== 4) {
            toastr.error("Year must be 4 digits", "Error");
            e.target.value = "";
            return;
        }
        if (month && (parseInt(month) < 1 || parseInt(month) > 12)) {
            toastr.error("Month must be between 01 and 12", "Error");
            e.target.value = "";
            return;
        }
        if (day && (parseInt(day) < 1 || parseInt(day) > 31)) {
            toastr.error("Day must be between 01 and 31", "Error");
            e.target.value = "";
            return;
        }
    });
});

// Keep your existing min-date logic
const today = new Date().toISOString().split("T")[0];
const projectStartDate = document.getElementById("projectStartDate");
const projectEndDate = document.getElementById("projectEndDate");

if (projectStartDate) projectStartDate.min = today;

if (projectStartDate && projectEndDate) {
    projectStartDate.addEventListener("change", function () {
        if (this.value) {
            projectEndDate.min = this.value;
            if (projectEndDate.value && projectEndDate.value < this.value) {
                toastr.error("End date cannot be before start date", "Error");
                projectEndDate.value = "";
            }
        } else {
            projectEndDate.removeAttribute("min");
        }
    });
}
