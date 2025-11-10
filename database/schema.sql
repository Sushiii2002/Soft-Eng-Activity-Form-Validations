USE dr3_hardware_db;

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS login_attempts;

DROP TABLE IF EXISTS user_sessions;

DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    user_id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(11) NOT NULL,
    role ENUM(
        'Owner',
        'Admin',
        'Inventory Clerk',
        'Cashier'
    ) NOT NULL,
    employment_date DATE NOT NULL,
    status ENUM('Active', 'Inactive') DEFAULT 'Active',
    photo_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    failed_login_attempts INT DEFAULT 0,
    last_login TIMESTAMP NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Create user sessions table (for login management)
CREATE TABLE user_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Create login attempts table (for security tracking)
CREATE TABLE login_attempts (
    attempt_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NOT NULL,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    success BOOLEAN DEFAULT FALSE,
    failure_reason VARCHAR(100),
    INDEX idx_username (username),
    INDEX idx_attempt_time (attempt_time)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- Note: This is a hashed version using Argon2
INSERT INTO
    users (
        user_id,
        username,
        password_hash,
        full_name,
        email,
        phone,
        role,
        employment_date,
        status
    )
VALUES (
        '00000000000000000000000000000001',
        'admin',
        '$argon2id$v=19$m=65536,t=3,p=4$placeholder', -- Placeholder, will be updated by app
        'System Administrator',
        'admin@dr3hardware.com',
        '09171234567',
        'Owner',
        CURDATE(),
        'Active'
    );