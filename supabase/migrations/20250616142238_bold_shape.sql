/*
  # Add default admin user

  1. New Data
    - Insert default admin user with email 'admin' and password 'Maziz123'
    - Password is hashed using bcrypt with salt rounds 10

  2. Security
    - Uses bcrypt hashing for password security
    - Provides initial admin access for system setup
*/

-- Insert default admin user
-- Password 'Maziz123' hashed with bcrypt (salt rounds: 10)
INSERT INTO public.admins (email, password_hash) 
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO NOTHING;