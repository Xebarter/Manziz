import React, { useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { MenuItem } from '../lib/supabase';

interface MenuItemPreviewProps {
  item: MenuItem | null;
  onClose: () => void;
  onAddToCart: (item: MenuItem, quantity: number) => void;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

const MenuItemPreview: React.FC<MenuItemPreviewProps> = ({
  item,
  onClose,
  onAddToCart,
  quantity,
  onQuantityChange
}) => {
  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [item]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div 
          className="fixed inset-0 bg-black/70 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        
        <div className="relative my-8 w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/80 p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
            aria-label="Close preview"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Item image */}
          <div className="relative h-64 w-full overflow-hidden bg-gray-100 sm:h-80">
            <img
              src={item.image_url || 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=800'}
              alt={item.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Item details */}
          <div className="p-6 sm:p-8">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                {item.tags?.includes('Pre-Order') && (
                  <span className="mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    Pre-Order
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-orange-600">
                UGX {item.price.toLocaleString()}
              </p>
            </div>

            <p className="mb-6 text-gray-600">{item.description}</p>

            {item.tags?.includes('Pre-Order') && (
              <div className="mb-6 rounded-lg bg-green-50 p-4">
                <p className="flex items-center text-sm text-green-700">
                  <svg
                    className="mr-2 h-4 w-4 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Pre-Orders: Ready within 24 hours after payment
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-lg font-medium">{quantity}</span>
                <button
                  onClick={() => onQuantityChange(quantity + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  onAddToCart(item, quantity);
                  onClose();
                }}
                className="flex items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3 text-white hover:from-orange-500 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart - UGX {(item.price * quantity).toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuItemPreview;
