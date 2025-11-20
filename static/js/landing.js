// static/js/landing.js
// Lightweight interactions: fade-in, parallax, subtle micro-interactions.
// Designed to work with the NFT-style landing (portrait id="studentImg").

(function () {
  // helper: fade in a NodeList with stagger
  function fadeInElements(list, delayBase = 120, step = 80) {
    list.forEach((el, i) => {
      el.style.opacity = 0;
      el.style.transform = 'translateY(12px)';
      setTimeout(() => {
        el.style.transition = 'opacity .6s ease, transform .6s cubic-bezier(.2,.9,.27,1)';
        el.style.opacity = 1;
        el.style.transform = 'translateY(0)';
      }, delayBase + i * step);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    // primary elements to animate
    const els = Array.from(document.querySelectorAll('.hero-inner, .portrait-wrap img, .hero-right'));
    fadeInElements(els);
  });

  // Parallax (mouse move) — only on large screens
  function enableParallax() {
    const img = document.getElementById('studentImg');
    const giant = document.querySelector('.giant-text');
    if (!img && !giant) return;

    // Smooth follow using requestAnimationFrame
    let mouseX = 0, mouseY = 0;
    let raf = null;

    window.addEventListener('mousemove', (e) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      mouseX = (e.clientX - cx) / cx;
      mouseY = (e.clientY - cy) / cy;

      if (!raf) raf = requestAnimationFrame(renderParallax);
    });

    function renderParallax() {
      raf = null;
      // scale factors tuned for subtlety
      if (img) {
        img.style.transform = `translate3d(${mouseX * 10}px, ${mouseY * 6}px, 0)`;
      }
      if (giant) {
        giant.style.transform = `translate3d(${mouseX * -18}px, ${mouseY * -10}px, 0)`;
      }
    }
  }

  if (window.innerWidth > 900) enableParallax();

  // Make CTA show a tiny ripple effect without external libs
  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.btn-cta');
    if (!btn) return;

    // create ripple element
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height) * 0.9;
    ripple.style.position = 'absolute';
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.borderRadius = '50%';
    ripple.style.transform = 'translate(-50%,-50%) scale(0)';
    ripple.style.background = 'radial-gradient(circle, rgba(8,22,34,0.06), rgba(8,22,34,0.02))';
    ripple.style.pointerEvents = 'none';
    ripple.style.transition = 'transform 700ms cubic-bezier(.2,.9,.27,1), opacity 700ms';
    ripple.style.opacity = '0.9';
    btn.style.position = 'relative';
    btn.appendChild(ripple);

    // animate
    requestAnimationFrame(() => {
      ripple.style.transform = 'translate(-50%,-50%) scale(4)';
      ripple.style.opacity = '0';
    });

    // cleanup
    setTimeout(() => {
      ripple.remove();
    }, 800);
  });

  // Optional: small resize handler to enable/disable parallax
  let parallaxEnabled = window.innerWidth > 900;
  window.addEventListener('resize', () => {
    const nowLarge = window.innerWidth > 900;
    if (nowLarge && !parallaxEnabled) {
      parallaxEnabled = true;
      enableParallax();
    } else if (!nowLarge) {
      parallaxEnabled = false;
      // reset transforms
      const img = document.getElementById('studentImg');
      const giant = document.querySelector('.giant-text');
      if (img) img.style.transform = '';
      if (giant) giant.style.transform = '';
    }
  });
})();
