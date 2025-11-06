// form-handler.js - User Registration Form Handler

document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('userRegistrationForm');
    
    if (!registrationForm) return;
    
    // Form fields
    const fields = {
        fullName: document.getElementById('fullName'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone'),
        employmentDate: document.getElementById('employmentDate'),
        username: document.getElementById('usernameReg'),
        role: document.getElementById('role'),
        password: document.getElementById('passwordReg'),
        confirmPassword: document.getElementById('confirmPassword'),
        status: document.querySelector('input[name="status"]:checked'),
        photo: document.getElementById('photoUpload')
    };
    
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitBtnSpinner = document.getElementById('submitBtnSpinner');
    const resetBtn = document.getElementById('resetBtn');
    
    // Initialize
    setupEventListeners();
    setupPasswordToggles();
    setupImagePreview();
    loadUsersList();
    
    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Real-time validation
        fields.fullName?.addEventListener('blur', () => validateField('fullName'));
        fields.email?.addEventListener('blur', () => validateField('email'));
        fields.phone?.addEventListener('blur', () => validateField('phone'));
        fields.employmentDate?.addEventListener('blur', () => validateField('employmentDate'));
        fields.username?.addEventListener('blur', () => validateField('username'));
        fields.role?.addEventListener('change', () => validateField('role'));
        fields.password?.addEventListener('input', handlePasswordInput);
        fields.confirmPassword?.addEventListener('blur', () => validateField('confirmPassword'));
        
        // Clear errors on input
        Object.keys(fields).forEach(key => {
            fields[key]?.addEventListener('input', () => {
                if (key !== 'password') {
                    FormValidator.clearValidation(fields[key].id);
                }
            });
        });
        
        // Form submission
        registrationForm.addEventListener('submit', handleSubmit);
        
        // Reset button
        resetBtn?.addEventListener('click', handleReset);
        
        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', handleLogout);
    }
    
    /**
     * Setup password toggle buttons
     */
    function setupPasswordToggles() {
        const toggleButtons = document.querySelectorAll('.toggle-password');
        
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const targetField = document.getElementById(targetId);
                
                if (targetField) {
                    const type = targetField.type === 'password' ? 'text' : 'password';
                    targetField.type = type;
                    this.textContent = type === 'password' ? '👁️' : '🙈';
                }
            });
        });
    }
    
    /**
     * Setup image preview
     */
    function setupImagePreview() {
        const photoUpload = document.getElementById('photoUpload');
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        const removeImageBtn = document.getElementById('removeImage');
        
        photoUpload?.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (file) {
                const validation = FormValidator.validateFile(file);
                
                if (!validation.valid) {
                    FormValidator.showError('photoUpload', validation.message);
                    photoUpload.value = '';
                    return;
                }
                
                FormValidator.clearValidation('photoUpload');
                
                // Show preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
        
        removeImageBtn?.addEventListener('click', function() {
            photoUpload.value = '';
            imagePreview.style.display = 'none';
            previewImg.src = '';
            FormValidator.clearValidation('photoUpload');
        });
    }
    
    /**
     * Handle password input with strength indicator
     */
    function handlePasswordInput(e) {
        const password = e.target.value;
        updatePasswordStrength(password);
        
        // Also validate confirm password if it has value
        if (fields.confirmPassword.value) {
            validateField('confirmPassword');
        }
    }
    
    /**
     * Validate individual field
     */
    function validateField(fieldName) {
        const field = fields[fieldName];
        if (!field) return false;
        
        let validation;
        
        switch (fieldName) {
            case 'fullName':
                validation = FormValidator.validateFullName(field.value);
                break;
                
            case 'email':
                validation = FormValidator.validateEmail(field.value);
                break;
                
            case 'phone':
                validation = FormValidator.validatePhone(field.value);
                break;
                
            case 'employmentDate':
                validation = FormValidator.validateDate(field.value);
                break;
                
            case 'username':
                validation = FormValidator.validateUsername(field.value);
                break;
                
            case 'role':
                validation = FormValidator.validateRole(field.value);
                break;
                
            case 'password':
                validation = FormValidator.validatePassword(field.value);
                break;
                
            case 'confirmPassword':
                const password = fields.password.value;
                const confirmPassword = field.value;
                
                if (!confirmPassword) {
                    validation = { valid: false, message: 'Please confirm your password' };
                } else if (password !== confirmPassword) {
                    validation = { valid: false, message: 'Passwords do not match' };
                } else {
                    validation = { valid: true, message: '' };
                }
                break;
                
            default:
                return true;
        }
        
        if (!validation.valid) {
            FormValidator.showError(field.id, validation.message);
            return false;
        }
        
        FormValidator.showSuccess(field.id);
        return true;
    }
    
    /**
     * Validate all fields
     */
    function validateAllFields() {
        const validations = [
            validateField('fullName'),
            validateField('email'),
            validateField('phone'),
            validateField('employmentDate'),
            validateField('username'),
            validateField('role'),
            validateField('password'),
            validateField('confirmPassword')
        ];
        
        return validations.every(v => v === true);
    }
    
    /**
     * Handle form submission
     */
    async function handleSubmit(e) {
        e.preventDefault();
        
        // Validate all fields
        if (!validateAllFields()) {
            showAlert('Please fix all errors before submitting', 'error', 'formAlertMessage');
            return;
        }
        
        // Get form data
        const formData = new FormData();
        formData.append('fullName', fields.fullName.value.trim());
        formData.append('email', fields.email.value.trim());
        formData.append('phone', fields.phone.value.replace(/[\s-]/g, ''));
        formData.append('employmentDate', fields.employmentDate.value);
        formData.append('username', fields.username.value.trim());
        formData.append('role', fields.role.value);
        formData.append('password', fields.password.value);
        formData.append('status', document.querySelector('input[name="status"]:checked').value);
        
        // Add photo if selected
        if (fields.photo.files[0]) {
            formData.append('photo', fields.photo.files[0]);
        }
        
        // Submit to server
        await submitUserRegistration(formData);
    }
    
    /**
     * Submit user registration to server
     */
    async function submitUserRegistration(formData) {
        try {
            setFormLoading(true);
            hideAlert('formAlertMessage');
            
            const response = await fetch('/api/users/register', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showAlert('User registered successfully!', 'success', 'formAlertMessage');
                
                // Reset form
                setTimeout(() => {
                    handleReset();
                    loadUsersList();
                }, 2000);
                
            } else {
                showAlert(result.message || 'Registration failed. Please try again.', 'error', 'formAlertMessage');
            }
            
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('Network error. Please check your connection.', 'error', 'formAlertMessage');
        } finally {
            setFormLoading(false);
        }
    }
    
    /**
     * Set form loading state
     */
    function setFormLoading(isLoading) {
        submitBtn.disabled = isLoading;
        resetBtn.disabled = isLoading;
        
        if (isLoading) {
            submitBtnText.style.display = 'none';
            submitBtnSpinner.style.display = 'inline-block';
            registrationForm.classList.add('form-loading');
        } else {
            submitBtnText.style.display = 'inline';
            submitBtnSpinner.style.display = 'none';
            registrationForm.classList.remove('form-loading');
        }
    }
    
    /**
     * Handle form reset
     */
    function handleReset() {
        registrationForm.reset();
        
        // Clear all validation states
        Object.keys(fields).forEach(key => {
            if (fields[key]) {
                FormValidator.clearValidation(fields[key].id);
            }
        });
        
        // Hide image preview
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.style.display = 'none';
        }
        
        // Clear password strength
        const strengthBar = document.getElementById('strengthBarFill');
        const strengthText = document.getElementById('strengthText');
        if (strengthBar) strengthBar.className = 'strength-bar-fill';
        if (strengthText) strengthText.textContent = '';
        
        hideAlert('formAlertMessage');
    }
    
    /**
     * Load users list
     */
    async function loadUsersList() {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;
        
        try {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Loading users...</td></tr>';
            
            const response = await fetch('/api/users/list');
            const result = await response.json();
            
            if (response.ok && result.success) {
                displayUsersList(result.users);
            } else {
                tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Failed to load users</td></tr>';
            }
            
        } catch (error) {
            console.error('Error loading users:', error);
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data">Error loading users</td></tr>';
        }
    }
    
    /**
     * Display users in table
     */
    function displayUsersList(users) {
        const tableBody = document.getElementById('usersTableBody');
        if (!tableBody) return;
        
        if (!users || users.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No users found</td></tr>';
            return;
        }
        
        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.user_id.substring(0, 8)}...</td>
                <td>${escapeHtml(user.username)}</td>
                <td>${escapeHtml(user.full_name)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td><span class="badge">${escapeHtml(user.role)}</span></td>
                <td>
                    <span class="badge ${user.status === 'Active' ? 'badge-success' : 'badge-secondary'}">
                        ${user.status}
                    </span>
                </td>
                <td>
                    <button class="btn-sm btn-edit" data-id="${user.user_id}">Edit</button>
                    <button class="btn-sm btn-delete" data-id="${user.user_id}">Delete</button>
                </td>
            </tr>
        `).join('');
        
        // Attach event listeners to action buttons
        attachActionListeners();
    }
    
    /**
     * Attach event listeners to action buttons
     */
    function attachActionListeners() {
        const editButtons = document.querySelectorAll('.btn-edit');
        const deleteButtons = document.querySelectorAll('.btn-delete');
        
        editButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                handleEdit(userId);
            });
        });
        
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                handleDelete(userId);
            });
        });
    }
    
    /**
     * Handle edit user
     */
    async function handleEdit(userId) {
        // TODO: Implement edit functionality
        alert('Edit functionality - User ID: ' + userId);
    }
    
    /**
     * Handle delete user
     */
    async function handleDelete(userId) {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/users/delete/${userId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showAlert('User deleted successfully', 'success', 'formAlertMessage');
                loadUsersList();
            } else {
                showAlert(result.message || 'Failed to delete user', 'error', 'formAlertMessage');
            }
            
        } catch (error) {
            console.error('Delete error:', error);
            showAlert('Network error', 'error', 'formAlertMessage');
        }
    }
    
    /**
     * Handle logout
     */
    async function handleLogout(e) {
        e.preventDefault();
        
        if (!confirm('Are you sure you want to logout?')) {
            return;
        }
        
        try {
            const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
            
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session_id: sessionId })
            });
            
            // Clear storage
            localStorage.removeItem('sessionId');
            sessionStorage.removeItem('sessionId');
            
            // Redirect to login
            window.location.href = '/frontend/pages/login.html';
            
        } catch (error) {
            console.error('Logout error:', error);
            // Still redirect even if there's an error
            window.location.href = '/frontend/pages/login.html';
        }
    }
    
    /**
     * Search users
     */
    const searchInput = document.getElementById('searchUsers');
    searchInput?.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('#usersTableBody tr');
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
    
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
});