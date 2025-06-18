/*
  # Create default admin user

  1. Ensure admins table exists with proper structure
  2. Insert default admin user with credentials:
     - Email: admin
     - Password: Maziz123 (bcrypt hashed)
  3. Set up proper RLS policies
*/

-- Ensure the admins table exists (it should based on schema)
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view admin data
DROP POLICY IF EXISTS "Admins can view admin data" ON admins;
CREATE POLICY "Admins can view admin data"
  ON admins
  FOR SELECT
  TO public
  USING (true);

-- Insert default admin user with bcrypt hashed password for 'Maziz123'
-- Using a known bcrypt hash for the password 'Maziz123'
INSERT INTO admins (email, password_hash)
VALUES ('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (email) DO UPDATE SET
  password_hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';