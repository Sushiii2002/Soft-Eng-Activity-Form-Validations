# app.py

from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from app_config import Config
from backend.database import Database
from backend.auth import AuthManager
from backend.validation import Validator
import os
import logging
from werkzeug.utils import secure_filename
from datetime import datetime
from PIL import Image

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__, 
            static_folder='frontend',
            static_url_path='')
app.config.from_object(Config)
app.secret_key = Config.SECRET_KEY
CORS(app)

# Initialize configuration
Config.init_app(app)

# ============================================
# STATIC FILES ROUTES
# ============================================

@app.route('/')
def index():
    """Serve the login page"""
    return send_from_directory('frontend/pages', 'login.html')

@app.route('/frontend/<path:path>')
def serve_frontend(path):
    """Serve frontend files"""
    return send_from_directory('frontend', path)

# ============================================
# AUTHENTICATION ROUTES
# ============================================

@app.route('/api/login', methods=['POST'])
def login():
    """Handle user login"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '')
        remember_me = data.get('rememberMe', False)
        
        # Validate input
        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Username and password are required'
            }), 400
        
        # Check account lockout
        is_locked, remaining_time = AuthManager.check_account_lockout(username)
        if is_locked:
            return jsonify({
                'success': False,
                'message': f'Account locked. Try again in {remaining_time} minutes.'
            }), 403
        
        # Query user
        query = """
            SELECT user_id, username, password_hash, full_name, role, status
            FROM users
            WHERE username = %s
        """
        users = Database.execute_query(query, (username,), fetch=True)
        
        if not users:
            # Log failed attempt
            AuthManager.log_login_attempt(username, False, 
                                        request.remote_addr, 
                                        'User not found')
            return jsonify({
                'success': False,
                'message': 'Invalid username or password'
            }), 401
        
        user = users[0]
        
        # Check if account is active
        if user['status'] != 'Active':
            return jsonify({
                'success': False,
                'message': 'Account is inactive. Contact administrator.'
            }), 403
        
        # Verify password
        is_valid, needs_rehash = AuthManager.verify_password(
            user['password_hash'], 
            password
        )
        
        if not is_valid:
            # Log failed attempt
            AuthManager.log_login_attempt(username, False, 
                                        request.remote_addr, 
                                        'Invalid password')
            return jsonify({
                'success': False,
                'message': 'Invalid username or password'
            }), 401
        
        # Rehash password if needed (security best practice)
        if needs_rehash:
            new_hash = AuthManager.hash_password(password)
            update_query = "UPDATE users SET password_hash = %s WHERE user_id = %s"
            Database.execute_query(update_query, (new_hash, user['user_id']))
        
        # Create session
        session_id = AuthManager.create_session(
            user['user_id'],
            request.remote_addr,
            request.headers.get('User-Agent', '')
        )
        
        # Update last login
        update_login = """
            UPDATE users 
            SET last_login = NOW(), failed_login_attempts = 0
            WHERE user_id = %s
        """
        Database.execute_query(update_login, (user['user_id'],))
        
        # Log successful attempt
        AuthManager.log_login_attempt(username, True, request.remote_addr)
        
        logger.info(f"User {username} logged in successfully")
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'session_id': session_id,
            'user_id': user['user_id'],
            'username': user['username'],
            'full_name': user['full_name'],
            'role': user['role']
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred during login'
        }), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """Handle user logout"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if session_id:
            AuthManager.logout(session_id)
        
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return jsonify({
            'success': False,
            'message': 'Logout error'
        }), 500

@app.route('/api/validate-session', methods=['POST'])
def validate_session():
    """Validate user session"""
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        
        if not session_id:
            return jsonify({
                'success': True,
                'valid': False
            }), 200
        
        user_data = AuthManager.validate_session(session_id)
        
        if user_data:
            return jsonify({
                'success': True,
                'valid': True,
                'user': user_data
            }), 200
        else:
            return jsonify({
                'success': True,
                'valid': False
            }), 200
            
    except Exception as e:
        logger.error(f"Session validation error: {e}")
        return jsonify({
            'success': False,
            'message': 'Validation error'
        }), 500

# ============================================
# USER MANAGEMENT ROUTES
# ============================================

@app.route('/api/users/register', methods=['POST'])
def register_user():
    """Register new user"""
    try:
        # Get form data
        full_name = request.form.get('fullName', '').strip()
        email = request.form.get('email', '').strip()
        phone = request.form.get('phone', '').strip()
        employment_date = request.form.get('employmentDate')
        username = request.form.get('username', '').strip()
        role = request.form.get('role')
        password = request.form.get('password')
        status = request.form.get('status', 'Active')
        
        # Validate all fields (server-side validation)
        errors = []
        
        # Validate full name
        valid, message = Validator.validate_full_name(full_name)
        if not valid:
            errors.append(message)
        
        # Validate email
        valid, message = Validator.validate_email_address(email)
        if not valid:
            errors.append(message)
        else:
            email = message  # Use normalized email
        
        # Validate phone
        valid, message = Validator.validate_phone(phone)
        if not valid:
            errors.append(message)
        else:
            phone = message  # Use cleaned phone
        
        # Validate username
        valid, message = Validator.validate_username(username)
        if not valid:
            errors.append(message)
        
        # Check if username already exists
        check_username = "SELECT user_id FROM users WHERE username = %s"
        existing_user = Database.execute_query(check_username, (username,), fetch=True)
        if existing_user:
            errors.append('Username already exists')
        
        # Check if email already exists
        check_email = "SELECT user_id FROM users WHERE email = %s"
        existing_email = Database.execute_query(check_email, (email,), fetch=True)
        if existing_email:
            errors.append('Email already registered')
        
        # Validate password
        valid, message = Validator.validate_password(password)
        if not valid:
            errors.append(message)
        
        # Validate role
        valid, message = Validator.validate_role(role)
        if not valid:
            errors.append(message)
        
        # Return errors if any
        if errors:
            return jsonify({
                'success': False,
                'message': '; '.join(errors)
            }), 400
        
        # Handle photo upload
        photo_path = None
        if 'photo' in request.files:
            photo = request.files['photo']
            if photo.filename:
                # Validate file
                valid, message = Validator.validate_file_upload(
                    photo.filename,
                    len(photo.read())
                )
                photo.seek(0)  # Reset file pointer
                
                if not valid:
                    return jsonify({
                        'success': False,
                        'message': message
                    }), 400
                
                # Save photo
                filename = secure_filename(f"{username}_{datetime.now().strftime('%Y%m%d%H%M%S')}.jpg")
                photo_path = os.path.join(Config.UPLOAD_FOLDER, filename)
                
                # Resize and save image
                image = Image.open(photo)
                image.thumbnail((300, 300))
                image.save(photo_path, 'JPEG', quality=85)
                
                photo_path = f"uploads/profile_photos/{filename}"
        
        # Generate user ID
        user_id = AuthManager.generate_user_id(username, email)
        
        # Hash password
        password_hash = AuthManager.hash_password(password)
        
        # Insert user into database
        insert_query = """
            INSERT INTO users (
                user_id, username, password_hash, full_name, email, phone,
                role, employment_date, status, photo_path
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        Database.execute_query(insert_query, (
            user_id, username, password_hash, full_name, email, phone,
            role, employment_date, status, photo_path
        ))
        
        logger.info(f"New user registered: {username}")
        
        return jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({
            'success': False,
            'message': 'An error occurred during registration'
        }), 500

@app.route('/api/users/list', methods=['GET'])
def list_users():
    """Get list of all users"""
    try:
        query = """
            SELECT user_id, username, full_name, email, phone, role, status,
                   employment_date, created_at, last_login
            FROM users
            ORDER BY created_at DESC
        """
        users = Database.execute_query(query, fetch=True)
        
        return jsonify({
            'success': True,
            'users': users
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        return jsonify({
            'success': False,
            'message': 'Error fetching users'
        }), 500

@app.route('/api/users/delete/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user"""
    try:
        # Check if user exists
        check_query = "SELECT user_id, photo_path FROM users WHERE user_id = %s"
        user = Database.execute_query(check_query, (user_id,), fetch=True)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        # Delete photo if exists
        if user[0]['photo_path']:
            photo_path = user[0]['photo_path']
            if os.path.exists(photo_path):
                os.remove(photo_path)
        
        # Delete user
        delete_query = "DELETE FROM users WHERE user_id = %s"
        Database.execute_query(delete_query, (user_id,))
        
        logger.info(f"User deleted: {user_id}")
        
        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Delete error: {e}")
        return jsonify({
            'success': False,
            'message': 'Error deleting user'
        }), 500

# ============================================
# TEST ROUTES
# ============================================

@app.route('/api/test-db')
def test_db():
    """Test database connection"""
    try:
        query = "SELECT VERSION() as version"
        result = Database.execute_query(query, fetch=True)
        return jsonify({
            'success': True,
            'message': 'Database connected',
            'version': result[0]['version'] if result else 'Unknown'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Database error: {str(e)}'
        }), 500

# ============================================
# ERROR HANDLERS
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Resource not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

# ============================================
# RUN APPLICATION
# ============================================

if __name__ == '__main__':
    logger.info("=" * 50)
    logger.info("Starting DR3 Hardware Management System")
    logger.info(f"Environment: {Config.FLASK_ENV}")
    logger.info(f"Debug Mode: {Config.DEBUG}")
    logger.info(f"Upload Folder: {Config.UPLOAD_FOLDER}")
    logger.info("=" * 50)
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=Config.DEBUG
    )