import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Flame, Compass } from 'lucide-react';
import { productService } from '../services/productService';
import { useChat } from '../context/ChatContext';
import ProductCard from '../components/common/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { quickAsk, openChat } = useChat();

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await productService.getProducts({ is_featured: true, limit: 8 });
        setFeaturedProducts(res.items || []);
      } catch (err) {
        console.error('Failed to load featured products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const categories = [
    {
      title: 'Jackets & Coats',
      image: 'https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=600&q=80',
      link: '/shop?category=Jackets%20%26%20Coats',
      subtitle: 'Tailored Wool & Technical Shells',
    },
    {
      title: 'Sweaters & Knits',
      image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=600&q=80',
      link: '/shop?category=Sweaters%20%26%20Knits',
      subtitle: '100% Mongolian Cashmere & Merino',
    },
    {
      title: 'Dresses',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80',
      link: '/shop?category=Dresses',
      subtitle: 'Charmeuse Silk & Pure Linen',
    },
    {
      title: 'Shirts & Tops',
      image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
      link: '/shop?category=Shirts%20%26%20Tops',
      subtitle: 'Egyptian Cotton & Oxford Poplin',
    },
  ];

  return (
    <div className="space-y-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-neutral-900 text-white py-24 sm:py-32">
        <div className="absolute inset-0 opacity-40 mix-blend-overlay">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1920&q=80"
            alt="Fashion Hero"
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase text-amber-300 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen AI Shopping Experience</span>
          </div>

          <h1 className="font-serif text-5xl sm:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-tight">
            Curated Elegance, Powered by Intelligence.
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-neutral-300 font-light">
            Discover garments tailored to your lifestyle. Chat with Aura—our Pydantic AI shopping stylist—to discover perfect fits, compare fabrics, and dress with confidence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/shop"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-neutral-950 font-medium rounded-full hover:bg-neutral-100 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              Explore Collection <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              onClick={openChat}
              className="w-full sm:w-auto px-8 py-3.5 bg-neutral-800/80 hover:bg-neutral-800 text-white font-medium rounded-full border border-neutral-700 backdrop-blur-sm transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Ask AI Personal Stylist
            </button>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase font-bold tracking-widest text-amber-700 mb-2">
              Curated Categories
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">
              Timeless Essentials
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-wider font-semibold text-neutral-900 hover:text-amber-800 flex items-center gap-1 mt-4 md:mt-0"
          >
            View all categories <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, idx) => (
            <Link
              key={idx}
              to={cat.link}
              className="group relative aspect-[4/5] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white">
                <p className="text-[11px] font-medium tracking-wide text-neutral-300 mb-1">
                  {cat.subtitle}
                </p>
                <h3 className="font-serif text-2xl font-bold tracking-wide group-hover:translate-x-1 transition-transform">
                  {cat.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* GenAI Stylist Interactive Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-amber-50 via-neutral-100 to-amber-100/50 p-8 sm:p-14 border border-amber-200/60 overflow-hidden shadow-sm">
          <div className="max-w-2xl relative z-10 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-amber-500/10 text-amber-900 px-3.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Natural Language Shopping Assistant</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight">
              Don&apos;t search with filters. Just tell Aura what you need.
            </h2>

            <p className="text-neutral-600 text-sm sm:text-base leading-relaxed">
              Powered by Pydantic AI and Groq LPU inference, Aura queries our real MongoDB database, applies budget thresholds, and explains every recommendation in conversation.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => quickAsk("Show me cozy wool coats for cold weather under $200")}
                className="text-xs bg-white text-neutral-800 px-3.5 py-2 rounded-full border border-neutral-300 hover:border-neutral-900 shadow-2xs transition-all font-medium"
              >
                &ldquo;Cozy wool coats under $200&rdquo;
              </button>
              <button
                onClick={() => quickAsk("Find breathable cotton shirts for office work")}
                className="text-xs bg-white text-neutral-800 px-3.5 py-2 rounded-full border border-neutral-300 hover:border-neutral-900 shadow-2xs transition-all font-medium"
              >
                &ldquo;Breathable cotton shirts for office&rdquo;
              </button>
              <button
                onClick={() => quickAsk("I need an elegant silk evening dress")}
                className="text-xs bg-white text-neutral-800 px-3.5 py-2 rounded-full border border-neutral-300 hover:border-neutral-900 shadow-2xs transition-all font-medium"
              >
                &ldquo;Silk evening dress for dinner party&rdquo;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-amber-700 text-xs uppercase font-bold tracking-widest mb-2">
              <Flame className="w-4 h-4" />
              <span>Trending Now</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-neutral-900">
              Featured Arrivals
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-xs uppercase tracking-wider font-semibold text-neutral-900 hover:text-amber-800 flex items-center gap-1 mt-4 md:mt-0"
          >
            Browse full catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading featured pieces..." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
