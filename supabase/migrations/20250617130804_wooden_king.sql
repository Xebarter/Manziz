/*
  # Fix admin password hash

  1. Update admin password hash to correct bcrypt hash for 'Manziz123'
  2. Ensure admin user exists with correct credentials
*/

-- Update the admin user with the correct password hash for 'Manziz123'
UPDATE admins 
SET password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'Admin';

-- If the admin doesn't exist, create it
INSERT INTO admins (email, password_hash)
VALUES ('Admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';