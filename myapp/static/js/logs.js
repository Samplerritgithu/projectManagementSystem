document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('logSearch');
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');
    const actionFilter = document.getElementById('actionFilter');
    const resetBtn = document.getElementById('resetFilters');
    const tableBody = document.querySelector('tbody');
    const tableRows = Array.from(tableBody.querySelectorAll('tr'));

    // Create a "No records found" row (hidden initially)
    let noRecordsRow = document.createElement('tr');
    noRecordsRow.innerHTML = `<td colspan="4" class="text-center py-5">No log entries found.</td>`;
    noRecordsRow.style.display = "none";
    tableBody.appendChild(noRecordsRow);

    function filterLogs() {
        const searchTerm = searchInput.value.toLowerCase();
        const from = fromDate.value ? new Date(fromDate.value) : null;
        const to = toDate.value ? new Date(toDate.value + 'T23:59:59') : null;
        const action = actionFilter.value.toLowerCase();

        let anyVisible = false;

        tableRows.forEach(row => {
            // Skip the no-records row
            if (row === noRecordsRow) return;

            const timestamp = new Date(row.cells[0].textContent);
            const user = row.cells[1].textContent.toLowerCase();
            const act = row.cells[2].textContent.toLowerCase();
            const description = row.cells[3].textContent.toLowerCase();

            let matches = true;

            // Search filter
            if (searchTerm) {
                matches = timestamp.toLocaleString().toLowerCase().includes(searchTerm) ||
                    user.includes(searchTerm) ||
                    act.includes(searchTerm) ||
                    description.includes(searchTerm);
            }

            // From/To date filter
            if (matches && from) matches = timestamp >= from;
            if (matches && to) matches = timestamp <= to;

            // Action filter
            if (matches && action) matches = act.includes(action);

            row.style.display = matches ? '' : 'none';
            if (matches) anyVisible = true;
        });

        // Show or hide "No records found"
        noRecordsRow.style.display = anyVisible ? "none" : "";
    }

    // --- 4-digit year restriction for type="date" ---
    [fromDate, toDate].forEach(input => {
        // Validate on change (selection or typing)
        input.addEventListener('change', function () {
            if (this.value) {
                const year = this.value.split('-')[0];
                if (year.length > 4) {
                    toastr.error('Year cannot be more than 4 digits!');
                }
            }
        });

        // Prevent pasting invalid year
        input.addEventListener('paste', function (e) {
            const paste = (e.clipboardData || window.clipboardData).getData('text');
            const year = paste.split('-')[0];
            if (year.length > 4) e.preventDefault();
        });
    });

    // Event listeners
    searchInput.addEventListener('input', filterLogs);
    fromDate.addEventListener('change', filterLogs);
    toDate.addEventListener('change', filterLogs);
    actionFilter.addEventListener('change', filterLogs);

    // Reset filters
    resetBtn.addEventListener('click', function () {
        searchInput.value = '';
        fromDate.value = '';
        toDate.value = '';
        actionFilter.value = '';
        filterLogs();
    });

    // Apply initial filters
    filterLogs();
});
