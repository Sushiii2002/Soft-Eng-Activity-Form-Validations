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
    """Handles user authentication and password operations"""
    
    @staticmethod
    def hash_password(password):
        """
        Hash a password using Argon2id
        
        Args:
            password (str): Plain text password
            
        Returns:
            str: Hashed password
        """
        try:
            return ph.hash(password)
        except Exception as e:
            logger.error(f"Password hashing error: {e}")
            raise
    
    @staticmethod
    def verify_password(password_hash, password):
        """
        Verify a password against its hash
        
        Args:
            password_hash (str): Stored password hash
            password (str): Plain text password to verify
            
        Returns:
            tuple: (bool verified, bool needs_rehash)
        """
        try:
            ph.verify(password_hash, password)
            
            # Check if password needs rehashing (best practice)
            if ph.check_needs_rehash(password_hash):
                logger.info("Password needs rehashing")
                return True, True
            
            return True, False
            
        except VerifyMismatchError:
            return False, False
        except Exception as e:
            logger.error(f"Password verification error: {e}")
            return False, False
    
    @staticmethod
    def generate_user_id(username, email):
        """
        Generate unique user ID using SHA-256 hash
        
        Args:
            username (str): Username
            email (str): Email address
            
        Returns:
            str: Unique user ID (32 characters)
        """
        data = f"{username}{email}{datetime.now().isoformat()}{secrets.token_hex(8)}"
        return hashlib.sha256(data.encode()).hexdigest()[:32]
    
    @staticmethod
    def generate_session_id():
        """Generate a secure session ID"""
        return secrets.token_urlsafe(32)
    
    @staticmethod
    def create_session(user_id, ip_address='', user_agent=''):
        """
        Create a new user session
        
        Args:
            user_id (str): User ID
            ip_address (str): User's IP address
            user_agent (str): User's browser user agent
            
        Returns:
            str: Session ID
        """
        session_id = AuthManager.generate_session_id()
        
        query = """
            INSERT INTO user_sessions 
            (session_id, user_id, ip_address, user_agent)
            VALUES (%s, %s, %s, %s)
        """
        
        try:
            Database.execute_query(query, (session_id, user_id, ip_address, user_agent))
            logger.info(f"Session created for user: {user_id}")
            return session_id
        except Exception as e:
            logger.error(f"Session creation error: {e}")
            raise
    
    @staticmethod
    def validate_session(session_id):
        """
        Validate if a session is active
        
        Args:
            session_id (str): Session ID to validate
            
        Returns:
            dict: User data if valid, None otherwise
        """
        query = """
            SELECT u.user_id, u.username, u.full_name, u.role, u.status
            FROM user_sessions s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.session_id = %s 
            AND s.is_active = TRUE
            AND u.status = 'Active'
            AND s.last_activity > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        """
        
        try:
            result = Database.execute_query(query, (session_id,), fetch=True)
            if result:
                # Update last activity
                update_query = "UPDATE user_sessions SET last_activity = NOW() WHERE session_id = %s"
                Database.execute_query(update_query, (session_id,))
                return result[0]
            return None
        except Exception as e:
            logger.error(f"Session validation error: {e}")
            return None
    
    @staticmethod
    def logout(session_id):
        """Deactivate a user session"""
        query = "UPDATE user_sessions SET is_active = FALSE WHERE session_id = %s"
        try:
            Database.execute_query(query, (session_id,))
            logger.info(f"Session logged out: {session_id}")
        except Exception as e:
            logger.error(f"Logout error: {e}")
            raise
    
    @staticmethod
    def log_login_attempt(username, success, ip_address='', failure_reason=''):
        """Log a login attempt for security tracking"""
        query = """
            INSERT INTO login_attempts 
            (username, ip_address, success, failure_reason)
            VALUES (%s, %s, %s, %s)
        """
        
        try:
            Database.execute_query(query, (username, ip_address, success, failure_reason))
        except Exception as e:
            logger.error(f"Error logging login attempt: {e}")
    
    @staticmethod
    def check_account_lockout(username):
        """
        Check if account is locked due to failed attempts
        
        Args:
            username (str): Username to check
            
        Returns:
            tuple: (is_locked: bool, remaining_time_minutes: int)
        """
        query = """
            SELECT COUNT(*) as failed_count,
                   MAX(attempt_time) as last_attempt
            FROM login_attempts
            WHERE username = %s
            AND success = FALSE
            AND attempt_time > DATE_SUB(NOW(), INTERVAL 15 MINUTE)
        """
        
        try:
            result = Database.execute_query(query, (username,), fetch=True)
            if result and len(result) > 0:
                failed_count = result[0]['failed_count']
                if failed_count >= 5:
                    last_attempt = result[0]['last_attempt']
                    if last_attempt:
                        lockout_end = last_attempt + timedelta(minutes=15)
                        remaining = (lockout_end - datetime.now()).total_seconds() / 60
                        if remaining > 0:
                            return True, int(remaining)
            return False, 0
        except Exception as e:
            logger.error(f"Error checking account lockout: {e}")
            return False, 0