

    toastr.options = {

  "preventDuplicates": true,

};
    // Theme handling
    function handleThemeChange(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }

    // Color handling
    function handleColorChange(color) {
        document.documentElement.style.setProperty('--primary-color', color);
    }

    // Initialize theme on page load
    document.addEventListener('DOMContentLoaded', function() {
        const savedTheme = localStorage.getItem('theme') || '{{ profile.theme|default:"light" }}';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('themeSelect').value = savedTheme;

        // Inline validation and no-changes detection
        const accountForm = document.querySelector('#account form');
        const appearanceForm = document.querySelector('#appearance form');
        const isSuperuser = typeof IS_SUPERUSER !== "undefined" ? IS_SUPERUSER : false;

        // Capture original values for comparison
        const originalAccount = accountForm ? {
            username: accountForm.elements['username']?.value || '',
            email: accountForm.elements['email']?.value || '',
            phone: accountForm.elements['phone']?.value || '',
            role: accountForm.elements['role']?.value || '',
            team: accountForm.elements['team']?.value || '',
        } : null;

        const originalAppearance = appearanceForm ? {
            theme: appearanceForm.elements['theme']?.value || '',
            primary_color: appearanceForm.elements['primary_color']?.value || '',
            font_size: appearanceForm.elements['font_size']?.value || '',
        } : null;

        function setError(form, name, message) {
            const err = form.querySelector(`[data-error-for="${name}"]`);
            if (!err) return;
            if (message) {
                err.textContent = message;
                err.classList.remove('d-none');
            } else {
                err.textContent = '';
                err.classList.add('d-none');
            }
        }

        function setAlert(id, message, type = 'info') {
            const el = document.getElementById(id);
            if (!el) return;
            if (message) {
                el.textContent = message;
                el.classList.remove('d-none', 'alert-info', 'alert-success', 'alert-danger', 'alert-warning');
                el.classList.add(`alert-${type}`);
            } else {
                el.textContent = '';
                el.classList.add('d-none');
            }
        }

        function hasAccountChanges() {
            if (!accountForm || !originalAccount) return false;
            return (
                originalAccount.username !== (accountForm.elements['username']?.value || '') ||
                originalAccount.email !== (accountForm.elements['email']?.value || '') ||
                originalAccount.phone !== (accountForm.elements['phone']?.value || '') ||
                originalAccount.role !== (accountForm.elements['role']?.value || '') ||
                originalAccount.team !== (accountForm.elements['team']?.value || '') ||
                // profile_picture treated as change if a file is selected
                (accountForm.elements['profile_picture'] && accountForm.elements['profile_picture'].files.length > 0)
            );
        }

        function hasAppearanceChanges() {
            if (!appearanceForm || !originalAppearance) return false;
            return (
                originalAppearance.theme !== (appearanceForm.elements['theme']?.value || '') ||
                originalAppearance.primary_color !== (appearanceForm.elements['primary_color']?.value || '') ||
                originalAppearance.font_size !== (appearanceForm.elements['font_size']?.value || '')
            );
        }

        function validateAccountForm() {
            if (!accountForm) return true;
            let ok = true;
            const username = accountForm.elements['username']?.value.trim();
            const email = accountForm.elements['email']?.value.trim();
            const phone = accountForm.elements['phone']?.value.trim();
            const role = accountForm.elements['role']?.value;
            const team = accountForm.elements['team']?.value;

            setError(accountForm, 'username', '');
            setError(accountForm, 'email', '');
            setError(accountForm, 'phone', '');
            setError(accountForm, 'role', '');
            setError(accountForm, 'team', '');

            if (!username) { setError(accountForm, 'username', 'Username is required'); ok = false; }
            if (!email) { setError(accountForm, 'email', 'Email is required'); ok = false; }
            else {
                const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRe.test(email)) { setError(accountForm, 'email', 'Enter a valid email address'); ok = false; }
            }
            if (!isSuperuser) {
                if (phone) {
                    const phoneDigits = phone.replace(/\D/g, '');
                    if (phoneDigits.length < 7) { setError(accountForm, 'phone', 'Enter a valid phone number'); ok = false; }
                }
            } else {
                // superuser: phone not required and no validation enforced
                setError(accountForm, 'phone', '');
            }
            if (role === undefined || role === null) {
                // If role select is disabled (non-Manager), skip role required validation
                const roleEl = accountForm.elements['role'];
                if (roleEl && !roleEl.disabled && !role) { setError(accountForm, 'role', 'Role is required'); ok = false; }
            }
            if (!isSuperuser) {
                if (team === undefined || team === null || team === '') {
                    setError(accountForm, 'team', 'Team is required'); ok = false;
                }
            } else {
                setError(accountForm, 'team', '');
            }
            return ok;
        }

        function validateAppearanceForm() {
            if (!appearanceForm) return true;
            let ok = true;
            const theme = appearanceForm.elements['theme']?.value;
            const color = appearanceForm.elements['primary_color']?.value;
            const font = appearanceForm.elements['font_size']?.value;

            setError(appearanceForm, 'primary_color', '');
            setError(appearanceForm, 'font_size', '');

            if (!theme) ok = false; // select always has a value, safe to ignore
            const colorRe = /^#([0-9a-fA-F]{3}){1,2}$/;
            if (!color || !colorRe.test(color)) { setError(appearanceForm, 'primary_color', 'Pick a valid color'); ok = false; }
            if (!font) { setError(appearanceForm, 'font_size', 'Select a font size'); ok = false; }
            return ok;
        }

        function showSuccessToast() {
    const message = 'Settings updated successfully';
    if (window.toastr && typeof window.toastr.success === 'function') {
        window.toastr.success(message, 'Success', {
            closeButton: true,       // adds X close button
            progressBar: true,       // shows progress timer
            timeOut: 5000,           // auto-close after 5 seconds
            extendedTimeOut: 1000,   // extra time if user hovers
            positionClass: 'toast-top-right' // position on screen
        });
        return;
    }
    // Fallback: show success alert within the active tab
    const activeAlert = document.querySelector('.tab-pane.active .alert');
    if (activeAlert) {
        activeAlert.classList.remove('d-none', 'alert-info', 'alert-danger', 'alert-warning');
        activeAlert.classList.add('alert-success');
        activeAlert.textContent = message;
        setTimeout(() => {
            activeAlert.classList.add('d-none');
        }, 5000); // match timer with toastr
    }
}


        // If we set a flag on last submit, show toast now after reload
        if (localStorage.getItem('settingsUpdated') === '1') {
            localStorage.removeItem('settingsUpdated');
            showSuccessToast();
        }

        if (accountForm) {
            accountForm.addEventListener('submit', function(evt) {
                setAlert('accountAlert', '');
                const valid = validateAccountForm();
                if (!valid) {
                    evt.preventDefault();
                    setAlert('accountAlert', 'Please fix the highlighted fields.', 'danger');
                    return;
                }
                if (!hasAccountChanges()) {
                    evt.preventDefault();
                   toastr.info('No changes made in accounts page.', 'info', {
    closeButton: true,      // shows the X button to close
    progressBar: true,      // shows the timer bar
    timeOut: 5000,          // auto-close after 5000ms (5 seconds)
    extendedTimeOut: 1000,  // extra time if user hovers
    positionClass: 'toast-top-right', // position
});

                }
                else {
                    // optimistic flag to show toast after server processes and reloads
                    localStorage.setItem('settingsUpdated', '1');
                }
            });
        }

        if (appearanceForm) {
            appearanceForm.addEventListener('submit', function(evt) {
                setAlert('appearanceAlert', '');
                const valid = validateAppearanceForm();
                if (!valid) {
                    evt.preventDefault();
                    setAlert('appearanceAlert', 'Please fix the highlighted fields.', 'danger');
                    return;
                }
               if (!hasAppearanceChanges()) {
    evt.preventDefault();
toastr.info('No changes made in Appearance settings.', 'info', {
    closeButton: true,       // adds the X button to close
    progressBar: true,       // shows the timer bar
    timeOut: 5000,           // auto-close after 5000ms (5 seconds)
    extendedTimeOut: 1000,   // extra time if user hovers
    positionClass: 'toast-top-right', // position on screen
});
}

                else {
                    localStorage.setItem('settingsUpdated', '1');
                }
            });
        }
    });
