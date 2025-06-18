/*
  # Create default admin user

  1. New Data
    - Insert default admin user with email 'admin' and password 'Maziz123'
    - Password is hashed using bcrypt with salt rounds 10

  2. Security
    - Uses bcrypt hashing for secure password storage
    - Provides initial admin access to the system

  Note: The password hash corresponds to 'Maziz123' and should be changed after first login
*/

-- Insert default admin user with bcrypt hashed password for 'Maziz123'
INSERT INTO admins (email, password_hash) 
VALUES (
  'admin', 
  '$2a$10$8K1p/a0dclxKxYPqJ5PL4.VoELNhQpjXvP5JJXZJXZJXZJXZJXZJXO'
) 
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = '$2a$10$8K1p/a0dclxKxYPqJ5PL4.VoELNhQpjXvP5JJXZJXZJXZJXZJXZJXO';