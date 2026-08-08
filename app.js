document.addEventListener("DOMContentLoaded", () => {

  // =====================
  // 1. THEME TOGGLE
  // =====================
  const html = document.documentElement;
  const themeBtn = document.getElementById('themeToggle');

  // Default: dark mode
  html.removeAttribute('data-theme');

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isLight = html.getAttribute('data-theme') === 'light';
      if (isLight) {
        html.removeAttribute('data-theme');
        themeBtn.textContent = '☀️';
      } else {
        html.setAttribute('data-theme', 'light');
        themeBtn.textContent = '🌙';
      }
    });
  }

  // =====================
  // 2. CATEGORIES
  // =====================
  const categories = [
    ["Fashion",       "linear-gradient(160deg,#e9c9c2,#3d2144)"],
    ["Home Decor",    "linear-gradient(160deg,#d4af37,#3d2144)"],
    ["Beauty",        "linear-gradient(160deg,#f3e7cc,#e9c9c2)"],
    ["Tech Gadgets",  "linear-gradient(160deg,#3d2144,#2b1730)"],
    ["Kitchen",       "linear-gradient(160deg,#d4af37,#2b1730)"],
    ["Fitness",       "linear-gradient(160deg,#3d2144,#5a4050)"],
    ["Travel",        "linear-gradient(160deg,#e9c9c2,#d4af37)"],
    ["Baby & Pet",    "linear-gradient(160deg,#f3e7cc,#3d2144)"],
    ["Office Setup",  "linear-gradient(160deg,#2b1730,#3d2144)"],
    ["Gifts",         "linear-gradient(160deg,#d4af37,#f3e7cc)"],
    ["Under ₹500",    "linear-gradient(160deg,#3d2144,#e9c9c2)"],
    ["Premium Picks", "linear-gradient(160deg,#2b1730,#d4af37)"],
  ];

  const catGrid = document.getElementById('catGrid');
  if (catGrid) {
    categories.forEach(([name, grad]) => {
      const card = document.createElement('div');
      card.className = 'cat-card';
      card.innerHTML = `
        <div class="cat-swatch" style="background:${grad}">${name.charAt(0)}</div>
        <span>${name}</span>`;
      catGrid.appendChild(card);
    });
  }

  // =====================
  // 3. MASONRY INFINITE SCROLL
  // =====================
  const baseProducts = [
    ["Fashion",    "Pleated Satin Midi Dress",        1499, 2199, 4.8, "linear-gradient(160deg,#e9c9c2,#552d5e)", 340],
    ["Home Decor", "Fluted Glass Vase Set",            899, 1299, 4.9, "linear-gradient(160deg,#d4af37,#f3e7cc)", 260],
    ["Beauty",     "Rose Gold Facial Roller",           449,  699, 4.6, "linear-gradient(160deg,#f3e7cc,#e9c9c2)", 300],
    ["Tech",       "Minimal Desk Lamp – Warm White",  1199, null, 4.7, "linear-gradient(160deg,#3d2144,#2b1730)", 390],
    ["Kitchen",    "Marble Coasters, Set of 4",         599,  899, 4.8, "linear-gradient(160deg,#d4af37,#3d2144)", 230],
    ["Fashion",    "Woven Straw Tote Bag",              799, null, 4.5, "linear-gradient(160deg,#3d2144,#e9c9c2)", 320],
    ["Office",     "Ceramic Desk Organizer",            649,  949, 4.7, "linear-gradient(160deg,#2b1730,#3d2144)", 260],
    ["Gifts",      "Velvet Jewelry Box",                999, 1399, 4.9, "linear-gradient(160deg,#2b1730,#d4af37)", 360],
    ["Travel",     "Packing Cube Set – 6 pcs",          899, 1199, 4.6, "linear-gradient(160deg,#f3e7cc,#d4af37)", 280],
    ["Beauty",     "Konjac Sponge Duo",                 349,  499, 4.7, "linear-gradient(160deg,#e9c9c2,#d4af37)", 240],
    ["Home Decor", "Linen Throw Pillow Cover",          549, null, 4.8, "linear-gradient(160deg,#f3e7cc,#3d2144)", 310],
    ["Tech",       "Wireless Charging Stand",           999, 1499, 4.5, "linear-gradient(160deg,#3d2144,#d4af37)", 270],
  ];

  const feed   = document.getElementById('feed');
  const loader = document.getElementById('feedLoader');
  let batch    = 0;
  const MAX_BATCHES = 6;

  function renderBatch() {
    const frag = document.createDocumentFragment();
    baseProducts.forEach(([cat, title, price, was, rating, grad, h], i) => {
      const card = document.createElement('div');
      card.className = 'pin-card';
      // staggered animation per card
      card.style.animationDelay = (i * 0.05) + 's';

      card.innerHTML = `
        <div class="pin-media" style="background:${grad}; height:${h}px;">
          <span class="save-btn">📌 Save</span>
        </div>
        <div class="pin-body">
          <div class="pin-cat">${cat}</div>
          <div class="pin-title">${title}</div>
          <div class="pin-meta">
            <span class="stars">★★★★★ <span style="color:var(--ink-soft); font-weight:600;">${rating}</span></span>
            <span class="price">
              ${was ? `<span class="was">₹${was}</span>` : ''}₹${price}
            </span>
          </div>
        </div>`;
      frag.appendChild(card);
    });
    feed.appendChild(frag);
    batch++;

    if (batch >= MAX_BATCHES) {
      loader.innerHTML = `<span style="color:var(--gold-500); font-size:18px;">✦</span> You've reached the end — for now`;
      observer.disconnect();
    }
  }

  // Initial load
  if (feed) renderBatch();

  // IntersectionObserver for infinite scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && batch < MAX_BATCHES) {
        setTimeout(renderBatch, 450);
      }
    });
  }, { rootMargin: '400px' });

  if (loader) observer.observe(loader);

  // =====================
  // 4. ANIMATED SVG SQUIGGLE PATH TRACER
  // =====================
  const path = document.getElementById('squigglePath');
  if (path) {
    const length = path.getTotalLength();
    path.style.strokeDasharray  = length;
    path.style.strokeDashoffset = length;

    // Animate after short delay
    setTimeout(() => {
      path.style.transition = 'stroke-dashoffset 2.8s cubic-bezier(0.16, 1, 0.3, 1)';
      path.style.strokeDashoffset = '0';
    }, 400);
  }

});
