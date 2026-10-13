// Load Lemon Squeezy's checkout overlay only when the visitor shows purchase intent
// (hovering, focusing or touching a buy button), so no third-party request is made
// on page load. Without it, buy links still work: they open the checkout page.
(function () {
  var loaded = false;
  function loadLemon() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.src = 'https://app.lemonsqueezy.com/js/lemon.js';
    s.defer = true;
    s.onload = function () {
      if (typeof window.createLemonSqueezy === 'function') window.createLemonSqueezy();
    };
    document.head.appendChild(s);
  }
  ['pointerover', 'focusin', 'touchstart'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      if (e.target && e.target.closest && e.target.closest('.lemonsqueezy-button')) loadLemon();
    }, { capture: true, passive: true });
  });
})();
