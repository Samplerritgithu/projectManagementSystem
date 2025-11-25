document.addEventListener("DOMContentLoaded", function () {
  const teamForm = document.getElementById("team-form");
  const membersList = document.getElementById('members-list');
const membersSearchInput = document.getElementById('members-search');
  const membersSearch = document.getElementById('members-search');
  const dropdownTrigger = document.getElementById('members-dropdown-trigger');
  const dropdownContent = document.getElementById('members-dropdown-content');
  const teamLeadSelect = document.getElementById('team_lead');
  const teamRoleSelect = document.getElementById('team_role');
  const addRoleBtn = document.getElementById('add-role-btn');
  const newRoleInput = document.getElementById('new-role-input');
  const membersSearchInputInside = document.getElementById('members-search-input');


  let initialTeamData = {}; // store initial values for edit comparison

  window.openCreateTeamModal = function() {
    if(!teamForm) return;

    teamForm.reset();
    updateSelectedMembers();
    initialTeamData = {};

    const formTitle = document.getElementById("form-title");
    if(formTitle) formTitle.innerText = "Create Team";

    const submitBtn = document.getElementById("submit-button") || document.querySelector('#team-form button[type="submit"]');
    if(submitBtn) submitBtn.innerText = "Create Team";

    var teamModal = new bootstrap.Modal(document.getElementById('teamModal'));
    teamModal.show();
  };

  // ===== Filter Teams =====
  function filterTeams() {
    const project = document.getElementById('filterProject')?.value;
    const role = document.getElementById('filterRole')?.value.toLowerCase();
    const lead = document.getElementById('filterLead')?.value;
    const searchTerm = (document.getElementById('filterSearch')?.value || '').toLowerCase().trim();

    let anyVisible = false;
    document.querySelectorAll('.team-card').forEach(card => {
      // Dropdown filter matches
      const matchesProject = !project || card.dataset.project === project;
      const matchesRole = !role || card.dataset.role.toLowerCase() === role;
      const matchesLead = !lead || card.dataset.lead === lead;
      
      // Search term matches (searches across project name, role, lead name, and member names)
      let matchesSearch = true;
      if (searchTerm) {
        const projectName = (card.dataset.projectName || '').toLowerCase();
        const roleName = (card.dataset.roleName || '').toLowerCase();
        const leadName = (card.dataset.leadName || '').toLowerCase();
        const membersNames = (card.dataset.membersNames || '').toLowerCase();
        
        matchesSearch = projectName.includes(searchTerm) ||
                       roleName.includes(searchTerm) ||
                       leadName.includes(searchTerm) ||
                       membersNames.includes(searchTerm);
      }

      const visible = matchesProject && matchesRole && matchesLead && matchesSearch;
      card.style.display = visible ? '' : 'none';
      if(visible) anyVisible = true;
    });

    // Show/hide "no matching teams" message
    const noMatchingMsg = document.getElementById('no-matching-teams-message');
    if(noMatchingMsg) {
      // Check if there are any teams at all
      const totalTeams = document.querySelectorAll('.team-card').length;
      if(totalTeams > 0) {
        // There are teams, but none match the filter
        noMatchingMsg.style.display = anyVisible ? 'none' : 'block';
      } else {
        // No teams exist at all
        noMatchingMsg.style.display = 'none';
      }
    }

    // Show/hide "no teams available" message (only when no teams exist at all)
    const noTeamsMsg = document.getElementById('no-teams-message');
    if(noTeamsMsg) {
      const totalTeams = document.querySelectorAll('.team-card').length;
      noTeamsMsg.style.display = (totalTeams === 0) ? 'block' : 'none';
    }
  }

  document.getElementById('filterProject')?.addEventListener('change', filterTeams);
  document.getElementById('filterRole')?.addEventListener('change', filterTeams);
  document.getElementById('filterLead')?.addEventListener('change', filterTeams);
  document.getElementById('filterSearch')?.addEventListener('input', filterTeams);

  document.getElementById('resetTeamFilters')?.addEventListener('click', () => {
    document.getElementById('filterProject').value = '';
    document.getElementById('filterRole').value = '';
    document.getElementById('filterLead').value = '';
    document.getElementById('filterSearch').value = '';
    filterTeams();
  });

  // ===== Equal Height Sync =====
  function setEqualHeights() {
    const left = document.querySelector('.form-container');
    const right = document.querySelector('.team-list-wrapper');
    if (!left || !right) return;
    left.style.minHeight = right.style.minHeight = '';
    const maxH = Math.max(left.offsetHeight, right.offsetHeight);
    left.style.minHeight = right.style.minHeight = maxH + 'px';
  }
  setEqualHeights();
  window.addEventListener('resize', setEqualHeights);

  // ===== Validation =====
  function validateField(field, message) {
    if (!field) return false;
    const grp = field.closest('.form-group') || field.parentNode;
    const feedback = grp?.querySelector('.invalid-feedback');
    const val = (field.value || '').toString().trim();
    if (!val) {
      field.classList.add('is-invalid');
      field.classList.remove('is-valid');
      if (feedback) feedback.textContent = message;
      return false;
    }
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    if (feedback) feedback.textContent = '';
    return true;
  }

  function validateMembers() {
    if(!membersList) return true;
    const checked = membersList.querySelectorAll('input[type="checkbox"]:checked');
    const feedback = document.getElementById("members-feedback");
    const membersContainer = document.querySelector('.form-group.position-relative');
    if (checked.length === 0) {
      if (feedback) {
        feedback.textContent = "At least one team member is required.";
        feedback.style.display = "block";
      }
      if (membersContainer) {
        membersContainer.classList.add('has-error');
      }
      return false;
    }
    if (feedback) {
      feedback.textContent = "";
      feedback.style.display = "none";
    }
    if (membersContainer) {
      membersContainer.classList.remove('has-error');
      membersContainer.classList.add('has-success');
    }
    return true;
  }

  // ===== Team Form Submit =====
  if(teamForm) {
    teamForm.addEventListener("submit", function (e) {
      e.preventDefault();

      let valid = true;
      const projectField = document.getElementById("project_id");
      const leadField = document.getElementById("team_lead");
      const roleField = document.getElementById("team_role");

      if (!validateField(projectField, "Project is required.")) valid = false;
      if (!validateField(leadField, "Team Lead is required.")) valid = false;
      if (!validateMembers()) valid = false;

      const checkedMembers = membersList.querySelectorAll('input[type="checkbox"]:checked');
      let requiresRole = false;

      checkedMembers.forEach(cb => {
        const role = cb.getAttribute('data-user-role') || '';
        if (role === 'Developer' || role === 'Team Lead') requiresRole = true;
      });

      // Designer restriction
      let hasDesignerWithRole = false;
      if (roleField.value.trim()) {
        checkedMembers.forEach(cb => {
          const role = cb.getAttribute('data-user-role') || '';
          if (role === 'Designer') hasDesignerWithRole = true;
        });
      }
      if (hasDesignerWithRole) {
        toastr.error("Designers cannot be added to a role-based team.", "Invalid Selection");
        valid = false;
        return;
      }

      if (requiresRole && !roleField.value.trim()) {
        roleField.classList.add('is-invalid');
        roleField.classList.remove('is-valid');
        const feedback = roleField.closest('.form-group')?.querySelector('.invalid-feedback');
        if (feedback) feedback.textContent = "Team Role is required for Developers and Team Leads.";
        valid = false;
      } else if (roleField.value.trim()) {
        roleField.classList.remove('is-invalid');
        roleField.classList.add('is-valid');
        const feedback = roleField.closest('.form-group')?.querySelector('.invalid-feedback');
        if (feedback) feedback.textContent = "";
      } else {
        roleField.classList.remove('is-invalid', 'is-valid');
        const feedback = roleField.closest('.form-group')?.querySelector('.invalid-feedback');
        if (feedback) feedback.textContent = "";
      }

      if(!valid) return;

      const formData = new FormData(teamForm);
      const teamId = formData.get("team_id");
      
      // Only check for duplicates when CREATING a new team, not when EDITING
      if (!teamId || teamId.trim() === '') {
        // Stop if live duplicate selection flagged (only for new teams)
        if (isDuplicateTeamSelection()) return;
      }
      const currentMembers = Array.from(checkedMembers).map(cb => cb.value).sort().join(',');
      
      // Normalize values for comparison
      const currentProjectId = (projectField?.value || '').toString().trim();
      const currentLeadId = (leadField?.value || '').toString().trim();
      const currentRole = (roleField?.value || '').toString().trim();
      const currentMembersStr = currentMembers || '';

      if (teamId && initialTeamData) {
        const initialProjectId = (initialTeamData.projectId || '').toString().trim();
        const initialLeadId = (initialTeamData.leadId || '').toString().trim();
        const initialRole = (initialTeamData.teamRole || '').toString().trim();
        const initialMembersStr = (initialTeamData.members || '').toString().trim();
        
        if (
          initialProjectId === currentProjectId &&
          initialLeadId === currentLeadId &&
          initialRole === currentRole &&
          initialMembersStr === currentMembersStr
        ) {
          toastr.info("No changes detected. Team details remain unchanged.", "No Changes", {
            timeOut: 3000,
            closeButton: true,
            progressBar: true
          });
          // Close the modal after showing the message
          const teamModal = bootstrap.Modal.getInstance(document.getElementById('teamModal'));
          if (teamModal) {
            setTimeout(() => {
              teamModal.hide();
            }, 1500);
          }
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }

      fetch("/team/", {
        method: "POST",
        body: formData,
        headers: {
          "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
          "X-Requested-With": "XMLHttpRequest"
        }
      })
      .then(res => res.text())
      .then(text => {
        let data;
        try { data = JSON.parse(text); } catch { throw new Error("Server returned invalid JSON"); }
        if(data.success) {
          toastr.success(teamId ? "Team updated successfully!" : "Team created successfully!", "Success", {
            timeOut: 2500, closeButton: true, progressBar: true
          });
          // Close modal first
          const teamModal = bootstrap.Modal.getInstance(document.getElementById('teamModal'));
          if (teamModal) {
            teamModal.hide();
          }
          // Reload after a short delay to allow modal to close
          setTimeout(() => location.reload(), 500);
        } else {
          toastr.error(data.error || "Something went wrong.", "Error");
        }
      })
      .catch(err => {
        console.error("Fetch error:", err);
        toastr.error("Something went wrong: " + err.message, "Error");
      });
    });
  }

  // ===== Live duplicate team check on change/input =====
  // Only checks for duplicates when CREATING a new team, not when EDITING
  function isDuplicateTeamSelection() {
    try {
      // Skip duplicate check if we're editing an existing team
      const teamIdField = document.getElementById("team_id");
      const currentTeamId = teamIdField?.value || '';
      if (currentTeamId && currentTeamId.trim() !== '') {
        // We're editing, so skip duplicate checks
        const submitBtn = document.getElementById("submit-button");
        submitBtn && (submitBtn.disabled = false);
        return false;
      }

      // Only check for duplicates when creating a new team
      const projectField = document.getElementById("project_id");
      const leadField = document.getElementById("team_lead");
      const roleField = document.getElementById("team_role");
      const submitBtn = document.getElementById("submit-button");
      const projId = (projectField?.value || '').toString();
      const leadId = (leadField?.value || '').toString();
      const roleVal = (roleField?.value || '').toString();
      const selectedIds = Array.from(membersList?.querySelectorAll('input[type="checkbox"]:checked') || []).map(cb => cb.value).sort();
      const selectedKey = selectedIds.join(',');
      if (!projId || !leadId || selectedIds.length === 0) { submitBtn && (submitBtn.disabled = false); return false; }
      const cards = Array.from(document.querySelectorAll('.team-card'));
      // Broad duplicate per DB constraint: same project + same role
      const sameProjectRole = cards.some(card => {
        const cProj = card.getAttribute('data-project') || '';
        const cRole = (card.getAttribute('data-role') || '').toString();
        return cProj === projId && cRole === (roleVal || 'Designer');
      });
      if (sameProjectRole) {
        toastr.error('A team with this project and role already exists.', 'Error');
        submitBtn && (submitBtn.disabled = true);
        return true;
      }
      // Stricter duplicate (same project/lead/role/members) to guide user early
      const exactDup = cards.some(card => {
        const cProj = card.getAttribute('data-project') || '';
        const cLead = card.getAttribute('data-lead') || '';
        const cRole = (card.getAttribute('data-role') || '').toString();
        const cMembers = (card.getAttribute('data-members') || '').split(',').filter(Boolean).sort().join(',');
        return cProj === projId && cLead === leadId && cRole === (roleVal || 'Designer') && cMembers === selectedKey;
      });
      if (exactDup) {
        toastr.error('A team with the same project, lead, role and members already exists.', 'Error');
        submitBtn && (submitBtn.disabled = true);
        return true;
      }
      submitBtn && (submitBtn.disabled = false);
      return false;
    } catch (_) { return false; }
  }

  document.getElementById("project_id")?.addEventListener('change', isDuplicateTeamSelection);
  document.getElementById("team_lead")?.addEventListener('change', isDuplicateTeamSelection);
  document.getElementById("team_role")?.addEventListener('change', isDuplicateTeamSelection);
  membersList?.addEventListener('change', e => { if(e.target.type==='checkbox') isDuplicateTeamSelection(); });

  // ===== Add New Role =====
  addRoleBtn?.addEventListener('click', function() {
    const val = newRoleInput.value.trim();
    if(!val) return;

    fetch("/teams/add_role/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": document.querySelector('[name=csrfmiddlewaretoken]').value,
        "X-Requested-With": "XMLHttpRequest"
      },
      body: JSON.stringify({ role_name: val })
    })
    .then(res => res.text())
    .then(text => {
      let data;
      try { data = JSON.parse(text); } catch { throw new Error("Server returned invalid JSON"); }
      if(data.success) {
        if(!Array.from(teamRoleSelect.options).some(o => o.value.toLowerCase() === val.toLowerCase())) {
          const opt = document.createElement('option');
          opt.value = val;
          opt.text = val;
          teamRoleSelect.appendChild(opt);
        }
        teamRoleSelect.value = val;
        newRoleInput.value = '';
      } else {
        toastr.error(data.error || "Could not save role.", "Error");
      }
    })
    .catch(err => {
      console.error(err);
      toastr.error("Could not save role: " + err.message, "Error");
    });
  });

  // ===== Member Dropdown =====
function closeDropdown() {
  dropdownContent.style.display = 'none';
  membersSearchInputInside.value = '';
  filterMembers('');
}

function openDropdown() {
  dropdownContent.style.display = 'block';
  membersSearchInputInside.focus();
}
function toggleDropdown() {
  if (dropdownContent.style.display === 'block') closeDropdown();
  else openDropdown();
}
membersSearchInput.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleDropdown();
});

document.addEventListener('click', (e) => {
  if (!dropdownContent.contains(e.target) && e.target !== membersSearchInput) {
    closeDropdown();
  }
});

membersSearchInputInside.addEventListener('input', function() {
  filterMembers(this.value.toLowerCase());
});

  dropdownTrigger?.addEventListener('click', e => { e.stopPropagation(); toggleDropdown(); });
  document.addEventListener('click', e => {
    if (!dropdownTrigger?.contains(e.target) && !dropdownContent?.contains(e.target)) closeDropdown();
  });
  membersSearchInput?.addEventListener('input', function(){ filterMembers(this.value.toLowerCase()); });

  function filterMembers(term) {
    if(!membersList) return;
    membersList.querySelectorAll('.member-option').forEach(option => {
      const text = option.querySelector('.form-check-label')?.textContent.toLowerCase() || '';
      option.classList.toggle('hidden', !text.includes(term));
    });
  }

  function updateSelectedMembers() {
    if(!membersSearch) return;
    const selected = membersList.querySelectorAll('input[type="checkbox"]:checked').length;
    membersSearch.value = selected ? `${selected} member${selected > 1 ? 's' : ''} selected` : 'Search and select team members...';
  }
  membersList?.addEventListener('change', e => { if(e.target.type==='checkbox') updateSelectedMembers(); });

  // ===== Filter Members for Lead/Role =====
  function filterMembersForRole() {
    if(!teamLeadSelect || !membersList) return;
    const leadId = teamLeadSelect.value;
    const allowedRoles = ['Developer','Tester','Designer'];
    membersList.querySelectorAll('.member-option').forEach(option => {
      const checkbox = option.querySelector('input[type="checkbox"]');
      if(!checkbox) return;
      const role = checkbox.getAttribute('data-user-role') || '';
      if(!allowedRoles.includes(role) || checkbox.value === String(leadId)) {
        option.style.display='none'; checkbox.checked=false;
      } else option.style.display='';
    });
    updateSelectedMembers(); setEqualHeights();
  }
  teamLeadSelect?.addEventListener('change', filterMembersForRole);
  teamRoleSelect?.addEventListener('change', filterMembersForRole);
  filterMembersForRole();

  // ===== Edit Team =====
  window.editTeam = function(id, projectId, leadId, teamRole, memberIds) {
    if(!teamForm) return;

    document.getElementById("team_id").value = id;
    document.getElementById("project_id").value = projectId;
    document.getElementById("team_lead").value = leadId;

    const roleSelect = document.getElementById("team_role");
    if(teamRole && !Array.from(roleSelect.options).some(o => o.value === teamRole)) {
      const opt = document.createElement('option'); opt.value = teamRole; opt.text=teamRole; roleSelect.appendChild(opt);
    }
    roleSelect.value = teamRole || '';

    membersList.querySelectorAll('input[type="checkbox"]').forEach(cb=>cb.checked=false);
    const selectedMemberIds = memberIds ? memberIds.split(",").filter(Boolean) : [];
    selectedMemberIds.forEach(id => {
      const cb = document.getElementById(`checkbox-${id}`);
      if(cb) cb.checked=true;
    });
    updateSelectedMembers();

    // Normalize and store initial team data for comparison
    const normalizedMemberIds = selectedMemberIds.sort().join(',');
    initialTeamData = { 
      projectId: (projectId || '').toString().trim(), 
      leadId: (leadId || '').toString().trim(), 
      teamRole: (teamRole || '').toString().trim(), 
      members: normalizedMemberIds 
    };

    // Mark all fields with values as valid (tick marks)
    const projectField = document.getElementById("project_id");
    const leadField = document.getElementById("team_lead");
    
    if (projectField && projectField.value) {
      projectField.classList.remove('is-invalid');
      projectField.classList.add('is-valid');
    }
    
    if (leadField && leadField.value) {
      leadField.classList.remove('is-invalid');
      leadField.classList.add('is-valid');
    }
    
    if (roleSelect && roleSelect.value) {
      roleSelect.classList.remove('is-invalid');
      roleSelect.classList.add('is-valid');
    }
    
    // Validate members (add tick mark if members are selected)
    if (selectedMemberIds.length > 0) {
      validateMembers();
    }

    const formTitle = document.getElementById("form-title");
    if(formTitle) formTitle.innerText = "Update Team";

    const submitBtn = document.getElementById("submit-button") || document.querySelector('#team-form button[type="submit"]');
    if(submitBtn) {
      submitBtn.innerText = "Update Team";
      submitBtn.disabled = false; // Ensure button is enabled when editing
    }

    document.querySelector(".form-container")?.scrollIntoView({behavior:"smooth"});
    setTimeout(setEqualHeights,100);
    setTimeout(filterMembersForRole,120);

    // Show modal
    var teamModal = new bootstrap.Modal(document.getElementById('teamModal'));
    teamModal.show();
  };

  // ===== Delete Team =====
  // Insert the modal HTML into the page only once
if (!document.getElementById("deleteConfirmModal")) {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-labelledby="deleteConfirmLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header bg-danger text-white">
            <h5 class="modal-title" id="deleteConfirmLabel">Confirm Delete</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            Are you sure you want to delete this team? This action cannot be undone.
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" id="confirmDeleteBtn" class="btn btn-danger">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `);
}

window.deleteTeam = function(teamId) {
  const modalEl = document.getElementById("deleteConfirmModal");
  const confirmBtn = document.getElementById("confirmDeleteBtn");
  const bsModal = new bootstrap.Modal(modalEl);

  // Show modal
  bsModal.show();

  // Remove old event listener before adding new one
  confirmBtn.replaceWith(confirmBtn.cloneNode(true));
  const newConfirmBtn = document.getElementById("confirmDeleteBtn");

  newConfirmBtn.addEventListener("click", function() {
    fetch(`/teams/delete/${teamId}/`, {
      method: "POST",
      headers: {
        "X-CSRFToken": document.querySelector("[name=csrfmiddlewaretoken]").value,
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    })
    .then(res => res.text())
    .then(text => {
      let data;
      try { data = JSON.parse(text); } 
      catch { throw new Error("Server returned invalid JSON"); }

      if (data.success) {
        toastr.success("Team deleted successfully!", "Success", {
          timeOut: 3000, closeButton: true, progressBar: true
        });
        document.getElementById(`team-${teamId}`)?.remove();
      } else {
        toastr.error(data.error || "Failed to delete team.");
      }
    })
    .catch(err => {
      console.error("Delete error:", err);
      toastr.error("Something went wrong.");
    })
    .finally(() => {
      bsModal.hide();
    });
  });
};


  // ===== Submit Button Handler (outside form) =====
  const submitButton = document.getElementById("submit-button");
  if (submitButton && teamForm) {
    // Use form's submit event instead of button click to avoid duplicate handlers
    // The form submit handler will handle everything
  }

  // ===== Live Validation for Create Team (Tick Marks) =====
  // Add live validation listeners to all form fields
  if (teamForm) {
    const projectField = document.getElementById("project_id");
    const leadField = document.getElementById("team_lead");
    const roleField = document.getElementById("team_role");

    // Live validation for project
    if (projectField) {
      projectField.addEventListener('change', function() {
        if (this.value && this.value.trim() !== '') {
          validateField(this, "Project is required.");
        }
      });
    }

    // Live validation for team lead
    if (leadField) {
      leadField.addEventListener('change', function() {
        if (this.value && this.value.trim() !== '') {
          validateField(this, "Team Lead is required.");
        }
      });
    }

    // Live validation for team role
    if (roleField) {
      roleField.addEventListener('change', function() {
        if (this.value && this.value.trim() !== '') {
          this.classList.remove('is-invalid');
          this.classList.add('is-valid');
          const feedback = this.closest('.form-group')?.querySelector('.invalid-feedback') || 
                          this.closest('.mb-3')?.querySelector('.invalid-feedback');
          if (feedback) feedback.textContent = "";
        }
      });
    }

    // Live validation for members (when checkboxes change)
    if (membersList) {
      membersList.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox') {
          updateSelectedMembers();
          validateMembers();
        }
      });
    }
  }

  // ===== Reset Validation on Modal Close =====
  const teamModalEl = document.getElementById('teamModal');
  if (teamModalEl) {
    teamModalEl.addEventListener('hidden.bs.modal', function() {
      // Reset form
      if (teamForm) {
        teamForm.reset();
      }

      // Clear all validation states (is-valid and is-invalid classes)
      const allFields = teamForm?.querySelectorAll('input, select, textarea');
      if (allFields) {
        allFields.forEach(field => {
          field.classList.remove('is-valid', 'is-invalid');
        });
      }

      // Clear all invalid-feedback messages
      const allFeedback = teamForm?.querySelectorAll('.invalid-feedback');
      if (allFeedback) {
        allFeedback.forEach(feedback => {
          feedback.textContent = '';
        });
      }

      // Reset members feedback
      const membersFeedback = document.getElementById("members-feedback");
      if (membersFeedback) {
        membersFeedback.textContent = "";
        membersFeedback.style.display = "none";
      }

      // Reset members container classes
      const membersContainer = document.querySelector('.form-group.position-relative');
      if (membersContainer) {
        membersContainer.classList.remove('has-error', 'has-success');
      }

      // Reset selected members display
      updateSelectedMembers();

      // Reset initial team data
      initialTeamData = {};
      
      // Clear team_id hidden field
      const teamIdField = document.getElementById("team_id");
      if (teamIdField) {
        teamIdField.value = '';
      }
      
      // Reset form title and button text
      const formTitle = document.getElementById("form-title");
      if(formTitle) formTitle.innerText = "Create Team";
      const submitBtn = document.getElementById("submit-button");
      if(submitBtn) submitBtn.innerText = "Create Team";
    });
  }

});
