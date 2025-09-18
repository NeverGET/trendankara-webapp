-- Script to create admin and superadmin users in production database
-- Passwords are hashed using bcrypt with 10 rounds

-- Delete existing users with these usernames (if any)
DELETE FROM users WHERE email IN ('admin', 'superadmin');

-- Insert admin user
-- Username: admin
-- Password: admin
INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
VALUES (
    'admin',
    '$2a$10$xH6.TmKwtLVgVr7rR3HJaeWz1oA0Xj1V9k4rYZhF4Y8ZN7z0N7cBa', -- bcrypt hash of 'admin'
    'Admin User',
    'admin',
    1,
    NOW(),
    NOW()
);

-- Insert superadmin user
-- Username: superadmin
-- Password: superadmin
INSERT INTO users (email, password, name, role, is_active, created_at, updated_at)
VALUES (
    'superadmin',
    '$2a$10$QWvT9XvB1ivVPqOv7cKhe.kl3BvM9XE1pZf9Q9kGwm1/sFpQvqmtO', -- bcrypt hash of 'superadmin'
    'Super Admin',
    'super_admin',
    1,
    NOW(),
    NOW()
);

-- Verify the users were created
SELECT id, email, name, role, is_active FROM users WHERE email IN ('admin', 'superadmin');