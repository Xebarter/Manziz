import React, { useEffect } from 'react';
import { useMetaTags } from '../hooks/useMetaTags';
import { Users, Target, Heart, Clock, Sparkles, Award, HeartHandshake } from 'lucide-react';

const About: React.FC = () => {
  // Set meta tags for the about page
  useMetaTags({
    title: 'About Manziz - Our Story, Vision & Values',
    description: 'Discover the story behind Manziz Restaurant. Learn about our vision, mission, and core values that drive us to serve you better every day.'
  });

  const values = [
    {
      icon: <Heart className="w-8 h-8 text-red-500" />,
      title: 'Passion for Food',
      description: 'We pour our heart into every dish, ensuring authentic flavors and quality ingredients.'
    },
    {
      icon: <Clock className="w-8 h-8 text-amber-500" />,
      title: 'Timeless Recipes',
      description: 'Preserving traditional cooking methods while embracing modern culinary innovations.'
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: 'Community First',
      description: 'Building relationships with our customers and supporting local producers.'
    },
    {
      icon: <Award className="w-8 h-8 text-purple-500" />,
      title: 'Excellence',
      description: 'Committed to exceptional service and dining experience for every guest.'
    },
    {
      icon: <HeartHandshake className="w-8 h-8 text-green-500" />,
      title: 'Integrity',
      description: 'Honest, transparent, and ethical in all our business practices.'
    },
    {
      icon: <Sparkles className="w-8 h-8 text-yellow-500" />,
      title: 'Innovation',
      description: 'Continuously evolving our menu and services to exceed expectations.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-r from-amber-600 to-amber-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="container mx-auto px-6 relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center">Our Story</h1>
          <p className="text-xl md:text-2xl text-center max-w-4xl mx-auto leading-relaxed">
            From a humble beginning to becoming a culinary landmark, our journey is a testament to passion, perseverance, and the love of good food.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">How It All Began</h2>
            <div className="prose prose-lg text-gray-700">
              <p className="mb-6">
                Founded in 2020, Manziz started as a small family-owned eatery with a simple mission: to serve delicious, authentic food made with love. 
                What began as a modest kitchen serving traditional recipes has blossomed into a beloved culinary destination, thanks to the unwavering 
                support of our community and our team's dedication to excellence.
              </p>
              <p>
                Today, we continue to honor our roots while embracing innovation, bringing you a dining experience that blends tradition with contemporary 
                culinary artistry. Every dish tells a story, and we invite you to be part of ours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Mission */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Target className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">Our Mission</h3>
              <p className="text-gray-700 text-center">
                To create exceptional dining experiences by serving authentic, high-quality food with warm hospitality, while fostering meaningful 
                connections within our community and supporting sustainable practices.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">Our Vision</h3>
              <p className="text-gray-700 text-center">
                To be the most cherished culinary destination in our region, known for our authentic flavors, innovative cuisine, and commitment to 
                creating memorable experiences that bring people together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-16 text-center text-gray-900">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <div 
                key={index} 
                className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-md">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-r from-amber-50 to-amber-100">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-16 text-center text-gray-900">Meet Our Team</h2>
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xl text-gray-700 mb-12">
              Behind every great meal is a team of passionate individuals dedicated to making your dining experience exceptional. 
              Our chefs, servers, and staff work together to bring you the best in food and hospitality.
            </p>
            <div className="bg-white inline-block px-8 py-3 rounded-full shadow-md hover:shadow-lg transition-shadow">
              <p className="text-amber-700 font-medium">Join Our Team →</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
