// small interactions to match reference feel
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    // simple fade in
    document.querySelectorAll('.hero-card, .portrait-card img, .hero-right').forEach((el,i)=>{
      el.style.opacity = 0;
      el.style.transform = 'translateY(12px)';
      setTimeout(()=> {
        el.style.transition = 'opacity .6s ease, transform .6s cubic-bezier(.2,.9,.27,1)';
        el.style.opacity = 1;
        el.style.transform = 'translateY(0)';
      }, 120 + i*80);
    });
  });

  // parallax for larger screens
  if(window.innerWidth > 900){
    const img = document.getElementById('studentImg');
    const giant = document.querySelector('.giant-text');
    window.addEventListener('mousemove', (e)=>{
      const cx = window.innerWidth/2, cy = window.innerHeight/2;
      const dx = (e.clientX - cx)/cx;
      const dy = (e.clientY - cy)/cy;
      if(img) img.style.transform = `translate3d(${dx * 10}px, ${dy * 6}px, 0)`;
      if(giant) giant.style.transform = `translate3d(${dx * -18}px, ${dy * -10}px, 0)`;
    });
  }
})();
