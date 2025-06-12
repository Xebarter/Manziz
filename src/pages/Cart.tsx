import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCartStore } from '../lib/store';
import { formatPrice } from '../lib/utils';

const Cart: React.FC = () => {
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">
              Looks like you haven't added any delicious items to your cart yet.
            </p>
            <Link
              to="/menu"
              className="inline-flex items-center px-8 py-4 bg-brand-orange text-white rounded-xl font-semibold text-lg hover:bg-brand-red transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="mr-2 w-5 h-5" />
              Browse Menu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-black">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">{items.length} items in your cart</p>
          </div>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-800 transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up">
                <div className="flex items-center space-x-4">
                  <img
                    src={item.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-xl"
                  />
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                    {item.notes && (
                      <p className="text-brand-orange text-sm mt-1">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <span className="font-semibold text-lg w-8 text-center">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-full bg-brand-orange text-white flex items-center justify-center hover:bg-brand-red transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-brand-orange">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-lg p-6 h-fit sticky top-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee</span>
                <span className="font-semibold">
                  {getTotalPrice() >= 50000 ? 'Free' : formatPrice(5000)}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-brand-orange">
                    {formatPrice(getTotalPrice() + (getTotalPrice() >= 50000 ? 0 : 5000))}
                  </span>
                </div>
              </div>
            </div>

            {getTotalPrice() < 50000 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-800">
                  Add {formatPrice(50000 - getTotalPrice())} more for free delivery!
                </p>
              </div>
            )}

            <Link
              to="/checkout"
              className="w-full bg-brand-orange text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-brand-red transition-all duration-200 hover:scale-105 flex items-center justify-center"
            >
              Proceed to Checkout
            </Link>

            <Link
              to="/menu"
              className="w-full mt-3 border-2 border-brand-orange text-brand-orange py-4 px-6 rounded-xl font-semibold text-lg hover:bg-brand-orange hover:text-white transition-all duration-200 flex items-center justify-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;