import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import { supabase, MenuItem } from '../lib/supabase';
import MenuCard from '../components/MenuCard';
import toast from 'react-hot-toast';

const Menu: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const categories = [
    'all',
    'burgers',
    'chicken',
    'sides',
    'drinks',
    'desserts'
  ];

  // Memoize filtered items to avoid unnecessary recalculations
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [items, searchTerm, selectedCategory]);

  // Debounced search to reduce filtering frequency
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(debouncedSearchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items. Please try again.');
      // Show demo data for now
      setItems([
        {
          id: '1',
          name: 'Manziz Special Burger',
          description: 'Our signature burger with beef patty, fresh lettuce, tomatoes, pickles, and our secret sauce.',
          image_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
          category: 'burgers',
          price: 25000,
          is_available: true,
          tags: ['signature', 'beef'],
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Crispy Chicken Wings',
          description: 'Perfectly seasoned and fried chicken wings served with your choice of sauce.',
          image_url: 'https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg',
          category: 'chicken',
          price: 18000,
          is_available: true,
          tags: ['crispy', 'spicy'],
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Loaded Fries',
          description: 'Crispy fries topped with cheese, bacon bits, and green onions.',
          image_url: 'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg',
          category: 'sides',
          price: 15000,
          is_available: true,
          tags: ['cheesy', 'loaded'],
          created_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'Classic Cheese Burger',
          description: 'Juicy beef patty with melted cheese, lettuce, tomato, and our special sauce.',
          image_url: 'https://images.pexels.com/photos/1556909/pexels-photo-1556909.jpeg',
          category: 'burgers',
          price: 22000,
          is_available: true,
          tags: ['classic', 'cheese'],
          created_at: new Date().toISOString()
        },
        {
          id: '5',
          name: 'Chicken Strips',
          description: 'Tender chicken strips coated in crispy breadcrumbs, served with dipping sauce.',
          image_url: 'https://images.pexels.com/photos/2338407/pexels-photo-2338407.jpeg',
          category: 'chicken',
          price: 16000,
          is_available: true,
          tags: ['tender', 'strips'],
          created_at: new Date().toISOString()
        },
        {
          id: '6',
          name: 'Fresh Soda',
          description: 'Ice-cold soft drinks to complement your meal perfectly.',
          image_url: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg',
          category: 'drinks',
          price: 5000,
          is_available: true,
          tags: ['cold', 'refreshing'],
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleViewModeChange = useCallback((mode: 'grid' | 'list') => {
    setViewMode(mode);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delicious menu items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-brand-black mb-4">Our Menu</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Discover our mouth-watering selection of fast food favorites, 
            crafted with love to bring smiles to your face.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={debouncedSearchTerm}
                onChange={(e) => setDebouncedSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-4">
              <Filter className="text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-brand-orange shadow' : 'text-gray-600'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-white text-brand-orange shadow' : 'text-gray-600'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredItems.length} of {items.length} items
            {selectedCategory !== 'all' && ` in ${selectedCategory}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        {/* Menu Items Grid/List */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍔</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredItems.map((item) => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Menu;