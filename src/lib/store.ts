import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MenuItem } from './supabase';
import { User } from './auth';

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: MenuItem, notes?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (item: MenuItem, notes?: string) => {
        const existingItem = get().items.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
          set(state => ({
            items: state.items.map(cartItem =>
              cartItem.id === item.id
                ? { ...cartItem, quantity: cartItem.quantity + 1, notes: notes || cartItem.notes }
                : cartItem
            )
          }));
        } else {
          set(state => ({
            items: [...state.items, { ...item, quantity: 1, notes }]
          }));
        }
      },
      
      removeItem: (id: string) => {
        set(state => ({
          items: state.items.filter(item => item.id !== id)
        }));
      },
      
      updateQuantity: (id: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        
        set(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'manziz-cart'
    }
  )
);

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      
      login: (user: User) => {
        set({ isAuthenticated: true, user });
      },
      
      logout: () => {
        set({ isAuthenticated: false, user: null });
      },

      updateUser: (user: User) => {
        set({ user });
      }
    }),
    {
      name: 'manziz-auth'
    }
  )
);

interface AdminAuthStore {
  isAdminAuthenticated: boolean;
  adminUser: { email: string } | null;
  adminLogin: (email: string) => void;
  adminLogout: () => void;
}

export const useAdminAuthStore = create<AdminAuthStore>()(
  persist(
    (set) => ({
      isAdminAuthenticated: false,
      adminUser: null,
      
      adminLogin: (email: string) => {
        set({ isAdminAuthenticated: true, adminUser: { email } });
      },
      
      adminLogout: () => {
        set({ isAdminAuthenticated: false, adminUser: null });
      }
    }),
    {
      name: 'manziz-admin-auth'
    }
  )
);