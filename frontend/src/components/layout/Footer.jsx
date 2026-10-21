import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-neutral-900 text-neutral-300 pt-16 pb-12 mt-20 border-t border-neutral-800">
      {/* Value Propositions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-neutral-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          <div className="flex items-center space-x-3 justify-center md:justify-start">
            <Sparkles className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="text-white font-medium text-sm">GenAI Personal Stylist</h4>
              <p className="text-xs text-neutral-400">Pydantic AI & Groq shopping assistant</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 justify-center md:justify-start">
            <Truck className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="text-white font-medium text-sm">Free Express Shipping</h4>
              <p className="text-xs text-neutral-400">On all orders over $100</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 justify-center md:justify-start">
            <RefreshCw className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="text-white font-medium text-sm">Effortless Returns</h4>
              <p className="text-xs text-neutral-400">30-day seamless exchange window</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 justify-center md:justify-start">
            <ShieldCheck className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="text-white font-medium text-sm">Authenticity Guaranteed</h4>
              <p className="text-xs text-neutral-400">Ethically sourced premium fabrics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation links & Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-3">
          <span className="font-serif text-lg text-white font-bold tracking-wider">AURA</span>
          <span>&copy; {new Date().getFullYear()} AURA Clothing Boutique. Built with FastAPI, MongoDB, Pydantic AI & React.</span>
        </div>
        <div className="flex space-x-6">
          <Link to="/shop" className="hover:text-white transition-colors">Catalog</Link>
          <Link to="/orders" className="hover:text-white transition-colors">My Orders</Link>
          <Link to="/admin" className="hover:text-white transition-colors">Admin Portal</Link>
          <a href="/docs" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">FastAPI Docs</a>
        </div>
      </div>
    </footer>
  );
}
