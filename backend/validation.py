# backend/validation.py
import re
from email_validator import validate_email, EmailNotValidError

class Validator:
    """Input validation utilities"""
    
    @staticmethod
    def validate_username(username):
        """Validate username (4-20 chars, alphanumeric)"""
        if not username:
            return False, "Username is required"
        
        if len(username) < 4:
            return False, "Username must be at least 4 characters"
        
        if len(username) > 20:
            return False, "Username must not exceed 20 characters"
        
        if not re.match(r'^[a-zA-Z0-9_]+$', username):
            return False, "Username can only contain letters, numbers, and underscores"
        
        return True, ""
    
    @staticmethod
    def validate_password(password):
        """Validate password strength"""
        if not password:
            return False, "Password is required"
        
        if len(password) < 8:
            return False, "Password must be at least 8 characters"
        
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain at least one uppercase letter"
        
        if not re.search(r'[a-z]', password):
            return False, "Password must contain at least one lowercase letter"
        
        if not re.search(r'\d', password):
            return False, "Password must contain at least one number"
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain at least one special character"
        
        return True, ""
    
    @staticmethod
    def validate_email_address(email):
        """Validate email format"""
        if not email:
            return False, "Email is required"
        
        try:
            valid = validate_email(email)
            return True, valid.email
        except EmailNotValidError as e:
            return False, str(e)
    
    @staticmethod
    def validate_phone(phone):
        """Validate Philippine phone (09XXXXXXXXX)"""
        if not phone:
            return False, "Phone number is required"
        
        phone = phone.replace(' ', '').replace('-', '')
        
        if not re.match(r'^09\d{9}$', phone):
            return False, "Phone must be 11 digits starting with 09"
        
        return True, phone