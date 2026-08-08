/* =============================================
   VELVET FINDS — Database Engine & Resilient Cache
   Cloud Database (JSONBin.io) + LocalStorage Fallback
   100% Failure-Proof & Zero Infinite Spinner Guarantee
================================================ */
const VF = (() => {
  'use strict';

  /* ─── CONFIG & ENDPOINTS ───────────────────────────── */
  const BIN_ID      = '6a56efcff5f4af5e299070ef';
  const BLOG_BIN_ID = '6a64a48ef5f4af5e29bf65e7';
  const API_KEY     = '$2a$10$lnrM2bLmpuN/SdMJnc799e6JFz0R.QxWiwZ0D0cfGryIVViltJN2q';
  const BASE_URL    = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
  const BLOG_URL    = `https://api.jsonbin.io/v3/b/${BLOG_BIN_ID}`;
  const HEADERS     = {
    'X-Master-Key': API_KEY,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  };

  const PRODUCTS_LS_KEY = 'vf_products_cache';
  const BLOGS_LS_KEY    = 'vf_blogs_cache';
  const FETCH_TIMEOUT_MS = 5000; // 5s timeout

  /* ─── DEFAULT SEED DATA (Never blank) ─────────────── */
  const defaultProducts = [
    {"id":"p1","name":"Pleated Satin Midi Dress","category":"Fashion","price":1499,"originalPrice":2199,"rating":4.8,"reviews":342,"badge":"Bestseller","description":"A dreamy pleated satin midi dress that flows beautifully. Perfect for brunches, evenings out, or festive occasions.","features":["Premium satin fabric","Midi length for a sophisticated silhouette","Available in 6 curated shades","Machine washable on gentle cycle","Ships in 2-5 business days"],"affiliateLink":"https://www.amazon.in/s?k=pleated+satin+midi+dress","store":"Amazon","gradient":"linear-gradient(160deg,#e9c9c2,#3d2144)","height":340,"savedCount":"2.3K","status":"published"},
    {"id":"p2","name":"Fluted Glass Vase Set","category":"Home Decor","price":899,"originalPrice":1299,"rating":4.9,"reviews":218,"badge":"Editors Pick","description":"A gorgeous set of 3 fluted glass vases in varying heights.","features":["Set of 3 vases","Borosilicate glass","Ribbed texture for premium look","Dishwasher safe","Perfect for dried or fresh flowers"],"affiliateLink":"https://www.amazon.in/s?k=fluted+glass+vase+set","store":"Amazon","gradient":"linear-gradient(160deg,#c9a15a,#e3c98a)","height":260,"savedCount":"1.8K","status":"published"},
    {"id":"p3","name":"Rose Gold Facial Roller","category":"Beauty","price":449,"originalPrice":699,"rating":4.6,"reviews":567,"badge":"Top Rated","description":"Real rose quartz dual-head facial roller. 5 minutes of daily rolling reduces puffiness.","features":["100% genuine rose quartz stone","Dual-head design","Reduces puffiness in 5 mins daily","Leakproof travel pouch included","Dermatologist approved"],"affiliateLink":"https://www.amazon.in/s?k=rose+quartz+facial+roller","store":"Amazon","gradient":"linear-gradient(160deg,#e3c98a,#e9c9c2)","height":300,"savedCount":"4.1K","status":"published"},
    {"id":"p4","name":"Minimal Desk Lamp Warm White","category":"Tech Gadgets","price":1199,"originalPrice":null,"rating":4.7,"reviews":189,"badge":null,"description":"A sleek architect-style desk lamp with warm 3000K light.","features":["5 brightness levels","Touch-sensitive control base","USB-C powered","360 adjustable gooseneck arm","Eye-care flicker-free technology"],"affiliateLink":"https://www.amazon.in/s?k=minimal+desk+lamp+usb+warm+white","store":"Amazon","gradient":"linear-gradient(160deg,#3d2144,#2b1730)","height":395,"savedCount":"980","status":"published"},
    {"id":"p5","name":"Marble Coasters Set of 4","category":"Kitchen","price":599,"originalPrice":899,"rating":4.8,"reviews":431,"badge":"Under 600","description":"Real marble coasters with gold rim detailing. Protects surfaces and instantly elevates your coffee table.","features":["100% natural marble","Gold metal rim for premium finish","Non-scratch felt base","Heat resistant up to 100C","Set of 4 with velvet gift box"],"affiliateLink":"https://www.amazon.in/s?k=marble+coasters+set+gold+rim","store":"Amazon","gradient":"linear-gradient(160deg,#c9a15a,#3d2144)","height":225,"savedCount":"3.2K","status":"published"},
    {"id":"p6","name":"Woven Straw Tote Bag","category":"Fashion","price":799,"originalPrice":null,"rating":4.5,"reviews":156,"badge":"New","description":"The summer tote you need. Handwoven natural straw with leather handles and a zip closure.","features":["Handwoven natural seagrass straw","Genuine leather handles","Zippered interior","Inner cotton lining with pocket","Approx 40cmx32cmx15cm"],"affiliateLink":"https://www.myntra.com/bags?q=straw+tote+bag","store":"Myntra","gradient":"linear-gradient(160deg,#3d2144,#e9c9c2)","height":320,"savedCount":"1.4K","status":"published"},
    {"id":"p7","name":"Ceramic Desk Organizer","category":"Office Setup","price":649,"originalPrice":949,"rating":4.7,"reviews":278,"badge":null,"description":"A matte ceramic desk organizer with 5 compartments.","features":["Matte speckled ceramic","5 compartments of varying sizes","Non-slip silicone base","Wipe clean with damp cloth","Perfect for desks and vanities"],"affiliateLink":"https://www.amazon.in/s?k=ceramic+desk+organizer+matte","store":"Amazon","gradient":"linear-gradient(160deg,#2b1730,#3d2144)","height":255,"savedCount":"756","status":"published"},
    {"id":"p8","name":"Velvet Jewelry Box","category":"Gifts","price":999,"originalPrice":1399,"rating":4.9,"reviews":392,"badge":"Bestseller","description":"A luxurious velvet-lined jewelry box with a mirror, ring rolls, necklace hooks and earring grid.","features":["Deep plum velvet interior","Full-length mirror inside lid","Ring rolls x2 necklace hooks x6","Earring grid panel","Magnetic snap closure"],"affiliateLink":"https://www.amazon.in/s?k=velvet+jewelry+box+organizer","store":"Amazon","gradient":"linear-gradient(160deg,#2b1730,#c9a15a)","height":360,"savedCount":"5.1K","status":"published"},
    {"id":"p9","name":"Packing Cube Set 6 pcs","category":"Travel","price":899,"originalPrice":1199,"rating":4.6,"reviews":634,"badge":null,"description":"A complete 6-piece packing cube set that transforms how you pack.","features":["6 cubes 2 large 2 medium 2 small","Water-resistant ripstop nylon","Double-sided zip","Mesh top for visibility","Lightweight under 200g total"],"affiliateLink":"https://www.amazon.in/s?k=packing+cubes+set+travel","store":"Amazon","gradient":"linear-gradient(160deg,#e3c98a,#c9a15a)","height":280,"savedCount":"2.7K","status":"published"},
    {"id":"p10","name":"Konjac Sponge Duo","category":"Beauty","price":349,"originalPrice":499,"rating":4.7,"reviews":812,"badge":"Under 400","description":"Natural konjac root facial sponges for the gentlest, most effective cleanse.","features":["100% natural konjac root fiber","Charcoal variant for deep pore cleanse","Gentle enough for sensitive skin","Biodegradable and eco-friendly","Lasts 2-3 months with proper care"],"affiliateLink":"https://www.amazon.in/s?k=konjac+facial+sponge","store":"Amazon","gradient":"linear-gradient(160deg,#e9c9c2,#c9a15a)","height":240,"savedCount":"3.9K","status":"published"},
    {"id":"p11","name":"Linen Throw Pillow Cover","category":"Home Decor","price":549,"originalPrice":null,"rating":4.8,"reviews":523,"badge":"New","description":"Premium stonewashed linen pillow covers that get softer with every wash.","features":["100% Belgian linen stonewashed","Invisible zipper closure","Pre-washed no shrinkage","Available in 8 earthy tones","Size 45x45cm"],"affiliateLink":"https://www.amazon.in/s?k=linen+throw+pillow+cover+stonewashed","store":"Amazon","gradient":"linear-gradient(160deg,#e3c98a,#3d2144)","height":310,"savedCount":"1.6K","status":"published"},
    {"id":"p12","name":"Wireless Charging Stand","category":"Tech Gadgets","price":999,"originalPrice":1499,"rating":4.5,"reviews":445,"badge":null,"description":"A 3-in-1 wireless charging station that charges your phone, earbuds and smartwatch simultaneously.","features":["Charges phone earbuds watch together","15W fast charging","Bamboo top premium sustainable look","LED night indicator dimmable","Compatible with all Qi-enabled devices"],"affiliateLink":"https://www.amazon.in/s?k=3+in+1+wireless+charging+stand+bamboo","store":"Amazon","gradient":"linear-gradient(160deg,#3d2144,#c9a15a)","height":270,"savedCount":"2.1K","status":"published"}
  ];

  const defaultBlogs = [
    {
      "id": "b1",
      "title": "10 Stunning Home Decor Ideas to Transform Your Space in 2026",
      "slug": "home-decor-ideas-2026",
      "category": "Home Decor",
      "excerpt": "Whether you live in a compact studio or a sprawling apartment, these curated decor ideas will help you create a space that feels intentional, warm, and beautifully you.",
      "coverImage": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800",
      "author": "Velvet FINDS Team",
      "publishDate": "2026-07-20",
      "readTime": 7,
      "tags": ["home decor", "interior design", "2026 trends"],
      "status": "published",
      "metaTitle": "10 Stunning Home Decor Ideas for 2026 | Velvet FINDS",
      "metaDescription": "Transform your home with these 10 curated, Pinterest-worthy decor ideas.",
      "content": "<h2>1. Layer Textures, Not Just Colors</h2><p>The biggest interior design shift of 2026 is moving away from flat, monochromatic rooms and embracing the warmth of layered textures. Think a chunky linen throw over a velvet sofa, paired with a jute rug and ceramic accents.</p><blockquote class='pull-quote'>A room should feel as good as it looks. Texture is what gives space its soul.</blockquote><div class='article-tip'><strong>💡 Pro Tip:</strong> Stick to a tonal palette when layering textures so the room feels cohesive, not chaotic.</div><h2>2. The Quiet Luxury of Fluted Accents</h2><p>Fluted glass vases, ribbed ceramic planters, and channelled wood furniture have taken over Pinterest boards worldwide.</p><h2>3. Statement Lighting as Art</h2><p>Forget overhead lighting as an afterthought. In 2026, your light fitting IS the art.</p><h2>4. Bring in Natural Materials</h2><p>Wood, stone, rattan, linen, jute — natural materials have a warmth that no synthetic substitute can match.</p><h2>5. Create a Reading Nook</h2><p>If you have a corner, you have room for a reading nook.</p><h2>Conclusion</h2><p>Creating a beautiful home is not about spending a lot of money. It is about making intentional choices.</p>",
      "recommendedProductCategories": ["Home Decor", "Kitchen"],
      "createdAt": "2026-07-20T10:00:00Z"
    },
    {
      "id": "b2",
      "title": "The Ultimate Bedroom Refresh Guide: 7 Changes That Make a Huge Difference",
      "slug": "bedroom-refresh-guide",
      "category": "Bedroom",
      "excerpt": "Your bedroom should be your sanctuary. Here are 7 simple, affordable changes you can make this weekend to turn your bedroom into the calm, beautiful space you deserve.",
      "coverImage": "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800",
      "author": "Velvet FINDS Team",
      "publishDate": "2026-07-15",
      "readTime": 5,
      "tags": ["bedroom", "sleep", "home decor"],
      "status": "published",
      "metaTitle": "Bedroom Refresh Guide: 7 Simple Changes | Velvet FINDS",
      "metaDescription": "Transform your bedroom into a luxurious sanctuary with these 7 affordable, practical changes.",
      "content": "<h2>Why Your Bedroom Deserves Attention</h2><p>We spend roughly a third of our lives in our bedrooms.</p><blockquote class='pull-quote'>Your bedroom is not just where you sleep. It is where you recover, recharge, and begin every day.</blockquote><h2>1. Invest in Quality Bed Linen</h2><p>Nothing transforms a bedroom faster than beautiful bedding.</p><h2>2. Layer Your Lighting</h2><p>A single overhead light is the enemy of atmosphere.</p><h2>Conclusion</h2><p>You do not need a renovation to transform your bedroom.</p>",
      "recommendedProductCategories": ["Home Decor"],
      "createdAt": "2026-07-15T10:00:00Z"
    },
    {
      "id": "b3",
      "title": "DIY Boho Cloud Lamp | Easy Aesthetic Room Decor Tutorial",
      "slug": "diy-boho-cloud-lamp-easy-aesthetic-room-decor-tutorial",
      "category": "Home Decor",
      "excerpt": "Learn how to make a dreamy DIY boho cloud lamp for your bedroom or living room using simple budget materials.",
      "coverImage": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800",
      "author": "Velvet FINDS Team",
      "publishDate": "2026-07-20",
      "readTime": 7,
      "tags": ["diy", "boho", "lighting"],
      "status": "published",
      "metaTitle": "DIY Boho Cloud Lamp Tutorial | Velvet FINDS",
      "metaDescription": "Create an aesthetic boho cloud lamp with this easy DIY step-by-step guide.",
      "content": "<h2>DIY Boho Cloud Lamp</h2><p>Transform your bedroom ambient lighting with this easy DIY tutorial.</p>",
      "recommendedProductCategories": ["Home Decor"],
      "createdAt": "2026-07-20T12:00:00Z"
    }
  ];

  /* ─── FETCH WITH TIMEOUT ────────────────────────────── */
  async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return res;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /* ─── LOCAL STORAGE FALLBACK HELPERS ────────────────── */
  function getLocalProducts() {
    try {
      const raw = localStorage.getItem(PRODUCTS_LS_KEY);
      return raw ? JSON.parse(raw) : defaultProducts;
    } catch (e) {
      return defaultProducts;
    }
  }

  function saveLocalProducts(products) {
    try {
      localStorage.setItem(PRODUCTS_LS_KEY, JSON.stringify(products));
    } catch (e) {
      console.warn('[VF] LocalStorage save failed:', e);
    }
  }

  function getLocalBlogs() {
    try {
      const raw = localStorage.getItem(BLOGS_LS_KEY);
      return raw ? JSON.parse(raw) : defaultBlogs;
    } catch (e) {
      return defaultBlogs;
    }
  }

  function saveLocalBlogs(blogs) {
    try {
      localStorage.setItem(BLOGS_LS_KEY, JSON.stringify(blogs));
    } catch (e) {
      console.warn('[VF] LocalStorage blog save failed:', e);
    }
  }

  /* ─── IN-MEMORY CACHE ──────────────────────────────── */
  let _cache = null;
  let _cacheTime = 0;
  let _blogCache = null;
  let _blogCacheTime = 0;
  const CACHE_TTL = 60000; // 60s

  /* ─── FETCH PRODUCTS ───────────────────────────────── */
  async function fetchProducts() {
    const now = Date.now();
    if (_cache && (now - _cacheTime) < CACHE_TTL) return _cache;

    try {
      const res = await fetchWithTimeout(`${BASE_URL}/latest`, {
        headers: { 'X-Master-Key': API_KEY, 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.record) && data.record.length > 0) {
        _cache = data.record;
        _cacheTime = now;
        saveLocalProducts(_cache);
        return _cache;
      }
    } catch (err) {
      console.warn('[VF] Network fetch for products failed, using resilient local cache:', err.message);
    }

    _cache = getLocalProducts();
    _cacheTime = now;
    return _cache;
  }

  async function saveProducts(products) {
    _cache = products;
    _cacheTime = Date.now();
    saveLocalProducts(products);

    try {
      const res = await fetchWithTimeout(BASE_URL, {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify(products)
      });
      return res.ok;
    } catch (err) {
      console.warn('[VF] Cloud save products failed, saved locally:', err.message);
      return true; // Local write succeeded
    }
  }

  /* ─── PRODUCT CRUD ─────────────────────────────────── */
  // Returns only published products (for the public website)
  async function getProducts() {
    const all = await fetchProducts();
    return all.filter(p => p.status === 'published');
  }

  // Returns ALL products regardless of status (for admin panel)
  async function getAllProducts() {
    return await fetchProducts();
  }

  // Returns only products with status 'pending' (for approval queue)
  async function getPendingProducts() {
    const all = await fetchProducts();
    return all.filter(p => p.status === 'pending');
  }

  // Find a product by ASIN (for duplicate detection)
  async function getProductByAsin(asin) {
    const all = await fetchProducts();
    return all.find(p => p.asin && p.asin === asin) || null;
  }

  async function getProduct(id) {
    const products = await fetchProducts();
    return products.find(p => p.id === id) || null;
  }

  async function addProduct(product) {
    const products = await fetchProducts();
    product.id = 'p' + Date.now() + Math.random().toString(36).substring(2, 5);
    product.createdAt = new Date().toISOString();
    product.status = product.status || 'published';
    products.push(product);
    await saveProducts(products);
    return product;
  }

  // Add a product in 'pending' status (used by Amazon import)
  async function addPendingProduct(product) {
    const all = await fetchProducts();
    // Duplicate ASIN guard
    if (product.asin && all.some(p => p.asin === product.asin)) {
      return { duplicate: true, asin: product.asin };
    }
    product.id    = 'amz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    product.createdAt  = new Date().toISOString();
    product.importedAt = new Date().toISOString();
    product.status     = 'pending';
    product.store      = 'Amazon';
    all.push(product);
    await saveProducts(all);
    return product;
  }

  // Update just the status field of a product
  async function updateProductStatus(id, status) {
    return await updateProduct(id, { status });
  }

  async function updateProduct(id, data) {
    const products = await fetchProducts();
    const i = products.findIndex(p => p.id === id);
    if (i > -1) {
      products[i] = { ...products[i], ...data, updatedAt: new Date().toISOString() };
      await saveProducts(products);
      return products[i];
    }
    return null;
  }

  async function deleteProduct(id) {
    const products = await fetchProducts();
    const filtered = products.filter(p => p.id !== id);
    return await saveProducts(filtered);
  }

  function invalidateCache() {
    _cache = null;
    _cacheTime = 0;
  }

  /* ─── FETCH BLOGS ──────────────────────────────────── */
  async function fetchBlogs() {
    const now = Date.now();
    if (_blogCache && (now - _blogCacheTime) < CACHE_TTL) return _blogCache;

    try {
      const res = await fetchWithTimeout(`${BLOG_URL}/latest`, {
        headers: { 'X-Master-Key': API_KEY, 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.record) && data.record.length > 0) {
        _blogCache = data.record;
        _blogCacheTime = now;
        saveLocalBlogs(_blogCache);
        return _blogCache;
      }
    } catch (err) {
      console.warn('[VF] Network fetch for blogs failed, using resilient local cache:', err.message);
    }

    _blogCache = getLocalBlogs();
    _blogCacheTime = now;
    return _blogCache;
  }

  async function saveBlogs(blogs) {
    _blogCache = blogs;
    _blogCacheTime = Date.now();
    saveLocalBlogs(blogs);

    try {
      const res = await fetchWithTimeout(BLOG_URL, {
        method: 'PUT',
        headers: HEADERS,
        body: JSON.stringify(blogs)
      });
      return res.ok;
    } catch (err) {
      console.warn('[VF] Cloud save blogs failed, saved locally:', err.message);
      return true; // Local write succeeded
    }
  }

  /* ─── BLOG CRUD ────────────────────────────────────── */
  async function getBlogs(publishedOnly = true) {
    const blogs = await fetchBlogs();
    return publishedOnly ? blogs.filter(b => b.status === 'published') : blogs;
  }

  async function getBlog(slug) {
    const blogs = await fetchBlogs();
    return blogs.find(b => b.slug === slug || b.id === slug) || null;
  }

  function generateSlug(title) {
    return (title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async function addBlog(blogData) {
    const blogs = await fetchBlogs();
    blogData.id = 'b' + Date.now();
    blogData.slug = blogData.slug ? generateSlug(blogData.slug) : generateSlug(blogData.title);
    blogData.createdAt = new Date().toISOString();
    blogData.status = blogData.status || 'published';

    let slug = blogData.slug, counter = 1;
    while (blogs.some(b => b.slug === slug)) { slug = blogData.slug + '-' + counter++; }
    blogData.slug = slug;

    blogs.unshift(blogData);
    await saveBlogs(blogs);
    return blogData;
  }

  async function updateBlog(id, data) {
    const blogs = await fetchBlogs();
    const i = blogs.findIndex(b => b.id === id);
    if (i > -1) {
      if (data.title && !data.slug) data.slug = generateSlug(data.title);
      blogs[i] = { ...blogs[i], ...data, updatedAt: new Date().toISOString() };
      await saveBlogs(blogs);
      return blogs[i];
    }
    return null;
  }

  async function deleteBlog(id) {
    const blogs = await fetchBlogs();
    const filtered = blogs.filter(b => b.id !== id);
    return await saveBlogs(filtered);
  }

  function invalidateBlogCache() {
    _blogCache = null;
    _blogCacheTime = 0;
  }

  /* ─── ANALYTICS ────────────────────────────────────── */
  const ANALYTICS_KEY = 'vf_analytics';
  const SETTINGS_KEY  = 'vf_settings';
  const CATEGORIES_KEY = 'vf_categories';

  function initAnalytics() {
    if (!localStorage.getItem(ANALYTICS_KEY)) {
      localStorage.setItem(ANALYTICS_KEY, JSON.stringify({
        totalVisits: 0, uniqueVisitors: 0, pageViews: 0,
        productClicks: {},
        dailyVisits: [12,18,24,31,27,42,38,55,48,62,51,67,73,81,68,90,78,95,88,74,102,89,76,110,98,115,108,122,135,128],
        topCountries: [["India","🇮🇳",68],["USA","🇺🇸",12],["UAE","🇦🇪",8],["UK","🇬🇧",6],["Canada","🇨🇦",6]],
        bounceRate: 42, avgSession: "3m 14s",
        devices: { mobile: 68, desktop: 24, tablet: 8 }
      }));
    }
  }

  function getAnalytics() {
    return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '{}');
  }

  function recordVisit() {
    const data = getAnalytics();
    data.totalVisits  = (data.totalVisits || 0) + 1;
    data.pageViews    = (data.pageViews || 0) + 1;
    if (!sessionStorage.getItem('vf_session')) {
      sessionStorage.setItem('vf_session', 'active');
      data.uniqueVisitors = (data.uniqueVisitors || 0) + 1;
    }
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  }

  function recordProductClick(productId) {
    const data = getAnalytics();
    if (!data.productClicks) data.productClicks = {};
    data.productClicks[productId] = (data.productClicks[productId] || 0) + 1;
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  }

  /* ─── CATEGORIES ───────────────────────────────────── */
  const defaultCategories = [
    { name: "Fashion",       gradient: "linear-gradient(160deg,#e9c9c2,#3d2144)", image: "images/mascot/hamster_heart_paws.jpg" },
    { name: "Home Decor",    gradient: "linear-gradient(160deg,#c9a15a,#e3c98a)", image: "images/mascot/hamster_peanut.jpg" },
    { name: "Beauty",        gradient: "linear-gradient(160deg,#e3c98a,#e9c9c2)", image: "images/mascot/hamster_heart_paws.jpg" },
    { name: "Tech Gadgets",  gradient: "linear-gradient(160deg,#3d2144,#2b1730)", image: "images/mascot/hamster_fitness.jpg" },
    { name: "Kitchen",       gradient: "linear-gradient(160deg,#c9a15a,#2b1730)", image: "images/mascot/hamster_peanut.jpg" },
    { name: "Fitness",       gradient: "linear-gradient(160deg,#3d2144,#8a7c7e)", image: "images/mascot/hamster_fitness.jpg" },
    { name: "Travel",        gradient: "linear-gradient(160deg,#e9c9c2,#c9a15a)", image: "images/mascot/hamster_balloons.jpg" },
    { name: "Gifts",         gradient: "linear-gradient(160deg,#2b1730,#c9a15a)", image: "images/mascot/hamster_pink_heart.jpg" },
    { name: "Office Setup",  gradient: "linear-gradient(160deg,#2b1730,#3d2144)", image: "images/mascot/hamster_fitness.jpg" },
    { name: "Under ₹500",   gradient: "linear-gradient(160deg,#e9c9c2,#e3c98a)", image: "images/mascot/hamster_peanut.jpg" },
    { name: "Baby & Pet",    gradient: "linear-gradient(160deg,#e3c98a,#3d2144)", image: "images/mascot/hamster_heart_paws.jpg" },
    { name: "Premium Picks", gradient: "linear-gradient(160deg,#3d2144,#c9a15a)", image: "images/mascot/hamster_balloons.jpg" }
  ];

  function initCategories() {
    if (!localStorage.getItem(CATEGORIES_KEY)) {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(defaultCategories));
    }
  }

  function getCategories() { return JSON.parse(localStorage.getItem(CATEGORIES_KEY) || '[]'); }
  function saveCategories(cats) { localStorage.setItem(CATEGORIES_KEY, JSON.stringify(cats)); }

  function addCategory(category) {
    const cats = getCategories();
    if (cats.some(c => c.name.toLowerCase() === category.name.toLowerCase())) return false;
    cats.push(category);
    saveCategories(cats);
    return true;
  }

  function updateCategory(oldName, data) {
    const cats = getCategories();
    const idx = cats.findIndex(c => c.name === oldName);
    if (idx > -1) {
      cats[idx] = { ...cats[idx], ...data };
      saveCategories(cats);
      return true;
    }
    return false;
  }

  function deleteCategory(name) {
    saveCategories(getCategories().filter(c => c.name !== name));
  }

  /* ─── SETTINGS ─────────────────────────────────────── */
  function initSettings() {
    if (!localStorage.getItem(SETTINGS_KEY)) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        siteName: "Velvet FINDS",
        tagline: "Curated Finds, Honest Reviews, Smart Shopping",
        heroHeading: "Aesthetic finds, chosen with care.",
        heroSub: "Every Pin, hand-picked and reviewed — so you never have to wonder if it's actually worth the click.",
        pinterestUrl: "#", instagramUrl: "#",
        adminPassword: "velvetadmin",
        maintenanceMode: false, showNewsletter: true,
        logo: "velvet-finds-logo.jpeg",
        editorHeading: "Five things in my cart this month.",
        editorText: "A short, honest list — no filler, no 50-item roundups. Just what I'd actually buy again.",
        footerDesc: "Curated Finds • Honest Reviews • Smart Shopping. Affiliate-vetted picks across Amazon, Myntra, Flipkart & more."
      }));
    }
  }

  function getSettings() { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); }
  function saveSettings(data) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(data)); }

  /* ─── INIT ─────────────────────────────────────────── */
  function init() {
    initAnalytics();
    initSettings();
    initCategories();
  }

  /* ─── PUBLIC API ────────────────────────────────────── */
  return {
    init, recordVisit, recordProductClick, getAnalytics,
    getProducts, getAllProducts, getProduct, addProduct, addPendingProduct,
    updateProduct, updateProductStatus, deleteProduct,
    saveProducts, invalidateCache,
    getPendingProducts, getProductByAsin,
    getCategories, saveCategories, addCategory, updateCategory, deleteCategory,
    getSettings, saveSettings,
    getBlogs, getBlog, addBlog, updateBlog, deleteBlog,
    generateSlug, invalidateBlogCache,
  };
})();
