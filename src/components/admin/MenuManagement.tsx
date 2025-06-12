import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Save, X, Heart, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { supabase, MenuItem, MenuService } from '../../lib/supabase';
import { StorageService } from '../../lib/storage';
import { formatPrice } from '../../lib/utils';
import ImageUpload from './ImageUpload';
import toast from 'react-hot-toast';

interface MenuForm {
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  is_available: boolean;
  is_favorite: boolean;
  tags: string;
}

const MenuManagement: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [favoriteFilter, setFavoriteFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<MenuForm>();

  const categories = [
    'all',
    'burgers',
    'chicken',
    'sides',
    'drinks',
    'desserts'
  ];

  const favoriteFilterOptions = [
    { value: 'all', label: 'All Items' },
    { value: 'favorites', label: 'Favorites Only' },
    { value: 'non-favorites', label: 'Non-Favorites' }
  ];

  // Memoize filtered items for better performance
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (favoriteFilter === 'favorites') {
      filtered = filtered.filter(item => item.is_favorite);
    } else if (favoriteFilter === 'non-favorites') {
      filtered = filtered.filter(item => !item.is_favorite);
    }

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [items, searchTerm, categoryFilter, favoriteFilter]);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = useCallback(async () => {
    try {
      const { data, error } = await MenuService.getAllMenuItems();
      
      if (error) {
        console.error('Error fetching menu items:', error);
        // Demo data with favorites
        setItems([
          {
            id: '1',
            name: 'Manziz Special Burger',
            description: 'Our signature burger with beef patty, fresh lettuce, tomatoes, pickles, and our secret sauce.',
            image_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
            category: 'burgers',
            price: 25000,
            is_available: true,
            is_favorite: true,
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
            is_favorite: true,
            tags: ['crispy', 'spicy'],
            created_at: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Classic Cheese Burger',
            description: 'Juicy beef patty with melted cheese, lettuce, tomato, and our special sauce.',
            image_url: 'https://images.pexels.com/photos/1556909/pexels-photo-1556909.jpeg',
            category: 'burgers',
            price: 22000,
            is_available: true,
            is_favorite: false,
            tags: ['classic', 'cheese'],
            created_at: new Date().toISOString()
          }
        ]);
      } else {
        setItems(data);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const openModal = useCallback((item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setCurrentImageUrl(item.image_url || '');
      reset({
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        image_url: item.image_url,
        is_available: item.is_available,
        is_favorite: item.is_favorite,
        tags: item.tags?.join(', ') || ''
      });
    } else {
      setEditingItem(null);
      setCurrentImageUrl('');
      reset({
        name: '',
        description: '',
        category: 'burgers',
        price: 0,
        image_url: '',
        is_available: true,
        is_favorite: false,
        tags: ''
      });
    }
    setShowModal(true);
  }, [reset]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditingItem(null);
    setCurrentImageUrl('');
    reset();
  }, [reset]);

  const handleImageChange = useCallback((url: string) => {
    setCurrentImageUrl(url);
    setValue('image_url', url);
  }, [setValue]);

  const onSubmit = async (data: MenuForm) => {
    setSaving(true);
    try {
      const itemData = {
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        image_url: currentImageUrl,
        is_available: data.is_available,
        is_favorite: data.is_favorite,
        tags: data.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      if (editingItem) {
        // Delete old image if it was replaced
        if (editingItem.image_url && 
            editingItem.image_url !== currentImageUrl && 
            editingItem.image_url.includes('supabase')) {
          await StorageService.deleteImage(editingItem.image_url);
        }

        // Update existing item
        const { error } = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);

        if (error) throw error;

        setItems(items.map(item =>
          item.id === editingItem.id ? { ...item, ...itemData } : item
        ));
        toast.success('Menu item updated successfully');
      } else {
        // Create new item
        const { data: newItem, error } = await supabase
          .from('menu_items')
          .insert([itemData])
          .select()
          .single();

        if (error) throw error;

        setItems([newItem, ...items]);
        toast.success('Menu item created successfully');
      }

      closeModal();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error('Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      const item = items.find(i => i.id === id);
      
      // Delete image from storage if it exists
      if (item?.image_url && item.image_url.includes('supabase')) {
        await StorageService.deleteImage(item.image_url);
      }

      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(items.filter(item => item.id !== id));
      toast.success('Menu item deleted successfully');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    }
  }, [items]);

  const toggleAvailability = useCallback(async (id: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !isAvailable })
        .eq('id', id);

      if (error) throw error;

      setItems(items.map(item =>
        item.id === id ? { ...item, is_available: !isAvailable } : item
      ));
      toast.success(`Item ${!isAvailable ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  }, [items]);

  const toggleFavorite = useCallback(async (id: string, isFavorite: boolean) => {
    try {
      const { error } = await MenuService.toggleFavorite(id, !isFavorite);

      if (error) {
        toast.error('Failed to update favorite status');
        return;
      }

      setItems(items.map(item =>
        item.id === id ? { ...item, is_favorite: !isFavorite } : item
      ));
      
      const action = !isFavorite ? 'added to' : 'removed from';
      toast.success(`Item ${action} customer favorites`);
    } catch (error) {
      console.error('Error updating favorite status:', error);
      toast.error('Failed to update favorite status');
    }
  }, [items]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu items...</p>
        </div>
      </div>
    );
  }

  const favoriteCount = items.filter(item => item.is_favorite).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
            <p className="text-gray-600">Add, edit, and manage your menu items with image uploads</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-500">
                Total Items: <span className="font-semibold">{items.length}</span>
              </span>
              <span className="text-sm text-brand-orange">
                Customer Favorites: <span className="font-semibold">{favoriteCount}</span>
              </span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Favorite Filter */}
            <select
              value={favoriteFilter}
              onChange={(e) => setFavoriteFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent bg-white"
            >
              {favoriteFilterOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Add Item Button */}
            <button
              onClick={() => openModal()}
              className="flex items-center space-x-2 bg-brand-orange text-white px-4 py-2 rounded-lg hover:bg-brand-red transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="relative">
              <img
                src={item.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
                alt={item.name}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
              
              {/* Favorite Badge */}
              {item.is_favorite && (
                <div className="absolute top-3 left-3 bg-brand-orange text-white px-2 py-1 rounded-full flex items-center space-x-1">
                  <Heart className="w-3 h-3 fill-current" />
                  <span className="text-xs font-medium">Favorite</span>
                </div>
              )}
              
              {!item.is_available && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white font-semibold bg-red-500 px-3 py-1 rounded-full">
                    Unavailable
                  </span>
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                <span className="text-lg font-bold text-brand-orange">
                  {formatPrice(item.price)}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                  {item.category}
                </span>
                <div className="flex flex-wrap gap-1">
                  {item.tags?.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => toggleAvailability(item.id, item.is_available)}
                  className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                    item.is_available
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {item.is_available ? 'Available' : 'Unavailable'}
                </button>

                <button
                  onClick={() => toggleFavorite(item.id, item.is_favorite)}
                  className={`flex items-center space-x-1 text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                    item.is_favorite
                      ? 'bg-brand-orange text-white hover:bg-brand-red'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={item.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`w-3 h-3 ${item.is_favorite ? 'fill-current' : ''}`} />
                  <span>{item.is_favorite ? 'Favorite' : 'Add to Favorites'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openModal(item)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🍔</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No menu items found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || categoryFilter !== 'all' || favoriteFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first menu item.'
            }
          </p>
          <button
            onClick={() => openModal()}
            className="bg-brand-orange text-white px-6 py-3 rounded-lg hover:bg-brand-red transition-colors"
          >
            Add Menu Item
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      {...register('name', { required: 'Name is required' })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                      placeholder="Item name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      {...register('category', { required: 'Category is required' })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                    >
                      {categories.slice(1).map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent resize-none"
                    placeholder="Item description"
                  />
                </div>

                {/* Image Upload Component */}
                <ImageUpload
                  currentImage={currentImageUrl}
                  onImageChange={handleImageChange}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (UGX) *
                    </label>
                    <input
                      {...register('price', { 
                        required: 'Price is required',
                        min: { value: 0, message: 'Price must be positive' }
                      })}
                      type="number"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                      placeholder="0"
                    />
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags (comma separated)
                    </label>
                    <input
                      {...register('tags')}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
                      placeholder="spicy, popular, new"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      {...register('is_available')}
                      type="checkbox"
                      className="w-4 h-4 text-brand-orange border-gray-300 rounded focus:ring-brand-orange"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Available for order
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      {...register('is_favorite')}
                      type="checkbox"
                      className="w-4 h-4 text-brand-orange border-gray-300 rounded focus:ring-brand-orange"
                    />
                    <label className="ml-2 text-sm text-gray-700 flex items-center space-x-1">
                      <Heart className="w-4 h-4 text-brand-orange" />
                      <span>Mark as Customer Favorite</span>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Customer Favorites:</strong> Items marked as favorites will be prominently displayed 
                    on the homepage to highlight your most popular dishes.
                  </p>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 bg-brand-orange text-white px-6 py-2 rounded-lg hover:bg-brand-red transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Item'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;