import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, Truck, Users, Heart } from 'lucide-react';
import { MenuService, MenuItem } from '../lib/supabase';
import { formatPrice } from '../lib/utils';
import { useCartStore } from '../lib/store';
import toast from 'react-hot-toast';

const Home: React.FC = () => {
  const [favoriteItems, setFavoriteItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);

  const features = [
    {
      icon: <Clock className="w-8 h-8" />,
      title: 'Fast Delivery',
      description: 'Get your favorite meals delivered hot and fresh in 30 minutes or less.'
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: 'Quality Food',
      description: 'We use only the finest ingredients to create dishes that bring smiles.'
    },
    {
      icon: <Truck className="w-8 h-8" />,
      title: 'Free Delivery',
      description: 'Enjoy free delivery on orders above UGX 50,000 within Kampala.'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Happy Customers',
      description: 'Join thousands of satisfied customers who trust Manziz for great food.'
    }
  ];

  useEffect(() => {
    fetchFavoriteItems();
  }, []);

  const fetchFavoriteItems = async () => {
    try {
      const { data, error } = await MenuService.getFavoriteItems();
      
      if (error) {
        console.error('Error fetching favorites:', error);
        // Fallback to demo data
        setFavoriteItems([
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
            name: 'Loaded Fries',
            description: 'Crispy fries topped with cheese, bacon bits, and green onions.',
            image_url: 'https://images.pexels.com/photos/1893556/pexels-photo-1893556.jpeg',
            category: 'sides',
            price: 15000,
            is_available: true,
            is_favorite: true,
            tags: ['cheesy', 'loaded'],
            created_at: new Date().toISOString()
          }
        ]);
      } else {
        setFavoriteItems(data);
      }
    } catch (error) {
      console.error('Error fetching favorite items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: MenuItem) => {
    addItem(item);
    toast.success(`${item.name} added to cart!`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-yellow via-brand-orange to-brand-red text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Fast Food That
                <span className="block text-brand-yellow">Brings Smiles</span>
              </h1>
              <p className="text-xl mb-8 text-gray-100 leading-relaxed">
                Experience the taste that makes every bite a celebration. 
                From juicy burgers to crispy wings, we deliver happiness to your doorstep.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/menu"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-brand-orange rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  Order Now
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  to="/reservations"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white rounded-xl font-semibold text-lg hover:bg-white hover:text-brand-orange transition-all duration-200"
                >
                  Book a Table
                </Link>
              </div>
            </div>
            <div className="animate-bounce-in">
              <img
                src="https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg"
                alt="Delicious burger"
                className="w-full h-96 object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-brand-black mb-4">
              Why Choose Manziz?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to delivering exceptional food experiences that keep our customers coming back for more.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="text-brand-orange mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-brand-black mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Favorites Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Heart className="w-8 h-8 text-brand-orange" />
              <h2 className="text-4xl font-bold text-brand-black">Customer Favorites</h2>
            </div>
            <p className="text-xl text-gray-600">
              These are the dishes our customers can't stop talking about!
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : favoriteItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {favoriteItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-slide-up group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="relative">
                    <img
                      src={item.image_url || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg'}
                      alt={item.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 bg-brand-orange text-white px-2 py-1 rounded-full flex items-center space-x-1">
                      <Heart className="w-3 h-3 fill-current" />
                      <span className="text-xs font-medium">Favorite</span>
                    </div>
                    <div className="absolute top-3 right-3 bg-white rounded-full px-2 py-1 flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">4.8</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-brand-black">{item.name}</h3>
                      <span className="text-xl font-bold text-brand-orange">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {item.tags?.slice(0, 2).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="bg-brand-orange text-white px-4 py-2 rounded-lg font-semibold hover:bg-brand-red transition-all duration-200 hover:scale-105 flex items-center space-x-1"
                      >
                        <span>Add</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No favorites yet</h3>
              <p className="text-gray-600 mb-6">
                Our admin team is curating the best dishes for you. Check back soon!
              </p>
              <Link
                to="/menu"
                className="inline-flex items-center px-6 py-3 bg-brand-orange text-white rounded-xl font-semibold hover:bg-brand-red transition-colors"
              >
                Browse Full Menu
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          )}

          {favoriteItems.length > 0 && (
            <div className="text-center mt-12">
              <Link
                to="/menu"
                className="inline-flex items-center px-8 py-4 bg-brand-orange text-white rounded-xl font-semibold text-lg hover:bg-brand-red transition-all duration-200 hover:scale-105 shadow-lg"
              >
                View Full Menu
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-brand-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Experience the Manziz Difference?
          </h2>
          <p className="text-xl mb-8 text-gray-300">
            Join thousands of happy customers who have made Manziz their go-to place for delicious fast food.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/menu"
              className="inline-flex items-center justify-center px-8 py-4 bg-brand-orange text-white rounded-xl font-semibold text-lg hover:bg-brand-red transition-all duration-200 hover:scale-105"
            >
              Order Now
            </Link>
            <a
              href="tel:+256784811208"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-brand-orange text-brand-orange rounded-xl font-semibold text-lg hover:bg-brand-orange hover:text-white transition-all duration-200"
            >
              Call to Order
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;