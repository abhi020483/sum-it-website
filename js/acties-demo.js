/* Sum-IT Acties-flow mini demo. Markup: <div class="ad" data-acties-demo></div> */
(function () {
  var TX = {
    nl: { title: 'Acties', of: 'van', done: 'gedaan', demo: 'Voorbeeld', replay: 'Opnieuw afspelen',
      allH: 'Alles bijgewerkt', allP: 'Je bent up-to-date. Je boeken kloppen weer.',
      rows: [
        ['scan', 'Bonnetje van Bouwmaat uploaden', 'Uitgave van € 86,40 zonder bon', 'Scannen', 'Bon gescand en gekoppeld'],
        ['invoice', 'Factuur Fam. de Vries is te laat', '€ 1.450, al 12 dagen over de termijn', 'Bekijken', 'Opgevolgd, betaling gekoppeld'],
        ['vat', 'Btw-aangifte Q4 komt eraan', 'Zet € 1.240 opzij vóór 31 januari', 'Gedaan', 'Door jou apart gezet'],
        ['eye', '2 concepten te controleren', 'Kijk ze na voordat je ze verstuurt', 'Controleren', 'Gecontroleerd']
      ] },
    en: { title: 'Actions', of: 'of', done: 'done', demo: 'Example', replay: 'Play again',
      allH: 'All caught up', allP: 'You are up to date. Your books add up again.',
      rows: [
        ['scan', 'Upload the Bouwmaat receipt', '€86.40 expense without a receipt', 'Scan', 'Receipt scanned and linked'],
        ['invoice', 'Invoice to the De Vries family is late', '€1,450, 12 days past due', 'View', 'Followed up, payment linked'],
        ['vat', 'Q4 VAT return is coming up', 'Set aside €1,240 before 31 January', 'Done', 'Set aside by you'],
        ['eye', '2 drafts to review', 'Check them before you send them', 'Review', 'Reviewed']
      ] }
  };
  var IC = {
    scan: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="M10 12h5M10 15.5h5"/>',
    invoice: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    vat: '<path d="M4 20V10M10 20V5M16 20v-7M21 20H3"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'
  };
  function lang() { return (document.documentElement.lang || 'nl').slice(0, 2) === 'en' ? 'en' : 'nl'; }
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + IC[k] + '</svg>'; }
  function init(el) {
    var state = { done: [false, false, false, false], timer: null, auto: true };
    function render() {
      var t = TX[lang()], n = state.done.filter(Boolean).length, all = n === 4;
      var rows = t.rows.map(function (r, i) {
        var d = state.done[i];
        return '<li class="ad-row' + (d ? ' is-done' : '') + '"><span class="ad-ic">' + svg(r[0]) + '</span>' +
          '<span class="ad-tx"><b>' + r[1] + '</b><small>' + (d ? r[4] : r[2]) + '</small></span>' +
          '<button type="button" class="ad-btn" data-i="' + i + '"' + (d ? ' disabled' : '') + '>' +
          (d ? '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>' : r[3]) + '</button></li>';
      }).join('');
      el.innerHTML = '<div class="ad-card"><div class="ad-top"><span class="ad-title">' + t.title + '</span><span class="ad-tag">' + t.demo + '</span></div>' +
        '<div class="ad-prog"><span style="width:' + (n * 25) + '%"></span></div><div class="ad-count">' + n + ' ' + t.of + ' 4 ' + t.done + '</div>' +
        (all ? '<div class="ad-all"><span class="ad-big"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><b>' + t.allH + '</b><p>' + t.allP + '</p>' +
          '<button type="button" class="ad-replay">' + t.replay + '</button></div>' : '<ul class="ad-list">' + rows + '</ul>') + '</div>';
    }
    function complete(i) {
      if (state.done[i]) return;
      var b = el.querySelector('.ad-btn[data-i="' + i + '"]');
      if (b) b.classList.add('is-busy');
      setTimeout(function () { state.done[i] = true; render(); }, 450);
    }
    function next() {
      var i = state.done.indexOf(false);
      if (i < 0 || !state.auto) return;
      complete(i);
      state.timer = setTimeout(next, 1700);
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('.ad-btn'), r = e.target.closest('.ad-replay');
      if (b) { state.auto = false; clearTimeout(state.timer); complete(+b.getAttribute('data-i')); }
      if (r) { state.done = [false, false, false, false]; state.auto = true; render(); state.timer = setTimeout(next, 1200); }
    });
    document.addEventListener('langchange', render);
    render();
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { io.disconnect(); state.timer = setTimeout(next, 900); }
      }, { threshold: .5 });
      io.observe(el);
    }
  }
  function boot() { [].forEach.call(document.querySelectorAll('[data-acties-demo]'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
