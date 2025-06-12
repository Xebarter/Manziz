import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  created_at: string;
  isAdmin: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  created_at: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;

  async signInAdmin(email: string, password: string): Promise<AuthUser> {
    try {
      // First, sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        throw new Error('Invalid admin credentials');
      }
      
      if (!authData.user) {
        throw new Error('No user returned from authentication');
      }

      // Check if this user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('id, email')
        .eq('id', authData.user.id)
        .single();

      if (adminError || !adminData) {
        console.error('Admin lookup error:', adminError);
        // Sign out if not an admin
        await supabase.auth.signOut();
        throw new Error('Invalid admin credentials - not authorized as admin');
      }

      this.currentUser = {
        id: adminData.id,
        email: adminData.email,
        isAdmin: true,
        created_at: new Date().toISOString()
      };

      return this.currentUser;
    } catch (error) {
      console.error('Admin sign in error:', error);
      throw error;
    }
  }

  async signInUser(email: string, password: string): Promise<AuthUser> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from authentication');

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, phone_number, created_at')
        .eq('id', authData.user.id)
        .single();

      if (userError || !userData) {
        throw new Error('User data not found');
      }

      this.currentUser = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        created_at: userData.created_at,
        isAdmin: false
      };

      return this.currentUser;
    } catch (error) {
      console.error('User sign in error:', error);
      throw error;
    }
  }

  async signUpUser(email: string, password: string, fullName: string, phoneNumber?: string): Promise<AuthUser> {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from signup');

      // Create user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          full_name: fullName,
          phone_number: phoneNumber
        }])
        .select()
        .single();

      if (userError) throw userError;

      this.currentUser = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        created_at: userData.created_at,
        isAdmin: false
      };

      return this.currentUser;
    } catch (error) {
      console.error('User sign up error:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      this.currentUser = null;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        this.currentUser = null;
        return null;
      }

      // Check if user is admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('id, email')
        .eq('id', user.id)
        .single();

      if (adminData) {
        this.currentUser = {
          id: adminData.id,
          email: adminData.email,
          isAdmin: true,
          created_at: new Date().toISOString()
        };
      } else {
        // Check if regular user
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, full_name, phone_number, created_at')
          .eq('id', user.id)
          .single();

        if (userData) {
          this.currentUser = {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            phone_number: userData.phone_number,
            created_at: userData.created_at,
            isAdmin: false
          };
        }
      }

      return this.currentUser;
    } catch (error) {
      console.error('Get current user error:', error);
      this.currentUser = null;
      return null;
    }
  }

  getCurrentUserSync(): AuthUser | null {
    return this.currentUser;
  }

  async updateProfile(userId: string, data: { full_name: string; phone_number?: string }): Promise<{ user: User; error?: string }> {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .update({
          full_name: data.full_name,
          phone_number: data.phone_number
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return { user: userData };
    } catch (error: any) {
      console.error('Profile update error:', error);
      return { user: {} as User, error: error.message };
    }
  }

  static async getUserOrders(userId: string): Promise<{ orders: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_item:menu_items (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { orders: data || [] };
    } catch (error: any) {
      console.error('Get user orders error:', error);
      return { orders: [], error: error.message };
    }
  }

  async checkAuthState(): Promise<void> {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        this.currentUser = null;
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await this.getCurrentUser();
      }
    });
  }
}

export const authService = new AuthService();

// Initialize auth state checking
authService.checkAuthState();

export { AuthService };