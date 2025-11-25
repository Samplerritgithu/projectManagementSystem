

document.addEventListener("DOMContentLoaded", function () {
  const csrftoken = document.querySelector("[name=csrfmiddlewaretoken]")?.value;
  const selectAll = document.getElementById("selectAll");
  const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
  const notifCheckboxes = document.querySelectorAll(".notif-checkbox");
  const closeBtn = document.getElementById("closeBtn");

  // ✅ Close button functionality - go back to previous page
  closeBtn?.addEventListener("click", function () {
    // Check if there's a previous page in browser history
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // If no previous page, redirect to dashboard as fallback
      window.location.href = '/dashboard/';
    }
  });

  // ✅ Function to update button text based on selection
  function updateButtonText() {
    const selectedCount = Array.from(notifCheckboxes).filter(cb => cb.checked).length;
    if (selectedCount === 0) {
      deleteSelectedBtn.innerHTML = `<i class="bi bi-x-circle"></i> Clear`;
    } else if (selectedCount === 1) {
      deleteSelectedBtn.innerHTML = `<i class="bi bi-x-circle"></i> Clear`;
    } else {
      deleteSelectedBtn.innerHTML = `<i class="bi bi-x-circle"></i> Clear All`;
    }
  }

  // ✅ Select All functionality
  selectAll?.addEventListener("change", function () {
    notifCheckboxes.forEach(cb => cb.checked = this.checked);
    updateButtonText();
  });

  // ✅ Individual checkbox change
  notifCheckboxes.forEach(cb => {
    cb.addEventListener("change", function () {
      updateButtonText();
      selectAll.checked = Array.from(notifCheckboxes).every(cb => cb.checked);
    });
  });

  // ✅ Clear Selected functionality
  deleteSelectedBtn?.addEventListener("click", function () {
    const selected = Array.from(notifCheckboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    if (selected.length === 0) {
      alert("Please select at least one notification to clear.");
      return;
    }

    if (!confirm("Are you sure you want to delete selected notifications?")) return;

    const params = new URLSearchParams();
    selected.forEach(id => params.append("ids[]", id));

    fetch(NOTIFICATION_DATA_URL, {
      method: "POST",
      headers: {
        "X-CSRFToken": csrftoken,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(data.message);
          location.reload();
        } else {
          alert(data.error || "Error clearing notifications");
        }
      })
      .catch(() => alert("Failed to clear notifications."));
  });

  // ✅ Existing View Details logic
  document.querySelectorAll(".view-details").forEach((button) => {
    button.addEventListener("click", function () {
      const link = this.getAttribute("data-link");
      const type = this.dataset.type;
      const taskDetails = document.getElementById("taskDetails");
      const loadingSpinner = document.getElementById("taskLoadingSpinner");
      const titleEl = document.getElementById("taskModalLabel");

      // Get the notification container and mark as read
      const notificationContainer = this.closest('.list-group-item');
      const notificationId = notificationContainer.getAttribute('data-notification-id');
      
      // Mark notification as read if it's unread
      if (notificationContainer.classList.contains('unread') && notificationId) {
        markNotificationAsRead(notificationId, notificationContainer);
      }

      loadingSpinner.style.display = "block";
      taskDetails.innerHTML = "";

      if (titleEl) {
        if (type === "project") titleEl.textContent = "Project Details";
        else if (type === "user registration" || type === "user") titleEl.textContent = "User Details";
        else titleEl.textContent = "Task Details";
      }

      let resolvedLink = link;
      try {
        if (/^\/tasks\/\d+\/?$/.test(link)) {
          resolvedLink = link.replace(/\/?$/, '/view/');
        }
      } catch (_) {}

      fetch(resolvedLink, {
        method: "GET",
        headers: {
          "X-CSRFToken": csrftoken,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })
        .then(async response => {
          // If server accidentally returns HTML, fallback by trying /view/ once
          const contentType = response.headers.get('content-type') || '';
          if (!response.ok) throw new Error('Network error');
          if (!contentType.includes('application/json')) {
            // Try a last-chance fallback if link was not normalized
            if (resolvedLink === link && /^\/tasks\/\d+\/?$/.test(link)) {
              const retryUrl = link.replace(/\/?$/, '/view/');
              const retryRes = await fetch(retryUrl, { headers: { 'X-CSRFToken': csrftoken, Accept: 'application/json' } });
              if (retryRes.ok && (retryRes.headers.get('content-type') || '').includes('application/json')) {
                return retryRes.json();
              }
            }
            // If the task is deleted or we cannot get JSON, show the notification message (reason)
          let reasonHtml = '';

      // Show reason only if task is deleted
      if (data.deleted) {
        const messageEl = notificationContainer.querySelector('p.mb-1');
        const msgText = messageEl ? messageEl.textContent : '';
        const reasonMatch = msgText.match(/Reason:\s*(.*)$/);
        if (reasonMatch) {
          reasonHtml = `<div class="alert alert-warning mt-2"><strong>Reason:</strong> ${reasonMatch[1]}</div>`;
        }
      } 

          }
          return response.json();
        })
        .then(data => {
          loadingSpinner.style.display = "none";
          // Extract reason from notification message (if present)
          const messageEl = notificationContainer.querySelector('p.mb-1');
          const msgText = messageEl ? messageEl.textContent : '';
          const reasonMatch = msgText.match(/Reason:\s*(.*)$/);
          const reasonHtml = reasonMatch ? `<div class="alert alert-warning mt-2"><strong>Reason:</strong> ${reasonMatch[1]}</div>` : '';
          if (resolvedLink.includes("/users/")) {
            taskDetails.innerHTML = `
              <div class="card"><div class="card-body">
                <h5 class="card-title text-center">${data.username || "-"}</h5>
                <p><strong>Email:</strong> ${data.email || "-"}</p>
                <p><strong>Phone:</strong> ${data.phone || "-"}</p>
                <p><strong>Role:</strong> ${data.role || "-"}</p>
                <p><strong>EmpID:</strong> ${data.empid || "-"}</p>
                <p><strong>Date Joined:</strong> ${data.date_joined || "-"}</p>
              </div></div>`;
          } else if (resolvedLink.includes("/projects/")) {
            taskDetails.innerHTML = `
              <div class="card"><div class="card-body">
                <h5 class="card-title text-center">${data.name || "-"}</h5>
                
                <p><strong>Description:</strong> ${data.description || "-"}</p>
                <p><strong>Client:</strong> ${data.client_name || "-"}</p>
                <p><strong>Status:</strong> ${data.status || "-"}</p>
                <p><strong>Start Date:</strong> ${data.start_date || "-"}</p>
                <p><strong>End Date:</strong> ${data.end_date || "-"}</p>
                <p><strong>Progress:</strong> ${data.progress || "0"}%</p>
              </div></div>`;
          } else {
            taskDetails.innerHTML = `
              <div class="card"><div class="card-body">
                <h5 class="card-title text-center">${data.title}</h5>
                <p><strong>Description:</strong>${data.description || "No description provided"}</p>
                <p><strong>Page Name:</strong> ${data.page_name || "-"}</p>
                <div class="row">
                  <div class="col-md-6">
                    <p><strong>Project:</strong> ${data.project_name}</p>
                    <p><strong>Assigned To:</strong> ${data.assigned_to_name}</p>
                    <p><strong>Status:</strong> ${data.status}</p>
                  </div>
                  <div class="col-md-6">
                    <p><strong>Priority:</strong> ${data.priority}</p>
                    <p><strong>Due Date:</strong> ${data.due_date || "Not set"}</p>
                    <p><strong>Created At:</strong> ${data.created_at}</p>
                  </div>
                </div>
                ${reasonHtml}
              </div></div>`;
          }
        })
        .catch(error => {
          // If we already rendered a message above, skip overriding it
          if (!taskDetails.innerHTML) {
            loadingSpinner.style.display = "none";
            const messageEl = notificationContainer.querySelector('p.mb-1');
            const fallback = messageEl ? messageEl.textContent : `Error loading details. ${error.message}`;
            taskDetails.innerHTML = `<div class="alert alert-info">${fallback}</div>`;
          }
        });
    });
  });

  // Function to mark notification as read
  function markNotificationAsRead(notificationId, notificationContainer) {
    fetch(`/notifications/${notificationId}/mark-read/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': csrftoken,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Update the notification container styling
        notificationContainer.classList.remove('unread');
        notificationContainer.classList.add('read');
        
        // Update the notification count in the header
        updateNotificationCount();
      }
    })
    .catch(error => {
      console.error('Error marking notification as read:', error);
    });
  }

  // Function to update notification count (reuse existing function from base.html)
  function updateNotificationCount() {
    fetch('/notifications/count/')
      .then(res => res.json())
      .then(data => {
        // Update the notification badge in the header
        const notificationBadge = document.querySelector('.notification-badge');
        if (notificationBadge) {
          if (data.count > 0) {
            notificationBadge.textContent = data.count;
            notificationBadge.style.display = 'block';
          } else {
            notificationBadge.style.display = 'none';
          }
        }
      })
      .catch(error => {
        console.error('Error updating notification count:', error);
      });
  }
});

