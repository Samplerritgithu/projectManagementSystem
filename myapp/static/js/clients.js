
document.addEventListener("DOMContentLoaded", function () {
  // -------------------- Add Client --------------------
  const addClientForm = document.getElementById("addClientForm");
  const addClientModalEl = document.getElementById("addClientModal");

  const addInputs = {
    name: document.getElementById("name"),
    email: document.getElementById("email"),
    phone: document.getElementById("phone"),
    company: document.getElementById("company"),
    address: document.getElementById("address")
  };

  function validateField(field, showEmptyError = false) {
    let valid = true;
    const val = field.value.trim();
    const feedback = field.parentNode.querySelector(".invalid-feedback");
    field.classList.remove("is-valid", "is-invalid");
    feedback.textContent = "";

    switch(field.id) {
      case "name":
        const namePattern = /^[A-Za-z0-9 ]+$/;
        if (!val && showEmptyError) { valid = false; feedback.textContent = "Name is required."; }
        else if (val.length > 15) { valid = false; feedback.textContent = "Name cannot exceed 15 characters."; }
        else if (!namePattern.test(val)) { valid = false; feedback.textContent = "Name can only contain letters, numbers, and spaces."; }
        break;
      case "email":
        const emailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!val && showEmptyError) { valid = false; feedback.textContent = "Email is required."; }
        else if (val.length > 20) { valid = false; feedback.textContent = "Email cannot exceed 20 characters."; }
        else if (!emailPattern.test(val)) { valid = false; feedback.textContent = "Enter a valid Email address."; }
        break;
      case "phone":
        const phonePattern = /^[6-9]\d{9}$/;
        if (!val && showEmptyError) { valid = false; feedback.textContent = "Phone is required."; }
        else if (!phonePattern.test(val)) { valid = false; feedback.textContent = "Phone must start with 6,7,8,9 and be 10 digits."; }
        break;
      case "company":
        const companyPattern = /^[A-Za-z0-9 ]+$/;
        if (!val && showEmptyError) { valid = false; feedback.textContent = "Company is required."; }
        else if (val.length > 50) { valid = false; feedback.textContent = "Company cannot exceed 50 characters."; }
        else if (!companyPattern.test(val)) { valid = false; feedback.textContent = "Company can only contain letters, numbers, and spaces."; }
        break;
      case "address":
        if (!val && showEmptyError) { valid = false; feedback.textContent = "Address is required."; }
        else if (val.length > 100) { valid = false; feedback.textContent = "Address cannot exceed 100 characters."; }
        break;
    }

    if (valid && val) field.classList.add("is-valid");
    else if (!valid) field.classList.add("is-invalid");

    return valid;
  }

  // Live validation for Add Client
  Object.values(addInputs).forEach(input => {
    input.addEventListener("input", () => {
      validateField(input, true); // always show required error
    });
  });

  // Add Client submit
  addClientForm.addEventListener("submit", function(e){
    let formValid = true;
    Object.values(addInputs).forEach(input => {
      if (!validateField(input, true)) formValid = false;
    });
    if (!formValid) e.preventDefault();
    else toastr.success("Client added successfully!", "", { timeOut: 10000 });
  });

  // Reset Add Client modal
  addClientModalEl.addEventListener('hidden.bs.modal', function(){
    addClientForm.reset();
    Object.values(addInputs).forEach(input => {
      input.classList.remove("is-valid", "is-invalid");
      const feedback = input.parentNode.querySelector(".invalid-feedback");
      if(feedback) feedback.textContent = "";
    });
  });

  // -------------------- Edit Client --------------------
  const editClientForm = document.getElementById("editClientForm");
  const editClientModalEl = document.getElementById("editClientModal");
  const editInputs = {
    name: document.getElementById("edit_name"),
    email: document.getElementById("edit_email"),
    phone: document.getElementById("edit_phone"),
    company: document.getElementById("edit_company"),
    address: document.getElementById("edit_address")
  };

  function validateEditField(field, showEmptyError = false) {
    let valid = true;
    const val = field.value.trim();
    const feedback = field.parentNode.querySelector(".invalid-feedback");
    field.classList.remove("is-valid", "is-invalid");
    feedback.textContent = "";

    switch(field.id) {
      case "edit_name":
        const namePattern = /^[A-Za-z0-9 ]+$/;
        if (!val && showEmptyError) { valid = false; feedback.textContent = "Name is required."; }
        else if (val.length > 15) { valid = false; feedback.textContent = "Name cannot exceed 15 characters."; }
        else if (!namePattern.test(val)) { valid = false; feedback.textContent = "Name can only contain letters, numbers, and spaces."; }
        break;
      case "edit_email":
        const emailPattern = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!val && showEmptyError) { valid = false; feedback.textContent = "Email is required."; }
        else if (val.length > 20) { valid = false; feedback.textContent = "Email cannot exceed 20 characters."; }
        else if (!emailPattern.test(val)) { valid = false; feedback.textContent = "Enter a valid Email address."; }
        break;
      case "edit_phone":
        const phonePattern = /^[6-9]\d{9}$/;
        if (!val && showEmptyError) { valid = false; feedback.textContent = "Phone is required."; }
        else if (!phonePattern.test(val)) { valid = false; feedback.textContent = "Phone must start with 6,7,8,9 and be 10 digits."; }
        break;
      case "edit_company":
        const companyPattern = /^[A-Za-z0-9 ]+$/;
        if (!val && showEmptyError) { valid = false; feedback.textContent = "Company is required."; }
        else if (val.length > 50) { valid = false; feedback.textContent = "Company cannot exceed 50 characters."; }
        else if (!companyPattern.test(val)) { valid = false; feedback.textContent = "Company can only contain letters, numbers, and spaces."; }
        break;
      case "edit_address":
        if (!val && showEmptyError) { valid = false; feedback.textContent = "Address is required."; }
        else if (val.length > 100) { valid = false; feedback.textContent = "Address cannot exceed 100 characters."; }
        break;
    }

    if (valid && val) field.classList.add("is-valid");
    else if (!valid) field.classList.add("is-invalid");

    return valid;
  }

  // Live validation for Edit Client
  Object.values(editInputs).forEach(input => {
    input.addEventListener("input", () => {
      validateEditField(input, true); // always show required error
    });
  });

 editClientForm.addEventListener("submit", function(e){
    e.preventDefault();

    let formValid = true;
    Object.values(editInputs).forEach(input => {
        if (!validateEditField(input, true)) formValid = false;
    });
    if (!formValid) return;

    let hasChanged = false;
    Object.keys(editInputs).forEach(key => {
        const input = editInputs[key];
        const originalValue = input.getAttribute("data-original") || "";
        if (input.value.trim() !== originalValue.trim()) hasChanged = true;
    });

    const editModal = bootstrap.Modal.getOrCreateInstance(editClientModalEl);

  if (!hasChanged) {
    // Show the toast first, then close the modal so user sees the message, and clean up after the modal hides
    const toastOpts = { timeOut: 2000, progressBar: true, closeButton: true };
    toastr.info("No changes made!", "Info", toastOpts);

    const cleanup = () => {
      document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };

    // After the toast duration, trigger modal hide (animated) and cleanup after it's hidden
    setTimeout(() => {
      editClientModalEl.addEventListener('hidden.bs.modal', function handler() {
        cleanup();
        editClientModalEl.removeEventListener('hidden.bs.modal', handler);
      });
      editModal.hide();
    }, (toastOpts.timeOut || 2000) + 150);

    return;
  } else {
        editModal.hide(); // hide first
        toastr.success("Client updated successfully!", "", { 
            timeOut: 2000,
            progressBar: true,
            closeButton: true
        });
        // submit after a small delay to allow modal to hide
        setTimeout(() => editClientForm.submit(), 300);
    }
});



  // Reset Edit Client modal
  editClientModalEl.addEventListener('hidden.bs.modal', function(){
    editClientForm.reset();
    Object.values(editInputs).forEach(input => {
      input.classList.remove("is-valid", "is-invalid");
      const feedback = input.parentNode.querySelector(".invalid-feedback");
      if(feedback) feedback.textContent = "";
    });
  });

  // Populate Edit Modal and open
  document.querySelectorAll(".edit-client").forEach(button => {
    button.addEventListener("click", function(){
      const clientId = this.getAttribute("data-client-id");
      document.getElementById("edit_client_id").value = clientId;

      fetch(`/view-client/${clientId}/`)
        .then(res => res.json())
        .then(data => {
          // Populate fields and set data-original
          editInputs.name.value = data.name;
          editInputs.name.setAttribute("data-original", data.name);

          editInputs.email.value = data.email;
          editInputs.email.setAttribute("data-original", data.email);

          editInputs.phone.value = data.phone || "";
          editInputs.phone.setAttribute("data-original", data.phone || "");

          editInputs.company.value = data.company || "";
          editInputs.company.setAttribute("data-original", data.company || "");

          editInputs.address.value = data.address || "";
          editInputs.address.setAttribute("data-original", data.address || "");

          const editModal = new bootstrap.Modal(editClientModalEl);
          editModal.show();
        }).catch(err => console.error(err));
    });
  });

  // -------------------- Delete Client --------------------
  document.querySelectorAll(".delete-client").forEach(button => {
    button.addEventListener("click", function(){
      const clientId = this.getAttribute("data-client-id");
      document.getElementById("delete_client_id").value = clientId;
    });
  });

  const deleteClientForm = document.getElementById("deleteClientForm");
  deleteClientForm.addEventListener("submit", function(e){
    toastr.success("Client deleted successfully!", "", { 
      timeOut: 10000, 
      extendedTimeOut: 10000 
    });
  });

  // -------------------- View Client --------------------
  document.querySelectorAll(".view-client").forEach(button => {
    button.addEventListener("click", function(){
      const clientId = this.getAttribute("data-client-id");

      fetch(`/view-client/${clientId}/`)
        .then(res => res.json())
        .then(data => {
          const nameEl = document.getElementById("view_name");
          const emailEl = document.getElementById("view_email");
          const phoneEl = document.getElementById("view_phone");
          const companyEl = document.getElementById("view_company");
          const addressEl = document.getElementById("view_address");
          const createdEl = document.getElementById("view_created_at");

          nameEl.textContent = data.name || "-";
          nameEl.setAttribute('title', data.name || '');

          emailEl.textContent = data.email || "-";
          emailEl.setAttribute('title', data.email || '');

          phoneEl.textContent = data.phone || "Not provided";
          phoneEl.setAttribute('title', data.phone || '');

          companyEl.textContent = data.company || "Not provided";
          companyEl.setAttribute('title', data.company || '');

          addressEl.textContent = data.address || "Not provided";
          addressEl.setAttribute('title', data.address || '');

          createdEl.textContent = data.created_at || '';
        }).catch(err => {
          console.error(err);
          alert("Error loading client data.");
        });
    });
  });

  // -------------------- Client Search --------------------
  document.getElementById("clientSearch").addEventListener("input", function(){
    const searchTerm = this.value.toLowerCase();
    const cards = document.querySelectorAll(".client-card");
    let anyVisible = false;
    cards.forEach(card => {
      const name = card.querySelector(".card-title").textContent.toLowerCase();
      const email = card.querySelector("p").textContent.toLowerCase();
      if(name.includes(searchTerm) || email.includes(searchTerm)) {
        card.style.display = "";
        anyVisible = true;
      } else card.style.display = "none";
    });
    document.getElementById("noClientFound").style.display = anyVisible ? "none" : "block";
  });

  // -------------------- Company Filter --------------------
  document.getElementById("companyFilter").addEventListener("change", function(){
    const selected = this.value;
    document.querySelectorAll(".client-card").forEach(card => {
      const company = card.getAttribute("data-company");
      card.style.display = selected === "" || company === selected ? "" : "none";
    });
  });

  // -------------------- Reset Filters --------------------
  document.getElementById("resetFilters").addEventListener("click", function(){
    document.getElementById("clientSearch").value = "";
    document.getElementById("companyFilter").value = "";
    document.querySelectorAll(".client-card").forEach(card => card.style.display = "");
  });

  // Add native title attributes so long names show full text on hover (tooltip)
  document.querySelectorAll('.card-title, .client-name').forEach(el => {
    const txt = (el.textContent || '').trim();
    if (txt) el.setAttribute('title', txt);
  });
});

