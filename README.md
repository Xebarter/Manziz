# Manziz Restaurant Full-Stack Application

A comprehensive restaurant management system built with React, TypeScript, Tailwind CSS, and Supabase. This application provides a complete solution for restaurant operations including menu management, order processing, table reservations, payment integration, and customer support.

## 🚀 Features

### Customer Features
- **Menu Browsing**: Browse categorized menu with filtering and search capabilities
- **Shopping Cart**: Add items to cart with quantity selection and special notes
- **Order Placement**: Place orders for delivery or pickup with real-time tracking
- **Table Reservations**: Book tables with date/time selection and special requests
- **Payment Integration**: Secure payments via Pesapal (cards, mobile money)
- **Order Tracking**: Real-time order status updates with estimated delivery times
- **Live Chat Support**: Real-time messaging with restaurant staff
- **Contact Forms**: Multiple ways to get in touch with the restaurant

### Admin Features
- **Dashboard Overview**: Comprehensive analytics and key metrics
- **Menu Management**: Add, edit, delete menu items with image uploads
- **Order Management**: View and update order statuses, customer communication
- **Reservation Management**: Handle table bookings and confirmations
- **Chat Management**: Respond to customer messages in real-time
- **Analytics**: Sales reports, popular items, and performance insights
- **Secure Authentication**: Protected admin access with bcrypt password hashing

## 🚀 Dynamic Open Graph Meta Tags

The app automatically generates dynamic Open Graph meta tags that display the first available menu item's image and information when the site is shared on social media platforms.

### How it works:

1. **Automatic Detection**: The `DynamicMetaTags` component runs on every page load
2. **Database Query**: Fetches the first available menu item from the `menu_items` table
3. **Meta Tag Updates**: Dynamically updates Open Graph and Twitter meta tags
4. **Structured Data**: Updates JSON-LD structured data for better SEO

### Components:

- **`DynamicMetaTags`**: Main component that handles automatic meta tag updates
- **`useMetaTags`**: Custom hook for page-specific meta tag management
- **`metaTags.ts`**: Utility functions for meta tag manipulation
- **`MetaTagDebugger`**: Development tool to inspect meta tags (only in development)

### Usage:

```tsx
// Automatic meta tags with first menu item
useMetaTags({ useFirstMenuItem: true })

// Custom meta tags
useMetaTags({
  title: 'Custom Title',
  description: 'Custom description',
  image: 'custom-image-url.jpg',
  useFirstMenuItem: true
})
```

### Supported Platforms:

- **Facebook**: Open Graph meta tags
- **Twitter**: Twitter Card meta tags
- **WhatsApp**: WhatsApp-specific meta tags
- **LinkedIn**: Open Graph meta tags
- **Discord**: Open Graph meta tags

### Meta Tags Updated:

- `og:title` - Page title with menu item name
- `og:description` - Menu item description
- `og:image` - Menu item image URL
- `og:image:alt` - Alt text for the image
- `twitter:title` - Twitter card title
- `twitter:description` - Twitter card description
- `twitter:image` - Twitter card image
- `twitter:image:alt` - Twitter card image alt text
- Structured data (JSON-LD) with restaurant and menu information

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Real-time)
- **Payments**: Pesapal API integration
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Pesapal merchant account (for payments)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd manziz-restaurant-app
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://godivtvgekxlwdgrpnvv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvZGl2dHZnZWt4bHdkZ3JwbnZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzc2ODMsImV4cCI6MjA2NTY1MzY4M30.PKcZN-7pSul9dTLnI1Ni0gv9ktOTcM6DNmH5aAlOecw

# Application Configuration
VITE_APP_URL=http://localhost:5173

# Contact Information
VITE_WHATSAPP_NUMBER=256784811208

# Pesapal Configuration
VITE_PESAPAL_CONSUMER_KEY=nu6JUrYluZWKIK7kDq/bmAXsE+JZsOXx
VITE_PESAPAL_CONSUMER_SECRET=FJS6YRvsINWIn7oDoDLaLcfNehU=
VITE_PESAPAL_IPN_ID=24bef7e0-734c-471f-b351-dbb66b6f56ad
```

### 3. Database Setup

The database schema is automatically created using the migration file. The following tables are included:

- `menu_items` - Restaurant menu items
- `orders` - Customer orders
- `order_items` - Individual items in orders
- `reservations` - Table reservations
- `messages` - Chat messages
- `admins` - Admin users

### 4. Run the Application

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at `http://localhost:5173`

## 🔐 Admin Access

**Default Admin Credentials:**
- Email: `Admin`
- Password: `Maziz123`

Access the admin dashboard at `/admin/login`

## 📱 Key Pages

### Customer Pages
- `/` - Homepage with restaurant information
- `/menu` - Browse and filter menu items
- `/cart` - Shopping cart and checkout
- `/reservations` - Table booking form
- `/track-order` - Order status tracking
- `/contact` - Contact information and form
- `/chat` - Live chat support

### Admin Pages
- `/admin/login` - Admin authentication
- `/admin` - Dashboard overview
- `/admin/menu` - Menu management
- `/admin/orders` - Order management
- `/admin/reservations` - Reservation management
- `/admin/chat` - Customer chat management
- `/admin/analytics` - Sales and performance analytics

## 💳 Payment Integration

The application integrates with Pesapal for secure payment processing:

- **Supported Methods**: Credit/debit cards, mobile money
- **Currency**: Ugandan Shilling (UGX)
- **Security**: PCI-DSS compliant transactions
- **Callback Handling**: Automatic payment status updates

### Payment Flow
1. Customer completes order and proceeds to checkout
2. Order is created in database with "pending" payment status
3. Customer is redirected to Pesapal payment gateway
4. After payment, customer returns to callback URL
5. Payment status is updated in database
6. Customer receives confirmation and can track order

## 🗄 Database Schema

### Menu Items
```sql
CREATE TABLE menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  image_url text,
  category text NOT NULL,
  price numeric NOT NULL,
  is_available boolean DEFAULT true,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
```

### Orders
```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone_number text NOT NULL,
  delivery_type text NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
  delivery_address text,
  order_status text DEFAULT 'received',
  total_amount numeric NOT NULL,
  payment_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
```

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Run the migration file to create tables
3. Configure Row Level Security policies
4. Set up storage buckets for images
5. Update environment variables

### Pesapal Setup
1. Create Pesapal merchant account
2. Get API credentials (Consumer Key, Consumer Secret)
3. Configure IPN (Instant Payment Notification)
4. Set callback URLs
5. Update environment variables

## 🚀 Deployment

### Vercel Deployment
1. Connect repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Environment Variables for Production
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=https://your-domain.vercel.app
VITE_WHATSAPP_NUMBER=256784811208
VITE_PESAPAL_CONSUMER_KEY=your_pesapal_key
VITE_PESAPAL_CONSUMER_SECRET=your_pesapal_secret
VITE_PESAPAL_IPN_ID=your_ipn_id
```

## 📊 Sample Data

The application includes sample data for testing:

### Menu Items (5 items)
- Manziz Special Burger - UGX 25,000
- Chicken Rolex - UGX 15,000
- Manziz Crispy Fries - UGX 12,000
- Grilled Chicken Wings - UGX 18,000
- Fresh Fruit Juice - UGX 8,000

### Orders (2 orders with items)
- Order 1: 2x Special Burger + 1x Fries
- Order 2: 1x Chicken Rolex + 1x Fruit Juice

### Reservations (1 reservation)
- Birthday celebration for 4 guests

## 🔒 Security Features

- **Authentication**: Secure admin login with bcrypt password hashing
- **Authorization**: Role-based access control
- **Data Validation**: Input sanitization and validation
- **SQL Injection Prevention**: Parameterized queries via Supabase
- **XSS Protection**: Content sanitization
- **HTTPS**: Secure data transmission
- **Environment Variables**: Sensitive data protection

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first design approach
- Breakpoints: Mobile (<768px), Tablet (768-1024px), Desktop (>1024px)
- Touch-friendly interfaces
- Optimized images and performance

## 🎨 Design System

### Colors
- **Primary**: Yellow (#FFC107) to Orange (#FF5722)
- **Secondary**: Deep Red (#D32F2F)
- **Neutral**: Black (#212121), Off-white (#F5F5F5)
- **Status Colors**: Success (Green), Warning (Yellow), Error (Red)

### Typography
- **Headings**: Bold, clear hierarchy
- **Body**: Readable, 150% line height
- **UI Elements**: Medium weight, consistent sizing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- **WhatsApp**: +256 784 811 208
- **Email**: Contact through the application
- **Social Media**: 
  - Instagram: @manziz_rollandnosh
  - X (Twitter): @ManzizRolex
  - TikTok: @manziz

## 🙏 Acknowledgments

- **Supabase** for the backend infrastructure
- **Pesapal** for payment processing
- **Vercel** for hosting and deployment
- **Tailwind CSS** for the design system
- **React** and **TypeScript** for the frontend framework

---

Built with ❤️ for Manziz Restaurant