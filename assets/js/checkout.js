// Lemon Squeezy checkout, loaded only when the visitor clicks a buy button.
// Nothing from Lemon Squeezy is requested before that click, so no third-party
// script or cookie runs on page load. The first click loads lemon.js and opens
// the checkout overlay; if lemon.js cannot load, the normal checkout page opens.
(function () {
  var LEMON_SRC = 'https://app.lemonsqueezy.com/js/lemon.js';
  var state = 'idle'; // idle -> loading -> ready
  var waiting = [];

  function ready() {
    return !!(window.LemonSqueezy && window.LemonSqueezy.Url);
  }

  function loadLemon(cb) {
    if (state === 'ready') return cb(true);
    waiting.push(cb);
    if (state === 'loading') return;
    state = 'loading';
    var s = document.createElement('script');
    s.src = LEMON_SRC;
    s.defer = true;
    s.onload = function () {
      if (typeof window.createLemonSqueezy === 'function') window.createLemonSqueezy();
      state = ready() ? 'ready' : 'idle';
      flush(state === 'ready');
    };
    s.onerror = function () { state = 'idle'; flush(false); };
    document.head.appendChild(s);
  }

  function flush(ok) {
    var list = waiting; waiting = [];
    list.forEach(function (fn) { fn(ok); });
  }

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a.lemonsqueezy-button');
    if (!a) return;
    // Count the click in Umami here instead of via data-umami-event: Umami's
    // own link handling navigates to the href, which would kill the overlay.
    var evt = a.getAttribute('data-track');
    if (evt && window.umami && typeof window.umami.track === 'function') {
      try { window.umami.track(evt); } catch (err) { /* analytics must never block checkout */ }
    }
    // Let the browser handle "open in new tab/window" and non-primary clicks.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // Once lemon.js is ready, its own listeners open the overlay.
    if (ready()) return;

    e.preventDefault();
    var href = a.href;
    var done = false;
    var fallback = setTimeout(function () {
      if (!done) { done = true; window.location.href = href; }
    }, 4000);

    loadLemon(function (ok) {
      if (done) return;
      done = true;
      clearTimeout(fallback);
      if (ok) {
        try { window.LemonSqueezy.Url.Open(href); return; } catch (err) { /* fall through */ }
      }
      window.location.href = href;
    });
  }, true);
})();
