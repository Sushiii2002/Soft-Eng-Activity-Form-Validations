// login-handler.js - Login Form Handler

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameField = document.getElementById('username');
    const passwordField = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText');
    const loginBtnSpinner = document.getElementById('loginBtnSpinner');
    
    // Toggle password visibility
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordField.type === 'password' ? 'text' : 'password';
            passwordField.type = type;
            togglePasswordBtn.textContent = type === 'password' ? '👁️' : '🙈';
        });
    }
    
    // Real-time validation on blur
    if (usernameField) {
        usernameField.addEventListener('blur', function() {
            validateUsername();
        });
        
        usernameField.addEventListener('input', function() {
            FormValidator.clearValidation('username');
        });
    }
    
    if (passwordField) {
        passwordField.addEventListener('blur', function() {
            validatePassword();
        });
        
        passwordField.addEventListener('input', function() {
            FormValidator.clearValidation('password');
        });
    }
    
    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validate all fields
            const isUsernameValid = validateUsername();
            const isPasswordValid = validatePassword();
            
            if (!isUsernameValid || !isPasswordValid) {
                showAlert('Please fix the errors before submitting', 'error');
                return;
            }
            
            // Get form data
            const formData = {
                username: usernameField.value.trim(),
                password: passwordField.value,
                rememberMe: document.getElementById('rememberMe').checked
            };
            
            // Submit login
            await submitLogin(formData);
        });
    }
    
    /**
     * Validate username field
     */
    function validateUsername() {
        const username = usernameField.value.trim();
        const validation = FormValidator.validateUsername(username);
        
        if (!validation.valid) {
            FormValidator.showError('username', validation.message);
            return false;
        }
        
        FormValidator.showSuccess('username');
        return true;
    }
    
    /**
     * Validate password field
     */
    function validatePassword() {
        const password = passwordField.value;
        
        if (!password) {
            FormValidator.showError('password', 'Password is required');
            return false;
        }
        
        FormValidator.showSuccess('password');
        return true;
    }
    
    /**
     * Submit login to server
     */
    async function submitLogin(formData) {
        try {
            // Disable form
            setFormLoading(true);
            hideAlert();
            
            // Make API request
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                showAlert('Login successful! Redirecting...', 'success');
                
                // Store session if remember me is checked
                if (formData.rememberMe) {
                    localStorage.setItem('sessionId', result.session_id);
                } else {
                    sessionStorage.setItem('sessionId', result.session_id);
                }
                
                // Redirect based on role
                setTimeout(() => {
                    if (result.role === 'Owner' || result.role === 'Admin') {
                        window.location.href = '/frontend/pages/user-management.html';
                    } else if (result.role === 'Cashier') {
                        window.location.href = '/frontend/pages/pos.html';
                    } else {
                        window.location.href = '/frontend/pages/dashboard.html';
                    }
                }, 1500);
                
            } else {
                // Handle error
                showAlert(result.message || 'Login failed. Please try again.', 'error');
                setFormLoading(false);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Network error. Please check your connection and try again.', 'error');
            setFormLoading(false);
        }
    }
    
    /**
     * Set form loading state
     */
    function setFormLoading(isLoading) {
        loginBtn.disabled = isLoading;
        
        if (isLoading) {
            loginBtnText.style.display = 'none';
            loginBtnSpinner.style.display = 'inline-block';
        } else {
            loginBtnText.style.display = 'inline';
            loginBtnSpinner.style.display = 'none';
        }
        
        usernameField.disabled = isLoading;
        passwordField.disabled = isLoading;
    }
    
    // Check if already logged in
    const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
    if (sessionId) {
        // Validate session
        validateSession(sessionId);
    }
    
    async function validateSession(sessionId) {
        try {
            const response = await fetch('/api/validate-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session_id: sessionId })
            });
            
            const result = await response.json();
            
            if (result.success && result.valid) {
                // Redirect to dashboard
                window.location.href = '/frontend/pages/user-management.html';
            }
        } catch (error) {
            console.error('Session validation error:', error);
        }
    }
});