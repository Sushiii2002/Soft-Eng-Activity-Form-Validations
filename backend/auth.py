# backend/auth.py
import hashlib
import secrets
from datetime import datetime, timedelta
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from backend.database import Database
import logging

logger = logging.getLogger(__name__)

# Initialize Argon2 password hasher
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)

class AuthManager:
    """Handles user authentication"""
    
    @staticmethod
    def hash_password(password):
        """Hash password using Argon2"""
        try:
            return ph.hash(password)
        except Exception as e:
            logger.error(f"Password hashing error: {e}")
            raise
    
    @staticmethod
    def verify_password(password_hash, password):
        """Verify password against hash"""
        try:
            ph.verify(password_hash, password)
            
            if ph.check_needs_rehash(password_hash):
                return True, True  # (verified, needs_rehash)
            
            return True, False
            
        except VerifyMismatchError:
            return False, False
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False, False
    
    @staticmethod
    def generate_user_id(username, email):
        """Generate unique user ID"""
        data = f"{username}{email}{datetime.now().isoformat()}{secrets.token_hex(8)}"
        return hashlib.sha256(data.encode()).hexdigest()[:32]
    
    @staticmethod
    def generate_session_id():
        """Generate session ID"""
        return secrets.token_urlsafe(32)