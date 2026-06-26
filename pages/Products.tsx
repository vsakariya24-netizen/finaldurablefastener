// Products.tsx
import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { 
  Search, ChevronDown, ChevronRight, 
  ArrowRight, LayoutGrid, ShoppingBag, Sparkles
} from 'lucide-react';

// ============================================================
// ✅ CACHE HELPER — Saves data in localStorage with expiry
// ============================================================
const CACHE_TTL_LONG  = 60 * 60 * 1000;  // 1 hour  — for categories (rarely change)
const CACHE_TTL_SHORT = 10 * 60 * 1000;  // 10 mins — for products

function getCached<T>(key: string): T | null {
  try {
    const raw  = localStorage.getItem(`sb_${key}`);
    const time = localStorage.getItem(`sb_${key}_time`);
    if (!raw || !time) return null;

    const age = Date.now() - Number(time);
    const ttl = key.startsWith('categories') ? CACHE_TTL_LONG : CACHE_TTL_SHORT;

    if (age > ttl) {
      // Cache expired — remove it
      localStorage.removeItem(`sb_${key}`);
      localStorage.removeItem(`sb_${key}_time`);
      return null;
    }
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setCache(key: string, data: any) {
  try {
    localStorage.setItem(`sb_${key}`, JSON.stringify(data));
    localStorage.setItem(`sb_${key}_time`, String(Date.now()));
  } catch (e) {
    console.warn('Cache write failed:', e);
  }
}
// ============================================================

// --- HELPER: Slugify ---
const toSlug = (text: string) => {
  if (!text) return '';
  return text.toLowerCase().trim().replace(/[\s/]+/g, '-');
};

// --- HELPER: Un-Slugify ---
const fromSlug = (slug: string) => {
  if (!slug) return '';
  return slug.replace(/-/g, ' ').toLowerCase();
};

// =========================================
// SMART IMAGE URL HELPER
// =========================================
const cleanImageUrl = (url: string): string => {
  if (!url || typeof url !== 'string') return '';
  
  const R2_BASE = "https://pub-ffd0eb07a99540ac95c35c521dd8f7ae.r2.dev";
  
  // Already R2 → return as-is
  if (url.startsWith(R2_BASE)) return url;
  
  // ANY full URL (workers.dev, supabase.co, etc.)
  // → extract just the filename → redirect to R2
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const fileName = url.split('/').pop(); 
    return `${R2_BASE}/${fileName}`;
  }
  
  // Relative path → prepend R2
  const cleanPath = url.startsWith('/') ? url.slice(1) : url;
  return `${R2_BASE}/${cleanPath}`;
};

const Products: React.FC = () => {
  const { category: urlCategory, subcategory: urlSubCategory } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // STATE
  const [activeFilter, setActiveFilter] = useState<{ type: string; value: string; name: string }>({ 
    type: 'ALL', 
    value: '', 
    name: 'All Products' 
  });

  const [expandedCats, setExpandedCats]   = useState<string[]>([]);
  const [categoryTree, setCategoryTree]   = useState<any[]>([]);
  const [products, setProducts]           = useState<any[]>([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');

  // -------------------------------------------
  // STEP 0: LEGACY REDIRECT
  // -------------------------------------------
  useEffect(() => {
    const queryCat = searchParams.get('category');
    if (queryCat && !urlCategory) {
      navigate(`/products/${toSlug(queryCat)}`, { replace: true });
    }
  }, [searchParams, urlCategory, navigate]);


  // -------------------------------------------
  // STEP 1: LOAD CATEGORIES  ✅ WITH CACHE
  // -------------------------------------------
  useEffect(() => {
    const fetchCategories = async () => {
      // 1️⃣ Try cache first
      const cached = getCached<any[]>('categories_tree');
      if (cached) {
        console.log('✅ Categories loaded from cache');
        setCategoryTree(cached);
        return; // ← No Supabase query needed!
      }

      // 2️⃣ Cache miss → fetch from Supabase
      console.log('🔄 Fetching categories from Supabase...');
      const [cats, subs] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('sub_categories').select('*').order('name')
      ]);

      const tree = cats.data?.map(cat => ({
        ...cat,
        sub_categories: subs.data?.filter(s => s.category_id === cat.id) || []
      })) || [];

      // 3️⃣ Save to cache for next time
      setCache('categories_tree', tree);
      setCategoryTree(tree);
    };

    fetchCategories();
  }, []);

  // -------------------------------------------
  // STEP 2: SET FILTER FROM URL (SMART MATCHING)
  // -------------------------------------------
  useEffect(() => {
    if (categoryTree.length === 0) return;

    if (urlCategory) {
      const cleanUrlCat = fromSlug(urlCategory);

      let matchedCat = categoryTree.find(c => c.name.toLowerCase().trim() === cleanUrlCat);
      if (!matchedCat) {
        matchedCat = categoryTree.find(c => 
          c.name.toLowerCase().includes(cleanUrlCat) || 
          cleanUrlCat.includes(c.name.toLowerCase())
        );
      }

      if (matchedCat) {
        const correctCatSlug = toSlug(matchedCat.name);
        let matchedSub = null;
        let correctSubSlug = "";

        if (urlSubCategory) {
          const cleanUrlSub = fromSlug(urlSubCategory);
          matchedSub = matchedCat.sub_categories.find((s: any) => 
            s.name.toLowerCase().trim() === cleanUrlSub ||
            s.name.toLowerCase().includes(cleanUrlSub)
          );
          if (matchedSub) correctSubSlug = toSlug(matchedSub.name);
        }

        const isCatMismatch = urlCategory !== correctCatSlug;
        const isSubMismatch = urlSubCategory && matchedSub && urlSubCategory !== correctSubSlug;

        if (isCatMismatch || isSubMismatch) {
          const targetPath = matchedSub 
            ? `/products/${correctCatSlug}/${correctSubSlug}` 
            : `/products/${correctCatSlug}`;
          navigate(targetPath, { replace: true });
          return;
        }

        let newFilter = { type: 'CATEGORY', value: matchedCat.name, name: matchedCat.name };
        if (matchedSub) {
          newFilter = { type: 'SUB_CATEGORY', value: matchedSub.id, name: matchedSub.name };
        }

        setActiveFilter(newFilter);
        setExpandedCats(prev => prev.includes(matchedCat.id) ? prev : [...prev, matchedCat.id]);
        
      } else {
        console.warn("Category mismatch:", urlCategory);
        setActiveFilter({ type: 'ALL', value: '', name: 'All Products' });
      }
    } else {
      setActiveFilter({ type: 'ALL', value: '', name: 'All Products' });
    }
  }, [urlCategory, urlSubCategory, categoryTree, navigate]);

  // -------------------------------------------
  // STEP 3: FETCH PRODUCTS 
  // -------------------------------------------
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const cacheKey = `products_v2_${activeFilter.type}_${activeFilter.value}_${searchTerm}`;

        let query = supabase
          .from('products')
          .select('*')
          .order('position', { ascending: true });

        // FILTERING
        if (activeFilter.type === 'CATEGORY') {
          query = query.ilike('category', activeFilter.value); 
        } else if (activeFilter.type === 'SUB_CATEGORY') {
          query = query.eq('sub_category', activeFilter.value); 
        }

        if (searchTerm) {
          query = query.ilike('name', `%${searchTerm}%`);
        }

        const { data } = await query;
        if (data) {
          setProducts(data);
        }
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [activeFilter, searchTerm]);

  // -------------------------------------------
  // UI HANDLERS
  // -------------------------------------------
  const toggleCategory = (catId: string) => {
    setExpandedCats(prev => 
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const handleMainCategoryClick = (catName: string) => {
    navigate(`/products/${toSlug(catName)}`);
  };

  const handleSubCategoryClick = (catName: string, subId: string, subName: string) => {
    navigate(`/products/${toSlug(catName)}/${toSlug(subName)}`);
  };

  const resetFilter = () => {
    navigate('/products');
    setSearchTerm('');
  };

  // Animations
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="bg-[#dbdbdc] min-h-screen pt-20">
      
      <Helmet>
       <title>
    {activeFilter.name === 'All Products'
      ? 'Top Screw Manufacturer in Rajkot | Industrial Fasteners India'
      : `${activeFilter.name} Manufacturers in India | Durable Fastener`}
  </title>
         <link
    rel="canonical"
    href={
      activeFilter.name === 'All Products'
        ? 'https://durablefastener.com/products'
        : `https://durablefastener.com/products/${toSlug(activeFilter.name)}`
    }
  />
         <meta
    name="description"
    content={
      activeFilter.name === 'All Products'
        ? 'Leading Industrial Fastener manufacturer in Rajkot, Gujarat. Screws, bolts, anchors and fittings for construction, furniture and engineering industries.'
        : `Leading ${activeFilter.name} manufacturer in Rajkot. High-quality industrial fasteners for bulk orders. ISO certified factory in Gujarat, India.`
    }
  />

<script type="application/ld+json">{JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": activeFilter.name === 'All Products' ? 'Industrial Fasteners Catalog' : activeFilter.name,
    "url": activeFilter.name === 'All Products'
      ? 'https://durablefastener.com/products'
      : `https://durablefastener.com/products/${toSlug(activeFilter.name)}`,
    "provider": {
      "@type": "Organization",
      "name": "Durable Fastener Pvt. Ltd.",
      "url": "https://durablefastener.com"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://durablefastener.com" },
        { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://durablefastener.com/products" },
        ...(activeFilter.name !== 'All Products' ? [{
          "@type": "ListItem",
          "position": 3,
          "name": activeFilter.name,
          "item": `https://durablefastener.com/products/${toSlug(activeFilter.name)}`
        }] : [])
      ]
    }
  })}</script>
</Helmet>
      {/* HERO */}
      <section className="relative h-[30vh] flex items-center justify-center bg-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#fbbf24 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
        </div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center px-4"
        >
          <span className="inline-flex items-center gap-2 text-yellow-500 font-bold text-xs uppercase tracking-[0.3em] mb-4">
            <Sparkles size={14} /> Elite Hardware
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-2 tracking-tighter">
            {activeFilter.name}
          </h1>
        </motion.div>
      </section>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* SIDEBAR */}
          <aside className="lg:w-[300px] shrink-0">
            <div className="sticky top-32 space-y-6">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full bg-white border-2 border-zinc-100 rounded-xl px-10 py-3 text-sm focus:border-yellow-400 focus:ring-0 shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              </div>

              {/* Filters */}
              <div className="bg-white rounded-2xl p-5 shadow-lg border border-zinc-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-black text-zinc-900 uppercase tracking-wide">Filters</h3>
                  {activeFilter.type !== 'ALL' && (
                    <button onClick={resetFilter} className="text-xs text-red-500 font-bold hover:underline">Reset</button>
                  )}
                </div>

                <div className="space-y-1">
                  <button
                    onClick={resetFilter}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${activeFilter.type === 'ALL' ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-50 text-zinc-600'}`}
                  >
                    <LayoutGrid size={16} /> All Products
                  </button>

                  {categoryTree.map((cat) => {
                    const isActiveCat = activeFilter.value === cat.name || (activeFilter.type === 'SUB_CATEGORY' && expandedCats.includes(cat.id));
                    const isExpanded = expandedCats.includes(cat.id);

                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className={`flex items-center justify-between group rounded-lg px-3 py-2 transition-colors ${isActiveCat ? 'bg-yellow-50' : 'hover:bg-zinc-50'}`}>
                           <button 
                             onClick={() => handleMainCategoryClick(cat.name)}
                             className={`flex-1 text-left text-sm font-bold ${isActiveCat ? 'text-yellow-700' : 'text-zinc-700'}`}
                           >
                             {cat.name}
                           </button>
                           {cat.sub_categories.length > 0 && (
                             <button onClick={(e) => { e.stopPropagation(); toggleCategory(cat.id); }} className="p-1 hover:bg-zinc-200 rounded">
                                <ChevronDown size={14} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}/>
                             </button>
                           )}
                        </div>

                        <AnimatePresence>
                          {isExpanded && cat.sub_categories.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="ml-4 pl-4 border-l-2 border-zinc-100 py-1 space-y-1">
                                {cat.sub_categories.map((sub: any) => {
                                  const isActiveSub = activeFilter.type === 'SUB_CATEGORY' && activeFilter.value === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      onClick={() => handleSubCategoryClick(cat.name, sub.id, sub.name)}
                                      className={`w-full text-left text-xs py-2 px-2 rounded-md transition-colors font-medium flex items-center justify-between ${isActiveSub ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'}`}
                                    >
                                      {sub.name}
                                      {isActiveSub && <ChevronRight size={12}/>}
                                    </button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN GRID */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-zinc-500 font-medium text-xs">
                Showing <strong className="text-black">{products.length}</strong> results
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                  <div key={i} className="h-[250px] bg-white/50 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-zinc-200">
                <h3 className="text-xl font-bold text-zinc-400">No products found</h3>
                <button onClick={resetFilter} className="mt-4 text-sm text-blue-600 font-bold underline">Clear Filters</button>
              </div>
            ) : (
              <motion.div 
                variants={containerVars}
                initial="hidden"
                animate="show"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4"
              >
                <AnimatePresence mode='wait'>
                  {products.map((product) => (
                    <motion.div 
                      layout
                      variants={itemVars}
                      key={product.id}
                      className="group bg-white rounded-xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
                    >
                      <Link to={`/product/${product.slug}`} className="flex flex-col h-full">
                        <div className="relative aspect-square bg-[#f8f8f8] flex items-center justify-center p-4 md:p-0 overflow-hidden">
                          {product.images && product.images[0] ? (
                            <img 
                              src={cleanImageUrl(product.images[0])} 
                              alt={product.name}
                              loading="lazy"
                              className="max-w-full max-h-full w-auto h-auto object-contain group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="text-zinc-300 text-[10px] font-bold uppercase">No Image</div>
                          )}
                        </div>
                        <div className="p-3 flex flex-col flex-grow bg-white">
                          <span className="inline-block text-[9px] font-bold text-yellow-600 uppercase tracking-wider mb-1">
                            {product.category}
                          </span>
                          <h3 className="text-xs md:text-sm font-bold text-zinc-900 leading-snug group-hover:text-yellow-600 transition-colors line-clamp-2 mb-2">
                            {product.name}
                          </h3>
                          <div className="mt-auto flex items-center justify-between border-t border-zinc-50 pt-2">
                            <span className="text-[10px] font-semibold text-green-600 flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> In Stock
                            </span>
                            <ArrowRight size={12} className="text-zinc-300 group-hover:text-yellow-600 group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;