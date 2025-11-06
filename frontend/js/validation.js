// validation.js - Client-Side Validation Functions

/**
 * Validation utility class
 */
class FormValidator {
    /**
     * Validate username
     * Rules: 4-20 characters, alphanumeric and underscore only
     */
    static validateUsername(username) {
        if (!username) {
            return { valid: false, message: 'Username is required' };
        }
        
        if (username.length < 4) {
            return { valid: false, message: 'Username must be at least 4 characters' };
        }
        
        if (username.length > 20) {
            return { valid: false, message: 'Username must not exceed 20 characters' };
        }
        
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
        }
        
        return { valid: true, message: '' };
    }
    
    /**
     * Validate password strength
     * Rules: Min 8 chars, uppercase, lowercase, number, special char
     */
    static validatePassword(password) {
        if (!password) {
            return { valid: false, message: 'Password is required', strength: 'none' };
        }
        
        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters', strength: 'weak' };
        }
        
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        const criteriaMet = [hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length;
        
        let strength = 'weak';
        if (criteriaMet === 4 && password.length >= 12) {
            strength = 'strong';
        } else if (criteriaMet >= 3 && password.length >= 8) {
            strength = 'medium';
        }
        
        if (!hasUppercase) {
            return { valid: false, message: 'Password must contain at least one uppercase letter', strength };
        }
        
        if (!hasLowercase) {
            return { valid: false, message: 'Password must contain at least one lowercase letter', strength };
        }
        
        if (!hasNumber) {
            return { valid: false, message: 'Password must contain at least one number', strength };
        }
        
        if (!hasSpecialChar) {
            return { valid: false, message: 'Password must contain at least one special character', strength };
        }
        
        return { valid: true, message: '', strength };
    }
    
    /**
     * Validate email format
     */
    static validateEmail(email) {
        if (!email) {
            return { valid: false, message: 'Email is required' };
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { valid: false, message: 'Please enter a valid email address' };
        }
        
        return { valid: true, message: '' };
    }
    
    /**
     * Validate Philippine phone number
     * Format: 09XXXXXXXXX
     */
    static validatePhone(phone) {
        if (!phone) {
            return { valid: false, message: 'Phone number is required' };
        }
        
        // Remove spaces and dashes
        const cleanPhone = phone.replace(/[\s-]/g, '');
        
        const phoneRegex = /^09\d{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
            return { valid: false, message: 'Phone must be 11 digits starting with 09' };
        }
        
        return { valid: true, message: '', cleaned: cleanPhone };
    }
    
    /**
     * Validate full name
     */
    static validateFullName(name) {
        if (!name) {
            return { valid: false, message: 'Full name is required' };
        }
        
        const trimmedName = name.trim();
        
        if (trimmedName.length < 2) {
            return { valid: false, message: 'Name must be at least 2 characters' };
        }
        
        if (trimmedName.length > 100) {
            return { valid: false, message: 'Name must not exceed 100 characters' };
        }
        
        const nameRegex = /^[a-zA-Z\s\-.]+$/;
        if (!nameRegex.test(trimmedName)) {
            return { valid: false, message: 'Name can only contain letters, spaces, hyphens, and periods' };
        }
        
        return { valid: true, message: '', cleaned: trimmedName };
    }
    
    /**
     * Validate role selection
     */
    static validateRole(role) {
        const validRoles = ['Owner', 'Admin', 'Inventory Clerk', 'Cashier'];
        
        if (!role) {
            return { valid: false, message: 'Please select a role' };
        }
        
        if (!validRoles.includes(role)) {
            return { valid: false, message: 'Invalid role selected' };
        }
        
        return { valid: true, message: '' };
    }
    
    /**
     * Validate file upload
     */
    static validateFile(file, maxSize = 2097152) { // 2MB default
        if (!file) {
            return { valid: true, message: '' }; // Optional field
        }
        
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, message: 'Only JPG and PNG files are allowed' };
        }
        
        // Check file size
        if (file.size > maxSize) {
            const maxMB = maxSize / (1024 * 1024);
            return { valid: false, message: `File size must not exceed ${maxMB}MB` };
        }
        
        return { valid: true, message: '' };
    }
    
    /**
     * Validate date
     */
    static validateDate(date) {
        if (!date) {
            return { valid: false, message: 'Date is required' };
        }
        
        const selectedDate = new Date(date);
        const today = new Date();
        
        if (selectedDate > today) {
            return { valid: false, message: 'Employment date cannot be in the future' };
        }
        
        return { valid: true, message: '' };
    }
    
    /**
     * Show error message for a field
     */
    static showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}Error`);
        
        if (field) {
            field.classList.add('error');
            field.classList.remove('success');
        }
        
        if (errorElement) {
            errorElement.textContent = message;
        }
    }
    
    /**
     * Show success state for a field
     */
    static showSuccess(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}Error`);
        
        if (field) {
            field.classList.remove('error');
            field.classList.add('success');
        }
        
        if (errorElement) {
            errorElement.textContent = '';
        }
    }
    
    /**
     * Clear validation state
     */
    static clearValidation(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(`${fieldId}Error`);
        
        if (field) {
            field.classList.remove('error', 'success');
        }
        
        if (errorElement) {
            errorElement.textContent = '';
        }
    }
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info', containerId = 'alertMessage') {
    const alertContainer = document.getElementById(containerId);
    if (!alertContainer) return;
    
    alertContainer.textContent = message;
    alertContainer.className = `alert-message ${type}`;
    alertContainer.style.display = 'flex';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertContainer.style.display = 'none';
    }, 5000);
}

/**
 * Hide alert message
 */
function hideAlert(containerId = 'alertMessage') {
    const alertContainer = document.getElementById(containerId);
    if (alertContainer) {
        alertContainer.style.display = 'none';
    }
}

/**
 * Update password strength indicator
 */
function updatePasswordStrength(password) {
    const strengthBar = document.getElementById('strengthBarFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthBar || !strengthText) return;
    
    const validation = FormValidator.validatePassword(password);
    const strength = validation.strength;
    
    strengthBar.className = 'strength-bar-fill';
    strengthText.className = 'strength-text';
    
    if (password.length === 0) {
        strengthBar.classList.remove('weak', 'medium', 'strong');
        strengthText.textContent = '';
        return;
    }
    
    strengthBar.classList.add(strength);
    strengthText.classList.add(strength);
    
    switch (strength) {
        case 'weak':
            strengthText.textContent = 'Weak password';
            break;
        case 'medium':
            strengthText.textContent = 'Medium password';
            break;
        case 'strong':
            strengthText.textContent = 'Strong password';
            break;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FormValidator, showAlert, hideAlert, updatePasswordStrength };
}