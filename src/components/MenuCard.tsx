import React, { useState, memo } from 'react';
import { Plus, Star, Clock } from 'lucide-react';
import { MenuItem } from '../lib/supabase';
import { useCartStore } from '../lib/store';
import { formatPrice } from '../lib/utils';
import toast from 'react-hot-toast';

interface MenuCardProps {
  item: MenuItem;
}

const MenuCard: React.FC<MenuCardProps> = memo(({ item }) => {
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const addItem = useCartStore(state => state.addItem);

  const handleAddToCart = () => {
    addItem(item, notes);
    toast.success(`${item.name} added to cart!`);
    setNotes('');
    setShowNotes(false);
  };

  const handleAddClick = () => {
    setShowNotes(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const fallbackImage = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg';
  const imageUrl = imageError ? fallbackImage : (item.image_url || fallbackImage);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        {/* Image placeholder while loading */}
        {!imageLoaded && (
          <div className="w-full h-48 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        )}
        
        <img
          src={imageUrl}
          alt={item.name}
          className={`w-full h-48 object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
          decoding="async"
        />
        
        {!item.is_available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-semibold bg-red-500 px-3 py-1 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white rounded-full px-2 py-1 flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-sm font-medium">4.5</span>
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
          <span className="text-xl font-bold text-brand-orange">
            {formatPrice(item.price)}
          </span>
        </div>

        <p className="text-gray-600 mb-4 line-clamp-2">{item.description}</p>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">15-20 mins</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {item.tags?.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {showNotes && (
          <div className="mb-4 animate-slide-up">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special instructions (optional)..."
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none"
              rows={2}
            />
          </div>
        )}

        <div className="flex space-x-2">
          {!showNotes ? (
            <button
              onClick={handleAddClick}
              disabled={!item.is_available}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                item.is_available
                  ? 'bg-brand-orange text-white hover:bg-brand-red hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span>Add to Cart</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowNotes(false)}
                className="px-4 py-3 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-brand-orange text-white py-3 px-4 rounded-xl font-semibold hover:bg-brand-red transition-all duration-200 hover:scale-105"
              >
                Add to Cart
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

MenuCard.displayName = 'MenuCard';

export default MenuCard;