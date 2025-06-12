/*
  # Create payments table for PesaPal integration

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `tracking_id` (text, PesaPal tracking ID)
      - `status` (text, payment status)
      - `provider` (text, payment provider - 'pesapal')
      - `confirmation_code` (text, payment confirmation code)
      - `payment_method` (text, payment method used)
      - `payment_data` (jsonb, full payment response data)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `payments` table
    - Add policies for admin access and user access to own payments
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tracking_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'initiated',
  provider text NOT NULL DEFAULT 'pesapal',
  confirmation_code text,
  payment_method text,
  payment_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_tracking_id ON payments(tracking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all payments
CREATE POLICY "Admins can read all payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Allow admins to insert payments
CREATE POLICY "Admins can insert payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Allow admins to update payments
CREATE POLICY "Admins can update payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Allow users to read their own order payments
CREATE POLICY "Users can read own order payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = payments.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Allow anonymous access for payment processing (needed for callbacks)
CREATE POLICY "Allow anonymous payment operations"
  ON payments
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Add constraint for valid payment statuses
ALTER TABLE payments 
ADD CONSTRAINT payments_status_check 
CHECK (status IN ('initiated', 'pending', 'completed', 'failed', 'cancelled', 'refunded'));

-- Add constraint for valid providers
ALTER TABLE payments 
ADD CONSTRAINT payments_provider_check 
CHECK (provider IN ('pesapal', 'cash', 'card'));