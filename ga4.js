/**
 * GA4 Analytics Module — Velvet FINDS
 * Measurement ID: G-Z3ZLPVFSPJ
 * 
 * Tracks: page views, buy clicks, affiliate outbound clicks,
 * search usage, category filters, image clicks, scroll depth,
 * product views with custom dimensions.
 * 
 * Only fires in production (non-localhost) unless ?ga_debug=1 is set.
 */
(function () {
  'use strict';

  const GA_ID = 'G-Z3ZLPVFSPJ';

  /* ── Production check ───────────────────────── */
  const isLocal = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const debugMode = new URLSearchParams(location.search).has('ga_debug');

  if (isLocal && !debugMode) {
    console.log('[GA4] Skipped — running on localhost. Add ?ga_debug=1 to force.');
    // Still expose no-op helpers so inline onclick="" calls don't error
    window.gaTrack = function () {};
    return;
  }

  /* ── Load gtag.js ───────────────────────────── */
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_ID, {
    send_page_view: true,           // auto page_view
    enhanced_measurement: true      // Enhanced Measurement
  });

  console.log('[GA4] Loaded — Measurement ID:', GA_ID);

  /* ── Helper: send custom event ──────────────── */
  window.gaTrack = function (eventName, params) {
    if (typeof gtag === 'function') {
      gtag('event', eventName, params || {});
      console.log('[GA4] Event:', eventName, params || {});
    }
  };

  /* ── 1. Buy Now / Affiliate Click Tracking ──── */
  document.addEventListener('click', function (e) {
    const buyBtn = e.target.closest('.buy-btn, [id="mainBuyBtn"]');
    if (buyBtn) {
      const href = buyBtn.getAttribute('href') || '';
      const productName = document.querySelector('h1')?.textContent || '';
      const category = document.querySelector('.category')?.textContent || '';

      gaTrack('buy_now_click', {
        product_name: productName,
        category: category,
        affiliate_url: href,
        outbound: true
      });
    }

    /* ── 2. All outbound affiliate links ─────── */
    const link = e.target.closest('a[href]');
    if (link) {
      const href = link.getAttribute('href') || '';
      const isOutbound = /amazon\.|flipkart\.|myntra\.|amzn\.to|fkrt\.it/i.test(href);
      if (isOutbound) {
        gaTrack('outbound_affiliate_click', {
          url: href,
          link_text: link.textContent.trim().substring(0, 100)
        });
      }
    }
  });

  /* ── 3. Search Usage Tracking ───────────────── */
  let searchTimeout;
  document.addEventListener('input', function (e) {
    if (e.target.id === 'searchBox' || e.target.closest('#searchOverlay')) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(function () {
        const q = e.target.value.trim();
        if (q.length >= 2) {
          gaTrack('search', { search_term: q });
        }
      }, 800);       // debounce 800ms
    }
  });

  /* ── 4. Category Filter Tracking ────────────── */
  document.addEventListener('click', function (e) {
    const filterBtn = e.target.closest('.filter-btn');
    if (filterBtn) {
      gaTrack('category_filter', {
        category: filterBtn.getAttribute('data-cat') || filterBtn.textContent.trim()
      });
    }

    const catCard = e.target.closest('.cat-card');
    if (catCard) {
      const catName = catCard.querySelector('span')?.textContent || '';
      gaTrack('category_click', { category: catName });
    }
  });

  /* ── 5. Product Card Click / Image Click ────── */
  document.addEventListener('click', function (e) {
    const card = e.target.closest('.pin-card');
    if (card) {
      const name = card.querySelector('.pin-title')?.textContent || '';
      const cat = card.querySelector('.pin-cat')?.textContent || '';
      const id = card.getAttribute('data-id') || '';
      gaTrack('product_card_click', {
        product_name: name,
        category: cat,
        item_id: id
      });
    }

    /* Image clicks inside product page */
    const img = e.target.closest('.product-visual img, .pin-media img');
    if (img) {
      gaTrack('image_click', {
        image_src: img.getAttribute('src')?.substring(0, 200) || '',
        alt_text: img.getAttribute('alt') || ''
      });
    }
  });

  /* ── 6. Scroll Depth Tracking ───────────────── */
  const scrollMilestones = { 25: false, 50: false, 75: false, 100: false };

  function checkScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight <= 0) return;
    const pct = Math.round((scrollTop / docHeight) * 100);

    [25, 50, 75, 100].forEach(function (milestone) {
      if (pct >= milestone && !scrollMilestones[milestone]) {
        scrollMilestones[milestone] = true;
        gaTrack('scroll_depth', {
          percent_scrolled: milestone,
          page_path: location.pathname
        });
      }
    });
  }

  let scrollTick = false;
  window.addEventListener('scroll', function () {
    if (!scrollTick) {
      requestAnimationFrame(function () {
        checkScroll();
        scrollTick = false;
      });
      scrollTick = true;
    }
  }, { passive: true });

  /* ── 7. Product View (fires on product.html) ── */
  if (location.pathname.includes('product.html')) {
    function trackProductView() {
      setTimeout(function () {
        const name = document.querySelector('h1')?.textContent || '';
        const category = document.querySelector('.category')?.textContent || '';
        const price = document.querySelector('.product-price')?.textContent?.match(/₹[\d,]+/)?.[0] || '';
        const id = new URLSearchParams(location.search).get('id') || '';

        if (name) {
          gaTrack('view_item', {
            product_name: name,
            category: category,
            price: price,
            item_id: id
          });
        }
      }, 500);    // wait for dynamic render
    }

    // defer scripts run after DOMContentLoaded, so fire immediately
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', trackProductView);
    } else {
      trackProductView();
    }
  }

})();
