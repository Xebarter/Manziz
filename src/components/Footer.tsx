import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Phone, MapPin, Clock } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-brand-orange to-brand-red rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="text-2xl font-bold">Manziz</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Manziz is a fast foods brand that looks at getting smiles on everyone's face 
              just by a few tastes and scents that escape its dishes.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/manziz_rollandnosh?igsh=cGRpbmRpbGRiOWRo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-brand-orange transition-colors"
              >
                <Instagram className="w-6 h-6" />
              </a>
              <a
                href="https://x.com/ManzizRolex"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-brand-orange transition-colors"
              >
                <Twitter className="w-6 h-6" />
              </a>
              <a
                href="https://vm.tiktok.com/ZMSAfFJ9P/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-brand-orange transition-colors"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17C19.32 5.3 20.91 5.5 22.5 5.6v3.67c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/menu" className="text-gray-300 hover:text-brand-orange transition-colors">
                  Our Menu
                </Link>
              </li>
              <li>
                <Link to="/reservations" className="text-gray-300 hover:text-brand-orange transition-colors">
                  Reservations
                </Link>
              </li>
              <li>
                <Link to="/track" className="text-gray-300 hover:text-brand-orange transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-brand-orange transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-brand-orange" />
                <a 
                  href="tel:+256784811208"
                  className="text-gray-300 hover:text-brand-orange transition-colors"
                >
                  +256 784 811 208
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-brand-orange mt-1" />
                <span className="text-gray-300">
                  Children's Medical Center Area,<br />
                  Kampala, Uganda
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-brand-orange" />
                <span className="text-gray-300">
                  Mon - Sun: 8:00 AM - 10:00 PM
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">
            © 2024 Manziz. All rights reserved. Built with ❤️ for delicious experiences.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;