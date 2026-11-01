/* Sum-IT Acties-flow mini demo, nagebouwd naar het app-prototype (sumitapp v31, aug 2026).
   Markup: <div class="ad" data-acties-demo></div> */
(function () {
  var TX = {
    nl: { cardT: 'Acties', cardD: '4 · stop wanneer je wilt', start: 'Start', pause: 'Pauze', skip: 'Overslaan →', of: 'van',
      chips: ['1 inkomsten', '1 uitgaven', '1 te laat', '1 belasting'],
      caught: 'Alles bij.', caughtD: 'Niets te doen. Je bent up-to-date.', done: 'Klaar.', dash: 'Dashboard', replay: 'Opnieuw afspelen',
      st: ['gekoppeld', 'betaald', 'herinnering'], demo: 'Voorbeeld',
      steps: [
        { b: 'Inkomsten', tag: ['g', 'Betaling ontvangen'], amt: '+ € 1.450,00', cls: 'in', who: 'Fam. de Vries', desc: '28 okt · Factuur 2026-014', q: 'Hoort bij factuur 2026-014', why: 'Bedrag en kenmerk kloppen', main: ['sf-green', 'Ja, boek'], soft: ['Andere', 'Geen factuur'], toast: 'Geboekt · 2026-014' },
        { b: 'Geld uit', tag: ['a', 'Geen bon'], amt: '– € 86,40', cls: '', who: 'Bouwmaat Breda', desc: '24 okt · Pinbetaling', q: 'Geen passende bon gevonden', main: ['sf-dark', 'Scan bon'], soft: ['Geen bon', 'Privé'], toast: 'Bon toegevoegd' },
        { b: 'Te laat', tag: ['r', '12 dagen te laat'], amt: '€ 1.210,00', cls: '', who: 'Bakker Verbouw', desc: '2026-011 · 3 okt', q: 'Nog niet betaald', main: ['sf-orange', 'Herinnering'], soft: ['Betaald', '7 dagen'], toast: 'Verstuurd · 2026-011' },
        { b: 'Belasting', tag: ['p', 'Btw Q4 · 30 dagen'], amt: '€ 1.240,00', cls: '', who: 'opzij te zetten', desc: 'Jij zet het geld zelf apart', main: ['sf-purple', 'Klaarzetten · € 1.240,00'], soft: ['Later'], toast: 'Klaargezet · € 1.240,00' }
      ] },
    en: { cardT: 'Actions', cardD: '4 · stop anytime', start: 'Start', pause: 'Pause', skip: 'Skip →', of: 'of',
      chips: ['1 income', '1 expenses', '1 overdue', '1 tax'],
      caught: 'All clear.', caughtD: 'Nothing to do. You are up to date.', done: 'Done.', dash: 'Dashboard', replay: 'Play again',
      st: ['matched', 'paid', 'reminder'], demo: 'Example',
      steps: [
        { b: 'Income', tag: ['g', 'Payment received'], amt: '+ €1,450.00', cls: 'in', who: 'De Vries family', desc: '28 Oct · Invoice 2026-014', q: 'Belongs to invoice 2026-014', why: 'Amount and reference match', main: ['sf-green', 'Yes, book it'], soft: ['Other', 'Not an invoice'], toast: 'Booked · 2026-014' },
        { b: 'Money out', tag: ['a', 'No receipt'], amt: '– €86.40', cls: '', who: 'Bouwmaat Breda', desc: '24 Oct · Card payment', q: 'No matching receipt found', main: ['sf-dark', 'Scan receipt'], soft: ['No receipt', 'Private'], toast: 'Receipt added' },
        { b: 'Overdue', tag: ['r', '12 days late'], amt: '€1,210.00', cls: '', who: 'Bakker Verbouw', desc: '2026-011 · 3 Oct', q: 'Not paid yet', main: ['sf-orange', 'Reminder'], soft: ['Paid', '7 days'], toast: 'Sent · 2026-011' },
        { b: 'Tax', tag: ['p', 'VAT Q4 · 30 days'], amt: '€1,240.00', cls: '', who: 'to set aside', desc: 'You move the money yourself', main: ['sf-purple', 'Prepare · €1,240.00'], soft: ['Later'], toast: 'Prepared · €1,240.00' }
      ] }
  };
  var DOTC = ['#10b981', '#2D2D6B', '#f97316', '#8b5cf6'];
  function L() { return (document.documentElement.lang || 'nl').slice(0, 2) === 'en' ? TX.en : TX.nl; }
  var CHECK = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var BACK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M7 5l12 7-12 7z"/></svg>';
  var CHEV = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';

  function init(el) {
    var S = { v: 'dash', i: 0, clean: false, auto: true, t: null, toast: '' };
    function dash(t) {
      if (S.clean) return '<div class="sf-card clean"><div class="sf-h1">' + t.cardT + CHEV + '</div><div class="sf-cd">' + t.caught + '</div><div class="sf-cdd">' + t.caughtD + '</div>' +
        '<button type="button" class="sf-btn sf-white" data-a="replay">' + t.replay + '</button></div>';
      var chips = t.chips.map(function (c, k) { return '<span class="sf-chip"><i style="background:' + DOTC[k] + '"></i>' + c + '</span>'; }).join('');
      return '<div class="sf-card"><div class="sf-h1">' + t.cardT + CHEV + '</div><div class="sf-cdd">' + t.cardD + '</div><div class="sf-chips">' + chips + '</div>' +
        '<button type="button" class="sf-btn sf-white" data-a="start">' + PLAY + t.start + '</button></div>';
    }
    function step(t) {
      var s = t.steps[S.i];
      var dots = t.steps.map(function (x, k) { return '<i class="' + (k < S.i ? 'done' : k === S.i ? 'cur' : '') + '"></i>'; }).join('');
      var soft = s.soft.map(function (x) { return '<button type="button" class="sf-btn sf-soft" data-a="next">' + x + '</button>'; }).join('');
      return '<div class="sf-head"><span class="sf-back">' + BACK + '</span><div><b>' + s.b + '</b><small>' + (S.i + 1) + '/4</small></div><span class="sf-pause">' + t.pause + '</span></div>' +
        '<div class="sf-dots">' + dots + '</div><div class="sf-item">1 ' + t.of + ' 1</div>' +
        '<div class="sf-box" key="' + S.i + '"><span class="sf-tag ' + s.tag[0] + '">' + s.tag[1] + '</span><div class="sf-amt ' + s.cls + '">' + s.amt + '</div>' +
        '<div class="sf-who">' + s.who + '</div><div class="sf-desc">' + s.desc + '</div>' + (s.q ? '<div class="sf-q">' + s.q + '</div>' : '') +
        (s.why ? '<div class="sf-why">' + CHECK.replace('width="30" height="30"', 'width="16" height="16"') + s.why + '</div>' : '') +
        '<button type="button" class="sf-btn ' + s.main[0] + ' sf-w" data-a="next">' + s.main[1] + '</button>' +
        '<div class="sf-row">' + soft + '</div><button type="button" class="sf-btn sf-ghost" data-a="next">' + t.skip + '</button></div>';
    }
    function sum(t) {
      return '<div class="sf-head"><span class="sf-back">' + BACK + '</span><div><b>' + t.done + '</b></div><span class="sf-pause">' + t.pause + '</span></div>' +
        '<div class="sf-dots">' + '<i class="done"></i>'.repeat(4) + '</div>' +
        '<div class="sf-box sf-sum"><span class="sf-ok">' + CHECK + '</span><b>' + t.done + '</b><small>4/4</small>' +
        '<div class="sf-stats"><div><b>1</b><span>' + t.st[0] + '</span></div><div><b>' + (t === TX.en ? '€1,450' : '€ 1.450') + '</b><span>' + t.st[1] + '</span></div><div><b>1</b><span>' + t.st[2] + '</span></div></div>' +
        '<button type="button" class="sf-btn sf-dark sf-w" data-a="dash">' + t.dash + '</button></div>';
    }
    function render() {
      var t = L();
      var body = S.v === 'dash' ? '<div class="sf-dashhead"><b>Dashboard</b><span>' + (t === TX.en ? 'Overview of your finances' : 'Overzicht van je financiën') + '</span></div>' + dash(t) +
        '<div class="sf-mini"><div><small>' + (t === TX.en ? 'MONEY IN' : 'GELD IN') + '</small><b class="in">€ 17.240</b></div><div><small>' + (t === TX.en ? 'MONEY OUT' : 'GELD UIT') + '</small><b class="out">€ 4.912</b></div></div>'
        : S.v === 'step' ? step(t) : sum(t);
      el.innerHTML = '<div class="sf-phone"><div class="sf-top"><span>Sum-IT</span><em>' + t.demo + '</em></div><div class="sf-body">' + body + '</div>' +
        (S.toast ? '<div class="sf-toast">' + S.toast + '<span>' + (t === TX.en ? 'Undo' : 'Ongedaan') + '</span></div>' : '') + '</div>';
    }
    function act(a) {
      var t = L();
      if (a === 'start') { S.v = 'step'; S.i = 0; }
      else if (a === 'next') { S.toast = t.steps[S.i].toast; clearTimeout(S.tt); S.tt = setTimeout(function () { S.toast = ''; render(); }, 2400); if (S.i < 3) S.i++; else S.v = 'sum'; }
      else if (a === 'dash') { S.v = 'dash'; S.clean = true; S.toast = ''; }
      else if (a === 'replay') { S.v = 'dash'; S.clean = false; S.auto = true; schedule(2500); }
      render();
    }
    function autoStep() {
      if (!S.auto) return;
      if (S.v === 'dash' && !S.clean) act('start');
      else if (S.v === 'step') act('next');
      else if (S.v === 'sum') { act('dash'); return; }
      schedule(S.v === 'step' ? 4000 : 3000);
    }
    function schedule(ms) { clearTimeout(S.t); S.t = setTimeout(autoStep, ms); }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var a = b.getAttribute('data-a');
      if (a !== 'replay') { S.auto = false; clearTimeout(S.t); }
      act(a);
    });
    document.addEventListener('langchange', render);
    render();
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); schedule(2500); } }, { threshold: .4 });
      io.observe(el);
    }
  }
  function boot() { [].forEach.call(document.querySelectorAll('[data-acties-demo]'), init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
