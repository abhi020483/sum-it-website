/* Sum-IT cookie & storage consent.
   - Functional storage (language, login, this choice) is always allowed and needs no consent (Telecommunicatiewet art. 11.7a lid 3).
   - "stats" and "marketing" stay OFF until the visitor opts in. Refusing is as easy as accepting.
   - Scripts that need consent: <script type="text/plain" data-consent="stats" data-src="..."></script>
   - JS API: window.sumitConsent.has('stats'), .open(), .onChange(fn)
   - The choice is kept for 12 months, then asked again. */
(function () {
  var KEY = 'sumit_consent', VERSION = 1, MAX_AGE = 365 * 864e5;
  var TX = {
    nl: {
      title: 'Cookies en privacy',
      body: 'Sum-IT gebruikt alleen wat nodig is om de site te laten werken, zoals je taalkeuze en inloggen. Daar is geen toestemming voor nodig. Marketing (Meta Pixel) staat uit, tenzij jij die aanzet.',
      more: 'Lees de cookieverklaring', only: 'Alleen noodzakelijk', settings: 'Instellingen', all: 'Alles accepteren',
      mTitle: 'Cookie-instellingen', save: 'Keuze opslaan', close: 'Sluiten', always: 'Altijd aan', notInUse: 'nu niet in gebruik',
      cats: [['need', 'Noodzakelijk', 'Je taalkeuze, inloggen en het onthouden van deze keuze. Zonder deze opslag werkt de site niet goed.'],
             ['stats', 'Statistieken', 'Anoniem meten hoe de site gebruikt wordt, zodat we hem kunnen verbeteren.'],
             ['marketing', 'Marketing', 'Meta Pixel (Facebook/Instagram): meten welke advertenties tot aanmeldingen leiden en doelgroepen maken. Alleen als jij dit aanzet.']]
    },
    en: {
      title: 'Cookies and privacy',
      body: 'Sum-IT only uses what is needed to make the site work, such as your language choice and logging in. That needs no consent. Marketing (Meta Pixel) is off unless you switch it on.',
      more: 'Read the cookie statement', only: 'Necessary only', settings: 'Settings', all: 'Accept all',
      mTitle: 'Cookie settings', save: 'Save choice', close: 'Close', always: 'Always on', notInUse: 'not in use now',
      cats: [['need', 'Necessary', 'Your language choice, logging in and remembering this choice. Without this storage the site does not work properly.'],
             ['stats', 'Statistics', 'Measuring anonymously how the site is used, so we can improve it.'],
             ['marketing', 'Marketing', 'Meta Pixel (Facebook/Instagram): measuring which ads lead to sign-ups and building audiences. Only if you switch this on.']]
    }
  };
  // categories that actually load something today; others are shown as "not in use now"
  var ACTIVE = { stats: false, marketing: true };
  var listeners = [];

  function lang() { return (document.documentElement.lang || 'nl').slice(0, 2) === 'en' ? 'en' : 'nl'; }
  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!c || c.v !== VERSION || (Date.now() - c.ts) > MAX_AGE) return null;
      return c;
    } catch (e) { return null; }
  }
  function write(stats, marketing) {
    var c = { v: VERSION, ts: Date.now(), stats: !!stats, marketing: !!marketing };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    state = c; apply(); listeners.forEach(function (fn) { try { fn(c); } catch (e) {} });
    return c;
  }
  var state = read();
  function has(cat) { return cat === 'need' || !!(state && state[cat]); }
  function loadMeta() {
    if (!has('marketing') || window.__sumitMetaLoaded) return;
    window.__sumitMetaLoaded = true;
    var n = document.createElement('script'); n.src = '/js/meta.js'; n.defer = true; document.head.appendChild(n);
  }
  function apply() {
    loadMeta();
    [].forEach.call(document.querySelectorAll('script[type="text/plain"][data-consent]'), function (s) {
      if (!has(s.getAttribute('data-consent')) || s.getAttribute('data-done')) return;
      var n = document.createElement('script');
      if (s.getAttribute('data-src')) n.src = s.getAttribute('data-src'); else n.textContent = s.textContent;
      [].forEach.call(s.attributes, function (a) { if (/^data-(?!consent|src|done)/.test(a.name)) n.setAttribute(a.name, a.value); });
      s.setAttribute('data-done', '1'); s.parentNode.insertBefore(n, s.nextSibling);
    });
  }

  var css = '.sc-bar{position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;max-width:760px;margin:0 auto;background:#fff;color:#1a1d4f;border-radius:20px;box-shadow:0 20px 60px rgba(15,18,60,.25),0 0 0 1px rgba(15,18,60,.06);padding:20px 22px;font:15px/1.55 "DM Sans",system-ui,sans-serif}' +
    '.sc-bar h2{font-size:17px;margin:0 0 6px;color:#1a1d4f}.sc-bar p{margin:0 0 14px;color:#475569}.sc-bar a{color:#00875a;font-weight:600}' +
    '.sc-btns{display:flex;flex-wrap:wrap;gap:10px}.sc-btn{appearance:none;border:0;cursor:pointer;font:inherit;font-weight:700;border-radius:12px;padding:11px 16px;min-height:44px}' +
    '.sc-p{background:#00bc7d;color:#062b1f}.sc-s{background:#eef1f6;color:#1a1d4f}.sc-btn:focus-visible{outline:3px solid #1a1d4f;outline-offset:2px}' +
    '.sc-ov{position:fixed;inset:0;z-index:10000;background:rgba(15,18,60,.45);display:grid;place-items:center;padding:16px}' +
    '.sc-m{background:#fff;color:#1a1d4f;border-radius:22px;max-width:560px;width:100%;max-height:90vh;overflow:auto;padding:24px;font:15px/1.55 "DM Sans",system-ui,sans-serif}' +
    '.sc-m h2{margin:0 0 14px;font-size:20px;color:#1a1d4f}.sc-row{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-top:1px solid #e6e9f2}' +
    '.sc-row b{display:block}.sc-row small{display:block;color:#64748b;margin-top:2px}.sc-row>div{flex:1}' +
    '.sc-tag{font-size:12px;font-weight:700;color:#00875a;white-space:nowrap}.sc-sw{position:relative;width:46px;height:28px;flex:none}' +
    '.sc-sw input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer}.sc-sw span{position:absolute;inset:0;border-radius:99px;background:#cbd2e1;transition:background .2s}' +
    '.sc-sw span::after{content:"";position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:transform .2s}' +
    '.sc-sw input:checked+span{background:#00bc7d}.sc-sw input:checked+span::after{transform:translateX(18px)}.sc-sw input:focus-visible+span{outline:3px solid #1a1d4f;outline-offset:2px}' +
    '@media (max-width:560px){.sc-bar{left:10px;right:10px;bottom:10px;padding:16px}.sc-btns .sc-btn{flex:1 1 100%}}';

  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstChild; }
  var bar = null, modal = null;
  function closeBar() { if (bar) { bar.remove(); bar = null; } }
  function showBar() {
    if (bar) return; var t = TX[lang()];
    bar = el('<div class="sc-bar" role="region" aria-label="' + t.title + '"><h2>' + t.title + '</h2><p>' + t.body + ' <a href="/cookies/">' + t.more + '</a></p>' +
      '<div class="sc-btns"><button type="button" class="sc-btn sc-s" data-sc="only">' + t.only + '</button><button type="button" class="sc-btn sc-s" data-sc="settings">' + t.settings + '</button>' +
      '<button type="button" class="sc-btn sc-p" data-sc="all">' + t.all + '</button></div></div>');
    document.body.appendChild(bar);
  }
  function open() {
    closeModal(); var t = TX[lang()];
    var rows = t.cats.map(function (c) {
      var k = c[0], tag = k === 'need' ? '<span class="sc-tag">' + t.always + '</span>'
        : '<label class="sc-sw"><input type="checkbox" data-cat="' + k + '"' + (has(k) ? ' checked' : '') + ' aria-label="' + c[1] + '"><span></span></label>';
      return '<div class="sc-row"><div><b>' + c[1] + (k !== 'need' && !ACTIVE[k] ? ' <small style="display:inline;color:#94a3b8">(' + t.notInUse + ')</small>' : '') + '</b><small>' + c[2] + '</small></div>' + tag + '</div>';
    }).join('');
    modal = el('<div class="sc-ov" role="dialog" aria-modal="true" aria-label="' + t.mTitle + '"><div class="sc-m"><h2>' + t.mTitle + '</h2>' + rows +
      '<p style="margin:12px 0 16px;color:#64748b;font-size:14px"><a href="/cookies/" style="color:#00875a;font-weight:600">' + t.more + '</a></p>' +
      '<div class="sc-btns"><button type="button" class="sc-btn sc-s" data-sc="only">' + t.only + '</button><button type="button" class="sc-btn sc-s" data-sc="save">' + t.save + '</button>' +
      '<button type="button" class="sc-btn sc-p" data-sc="all">' + t.all + '</button></div></div></div>');
    document.body.appendChild(modal);
    var f = modal.querySelector('input,button'); if (f) f.focus();
  }
  function closeModal() { if (modal) { modal.remove(); modal = null; } }

  document.addEventListener('click', function (e) {
    var s = e.target.closest('[data-cookie-settings]');
    if (s) { e.preventDefault(); open(); return; }
    var b = e.target.closest('[data-sc]'); if (!b) { if (modal && e.target === modal) closeModal(); return; }
    var a = b.getAttribute('data-sc');
    if (a === 'settings') { open(); return; }
    if (a === 'only') write(false, false);
    else if (a === 'all') write(true, true);
    else if (a === 'save') { var q = function (c) { var i = modal.querySelector('[data-cat="' + c + '"]'); return i && i.checked; }; write(q('stats'), q('marketing')); }
    closeModal(); closeBar();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal) closeModal(); });
  document.addEventListener('langchange', function () { if (bar) { closeBar(); showBar(); } if (modal) open(); });

  window.sumitConsent = { has: has, open: open, onChange: function (fn) { listeners.push(fn); } };
  function boot() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    apply();
    if (!state && !/^\/(admin|beheer)/.test(location.pathname)) showBar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
