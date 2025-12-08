import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiInstagram, FiFacebook, FiTwitter } from 'react-icons/fi';
import logoApp from '../../assets/logo-app.png';


const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src={logoApp} 
                alt="SelempangKu Logo" 
                className="h-8 w-8 object-cover"
              />
              <span className="font-bold text-xl text-white">SelempangKu</span>
            </div>
            <p className="text-sm mb-4">
              Pusat pemesanan selempang berkualitas untuk berbagai keperluan.
              Wisuda, perpisahan, dan custom design sesuai kebutuhan Anda.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-primary-500 transition-colors">
                <FiInstagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary-500 transition-colors">
                <FiFacebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-primary-500 transition-colors">
                <FiTwitter className="h-5 w-5" />
              </a>
            </div>
          </div>


          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Menu</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm hover:text-primary-500 transition-colors">
                  Beranda
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="text-sm hover:text-primary-500 transition-colors">
                  Katalog
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm hover:text-primary-500 transition-colors">
                  Daftar
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm hover:text-primary-500 transition-colors">
                  Masuk
                </Link>
              </li>
            </ul>
          </div>


          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Kontak</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-sm">
                <FiMapPin className="h-4 w-4 text-primary-500" />
                <span>Jl. Contoh No. 123, Jakarta</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <FiPhone className="h-4 w-4 text-primary-500" />
                <span>+62 812-3456-7890</span>
              </li>
              <li className="flex items-center space-x-2 text-sm">
                <FiMail className="h-4 w-4 text-primary-500" />
                <span>info@selempangku.com</span>
              </li>
            </ul>
          </div>
        </div>


        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} SelempangKu. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};


export default Footer;
