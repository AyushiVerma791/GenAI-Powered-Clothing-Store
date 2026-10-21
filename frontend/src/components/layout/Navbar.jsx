import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Sparkles, User, Search, Menu, X, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useChat } from '../../context/ChatContext';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const { toggleChat, isOpen } = useChat();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?query=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu trigger */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-neutral-700 hover:text-neutral-900 p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Brand Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-baseline space-x-2">
              <span className="font-serif text-3xl font-bold tracking-widest text-neutral-900 uppercase">
                AURA
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                GenAI
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              to="/"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 tracking-wide uppercase transition-colors"
            >
              Home
            </Link>
            <Link
              to="/shop"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 tracking-wide uppercase transition-colors"
            >
              All Collections
            </Link>
            <Link
              to="/shop?category=Jackets%20%26%20Coats"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 tracking-wide uppercase transition-colors"
            >
              Outerwear
            </Link>
            <Link
              to="/shop?category=Sweaters%20%26%20Knits"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 tracking-wide uppercase transition-colors"
            >
              Knitwear
            </Link>
            <Link
              to="/shop?category=Dresses"
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 tracking-wide uppercase transition-colors"
            >
              Dresses
            </Link>
          </nav>

          {/* Right Action Icons & Search */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex relative items-center">
              <input
                type="text"
                placeholder="Search styles, wool, coats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-64 pl-9 pr-4 py-1.5 text-xs bg-neutral-100 rounded-full focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white transition-all"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
            </form>

            {/* AI Assistant Button */}
            <button
              onClick={toggleChat}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
                isOpen
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">Ask Aura AI</span>
            </button>

            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2 text-neutral-700 hover:text-neutral-900 transition-colors"
              title="Shopping Bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-amber-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="p-2 text-neutral-700 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
                title="Account"
              >
                <User className="w-5 h-5" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 border border-neutral-100 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="text-xs font-semibold text-neutral-900 truncate">
                          {user.full_name}
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/orders"
                        className="block px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 font-medium"
                      >
                        Order History
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-xs text-amber-700 hover:bg-amber-50 font-semibold"
                        >
                          <Shield className="w-3.5 h-3.5 mr-1.5" />
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-medium border-t border-neutral-100 mt-1"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 font-medium"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-50 font-medium"
                      >
                        Create Account
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-100 bg-white px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative mb-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-neutral-100 rounded-lg focus:outline-none"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3 pointer-events-none" />
          </form>
          <div className="flex flex-col space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 py-2 border-b border-neutral-50"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 py-2 border-b border-neutral-50"
            >
              All Collections
            </Link>
            <Link
              to="/shop?category=Jackets%20%26%20Coats"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 py-2 border-b border-neutral-50"
            >
              Jackets & Coats
            </Link>
            <Link
              to="/shop?category=Dresses"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900 py-2 border-b border-neutral-50"
            >
              Dresses
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-semibold text-amber-700 py-2"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
