import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-my-custom-header': 'manziz-app',
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  image_url: string;
  category: string;
  price: number;
  is_available: boolean;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  phone_number: string;
  delivery_type: 'delivery' | 'pickup';
  delivery_address?: string;
  order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  total_amount: number;
  payment_status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  notes?: string;
  price_at_time: number;
  created_at: string;
  menu_item?: MenuItem;
}

export interface Reservation {
  id: string;
  name: string;
  phone_number: string;
  reservation_time: string;
  guests: number;
  special_request?: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender: 'admin' | 'customer';
  message: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  is_read: boolean;
  reply_to?: string;
  created_at: string;
}

export interface Admin {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

// Menu service functions
export class MenuService {
  static async getFavoriteItems(): Promise<{ data: MenuItem[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_favorite', true)
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(6); // Limit to 6 favorites for homepage

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Error fetching favorite items:', error);
      return { data: [], error: error.message };
    }
  }

  static async toggleFavorite(itemId: string, isFavorite: boolean): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_favorite: isFavorite })
        .eq('id', itemId);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      return { error: error.message };
    }
  }

  static async getAllMenuItems(): Promise<{ data: MenuItem[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Error fetching menu items:', error);
      return { data: [], error: error.message };
    }
  }
}

// Message service functions
export class MessageService {
  static async sendCustomerMessage(
    message: string,
    customerName?: string,
    customerEmail?: string,
    customerPhone?: string
  ): Promise<{ data: Message | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender: 'customer',
          message: message.trim(),
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          is_read: false
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error sending customer message:', error);
      return { data: null, error: error.message };
    }
  }

  static async sendAdminMessage(
    message: string,
    replyTo?: string
  ): Promise<{ data: Message | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender: 'admin',
          message: message.trim(),
          reply_to: replyTo,
          is_read: false
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error sending admin message:', error);
      return { data: null, error: error.message };
    }
  }

  static async getMessages(): Promise<{ data: Message[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      return { data: [], error: error.message };
    }
  }

  static async markMessageAsRead(messageId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      return { error: error.message };
    }
  }

  static async getUnreadCount(): Promise<{ count: number; error: string | null }> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
        .eq('sender', 'customer');

      if (error) throw error;
      return { count: count || 0, error: null };
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      return { count: 0, error: error.message };
    }
  }

  static subscribeToMessages(callback: (message: Message) => void) {
    return supabase
      .channel('messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  }

  static subscribeToMessageUpdates(callback: (message: Message) => void) {
    return supabase
      .channel('message_updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  }
}