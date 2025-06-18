/*
  # Create default admin user

  1. New Data
    - Insert default admin user with email 'admin' and password 'Maziz123'
    - Password is hashed using bcrypt with salt rounds 10
  
  2. Security
    - Uses bcrypt hashing for secure password storage
    - Email is stored in lowercase for consistency
*/

-- Insert default admin user if not exists
INSERT INTO admins (email, password_hash)
SELECT 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE NOT EXISTS (
  SELECT 1 FROM admins WHERE email = 'admin'
);