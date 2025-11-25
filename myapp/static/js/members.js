document.addEventListener('DOMContentLoaded', function() {
  // Initialize Bootstrap tooltips
  var tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Initial icon handling & hide edit/delete for special roles
  document.querySelectorAll('.member-card').forEach(card => {
    const role = card.getAttribute('data-role');

    // Hide Edit/Delete buttons for Tester and Team Lead
    if (role === 'Tester' || role === 'Team Lead') {
      const editBtn = card.querySelector('.edit-member');
      const deleteBtn = card.querySelector('.delete-member');
      if (editBtn) editBtn.style.display = 'none';
      if (deleteBtn) deleteBtn.style.display = 'none';
    }
  });
});

// ------------------- Filter Members -------------------
function filterMembers() {
  const searchTerm = document.getElementById("memberSearch").value.toLowerCase();
  const selectedProject = document.getElementById("projectFilter").value;
  const selectedRole = document.getElementById("roleFilter").value.toLowerCase();

  const memberCards = document.querySelectorAll(".member-card");
  let anyVisible = false;

  memberCards.forEach((card) => {
    const userName = card.querySelector(".card-title").textContent.toLowerCase();
    const role = (card.getAttribute("data-role") || "").toLowerCase();
    const projectNames = (card.getAttribute("data-project-names") || "").toLowerCase();

    // Search matches if the term appears in name, role, or projects
    const matchesSearch = searchTerm === "" || 
                          userName.includes(searchTerm) ||
                          role.includes(searchTerm) ||
                          projectNames.includes(searchTerm);

    // Dropdown filters
    const projectIds = (card.getAttribute("data-project-ids") || "").split(",");
    const matchesProject = selectedProject === "" || projectIds.includes(selectedProject);
    const roleList = role.split(",").map(r => r.trim()).filter(Boolean);
    const matchesRole = selectedRole === "" || roleList.includes(selectedRole);

    const visible = matchesSearch && matchesProject && matchesRole;
    card.style.display = visible ? "" : "none";

    if (visible) anyVisible = true;
  });

  document.getElementById("noMembersFound").style.display = anyVisible ? "none" : "block";
}



// ------------------- Event Listeners for Filters -------------------
document.getElementById("memberSearch").addEventListener("input", filterMembers);
document.getElementById("projectFilter").addEventListener("change", filterMembers);
document.getElementById("roleFilter").addEventListener("change", filterMembers);

document.getElementById("resetFilters").addEventListener("click", function () {
  document.getElementById("memberSearch").value = "";
  document.getElementById("projectFilter").value = "";
  document.getElementById("roleFilter").value = "";
  filterMembers();
});

// ------------------- View Member Modal (AJAX) -------------------
document.querySelectorAll(".view-member").forEach((button) => {
  button.addEventListener("click", function () {
    const userId = this.getAttribute("data-user-id");

    fetch(`/view-member/${userId}/`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }

        // Fill modal fields
        const userNameEl = document.getElementById("view_user");
        const projectEl = document.getElementById("view_project");
        const roleEl = document.getElementById("view_role");
        const joinedEl = document.getElementById("view_joined_at");

        userNameEl.textContent = data.user_name;
        projectEl.textContent = data.projects.map(p => p.name).join(", ");
        joinedEl.textContent = data.joined_at;

        // Colored badges per project-role
        const colors = ["#007bff", "#28a745", "#ffc107", "#17a2b8", "#dc3545", "#6f42c1"];
        let colorIndex = 0;
        const colorMap = {};
        roleEl.innerHTML = "";

        data.projects.forEach((p) => {
          if (!colorMap[p.name]) {
            colorMap[p.name] = colors[colorIndex % colors.length];
            colorIndex++;
          }
          const color = colorMap[p.name];

          const div = document.createElement("div");
          div.className = "mb-2";

          const title = document.createElement("span");
          title.textContent = `${p.name}: `;
          title.className = "fw-bold me-2";
          title.style.color = color;
          div.appendChild(title);

          (p.roles_list || []).forEach((r) => {
            const badge = document.createElement("span");
            badge.className = "badge me-1";
            badge.textContent = r;
            badge.style.backgroundColor = color;
            badge.style.color = "#fff";
            div.appendChild(badge);
          });

          roleEl.appendChild(div);
        });
      })
      .catch(err => console.error("Error fetching member details:", err));
  });
});

// ------------------- Helper: CSRF Token -------------------
function getCSRFToken() {
  const token = document.querySelector('[name=csrfmiddlewaretoken]');
  if (token) return token.value;
  console.error("CSRF token not found!");
  return '';
}
