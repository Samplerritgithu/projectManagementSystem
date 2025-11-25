
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
    new bootstrap.Tooltip(tooltipTriggerEl)
    })
  // Store the current tasks data
  let tasksData = [];
  
  // Get user role for dynamic button visibility (injected via window.DJ)
  const role = (window.DJ && window.DJ.currentRole) || localStorage.getItem("role") || "";

  // Daily Status functionality
  let dailyStatusSubmitted = [];

  // Comment modal functionality
  let commentModalTaskId = null;
  const currentUsername = (window.DJ && window.DJ.currentUsername) || "";



  // Page name functionality
  let pageNames = new Set(); // Store unique page names
  let pendingPageNameTarget = null;

  function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
  }

  // Page name functionality
  function loadPageNames() {
    // Load existing page names from current page tasks
    const taskRows = document.querySelectorAll('#taskList tr[data-task-id]');
    taskRows.forEach(row => {
      const pageNameCell = row.querySelector('td:nth-child(3)'); // Page name is 3rd column
      if (pageNameCell) {
        const badge = pageNameCell.querySelector('.badge');
        if (badge && badge.textContent.trim() && badge.textContent.trim() !== '-') {
          pageNames.add(badge.textContent.trim());
        }
      }
    });
    
    // Also load from kanban view if it exists
    const kanbanCards = document.querySelectorAll('.task-card[data-page-name]');
    kanbanCards.forEach(card => {
      const pageName = card.getAttribute('data-page-name');
      if (pageName && pageName.trim()) {
        pageNames.add(pageName.trim());
      }
    });
    
    updatePageNameDropdowns();
  }

  function updatePageNameDropdowns() {
    updatePageNameDropdown('taskPageName');
    updatePageNameDropdown('editTaskPageName');
  }


  //updating the page namessss--------------------

  function updatePageNameDropdown(dropdownId) {
    const isAdd = dropdownId === 'taskPageName';
    const listId = isAdd ? 'taskPageNameList' : 'editTaskPageNameList';
    const listEl = document.getElementById(listId);
    if (!listEl) return;

    listEl.innerHTML = '';
    const sortedNames = Array.from(pageNames).sort();
    
    if (sortedNames.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'px-3 py-2 text-muted text-center';
      emptyLi.textContent = 'No page names available';
      listEl.appendChild(emptyLi);
      return;
    }

    sortedNames.forEach(pageName => {
      const li = document.createElement('li');
      li.className = 'page-name-item';
      li.setAttribute('data-page-name', escapeHtml(pageName));
      li.innerHTML = `
        <div class="d-flex align-items-center justify-content-between px-3 py-2 page-name-row" data-page-name="${escapeHtml(pageName)}">
          <span class="page-name-text flex-grow-1">${escapeHtml(pageName)}</span>
          <div class="page-name-actions ms-2">
            <button class="btn btn-sm btn-outline-secondary edit-page-name-btn" type="button" data-page-name="${escapeHtml(pageName)}" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
           
          </div>
        </div>
        <div class="page-name-edit d-none px-3 py-2" data-page-name="${escapeHtml(pageName)}">
          <div class="input-group input-group-sm">
            <input type="text" class="form-control page-name-edit-input" value="${escapeHtml(pageName)}" data-original="${escapeHtml(pageName)}">
            <button class="btn btn-success save-page-name-btn" type="button" data-page-name="${escapeHtml(pageName)}">
              <i class="bi bi-check"></i>
            </button>
            <button class="btn btn-secondary cancel-page-name-edit-btn" type="button" data-page-name="${escapeHtml(pageName)}">
              <i class="bi bi-x"></i>
            </button>
          </div>
        </div>
      `;
      listEl.appendChild(li);
    });

    // Attach event listeners
    attachPageNameListeners(dropdownId);
    applyPageNameSearchFilter(dropdownId);
  }
//event listeners to page names---------------
  function attachPageNameListeners(dropdownId) {
    const isAdd = dropdownId === 'taskPageName';
    const listId = isAdd ? 'taskPageNameList' : 'editTaskPageNameList';
    const menuId = isAdd ? 'taskPageNameMenu' : 'editTaskPageNameMenu';
    const listEl = document.getElementById(listId);
    const menuEl = document.getElementById(menuId);
    if (!listEl || !menuEl) return;

    // Prevent dropdown from closing when clicking inside menu
    menuEl.addEventListener('click', function(e) {
      e.stopPropagation();
    });

    // Select page name
    listEl.querySelectorAll('.page-name-row').forEach(row => {
      row.addEventListener('click', function(e) {
        if (e.target.closest('.page-name-actions')) return;
        const pageName = this.getAttribute('data-page-name');
        selectPageName(dropdownId, pageName);
        const dropdown = bootstrap.Dropdown.getInstance(document.getElementById(isAdd ? 'taskPageNameBtn' : 'editTaskPageNameBtn'));
        if (dropdown) dropdown.hide();
      });
    });

    // Edit button
    listEl.querySelectorAll('.edit-page-name-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const pageName = this.getAttribute('data-page-name');
        showPageNameEdit(dropdownId, pageName);
      });
    });

    // Delete button
    listEl.querySelectorAll('.delete-page-name-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const pageName = this.getAttribute('data-page-name');
        deletePageName(dropdownId, pageName);
      });
    });

    // Save edit button
    listEl.querySelectorAll('.save-page-name-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const pageName = this.getAttribute('data-page-name');
        savePageNameEdit(dropdownId, pageName);
      });
    });

    // Cancel edit button
    listEl.querySelectorAll('.cancel-page-name-edit-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const pageName = this.getAttribute('data-page-name');
        cancelPageNameEdit(dropdownId, pageName);
      });
    });

    // Enter key in edit input
    listEl.querySelectorAll('.page-name-edit-input').forEach(input => {
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          const pageName = this.getAttribute('data-original');
          savePageNameEdit(dropdownId, pageName);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          const pageName = this.getAttribute('data-original');
          cancelPageNameEdit(dropdownId, pageName);
        }
      });
    });
  }

  function selectPageName(dropdownId, pageName) {
    const isAdd = dropdownId === 'taskPageName';
    const displayId = isAdd ? 'taskPageNameDisplay' : 'editTaskPageNameDisplay';
    const hiddenInputId = isAdd ? 'taskPageName' : 'editTaskPageName';
    
    const displayEl = document.getElementById(displayId);
    const hiddenInput = document.getElementById(hiddenInputId);
    
    if (displayEl) displayEl.textContent = pageName;
    if (hiddenInput) {
      hiddenInput.value = pageName;
      // Mark as valid
      hiddenInput.classList.remove('is-invalid');
      hiddenInput.classList.add('is-valid');
    }
  }
// showing input box when click on edit 
  function showPageNameEdit(dropdownId, pageName) {
    const isAdd = dropdownId === 'taskPageName';
    const listId = isAdd ? 'taskPageNameList' : 'editTaskPageNameList';
    const listEl = document.getElementById(listId);
    if (!listEl) return;

    const row = listEl.querySelector(`.page-name-row[data-page-name="${escapeHtml(pageName)}"]`);
    const editDiv = listEl.querySelector(`.page-name-edit[data-page-name="${escapeHtml(pageName)}"]`);
    const input = editDiv?.querySelector('.page-name-edit-input');

    if (row && editDiv && input) {
      row.classList.add('d-none');
      editDiv.classList.remove('d-none');
      input.focus();
      input.select();
    }
  }
//cancel page names----------------
  function cancelPageNameEdit(dropdownId, pageName) {
    const isAdd = dropdownId === 'taskPageName';
    const listId = isAdd ? 'taskPageNameList' : 'editTaskPageNameList';
    const listEl = document.getElementById(listId);
    if (!listEl) return;

    const row = listEl.querySelector(`.page-name-row[data-page-name="${escapeHtml(pageName)}"]`);
    const editDiv = listEl.querySelector(`.page-name-edit[data-page-name="${escapeHtml(pageName)}"]`);
    const input = editDiv?.querySelector('.page-name-edit-input');

    if (row && editDiv && input) {
      input.value = pageName; // Reset to original
      row.classList.remove('d-none');
      editDiv.classList.add('d-none');
    }
  }
// save page names------------------
  function savePageNameEdit(dropdownId, oldPageName) {
    const isAdd = dropdownId === 'taskPageName';
    const listId = isAdd ? 'taskPageNameList' : 'editTaskPageNameList';
    const listEl = document.getElementById(listId);
    if (!listEl) return;

    const editDiv = listEl.querySelector(`.page-name-edit[data-page-name="${escapeHtml(oldPageName)}"]`);
    const input = editDiv?.querySelector('.page-name-edit-input');
    if (!input) return;

    const newPageName = input.value.trim();
    if (!newPageName) {
      alert('Page name cannot be empty');
      return;
    }

    if (newPageName === oldPageName) {
      cancelPageNameEdit(dropdownId, oldPageName);
      return;
    }

    if (pageNames.has(newPageName)) {
      alert('Page name already exists!');
      input.focus();
      return;
    }

    // Update in set
    pageNames.delete(oldPageName);
    pageNames.add(newPageName);

    // Update selected value if it was the old one
    const hiddenInputId = isAdd ? 'taskPageName' : 'editTaskPageName';
    const hiddenInput = document.getElementById(hiddenInputId);
    if (hiddenInput && hiddenInput.value === oldPageName) {
      selectPageName(dropdownId, newPageName);
    } else if (hiddenInput) {
      // Even if it wasn't selected, mark it as valid if it has the old value
      if (hiddenInput.value === oldPageName) {
        hiddenInput.value = newPageName;
        hiddenInput.classList.remove('is-invalid');
        hiddenInput.classList.add('is-valid');
      }
    }

    // Refresh both dropdowns
    updatePageNameDropdowns();
    
    toastr.success('Page name updated successfully!', '', { timeOut: 2000 });
  }
// delete the page names---------------------
  // function deletePageName(dropdownId, pageName) {
  //   if (!confirm(`Are you sure you want to delete "${pageName}"? This will remove it from the list but won't affect existing tasks.`)) {
  //     return;
  //   }

  //   pageNames.delete(pageName);
    
  //   // Clear selection if this was selected
  //   const isAdd = dropdownId === 'taskPageName';
  //   const hiddenInputId = isAdd ? 'taskPageName' : 'editTaskPageName';
  //   const displayId = isAdd ? 'taskPageNameDisplay' : 'editTaskPageNameDisplay';
  //   const hiddenInput = document.getElementById(hiddenInputId);
  //   const displayEl = document.getElementById(displayId);
    
  //   if (hiddenInput && hiddenInput.value === pageName) {
  //     hiddenInput.value = '';
  //     if (displayEl) displayEl.textContent = 'Select or add page name';
  //   }

  //   // Refresh both dropdowns
  //   updatePageNameDropdowns();
    
  //   toastr.success('Page name deleted successfully!', '', { timeOut: 2000 });
  // }

// function applyPageNameSearchFilter(dropdownId) {
//   const isAdd = dropdownId === 'taskPageName';
//   const searchId = isAdd ? 'taskPageNameSearch' : 'editTaskPageNameSearch';
//   const listId = isAdd ? 'taskPageNameList' : 'editTaskPageNameList';

//   const searchInput = document.getElementById(searchId);
//   const listEl = document.getElementById(listId);
//   if (!searchInput || !listEl) return;

//   // Reuse or create "No page name found" element
//   let noResultEl = listEl.querySelector('.no-page-found');
//   if (!noResultEl) {
//     noResultEl = document.createElement('li');
//     noResultEl.className = 'no-page-found text-center  py-2 small';
//     noResultEl.textContent = 'No page name found';
//     noResultEl.style.color = '#000'; // ✅ Black text

//     noResultEl.style.display = 'none';
//     listEl.appendChild(noResultEl);
//   }

//   searchInput.addEventListener('input', function () {
//     const searchTerm = this.value.toLowerCase().trim();
//     const items = listEl.querySelectorAll('.page-name-item');
//     let visibleCount = 0;

//     items.forEach(item => {
//       const pageName = item.getAttribute('data-page-name') || '';
//       const matches = !searchTerm || pageName.toLowerCase().includes(searchTerm);
//       item.style.display = matches ? '' : 'none';
//       if (matches) visibleCount++;
//     });

//     // ✅ Show "No page name found" if nothing matches
//     noResultEl.style.display = visibleCount === 0 ? '' : 'none';
//   });
// }


function applyPageNameSearchFilter(dropdownId) {
  const isAdd = dropdownId === 'taskPageName';
  const searchId = isAdd ? 'taskPageNameSearch' : 'editTaskPageNameSearch';
  const listId = isAdd ? 'taskPageNameList' : 'editTaskPageNameList';

  const searchInput = document.getElementById(searchId);
  const listEl = document.getElementById(listId);
  if (!searchInput || !listEl) return;

  // Create "No page name found" element if it doesn't exist
  let noResultEl = listEl.querySelector('.no-page-found');
  if (!noResultEl) {
    noResultEl = document.createElement('li');
    noResultEl.className = 'no-page-found text-center py-2 small';
    noResultEl.textContent = 'No page name found';
    noResultEl.style.color = '#000'; // black text
    noResultEl.style.display = 'none';
    listEl.appendChild(noResultEl);
  }

  // Clear search input and reset list when dropdown opens
  const dropdownToggle = document.getElementById(dropdownId);
  if (dropdownToggle) {
    dropdownToggle.addEventListener('shown.bs.dropdown', function() {
      searchInput.value = '';
      searchInput.classList.remove('is-invalid', 'is-valid'); // remove red/green border
      updatePageNameDropdown(dropdownId); // repopulate list
      noResultEl.style.display = 'none'; // hide "No page name found"
    });
  }

  // Filter items as user types
  searchInput.addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase().trim();
    const items = listEl.querySelectorAll('.page-name-item');
    let visibleCount = 0;

    items.forEach(item => {
      const pageName = item.getAttribute('data-page-name') || '';
      const matches = !searchTerm || pageName.toLowerCase().includes(searchTerm);
      item.style.display = matches ? '' : 'none';
      if (matches) visibleCount++;
    });

    // Show "No page name found" if nothing matches
    noResultEl.style.display = visibleCount === 0 ? '' : 'none';
  });
}


function addNewPageName(dropdownId) {
    const modalEl = document.getElementById('pageNameModal');
    const inputEl = document.getElementById('pageNameInput');
    const errorEl = document.getElementById('pageNameError');
    const saveBtn = document.getElementById('savePageNameBtn');
 
    // Fallback prompt if modal missing
    if (!modalEl || !inputEl || !saveBtn) {
      const newPageName = prompt('Enter new page name:');
      if (newPageName && newPageName.trim()) {
        const trimmedName = newPageName.trim();
        if (!pageNames.has(trimmedName)) {
          pageNames.add(trimmedName);
          updatePageNameDropdowns();
          selectPageName(dropdownId, trimmedName);
        } else {
          alert('Page name already exists!');
        }
      }
      return;
    }
 
    pendingPageNameTarget = dropdownId;
    inputEl.value = '';
    inputEl.classList.remove('is-invalid', 'is-valid');
    if (errorEl) errorEl.style.display = '';
 
    const modal = new bootstrap.Modal(modalEl);
 
    // ✅ Live validation on input
    function validateInput() {
      const value = (inputEl.value || '').trim();
 
      if (!value) {
        inputEl.classList.add('is-invalid');
        inputEl.classList.remove('is-valid');
        if (errorEl) errorEl.textContent = 'Enter a page name.';
        return false;
      }
 
      if (pageNames.has(value)) {
        inputEl.classList.add('is-invalid');
        inputEl.classList.remove('is-valid');
        if (errorEl) errorEl.textContent = 'Page name already exists!';
        return false;
      }
 
      inputEl.classList.add('is-valid');
      inputEl.classList.remove('is-invalid');
      if (errorEl) errorEl.textContent = '';
      return true;
    }
 
    function attemptSave() {
      if (!validateInput()) return;
 
      const value = inputEl.value.trim();
      pageNames.add(value);
      updatePageNameDropdowns();
      if (pendingPageNameTarget) {
        selectPageName(pendingPageNameTarget, value);
      }
      modal.hide();
    }
 
    // Event listeners
    const handleSaveClick = () => attemptSave();
    const handleKeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        attemptSave();
      }
    };
    const handleHidden = () => {
      saveBtn.removeEventListener('click', handleSaveClick);
      inputEl.removeEventListener('keydown', handleKeydown);
      inputEl.removeEventListener('input', validateInput);
      modalEl.removeEventListener('hidden.bs.modal', handleHidden);
      pendingPageNameTarget = null;
    };
 
    saveBtn.addEventListener('click', handleSaveClick);
    inputEl.addEventListener('keydown', handleKeydown);
    inputEl.addEventListener('input', validateInput); // ✅ live validation added
    modalEl.addEventListener('hidden.bs.modal', handleHidden);
 
    modal.show();
    setTimeout(() => { try { inputEl.focus(); } catch (e) {} }, 150);
}
 
// 2. Auto-scroll to latest comment after loading
function loadModalComments(taskId, assigneeId) {
  commentModalTaskId = taskId;
  fetch(`/tasks/${taskId}/view/`)
    .then(response => response.json())
    .then(data => {
      const commentsList = document.getElementById('commentModalList');
      if (data.comments && data.comments.length > 0) {
        // Filter comments based on assigneeId
        const filteredComments = data.comments.filter(comment => {
          // If comment has a target_assignee_id, show only if it matches current assignee
          if (comment.target_assignee_id) {
            return comment.target_assignee_id === assigneeId;
          }
          return true; // normal comments
        });

        commentsList.innerHTML = filteredComments.map(comment => {
          const isMine = (comment.user__username || '') === currentUsername;
          const sideClass = isMine ? 'mine' : 'other';
          let formattedTime = '';
          if (comment.created_at) {
            const d = new Date(comment.created_at);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            formattedTime = `${day}-${month}-${year} ${hours}:${minutes}`;
          }
          return `
            <div class="comment-item ${sideClass}">
              <div class="comment-meta">${escapeHtml(comment.user__username)} · ${formattedTime}</div>
              <div class="comment-text">${escapeHtml(comment.content)}</div>
            </div>
          `;
        }).join('');

        // Auto-scroll to bottom
        commentsList.scrollTop = commentsList.scrollHeight;
      } else {
        commentsList.innerHTML = '<p class="text-muted">No comments yet.</p>';
      }
    })
    .catch(error => {
      console.error('Error loading comments:', error);
      document.getElementById('commentModalList').innerHTML = '<p class="text-danger">Error loading comments.</p>';
    });
}



 function openCommentModal(taskId, assigneeId) {
    loadModalComments(taskId, assigneeId); // Pass assigneeId here
    const modal = new bootstrap.Modal(document.getElementById('commentModal'));
    modal.show();
    
    // Mark task notifications as read when opening comment modal
    fetch(`/notifications/task/${taskId}/count/`)
      .then(response => response.json())
      .then(data => {
        if (data.count > 0) {
          const commentBtn = document.querySelector(`.comment-task[data-task-id="${taskId}"]`);
          if (commentBtn) {
            const badge = commentBtn.querySelector('.notification-badge');
            if (badge) {
              badge.style.display = 'none';
            }
          }
        }
      })
      .catch(error => console.error('Error checking task notifications:', error));
}


  // Bind existing comment buttons
  document.querySelectorAll('.comment-task').forEach(btn => {
    btn.addEventListener('click', function() {
      const taskId = this.dataset.taskId;
      openCommentModal(taskId);
    });
  });

  const commentModalContent = document.getElementById('commentModalContent');
    if (commentModalContent) {
      commentModalContent.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          commentModalForm.requestSubmit();
        }
      });
}

  // Submit comment from modal
  const commentModalForm = document.getElementById('commentModalForm');
  if (commentModalForm) {
    commentModalForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const content = document.getElementById('commentModalContent').value.trim();
      if (!content || !commentModalTaskId) return;
      fetch('/comments/add/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({ content: content, task_id: commentModalTaskId })
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          document.getElementById('commentModalContent').value = '';
          loadModalComments(commentModalTaskId);
          // Update notification badges after adding comment
        } else {
          alert('Error adding comment: ' + (data.error || 'Unknown error'));
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error adding comment');
      });
    });
  }

  // Daily Status API functions
  function loadDailyStatusProjects() {
    fetch('/api/daily-status/projects/')
      .then(res => res.json())
      .then(data => {
        const projectSelect = document.getElementById('dailyStatusProject');
        if (projectSelect) {
          projectSelect.innerHTML = '<option value="">Select Project</option>' +
            data.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        }
      })
      .catch(error => console.error('Error loading projects:', error));
  }


  // Daily Status modal form submission
  function handleDailyStatusModalSubmit(e) {
    e.preventDefault();
    
    const projectSelect = document.getElementById('modalDailyStatusProject');
    const statusTextarea = document.getElementById('modalDailyStatusText');
    const projectId = projectSelect.value;
    const statusText = statusTextarea.value.trim();
    const today = new Date().toISOString().split('T')[0];

    // Reset validation states
    projectSelect.classList.remove('is-invalid', 'is-valid');
    statusTextarea.classList.remove('is-invalid', 'is-valid');

    let isValid = true;

    // Validate project selection
    if (!projectId) {
      projectSelect.classList.add('is-invalid');
      projectSelect.classList.remove('is-valid');
      isValid = false;
    } else {
      projectSelect.classList.add('is-valid');
      projectSelect.classList.remove('is-invalid');
    }

    // Validate status text
    if (!statusText) {
      statusTextarea.classList.add('is-invalid');
      statusTextarea.classList.remove('is-valid');
      isValid = false;
    } else if (statusText.length < 10) {
      statusTextarea.classList.add('is-invalid');
      statusTextarea.classList.remove('is-valid');
      statusTextarea.nextElementSibling.textContent = 'Status must be at least 10 characters long.';
      isValid = false;
    } else {
      statusTextarea.classList.add('is-valid');
      statusTextarea.classList.remove('is-invalid');
    }

    if (!isValid) {
      return;
    }

    fetch('/api/daily-status/create/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken')
      },
      body: JSON.stringify({ 
        project_id: projectId, 
        status_text: statusText, 
        date: today 
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        toastr.success('Daily status submitted successfully!', 'Success', {
          timeOut: 3000,
          closeButton: true,
          progressBar: true
        });
        document.getElementById('dailyStatusModalForm').reset();
        // Reset validation states
        projectSelect.classList.remove('is-invalid', 'is-valid');
        statusTextarea.classList.remove('is-invalid', 'is-valid');
        bootstrap.Modal.getInstance(document.getElementById('dailyStatusModal')).hide();
      } else {
        toastr.error('Failed to submit daily status: ' + (data.error || 'Unknown error'), 'Error', {
          timeOut: 5000,
          closeButton: true,
          progressBar: true
        });
      }
    })
    .catch(error => {
      console.error('Error submitting daily status:', error);
      toastr.error('An error occurred while submitting the daily status.', 'Error', {
        timeOut: 5000,
        closeButton: true,
        progressBar: true
      });
    });
  }

  // Get CSRF token from cookie
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // Function to apply all filters
  function applyFilters() {
    const searchTerm = document.getElementById("taskSearch").value;
    const projectFilter = document.getElementById("projectFilter").value;
    const statusFilter = document.getElementById("statusFilter").value;
    const priorityFilter = document.getElementById("priorityFilter").value;
    const assigneeFilter = document.getElementById("assigneeFilter").value;
    const sortValue = document.getElementById("sortTasks").value;

    // Build the URL with filter parameters
    let url = window.location.pathname;
    const params = new URLSearchParams();

    if (searchTerm) params.append("search", searchTerm);
    if (projectFilter) params.append("project", projectFilter);
    if (statusFilter) params.append("status", statusFilter);
    if (priorityFilter) params.append("priority", priorityFilter);
    if (assigneeFilter) params.append("assignee", assigneeFilter);
    if (sortValue) params.append("sort", sortValue);

    // Update the URL with the new parameters
    const queryString = params.toString();
    if (queryString) {
      url += "?" + queryString;
    }

    // Reload the page with the new filters
    window.location.href = url;
  }

  // Function to reset filters
  function resetFilters() {
    // Clear all filter inputs
    document.getElementById("taskSearch").value = "";
    document.getElementById("projectFilter").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("priorityFilter").value = "";
    document.getElementById("assigneeFilter").value = "";

    // Reload the page without any filters
    window.location.href = window.location.pathname;
  }

  function resetFilterControlsToDefaults() {
    const searchInput = document.getElementById("taskSearch");
    if (searchInput) {
      searchInput.value = "";
      searchInput.style.borderColor = "";
      searchInput.style.boxShadow = "";
      searchInput.classList.remove("is-valid", "is-invalid");
    }

    ["projectFilter", "statusFilter", "priorityFilter", "assigneeFilter"].forEach(id => {
      const select = document.getElementById(id);
      if (select) {
        select.value = "";
        select.classList.remove("is-valid", "is-invalid");
      }
    });

    const sortSelect = document.getElementById("sortTasks");
    if (sortSelect) {
      sortSelect.value = "due_date";
      sortSelect.classList.remove("is-valid", "is-invalid");
    }
  }

  // Event listeners for all filters
  document.getElementById("taskSearch").addEventListener("input", function () {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(applyFilters, 500);
  });

  // Add focus/blur event listeners for better UX
  document.getElementById("taskSearch").addEventListener("focus", function () {
    this.style.borderColor = '#0d6efd';
    this.style.boxShadow = '0 0 0 0.2rem rgba(13, 110, 253, 0.25)';
  });

  document.getElementById("taskSearch").addEventListener("blur", function () {
    if (!this.value) {
      this.style.borderColor = '';
      this.style.boxShadow = '';
    }
  });

  document
    .getElementById("projectFilter")
    .addEventListener("change", applyFilters);
  document
    .getElementById("statusFilter")
    .addEventListener("change", applyFilters);
  document
    .getElementById("priorityFilter")
    .addEventListener("change", applyFilters);
  document
    .getElementById("assigneeFilter")
    .addEventListener("change", applyFilters);
  document
    .getElementById("resetFilters")
    .addEventListener("click", resetFilters);

  // Initialize filters with current values
  document.addEventListener("DOMContentLoaded", function () {
    // Always hide the "No tasks" row immediately to prevent any flicker on first paint
    (function hideEmptyRowEarly() {
      try {
        const noRowEarly = document.getElementById('noTasksRow');
        if (noRowEarly) noRowEarly.style.display = 'none';
      } catch (_) {}
    })();
    resetFilterControlsToDefaults();

    const urlParams = new URLSearchParams(window.location.search);

    const setValueIfPresent = (id, value, fallback = "") => {
      const el = document.getElementById(id);
      if (el) {
        el.value = value || fallback;
      }
    };

    setValueIfPresent("taskSearch", urlParams.get("search"));
    setValueIfPresent("projectFilter", urlParams.get("project"));
    setValueIfPresent("statusFilter", urlParams.get("status"));
    setValueIfPresent("priorityFilter", urlParams.get("priority"));
    setValueIfPresent("assigneeFilter", urlParams.get("assignee"));
    setValueIfPresent("sortTasks", urlParams.get("sort"), "due_date");

    // Clean the URL so future reloads always hit the base task list
    if (window.location.search && window.location.search.length > 1) {
      history.replaceState(null, "", window.location.pathname);
    }

    // Restore focus to search input if it has a value (user was searching)
    const searchInput = document.getElementById("taskSearch");
    if (searchInput && searchInput.value) {
      searchInput.focus();
      // Position cursor at the end of the text
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }

    // Add visual feedback for active search
    if (searchInput && searchInput.value) {
      searchInput.style.borderColor = '#0d6efd';
      searchInput.style.boxShadow = '0 0 0 0.2rem rgba(13, 110, 253, 0.25)';
    }

    // After initial UI setup, determine if we should show the empty-row (no tasks) message
    // This runs regardless of filters to avoid any transient display of the empty row.
    setTimeout(() => {
      try { checkAndShowNoTasksRow(); } catch (_) {}
    }, 0);

    // Initialize Daily Status functionality
    loadDailyStatusProjects();
    
    // Update comment notification badges
    // Apply simple client-side URL-driven filters as a fallback (overdue and status)
    try {
      const overdueFlag = urlParams.get('overdue');
      const statusParam = urlParams.get('status');
      const tableBody = document.getElementById('taskList');
      if (tableBody) {
        const rows = Array.from(tableBody.querySelectorAll('tr[data-task-id]'));
        // If overdue=1, show only rows whose due-date badge is danger
        if (overdueFlag === '1') {
          rows.forEach(tr => {
            const dueBadge = tr.querySelector('td:nth-child(6) .badge');
            const isOverdue = dueBadge && dueBadge.classList.contains('bg-danger');
            tr.style.display = isOverdue ? '' : 'none';
          });
        }
        // If status param provided (e.g., Done), filter rows client-side if needed
        if (statusParam) {
          rows.forEach(tr => {
            const statusBadge = tr.querySelector('td:nth-child(7) .badge');
            const statusText = statusBadge ? statusBadge.textContent.trim() : '';
            if (statusText && statusText !== statusParam) {
              tr.style.display = 'none';
            }
          });
        }
        // After any client-side filtering based on URL, show "No records found" if nothing visible
        // Only perform this if a filter was actually applied
        if (overdueFlag === '1' || !!statusParam) {
          setTimeout(() => {
            const hasVisible = rows.some(tr => tr.style.display !== 'none');
            const noRow = document.getElementById('noTasksRow');
            if (noRow) {
              if (!hasVisible) {
                noRow.style.display = 'table-row';
                const cell = noRow.querySelector('td');
                if (cell) cell.textContent = 'No Tasks found';
              } else {
                noRow.style.display = 'none';
              }
            }
          }, 0);
        }
      }
    } catch (e) { console.warn('Client-side URL filter failed', e); }
    
    // If search is present and no rows, show "No records found"
    try {
      const hasSearch = urlParams.get('search');
      const tableBody = document.getElementById('taskList');
      const rows = tableBody ? Array.from(tableBody.querySelectorAll('tr[data-task-id]')) : [];
      if (hasSearch && rows.length === 0) {
        const noRow = document.getElementById('noTasksRow');
        if (noRow) {
          noRow.style.display = 'table-row';
          const cell = noRow.querySelector('td');
          if (cell) cell.textContent = 'No Tasks found';
        }
      }
    } catch (_) {}

    // Daily Status modal form event listeners
    const dailyStatusModalForm = document.getElementById('dailyStatusModalForm');
    if (dailyStatusModalForm) {
      dailyStatusModalForm.addEventListener('submit', handleDailyStatusModalSubmit);
    }

    // Daily Status live validation
    const modalDailyStatusProject = document.getElementById('modalDailyStatusProject');
    const modalDailyStatusText = document.getElementById('modalDailyStatusText');

    if (modalDailyStatusProject) {
      modalDailyStatusProject.addEventListener('change', function() {
        if (this.value) {
          this.classList.add('is-valid');
          this.classList.remove('is-invalid');
        } else {
          this.classList.add('is-invalid');
          this.classList.remove('is-valid');
        }
      });
    }

    if (modalDailyStatusText) {
      modalDailyStatusText.addEventListener('input', function() {
        const value = this.value.trim();
        if (value.length === 0) {
          this.classList.add('is-invalid');
          this.classList.remove('is-valid');
        } else if (value.length < 10) {
          this.classList.add('is-invalid');
          this.classList.remove('is-valid');
          this.nextElementSibling.textContent = 'Status must be at least 10 characters long.';
        } else {
          this.classList.add('is-valid');
          this.classList.remove('is-invalid');
        }
      });

      // Add Enter key support for textarea
      modalDailyStatusText.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          dailyStatusModalForm.requestSubmit();
        }
      });
    }

    // Reset validation when modal is closed
    const dailyStatusModal = document.getElementById('dailyStatusModal');
    if (dailyStatusModal) {
      dailyStatusModal.addEventListener('hidden.bs.modal', function() {
        // Reset form and validation states
        dailyStatusModalForm.reset();
        modalDailyStatusProject.classList.remove('is-invalid', 'is-valid');
        modalDailyStatusText.classList.remove('is-invalid', 'is-valid');
        // Reset error message
        if (modalDailyStatusText.nextElementSibling) {
          modalDailyStatusText.nextElementSibling.textContent = 'Please describe your daily work status.';
        }
      });
    }


    let role = localStorage.getItem("role");
    console.log("role:", role);

    if (role === "Manager" || role === "Team Lead") {
      const addProjectHeader = document.querySelector("#addtask1");

      if (addProjectHeader) {
        addProjectHeader.style.display = "block";
        console.log("Add Project section is visible");
      } else {
        console.error("Element with ID 'addproject1' not found");
      }
    }

    // --- Add Task Modal/Modal Switching Logic ---
  const addTaskModalEl = document.getElementById('addTaskModal');
  const addTaskBtn = document.getElementById("addtask1");
  const editTaskModalEl = document.getElementById("editTaskModal");

  // Handle Add Task button click
  if (addTaskBtn) {
    addTaskBtn.addEventListener("click", function () {
      // Hide Edit Modal if open
      if (editTaskModalEl && editTaskModalEl.classList.contains("show")) {
        bootstrap.Modal.getInstance(editTaskModalEl).hide();
      }

      // Clean any previous backdrops manually before showing
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

      // Show Add Task Modal
      const addTaskModal = new bootstrap.Modal(addTaskModalEl);
      addTaskModal.show();
    });
  }

  // Handle backdrop + scroll cleanup when Add Task modal is closed
  if (addTaskModalEl) {
    addTaskModalEl.addEventListener('hidden.bs.modal', function () {
      // Reset form fields when modal is closed
      const form = addTaskModalEl.querySelector('form');
      if (form) form.reset();

      setTimeout(() => {
        const openModals = document.querySelectorAll('.modal.show');
        if (openModals.length === 0) {
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
          document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
        }
      }, 300); // Bootstrap fade duration
    });
  }

    // --- Edit Task Modal Date Constraints ---
    const today = new Date().toISOString().split("T")[0];
    const editTaskStartDate = document.getElementById("editTaskStartDate");
    const editTaskDueDate = document.getElementById("editTaskDueDate");
    // Set min attributes to today for edit modal fields
    if (editTaskStartDate) editTaskStartDate.setAttribute("min", today);
    if (editTaskDueDate) editTaskDueDate.setAttribute("min", today);
    // When start date changes, update due date min
    if (editTaskStartDate && editTaskDueDate) {
      editTaskStartDate.addEventListener("change", function () {
        if (this.value) {
          editTaskDueDate.min = this.value > today ? this.value : today;
          if (editTaskDueDate.value < editTaskDueDate.min) {
            editTaskDueDate.value = "";
          }
        } else {
          editTaskDueDate.min = today;
        }
      });
    }
    // When the edit modal is shown, re-apply min attributes
    if (editTaskModalEl) {
      editTaskModalEl.addEventListener('shown.bs.modal', function () {
        if (editTaskStartDate) editTaskStartDate.setAttribute("min", today);
        if (editTaskDueDate) {
          const startDateVal = editTaskStartDate.value;
          editTaskDueDate.setAttribute("min", startDateVal && startDateVal > today ? startDateVal : today);
        }
      });
    }
  });

  // View switching functionality
  const listViewBtnEl = document.getElementById("listViewBtn");
  if (listViewBtnEl) listViewBtnEl.addEventListener("click", function () {
    document.getElementById("listView").style.display = "block";
    document.getElementById("kanbanView").style.display = "none";
    document.getElementById("calendarView").style.display = "none";

    // Update active button
    document
      .querySelectorAll(".btn-group .btn")
      .forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");
  });

  const kanbanViewBtnEl = document.getElementById("kanbanViewBtn");
  if (kanbanViewBtnEl) kanbanViewBtnEl.addEventListener("click", function () {
      document.getElementById("listView").style.display = "none";
      document.getElementById("kanbanView").style.display = "block";
      document.getElementById("calendarView").style.display = "none";

      // Update active button
      document
        .querySelectorAll(".btn-group .btn")
        .forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");
      
      // Update kanban counts when switching to kanban view
      updateKanbanCounts();
    });

  const calendarViewBtnEl = document.getElementById("calendarViewBtn");
  if (calendarViewBtnEl) calendarViewBtnEl.addEventListener("click", function () {
      document.getElementById("listView").style.display = "none";
      document.getElementById("kanbanView").style.display = "none";
      document.getElementById("calendarView").style.display = "block";

      // Update active button
      document
        .querySelectorAll(".btn-group .btn")
        .forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      // Initialize calendar if not already initialized
      if (!window.calendarInitialized) {
        initializeCalendar();
        window.calendarInitialized = true;
      }
    });

  // Initialize FullCalendar
  function initializeCalendar() {
    const calendarEl = document.getElementById("taskCalendar");

    // Fetch task data from the API
    fetch("/api/tasks/") // This URL is correct as it matches the TaskListView API
      .then((response) => response.json()) // Convert response to JSON
      .then((data) => {
        // Prepare events array for FullCalendar
        const events = data.map((task) => ({
          id: String(task.id),
          title: task.title,
          start: task.start_date, // Use start_date from the API
          end: task.due_date, // Use due_date from the API (optional, if you have it)
          color: getTaskStatusColor(task.status), // Use task status to set color
          description: task.description, // Optional, use task description if you need it
          status: task.status, // Optional, use task status if you need it
        }));

        // Initialize FullCalendar
        const calendar = new FullCalendar.Calendar(calendarEl, {
          initialView: "dayGridMonth",
          headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          },
          events: events, // Set events with fetched task data
          eventClick: function (info) {
            // Display task details in a Bootstrap modal
            showTaskDetailsModal(info.event);
          },
        });
        calendar.render();
        // expose calendar instance so other code can update events dynamically
        try { window.taskCalendar = calendar; } catch (e) { console.error('Could not set global calendar', e); }
      })
      .catch((error) => {
        console.error("Error fetching tasks:", error); // Handle fetch error
      });
  }

  // Helper function to map task status to a color
  function getTaskStatusColor(status) {
    switch (status) {
      case "To-do":
        return "#6c757d";
      case "In Progress":
        return "#ffc107";
      case "Review":
        return "#00FFFF"; // Purple (for tasks that are under review)
      case "Done":
        return "#28a745"; // Green (for completed tasks)
      default:
        return "#000000"; // Default color (black) if no status
    }
  }

  // Function to show task details in the modal
  function showTaskDetailsModal(task) {
    // Populate task details in the modal
    document.getElementById("taskTitle1").innerText = task.title;
    console.log(task.title);
    document.getElementById("taskStartDate1").innerText =
      task.start.toLocaleDateString();
    console.log(task.start.toLocaleDateString());
    document.getElementById("taskEndDate1").innerText = task.end
      ? task.end.toLocaleDateString()
      : "N/A";
    console.log(task.end.toLocaleDateString());
    document.getElementById("taskDescription1").innerText =
      task.extendedProps.description || "No description available";
    console.log("task.extendedProps.description ");
    document.getElementById("taskStatus1").innerText =
      task.extendedProps.status;

    // Show the task details modal (Bootstrap)
    $("#taskModal").modal("show");
  }

// Get form and modal elements
const addTaskForm = document.getElementById("addTaskForm");
const addTaskModalEl = document.getElementById("addTaskModal");
const saveTaskBtn = document.getElementById("saveTaskBtn");

// Function to validate a single field
function validateField(field) {
    if (!field.value || field.value.trim() === "") {
        field.classList.add("is-invalid");
        field.classList.remove("is-valid");
    } else {
        field.classList.remove("is-invalid");
        field.classList.add("is-valid");
    }
}

// Attach live validation on input/change for all fields
addTaskForm.querySelectorAll("input, select, textarea").forEach(field => {
    field.addEventListener("input", () => validateField(field));
    if (field.tagName === "SELECT") {
        field.addEventListener("change", () => validateField(field));
    }
});
// Task Title live validation for special characters
const taskTitle = document.getElementById("taskTitle");
if (taskTitle) {
    taskTitle.addEventListener("input", function() {
        const value = this.value.trim();
        const errorElement = this.nextElementSibling;

        // Regex: allow letters, numbers, spaces, hyphens, parentheses only
        const validPattern = /^[a-zA-Z0-9\s\-().]+$/;

        if (value === "") {
            // Show required error when cleared
            this.classList.add("is-invalid");
            this.classList.remove("is-valid");
            if (errorElement) errorElement.textContent = "Task title is required.";
            return;
        }
        if (!validPattern.test(value)) {
          this.classList.add("is-invalid");
          this.classList.remove("is-valid");
          if (errorElement) errorElement.textContent = "Task title can only contain letters, numbers, spaces, hyphens, and parentheses and dots.";
          return;
      }

        // Check length (min 3, max 150)
        if (value.length < 3) {
            this.classList.add("is-invalid");
            this.classList.remove("is-valid");
            if (errorElement) errorElement.textContent = "Task title must be at least 3 characters long.";
            return;
        }

        if (value.length > 150) {
            this.classList.add("is-invalid");
            this.classList.remove("is-valid");
            if (errorElement) errorElement.textContent = "Task title cannot exceed 150 characters.";
            return;
        }

        // Check allowed characters
   

        // If all validations pass
        this.classList.remove("is-invalid");
        this.classList.add("is-valid");
        if (errorElement) errorElement.textContent = "";
    });
}


// Reset form and validation
function resetAddTaskForm() {
    addTaskForm.reset();
    addTaskForm.classList.remove("was-validated");
    addTaskForm.querySelectorAll("input, select, textarea").forEach(field => {
        field.classList.remove("is-valid", "is-invalid");
    });
}

// Reset when modal closes (click outside, ESC, or Cancel button)
addTaskModalEl.addEventListener("hidden.bs.modal", resetAddTaskForm);
addTaskModalEl.querySelector(".btn-secondary").addEventListener("click", resetAddTaskForm);



  // Add task functionality
document.getElementById("saveTaskBtn").addEventListener("click", function () {
    const form = document.getElementById("addTaskForm");
    const formData = new FormData(form);
    const data = {};
    let valid = true;
    
    // Validate required fields
    form.querySelectorAll("input[required], select[required]").forEach(field => {
        if (!field.value || field.value.trim() === "") {
            field.classList.add("is-invalid");
            valid = false;
        } else {
            field.classList.remove("is-invalid");
            field.classList.add("is-valid");
        }
    });
    
    // Validate task title
    const taskTitleField = document.getElementById("taskTitle");
if (taskTitleField) {
    const titleValue = taskTitleField.value.trim();

    // Check if empty first
    if (titleValue === "") {
        taskTitleField.classList.add("is-invalid");
        taskTitleField.nextElementSibling.textContent = "Task title is required.";
        valid = false;
    } 
    else if (titleValue.length < 3) {
        taskTitleField.classList.add("is-invalid");
        taskTitleField.nextElementSibling.textContent = "Task title must be at least 3 characters long.";
        valid = false;
    } 
    else if (titleValue.length > 150) {
        taskTitleField.classList.add("is-invalid");
        taskTitleField.nextElementSibling.textContent = "Task title cannot exceed 150 characters.";
        valid = false;
    } 
    else {
        const validPattern = /^[a-zA-Z0-9\s\-().]+$/;
        if (!validPattern.test(titleValue)) {
            taskTitleField.classList.add("is-invalid");
            taskTitleField.nextElementSibling.textContent =
                "Task title can only contain letters, numbers, spaces, hyphens, and parentheses and dots.";
            valid = false;
        } else {
            // ✅ Passed all checks
            taskTitleField.classList.remove("is-invalid");
            taskTitleField.classList.add("is-valid");
            taskTitleField.nextElementSibling.textContent = "";
        }
    }
}

    
    if (!valid) return;

    // Create a task data object to store with the row
    const taskData = {};
    formData.forEach((value, key) => {
      taskData[key] = value;
    });

  // Prepare task data for saving and display
  for (let [key, value] of formData.entries()) {
    if ((key === "start_date" || key === "due_date") && !value) {
      taskData[key] = null;
    } else {
      taskData[key] = value;
    }
  }

  // Get project and assignee names before sending
  const projectSelect = document.getElementById('taskProject');
  const projectOptionEl = document.querySelector(`#taskProject option[value="${formData.get("project")}"]`);
  const rawProjectText = projectOptionEl ? projectOptionEl.textContent : '';
  const projectName = rawProjectText.replace(/^[^A-Za-z0-9]+\s*/, '');

  const assigneeSelect = document.getElementById('taskAssignee');
  const selTextRaw = projectSelect.options[projectSelect.selectedIndex]?.text || '';
  taskData.project_name = selTextRaw.replace(/^[^A-Za-z0-9]+\s*/, '');
  taskData.assigned_to_name = assigneeSelect.options[assigneeSelect.selectedIndex]?.text || '';

  fetch('/tasks/add/', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
    },
    body: JSON.stringify(taskData)
  })
  .then((response) => response.json())
  .then((responseData) => {
      // Handle error responses (including duplicate task title)
      if (!responseData.success) {
          toastr.error(responseData.error || 'Failed to create task', 'Error', {
              timeOut: 5000,
              closeButton: true,
              progressBar: true
          });
          
          // Highlight task title field if it's a validation error
          if (responseData.error && (responseData.error.includes('title') || responseData.error.includes('Task title'))) {
              const taskTitleField = document.getElementById("taskTitle");
              if (taskTitleField) {
                  taskTitleField.classList.add("is-invalid");
                  if (taskTitleField.nextElementSibling) {
                      taskTitleField.nextElementSibling.textContent = responseData.error;
                  }
              }
          }
          return;
      }
   
      // Merge the server response data with our task data
    if (responseData.success) {
      // Merge the server response data with our task data
      Object.assign(taskData, {
        id: responseData.task_id,
        created_at: new Date().toISOString()
      });

      // Show success message
      toastr.success('Task added successfully!', 'Success', {
        timeOut: 3000,
        closeButton: true,
        progressBar: true
      });

      
      // Add new page name to the set if it exists
      const pageName = formData.get("page_name");
      if (pageName && pageName.trim()) {
        pageNames.add(pageName.trim());
        updatePageNameDropdowns();
      }
      const noTasksRow = document.getElementById("noTasksRow");
      if (noTasksRow) {
          noTasksRow.style.display = "none";
      }
      const taskList = document.getElementById("taskList");
      const newRow = document.createElement("tr");
      newRow.setAttribute("data-task-id", responseData.task_id);
      taskData.id = responseData.task_id;

      
      // Store complete task data in the row
      const storedTaskData = {
        ...taskData,
        id: responseData.task_id,
        project_name: taskData.project_name,
        page_name: taskData.page_name,
        assigned_to_name: taskData.assigned_to_name
      };
      newRow.setAttribute("data-task", JSON.stringify(storedTaskData));
      
      // Persist role preference for this task for initial edit preselect
      const roleMatch = taskData.assigned_to_name.match(/\((.*?)\)\s*$/);
      if (roleMatch && roleMatch[1]) {
        try { 
          localStorage.setItem(`taskRole:${responseData.task_id}`, roleMatch[1]); 
        } catch (e) {
          console.error('Error storing role preference:', e);
        }
      }
            
            newRow.innerHTML = `
                <td style="max-width: 300px">
                    <div class="d-flex align-items-center">
                        <div class="text-truncate">
                            <h6 class="mb-0 text-truncate">${taskData.title}</h6>
                            Created: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                </td>
                <td>${taskData.project_name}</td>
                <td>
                  ${
                    taskData.page_name && taskData.page_name.trim()
                      ? `<span class="badge bg-info">${taskData.page_name}</span>`
                      : `<span class="text-muted">-</span>`
                  }
                </td>

                <td>
                  ${(() => {
                    if (!taskData.assigned_to_name || taskData.assigned_to_name === 'Unassigned') {
                      return `
                        <div>
                          <div class="d-flex align-items-center gap-2 text-muted">
                            <span class="fs-6">👤</span>
                            <span class="assignee-name">Unassigned</span>
                          </div>
                        </div>
                      `;
                    }
                    const roleMatch = taskData.assigned_to_name.match(/^(.+?)\s*\((.+?)\)\s*$/);
                    const name = roleMatch ? roleMatch[1].trim() : taskData.assigned_to_name;
                    const role = roleMatch ? roleMatch[2].trim() : null;
                    return `
                      <div>
                        <div class="d-flex align-items-center gap-2">
                          <span class="fs-6">👤</span>
                          <span class="assignee-name">${name}</span>
                        </div>
                        ${role ? `<div class="assignee-role">${role}</div>` : ''}
                      </div>
                    `;
                  })()}
                </td>
                <td>
                    ${taskData.start_date ? 
                        `<span class="badge bg-info">${new Date(taskData.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>` :
                        `<span class="badge bg-secondary">Not set</span>`
                    }
                </td>
                <td>
                    <span class="badge ${getDueDateBadgeClass(taskData.due_date)}">
                        ${new Date(taskData.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                </td>
                <td>
                    <span class="badge ${getStatusBadgeClass(taskData.status)}">
                        ${taskData.status}
                    </span>
                </td>
                <td>
                    <span class="badge ${getPriorityBadgeClass(taskData.priority)}">
                        ${taskData.priority}
                    </span>
                </td>
        <td>
          <div class="d-flex justify-content-center align-items-center" style="height:100%;">
          <button type="button" class="btn btn-sm btn-outline-secondary comment-task" data-task-id="${taskData.id}" data-bs-toggle="tooltip" title="Comment">
            <i class="bi bi-chat-dots"></i>
          </button>
          </div>
        </td>
            `;
            
      // Update comment button listener and row click behavior for the newly inserted row
      const commentBtn = newRow.querySelector('.comment-task');
      if (commentBtn) {
        commentBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          const tid = this.dataset.taskId;
          openCommentModal(tid);
        });
 
      }

    // Make the new row clickable to open view modal
    newRow.style.cursor = 'pointer';
    newRow.addEventListener('click', function(e) {
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.dropdown')) return;
    const tid = this.dataset.taskId;
    fetchAndShowViewModal(tid);
    });

    // Prepend the new row once handlers are attached
    taskList.prepend(newRow);


            // Create new card for kanban view
            const newCard = document.createElement("div");
            newCard.className = "card task-card mb-2";
            newCard.setAttribute("draggable", "true");
            newCard.setAttribute("data-task-id", data.task_id);
            newCard.innerHTML = `
                <div class="card-body p-2">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0 text-truncate">${formData.get("title")}</h6>
                        <span class="badge ${getPriorityBadgeClass(formData.get("priority"))}">
                            ${formData.get("priority")}
                        </span>
                    </div>
                    <p class="card-text">${projectName}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        Due: ${new Date(formData.get("due_date")).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                </div>
            `;

            // Add drag event listeners to the new card
            newCard.addEventListener("dragstart", drag);
            newCard.addEventListener("dragend", dragEnd);

            // Add to the correct kanban column
            const status = formData.get("status");
            const kanbanColumn = document.querySelector(`.kanban-column[data-status="${status}"]`);
            if (kanbanColumn) {
                kanbanColumn.insertBefore(newCard, kanbanColumn.firstChild);
            }

            // Close modal and reset form
            bootstrap.Modal.getInstance(document.getElementById("addTaskModal")).hide();
            form.reset();
            // Update kanban counts after adding new task
            updateKanbanCounts();
            // Update overdue alert count after add
            try { updateOverdueCount(); } catch (e) {}
            // Real-time refresh of all views for this task
            try { refreshTaskInDom(String(data.task_id)); } catch (e) { console.warn('post-add refresh failed', e); }
            
            // Do not force-update comment badges right after creating a task to avoid
            // spuriously showing badges on newly-created tasks.
          
         

        } else {
            alert("Error: " + data.error);
        }
  })

    .catch((error) => {
        console.error("Error:", error);
        alert("An error occurred while saving the task.");
    });

});

// ------------------ Load assignees for project select ------------------
// Move this function to global scope
function loadAssignees(projectId, assigneeSelect, selectedId = null) {
  return new Promise((resolve, reject) => {
  // Tag this select with the requested projectId so we can ignore stale responses
  assigneeSelect.dataset._loadingProject = String(projectId);

  // Instead of replacing the whole select, just update the options for a smoother experience
  // Remove all options now (this ensures UI shows immediate placeholder while fetching)
  while (assigneeSelect.options.length > 0) {
    assigneeSelect.remove(0);
  }
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = '👤 Select Assignee';
  placeholder.selected = true;
  placeholder.disabled = true;
  assigneeSelect.appendChild(placeholder);

  fetch(`/tasks/assignable-users/?project=${projectId}`)
    .then(res => res.json())
    .then(data => {
      // If another load has been requested meanwhile, ignore this response
      if (assigneeSelect.dataset._loadingProject !== String(projectId)) {
        // stale response
        return resolve();
      }

  // Debug: print raw users returned by server to help diagnose missing multi-role entries
  try { console.debug('assignable-users response for project', projectId, data.users); } catch (e) {}

  if (data.users && data.users.length > 0) {
        // Group users by user_id so we can decide whether to show multiple
        // options for a user (when they have multiple roles) or a single option
        // when they have only one role. Also deduplicate identical role entries.
        const usersById = new Map();
        data.users.forEach(u => {
          const uid = String(u.user_id || '');
          if (!usersById.has(uid)) usersById.set(uid, []);
          usersById.get(uid).push(u);
        });

        usersById.forEach((entries, uid) => {
          // Collect unique roles and keep first entry per role
          const roleMap = new Map();
          entries.forEach(e => {
            // Trim role to avoid duplicates caused by whitespace differences
            const roleKey = String(e.role || '').trim();
            if (!roleMap.has(roleKey)) roleMap.set(roleKey, e);
          });

          if (roleMap.size <= 1) {
            // Single role for this user: add only one option (use the stored entry)
            const e = Array.from(roleMap.values())[0];
            if (!e) return;
            const option = document.createElement('option');
            option.value = String(e.id);
            const label = e.role_label || e.full_name || e.username;
            option.textContent = (label && !/^👤\s/.test(label)) ? `👤 ${label}` : label;
            option.dataset.userId = String(e.user_id || '');
            option.dataset.userRole = String(e.role || '');
            if (selectedId && String(option.value) === String(selectedId)) option.selected = true;
            assigneeSelect.appendChild(option);
          } else {
            // Multiple roles: add one option per role
            roleMap.forEach(e => {
              const option = document.createElement('option');
              option.value = String(e.id);
              const label = e.role_label || e.full_name || e.username;
              option.textContent = (label && !/^\s/.test(label)) ? `${label}` : label;
              option.dataset.userId = String(e.user_id || '');
              option.dataset.userRole = String(e.role || '');
              if (selectedId && String(option.value) === String(selectedId)) option.selected = true;
              assigneeSelect.appendChild(option);
            });
          }
        });
      } else {
        const noMembers = document.createElement('option');
        noMembers.value = '';
        noMembers.textContent = '❌ No members found';
        noMembers.disabled = true;
        assigneeSelect.appendChild(noMembers);
      }
      // Clear the loading tag so future calls are fresh
      delete assigneeSelect.dataset._loadingProject;
      resolve();
    })
    .catch(err => {
      console.error("Error fetching users:", err);
      // Only append error option if still the active request
      if (assigneeSelect.dataset._loadingProject === String(projectId)) {
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = '⚠️ Error loading users';
        errorOption.disabled = true;
        assigneeSelect.appendChild(errorOption);
        delete assigneeSelect.dataset._loadingProject;
      }
      reject(err);
    });
  });
}

// ------------------ Load page names for a project ------------------
function loadProjectPageNames(projectId, dropdownId, preserveValue = true) {
  if (!dropdownId) return Promise.resolve();
  
  const isAdd = dropdownId === 'taskPageName';
  const hiddenInputId = isAdd ? 'taskPageName' : 'editTaskPageName';
  const hiddenInput = document.getElementById(hiddenInputId);
  const oldVal = preserveValue && hiddenInput ? (hiddenInput.value || '') : '';
  
  pageNames.clear();
  if (!projectId) {
    updatePageNameDropdowns();
    return Promise.resolve();
  }
  
  return fetch(`/api/projects/${encodeURIComponent(projectId)}/page-names/`)
    .then(res => res.json())
    .then(data => {
      const names = (data.page_names || []).map(n => String(n));
      names.forEach(n => pageNames.add(n));
      updatePageNameDropdowns();
      
      // Restore old value after dropdown is updated
      if (oldVal && pageNames.has(oldVal)) {
        setTimeout(() => {
          selectPageName(dropdownId, oldVal);
        }, 50);
      }
    })
    .catch(() => { 
      updatePageNameDropdowns();
      /* ignore */ 
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const taskProject = document.getElementById("taskProject");
  const taskAssignee = document.getElementById("taskAssignee");
  if (taskProject && taskAssignee) {
    taskProject.addEventListener("change", function () {
      loadAssignees(taskProject.value, taskAssignee);
      loadProjectPageNames(taskProject.value, 'taskPageName');
    });
  }

  // Cache initial assignee roles from list rows like "name (Role)" so edit modal can preselect
  try {
    document.querySelectorAll('#taskList tr').forEach(tr => {
      const taskId = tr.getAttribute('data-task-id');
      const assigneeCell = tr.querySelector('td:nth-child(3)');
      if (!taskId || !assigneeCell) return;
      const txt = assigneeCell.textContent.trim();
      const m = txt.match(/\((.*?)\)\s*$/);
      if (m && m[1]) {
        localStorage.setItem(`taskRole:${taskId}`, m[1]);
      }
    });
  } catch (e) {}

  const editProjectSelect = document.getElementById("editTaskProject");
  const editAssigneeSelect = document.getElementById("editTaskAssignee");
  if (editProjectSelect && editAssigneeSelect) {
    editProjectSelect.addEventListener("change", function () {
      loadAssignees(editProjectSelect.value, editAssigneeSelect);
      loadProjectPageNames(editProjectSelect.value, 'editTaskPageName', false);
    });

    document.getElementById("editTaskModal").addEventListener("show.bs.modal", function () {
      loadAssignees(editProjectSelect.value, editAssigneeSelect);
      loadProjectPageNames(editProjectSelect.value, 'editTaskPageName');
    });
  }

  // Add page name button handlers
  const addPageNameBtn = document.getElementById('addPageNameBtn');
  const editAddPageNameBtn = document.getElementById('editAddPageNameBtn');
  if (addPageNameBtn) {
    addPageNameBtn.addEventListener('click', function() {
      addNewPageName('taskPageName');
    });
  }
  if (editAddPageNameBtn) {
    editAddPageNameBtn.addEventListener('click', function() {
      addNewPageName('editTaskPageName');
    });
  }
});

// ------------------------- Edit task modal -------------------------
document.querySelectorAll(".edit-task").forEach((button) => {
  button.addEventListener("click", function () {
    const taskId = this.dataset.taskId;
    const editModal = new bootstrap.Modal(document.getElementById("editTaskModal"));
    editModal.show();

    const prefRole = localStorage.getItem(`taskRole:${taskId}`) || '';
    const url = prefRole ? `/tasks/${taskId}/edit/?assignee_pref_role=${encodeURIComponent(prefRole)}` : `/tasks/${taskId}/edit/`;

    fetch(url, {
      headers: {
        "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);

        document.getElementById("editTaskId").value = taskId;
        document.getElementById("editTaskTitle").value = data.title || "";
        document.getElementById("editTaskProject").value = data.project_id || "";
        document.getElementById("editTaskDescription").value = data.description || "";
        document.getElementById("editTaskStartDate").value = data.start_date || "";
        document.getElementById("editTaskDueDate").value = data.due_date || "";
        document.getElementById("editTaskStatus").value = data.status || "";
        document.getElementById("editTaskPriority").value = data.priority || "";

        // Store page name to set after dropdown loads
        const pageNameToSet = data.page_name || "";

        // Preselect exact role: prefer stored role if valid
        let assigneeValue = null;
        if (data.assigned_to_id && data.assigned_to_role) {
          assigneeValue = `${data.assigned_to_id}:${data.assigned_to_role}`;
        }
        if (prefRole && data.assigned_to_id) {
          assigneeValue = `${data.assigned_to_id}:${prefRole}`;
        }
        // Ensure loadAssignees and loadProjectPageNames complete before we snapshot original values
        Promise.all([
          loadAssignees(data.project_id, document.getElementById("editTaskAssignee"), assigneeValue),
          loadProjectPageNames(data.project_id, 'editTaskPageName', false)
        ]).then(() => {
          // Set page name after dropdown is loaded
          if (pageNameToSet) {4
            selectPageName('editTaskPageName', pageNameToSet);
          }
        }).then(() => {
            // Store original assignee name for confirmation dialog
            const originalAssigneeSelect = document.getElementById("editTaskAssignee");
            const originalAssigneeOption = originalAssigneeSelect.querySelector(`option[value="${assigneeValue}"]`);
            const originalAssigneeName = originalAssigneeOption ? originalAssigneeOption.textContent : 'Unassigned';
            
            // Store original assignee name in a data attribute
            const editForm = document.getElementById("editTaskForm");
            editForm.setAttribute('data-original-assignee', originalAssigneeName);
            
            // Snapshot original values for change-detection
            try {
              window.__originalEditTaskValues = {
                title: document.getElementById("editTaskTitle").value || "",
                project: document.getElementById("editTaskProject").value || "",
                description: document.getElementById("editTaskDescription").value || "",
                page_name: document.getElementById("editTaskPageName").value || "",
                start_date: document.getElementById("editTaskStartDate").value || "",
                due_date: document.getElementById("editTaskDueDate").value || "",
                status: document.getElementById("editTaskStatus").value || "",
                priority: document.getElementById("editTaskPriority").value || "",
                assigned_to: (document.getElementById("editTaskAssignee") && document.getElementById("editTaskAssignee").value) || "",
              };
            } catch (e) { console.error('Snapshot error', e); }
          })
          .catch(err => {
            console.error('Error loading assignees for snapshot', err);
          });
      })
      .catch(err => {
        console.error("Error loading task:", err);
        alert("Error loading task data: " + err.message);
        editModal.hide();
      });
  });
});
// ================== OPEN EDIT TASK MODAL ==================
document.querySelectorAll('.edit-task-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    const taskId = this.dataset.taskId;

    fetch(`/tasks/${taskId}/get/`)
      .then(res => res.json())
      .then(data => {
        // Fill modal fields
        document.getElementById("editTaskId").value = data.id;
        document.getElementById("editTaskTitle").value = data.title;
        document.getElementById("editProject").value = data.project;
        document.getElementById("editTaskPageName").value = data.page_name;
        document.getElementById("editDescription").value = data.description;
        document.getElementById("editStartDate").value = data.start_date;
        document.getElementById("editDueDate").value = data.due_date;
        document.getElementById("editStatus").value = data.status;
        document.getElementById("editPriority").value = data.priority;
        document.getElementById("editAssignedTo").value = data.assigned_to;

        // ✅ Store original values right after filling the fields
        window.__originalEditTaskValues = {
          title: data.title || '',
          project: data.project || '',
          description: data.description || '',
          page_name: data.page_name || '',
          start_date: data.start_date || '',
          due_date: data.due_date || '',
          status: data.status || '',
          priority: data.priority || '',
          assigned_to: data.assigned_to || ''
        };

        // Clear old validation states
        const editForm = document.getElementById('editTaskForm');
        editForm.querySelectorAll('.is-valid, .is-invalid').forEach(el => {
          el.classList.remove('is-valid', 'is-invalid');
        });
      })
      .catch(err => console.error('Error fetching task:', err));
  });
});



let assigneeChanged = false;
const assigneeSelect = document.getElementById("editTaskAssignee");

if (assigneeSelect) {
  assigneeSelect.addEventListener("change", function () {
    assigneeChanged = true;
  });
}

const editModal = document.getElementById('editTaskModal');
editModal.addEventListener('shown.bs.modal', function () {
  const assigneeSelect = document.getElementById("editTaskAssignee");
  if (!assigneeSelect) return;

  // Always set original values when modal opens
  window.__originalEditTaskValues = {
    assigned_to: assigneeSelect.value,
    assigned_to_name: assigneeSelect.options[assigneeSelect.selectedIndex]?.textContent.trim() || 'Unassigned'
  };

  // Reset the assigneeChanged flag
  assigneeChanged = false;
});


window.__originalEditTaskValues = {
  assigned_to: assigneeSelect ? assigneeSelect.value : '',
  assigned_to_name: assigneeSelect
    ? assigneeSelect.options[assigneeSelect.selectedIndex]?.textContent.trim() || 'Unassigned'
    : 'Unassigned'
};


document.getElementById("updateTaskBtn").addEventListener("click", async function () {
  const form = document.getElementById("editTaskForm");
  const formData = new FormData(form);
  const data = {};

  // --- Validate fields ---
  let allValid = true;
  form.querySelectorAll('input, select, textarea').forEach(field => {
    if (!field || field.disabled) return;
    
    // Special handling for hidden inputs (like page name hidden input)
    const isHidden = field.type === 'hidden' || field.offsetParent === null;
    
    // Check if field is required
    const isRequired = field.hasAttribute('required');
    
    // Skip validation only if field is hidden AND not required (or has a value)
    if (isHidden && !isRequired && !field.value) return;
    
    // Validate required fields and fields with values
    if (isRequired || field.value) {
      if (!field.value || field.value.trim() === "") {
        field.classList.add("is-invalid");
        field.classList.remove("is-valid");
        allValid = false;
      } else {
        field.classList.remove("is-invalid");
        field.classList.add("is-valid");
      }
    }
  });

  if (!allValid) {
    toastr.warning('Please fix the highlighted fields.', '', { timeOut: 3000, closeButton: true, progressBar: true });
    return;
  }

  // --- Collect data ---
  formData.forEach((value, key) => { data[key] = value; });

  // --- Role and Assignee Change Check ---
  const currentUserRole = (window.DJ && window.DJ.currentRole) || localStorage.getItem("role") || "";
  const isManager = currentUserRole === "Manager";

  // ✅ Only check for reassignment if user actually changed the assignee field
  if (isManager && assigneeChanged) {
    const origAssignedRaw = (window.__originalEditTaskValues && window.__originalEditTaskValues.assigned_to) || '';
    const origAssignedId = origAssignedRaw ? String(origAssignedRaw).split(':')[0] : '';
    const newAssignedId = String(data.assigned_to || '').split(':')[0];

    if (origAssignedId !== newAssignedId && data.assigned_to) {
      const originalAssigneeName = (window.__originalEditTaskValues && window.__originalEditTaskValues.assigned_to_name) || 'Unassigned';
      const newAssigneeOption = assigneeSelect.querySelector(`option[value="${data.assigned_to}"]`);
      const newAssigneeName = newAssigneeOption ? newAssigneeOption.textContent.trim() : 'Unknown';

      // Show reassignment confirmation modal
      showReassignmentConfirmation(originalAssigneeName, newAssigneeName, function (reason) {
        data.reassignment_reason = reason;
        assigneeChanged = false; // reset flag after confirmation
        proceedWithTaskUpdate(data);
      });
      return;
    }
  }

  // Proceed normally if not a manager or assignee not changed
  proceedWithTaskUpdate(data);
});


// ------------------ 4. Show Reassignment Modal ------------------
function showReassignmentConfirmation(oldAssignee, newAssignee, callback) {
  // Remove existing modal if any
  const existingModal = document.getElementById('reassignmentModal');
  if (existingModal) existingModal.remove();

  // Create modal HTML
  const modalHtml = `
    <div class="modal fade" id="reassignmentModal" tabindex="-1" aria-labelledby="reassignmentModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="reassignmentModalLabel">Confirm Task Reassignment</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>You are about to reassign this task from <strong>${oldAssignee}</strong> to <strong>${newAssignee}</strong>.</p>
            <div class="mb-3">
              <label for="reassignmentReason" class="form-label">Reason for reassignment:</label>
              <textarea class="form-control" id="reassignmentReason" rows="3" placeholder="Please provide a reason..." required></textarea>
              <div class="invalid-feedback">Please provide a reason for the reassignment.</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="confirmReassignment">Confirm Reassignment</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modalEl = document.getElementById('reassignmentModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  // Handle confirm click
  const confirmBtn = document.getElementById('confirmReassignment');
  confirmBtn.onclick = function () {
    const reasonInput = document.getElementById('reassignmentReason');
    const reason = reasonInput.value.trim();

    if (!reason) {
      reasonInput.classList.add('is-invalid');
      return;
    }

    reasonInput.classList.remove('is-invalid');
    modal.hide();
    callback(reason);
  };

  // Clean up modal after closing
  modalEl.addEventListener('hidden.bs.modal', function () {
    modalEl.remove();
  });
}


// ------------------ 5. Proceed with Task Update ------------------
async function proceedWithTaskUpdate(data) {
  try {
    const response = await fetch('/api/tasks/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to update task');
    const result = await response.json();

    toastr.success('Task updated successfully!', '', { timeOut: 3000, closeButton: true, progressBar: true });

    // Optionally refresh or close modal
    // location.reload();

  } catch (error) {
    console.error('Update Error:', error);
    toastr.error('Error updating task. Please try again.', '', { timeOut: 3000, closeButton: true, progressBar: true });
  }
}


function showReassignmentConfirmation(oldAssignee, newAssignee, callback) {
  // Remove existing modal if any
  const existingModal = document.getElementById('reassignmentModal');
  if (existingModal) existingModal.remove();

  // Create modal HTML
  const modalHtml = `
    <div class="modal fade" id="reassignmentModal" tabindex="-1" aria-labelledby="reassignmentModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="reassignmentModalLabel">Confirm Task Reassignment</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>You are about to reassign this task from <strong>${oldAssignee}</strong> to <strong>${newAssignee}</strong>.</p>
            <div class="mb-3">
              <label for="reassignmentReason" class="form-label">Reason for reassignment:</label>
              <textarea class="form-control" id="reassignmentReason" rows="3" placeholder="Please provide a reason..." required></textarea>
              <div class="invalid-feedback">Please provide a reason for the reassignment.</div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-primary" id="confirmReassignment">Confirm Reassignment</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modalEl = document.getElementById('reassignmentModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();

  // Prevent duplicate listeners
  const confirmBtn = document.getElementById('confirmReassignment');
  confirmBtn.onclick = function () {
    const reasonInput = document.getElementById('reassignmentReason');
    const reason = reasonInput.value.trim();

    if (!reason) {
      reasonInput.classList.add('is-invalid');
      return;
    }

    reasonInput.classList.remove('is-invalid');
    modal.hide();
    callback(reason);
  };

  modalEl.addEventListener('hidden.bs.modal', function () {
    modalEl.remove();
  });
}


// ================== PROCEED WITH TASK UPDATE ==================
async function proceedWithTaskUpdate(data) {
  try {
    const response = await fetch('/api/tasks/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Failed to update task');
    const result = await response.json();

    toastr.success('Task updated successfully!', '', { timeOut: 3000, closeButton: true, progressBar: true });

    // Example: refresh list or close modal
    // location.reload();

  } catch (error) {
    console.error('Update Error:', error);
    toastr.error('Error updating task. Please try again.', '', { timeOut: 3000, closeButton: true, progressBar: true });
  }
}


// Function to proceed with task update
async function proceedWithTaskUpdate(data) {
  // --- Detect changes ---
  const origSnapshot = window.__originalEditTaskValues || {};

  // Normalize helper: trim strings; dates normalized to YYYY-MM-DD; assigned_to compare by id only
  function normalizeDate(s) {
    if (!s) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const d = new Date(s);
    if (isNaN(d.getTime())) return s.trim();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function normalizeAssignedTo(val) {
    if (!val) return '';
    const parts = String(val).split(':');
    return parts[0];
  }

  const current = {
    title: (data.title || '').trim(),
    project: String(data.project || '').trim(),
    description: (data.description || '').trim(),
    page_name: (data.page_name || '').trim(),
    start_date: normalizeDate(data.start_date || ''),
    due_date: normalizeDate(data.due_date || ''),
    status: (data.status || '').trim(),
    priority: (data.priority || '').trim(),
    assigned_to: normalizeAssignedTo(data.assigned_to || '')
  };

  // Try to get authoritative original values from server to avoid mismatch
  let serverOrig = null;
  try {
    const taskId = document.getElementById("editTaskId").value;
    const resp = await fetch(`/tasks/${taskId}/edit/`, {
      headers: { "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]")?.value || getCookie('csrftoken') }
    });
    if (resp && resp.ok) {
      const jd = await resp.json();
      if (!jd.error) serverOrig = jd;
    }
  } catch (e) {
    console.warn('Could not fetch server original for change-detection', e);
  }

  const origSource = serverOrig ? {
    title: serverOrig.title || (origSnapshot.title || ''),
    project: String(serverOrig.project_id || (origSnapshot.project || '')),
    description: serverOrig.description || (origSnapshot.description || ''),
    page_name: serverOrig.page_name || (origSnapshot.page_name || ''),
    start_date: serverOrig.start_date || (origSnapshot.start_date || ''),
    due_date: serverOrig.due_date || (origSnapshot.due_date || ''),
    status: serverOrig.status || (origSnapshot.status || ''),
    priority: serverOrig.priority || (origSnapshot.priority || ''),
    assigned_to: (serverOrig.assigned_to_id && serverOrig.assigned_to_role) ? `${serverOrig.assigned_to_id}:${serverOrig.assigned_to_role}` : (serverOrig.assigned_to_id || (origSnapshot.assigned_to || ''))
  } : origSnapshot;

  const originalNormalized = {
    title: (origSource.title || '').trim(),
    project: String(origSource.project || '').trim(),
    description: (origSource.description || '').trim(),
    page_name: (origSource.page_name || '').trim(),
    start_date: normalizeDate(origSource.start_date || ''),
    due_date: normalizeDate(origSource.due_date || ''),
    status: (origSource.status || '').trim(),
    priority: (origSource.priority || '').trim(),
    assigned_to: normalizeAssignedTo(origSource.assigned_to || '')
  };

  let changed = false;
  for (const k in current) {
    if ((originalNormalized[k] || '') !== (current[k] || '')) {
      changed = true;
      break;
    }
  }

  // Debug: log normalized values and differences to help troubleshoot false positives
  try {
    const diffs = [];
    for (const k in current) {
      const o = originalNormalized[k] || '';
      const c = current[k] || '';
      if (o !== c) diffs.push({ field: k, original: o, current: c });
    }
    console.debug('[EditTask] originalNormalized:', originalNormalized);
    console.debug('[EditTask] current:', current);
    console.debug('[EditTask] changed:', changed, 'diffs:', diffs);
  } catch (e) { console.error('EditTask debug error', e); }

  const editModalEl = document.getElementById('editTaskModal');
  const editModal = bootstrap.Modal.getInstance(editModalEl);

  // ✅ If nothing changed, show info and close
  if (!changed) {
    toastr.info('No changes made.', 'info', {
      timeOut: 2000,
      closeButton: true,
      progressBar: true,
      onHidden: function () {
        if (editModal) editModal.hide();
      }
    });
    return;
  }

  // --- Submit if changes exist ---
  const taskId = document.getElementById("editTaskId").value;
  fetch(`/tasks/${taskId}/edit/`, {
    method: "POST",
    headers: {
      "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        toastr.success("Task updated successfully!", "Success", {
          timeOut: 3000,
          closeButton: true,
          progressBar: true
        });
        // Update the list row and kanban card in-place so UI reflects changes without reload
        try {
          const updated = data.task || {};
          const taskId = String(updated.id || taskId);

          // Update table row
          const row = document.querySelector(`tr[data-task-id="${taskId}"]`);
          if (row) {
            // Title
            const titleEl = row.querySelector('td:first-child h6');
            if (titleEl && updated.title) titleEl.textContent = updated.title;

            // Project
            const projectCell = row.querySelector('td:nth-child(2)');
            if (projectCell && updated.project_name) projectCell.textContent = updated.project_name;

            // Page Name
            const pageNameCell = row.querySelector('td:nth-child(3)');
            if (pageNameCell) {
              if (updated.page_name && updated.page_name.trim()) {
                pageNameCell.innerHTML = `<span class="badge bg-info">${updated.page_name}</span>`;
              } else {
                pageNameCell.innerHTML = `<span class="text-muted">-</span>`;
              }
            }

            // Assignee
            const assigneeCell = row.querySelector('td:nth-child(4)');
            if (assigneeCell) {
              if (!updated.assigned_to_name || updated.assigned_to_name === 'Unassigned') {
                assigneeCell.innerHTML = `
                  <div>
                    <div class="d-flex align-items-center gap-2 text-muted">
                      <span class="fs-6">👤</span>
                      <span class="assignee-name">Unassigned</span>
                    </div>
                  </div>
                `;
              } else {
                const roleMatch = updated.assigned_to_name.match(/^(.+?)\s*\((.+?)\)\s*$/);
                const name = roleMatch ? roleMatch[1].trim() : updated.assigned_to_name;
                const role = roleMatch ? roleMatch[2].trim() : null;
                assigneeCell.innerHTML = `
                  <div>
                    <div class="d-flex align-items-center gap-2">
                      <span class="fs-6">👤</span>
                      <span class="assignee-name">${name}</span>
                    </div>
                    ${role ? `<div class="assignee-role">${role}</div>` : ''}
                  </div>
                `;
              }
            }

            // Start date
            const startCell = row.querySelector('td:nth-child(5)');
            if (startCell) {
              if (updated.start_date) {
                startCell.innerHTML = `<span class="badge bg-info">${new Date(updated.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>`;
              } else {
                startCell.innerHTML = `<span class="badge bg-secondary">Not set</span>`;
              }
            }

            // Due date
            const dueCell = row.querySelector('td:nth-child(6) .badge');
            if (dueCell && updated.due_date) {
              dueCell.className = `badge ${getDueDateBadgeClass(updated.due_date)}`;
              dueCell.textContent = new Date(updated.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }

            // Status
            const statusCell = row.querySelector('td:nth-child(7) .badge');
            if (statusCell && updated.status) {
              statusCell.className = `badge ${getStatusBadgeClass(updated.status)}`;
              statusCell.textContent = updated.status;
            }

            // Priority
            const priorityCell = row.querySelector('td:nth-child(8) .badge');
            if (priorityCell && updated.priority) {
              priorityCell.className = `badge ${getPriorityBadgeClass(updated.priority)}`;
              priorityCell.textContent = updated.priority;
            }
          }

          // Update kanban card if present
          const kanbanCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
          if (kanbanCard) {
            const title = kanbanCard.querySelector('.card-title');
            if (title && updated.title) title.textContent = updated.title;
            const projectP = kanbanCard.querySelector('.card-text');
            if (projectP && updated.project_name) projectP.textContent = updated.project_name;
            const badge = kanbanCard.querySelector('.badge');
            if (badge && updated.priority) {
              badge.className = getPriorityBadgeClass(updated.priority);
              badge.textContent = updated.priority;
            }
            // Move card to correct column if status changed
            if (updated.status) {
              const destCol = document.querySelector(`.kanban-column[data-status="${updated.status}"]`);
              if (destCol && kanbanCard.parentElement !== destCol) destCol.insertBefore(kanbanCard, destCol.firstChild);
            }
          }
          
          // Update kanban counts after task update
          updateKanbanCounts();
          // Update overdue alert count after update
          try { updateOverdueCount(); } catch (e) {}

          // Persist assignee role preference if provided
          if (updated.assigned_to_id && updated.assigned_to_role) {
            try { localStorage.setItem(`taskRole:${taskId}`, updated.assigned_to_role); } catch (e) {}
          }

          // Refresh the original snapshot so change detection matches current values
          window.__originalEditTaskValues = {
            title: updated.title || '',
            project: String(updated.project_id || ''),
            description: updated.description || '',
            page_name: updated.page_name || '',
            start_date: updated.start_date || '',
            due_date: updated.due_date || '',
            status: updated.status || '',
            priority: updated.priority || '',
            assigned_to: (updated.assigned_to_id && updated.assigned_to_role) ? `${updated.assigned_to_id}:${updated.assigned_to_role}` : (updated.assigned_to_id || '')
          };
        } catch (e) {
          console.error('Error applying DOM updates after edit:', e);
        }

        if (editModal) editModal.hide();
        // Ensure absolute consistency with server by refreshing this task everywhere
        try { refreshTaskInDom(String(taskId)); } catch (e) { console.warn('post-update refresh failed', e); }
        
        // Update notification badges after task update
      } else {
        toastr.error("Error: " + data.error);
      }
    })
    .catch(err => {
      console.error("Error updating task:", err);
      toastr.error("Error updating task.");
    });
}


// ================== LIVE VALIDATION ==================
const editTaskForm = document.getElementById('editTaskForm');
if (editTaskForm) {
  editTaskForm.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      if (!field.value || field.value.trim() === '') {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
      } else {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
      }
    });
    if (field.tagName === 'SELECT') {
      field.addEventListener('change', () => {
        if (!field.value || field.value.trim() === '') {
          field.classList.add('is-invalid');
          field.classList.remove('is-valid');
        } else {
          field.classList.remove('is-invalid');
          field.classList.add('is-valid');
        }
      });
    }
  });

  // Task Title Regex Validation
  const editTaskTitle = document.getElementById('editTaskTitle');
  if (editTaskTitle) {
    editTaskTitle.addEventListener('input', function () {
      const value = this.value.trim();
      const errorElement = this.nextElementSibling;
      const validPattern = /^[a-zA-Z0-9\s\-().]+$/; // Only letters, numbers, spaces, hyphens, parentheses
      
      if (value === '') {
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
        if (errorElement) errorElement.textContent = 'Task title is required.';
        if (this.nextElementSibling) this.nextElementSibling.textContent = 'Task title is required.';
      } else if (value.length < 3) {
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
        if (errorElement) errorElement.textContent = 'Task title must be at least 3 characters long.';
      } else if (value.length > 150) {
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
        if (errorElement) errorElement.textContent = 'Task title cannot exceed 150 characters.';
      } else if (!validPattern.test(value)) {
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
        if (errorElement) errorElement.textContent = 'Task title can only contain letters, numbers, spaces, hyphens, and parentheses and dots.';
      } else {
        this.classList.remove('is-invalid');
        this.classList.add('is-valid');
        if (errorElement) errorElement.textContent = '';
      }
    });
  }

  // ================== RESET WHEN MODAL CLOSES ==================
  const editTaskModalEl = document.getElementById('editTaskModal');
  if (editTaskModalEl) {
    editTaskModalEl.addEventListener('hidden.bs.modal', function () {
      editTaskForm.reset();
      editTaskForm.querySelectorAll('.is-valid, .is-invalid').forEach(f => {
        f.classList.remove('is-valid', 'is-invalid');
      });
      // Clear stored snapshot
      window.__originalEditTaskValues = null;
    });
  }
}
  
  //---------------------------- Helper functions for badge classes--------------------------------------------
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

  function getPriorityBadgeClass(priority) {
    switch (priority) {
      case "High":
        return "bg-danger";
      case "Medium":
        return "bg-warning text-dark";
      case "Low":
        return "bg-primary";
      default:
        return "bg-secondary";
    }
  }

  function getDueDateBadgeClass(dueDate) {
  // Compare by calendar date only (ignore time-of-day)
  function toDateOnly(d) {
    const dt = new Date(d);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }
  const todayOnly = toDateOnly(new Date());
  const dueOnly = toDateOnly(dueDate);
  // Overdue only if strictly before today
  return dueOnly < todayOnly ? "bg-danger" : "bg-success";
  }

  // ---------------------- Overdue alert: count + highlight ----------------------
  function isRowOverdue(tr) {
    try {
      // Prefer server/DOM class if available
      const badge = tr.querySelector('td:nth-child(6) .badge');
      if (badge && badge.classList.contains('bg-danger')) return true;

      // Fallback: parse date text and compare with today
      const text = badge ? (badge.textContent || '').trim() : '';
      if (!text || text.toLowerCase() === 'not set') return false;
      const due = new Date(text);
      if (isNaN(due.getTime())) return false;
      const today = new Date();
      const dOnly = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const tOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return dOnly < tOnly;
    } catch (_) { return false; }
  }

  function updateOverdueCount() {
    try {
      const rows = Array.from(document.querySelectorAll('#taskList tr[data-task-id]'));
      const count = rows.reduce((acc, tr) => acc + (isRowOverdue(tr) ? 1 : 0), 0);
      const badgeEl = document.getElementById('overdueCountBadge');
      const btnEl = document.getElementById('overdueAlertBtn');
      if (badgeEl) badgeEl.textContent = String(count);
      if (btnEl) {
        btnEl.disabled = false; // keep clickable even if 0
        btnEl.setAttribute('aria-label', `Overdue tasks: ${count}`);
      }
    } catch (e) { console.warn('updateOverdueCount error', e); }
  }

  function highlightOverdueRowsOnce() {
    const rows = Array.from(document.querySelectorAll('#taskList tr[data-task-id]')).filter(isRowOverdue);
    if (rows.length === 0) return;
    rows.forEach(tr => tr.classList.add('overdue-flash'));
    setTimeout(() => rows.forEach(tr => tr.classList.remove('overdue-flash')), 1000);
  }

  // ----------------------Real-time refresh of a single task (list, kanban, calendar)----------------------
 async function refreshTaskInDom(taskId) {
  try {
    // 🧩 Debug: log ID being refreshed
    console.log("🔄 refreshTaskInDom called with taskId =", taskId);

    // Guard against undefined/null IDs
    if (!taskId || taskId === "undefined") {
      console.warn("⚠️ refreshTaskInDom called without valid taskId:", taskId);
      return;
    }

    // Build URL safely
    const url = `/tasks/${taskId}/view/`;
    console.log("📡 Fetching:", url);

    // Fetch updated task data from backend
    const resp = await fetch(url, {
      headers: {
        "X-CSRFToken":
          document.querySelector("[name=csrfmiddlewaretoken]")?.value ||
          getCookie("csrftoken"),
      },
    });

    if (!resp.ok) {
      console.warn(`⚠️ refreshTaskInDom fetch failed: ${resp.status}`);
      return;
    }

    const data = await resp.json();
    if (data.error) {
      console.warn("⚠️ Backend error:", data.error);
      return;
    }

    const idStr = String(data.id || taskId);

    // 🧩 Update List View row
    const row = document.querySelector(`tr[data-task-id="${idStr}"]`);
    if (row) {
      // Title
      const titleEl = row.querySelector("td:first-child h6");
      if (titleEl && data.title) titleEl.textContent = data.title;

      // Project
      const projectCell = row.querySelector("td:nth-child(2)");
      if (projectCell && data.project_name)
        projectCell.textContent = data.project_name;

      // Page Name
      const pageNameCell = row.querySelector("td:nth-child(3)");
      if (pageNameCell) {
        if (data.page_name && data.page_name.trim()) {
          pageNameCell.innerHTML = `<span class="badge bg-info">${data.page_name}</span>`;
        } else {
          pageNameCell.innerHTML = `<span class="text-muted">-</span>`;
        }
      }

      // Assignee
      const assigneeCell = row.querySelector("td:nth-child(4)");
      if (assigneeCell) {
        if (!data.assigned_to_name || data.assigned_to_name === "Unassigned") {
          assigneeCell.innerHTML = `
            <div>
              <div class="d-flex align-items-center gap-2 text-muted">
                <span class="fs-6">👤</span>
                <span class="assignee-name">Unassigned</span>
              </div>
            </div>
          `;
        } else {
          const roleMatch = data.assigned_to_name.match(/^(.+?)\s*\((.+?)\)\s*$/);
          const name = roleMatch ? roleMatch[1].trim() : data.assigned_to_name;
          const role = roleMatch ? roleMatch[2].trim() : null;
          assigneeCell.innerHTML = `
            <div>
              <div class="d-flex align-items-center gap-2">
                <span class="fs-6">👤</span>
                <span class="assignee-name">${name}</span>
              </div>
              ${role ? `<div class="assignee-role">${role}</div>` : ''}
            </div>
          `;
        }
      }

      // Start date
      const startCell = row.querySelector("td:nth-child(5)");
      if (startCell) {
        if (data.start_date) {
          startCell.innerHTML = `<span class="badge bg-info">${new Date(
            data.start_date
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}</span>`;
        } else {
          startCell.innerHTML = `<span class="badge bg-secondary">Not set</span>`;
        }
      }

      // Due date
      const dueCellBadge = row.querySelector("td:nth-child(6) .badge");
      if (dueCellBadge) {
        if (data.due_date) {
          dueCellBadge.className = `badge ${getDueDateBadgeClass(
            data.due_date
          )}`;
          dueCellBadge.textContent = new Date(data.due_date).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
              year: "numeric",
            }
          );
        } else {
          dueCellBadge.className = "badge bg-secondary";
          dueCellBadge.textContent = "Not set";
        }
      }

      // Status
      const statusCellBadge = row.querySelector("td:nth-child(7) .badge");
      if (statusCellBadge && data.status) {
        statusCellBadge.className = `badge ${getStatusBadgeClass(data.status)}`;
        statusCellBadge.textContent = data.status;
      }

      // Priority
      const priorityCellBadge = row.querySelector("td:nth-child(8) .badge");
      if (priorityCellBadge && data.priority) {
        priorityCellBadge.className = `badge ${getPriorityBadgeClass(
          data.priority
        )}`;
        priorityCellBadge.textContent = data.priority;
      }
    }

    // 🧩 Update Kanban card
    const kanbanCard = document.querySelector(
      `.task-card[data-task-id="${idStr}"]`
    );
    if (kanbanCard) {
      const title = kanbanCard.querySelector(".card-title");
      if (title && data.title) title.textContent = data.title;

      const projectP = kanbanCard.querySelector(".card-text");
      if (projectP && data.project_name)
        projectP.textContent = data.project_name;

      const badge = kanbanCard.querySelector(".badge");
      if (badge && data.priority) {
        badge.className = `badge ${getPriorityBadgeClass(data.priority)}`;
        badge.textContent = data.priority;
      }

      if (data.status) {
        const destCol = document.querySelector(
          `.kanban-column[data-status="${data.status}"]`
        );
        if (destCol && kanbanCard.parentElement !== destCol)
          destCol.insertBefore(kanbanCard, destCol.firstChild);
      }
    }

    // 🧩 Update Calendar
    try {
      if (window.taskCalendar) {
        let ev = window.taskCalendar.getEventById(idStr);
        const startDate = data.start_date ? new Date(data.start_date) : null;
        const endDate = data.due_date ? new Date(data.due_date) : null;

        if (ev) {
          if (data.title) ev.setProp("title", data.title);
          if (startDate) ev.setStart(startDate);
          else ev.setStart(null);
          if (endDate) ev.setEnd(endDate);
          else ev.setEnd(null);
          if (data.status) {
            ev.setExtendedProp("status", data.status);
            ev.setProp("color", getTaskStatusColor(data.status));
          }
          if (data.description !== undefined)
            ev.setExtendedProp("description", data.description || "");
        } else {
          window.taskCalendar.addEvent({
            id: idStr,
            title: data.title || "",
            start: startDate || undefined,
            end: endDate || undefined,
            color: getTaskStatusColor(data.status),
            description: data.description || "",
            status: data.status || "",
          });
        }
      }
    } catch (e) {
      console.warn("📅 Calendar update failed:", e);
    }
  } catch (e) {
    console.warn("❌ refreshTaskInDom error:", e);
  }
}


  // ----------------------View task functionality-------------------------------------
  document.querySelectorAll(".view-task").forEach((button) => {
    button.addEventListener("click", function () {
      const taskId = this.dataset.taskId;
      // Fetch task data and populate view modal
      fetch(`/tasks/${taskId}/view/`, {
        headers: {
          "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]")
            .value,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            throw new Error(data.error);
          }

          // Try to get task data from row first
          const taskRow = document.querySelector(`tr[data-task-id="${taskId}"]`);
          let storedTaskData = null;
          if (taskRow && taskRow.getAttribute('data-task')) {
            try {
              storedTaskData = JSON.parse(taskRow.getAttribute('data-task'));
            } catch (e) {
              console.error('Error parsing stored task data:', e);
            }
          }

          // Use stored data if available, otherwise use server response
          const taskData = storedTaskData || data;
          
          // Populate view modal with task data
          document.getElementById("viewTaskTitle").textContent = taskData.title;
          document.getElementById("viewTaskProject").textContent = taskData.project_name;
          document.getElementById("viewTaskDescription").textContent = taskData.description;
          document.getElementById("viewTaskPageName").textContent = 
            (taskData.page_name && taskData.page_name.trim()) ? taskData.page_name : "No page name specified";

          // Format and display status with appropriate badge
          const statusBadge = document.createElement("span");
          statusBadge.className = `badge ${getStatusBadgeClass(data.status)}`;
          statusBadge.textContent = data.status;
          document.getElementById("viewTaskStatus").innerHTML = "";
          document.getElementById("viewTaskStatus").appendChild(statusBadge);

          // Format and display priority with appropriate badge
          const priorityBadge = document.createElement("span");
          priorityBadge.className = `badge ${getPriorityBadgeClass(
            data.priority
          )}`;
          priorityBadge.textContent = data.priority;
          document.getElementById("viewTaskPriority").innerHTML = "";
          document.getElementById("viewTaskPriority").appendChild(priorityBadge);

          // Display assignee with avatar
          const assigneeDiv = document.createElement("div");
          assigneeDiv.className = "d-flex align-items-center";
          assigneeDiv.innerHTML = `
                    <span>${data.assigned_to_name}</span>
                `;
          document.getElementById("viewTaskAssignee").innerHTML = "";
          document.getElementById("viewTaskAssignee").appendChild(assigneeDiv);

          // Start date badge
            const startDateBadge = document.createElement("span");
            startDateBadge.className = data.start_date 
                ? `badge bg-info`  // or use a function like getStartDateBadgeClass(data.start_date) if needed
                : "badge bg-secondary";
            startDateBadge.textContent = data.start_date
                ? new Date(data.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : "Not set";
            document.getElementById("viewTaskStartDate").innerHTML = "";
            document.getElementById("viewTaskStartDate").appendChild(startDateBadge);

            // Due date badge
            const dueDateBadge = document.createElement("span");
            dueDateBadge.className = `badge ${getDueDateBadgeClass(data.due_date)}`;
            dueDateBadge.textContent = data.due_date
                ? new Date(data.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : "Not set";
            document.getElementById("viewTaskDueDate").innerHTML = "";
            document.getElementById("viewTaskDueDate").appendChild(dueDateBadge);


          document.getElementById("viewTaskCreated").textContent =
            data.created_at;
          


          // Show view modal
          const viewModal = new bootstrap.Modal(
            document.getElementById("viewTaskModal")
          );
          viewModal.show();
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("Error loading task data: " + error.message);
        });
    });
  });

  // ------------------------Delete task functionality-----------------------------
  // document.querySelectorAll(".delete-task").forEach((button) => {
  //   button.addEventListener("click", function () {
  //     const taskId = this.dataset.taskId;
  //     showDeleteReasonModal(function(reason) {
  //       const payload = new URLSearchParams();
  //       if (reason) payload.append('reason', reason);
  //       fetch(`/tasks/${taskId}/delete/`, {
  //         method: "POST",
  //         headers: {
  //           "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
  //           "Content-Type": "application/x-www-form-urlencoded"
  //         },
  //         body: payload.toString()
  //       })
  //       .then((response) => response.json())
  //       .then((data) => {
  //         if (data.success) {
  //           // Remove the task row from the table
  //           const row = button.closest('tr');
  //           if (row) row.remove();
  //           const taskList = document.getElementById("taskList");
  //           const noTasksRow = document.getElementById("noTasksRow");
  //           if (taskList && noTasksRow) {
  //               const taskRows = taskList.querySelectorAll("tr:not(#noTasksRow)");
  //               if (taskRows.length === 0) {
  //                   noTasksRow.style.display = "table-row";
  //               }
  //           }
  //           try {
  //             updateKanbanCounts();
  //           } catch(_) {}
  //           try {
  //             toastr.success('Task deleted successfully', 'Success', {
  //             timeOut: 3000,
  //             closeButton: true,
  //             progressBar: true
  //           });
  //           } catch(_) {}
  //         } else {
  //           alert("Error: " + (data.error || 'Unknown error'));
  //         }
  //       })
  //       .catch((error) => {
  //         console.error("Error:", error);
  //         alert("Error deleting task");
  //       });
  //     });
  //   });
  // });
  // ------------------------Drag and Drop functionality  for kanban----------------------------
  let draggedCard = null;
  let originalColumn = null;

  // Delete Reason Modal (reusable)
  function showDeleteReasonModal(callback) {
    const existing = document.getElementById('deleteReasonModal');
    if (existing) existing.remove();
  
    const html = `
      <style>
        /* === Placeholder and Text === */
        #deleteReasonInput::placeholder {
          color: #555 !important;
          opacity: 1;
        }
        #deleteReasonInput {
          color: #212529;
          caret-color: #000;
          width: 100%;
          border: 1px solid #ced4da;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          background-color: #fff;
          display: block;
          margin: 0 auto;
        }
  
        /* === Invalid Input Icon + Spacing === */
        #deleteReasonInput.is-invalid {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23dc3545' viewBox='0 0 16 16'%3e%3cpath d='M11.536 14.01L14.01 11.536a8 8 0 1 0-11.314 0L4.464 14.01a6 6 0 1 1 7.072 0z'/%3e%3cpath d='M8 5.5a.5.5 0 0 1 .5.5v3.5a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zM8 11a.625.625 0 1 1 0 1.25A.625.625 0 0 1 8 11z'/%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right calc(0.375em + 0.1875rem) center;
          background-size: 1rem 1rem;
          padding-right: 2rem !important;
          border-color: #dc3545 !important;
          box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.1);
        }
  
        /* === Input Wrapper === */
        #deleteReasonModal .input-wrapper {
          width: 90%;
          margin: 0 auto 1rem auto;
          text-align: left;
          position: relative;
        }
  
        /* === Label Centered === */
        #deleteReasonModal label.form-label {
          display: block;
          font-weight: 600;
          text-align: center;
          margin-bottom: 0.5rem;
        }
  
        /* === Feedback Aligned Perfectly Below Input === */
        #deleteReasonModal .invalid-feedback {
          width: 90%;
         font-size: 0.875rem;
          color: #dc3545;
          text-align: left;
        }
  
        /* === Modal Layout === */
        #deleteReasonModal .modal-content {
          border-radius: 0.75rem;
          overflow: hidden;
        }
        #deleteReasonModal .modal-header {
          background-color: #dc3545;
          color: #fff;
        }
        #deleteReasonModal .modal-body {
          background-color: #f8f9fa;
        }
        #deleteReasonModal .modal-footer {
          background-color: #f8f9fa;
          border-top: 1px solid #dee2e6;
        }
      </style>
  
      <div class="modal fade" id="deleteReasonModal" tabindex="-1" aria-labelledby="deleteReasonModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content shadow-lg border-0 rounded-3 overflow-hidden">
            <div class="modal-header bg-danger text-white py-3">
              <h5 class="modal-title fw-semibold" id="deleteReasonModalLabel">
                <i class="bi bi-exclamation-triangle me-2"></i> Confirm Delete
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
  
            <div class="modal-body bg-light text-center">
              <div class="alert alert-warning d-flex align-items-center justify-content-center" role="alert">
                <i class="bi bi-exclamation-circle-fill me-2 fs-5 text-warning"></i>
                <div>Are you sure you want to delete this task? This action cannot be undone.</div>
              </div>
  
              <div class="input-wrapper">
                <label for="deleteReasonInput" class="form-label fw-semibold text-center d-block">
                  Reason for deletion <span class="text-danger">(required)</span>
                </label>
                <textarea
                  class="form-control"
                  id="deleteReasonInput"
                  rows="3"
                  placeholder="Enter reason..."
                ></textarea>
                <div class="invalid-feedback">Please provide a reason.</div>
              </div>
            </div>
  
            <div class="modal-footer bg-light border-top">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">
                <i class="bi bi-x-circle me-1"></i> Cancel
              </button>
              <button type="button" class="btn btn-danger" id="confirmDeleteWithReason">
                <i class="bi bi-trash3-fill me-1"></i> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  
    document.body.insertAdjacentHTML('beforeend', html);
    const modalEl = document.getElementById('deleteReasonModal');
    const modal = new bootstrap.Modal(modalEl);
    const input = modalEl.querySelector('#deleteReasonInput');
    const confirmBtn = modalEl.querySelector('#confirmDeleteWithReason');
  
    function trySubmit() {
      const value = (input.value || '').trim();
      if (!value) {
        input.classList.add('is-invalid');
        return;
      }
      input.classList.remove('is-invalid');
      modal.hide();
      callback(value);
    }
  
    confirmBtn.addEventListener('click', trySubmit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        trySubmit();
      }
    });
  
    modalEl.addEventListener('hidden.bs.modal', function () {
      modalEl.remove();
    });
  
    modal.show();
    setTimeout(() => input.focus(), 200);
  }
  
  

  function allowDrop(ev) {
    ev.preventDefault();
    const column = ev.currentTarget;
    column.classList.add("drag-over");
  }

  function drag(ev) {
    draggedCard = ev.target;
    originalColumn = ev.target.closest(".kanban-column");
    ev.target.classList.add("dragging");

    // Set the task ID in dataTransfer
    ev.dataTransfer.setData("text/plain", draggedCard.dataset.taskId);
  }

  function dragEnd(ev) {
    ev.target.classList.remove("dragging");
    document.querySelectorAll(".kanban-column").forEach((column) => {
      column.classList.remove("drag-over");
    });
  }

function drop(ev) {
  ev.preventDefault();
  const column = ev.currentTarget;
  column.classList.remove("drag-over");

  if (!draggedCard || !draggedCard.dataset.taskId) {
    console.error("No task ID found on dragged card");
    return;
  }

  const taskId = draggedCard.dataset.taskId;
  const newStatus = column.dataset.status;

  // Don't do anything if dropped in the same column
  if (originalColumn && originalColumn.dataset.status === newStatus) return;

  // Find the element we're dropping before (if any)
  let afterElement = null;
  const mouseY = ev.clientY;
  const cards = Array.from(column.querySelectorAll(".task-card:not(.dragging)"));
  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    if (mouseY < rect.top + rect.height / 2) {
      afterElement = card;
      break;
    }
  }

  // Move the card in the DOM at the correct position
  if (afterElement) column.insertBefore(draggedCard, afterElement);
  else column.appendChild(draggedCard);

  // Get CSRF token
  const csrfToken = getCookie("csrftoken");

  // First fetch task data to preserve assignee
  fetch(`/tasks/${taskId}/view/`)
    .then(r => r.json())
    .then(viewData => {
      // Prepare form-encoded payload
      const payload = new URLSearchParams();
      payload.append("status", newStatus);
      if (viewData && viewData.assigned_to_id) {
        payload.append("assigned_to", viewData.assigned_to_id);
      }

      // Send POST to edit endpoint
      return fetch(`/tasks/${taskId}/edit/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-CSRFToken": csrfToken
        },
        body: payload.toString()
      });
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        // Update List view row
        const listRow = document.querySelector(`tr[data-task-id="${taskId}"]`);
        if (listRow) {
          const statusCell = listRow.querySelector("td:nth-child(6) .badge");
          if (statusCell) {
            statusCell.className = `badge ${getStatusBadgeClass(newStatus)}`;
            statusCell.textContent = newStatus;
          }
        }
        // Update Kanban counts
        updateKanbanCounts();
        // Update overdue alert count after drag-drop status change
        try { updateOverdueCount(); } catch (e) {}
        // Refresh card in DOM if needed
        try { refreshTaskInDom(String(taskId)); } catch (e) {}
      } else {
        alert("Error updating task status: " + (data.error || "Unknown error"));
      }
    })
    .catch(err => {
      console.error("Drop status update failed:", err);
      alert("Error updating task status. Please try again.");
    });
}


  // Function to update kanban header counts
  function updateKanbanCounts() {
    const statuses = ['To-do', 'In Progress', 'Review', 'Done'];
    statuses.forEach(status => {
      const column = document.querySelector(`.kanban-column[data-status="${status}"]`);
      // Handle space in "In Progress" by replacing with hyphen
      const statusId = status.replace(/\s+/g, '-');
      const countEl = document.getElementById(`kanban-count-${statusId}`);
      if (column && countEl) {
        // Count task cards in the column
        const cardCount = column.querySelectorAll('.task-card').length;
        countEl.textContent = cardCount;
      }
    });
  }

  // Add dragover and dragleave event listeners to columns
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".kanban-column").forEach((column) => {
      column.addEventListener("dragover", allowDrop);
      column.addEventListener("dragleave", (ev) => {
        if (!ev.currentTarget.contains(ev.relatedTarget)) {
          ev.currentTarget.classList.remove("drag-over");
        }
      });
      column.addEventListener("drop", drop);
    });

    // Make all task cards draggable
    document.querySelectorAll(".task-card").forEach((card) => {
      card.draggable = true;
      card.addEventListener("dragstart", drag);
      card.addEventListener("dragend", dragEnd);
    });

    // Initial update of kanban counts
    updateKanbanCounts();
  });
  document.getElementById("sortTasks").addEventListener("change", function () {
    applyFilters(); // We'll update applyFilters to include sort
  });

  // Initialize overdue alert button and count
  try {
    document.addEventListener('DOMContentLoaded', function() {
      updateOverdueCount();
      const overdueBtn = document.getElementById('overdueAlertBtn');
      if (overdueBtn) {
        overdueBtn.addEventListener('click', function() {
          highlightOverdueRowsOnce();
        });
      }
    });
  } catch (e) { /* ignore */ }

//-----------------chat messages---------------------------------------
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatWithLabel = document.getElementById('chat-with-name') || null;
const employeeSelector = document.getElementById('employee-selector');
const chatFloatBtn = document.getElementById('chat-float-btn');
const chatCloseBtn = document.getElementById('chat-close');

let currentRoom = "public";
let chatSocket = null;
const currentUser = ((window.DJ && window.DJ.currentUsername) || '').trim().toLowerCase();
const isManager = ((window.DJ && window.DJ.currentRole) || '') === "Manager";

/** Normalize room names */
function makeRoomName(userA, userB) {
    return [userA.trim().toLowerCase(), userB.trim().toLowerCase()].sort().join("_");
}

/** Connect WebSocket */
function connectChatSocket(room) {
    if (chatSocket) chatSocket.close();

    console.log("[CONNECT] Trying to connect to room:", room);

    chatSocket = new WebSocket('ws://' + window.location.host + '/ws/chat/' + encodeURIComponent(room) + '/');

    chatSocket.onopen = function () {
        console.log("[WS OPENED] Connected to", room);
    };

    chatSocket.onerror = function (e) {
        console.error("[WS ERROR]", e);
    };

    chatSocket.onclose = function () {
        console.warn("[WS CLOSED] Disconnected from", room);
    };

    chatSocket.onmessage = function (e) {
        const data = JSON.parse(e.data);
        console.log("[WS RECEIVED]", data);

        // Ignore non-message events unless they are switch_room
        if (data.type === "switch_room" && !isManager && data.employee?.toLowerCase() === currentUser) {
            console.log("[EMPLOYEE] Switching to private chat with", data.manager);
            const roomName = makeRoomName(currentUser, data.manager);
            currentRoom = roomName;
            connectChatSocket(roomName);
            loadChatHistory(roomName, data.manager);
            openChatBox();
            return;
        }

        if (data.type && data.type !== "chat_message") return;

        if (data.message) {
            appendMessage(data.username, data.message, data.timestamp);
        }
    };
}

/** Append message to chat box */
function appendMessage(username, message, timestamp) {
    const msgDiv = document.createElement('div');
    msgDiv.className = "chat-message " + (username.trim().toLowerCase() === currentUser ? "sent" : "received");
    msgDiv.innerHTML = `<strong>${username}:</strong> ${message} <small>${timestamp || ''}</small>`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/** Load chat history */
function loadChatHistory(room, targetUser = null) {
    let url = room === "public"
        ? "/chat/messages/?room=public"
        : `/chat/get-room-and-messages/?Employee=${encodeURIComponent(targetUser)}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            chatMessages.innerHTML = '';
            (data.messages || []).forEach(msg => {
                appendMessage(msg.username, msg.message, msg.timestamp);
            });

            if (chatWithLabel) {
                chatWithLabel.innerText = room === "public"
                    ? "(All)"
                    : `(with ${targetUser})`;
            }
        })
        .catch(console.error);
}

/** Manager dropdown */
if (employeeSelector) {
    employeeSelector.addEventListener('change', function () {
        const selected = this.value;
        console.log("[DROPDOWN] Selected:", selected);

        if (selected === "public") {
            currentRoom = "public";
            connectChatSocket("public");
            loadChatHistory("public");
        } else {
            currentRoom = makeRoomName(currentUser, selected);
            connectChatSocket(currentRoom);
            loadChatHistory(currentRoom, selected);
        }
    });
}

/** Send message */
chatSendBtn.onclick = function () {
    const msg = chatInput.value.trim();
    if (!msg || !chatSocket) return;
    console.log("[SEND]", msg, "to room:", currentRoom);
    chatSocket.send(JSON.stringify({ 'message': msg }));
    chatInput.value = '';
};

chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') chatSendBtn.onclick();
});

/** Initial connection */
document.addEventListener("DOMContentLoaded", function () {
    console.log("[PAGE LOAD] Role:", isManager ? "Manager" : "Employee");

    if (isManager) {
        currentRoom = "public";
        connectChatSocket("public");
        loadChatHistory("public");
    } else if ((window.DJ && window.DJ.managerUsername)) {
    const managerUsername = (window.DJ.managerUsername || '').trim().toLowerCase();
    const roomName = makeRoomName(currentUser, managerUsername);
    currentRoom = roomName;

    if (employeeSelector) employeeSelector.value = managerUsername;
    connectChatSocket(roomName);
    loadChatHistory(roomName, managerUsername);
} else {
    console.error("[ERROR] No team found for employee.");
}
});

/** Floating chat toggle */
function openChatBox() {
    document.getElementById('chat-box').style.display = 'block';
}

if (chatFloatBtn) {
    chatFloatBtn.addEventListener('click', function () {
        const chatBox = document.getElementById('chat-box');
        chatBox.style.display = (chatBox.style.display === 'none' || chatBox.style.display === '') ? 'block' : 'none';
    });
}

if (chatCloseBtn) {
    chatCloseBtn.addEventListener('click', function () {
        document.getElementById('chat-box').style.display = 'none';
    });
}

//-------------------------- start and end date for add task code--------------------
document.addEventListener("DOMContentLoaded", function() {
    // Initialize page names
    loadPageNames();
    
    // Page name button handlers are now set up in the main DOMContentLoaded above
    
    // Add task modal date constraints
    const taskStartDate = document.getElementById("taskStartDate");
    const taskDueDate = document.getElementById("taskDueDate");
    const today = new Date().toISOString().split("T")[0];
    
    taskStartDate.setAttribute("min", today);
    taskDueDate.setAttribute("min", today);
    
    taskStartDate.addEventListener("change", function () {
      if (taskStartDate.value) {
        taskDueDate.min = taskStartDate.value;
        if (taskDueDate.value < taskStartDate.value) {
          taskDueDate.value = "";
        }
      } else {
        taskDueDate.min = today;
      }
    });

    // Edit task modal date constraints
    const editTaskStartDate = document.getElementById("editTaskStartDate");
    const editTaskDueDate = document.getElementById("editTaskDueDate");

    editTaskStartDate.addEventListener("change", function () {
        if (this.value) {
            editTaskDueDate.min = this.value;
            if (editTaskDueDate.value < this.value) {
                editTaskDueDate.value = "";
            }
        }
    });

    // ================= Year input restriction for task date inputs (prevent more than 4 digits) =================
    const taskDateInputs = [taskStartDate, taskDueDate, editTaskStartDate, editTaskDueDate];
    
    taskDateInputs.forEach(input => {
        if (!input) return;
        
        // Validate on change (selection or typing)
        input.addEventListener('change', function () {
            if (this.value) {
                const year = this.value.split('-')[0];
                if (year && year.length > 4) {
                    toastr.error('Year cannot be more than 4 digits!', 'Invalid Date', {
                        timeOut: 3000,
                        closeButton: true,
                        progressBar: true
                    });
                    this.value = ''; // Clear invalid input
                    this.classList.add('is-invalid');
                }
            }
        });

        // Prevent pasting invalid year
        input.addEventListener('paste', function (e) {
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const year = paste.split('-')[0];
            if (year && year.length > 4) {
                e.preventDefault();
                toastr.error('Year cannot be more than 4 digits!', 'Invalid Date', {
                    timeOut: 3000,
                    closeButton: true,
                    progressBar: true
                });
            }
        });

        // Prevent typing more than 4 digits in year field
        input.addEventListener('input', function (e) {
            if (this.value) {
                const year = this.value.split('-')[0];
                if (year && year.length > 4) {
                    // Limit to 4 digits for year
                    const parts = this.value.split('-');
                    parts[0] = parts[0].slice(0, 4);
                    this.value = parts.join('-');
                    toastr.warning('Year limited to 4 digits', 'Date Input', {
                        timeOut: 2000,
                        closeButton: true
                    });
                }
            }
        });
    });

    // Set min for due date when edit modal is shown and populated
    const editModalEl = document.getElementById('editTaskModal');
    editModalEl.addEventListener('shown.bs.modal', function () {
        const startDateVal = editTaskStartDate.value;
        if (startDateVal) {
            editTaskDueDate.min = startDateVal;
        }
    });
});

// ================= Year input restriction for all date inputs (global) =================
document.addEventListener('input', function(e) {
  const t = e.target;
  if (t && t.tagName === 'INPUT' && t.type === 'date') {
    // Normalize: keep only first 4 digits in year segment if user types more
    const val = String(t.value || '');
    if (val.length >= 4) {
      const parts = val.split('-');
      if (parts.length > 0) {
        const year = (parts[0] || '').replace(/\D/g, '').slice(0, 4);
        const rest = parts.slice(1).join('-');
        const newVal = year + (rest ? '-' + rest : '');
        if (newVal !== val) t.value = newVal;
      }
    }
  }
});

// --- Dynamic Assignee Dropdown for Add Task Modal ---
document.addEventListener("DOMContentLoaded", function() {
  const projectSelect = document.getElementById("taskProject");
  const assigneeSelect = document.getElementById("taskAssignee");
  const addTaskModalEl = document.getElementById('addTaskModal');
  



  if (projectSelect && assigneeSelect) {
    // Define and use loadAssignableUsers for add-task modal
    function loadAssignableUsers() {
      const projectId = projectSelect.value;
      if (!projectId) {
        // reset options
        assigneeSelect.innerHTML = '<option value="" disabled selected>Select Assignee</option>';
        return;
      }
      // Reuse loadAssignees(projectId, select)
      try {
        loadAssignees(projectId, assigneeSelect);
      } catch (e) {
        console.error('loadAssignees not available', e);
      }
    }
    projectSelect.addEventListener("change", loadAssignableUsers);
    if (addTaskModalEl) {
      addTaskModalEl.addEventListener('shown.bs.modal', function () {
        loadAssignableUsers();
      });
    }
  }
});
document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
document.body.classList.remove('modal-open');

// ✅ Helper: Basic field validation before submission
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

// ✅ Prevent Enter from closing modal & trigger validation + correct button
// ------------------------ Enter key handling for modals ------------------------
['addTaskForm', 'editTaskForm'].forEach(formId => {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('keydown', function (e) {
        // Only trigger for Enter key outside of textarea
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault(); // prevent default form submission

            // Run all validations
            let valid = true;
            form.querySelectorAll('input, select, textarea').forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('is-invalid');
                    field.classList.remove('is-valid');
                    valid = false;
                } else {
                    field.classList.remove('is-invalid');
                    field.classList.add('is-valid');
                }

                // Task title regex validation
                if (field.id === 'taskTitle' || field.id === 'editTaskTitle') {
                    const pattern = /^[a-zA-Z0-9\s\-_.,()]*$/;
                    if (!pattern.test(field.value.trim())) {
                        field.classList.add('is-invalid');
                        field.classList.remove('is-valid');
                        valid = false;
                        if (field.nextElementSibling) {
                            field.nextElementSibling.textContent = 'Task title should have only letters, numbers, and spaces.';
                        }
                    }
                }
            });

            if (!valid) {
                // toastr.warning('Please fix the highlighted fields.', 'Validation Error', {timeOut: 3000, closeButton: true, progressBar: true});
                return;
            }

            // Trigger appropriate button click
            const modal = e.target.closest('.modal.show');
            if (!modal) return;
            if (modal.id === 'addTaskModal') {
                const saveBtn = modal.querySelector('#saveTaskBtn');
                if (saveBtn) saveBtn.click();
            } else if (modal.id === 'editTaskModal') {
                const updateBtn = modal.querySelector('#updateTaskBtn');
                if (updateBtn) updateBtn.click();
            }
        }
    });
});


document.addEventListener('DOMContentLoaded', function() {
  const taskDistributionBtn = document.getElementById('taskDistributionBtn');
  if (taskDistributionBtn) {
    taskDistributionBtn.addEventListener('click', function() {
      loadTaskDistribution();
    });
  }
});

function loadTaskDistribution() {
  fetch('/api/task-distribution/', {
    headers: {
      'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      displayTaskDistribution(data.projects);
      // Show the modal
      const modal = new bootstrap.Modal(document.getElementById('taskDistributionModal'));
      modal.show();
    } else {
      alert('Error loading task distribution: ' + (data.error || 'Unknown error'));
    }
  })
  .catch(error => {
    console.error('Error loading task distribution:', error);
    alert('Error loading task distribution data');
  });
}

function displayTaskDistribution(projects) {
  const content = document.getElementById('distributionContent');
  content.innerHTML = '';

  if (!projects || projects.length === 0) {
    content.innerHTML = '<div class="text-center text-muted"><p>No projects found</p></div>';
    return;
  }

  projects.forEach(project => {
    const projectCard = createProjectCard(project);
    content.appendChild(projectCard);
  });
}

function createProjectCard(project) {
  const card = document.createElement('div');
  card.className = 'card mb-4';
  
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header bg-light text-white';
  cardHeader.innerHTML = `<h5 class="mb-0"><i class="bi bi-folder me-2"></i>${project.name}</h5>`;
  
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body';
  
  const row = document.createElement('div');
  row.className = 'row';
  
  // Left side - Table
  const tableCol = document.createElement('div');
  tableCol.className = 'col-md-6';
  
  const table = document.createElement('table');
  table.className = 'table table-striped table-hover';
  
  const tableHeader = document.createElement('thead');
  tableHeader.className = 'table-dark';
  tableHeader.innerHTML = `
    <tr>
      <th>Assignee Name</th>
      <th>Completed Tasks</th>
      <th>Total Tasks</th>
      <th>Completion %</th>
    </tr>
  `;
  
  const tableBody = document.createElement('tbody');
  
  project.assignees.forEach(assignee => {
    const row = document.createElement('tr');
    const completionPercentage = assignee.total_tasks > 0 ? 
      Math.round((assignee.completed_tasks / assignee.total_tasks) * 100) : 0;
    
    row.innerHTML = `
      <td><strong>${assignee.name}</strong></td>
      <td><span class="badge bg-success">${assignee.completed_tasks}</span></td>
      <td><span class="badge bg-info">${assignee.total_tasks}</span></td>
      <td><span class="badge ${getCompletionBadgeClass(completionPercentage)}">${completionPercentage}%</span></td>
    `;
    tableBody.appendChild(row);
  });
  
  table.appendChild(tableHeader);
  table.appendChild(tableBody);
  tableCol.appendChild(table);
  
  // Right side - Pie Chart
  const chartCol = document.createElement('div');
  chartCol.className = 'col-md-6';
  
  const chartContainer = document.createElement('div');
  chartContainer.className = 'chart-container';
  chartContainer.style.position = 'relative';
  chartContainer.style.height = '300px';
  
  const canvas = document.createElement('canvas');
  canvas.id = `chart-${project.id}`;
  chartContainer.appendChild(canvas);
  chartCol.appendChild(chartContainer);
  
  row.appendChild(tableCol);
  row.appendChild(chartCol);
  cardBody.appendChild(row);
  
  card.appendChild(cardHeader);
  card.appendChild(cardBody);
  
  setTimeout(() => {
    createPieChart(project, canvas.id);
  }, 100);
  
  return card;
}

function createPieChart(project, canvasId) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  const labels = project.assignees.map(assignee => assignee.name);
  const data = project.assignees.map(assignee => assignee.completed_tasks);
  const colors = generateColors(project.assignees.length);
  
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace('0.8', '1')),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `Task Completion Distribution - ${project.name}`,
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const assignee = project.assignees[context.dataIndex];
              const percentage = assignee.total_tasks > 0 ? 
                Math.round((assignee.completed_tasks / assignee.total_tasks) * 100) : 0;
              return `${context.label}: ${context.parsed} completed (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function generateColors(count) {
  const colors = [];
  const saturation = 70; // percentage — controls how vivid the colors are
  const lightness = 55;  // percentage — controls how bright/dark they are
  const alpha = 0.8;     // transparency level

  for (let i = 0; i < count; i++) {
    // Evenly distribute hues around the color wheel (0–360 degrees)
    const hue = Math.floor((360 / count) * i);
    const color = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    colors.push(color);
  }

  return colors;
}


// Get completion badge class based on percentage
function getCompletionBadgeClass(percentage) {
  if (percentage >= 80) return 'bg-success';
  if (percentage >= 60) return 'bg-warning text-dark';
  if (percentage >= 40) return 'bg-info';
  return 'bg-danger';
}

function checkAndShowNoTasksRow() {
  const taskRows = document.querySelectorAll('tr[data-task-id]');
  const noTasksRow = document.getElementById('noTasksRow');
  
  if (taskRows.length === 0) {
    if (noTasksRow) noTasksRow.style.display = 'table-row';
  } else {
    if (noTasksRow) noTasksRow.style.display = 'none';
  }
}

// Fetch task view data and show the view modal (reusable function)
function fetchAndShowViewModal(taskId) {
  if (!taskId) return;
  fetch(`/tasks/${taskId}/view/`, {
    headers: {
      "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) throw new Error(data.error);

      const pageName = data.page_name && data.page_name.trim() !== "" ? data.page_name : "No page name specified";

      document.getElementById("viewTaskTitle").textContent = data.title || "—";
      document.getElementById("viewTaskProject").textContent = data.project_name || "—";
      document.getElementById("viewTaskDescription").textContent = data.description || "—";

      const pageNameEl = document.getElementById("viewTaskPageName");
      if (pageNameEl) pageNameEl.textContent = pageName;

      const statusBadge = document.createElement("span");
      statusBadge.className = `badge ${getStatusBadgeClass(data.status)}`;
      statusBadge.textContent = data.status;
      document.getElementById("viewTaskStatus").innerHTML = "";
      document.getElementById("viewTaskStatus").appendChild(statusBadge);

      const priorityBadge = document.createElement("span");
      priorityBadge.className = `badge ${getPriorityBadgeClass(data.priority)}`;
      priorityBadge.textContent = data.priority;
      document.getElementById("viewTaskPriority").innerHTML = "";
      document.getElementById("viewTaskPriority").appendChild(priorityBadge);

      const assigneeDiv = document.createElement("div");
      assigneeDiv.className = "d-flex align-items-center";
      assigneeDiv.innerHTML = `<span>${data.assigned_to_name}</span>`;
      document.getElementById("viewTaskAssignee").innerHTML = "";
      document.getElementById("viewTaskAssignee").appendChild(assigneeDiv);

      const startDateBadge = document.createElement("span");
      startDateBadge.className = data.start_date ? "badge bg-info" : "badge bg-secondary";
      startDateBadge.textContent = data.start_date
        ? new Date(data.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Not set";
      document.getElementById("viewTaskStartDate").innerHTML = "";
      document.getElementById("viewTaskStartDate").appendChild(startDateBadge);

      const dueDateBadge = document.createElement("span");
      dueDateBadge.className = `badge ${getDueDateBadgeClass(data.due_date)}`;
      dueDateBadge.textContent = data.due_date || "Not set";
      document.getElementById("viewTaskDueDate").innerHTML = "";
      document.getElementById("viewTaskDueDate").appendChild(dueDateBadge);

      document.getElementById("viewTaskCreated").textContent = data.created_at || "—";

      if (typeof loadModalComments === "function") {
        loadModalComments(taskId);
      }

      // Wire modal Edit/Delete buttons
      const viewEditBtn = document.getElementById('viewEditBtn');
      const viewDeleteBtn = document.getElementById('viewDeleteBtn');
      if (viewEditBtn) {
        viewEditBtn.dataset.taskId = taskId;
        // remove previous handlers by cloning
        const newEditBtn = viewEditBtn.cloneNode(true);
        viewEditBtn.parentNode.replaceChild(newEditBtn, viewEditBtn);
        newEditBtn.addEventListener('click', function(e) {
          e.preventDefault();
          // Hide the view modal first so edit modal appears on top and backdrops are correct
          try {
            const viewEl = document.getElementById('viewTaskModal');
            const viewInstance = bootstrap.Modal.getInstance(viewEl);
            if (viewInstance) viewInstance.hide();
          // blur any focused element inside the view modal to avoid aria-hidden focus issues
          try { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); } catch(e) {}
          // remove any lingering backdrops
          document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
          } catch (err) { /* ignore */ }

          // Open edit modal and populate using same edit endpoint
          const editModalEl = document.getElementById('editTaskModal');
          const editModal = new bootstrap.Modal(editModalEl);
          editModal.show();

          const prefRole = localStorage.getItem(`taskRole:${taskId}`) || '';
          const url = prefRole ? `/tasks/${taskId}/edit/?assignee_pref_role=${encodeURIComponent(prefRole)}` : `/tasks/${taskId}/edit/`;
          fetch(url, {
            headers: {
              "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
            },
          })
            .then((response) => response.json())
            .then((edata) => {
              if (edata.error) throw new Error(edata.error);
              document.getElementById("editTaskId").value = taskId;
              document.getElementById("editTaskTitle").value = edata.title || "";
              document.getElementById("editTaskProject").value = edata.project_id || "";
              document.getElementById("editTaskDescription").value = edata.description || "";
              document.getElementById("editTaskStartDate").value = edata.start_date || "";
              document.getElementById("editTaskDueDate").value = edata.due_date || "";
              document.getElementById("editTaskStatus").value = edata.status || "";
              document.getElementById("editTaskPriority").value = edata.priority || "";

              // Store page name to set after dropdown loads
              const pageNameToSet = edata.page_name || "";

              let assigneeValue = null;
              if (edata.assigned_to_id && edata.assigned_to_role) {
                assigneeValue = `${edata.assigned_to_id}:${edata.assigned_to_role}`;
              }
              if (prefRole && edata.assigned_to_id) {
                assigneeValue = `${edata.assigned_to_id}:${prefRole}`;
              }
              // Ensure assignees and page names are loaded and then preselect
              Promise.all([
                loadAssignees(edata.project_id, document.getElementById("editTaskAssignee"), assigneeValue),
                loadProjectPageNames(edata.project_id, 'editTaskPageName', false)
              ]).then(() => {
                // Set page name after dropdown is loaded
                if (pageNameToSet) {
                  selectPageName('editTaskPageName', pageNameToSet);
                }
              }).catch(err => console.error(err));
            })
            .catch(err => {
              console.error('Error loading edit data:', err);
              alert('Error loading edit data: ' + err.message);
              try { bootstrap.Modal.getInstance(editModalEl).hide(); } catch (e) {}
            });
        });
      }

      if (viewDeleteBtn) {
        viewDeleteBtn.dataset.taskId = taskId;
        const newDeleteBtn = viewDeleteBtn.cloneNode(true);
        viewDeleteBtn.parentNode.replaceChild(newDeleteBtn, viewDeleteBtn);
        newDeleteBtn.addEventListener('click', function(e) {
          e.preventDefault();
          try { if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); } catch(e) {}
          showDeleteReasonModal(function(reason) {
            const payload = new URLSearchParams();
            if (reason) payload.append('reason', reason);
            fetch(`/tasks/${taskId}/delete/`, {
              method: 'POST',
              headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
                'Content-Type': 'application/x-www-form-urlencoded'
              },
              body: payload.toString()
            })
            .then(res => res.json())
            .then(d => {
              if (d.success) {
                // remove row and any kanban card
                const row = document.querySelector(`tr[data-task-id="${taskId}"]`);
                if (row) row.remove();
                const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
                if (card) card.remove();
                // Update kanban counts after deleting task
                updateKanbanCounts();
                checkAndShowNoTasksRow();
                // Update overdue alert count after delete
                try { updateOverdueCount(); } catch (e) {}

                // hide view modal
                try { bootstrap.Modal.getInstance(document.getElementById('viewTaskModal')).hide(); } catch (e) {}
                try { 
                    toastr.success('Task deleted successfully', 'Success', { 
                        timeOut: 3000, 
                        closeButton: true, 
                        progressBar: true 
                    }); 
                } catch(_) {}

              } else {
                alert('Error: ' + (d.error || 'Unknown error'));
              }
            })
            .catch(err => {
              console.error('Error deleting task:', err);
              alert('Error deleting task');
            });
          });
        });
      }

      const viewModal = new bootstrap.Modal(document.getElementById("viewTaskModal"));
      viewModal.show();
    })
    .catch((error) => {
      console.error("Error loading task data:", error);
      alert("Error loading task data: " + error.message);
    });
}

// Make table rows clickable to open the view modal (but ignore clicks inside dropdowns)
document.addEventListener('DOMContentLoaded', function() {
  const tableBody = document.getElementById('taskList');
  if (!tableBody) return;

  tableBody.querySelectorAll('tr[data-task-id]').forEach(tr => {
    tr.style.cursor = 'pointer';
    tr.addEventListener('click', function(e) {
      // Ignore clicks that happen on dropdowns, actions, or links inside the row
      if (e.target.closest('.dropdown') || e.target.closest('.dropdown-menu') || e.target.closest('a') || e.target.closest('button')) {
        return;
      }
      const taskId = this.dataset.taskId;
      fetchAndShowViewModal(taskId);
    });
  });
});
