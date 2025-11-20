// landing.js - micro-interactions (parallax, floating, ripple)
(function(){

  // ripple effect on primary button
  document.addEventListener('click', function(e){
    const btn = e.target.closest('.btn.primary');
    if(!btn) return;

    const rect = btn.getBoundingClientRect();
    const span = document.createElement('span');

    span.style.position = 'absolute';
    span.style.left = (e.clientX - rect.left) + 'px';
    span.style.top = (e.clientY - rect.top) + 'px';
    span.style.width = span.style.height =
      Math.max(rect.width, rect.height) * 0.6 + 'px';

    span.style.borderRadius = '50%';
    span.style.transform = 'translate(-50%,-50%) scale(0)';
    span.style.background =
      'radial-gradient(circle, rgba(255,255,255,0.18), rgba(255,255,255,0.02))';
    span.style.pointerEvents = 'none';
    span.style.transition =
      'transform 700ms cubic-bezier(.2,.9,.27,1), opacity 700ms';

    btn.style.position = 'relative';
    btn.appendChild(span);

    requestAnimationFrame(()=>{
      span.style.transform = 'translate(-50%,-50%) scale(6)';
      span.style.opacity = '0';
    });

    setTimeout(()=> span.remove(), 750);
  });

  // slow floating animation for background circles
  const circles = document.querySelectorAll('.bg-circle');

  function floatLoop(){
    circles.forEach((c, i) => {
      const shift = 10 + i * 6;
      c.animate(
        [
          { transform: `translateY(0px)` },
          { transform: `translateY(${shift}px)` },
          { transform: `translateY(0px)` }
        ],
        {
          duration: 7000 + i * 1200,
          iterations: Infinity,
          direction: 'alternate',
          easing: 'ease-in-out'
        }
      );
    });
  }
  floatLoop();

  // parallax movement for the portrait + giant HR text (desktop only)
  if(window.innerWidth > 900){
    const img = document.getElementById('studentImg');
    const giant = document.querySelector('.giant-text');

    window.addEventListener('mousemove', (e)=>{
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;

      if(img){
        img.style.transform =
          `translate3d(${dx * 8}px, ${dy * 6}px, 0) scale(1.01)`;
      }
      if(giant){
        giant.style.transform =
          `translate3d(${dx * -18}px, ${dy * -10}px, 0)`;
      }
    });
  }

})();
