/* Sum-IT Projecten mini demo: van offerte tot eindafrekening.
   Markup: <div class="ad" data-project-demo></div>  (uses .sf-* styles from feature.css) */
(function () {
  var NL = {
    demo: 'Voorbeeld', excl: 'alle bedragen excl. btw', next: 'Volgende', replay: 'Opnieuw afspelen',
    steps: ['Offerte', 'Project', 'Bonnetjes', 'Betalingen', 'Eindafrekening', 'Resultaat'],
    offer: { h: 'Offerte OF-2026-021', who: 'Fam. de Vries', what: 'Badkamer renoveren', sent: 'Verzonden', acc: 'Geaccepteerd', total: 'Totaal', btn: 'Maak er een project van', mark: 'Klant accepteert' },
    proj: { h: 'Badkamer Fam. de Vries', code: 'PRJ-021 · Actief', budget: 'Budget', inc: 'Totale inkomsten', cost: 'Totale kosten', est: 'Geschatte eindstand', btn: 'Bonnetje koppelen' },
    recs: [['Bouwmaat Breda', 'Leidingwerk en kitten', 412.30], ['Tegelhuis Zuid', 'Wand- en vloertegels', 1286.00], ['Sanitairwinkel', 'Douche en toilet', 2140.00]],
    recT: 'Uitgaven op dit project', linked: 'gekoppeld', bon: 'Bon',
    pay: { h: 'Betalingsoverzicht', rec: 'Ontvangen', still: 'Nog aan jou verschuldigd', spent: 'Uitgegeven', net: 'Netto tot nu toe', dep: 'Aanbetaling 40% · F-2026-031', btn: 'Eindfactuur maken' },
    fin: { h: 'Eindfactuur', work: 'Jouw werk', paid: 'Al betaald', rest: 'Nog te betalen', btn: 'Eindfactuur versturen', sentT: 'Verstuurd · F-2026-038' },
    res: { h: 'Klus afgerond', sub: 'Badkamer Fam. de Vries', inc: 'Omzet', cost: 'Kosten', profit: 'Winst op deze klus', marg: 'marge' },
    toastRec: 'Bon gekoppeld', toastPay: 'Betaling ontvangen', more: 'Betalingen bekijken'
  };
  var EN = {
    demo: 'Example', excl: 'all amounts excl. VAT', next: 'Next', replay: 'Play again',
    steps: ['Quote', 'Project', 'Receipts', 'Payments', 'Final invoice', 'Result'],
    offer: { h: 'Quote OF-2026-021', who: 'De Vries family', what: 'Bathroom renovation', sent: 'Sent', acc: 'Accepted', total: 'Total', btn: 'Turn it into a project', mark: 'Customer accepts' },
    proj: { h: 'Bathroom De Vries family', code: 'PRJ-021 · Active', budget: 'Budget', inc: 'Total income', cost: 'Total costs', est: 'Estimated result', btn: 'Link a receipt' },
    recs: [['Bouwmaat Breda', 'Pipework and sealant', 412.30], ['Tegelhuis Zuid', 'Wall and floor tiles', 1286.00], ['Sanitary store', 'Shower and toilet', 2140.00]],
    recT: 'Expenses on this project', linked: 'linked', bon: 'Receipt',
    pay: { h: 'Payment overview', rec: 'Received', still: 'Still owed to you', spent: 'Spent', net: 'Net so far', dep: 'Deposit 40% · F-2026-031', btn: 'Create final invoice' },
    fin: { h: 'Final invoice', work: 'Your work', paid: 'Already paid', rest: 'Still to pay', btn: 'Send final invoice', sentT: 'Sent · F-2026-038' },
    res: { h: 'Job completed', sub: 'Bathroom De Vries family', inc: 'Revenue', cost: 'Costs', profit: 'Profit on this job', marg: 'margin' },
    toastRec: 'Receipt linked', toastPay: 'Payment received', more: 'View payments'
  };
  var TOTAL = 8500, DEP = 3400;
  function L() { return (document.documentElement.lang || 'nl').slice(0, 2) === 'en' ? EN : NL; }
  function eur(n, en) { return en ? '€' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '€ ' + n.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  var CHECK = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var REC = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1a1d4f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10v18l-2.5-1.5L12 21l-2.5-1.5L7 21z"/><path d="M10 8h4M10 12h4"/></svg>';

  function init(el) {
    var S = { s: 0, r: 0, t: null, auto: true, toast: '' };
    function bar(a, b, cls) { var p = Math.min(100, Math.round(a / b * 100)); return '<div class="pd-bar"><i class="' + cls + '" style="width:' + p + '%"></i></div>'; }
    function body(t, en) {
      var costs = 0; for (var i = 0; i < S.r; i++) costs += t.recs[i][2];
      var allCosts = t.recs.reduce(function (a, x) { return a + x[2]; }, 0);
      switch (S.s) {
        case 0: return '<div class="sf-box"><span class="sf-tag ' + (S.acc ? 'g' : '') + '">' + (S.acc ? t.offer.acc : t.offer.sent) + '</span>' +
          '<div class="sf-who" style="margin-top:8px">' + t.offer.h + '</div><div class="sf-desc">' + t.offer.who + ' · ' + t.offer.what + '</div>' +
          '<div class="pd-rows"><div><span>' + (en ? 'Labour' : 'Arbeid') + '</span><b>' + eur(4900, en) + '</b></div><div><span>' + (en ? 'Materials' : 'Materiaal') + '</span><b>' + eur(3600, en) + '</b></div><div class="tot"><span>' + t.offer.total + '</span><b>' + eur(TOTAL, en) + '</b></div></div>' +
          (S.acc ? '<button type="button" class="sf-btn sf-green sf-w" data-a="next">' + t.offer.btn + '</button>' : '<button type="button" class="sf-btn sf-soft sf-w" data-a="next">' + t.offer.mark + '</button>') + '</div>';
        case 1: case 2: return '<div class="sf-box"><div class="sf-who">' + t.proj.h + '</div><div class="sf-desc">' + t.proj.code + '</div>' +
          '<div class="pd-kpis"><div><small>' + t.proj.inc + '</small><b class="in">' + eur(0, en) + '</b></div><div><small>' + t.proj.cost + '</small><b class="out">' + eur(costs, en) + '</b></div></div>' +
          '<div class="pd-blabel"><span>' + t.proj.budget + ' ' + eur(TOTAL, en) + '</span><span>' + Math.round(costs / TOTAL * 100) + '%</span></div>' + bar(costs, TOTAL, 'cost') +
          (S.s === 2 ? '<div class="pd-sub">' + t.recT + '</div><ul class="pd-list">' + t.recs.slice(0, S.r).map(function (x) { return '<li><span class="pd-ic">' + REC + '</span><span><b>' + x[0] + '</b><small>' + x[1] + '</small></span><em>– ' + eur(x[2], en) + '</em></li>'; }).join('') + '</ul>' + '<button type="button" class="sf-btn ' + (S.r < 3 ? 'sf-dark' : 'sf-green') + ' sf-w" data-a="next">' + (S.r < 3 ? t.proj.btn : t.more) + '</button>'
            : '<button type="button" class="sf-btn sf-dark sf-w" data-a="next">' + t.proj.btn + '</button>') + '</div>';
        case 3: return '<div class="sf-box"><div class="sf-who">' + t.pay.h + '</div><div class="sf-desc">' + t.proj.h + '</div>' +
          '<div class="pd-pay"><div class="in"><small>' + t.pay.rec + '</small><b>' + eur(DEP, en) + '</b></div><div><small>' + t.pay.still + '</small><b>' + eur(TOTAL - DEP, en) + '</b></div><div class="out"><small>' + t.pay.spent + '</small><b>' + eur(allCosts, en) + '</b></div></div>' +
          '<div class="pd-blabel"><span>' + t.pay.rec + '</span><span>' + Math.round(DEP / TOTAL * 100) + '%</span></div>' + bar(DEP, TOTAL, 'inc') +
          '<div class="pd-line"><span>' + t.pay.dep + '</span><b class="in">+ ' + eur(DEP, en) + '</b></div>' +
          '<div class="pd-line net"><span>' + t.pay.net + '</span><b>' + eur(DEP - allCosts, en) + '</b></div>' +
          '<button type="button" class="sf-btn sf-dark sf-w" data-a="next">' + t.pay.btn + '</button></div>';
        case 4: return '<div class="sf-box"><div class="sf-who">' + t.fin.h + '</div><div class="sf-desc">' + t.offer.who + ' · ' + t.offer.what + '</div>' +
          '<div class="pd-rows"><div><span>' + t.fin.work + '</span><b>' + eur(TOTAL, en) + '</b></div><div><span>' + t.fin.paid + '</span><b class="in">– ' + eur(DEP, en) + '</b></div><div class="tot"><span>' + t.fin.rest + '</span><b>' + eur(TOTAL - DEP, en) + '</b></div></div>' +
          (S.sent ? '<div class="sf-why">' + CHECK + t.fin.sentT + '</div>' : '<button type="button" class="sf-btn sf-green sf-w" data-a="next">' + t.fin.btn + '</button>') + '</div>';
        default:
          var profit = TOTAL - allCosts;
          return '<div class="sf-box sf-sum"><span class="sf-ok"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>' +
            '<b>' + t.res.h + '</b><small>' + t.res.sub + '</small>' +
            '<div class="pd-res"><div><span>' + t.res.inc + '</span><b class="in">' + eur(TOTAL, en) + '</b></div><div><span>' + t.res.cost + '</span><b class="out">– ' + eur(allCosts, en) + '</b></div></div>' +
            '<div class="pd-profit"><span>' + t.res.profit + '</span><b>' + eur(profit, en) + '</b><small>' + Math.round(profit / TOTAL * 100) + '% ' + t.res.marg + '</small></div>' +
            '<button type="button" class="sf-btn sf-soft sf-w" data-a="replay">' + t.replay + '</button></div>';
      }
    }
    function render() {
      var t = L(), en = t === EN;
      var dots = t.steps.map(function (x, k) { return '<i class="' + (k < S.s ? 'done' : k === S.s ? 'cur' : '') + '"></i>'; }).join('');
      el.innerHTML = '<div class="sf-phone"><div class="sf-top"><span>Sum-IT</span><em>' + t.demo + '</em></div><div class="sf-body">' +
        '<div class="sf-head"><div><b>' + t.steps[S.s] + '</b><small>' + (S.s + 1) + '/' + t.steps.length + ' · ' + t.excl + '</small></div></div>' +
        '<div class="sf-dots">' + dots + '</div>' + body(t, en) + '</div>' +
        (S.toast ? '<div class="sf-toast">' + S.toast + '</div>' : '') + '</div>';
    }
    function toast(m) { S.toast = m; clearTimeout(S.tt); S.tt = setTimeout(function () { S.toast = ''; render(); }, 2200); }
    // one "tick" of the story
    function step() {
      var t = L();
      if (S.s === 0 && !S.acc) { S.acc = true; }
      else if (S.s === 0) { S.s = 1; }
      else if (S.s === 1) { S.s = 2; S.r = 1; toast(t.toastRec); }
      else if (S.s === 2 && S.r < 3) { S.r++; toast(t.toastRec); }
      else if (S.s === 2) { S.s = 3; toast(t.toastPay); }
      else if (S.s === 3) { S.s = 4; }
      else if (S.s === 4 && !S.sent) { S.sent = true; }
      else if (S.s === 4) { S.s = 5; }
      else return false;
      render(); return true;
    }
    function auto() { if (!S.auto) return; if (step()) S.t = setTimeout(auto, 3600); }
    function reset() { S.s = 0; S.r = 0; S.acc = false; S.sent = false; S.toast = ''; }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      clearTimeout(S.t);
      if (b.getAttribute('data-a') === 'replay') { reset(); render(); S.auto = true; S.t = setTimeout(auto, 2500); return; }
      S.auto = false; step();
      // after the user's tap, keep playing calmly from there
      S.auto = true; S.t = setTimeout(auto, 5000);
    });
    document.addEventListener('langchange', render);
    reset(); render();
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); S.t = setTimeout(auto, 2500); } }, { threshold: .4 });
      io.observe(el);
    }
  }
  function boot() { [].forEach.call(document.querySelectorAll('[data-project-demo]'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
