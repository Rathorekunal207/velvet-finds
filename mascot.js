/* ====================================================
   VELVET FINDS — Interactive Mascot & Image Animation
   Subtle, lifelike mascot movement (blinking, breathing,
   mouse tracking parallax & category image assignment)
===================================================== */
const VelvetMascot = (() => {
  'use strict';

  // Category & Page Mascot Preset Registry
  const mascotRegistry = {
    'home': {
      image: 'images/mascot/hamster_balloons.jpg',
      alt: 'Velvet FINDS Floating Hamster Mascot with Balloons',
      title: 'Welcome to Velvet FINDS!',
      badge: '✦ Official Mascot'
    },
    'home decor': {
      image: 'images/mascot/hamster_peanut.jpg',
      alt: 'Hamster holding a peanut for cozy home decor',
      title: 'Cozy & Aesthetic Home Decor',
      badge: '✦ Home Decor Edit'
    },
    'bedroom': {
      image: 'images/mascot/hamster_heart_paws.jpg',
      alt: 'Hamster making heart paws in soft bed bedding',
      title: 'Sanctuary Bedroom Finds',
      badge: '✦ Bedroom Rest'
    },
    'beauty': {
      image: 'images/mascot/hamster_heart_paws.jpg',
      alt: 'Hamster with heart paws for beauty glow',
      title: 'Self-Care & Skincare Edit',
      badge: '✦ Beauty & Glow'
    },
    'fitness': {
      image: 'images/mascot/hamster_fitness.jpg',
      alt: 'Hamster lifting weights with headphones and cap',
      title: 'Fitness & Active Living',
      badge: '✦ Active & Strong'
    },
    'tech gadgets': {
      image: 'images/mascot/hamster_fitness.jpg',
      alt: 'Smart tech hamster setup',
      title: 'Smart Tech & Desk Setup',
      badge: '✦ Tech Picks'
    },
    'kitchen': {
      image: 'images/mascot/hamster_peanut.jpg',
      alt: 'Hamster in kitchen enjoying treats',
      title: 'Kitchen & Dining Finds',
      badge: '✦ Kitchen Edit'
    },
    'gifts': {
      image: 'images/mascot/hamster_pink_heart.jpg',
      alt: 'Hamster holding glowing pink heart',
      title: 'Curated Gifts with Love',
      badge: '✦ Gift Guide'
    },
    'travel': {
      image: 'images/mascot/hamster_balloons.jpg',
      alt: 'Hamster flying with balloons for travel',
      title: 'Travel & Packing Essentials',
      badge: '✦ Travel Edit'
    },
    'blog': {
      image: 'images/mascot/hamster_pink_heart.jpg',
      alt: 'Velvet FINDS Blog Mascot',
      title: 'Stories & Styling Guides',
      badge: '✦ The Velvet Blog'
    },
    'about': {
      image: 'images/mascot/hamster_pink_heart.jpg',
      alt: 'About Velvet FINDS Mascot',
      title: 'Hand-Picked with Care',
      badge: '✦ About Us'
    }
  };

  /**
   * Render interactive mascot component into container
   * @param {string|HTMLElement} target - DOM element or selector
   * @param {string} categoryKey - Category name or page key
   * @param {object} options - Custom overrides (image, title, size)
   */
  function render(target, categoryKey = 'home', options = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;

    const key = (categoryKey || 'home').toLowerCase();
    const preset = mascotRegistry[key] || mascotRegistry['home'];
    const config = { ...preset, ...options };

    el.innerHTML = `
      <div class="vf-mascot-wrapper" data-category="${key}">
        <div class="vf-mascot-card">
          <div class="vf-mascot-media">
            <img src="${config.image}" alt="${config.alt}" class="vf-mascot-img" loading="lazy">
            <div class="vf-mascot-eye-blink"></div>
            <div class="vf-mascot-heart-pulse"></div>
            <div class="vf-mascot-overlay"></div>
          </div>
          ${config.badge ? `<span class="vf-mascot-badge">${config.badge}</span>` : ''}
          ${config.title ? `<div class="vf-mascot-caption">${config.title}</div>` : ''}
        </div>
      </div>
    `;

    attachInteractiveEvents(el.querySelector('.vf-mascot-wrapper'));
  }

  /**
   * Attach smooth GPU mouse tracking parallax & touch tilt
   */
  function attachInteractiveEvents(wrapper) {
    if (!wrapper) return;
    const card = wrapper.querySelector('.vf-mascot-card');
    const img = wrapper.querySelector('.vf-mascot-img');
    if (!card || !img) return;

    let isHovered = false;

    wrapper.addEventListener('mouseenter', () => {
      isHovered = true;
      card.classList.add('is-interacting');
    });

    wrapper.addEventListener('mousemove', (e) => {
      if (!isHovered) return;
      const rect = wrapper.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      // Subtle tilt transform (max 8 deg tilt for realistic aesthetic)
      const rotateX = -y * 12;
      const rotateY = x * 12;
      const translateX = x * 10;
      const translateY = y * 10;

      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(${translateX}px, ${translateY}px, 15px)`;
      img.style.transform = `scale(1.06) translate3d(${x * -6}px, ${y * -6}px, 0)`;
    });

    wrapper.addEventListener('mouseleave', () => {
      isHovered = false;
      card.classList.remove('is-interacting');
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
      img.style.transform = 'scale(1) translate3d(0, 0, 0)';
    });

    // Tap interactive moment for mobile devices
    wrapper.addEventListener('click', () => {
      wrapper.classList.add('pulse-moment');
      setTimeout(() => wrapper.classList.remove('pulse-moment'), 600);
    });
  }

  return {
    render,
    registry: mascotRegistry
  };
})();
