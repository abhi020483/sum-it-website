/* Sum-IT Projecten: slideshow of real app screens (demo project "Dakkapel De Vries", fictional).
   Markup: <div class="pj-show" data-project-demo><div class="phone"> <figure data-nl data-en><img></figure>... </div></div> */
(function () {
  function init(el) {
    var figs = [].slice.call(el.querySelectorAll('figure')), i = 0, t = null, paused = false;
    if (!figs.length) return;
    var cap = document.createElement('div'); cap.className = 'pj-cap';
    var dots = document.createElement('div'); dots.className = 'pj-dots';
    figs.forEach(function (f, k) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', String(k + 1));
      b.addEventListener('click', function () { go(k); paused = true; clearTimeout(t); t = setTimeout(function () { paused = false; next(); }, 9000); });
      dots.appendChild(b);
    });
    el.appendChild(cap); el.appendChild(dots);
    function lang() { return (document.documentElement.lang || 'nl').slice(0, 2) === 'en' ? 'en' : 'nl'; }
    function go(k) {
      i = k;
      figs.forEach(function (f, j) { f.classList.toggle('on', j === k); });
      [].forEach.call(dots.children, function (d, j) { d.classList.toggle('on', j === k); });
      cap.innerHTML = '<b>' + (k + 1) + '/' + figs.length + '</b> ' + figs[k].getAttribute('data-' + lang());
    }
    function next() { if (paused) return; go((i + 1) % figs.length); clearTimeout(t); t = setTimeout(next, 4500); }
    document.addEventListener('langchange', function () { go(i); });
    go(0);
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) t = setTimeout(next, 4500);
  }
  function boot() { [].forEach.call(document.querySelectorAll('[data-project-demo]'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
