/* Sum-IT Meta Pixel. Loaded ONLY by /js/consent.js after the visitor turns on "Marketing".
   - PageView on every page (never used for optimisation).
   - window.sumitMeta.lead(eventId): browser Lead with the same event_id the server sends
     via the Conversions API, so Meta counts it once (deduplication).
   - Withdrawing consent stops the Pixel and removes its cookies (_fbp, _fbc). */
(function () {
  var ID = (window.SITE_CFG && SITE_CFG.META_PIXEL_ID) || '2902586496782863';

  /* Meta's standard base code */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  fbq('consent', 'grant');
  fbq('init', ID);
  fbq('track', 'PageView');

  /* Keep the ad's UTM tags for this visit, so a sign-up on a later page still carries them.
     Session only, and only with marketing consent. */
  try {
    var q = new URLSearchParams(location.search), u = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) { if (q.get(k)) u[k] = q.get(k).slice(0, 150); });
    if (Object.keys(u).length) sessionStorage.setItem('sumit_utm', JSON.stringify(u));
  } catch (e) {}

  window.sumitMeta = {
    lead: function (eventId) {
      try { if (window.sumitConsent && sumitConsent.has('marketing')) fbq('track', 'Lead', {}, { eventID: eventId }); } catch (e) {}
    }
  };

  if (window.sumitConsent) sumitConsent.onChange(function (c) {
    if (c.marketing) { fbq('consent', 'grant'); return; }
    fbq('consent', 'revoke');
    ['_fbp', '_fbc'].forEach(function (n) {
      var h = location.hostname.replace(/^www\./, '');
      document.cookie = n + '=; Max-Age=0; path=/';
      document.cookie = n + '=; Max-Age=0; path=/; domain=.' + h;
    });
    try { sessionStorage.removeItem('sumit_utm'); } catch (e) {}
  });
})();
