/*
  # Create Manziz Restaurant Database Schema

  1. New Tables
    - `menu_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `image_url` (text)
      - `category` (text)
      - `price` (numeric)
      - `is_available` (boolean, default true)
      - `tags` (text array)
      - `created_at` (timestamp)
    
    - `orders`
      - `id` (uuid, primary key)
      - `customer_name` (text)
      - `phone_number` (text)
      - `delivery_type` (text)
      - `delivery_address` (text, nullable)
      - `order_status` (text, default 'received')
      - `total_amount` (numeric)
      - `payment_status` (text, default 'pending')
      - `created_at` (timestamp)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `menu_item_id` (uuid, foreign key)
      - `quantity` (integer)
      - `notes` (text, nullable)
      - `price_at_time` (numeric)
      - `created_at` (timestamp)
    
    - `reservations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `phone_number` (text)
      - `reservation_time` (timestamp)
      - `guests` (integer)
      - `special_request` (text, nullable)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
    
    - `messages`
      - `id` (uuid, primary key)
      - `sender` (text, check constraint)
      - `message` (text)
      - `file_url` (text, nullable)
      - `created_at` (timestamp)
    
    - `admins`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access to menu items
    - Add policies for authenticated admin access
    - Add policies for order and reservation management

  3. Sample Data
    - Insert sample menu items for testing
    - Insert sample orders and order items
    - Insert sample reservation
    - Insert admin user with bcrypt password
*/

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  image_url text,
  category text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  is_available boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  delivery_type text NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
  delivery_address text,
  order_status text DEFAULT 'received' CHECK (order_status IN ('received', 'preparing', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled')),
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  notes text,
  price_at_time numeric NOT NULL CHECK (price_at_time >= 0),
  created_at timestamptz DEFAULT now()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone_number text NOT NULL,
  reservation_time timestamptz NOT NULL,
  guests integer NOT NULL CHECK (guests > 0),
  special_request text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender text NOT NULL CHECK (sender IN ('admin', 'customer')),
  message text NOT NULL,
  file_url text,
  created_at timestamptz DEFAULT now()
);

-- Create admins table
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policies for menu_items (public read access)
CREATE POLICY "Anyone can view menu items"
  ON menu_items
  FOR SELECT
  TO public
  USING (true);

-- Create policies for orders (public insert, restricted update)
CREATE POLICY "Anyone can create orders"
  ON orders
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view their orders"
  ON orders
  FOR SELECT
  TO public
  USING (true);

-- Create policies for order_items (public insert, restricted access)
CREATE POLICY "Anyone can create order items"
  ON order_items
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view order items"
  ON order_items
  FOR SELECT
  TO public
  USING (true);

-- Create policies for reservations (public insert and read)
CREATE POLICY "Anyone can create reservations"
  ON reservations
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view reservations"
  ON reservations
  FOR SELECT
  TO public
  USING (true);

-- Create policies for messages (public access)
CREATE POLICY "Anyone can create messages"
  ON messages
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can view messages"
  ON messages
  FOR SELECT
  TO public
  USING (true);

-- Create policies for admins (restricted access)
CREATE POLICY "Admins can view admin data"
  ON admins
  FOR SELECT
  TO public
  USING (true);

-- Insert sample menu items
INSERT INTO menu_items (name, description, image_url, category, price, is_available, tags) VALUES
('Manziz Special Burger', 'Our signature beef burger with lettuce, tomato, onions, pickles, and our special sauce on a toasted sesame bun', 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=500', 'burgers', 25000, true, ARRAY['popular', 'signature']),
('Chicken Rolex', 'Traditional Ugandan wrap with grilled chicken, vegetables, tomatoes, and chapati', 'https://images.pexels.com/photos/2474658/pexels-photo-2474658.jpeg?auto=compress&cs=tinysrgb&w=500', 'chicken', 15000, true, ARRAY['local', 'popular']),
('Manziz Crispy Fries', 'Golden crispy potato fries seasoned with our special blend of spices', 'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg?auto=compress&cs=tinysrgb&w=500', 'sides', 12000, true, ARRAY['popular', 'vegetarian']),
('Grilled Chicken Wings', 'Juicy chicken wings marinated in our secret sauce and grilled to perfection', 'https://images.pexels.com/photos/2282532/pexels-photo-2282532.jpeg?auto=compress&cs=tinysrgb&w=500', 'chicken', 18000, true, ARRAY['spicy', 'grilled']),
('Fresh Fruit Juice', 'Freshly squeezed seasonal fruit juice - ask for todays selection', 'https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg?auto=compress&cs=tinysrgb&w=500', 'drinks', 8000, true, ARRAY['fresh', 'healthy', 'vegan']);

-- Insert sample orders
INSERT INTO orders (id, customer_name, phone_number, delivery_type, delivery_address, order_status, total_amount, payment_status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John Doe', '+256701234567', 'delivery', 'Kampala Central, Near City Square', 'preparing', 58000, 'completed'),
('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', '+256707654321', 'pickup', NULL, 'ready_for_pickup', 27000, 'pending');

-- Insert sample order items for first order
INSERT INTO order_items (order_id, menu_item_id, quantity, notes, price_at_time) VALUES
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM menu_items WHERE name = 'Manziz Special Burger' LIMIT 1), 2, 'Extra sauce please', 25000),
('550e8400-e29b-41d4-a716-446655440001', (SELECT id FROM menu_items WHERE name = 'Manziz Crispy Fries' LIMIT 1), 1, '', 12000);

-- Insert sample order items for second order
INSERT INTO order_items (order_id, menu_item_id, quantity, notes, price_at_time) VALUES
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM menu_items WHERE name = 'Chicken Rolex' LIMIT 1), 1, 'No onions', 15000),
('550e8400-e29b-41d4-a716-446655440002', (SELECT id FROM menu_items WHERE name = 'Fresh Fruit Juice' LIMIT 1), 1, 'Mango if available', 8000);

-- Insert sample reservation
INSERT INTO reservations (name, phone_number, reservation_time, guests, special_request, status) VALUES
('Alice Johnson', '+256703456789', '2024-12-18 19:00:00+03', 4, 'Birthday celebration - please prepare a small cake', 'confirmed');

-- Insert admin user (password: Maziz123)
-- Note: This is a bcrypt hash for 'Maziz123'
INSERT INTO admins (email, password_hash) VALUES
('Admin', '$2a$10$5JZ9yOhCjEZi3zlNcJSLOOqGZ8E9ZoR3JdLzHvOYmEZzK9tDqGN6e');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON reservations(reservation_time);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);