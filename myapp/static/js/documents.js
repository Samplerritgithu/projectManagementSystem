
document.addEventListener("DOMContentLoaded", function() {
 
  // ================================
  // Document Search Functionality
  // ================================
document.getElementById("documentSearch").addEventListener("input", function() {
  const searchTerm = this.value.toLowerCase();
  const documentCards = document.querySelectorAll(".document-card");
  let anyVisible = false;

  documentCards.forEach(card => {
    const title = card.querySelector(".card-title").textContent.toLowerCase();
    const project = card.querySelector(".badge").textContent.toLowerCase();

    if (title.includes(searchTerm) || project.includes(searchTerm)) {
      card.style.display = "";
      anyVisible = true;
    } else {
      card.style.display = "none";
    }
  });

  // Show or hide "No Documents found"
  document.getElementById("noDocumentFound").style.display = anyVisible ? "none" : "block";
});

 
      // ================================
      // Project Filter
      // ================================
      document.getElementById("projectFilter").addEventListener("change", function() {
        const selectedProject = this.value;
        let anyVisible = false;

        document.querySelectorAll(".document-card").forEach(card => {
          const projectId = card.getAttribute("data-project");
          if (!selectedProject || projectId === selectedProject) {
            card.style.display = "";
            anyVisible = true;
          } else {
            card.style.display = "none";
          }
        });

        // Show or hide "No Documents found" message
        document.getElementById("noDocumentFound").style.display = anyVisible ? "none" : "block";
      });

 
  // ================================
  // Reset Filters
  // ================================
  document.getElementById("resetFilters").addEventListener("click", function() {
    document.getElementById("documentSearch").value = "";
    document.getElementById("projectFilter").value = "";
    document.querySelectorAll(".document-card").forEach(card => card.style.display = "");
  });


// ================================
// Edit Document (Fetch + Fill Form)
// ================================
document.querySelectorAll(".edit-document").forEach(button => {
  button.addEventListener("click", function () {
    const documentId = this.getAttribute("data-document-id");
    document.getElementById("edit_document_id").value = documentId;

    fetch(`/documents/${documentId}/`)
      .then(response => response.json())
      .then(data => {
        const titleInput = document.getElementById("edit_title");
        const projectSelect = document.getElementById("edit_project");
        const currentFileInfo = document.getElementById("current_file_info");

        // Set values
        titleInput.value = data.title;
        projectSelect.value = data.project_id;

        // Store originals for change detection
        titleInput.setAttribute("data-original", data.title);
        projectSelect.setAttribute("data-original", data.project_id);
        currentFileInfo.setAttribute("data-original", data.file_name || "");

        // File info display
        if (data.file_name) {
          currentFileInfo.innerHTML =
            `<strong>Current file:</strong> <span title="${data.file_name}">${data.file_name}</span>`;
          currentFileInfo.style.background = "";
        } else {
          currentFileInfo.innerHTML = "No file attached";
          currentFileInfo.style.background = "";
        }
      })
      .catch(error => console.error("Error fetching document data:", error));
  });
});

// ================================
// Edit Document: Validation
// ================================
const editDocumentForm = document.getElementById("editDocumentForm");
const editTitleInput = document.getElementById("edit_title");
const editProjectSelect = document.getElementById("edit_project");
const editFileInput = document.getElementById("edit_file");
const currentFileInfo = document.getElementById("current_file_info");
const editSubmitBtn = document.querySelector('#editDocumentModal button[type="submit"]');

// Live validation: Title
editTitleInput.addEventListener("input", function () {
  validateTitle(this);
  checkDocDuplicateEdit();
});

// Live validation: Project
editProjectSelect.addEventListener("change", function () {
  validateField(this, "Project is required.");
  checkDocDuplicateEdit();
});

// Live validation: File input (PDF only)
editFileInput.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) {
    currentFileInfo.style.background = "";
    currentFileInfo.innerHTML = "";
    return;
  }

  const fileName = file.name;
  if (file.type === "application/pdf") {
    currentFileInfo.style.background = "#d4edda"; // green
    currentFileInfo.innerHTML =
      `<strong>Selected file:</strong> <span title="${fileName}">${fileName}</span>`;
    this.classList.remove("is-invalid");
    this.classList.add("is-valid");
  } else {
    currentFileInfo.style.background = "#f8d7da"; // red
    currentFileInfo.innerHTML =
      `<strong>Invalid file:</strong> <span title="${fileName}">${fileName}</span>`;
    toastr.error("Only PDF files are allowed!");
    this.classList.add("is-invalid");
    this.classList.remove("is-valid");
    this.value = ""; // reset invalid file
  }
});
editDocumentForm.addEventListener("submit", function (e) {
  e.preventDefault();

  let valid = true;

  // Validate title
  if (!validateTitle(editTitleInput)) valid = false;

  // Validate project select
  if (!validateField(editProjectSelect, "Project is required.")) valid = false;

  // Validate file type if a new file is chosen
  const file = editFileInput.files[0];
  if (file && file.type !== "application/pdf") {
    toastr.error("Only PDF files are allowed!");
    valid = false;
  }

  if (!valid) return; // Stop if validation fails

  // ================= Check for changes =================
  const originalTitle = editTitleInput.getAttribute("data-original") || "";
  const originalProject = editProjectSelect.getAttribute("data-original") || "";
  const originalFile = currentFileInfo.getAttribute("data-original") || "";

  const newTitle = editTitleInput.value.trim();
  const newProject = editProjectSelect.value;
  const newFile = file ? file.name : originalFile; // Use current file name if no new file

  // If live duplicate flagged, stop
  if (checkDocDuplicateEdit()) return;

  // If nothing changed
  if (newTitle === originalTitle && newProject === originalProject && newFile === originalFile) {
    toastr.info("No changes made.", "info", {
      timeOut: 4000,
      closeButton: true,
      progressBar: true,
      onHidden: function () {
        // Close modal after toast disappears
        const modalEl = document.getElementById("editDocumentModal");
        const modalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
        modalInstance.hide();
      }
    });
    return;
  }

  toastr.success("Document updated successfully!", "", {
    timeOut: 9000,
    closeButton: true,
    progressBar: true
  });

  // Submit the form normally (Django)
  editDocumentForm.submit();
});



document.getElementById("editDocumentModal").addEventListener("hidden.bs.modal", function () {
  editDocumentForm.reset();
  editDocumentForm.querySelectorAll(".form-control, .form-select").forEach(el => {
    el.classList.remove("is-valid", "is-invalid");
  });
  currentFileInfo.style.background = "";
  currentFileInfo.innerHTML = "";
});


 

  document.querySelectorAll(".view-document").forEach((button) => {
    
    button.addEventListener("click", async function () {
      const modalTitle = document.getElementById("viewDocumentModalLabel");
      const fileName = this.getAttribute("data-file-name") || "Document Preview";
      modalTitle.textContent = fileName;
      modalTitle.title = fileName; // tooltip on hover
      const pdfContainer = document.getElementById("pdfContainer");
      const messageDiv = document.getElementById("filePreviewMessage");
      const downloadFallback = document.getElementById("downloadFallback");
      const downloadLink = document.getElementById("downloadLink");
      const iframe = document.getElementById("docIframe");
 
      // Reset state
      iframe.style.display = "none";
      iframe.src = "";
      pdfContainer.style.display = "none";
      pdfContainer.innerHTML = "";
      messageDiv.textContent = "";
      downloadFallback.style.display = "none";
 
      const fileUrl = this.getAttribute("data-file-url");
      const ext = (this.getAttribute("data-file-ext") || '').toLowerCase();
      // Set download button link
      const pdfDownloadBtn = document.getElementById("pdfDownloadBtn");
      pdfDownloadBtn.href = fileUrl;
      pdfDownloadBtn.download = this.getAttribute("data-file-name") || "document.pdf";

 
      try {
        if (ext === '.pdf') {
           const previewUrl = `/preview-document/${this.getAttribute("data-document-id")}/`;
           const ts = Date.now();
           const viewerUrl = `${PDF_VIEWER_URL}?file=${encodeURIComponent(previewUrl)}&user=${encodeURIComponent(CURRENT_USERNAME)}&ts=${ts}#zoom=page-fit`;
           iframe.src = viewerUrl;
           iframe.style.display = "block";
           return;
         }
 
 
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
          const img = new Image();
          img.src = fileUrl;
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
          img.style.objectFit = 'contain';
          pdfContainer.appendChild(img);
          pdfContainer.style.display = 'flex';
          return;
        }
 
        const absoluteUrl = new URL(fileUrl, window.location.origin).toString();
        let officeUrl = 'https://view.officeapps.live.com/op/embed.aspx?src=' + encodeURIComponent(absoluteUrl);
        iframe.src = officeUrl;
        iframe.style.display = 'block';
 
      } catch (error) {
        console.error('Error loading preview:', error);
        messageDiv.textContent = 'Preview not available. You can download the file.';
        downloadFallback.style.display = 'block';
        downloadLink.href = fileUrl;
      }
    });
  });
 
  // Clear iframe on modal hide to avoid stale content and reload issues
  const modalEl = document.getElementById('viewDocumentModal');
  modalEl?.addEventListener('hidden.bs.modal', function () {
    const iframe = document.getElementById('docIframe');
    if (iframe) {
      iframe.src = '';
      iframe.style.display = 'none';
    }
    const pdfContainer = document.getElementById('pdfContainer');
    if (pdfContainer) {
      pdfContainer.innerHTML = '';
      pdfContainer.style.display = 'none';
    }
  });
 
  // ================================
  // Delete Document
  // ================================
  document.querySelectorAll(".delete-document").forEach(button => {
    button.addEventListener("click", function() {
      const documentId = this.getAttribute("data-document-id");
      document.getElementById("delete_document_id").value = documentId;
    });
  });

const addDocumentForm = document.getElementById("addDocumentForm");
const addFileInput = document.getElementById("file");
const addDocumentModal = document.getElementById("addDocumentModal");

  const titleInput = document.getElementById("title");
  const projectSelect = document.getElementById("project");
  // ================================
  // Submit Validation
  // ================================
  addDocumentForm.addEventListener("submit", function (e) {
    e.preventDefault();

    let valid = true;
    if (!validateTitle(titleInput)) valid = false;
    if (!validateField(projectSelect, "Project is required.")) valid = false;
    if (!validateFileInput(addFileInput)) valid = false;

    // Stop if live duplicate check flags duplicate
    if (checkDocDuplicateAdd()) valid = false;

    if (!valid) return;

    toastr.success("Document uploaded successfully!", "", {
      timeOut: 5000,
      closeButton: true,
      progressBar: true
    });

    addDocumentForm.submit();
  });

  // ================================
  // Inline Validation (Real-time)
  // ================================
  titleInput.addEventListener("input", function () {
    validateTitle(this);
    checkDocDuplicateAdd();
  });

  projectSelect.addEventListener("change", function () {
    validateField(this, "Project is required.");
    checkDocDuplicateAdd();
  });

  addFileInput.addEventListener("change", function () {
    validateFileInput(this);
  });

  // ================================
  // Validation Functions
  // ================================
  function validateTitle(field) {
    const feedback = field.parentNode.querySelector(".invalid-feedback");
    const value = field.value.trim();

    if (!value) {
      field.classList.add("is-invalid");
      field.classList.remove("is-valid");
      feedback.textContent = "Title is required.";
      return false;
    }

    if (!/^[A-Za-z0-9 ]+$/.test(value)) {
      field.classList.add("is-invalid");
      field.classList.remove("is-valid");
      feedback.textContent = "Only letters, numbers and spaces are allowed.";
      return false;
    }

    if (value.length > 50) {
      field.classList.add("is-invalid");
      field.classList.remove("is-valid");
      feedback.textContent = "Maximum 50 characters allowed.";
      return false;
    }

    field.classList.remove("is-invalid");
    field.classList.add("is-valid");
    feedback.textContent = "";
    return true;
  }

  function validateField(field, message) {
    const feedback = field.parentNode.querySelector(".invalid-feedback");

    if (!field.value.trim()) {
      field.classList.add("is-invalid");
      field.classList.remove("is-valid");
      feedback.textContent = message;
      return false;
    }

    field.classList.remove("is-invalid");
    field.classList.add("is-valid");
    feedback.textContent = "";
    return true;
  }
  // ===== Live duplicate check (Edit) =====
  function checkDocDuplicateEdit() {
    try {
      const originalTitle = (editTitleInput.getAttribute('data-original') || '').trim().toLowerCase();
      const originalProject = (editProjectSelect.getAttribute('data-original') || '').trim();
      const newTitle = (editTitleInput?.value || '').trim().toLowerCase();
      const newProject = editProjectSelect?.value || '';
      if (!newTitle || !newProject) { editSubmitBtn && (editSubmitBtn.disabled = false); editTitleInput.setCustomValidity(''); return false; }
      const cards = Array.from(document.querySelectorAll('.document-card'));
      const dup = cards.some(card => {
        const sameProject = card.getAttribute('data-project') === newProject;
        const titleMatch = ((card.querySelector('.card-title')?.textContent || '').trim().toLowerCase() === newTitle);
        return sameProject && titleMatch;
      });
      const unchanged = (newTitle === originalTitle && newProject === originalProject);
      if (dup && !unchanged) {
        editTitleInput.classList.add('is-invalid');
        editTitleInput.classList.remove('is-valid');
        editTitleInput.setCustomValidity('Duplicate document title');
        const fb = editTitleInput.parentNode.querySelector('.invalid-feedback');
        if (fb) { fb.textContent = 'A document with this title already exists for the selected project.'; fb.style.display = 'block'; }
        editSubmitBtn && (editSubmitBtn.disabled = true);
        return true;
      }
      const fb = editTitleInput.parentNode.querySelector('.invalid-feedback');
      if (fb && fb.textContent.includes('already exists')) { fb.textContent = ''; fb.style.display = ''; }
      editTitleInput.setCustomValidity('');
      editSubmitBtn && (editSubmitBtn.disabled = false);
      return false;
    } catch (_) { return false; }
  }
  // Live duplicate add
  function checkDocDuplicateAdd() {
    try {
      const newTitle = (titleInput?.value || '').trim().toLowerCase();
      const projId = projectSelect?.value || '';
      const btn = addDocumentForm?.querySelector('button[type="submit"]');
      if (!newTitle || !projId) { btn && (btn.disabled = false); return false; }
      const cards = Array.from(document.querySelectorAll('.document-card'));
      const dup = cards.some(card => (card.getAttribute('data-project') === projId) && ((card.querySelector('.card-title')?.textContent || '').trim().toLowerCase() === newTitle));
      if (dup) {
        titleInput.classList.add('is-invalid');
        titleInput.classList.remove('is-valid');
        titleInput.setCustomValidity('Duplicate document title');
        const fb = titleInput.parentNode.querySelector('.invalid-feedback');
        if (fb) { fb.textContent = 'A document with this title already exists for the selected project.'; fb.style.display = 'block'; }
        btn && (btn.disabled = true);
        return true;
      }
      const fb = titleInput.parentNode.querySelector('.invalid-feedback');
      if (fb && fb.textContent.includes('already exists')) { fb.textContent = ''; fb.style.display = ''; }
      titleInput.setCustomValidity('');
      btn && (btn.disabled = false);
      return false;
    } catch (_) { return false; }
  }
function validateFileInput(input) {
    const feedback = input.parentNode.querySelector(".invalid-feedback");
    const file = input.files[0];

    // No file selected
    if (!file) {
        input.classList.add("is-invalid");
        input.classList.remove("is-valid");
        feedback.textContent = "Select a PDF file."; // Only show this for empty input
        return false;
    }

    // File is not PDF
    if (file.type !== "application/pdf") {
        input.classList.add("is-invalid");
        input.classList.remove("is-valid");
        feedback.textContent = ""; // Clear bootstrap error message
        toastr.error("Only PDF files are allowed!", "Error", {
            closeButton: true,
            progressBar: true,
            timeOut: 5000,
            extendedTimeOut: 1000,
            positionClass: "toast-top-right"
        });
        input.value = ""; // reset invalid file
        return false;
    }

    // Valid PDF
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
    feedback.textContent = "";
    return true;
}


  // ================================
  // Reset Validation on Modal Close
  // ================================
  addDocumentModal.addEventListener("hidden.bs.modal", function () {
    addDocumentForm.reset();

    addDocumentForm.querySelectorAll(".form-control, .form-select").forEach(el => {
      el.classList.remove("is-invalid", "is-valid");
    });

    addDocumentForm.querySelectorAll(".invalid-feedback").forEach(fb => {
      fb.textContent = "";
    });
  });




});

 